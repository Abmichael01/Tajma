from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver
from django.db import transaction

from api.models import Ad
from api.utils.category_exporter import export_categories_to_json


@receiver([post_save, post_delete], sender=Ad)
def refresh_categories_json_on_ad_change(sender, instance=None, **kwargs):
    """
    Refresh categories JSON when ads are created, updated, or deleted.
    This ensures ad counts in categories are always up-to-date.
    
    Uses on_commit to ensure the database transaction is complete before
    regenerating the JSON, preventing race conditions.
    """
    def regenerate_json():
        try:
            export_categories_to_json()
        except Exception as e:
            # Log error but don't break ad creation/deletion
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f'Failed to refresh categories JSON after ad change: {e}', exc_info=True)
    
    # Use on_commit to ensure transaction is complete
    transaction.on_commit(regenerate_json)