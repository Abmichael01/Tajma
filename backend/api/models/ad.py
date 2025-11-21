import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.text import slugify

from api.models.category import Category


class Ad(models.Model):
    """Marketplace advertisement posted by a seller."""

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
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    ad_type = models.CharField(max_length=20, choices=Category.CATEGORY_TYPES)
    description = models.TextField()
    price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=8, default='NGN')
    is_negotiable = models.BooleanField(default=False)
    attributes = models.JSONField(default=dict, blank=True)
    images = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='published')
    views = models.PositiveIntegerField(default=0)
    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} ({self.seller.email})'

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title) or str(uuid.uuid4())
            slug = base_slug
            counter = 1
            while Ad.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                counter += 1
                slug = f'{base_slug}-{counter}'
            self.slug = slug

        if self.status == 'published' and not self.published_at:
            self.published_at = timezone.now()

        self.ad_type = self.category.category_type
        super().save(*args, **kwargs)


