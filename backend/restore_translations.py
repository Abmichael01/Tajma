import os
import django
from django.utils.text import slugify

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'serverConfig.settings')
django.setup()

from api.models import Category, CategoryTranslation, Ad, AdTranslation

def restore_data():
    print("🔄 Starting Data Restoration...")
    
    # 1. Restore Category Translations
    categories = Category.objects.all()
    print(f"📁 Processing {categories.count()} categories...")
    for cat in categories:
        # Create readable name from slug
        readable_name = cat.slug.replace('-', ' ').title()
        
        # Create translations if they don't exist
        for lang in ['fr', 'en']:
            trans, created = CategoryTranslation.objects.get_or_create(
                category=cat,
                language=lang,
                defaults={'name': readable_name, 'description': f"Category for {readable_name}"}
            )
            if created:
                print(f"✅ Created {lang} translation for Category: {readable_name}")

    # 2. Restore Ad Translations
    ads = Ad.objects.all()
    print(f"📦 Processing {ads.count()} ads...")
    for ad in ads:
        # We don't have the title anymore, so we use a placeholder or location
        placeholder_title = f"Listing from {ad.location_name}" if ad.location_name else f"Ad {str(ad.id)[:8]}"
        
        for lang in ['fr', 'en']:
            trans, created = AdTranslation.objects.get_or_create(
                ad=ad,
                language=lang,
                defaults={
                    'title': placeholder_title, 
                    'description': "Please update the description for this listing.",
                    'is_original': (lang == 'fr') # Assume French as original for existing data
                }
            )
            if created:
                print(f"✅ Created {lang} translation for Ad: {ad.id}")

    print("✨ Restoration Complete!")

if __name__ == "__main__":
    restore_data()
