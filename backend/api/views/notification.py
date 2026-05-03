import logging
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q

from api.models import Ad, Notification
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
    
    csrf_exempt = True
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def list(self, request, *args, **kwargs):
        """List notifications with logging"""
        response = super().list(request, *args, **kwargs)
        return response
    
    def get_queryset(self):
        """Return notifications for the current user"""
        queryset = Notification.objects.filter(recipient=self.request.user)
        
        # Filter by read status if provided
        is_read = self.request.query_params.get('is_read')
        if is_read is not None:
            queryset = queryset.filter(is_read=is_read.lower() == 'true')
        
        return queryset.order_by('-created_at')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return NotificationCreateSerializer
        return NotificationSerializer
    
    def perform_create(self, serializer):
        """Create notifications without trusting caller-supplied identity text."""
        notification_type = serializer.validated_data.get('type')
        recipient = serializer.validated_data.get('recipient')
        related_ad = serializer.validated_data.get('related_ad')
        related_user = self.request.user

        if not self.request.user.is_staff:
            if notification_type not in {'phone_view', 'ad_view'}:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied('You cannot create this notification type.')

            if recipient == self.request.user:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({'recipient': 'Cannot notify yourself.'})

            if related_ad and related_ad.seller_id != recipient.id:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({'recipient': 'Recipient must own the related ad.'})

            viewer_name = (
                self.request.user.get_full_name()
                or self.request.user.username
                or 'Someone'
            )
            if notification_type == 'phone_view':
                title = 'Phone Number Viewed'
                if related_ad:
                    message = f'{viewer_name} viewed your phone number for "{related_ad.title}"'
                else:
                    message = f'{viewer_name} viewed your phone number on your profile'
            else:
                title = 'Profile Viewed'
                message = f'{viewer_name} viewed your profile'
        else:
            title = serializer.validated_data.get('title')
            message = serializer.validated_data.get('message')
            related_user = serializer.validated_data.get('related_user') or related_user

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

        serializer.save(
            title=title,
            message=message,
            related_user=related_user,
        )
    
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

    @action(detail=False, methods=['delete', 'post'])
    def clear_all(self, request):
        """Delete all notifications for current user"""
        count = Notification.objects.filter(recipient=request.user).delete()[0]
        
        return Response({
            'message': f'{count} notifications deleted',
            'count': count
        }, status=status.HTTP_200_OK)
