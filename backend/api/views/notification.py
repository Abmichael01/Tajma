import logging
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q

from api.models import Notification
from api.serializers import NotificationSerializer, NotificationCreateSerializer

logger = logging.getLogger(__name__)


class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing notifications.
    - List: Get user's notifications (filterable by is_read)
    - Create: Create a new notification (admin only)
    - Retrieve: Get a single notification
    - Update: Update notification (mark as read)
    - Destroy: Delete notification
    """
    
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def list(self, request, *args, **kwargs):
        """List notifications with logging"""
        logger.info(f"📋 list() called for user: {request.user.id} ({request.user.email})")
        logger.info(f"📋 Query params: {request.query_params}")
        
        response = super().list(request, *args, **kwargs)
        
        # Handle paginated response (DRF format)
        if isinstance(response.data, dict) and 'results' in response.data:
            # Paginated response
            results = response.data['results']
            logger.info(f"✅ list() response (paginated): {len(results)} notifications returned (total: {response.data.get('count', 'unknown')})")
            if results:
                logger.info(f"📋 First notification: {results[0]}")
        elif isinstance(response.data, list):
            # Direct array response
            logger.info(f"✅ list() response (array): {len(response.data)} notifications returned")
            if response.data:
                logger.info(f"📋 First notification: {response.data[0]}")
        else:
            logger.warning(f"⚠️ Unexpected response format: {type(response.data)}")
        
        return response
    
    def get_queryset(self):
        """Return notifications for the current user"""
        logger.info(f"📋 get_queryset called for user: {self.request.user.id} ({self.request.user.email})")
        
        queryset = Notification.objects.filter(recipient=self.request.user)
        total_count = queryset.count()
        logger.info(f"📊 Total notifications for user {self.request.user.id}: {total_count}")
        
        # Filter by read status if provided
        is_read = self.request.query_params.get('is_read')
        if is_read is not None:
            queryset = queryset.filter(is_read=is_read.lower() == 'true')
            filtered_count = queryset.count()
            logger.info(f"📊 Filtered by is_read={is_read}: {filtered_count} notifications")
        
        result = queryset.order_by('-created_at')
        logger.info(f"✅ Returning {result.count()} notifications")
        return result
    
    def get_serializer_class(self):
        if self.action == 'create':
            return NotificationCreateSerializer
        return NotificationSerializer
    
    def perform_create(self, serializer):
        """Create notification - allow creating for other users (e.g., phone_view notifications)"""
        notification_type = serializer.validated_data.get('type')
        recipient = serializer.validated_data.get('recipient')
        related_user = serializer.validated_data.get('related_user')
        related_ad = serializer.validated_data.get('related_ad')
        
        # Check if notification should be sent (deduplication for phone_view and ad_view)
        if not Notification.should_send_notification(
            recipient=recipient,
            notification_type=notification_type,
            related_user=related_user,
            related_ad=related_ad
        ):
            logger.info(f"⏭️ Skipping notification: Already sent today (type={notification_type}, recipient={recipient.id}, related_user={related_user.id if related_user else None})")
            # Return a response indicating the notification was skipped
            from rest_framework.exceptions import ValidationError
            raise ValidationError({
                'detail': 'Notification already sent today for this user and ad.'
            })
        
        logger.info(f"🔔 Creating notification: recipient={recipient.id}, type={notification_type}")
        notification = serializer.save()
        logger.info(f"✅ Notification created successfully: ID={notification.id}, Recipient={notification.recipient.id}, Type={notification.type}")
    
    @action(detail=True, methods=['post', 'patch'])
    def read(self, request, pk=None):
        """Mark notification as read"""
        notification = self.get_object()
        notification.mark_as_read()
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read for current user"""
        count = Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).update(is_read=True)
        
        return Response({
            'message': f'{count} notifications marked as read',
            'count': count
        })
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications"""
        count = Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).count()
        
        return Response({'count': count})

