import uuid
from django.db import models
from django.core.validators import MinValueValidator

class PromotionPackage(models.Model):
    """
    Tiered promotion packages manageable by administrators.
    Allows setting different prices and durations for Boost and Featured statuses.
    """
    
    PROMOTION_TYPE_CHOICES = [
        ('boost', 'Boost'),
        ('featured', 'Featured'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, help_text="e.g. Basic Boost, Weekly Featured")
    description = models.TextField(blank=True, null=True)
    
    promotion_type = models.CharField(
        max_length=20, 
        choices=PROMOTION_TYPE_CHOICES,
        help_text="Featured ads appear at the very top, Boosted ads appear in the middle."
    )
    
    price = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        validators=[MinValueValidator(0)]
    )
    discount_price = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        null=True, 
        blank=True,
        validators=[MinValueValidator(0)],
        help_text="If set, this price will be shown as the current price with a 'Sale' tag."
    )
    
    duration_days = models.PositiveIntegerField(
        help_text="Number of days this promotion will remain active."
    )
    
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this package is available for purchase."
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['price']
        verbose_name = "Promotion Package"
        verbose_name_plural = "Promotion Packages"

    def __str__(self):
        return f"{self.name} ({self.get_promotion_type_display()}) - {self.price} XOF"

    @property
    def current_price(self):
        """Returns the discount price if available, otherwise the regular price."""
        return self.discount_price if self.discount_price else self.price

    @property
    def has_discount(self):
        """Returns True if a discount price is set."""
        return self.discount_price is not None and self.discount_price < self.price
