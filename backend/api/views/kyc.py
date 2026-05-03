from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from api.models import KYCVerification, User
from api.serializers.kyc import KYCVerificationSerializer, KYCInitiateSerializer
from api.utils.smile_id import SmileIDClient
import uuid
import logging

logger = logging.getLogger(__name__)

import hmac
import hashlib
import json

class SmileIDSignaturePermission(permissions.BasePermission):
    """
    Permission to verify that the request came from Smile ID.
    Uses HMAC-SHA256 signature verification.
    """
    def has_permission(self, request, view):
        from django.conf import settings
        
        signature = request.headers.get('Smile-ID-Signature')
        if not signature:
            return False
            
        # Smile ID recommends verifying against the raw body
        # Since this is a webhook, we use request.body
        secret_key = getattr(settings, 'SMILE_ID_API_KEY', '')
        if not secret_key:
            return False
            
        computed_signature = hmac.new(
            secret_key.encode('utf-8'),
            request.body,
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(computed_signature, signature)

class KYCViewSet(viewsets.ModelViewSet):
    queryset = KYCVerification.objects.all()
    serializer_class = KYCVerificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    @action(detail=False, methods=['post'], url_path='initiate')
    def initiate(self, request):
        """
        Initiates a KYC verification job and returns a Smile ID token.
        """
        user = request.user
        serializer = KYCInitiateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        country = serializer.validated_data.get('country', 'NE')
        id_type = serializer.validated_data.get('id_type', 'NATIONAL_ID')

        # Check if already verified
        if user.kyc_status == 'verified':
            return Response({'error': 'User is already verified'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create a new local record
        job_id = f"job_{uuid.uuid4().hex[:12]}"
        smile_user_id = f"user_{user.id}_{uuid.uuid4().hex[:6]}"
        
        client = SmileIDClient()
        token_data = client.get_web_token(
            smile_user_id, 
            job_id, 
            country=country,
            id_type=id_type
        )
        
        if not token_data:
            return Response({'error': 'Failed to communicate with Smile ID'}, status=status.HTTP_502_BAD_GATEWAY)
        
        # Save verification record
        KYCVerification.objects.create(
            user=user,
            job_id=job_id,
            smile_user_id=smile_user_id,
            document_type=id_type,
            country=country,
            status='pending'
        )
        
        # Update user status to pending if it was none
        if user.kyc_status == 'none':
            user.kyc_status = 'pending'
            user.save()
            
        return Response({
            'token': token_data.get('token'),
            'job_id': job_id,
            'user_id': smile_user_id,
            'partner_id': client.partner_id,
            'is_sandbox': client.is_sandbox
        })

    @action(detail=False, methods=['post'], url_path='webhook', permission_classes=[SmileIDSignaturePermission])
    def webhook(self, request):
        """
        Smile ID results callback.
        """
        data = request.data
        job_id = data.get('job_id')
        result_code = data.get('result_code')
        result_text = data.get('result_text')
        
        if not job_id:
            return Response({'error': 'No job_id provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            verification = KYCVerification.objects.get(job_id=job_id)
            verification.raw_callback_data = data
            
            # Result code 0812 is Success for Document Verification in some contexts, 
            # but usually it's based on ResultText or specific Smile ID codes.
            # smileidentity.com/docs/result-codes
            
            if result_code in ['0812', '1012', '1013']: # Document Verified
                verification.status = 'completed'
                verification.result = 'verified'
                
                # Update User
                user = verification.user
                user.kyc_status = 'verified'
                user.is_verified = True
                user.save()
            else:
                verification.status = 'failed'
                verification.result = 'rejected'
                
                # Update User
                user = verification.user
                user.kyc_status = 'rejected'
                user.kyc_notes = result_text or "Verification failed"
                user.save()
                
            verification.save()
            return Response({'status': 'ok'})
            
        except KYCVerification.DoesNotExist:
            logger.error(f"KYC Webhook received for unknown job_id: {job_id}")
            return Response({'error': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)
