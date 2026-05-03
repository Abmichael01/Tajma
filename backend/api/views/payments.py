import hmac
import hashlib
import json
from datetime import timedelta
from django.utils import timezone
from django.conf import settings
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from api.models import Ad, Transaction, Promotion, PromotionPackage
from api.serializers.payment import (
    TransactionSerializer,
    PromotionSerializer,
    PaymentInitiateSerializer,
    PromotionPackageSerializer
)
from api.services.paystack import PaystackService

class PromotionPackageViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Viewset to list available promotion packages.
    """
    queryset = PromotionPackage.objects.filter(is_active=True)
    serializer_class = PromotionPackageSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    @action(detail=False, methods=['post'], url_path='initiate-promotion')
    def initiate_promotion(self, request):
        """
        Initializes a Paystack transaction for an ad promotion.
        """
        serializer = PaymentInitiateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        ad_id = serializer.validated_data['ad_id']
        promotion_type = serializer.validated_data['promotion_type']
        days = serializer.validated_data['days']
        
        try:
            ad = Ad.objects.get(id=ad_id, seller=request.user)
        except Ad.DoesNotExist:
            return Response({'error': 'Ad not found or not owned by you'}, status=status.HTTP_404_NOT_FOUND)

        if not settings.PAYSTACK_SECRET_KEY:
            return Response(
                {'error': 'Payment provider is not configured. Please contact support.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        if not request.user.email:
            return Response(
                {'error': 'Your account needs an email address before payment can start.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            package = PromotionPackage.objects.get(
                promotion_type=promotion_type,
                duration_days=days,
                is_active=True
            )
            amount = package.current_price
            package_id = str(package.id)
        except PromotionPackage.DoesNotExist:
            return Response(
                {'error': 'Promotion package is unavailable. Please choose an active package.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create a local transaction record
        reference = f"tajma_promo_{ad.id.hex[:8]}_{timezone.now().strftime('%Y%m%d%H%M%S')}"
        metadata = {
            'ad_id': str(ad.id),
            'promotion_type': promotion_type,
            'days': days,
            'package_id': package_id
        }

        transaction = Transaction.objects.create(
            user=request.user,
            reference=reference,
            amount=amount,
            status='pending',
            metadata=metadata
        )
        
        # Initialize with Paystack
        paystack = PaystackService()
        init_data = paystack.initialize_transaction(
            email=request.user.email,
            amount=amount,
            reference=reference,
            metadata=transaction.metadata
        )
        
        if not init_data:
            transaction.status = 'failed'
            transaction.save()
            return Response({'error': 'Failed to initialize payment with Paystack'}, status=status.HTTP_502_BAD_GATEWAY)
            
        return Response({
            'checkout_url': init_data.get('authorization_url'),
            'reference': reference,
            'transaction_id': transaction.id
        })

    @action(detail=False, methods=['post'], url_path='webhook', permission_classes=[permissions.AllowAny])
    def webhook(self, request):
        """
        Paystack weightless webhook to confirm payment.
        """
        # Verify Paystack signature
        paystack_signature = request.META.get('HTTP_X_PAYSTACK_SIGNATURE')
        if not paystack_signature:
            return Response({'error': 'No signature provided'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Validate signature
        secret = settings.PAYSTACK_SECRET_KEY.encode('utf-8')
        computed_signature = hmac.new(secret, request.body, hashlib.sha512).hexdigest()
        
        if not hmac.compare_digest(computed_signature, paystack_signature):
            return Response({'error': 'Invalid signature'}, status=status.HTTP_401_UNAUTHORIZED)
            
        # Process the event
        event_data = json.loads(request.body)
        event = event_data.get('event')
        
        if event == 'charge.success':
            data = event_data.get('data')
            reference = data.get('reference')
            
            try:
                transaction = Transaction.objects.get(reference=reference)
                if transaction.status != 'success':
                    transaction.status = 'success'
                    transaction.save()
                    
                    # Create the promotion
                    self._activate_promotion(transaction)
                    
            except Transaction.DoesNotExist:
                # Log this error - unknown transaction
                pass
                
        return Response({'status': 'ok'})

    def _activate_promotion(self, transaction):
        """Helper to create promotion after successful payment"""
        ad_id = transaction.metadata.get('ad_id')
        promo_type = transaction.metadata.get('promotion_type')
        days = transaction.metadata.get('days', 7)
        package_id = transaction.metadata.get('package_id')
        
        try:
            ad = Ad.objects.get(id=ad_id)
            package = None
            if package_id:
                package = PromotionPackage.objects.filter(id=package_id).first()
            Promotion.objects.create(
                ad=ad,
                promotion_type=promo_type,
                transaction=transaction,
                package=package,
                start_at=timezone.now(),
                end_at=timezone.now() + timedelta(days=days),
                is_active=True
            )
            # You might want to update some field on the Ad model itself
            # ad.is_featured = True if promo_type == 'featured' else False
            # ad.save()
        except Ad.DoesNotExist:
            pass
