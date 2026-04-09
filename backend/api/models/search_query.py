from django.db import models
from django.conf import settings
from django.utils import timezone

class SearchQuery(models.Model):
    """Tracks search queries performed by users for personalization."""
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='search_queries'
    )
    query = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'search_queries'
        verbose_name_plural = 'Search queries'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['query']),
        ]

    def __str__(self):
        user_str = self.user.email if self.user else "Anonymous"
        return f"'{self.query}' by {user_str} at {self.created_at}"
