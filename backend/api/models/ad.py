import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.text import slugify
from django.utils import translation

from api.models.category import Category


class Ad(models.Model):
    """Marketplace advertisement posted by a seller. (The Bones)"""

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ads',
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name='ads',
    )
    ad_type = models.CharField(max_length=20, choices=Category.CATEGORY_TYPES)
    
    price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=8, default='XOF')
    is_negotiable = models.BooleanField(default=False)
    attributes = models.JSONField(
        default=dict, 
        blank=True,
        help_text='Dynamic attributes matching the Category custom_fields schema. Store keys only.'
    )
    images = models.JSONField(default=list, blank=True)
    
    # Location tracking
    location_name = models.CharField(max_length=255, blank=True, null=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    # Premium/Promotion Denormalization
    is_featured = models.BooleanField(default=False, db_index=True)
    promotion_rank = models.PositiveIntegerField(default=0, db_index=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='published')
    views = models.PositiveIntegerField(default=0)
    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-promotion_rank', '-published_at', '-created_at']
        indexes = [
            models.Index(fields=['latitude', 'longitude']),
            models.Index(fields=['status', '-promotion_rank', '-published_at']),
        ]

    @property
    def title(self):
        """Auto-detect language and return translated title."""
        lang = translation.get_language() or 'en'
        trans = self.translations.filter(language=lang).first() or \
                self.translations.filter(language='en').first() or \
                self.translations.first()
        return trans.title if trans else f"Ad {self.id}"

    @property
    def description(self):
        """Auto-detect language and return translated description."""
        lang = translation.get_language() or 'en'
        trans = self.translations.filter(language=lang).first() or \
                self.translations.filter(language='en').first() or \
                self.translations.first()
        return trans.description if trans else ""

    @property
    def slug(self):
        """Auto-detect language and return translated slug."""
        lang = translation.get_language() or 'en'
        trans = self.translations.filter(language=lang).first() or \
                self.translations.filter(language='en').first() or \
                self.translations.first()
        return trans.slug if trans else str(self.id)

    def __str__(self):
        return f'Ad {self.id} ({self.seller.email})'

    def save(self, *args, **kwargs):
        if self.status == 'published' and not self.published_at:
            self.published_at = timezone.now()

        self.ad_type = self.category.category_type
        super().save(*args, **kwargs)


class AdTranslation(models.Model):
    """Translated content for an Ad. (The Skin)"""
    
    ad = models.ForeignKey(
        Ad,
        on_delete=models.CASCADE,
        related_name='translations',
    )
    language = models.CharField(
        max_length=5,
        choices=[('en', 'English'), ('fr', 'French'), ('ha', 'Hausa')],
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    
    is_original = models.BooleanField(default=False, help_text="True if this is the language the seller used.")
    is_auto_translated = models.BooleanField(default=False)

    class Meta:
        unique_together = ('ad', 'language')
        verbose_name = 'Ad Translation'
        verbose_name_plural = 'Ad Translations'

    def __str__(self):
        return f"{self.title} ({self.language})"

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title) or str(uuid.uuid4())
            slug = base_slug
            counter = 1
            while AdTranslation.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                counter += 1
                slug = f'{base_slug}-{counter}'
            self.slug = slug
        super().save(*args, **kwargs)


class AdView(models.Model):
    ad = models.ForeignKey(
        Ad,
        on_delete=models.CASCADE,
        related_name='ad_views',
    )
    ip_address = models.GenericIPAddressField()
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ad_views',
        help_text='User who viewed the ad (if authenticated)',
    )
    viewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-viewed_at']
        indexes = [
            models.Index(fields=['ad', 'ip_address']),
            models.Index(fields=['ad', 'user']),
            models.Index(fields=['ad', 'ip_address', 'user']),
        ]

    def __str__(self):
        user_str = f" by {self.user.email}" if self.user else ""
        return f"View of Ad {self.ad.id} from {self.ip_address}{user_str}"
