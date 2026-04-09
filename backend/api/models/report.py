from django.db import models
from django.conf import settings
import uuid

class Report(models.Model):
    """
    Model for users to report ads, other users, or contact support.
    """
    REPORT_TYPES = [
        ('ad', 'Ad Report'),
        ('user', 'User Report'),
        ('support', 'Support Request'),
        ('feedback', 'General Feedback'),
    ]

    REASON_CHOICES = [
        ('scam', 'Scam / Fraud'),
        ('spam', 'Spam / Harassment'),
        ('counterfeit', 'Counterfeit Item'),
        ('prohibited', 'Prohibited Item'),
        ('offensive', 'Offensive Content'),
        ('wrong_category', 'Wrong Category'),
        ('duplicate', 'Duplicate Ad'),
        ('other', 'Other'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('under_review', 'Under Review'),
        ('resolved', 'Resolved'),
        ('dismissed', 'Dismissed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reports_filed'
    )
    
    # What is being reported
    report_type = models.CharField(max_length=20, choices=REPORT_TYPES, default='ad')
    related_ad = models.ForeignKey(
        'api.Ad',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='reports'
    )
    reported_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='reports_received'
    )
    
    reason = models.CharField(max_length=30, choices=REASON_CHOICES, default='other')
    description = models.TextField()
    
    # Contact info for guest/support reports if reporter is null
    contact_email = models.EmailField(blank=True, null=True)
    
    # Internal management
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    resolution_note = models.TextField(blank=True, null=True)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reports_resolved'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'reports'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['report_type']),
            models.Index(fields=['reason']),
        ]

    def save(self, *args, **kwargs):
        if not self._state.adding:
            old_instance = Report.objects.get(pk=self.pk)
            self._status_changed = old_instance.status != self.status
        else:
            self._status_changed = False
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Report {self.id} - {self.report_type} ({self.status})"

class SupportMessage(models.Model):
    """
    Model for messages within a support/report ticket thread.
    Allows back-and-forth between admins and the reporter.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report = models.ForeignKey(
        'api.Report',
        on_delete=models.CASCADE,
        related_name='messages'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='support_messages'
    )
    message = models.TextField()
    is_admin_reply = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'support_messages'
        ordering = ['created_at']

    def __str__(self):
        return f"Message on {self.report_id} at {self.created_at}"
