from celery import shared_task
from django.db.models import Count, Exists, OuterRef
from api.models.ad import Ad, AdTranslation
from api.models.category import Category, CategoryTranslation
from api.services.translation_service import TranslationService
import logging

logger = logging.getLogger(__name__)

# Single source of truth for which languages the app supports. Used by
# per-item translation tasks AND the periodic cleanup sweep.
SUPPORTED_LANGUAGES = ['en', 'fr', 'ha']

@shared_task
def translate_ad_task(ad_id):
    """
    Translates an ad into all supported languages.
    """
    try:
        ad = Ad.objects.get(id=ad_id)
        original_translation = ad.translations.filter(is_original=True).first()
        
        if not original_translation:
            logger.error(f"No original translation found for ad {ad_id}")
            return

        service = TranslationService()
        target_languages = ['en', 'fr', 'ha']
        
        for lang in target_languages:
            if lang == original_translation.language:
                continue
                
            # Check if translation already exists
            if ad.translations.filter(language=lang).exists():
                continue
            
            translated_title = service.translate_text(original_translation.title, lang)
            translated_desc = service.translate_text(original_translation.description, lang)
            
            AdTranslation.objects.create(
                ad=ad,
                language=lang,
                title=translated_title,
                description=translated_desc,
                is_original=False,
                is_auto_translated=True
            )
            logger.info(f"Translated ad {ad_id} to {lang}")

    except Ad.DoesNotExist:
        logger.error(f"Ad {ad_id} not found for translation")
    except Exception as e:
        logger.error(f"Error in translate_ad_task: {str(e)}")

@shared_task
def translate_category_task(category_id):
    """
    Translates a category into all supported languages.
    """
    try:
        category = Category.objects.get(id=category_id)
        # Assume the first translation created is the original/source
        original_translation = category.translations.first()
        
        if not original_translation:
            logger.error(f"No translation found for category {category_id}")
            return

        service = TranslationService()
        target_languages = ['en', 'fr', 'ha']
        
        for lang in target_languages:
            if lang == original_translation.language:
                continue
                
            # Check if translation already exists
            if category.translations.filter(language=lang).exists():
                continue
            
            translated_name = service.translate_text(original_translation.name, lang)
            translated_desc = service.translate_text(original_translation.description, lang)
            translated_fields = service.translate_custom_fields(category.custom_fields, lang)
            
            CategoryTranslation.objects.create(
                category=category,
                language=lang,
                name=translated_name,
                description=translated_desc,
                custom_fields_translations=translated_fields
            )
            logger.info(f"Translated category {category_id} to {lang}")

    except Category.DoesNotExist:
        logger.error(f"Category {category_id} not found for translation")
    except Exception as e:
        logger.error(f"Error in translate_category_task: {str(e)}")


@shared_task
def cleanup_missing_translations():
    """
    Periodic safety net: scans all Ads and Categories for missing translations
    and re-queues them. Catches anything the on-demand translation flow missed
    (API hiccups, network blips, mid-deploy interruptions, manual DB edits).

    Strategy:
      1. Find Ads with fewer than len(SUPPORTED_LANGUAGES) translations.
      2. Skip Ads that have no original/seed translation (nothing to translate from).
      3. Enqueue translate_ad_task for each — workers pick up in parallel.
      4. Same flow for Categories (any translation row counts as the seed).

    Scheduled via CELERY_BEAT_SCHEDULE in settings/third_party.py.
    """
    expected_count = len(SUPPORTED_LANGUAGES)

    # Ads: must have an is_original=True row to seed translation from.
    # Use Exists() subquery so the count below isn't narrowed by the JOIN.
    has_original_translation = AdTranslation.objects.filter(
        ad=OuterRef('pk'),
        is_original=True,
    )
    incomplete_ad_ids = list(
        Ad.objects
        .annotate(n_translations=Count('translations'))
        .filter(n_translations__lt=expected_count)
        .annotate(has_original=Exists(has_original_translation))
        .filter(has_original=True)
        .values_list('id', flat=True)
    )

    for ad_id in incomplete_ad_ids:
        translate_ad_task.delay(ad_id)

    # Categories: any existing translation row is treated as the seed
    # (matches translate_category_task's own logic).
    incomplete_category_ids = list(
        Category.objects
        .annotate(n_translations=Count('translations'))
        .filter(n_translations__gte=1)
        .filter(n_translations__lt=expected_count)
        .values_list('id', flat=True)
        .distinct()
    )

    for category_id in incomplete_category_ids:
        translate_category_task.delay(category_id)

    logger.info(
        "[cleanup_missing_translations] Re-queued %d ads and %d categories",
        len(incomplete_ad_ids),
        len(incomplete_category_ids),
    )

    return {
        "ads_requeued": len(incomplete_ad_ids),
        "categories_requeued": len(incomplete_category_ids),
    }
