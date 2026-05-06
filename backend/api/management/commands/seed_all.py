import os
import random
from decimal import Decimal
from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.text import slugify
from django.utils import timezone
from django.utils import translation as django_translation

from api.models import Category, Ad, User, Region, Country, CategoryTranslation, AdTranslation
from api.utils.category_exporter import export_categories_to_json

from api.management.commands.category_seeds.electronics import ELECTRONICS_CATEGORY
from api.management.commands.category_seeds.vehicles import VEHICLES_CATEGORY
from api.management.commands.category_seeds.property import PROPERTY_CATEGORY
from api.management.commands.category_seeds.fashion import FASHION_CATEGORY
from api.management.commands.category_seeds.home_garden import HOME_GARDEN_CATEGORY
from api.management.commands.category_seeds.beauty_health import BEAUTY_HEALTH_CATEGORY
from api.management.commands.category_seeds.services import SERVICES_CATEGORY
from api.management.commands.category_seeds.jobs import JOBS_CATEGORY

CATEGORY_TREE = [
    ELECTRONICS_CATEGORY,
    VEHICLES_CATEGORY,
    PROPERTY_CATEGORY,
    FASHION_CATEGORY,
    HOME_GARDEN_CATEGORY,
    BEAUTY_HEALTH_CATEGORY,
    SERVICES_CATEGORY,
    JOBS_CATEGORY,
]

COUNTRIES_DATA = [
    {
        'name': 'Niger',
        'code': 'NE',
        'flag': '🇳🇪',
        'departments': ['Niamey', 'Dosso', 'Maradi', 'Tahoua', 'Tillabéri', 'Zinder', 'Agadez', 'Diffa']
    },
    {
        'name': 'Mali',
        'code': 'ML',
        'flag': '🇲🇱',
        'departments': ['Bamako', 'Kayes', 'Koulikoro', 'Sikasso', 'Ségou', 'Mopti', 'Tombouctou', 'Gao', 'Kidal']
    },
    {
        'name': 'Burkina Faso',
        'code': 'BF',
        'flag': '🇧🇫',
        'departments': ['Ouagadougou', 'Bobo-Dioulasso', 'Koudougou', 'Ouahigouya', 'Banfora', 'Kaya', 'Tenkodogo', "Fada N'gourma"]
    }
]

