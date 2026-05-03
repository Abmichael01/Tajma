import uuid
from django.db import models
from django.utils import timezone
from api.models.ad import Ad
from api.models.transaction import Transaction
from api.models.promotion_package import PromotionPackage

class Promotion(models.Model):
    """Handles ad promotions (boosting/featured status)"""
    
    PROMOTION_TYPE_CHOICES = [
        ('boost', 'Boost'),
        ('featured', 'Featured'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ad = models.ForeignKey(
        Ad,
        on_delete=models.CASCADE,
        related_name='promotions'
    )
    promotion_type = models.CharField(max_length=20, choices=PROMOTION_TYPE_CHOICES)
    transaction = models.OneToOneField(
        Transaction,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='promotion'
    )
    package = models.ForeignKey(
        PromotionPackage,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='promoted_ads'
    )
    
    start_at = models.DateTimeField(default=timezone.now)
    end_at = models.DateTimeField()
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.promotion_type.title()} for {self.ad.title}"

    def save(self, *args, **kwargs):
        # Auto-deactivate if expired
        now = timezone.now()
        if self.end_at and self.end_at < now:
            self.is_active = False
            
        super().save(*args, **kwargs)
        
        # Update associated Ad denormalized fields if active
        if self.is_active and self.start_at <= now:
            ad = self.ad
            if self.promotion_type == 'featured':
                ad.is_featured = True
                ad.promotion_rank = max(ad.promotion_rank, 100)
            elif self.promotion_type == 'boost':
                ad.promotion_rank = max(ad.promotion_rank, 50)
            ad.save(update_fields=['is_featured', 'promotion_rank'])
