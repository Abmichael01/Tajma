from django.db import models
from django.conf import settings
import uuid

class KYCVerification(models.Model):
    """
    Tracks KYC verification attempts via Smile ID.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    RESULT_CHOICES = [
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
        ('unclear', 'Unclear'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='kyc_verifications'
    )
    job_id = models.CharField(max_length=100, unique=True, db_index=True)
    smile_user_id = models.CharField(max_length=100, db_index=True) # Smile ID user_id
    
    document_type = models.CharField(max_length=50, blank=True, null=True)
    country = models.CharField(max_length=10, default='NE') # Niger
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    result = models.CharField(max_length=20, choices=RESULT_CHOICES, blank=True, null=True)
    
    # Store raw callback data
    raw_callback_data = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'kyc_verifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"KYC for {self.user.email} - {self.status}"
