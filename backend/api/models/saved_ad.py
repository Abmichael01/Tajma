from django.conf import settings
from django.db import models
from django.utils import timezone

from api.models.ad import Ad


class SavedAd(models.Model):
    """Many-to-many relationship between User and Ad for saved/favorited ads."""
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='saved_ads',
    )
    ad = models.ForeignKey(
        Ad,
        on_delete=models.CASCADE,
        related_name='saved_by_users',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'saved_ads'
        unique_together = ['user', 'ad']  # Prevent duplicate saves
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['ad']),
        ]
    
    def __str__(self):
        return f'{self.user.email} saved {self.ad.title}'


