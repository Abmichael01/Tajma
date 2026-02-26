from django.db import models
from django.conf import settings
from api.models.ad import Ad

class Lead(models.Model):
    """
    Potential clients for a seller. 
    Recorded when a user views a seller's phone, profile, or saves an ad.
    """
    SOURCE_CHOICES = [
        ('phone_view', 'Phone View'),
        ('profile_view', 'Profile View'),
        ('save_ad', 'Saved Ad'),
    ]

    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='leads_received'
    )
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='leads_sent'
    )
    ad = models.ForeignKey(
        Ad,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='leads'
    )
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES)
    messaged = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'leads'
        ordering = ['-created_at']
        # We allow multiple leads from same client, but maybe one per source/ad combo
        unique_together = ['seller', 'client', 'source', 'ad'] 
        indexes = [
            models.Index(fields=['seller', '-created_at']),
            models.Index(fields=['client']),
            models.Index(fields=['messaged']),
        ]

    def __str__(self):
        return f"{self.client.email} lead for {self.seller.email} via {self.source}"
