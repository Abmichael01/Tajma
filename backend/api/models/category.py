from django.db import models
from django.utils.text import slugify
from django.utils import translation


class Category(models.Model):
    """
    Product categories (e.g., Electronics, Vehicles).
    Categories form a tree structure. (The Bones)
    """
    CATEGORY_TYPES = [
        ('product', 'Product'),
        ('service', 'Service'),
        ('job', 'Job'),
        ('property', 'Property'),
        ('vehicle', 'Vehicle'),
    ]

    parent = models.ForeignKey(
        'self', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True, 
        related_name='children'
    )
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    icon = models.CharField(max_length=50, blank=True, null=True, help_text="Lucide icon name")
    image_url = models.CharField(max_length=255, blank=True, null=True)
    
    category_type = models.CharField(max_length=20, choices=CATEGORY_TYPES, default='product')
    custom_fields = models.JSONField(
        default=list, 
        blank=True, 
        help_text="Schema for dynamic attributes: [{'name': 'brand', 'type': 'select', 'options': ['Apple', 'Samsung'], 'required': true}]"
    )
    
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "categories"
        ordering = ['sort_order', 'id']

    @property
    def name(self):
        """Auto-detect language and return translated name."""
        lang = translation.get_language() or 'en'
        trans = self.translations.filter(language=lang).first() or \
                self.translations.filter(language='en').first() or \
                self.translations.first()
        return trans.name if trans else self.slug

    @property
    def description(self):
        """Auto-detect language and return translated description."""
        lang = translation.get_language() or 'en'
        trans = self.translations.filter(language=lang).first() or \
                self.translations.filter(language='en').first() or \
                self.translations.first()
        return trans.description if trans else ""

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            # We use the first available translation name or a generic slug
            name_seed = self.slug or "category"
            self.slug = slugify(name_seed)
        super().save(*args, **kwargs)


class CategoryTranslation(models.Model):
    """Translated content for a Category. (The Skin)"""
    
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name='translations',
    )
    language = models.CharField(
        max_length=5,
        choices=[('en', 'English'), ('fr', 'French'), ('ha', 'Hausa')],
    )
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    
    # Optional: Translate custom field labels and options
    # Store as: {'field_name': {'label': 'Marque', 'options': {'Apple': 'Pomme'}}}
    custom_fields_translations = models.JSONField(default=dict, blank=True)

    class Meta:
        unique_together = ('category', 'language')
        verbose_name = 'Category Translation'
        verbose_name_plural = 'Category Translations'

    def __str__(self):
        return f"{self.name} ({self.language})"
