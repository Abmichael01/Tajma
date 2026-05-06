from django.db import models
from django.utils.text import slugify

class Country(models.Model):
    """
    Model representing a country (e.g., Niger, Mali, Burkina Faso).
    """
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=2, unique=True, help_text="ISO 3166-1 alpha-2 code (e.g., NE, ML, BF)")
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    flag_emoji = models.CharField(max_length=10, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Country'
        verbose_name_plural = 'Countries'
        ordering = ['sort_order', 'name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
