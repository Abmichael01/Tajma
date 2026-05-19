import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone


class Chat(models.Model):
    """
    Chat model representing a conversation between two users.
    Can be optionally linked to an ad.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    participant1 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chats_as_participant1',
    )
    participant2 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chats_as_participant2',
    )
    ad = models.ForeignKey(
        'api.Ad',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='chats',
        help_text='Optional ad this chat is related to',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Track last activity for sorting
    last_message_at = models.DateTimeField(null=True, blank=True)
    is_muted = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-last_message_at', '-updated_at']
        indexes = [
            models.Index(fields=['participant1', '-last_message_at']),
            models.Index(fields=['participant2', '-last_message_at']),
            models.Index(fields=['ad']),
        ]
        # Ensure unique chat between two users for the same ad
        # Note: NULL values are considered distinct, so multiple chats without ad are allowed
        constraints = [
            models.UniqueConstraint(
                fields=['participant1', 'participant2', 'ad'],
                name='unique_chat_per_ad',
                condition=models.Q(ad__isnull=False)
            ),
        ]
    
    def __str__(self):
        ad_title = f" ({self.ad.title})" if self.ad else ""
        return f"Chat: {self.participant1.email} <-> {self.participant2.email}{ad_title}"
    
    def get_other_participant(self, user):
        """Get the other participant in the chat"""
        if user == self.participant1:
            return self.participant2
        return self.participant1
    
    def update_last_message_time(self):
        """Update last_message_at to current time"""
        self.last_message_at = timezone.now()
        self.save(update_fields=['last_message_at', 'updated_at'])


class Message(models.Model):
    """
    Message model representing individual messages within a chat.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    chat = models.ForeignKey(
        Chat,
        on_delete=models.CASCADE,
        related_name='messages',
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_messages',
    )
    MESSAGE_TYPES = [
        ('text', 'Text'),
        ('image', 'Image'),
        ('audio', 'Audio'),
        ('document', 'Document'),
    ]
    message_type = models.CharField(max_length=15, choices=MESSAGE_TYPES, default='text')
    content = models.TextField(null=True, blank=True)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True, help_text='When message was delivered to recipient device')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Stamped when the unread-message digest email includes this message. Used
    # by the periodic Celery sweep to avoid emailing twice about the same
    # unread thread. Null means "never digested yet."
    digest_emailed_at = models.DateTimeField(null=True, blank=True, db_index=True)
    
    # Optional: For future features like file attachments
    attachment = models.FileField(upload_to='chat_attachments/', null=True, blank=True)
    
    # Support for replies (WhatsApp style)
    parent_message = models.ForeignKey(
        'self', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='replies'
    )
    
    # Client-side ID for optimistic UI matching and deduplication
    client_id = models.CharField(max_length=100, null=True, blank=True, db_index=True)
    
    # Link Previews
    link_url = models.URLField(max_length=1000, null=True, blank=True)
    link_title = models.CharField(max_length=500, null=True, blank=True)
    link_description = models.TextField(null=True, blank=True)
    link_image = models.URLField(max_length=1000, null=True, blank=True)
    
    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['chat', '-created_at']),
            models.Index(fields=['sender', '-created_at']),
            models.Index(fields=['is_read']),
        ]
    
    def __str__(self):
        return f"Message from {self.sender.email} in {self.chat}"
    
    def mark_as_read(self):
        """Mark message as read"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])


class UserOnlineStatus(models.Model):
    """
    Track user online status and last seen time.
    """
    
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='online_status',
    )
    is_online = models.BooleanField(default=False)
    last_seen = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'User Online Status'
        verbose_name_plural = 'User Online Statuses'
        indexes = [
            models.Index(fields=['is_online', '-last_seen']),
        ]
    
    def __str__(self):
        status = 'Online' if self.is_online else 'Offline'
        return f"{self.user.email} - {status}"
    
    def set_online(self):
        """Set user as online"""
        self.is_online = True
        self.last_seen = timezone.now()
        self.save(update_fields=['is_online', 'last_seen'])
    
    def set_offline(self):
        """Set user as offline"""
        self.is_online = False
        self.last_seen = timezone.now()
        self.save(update_fields=['is_online', 'last_seen'])