class Command(BaseCommand):
    help = 'Clear and seed database with 3 countries, their departments, categories and ads in English (auto-translated).'

    def handle(self, *args, **options):
        # Paths for automation
        frontend_public = os.path.join(settings.BASE_DIR, '..', 'frontend', 'public')
        media_root = settings.MEDIA_ROOT
        
        # Set default language for seeding (Source data is now in English)
        django_translation.activate('en')
        
        with transaction.atomic():
            self.stdout.write('Syncing image assets from frontend...')
            self._copy_assets(frontend_public, media_root)
            
            self.stdout.write('Clearing existing data...')
            AdTranslation.objects.all().delete()
            Ad.objects.all().delete()
            CategoryTranslation.objects.all().delete()
            Category.objects.all().delete()
            Region.objects.all().delete()
            Country.objects.all().delete()

            self.stdout.write('Seeding Countries and Departments...')
            self._seed_locations()
            
            self.stdout.write('Seeding categories (English source, signals will auto-translate)...')
            for order, node in enumerate(CATEGORY_TREE):
                self._create_category(node, parent=None, sort_order=order)
            
            export_categories_to_json()
            
            self.stdout.write('Updating User locations...')
            self._update_user_locations()
            
            self.stdout.write('Seeding ads (English source, signals will auto-translate)...')
            self._seed_ads()

        self.stdout.write(self.style.SUCCESS('Successfully seeded 3 countries, departments, and English source data. Background tasks will handle translations.'))

    def _seed_locations(self):
        for country_info in COUNTRIES_DATA:
            country, _ = Country.objects.get_or_create(
                code=country_info['code'],
                defaults={
                    'name': country_info['name'],
                    'flag_emoji': country_info['flag'],
                    'is_active': True
                }
            )
            
            for dept_name in country_info['departments']:
                Region.objects.create(
                    name=dept_name,
                    country=country,
                    level=1,
                    subdivision_type='Department',
                    is_active=True,
                    full_name=f"{dept_name}, {country.name}"
                )

    def _update_user_locations(self):
        countries = list(Country.objects.all())
        users = User.objects.all()
        for user in users:
            if countries:
                country = random.choice(countries)
                departments = list(country.subdivisions.filter(level=1))
                user.country = country
                if departments:
                    user.location = random.choice(departments)
                user.address = f"Street {random.randint(1, 100)}, {user.location.name if user.location else user.country.name}"
                user.save()

    def _copy_assets(self, src_dir, dest_dir):
        import shutil
        if not os.path.exists(src_dir):
            return
        os.makedirs(dest_dir, exist_ok=True)
        assets = [
            'car1.jpg', 'car2.jpg', 'car3.jpg', 'shoe1.jpg', 'shoe2.jpg', 'shoe3.jpg',
            'plumbing1.jpg', 'plumbing2.jpg', 'plumbing3.jpg', 'cloth1.jpg', 'cloth2.jpg',
            'cream1.jpg', 'cream2.jpg', 'cream3.jpg', 'perf1.jpg', 'perf2.jpg', 'perf3.jpg',
            'electronics_banner.png', 'vehicles_banner.png', 'fashion_banner.png',
            'property_banner.png', 'services_banner.png', 'logo.jpg', 'logo.webp',
            'laptop1.png', 'bike1.png', 'house1.png', 'house2.png', 'worker1.png', 'office1.png'
        ]
        for asset in assets:
            src_path = os.path.join(src_dir, asset)
            if os.path.exists(src_path):
                shutil.copy2(src_path, os.path.join(dest_dir, asset))

    def _create_category(self, node, parent=None, sort_order=0):
        slug = slugify(node['name'])
        # Handle duplicate slugs in the tree
        counter = 1
        original_slug = slug
        while Category.objects.filter(slug=slug).exists():
            slug = f"{original_slug}-{counter}"
            counter += 1

        category = Category.objects.create(
            slug=slug,
            icon=node.get('icon', ''),
            image_url=node.get('image_url', ''),
            category_type=node.get('type', parent.category_type if parent else 'product'),
            custom_fields=node.get('custom_fields', []),
            parent=parent,
            sort_order=sort_order,
            is_active=True,
        )

        # Create the Source Translation (English)
        # This will trigger the trigger_category_translation signal
        CategoryTranslation.objects.create(
            category=category,
            language='en',
            name=node['name'],
            description=node.get('description', f"Category for {node['name']}"),
            is_original=True
        )

        for index, child in enumerate(node.get('children', [])):
            self._create_category(child, parent=category, sort_order=index)

    def _seed_ads(self):
        users = list(User.objects.all())
        if not users: return

        def get_cat(slug_list):
            for s in slug_list:
                try: return Category.objects.get(slug=s)
                except Category.DoesNotExist: continue
            return Category.objects.first()

        ad_templates = [
            {'title': 'Toyota Camry 2020 XLE - Full Option', 'price': 15500000, 'category': get_cat(['toyota', 'cars']), 'images': ['/car1.jpg'], 'desc': 'Foreign used, full options, leather seats, clean interior.'},
            {'title': 'iPhone 15 Pro Max - 256GB Gold', 'price': 950000, 'category': get_cat(['smartphones', 'phones']), 'images': ['/electronics_banner.png'], 'desc': 'Brand new, factory unlocked, 1 year warranty.'},
            {'title': 'Nike Air Force 1 - White Classic', 'price': 35000, 'category': get_cat(['shoes', 'fashion']), 'images': ['/shoe1.jpg'], 'desc': 'Available in all sizes 40-45. High quality material.'},
            {'title': 'Luxury 5 Bedroom Duplex for Sale', 'price': 250000000, 'category': get_cat(['houses-apartments-for-sale']), 'images': ['/house1.png'], 'desc': 'Modern architecture, swimming pool, gym, and tight security.'},
            {'title': 'Professional Web Development Services', 'price': 150000, 'category': get_cat(['technology-it', 'services']), 'images': ['/worker1.png'], 'desc': 'Get a professional website for your business today. SEO optimized and responsive.'},
            {'title': 'Bose QuietComfort Ultra Headphones', 'price': 450000, 'category': get_cat(['audio-sound']), 'images': ['/electronics_banner.png'], 'desc': 'Best-in-class noise cancellation and spatial audio.'},
            {'title': 'Office Desk & Chair Set - Ergonomic', 'price': 120000, 'category': get_cat(['office-furniture']), 'images': ['/office1.png'], 'desc': 'Perfect for home office or corporate use.'},
        ]

        for user in users:
            for i in range(random.randint(3, 6)):
                template = random.choice(ad_templates)
                title = f"{template['title']} #{random.randint(100, 999)}"
                
                ad = Ad.objects.create(
                    seller=user,
                    category=template['category'],
                    price=Decimal(template['price']),
                    images=template['images'],
                    attributes={'condition': 'brand-new'},
                    ad_type=template['category'].category_type,
                    status='published',
                    published_at=timezone.now()
                )
                
                # Create the Source Translation (English)
                # This will trigger the trigger_ad_translation signal
                AdTranslation.objects.create(
                    ad=ad, 
                    language='en', 
                    title=title, 
                    description=template['desc'], 
                    is_original=True
                )
