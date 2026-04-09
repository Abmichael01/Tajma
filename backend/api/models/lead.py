from django.db import models
from django.conf import settings
from django.utils import timezone
from api.models.ad import Ad


class Lead(models.Model):
    """
    Represents a buyer showing interest in a seller's ad (or profile).
    Unique per (seller, client, ad) — one lead per buyer-ad pair.
    Profile-level interactions (no ad) share the ad=null bucket.
    Renewed on every repeated interaction; never duplicated.
    """
    SOURCE_CHOICES = [
        ('phone_view', 'Viewed Number'),
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

    # What originally triggered the lead
    first_source = models.CharField(max_length=20, choices=SOURCE_CHOICES)
    # Most recent action taken
    last_source = models.CharField(max_length=20, choices=SOURCE_CHOICES)
    # All unique actions this buyer has ever taken for this ad — e.g. ["save_ad", "phone_view"]
    sources_used = models.JSONField(default=list)

    interaction_count = models.PositiveIntegerField(default=1)
    messaged = models.BooleanField(default=False)
    ignored = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    last_interacted_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'leads'
        ordering = ['-last_interacted_at']
        # One lead per buyer-seller-ad triplet
        unique_together = [('seller', 'client', 'ad')]
        indexes = [
            models.Index(fields=['seller', '-last_interacted_at']),
            models.Index(fields=['client']),
            models.Index(fields=['messaged']),
            models.Index(fields=['ignored']),
        ]

    def __str__(self):
        ad_title = self.ad.title if self.ad else 'profile'
        return f"{self.client.email} → {self.seller.email} via {self.last_source} on {ad_title}"
