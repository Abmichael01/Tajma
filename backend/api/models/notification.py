import uuid
from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.timezone import now


class Notification(models.Model):
    """Notification model for user notifications"""
    
    NOTIFICATION_TYPES = [
        ('phone_view', 'Phone View'),
        ('message', 'Message'),
        ('ad_view', 'Ad View'),
        ('favorite', 'Favorite'),
        ('review', 'Review'),
        ('report', 'Report'),
        ('ad_status', 'Ad Status Change'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    related_ad = models.ForeignKey(
        'api.Ad',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications',
    )
    related_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='sent_notifications',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', '-created_at']),
            models.Index(fields=['recipient', 'is_read']),
            models.Index(fields=['type']),
        ]
    
    def __str__(self):
        return f'{self.title} - {self.recipient.email}'
    
    def mark_as_read(self):
        """Mark notification as read"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])
    
    @classmethod
    def should_send_notification(cls, recipient, notification_type, related_user=None, related_ad=None):
        """
        Check if a notification should be sent.
        For phone_view and ad_view types, only send once per day per user.
        
        Args:
            recipient: User receiving the notification
            notification_type: Type of notification ('phone_view', 'ad_view', etc.)
            related_user: User who triggered the notification (viewer)
            related_ad: Ad related to the notification (optional)
        
        Returns:
            bool: True if notification should be sent, False otherwise
        """
        # For phone_view and ad_view, check if same user already sent notification today
        if notification_type in ['phone_view', 'ad_view']:
            if not related_user:
                return True  # If no related_user, allow it (shouldn't happen but safety check)
            
            # Check if notification of this type was already sent by this user to this recipient today
            yesterday = now() - timedelta(days=1)
            existing = cls.objects.filter(
                recipient=recipient,
                type=notification_type,
                related_user=related_user,
                created_at__gte=yesterday
            )
            
            # If related_ad is provided, also check for the same ad
            if related_ad:
                existing = existing.filter(related_ad=related_ad)
            
            if existing.exists():
                return False
        
        return True

