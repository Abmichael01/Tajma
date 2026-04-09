import uuid

from django.conf import settings
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


class Review(models.Model):
    """Review/rating for an ad/seller"""
    
    RATING_CHOICES = [
        (1, '1 - Poor'),
        (2, '2 - Fair'),
        (3, '3 - Good'),
        (4, '4 - Very Good'),
        (5, '5 - Excellent'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ad = models.ForeignKey(
        'api.Ad',
        on_delete=models.CASCADE,
        related_name='reviews',
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reviews_given',
    )
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reviews_received',
    )
    rating = models.IntegerField(
        choices=RATING_CHOICES,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField(blank=True)
    helpful_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        unique_together = [['ad', 'reviewer']]  # One review per user per ad
        indexes = [
            models.Index(fields=['ad', '-created_at']),
            models.Index(fields=['seller', '-created_at']),
            models.Index(fields=['rating']),
        ]
    
    def __str__(self):
        return f'{self.reviewer.email} - {self.rating}★ - {self.ad.title[:50]}'
    
    def save(self, *args, **kwargs):
        # Automatically set seller from ad
        if not self.seller_id and self.ad_id:
            self.seller = self.ad.seller
        super().save(*args, **kwargs)

