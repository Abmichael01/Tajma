from celery import shared_task
from django.db.models import Count
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

    Source preference: is_original=True first. If absent (legacy ads created
    before the original flag was enforced), fall back to whichever translation
    exists. Without this fallback, the periodic cleanup silently skips legacy
    ads forever.
    """
    try:
        ad = Ad.objects.get(id=ad_id)
        original_translation = ad.translations.filter(is_original=True).first()
        if not original_translation:
            original_translation = ad.translations.first()
            if not original_translation:
                logger.error(f"Ad {ad_id} has no translation at all — nothing to seed from")
                return
            logger.info(
                f"Ad {ad_id} has no is_original=True translation; "
                f"using '{original_translation.language}' as fallback source"
            )

        service = TranslationService()
        target_languages = SUPPORTED_LANGUAGES
        
        source_lang = original_translation.language

        for lang in target_languages:
            if lang == source_lang:
                continue

            # Check if translation already exists
            if ad.translations.filter(language=lang).exists():
                continue

            translated_title = service.translate_text(
                original_translation.title, lang, source_language=source_lang,
            )
            translated_desc = service.translate_text(
                original_translation.description, lang, source_language=source_lang,
            )

            AdTranslation.objects.create(
                ad=ad,
                language=lang,
                title=translated_title,
                description=translated_desc,
                is_original=False,
                is_auto_translated=True
            )
            logger.info(f"Translated ad {ad_id} from {source_lang} to {lang}")

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
        # Categories don't track is_original — first translation is the seed.
        original_translation = category.translations.first()

        if not original_translation:
            logger.error(f"No translation found for category {category_id}")
            return

        service = TranslationService()
        target_languages = SUPPORTED_LANGUAGES
        source_lang = original_translation.language

        for lang in target_languages:
            if lang == source_lang:
                continue

            # Check if translation already exists
            if category.translations.filter(language=lang).exists():
                continue

            translated_name = service.translate_text(
                original_translation.name, lang, source_language=source_lang,
            )
            translated_desc = service.translate_text(
                original_translation.description, lang, source_language=source_lang,
            )
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
      1. Purge auto-translated rows that match their source verbatim — these
         came from gpt-4o-mini's "return as-is" failure mode. translate_ad_task
         would otherwise skip them as "already translated."
      2. Find Ads with fewer than len(SUPPORTED_LANGUAGES) translations.
      3. Enqueue translate_ad_task for each — workers pick up in parallel.
      4. Same flow for Categories (any translation row counts as the seed).

    Scheduled via CELERY_BEAT_SCHEDULE in settings/third_party.py.
    """
    expected_count = len(SUPPORTED_LANGUAGES)

    # ── Step 1: Purge suspect translations (output == source verbatim) ────────
    # Build a map of each ad's seed translation (prefers is_original=True,
    # falls back to first existing) so we can compare.
    seed_by_ad = {}
    for t in AdTranslation.objects.filter(is_original=True).values(
        'ad_id', 'language', 'title', 'description'
    ):
        seed_by_ad[t['ad_id']] = t
    fallback_seen = set(seed_by_ad.keys())
    for t in (
        AdTranslation.objects
        .exclude(ad_id__in=fallback_seen)
        .order_by('ad_id', 'id')
        .values('ad_id', 'language', 'title', 'description')
    ):
        if t['ad_id'] in fallback_seen:
            continue
        seed_by_ad[t['ad_id']] = t
        fallback_seen.add(t['ad_id'])

    purged_count = 0
    suspect = AdTranslation.objects.filter(
        is_auto_translated=True, is_original=False,
    ).values('id', 'ad_id', 'language', 'title', 'description')
    ids_to_delete = []
    for t in suspect:
        seed = seed_by_ad.get(t['ad_id'])
        if not seed or seed['language'] == t['language']:
            continue
        if t['title'] == seed['title'] and t['description'] == seed['description']:
            ids_to_delete.append(t['id'])
    if ids_to_delete:
        purged_count, _ = AdTranslation.objects.filter(id__in=ids_to_delete).delete()
        logger.info(f"[cleanup] Purged {purged_count} suspect auto-translations")

    # ── Step 2: Find ads with missing translations (after purge) ──────────────
    incomplete_ad_ids = list(
        Ad.objects
        .annotate(n_translations=Count('translations'))
        .filter(n_translations__gte=1, n_translations__lt=expected_count)
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
        "[cleanup_missing_translations] Purged %d suspect rows, re-queued %d ads and %d categories",
        purged_count,
        len(incomplete_ad_ids),
        len(incomplete_category_ids),
    )

    return {
        "suspect_ad_translations_purged": purged_count,
        "ads_requeued": len(incomplete_ad_ids),
        "categories_requeued": len(incomplete_category_ids),
    }
