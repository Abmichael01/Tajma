from django.db import models
from django.utils.text import slugify


class Region(models.Model):
    """
    Generic model representing a subdivision of a country (Region, Department, Cercle, Province, Commune).
    """
    name = models.CharField(max_length=255)
    country = models.ForeignKey(
        'api.Country',
        on_delete=models.CASCADE,
        related_name='subdivisions',
        null=True, # Temporarily null for migration
        blank=True
    )
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='children'
    )
    level = models.PositiveIntegerField(
        default=1,
        help_text="Hierarchy level (1, 2, 3...)"
    )
    subdivision_type = models.CharField(
        max_length=50, 
        blank=True, 
        help_text="Local name for this level (e.g., Cercle, Province, Commune)"
    )
    full_name = models.CharField(
        max_length=500, 
        blank=True, 
        db_index=True,
        help_text="Denormalized full name for search (e.g., Bamako, Mali)"
    )
    p_code = models.CharField(max_length=50, unique=True, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Region'
        verbose_name_plural = 'Regions'
        ordering = ['sort_order', 'name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            while Region.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

