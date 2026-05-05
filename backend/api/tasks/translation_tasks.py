from celery import shared_task
from api.models.ad import Ad, AdTranslation
from api.services.translation_service import TranslationService
import logging

logger = logging.getLogger(__name__)

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
