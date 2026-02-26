from django.db import models
from django.utils.text import slugify


class Category(models.Model):
    CATEGORY_TYPES = [
        ('product', 'Product'),
        ('service', 'Service'),
        ('job', 'Job'),
        ('cv', 'CV'),
    ]

    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        related_name='children',
        null=True,
        blank=True,
    )
    description = models.TextField(blank=True)
    icon = models.CharField(
        max_length=150,
        blank=True,
        help_text='Frontend icon identifier (e.g., lucide name or custom key).',
    )
    image_url = models.CharField(max_length=500, blank=True)
    category_type = models.CharField(
        max_length=20,
        choices=CATEGORY_TYPES,
        default='product',
    )
    custom_fields = models.JSONField(default=list, blank=True)
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Category'
        verbose_name_plural = 'Categories'
        ordering = ['parent__id', 'sort_order', 'name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            while Category.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                counter += 1
                slug = f'{base_slug}-{counter}'
            self.slug = slug
        super().save(*args, **kwargs)

