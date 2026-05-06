from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction

from api.models.ad import AdTranslation
from api.models.category import CategoryTranslation
from api.tasks.translation_tasks import translate_ad_task, translate_category_task


@receiver(post_save, sender=AdTranslation)
def trigger_ad_translation(sender, instance, created, **kwargs):
    """
    Trigger background translation when an original translation is created or updated.
    """
    if instance.is_original:
        # Use on_commit to ensure the translation is saved before the task runs
        transaction.on_commit(lambda: translate_ad_task.delay(instance.ad.id))


@receiver(post_save, sender=CategoryTranslation)
def trigger_category_translation(sender, instance, created, **kwargs):
    """
    Trigger background translation when an original category translation is created or updated.
    """
    if instance.is_original:
        # Use on_commit to ensure the translation is saved before the task runs
        transaction.on_commit(lambda: translate_category_task.delay(instance.category.id))
