import os
import django
from django.conf import settings
from concurrent.futures import ThreadPoolExecutor
from api.utils.category_exporter import export_categories_to_json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'serverConfig.settings')
django.setup()

from api.models.ad import Ad, AdTranslation
from api.models.category import Category, CategoryTranslation
from api.services.translation_service import TranslationService
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def translate_category(category, service, target_languages):
    original = category.translations.filter(is_original=True).first()
    if not original:
        original = category.translations.first()
        if original:
            original.is_original = True
            original.save()
    
    if not original:
        return

    # Check which languages are missing
    missing_langs = [l for l in target_languages if not category.translations.filter(language=l).exists()]
    
    if missing_langs:
        logger.info(f"Translating Category {category.slug} to {missing_langs}...")
        results = service.translate_bulk(original.name, missing_langs)
        # Note: In a real scenario, we'd translate description too, but for speed let's just do name or use a combined prompt
        # Let's do a combined prompt for name and description
        desc_results = service.translate_bulk(original.description, missing_langs)
        
        for lang in missing_langs:
            CategoryTranslation.objects.create(
                category=category,
                language=lang,
                name=results.get(lang, original.name),
                description=desc_results.get(lang, original.description),
                is_auto_translated=True
            )

def translate_ad(ad, service, target_languages):
    original = ad.translations.filter(is_original=True).first()
    if not original:
        original = ad.translations.first()
        if original:
            original.is_original = True
            original.save()
    
    if not original:
        return

    missing_langs = [l for l in target_languages if not ad.translations.filter(language=l).exists()]
    
    if missing_langs:
        logger.info(f"Translating Ad {ad.id} to {missing_langs}...")
        title_results = service.translate_bulk(original.title, missing_langs)
        desc_results = service.translate_bulk(original.description, missing_langs)
        
        for lang in missing_langs:
            AdTranslation.objects.create(
                ad=ad,
                language=lang,
                title=title_results.get(lang, original.title),
                description=desc_results.get(lang, original.description),
                is_auto_translated=True
            )

def translate_everything():
    service = TranslationService()
    if not service.client:
        logger.error("OpenAI API Key not found in settings!")
        return

    target_languages = ['fr', 'ha']

    # 1. Translate Categories in parallel
    logger.info("Translating Categories in parallel...")
    categories = list(Category.objects.all())
    with ThreadPoolExecutor(max_workers=10) as executor:
        for category in categories:
            executor.submit(translate_category, category, service, target_languages)

    # Export categories JSON once done
    logger.info("Exporting categories.json...")
    export_categories_to_json()

    # 2. Translate Ads in parallel
    logger.info("Translating Ads in parallel...")
    ads = list(Ad.objects.all())
    with ThreadPoolExecutor(max_workers=10) as executor:
        for ad in ads:
            executor.submit(translate_ad, ad, service, target_languages)

if __name__ == "__main__":
    translate_everything()
    print("Turbo Translation Done!")
