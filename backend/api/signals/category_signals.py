from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from api.models import Category
from api.utils.category_exporter import export_categories_to_json


@receiver([post_save, post_delete], sender=Category)
def refresh_categories_json(sender, **kwargs):
    export_categories_to_json()

