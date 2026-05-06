import random
from concurrent.futures import ThreadPoolExecutor
from django.core.management.base import BaseCommand
from api.models.ad import Ad, AdTranslation
from api.models.category import Category, CategoryTranslation
from api.services.translation_service import TranslationService
from api.utils.category_exporter import export_categories_to_json
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Turbo-translate all categories and ads using OpenAI JSON mode and parallel threads.'

    def handle(self, *args, **options):
        service = TranslationService()
        if not service.client:
            self.stdout.write(self.style.ERROR("OpenAI API Key not found!"))
            return

        target_languages = ['fr', 'ha']

        # 1. Categories
        self.stdout.write("Translating Categories (Turbo Parallel)...")
        categories = list(Category.objects.all())
        
        def translate_cat(cat):
            original = cat.translations.filter(is_original=True).first() or cat.translations.first()
            if not original: return
            missing = [l for l in target_languages if not cat.translations.filter(language=l).exists()]
            if missing:
                results = service.translate_bulk(original.name, missing)
                desc_results = service.translate_bulk(original.description, missing)
                for lang in missing:
                    CategoryTranslation.objects.create(
                        category=cat,
                        language=lang,
                        name=results.get(lang, original.name),
                        description=desc_results.get(lang, original.description),
                        is_auto_translated=True
                    )

        with ThreadPoolExecutor(max_workers=10) as executor:
            executor.map(translate_cat, categories)

        export_categories_to_json()
        self.stdout.write(self.style.SUCCESS("Categories synced!"))

        # 2. Ads
        self.stdout.write("Translating Ads (Turbo Parallel)...")
        ads = list(Ad.objects.all())

        def translate_ad_item(ad):
            original = ad.translations.filter(is_original=True).first() or ad.translations.first()
            if not original: return
            missing = [l for l in target_languages if not ad.translations.filter(language=l).exists()]
            if missing:
                title_results = service.translate_bulk(original.title, missing)
                desc_results = service.translate_bulk(original.description, missing)
                for lang in missing:
                    AdTranslation.objects.create(
                        ad=ad,
                        language=lang,
                        title=title_results.get(lang, original.title),
                        description=desc_results.get(lang, original.description),
                        is_auto_translated=True
                    )

        with ThreadPoolExecutor(max_workers=10) as executor:
            executor.map(translate_ad_item, ads)

        self.stdout.write(self.style.SUCCESS("Turbo Translation Complete!"))
