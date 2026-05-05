import os
import random
from decimal import Decimal
from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.text import slugify
from django.utils import timezone
from django.utils import translation as django_translation

from api.models import Category, Ad, User, Region, CategoryTranslation, AdTranslation
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

class Command(BaseCommand):
    help = 'Clear and seed categories and ads with detailed translation-aware data.'

    def handle(self, *args, **options):
        # Paths for automation
        frontend_public = os.path.join(settings.BASE_DIR, '..', 'frontend', 'public')
        media_root = settings.MEDIA_ROOT
        
        # Set default language for seeding
        django_translation.activate('fr')
        
        with transaction.atomic():
            self.stdout.write('Syncing image assets from frontend...')
            self._copy_assets(frontend_public, media_root)
            
            self.stdout.write('Checking Regions...')
            self._ensure_regions()
            
            self.stdout.write('Clearing existing ads and translations...')
            AdTranslation.objects.all().delete()
            Ad.objects.all().delete()
            
            self.stdout.write('Clearing existing categories and translations...')
            CategoryTranslation.objects.all().delete()
            Category.objects.all().delete()

            self.stdout.write('Seeding categories with translations...')
            for order, node in enumerate(CATEGORY_TREE):
                self._create_category(node, parent=None, sort_order=order)
            
            export_categories_to_json()
            
            self.stdout.write('Updating User locations...')
            self._update_user_locations()
            
            self.stdout.write('Seeding ads with translations...')
            self._seed_ads()

        self.stdout.write(self.style.SUCCESS('Successfully seeded everything and synced assets with Multi-Lingual support.'))

    def _ensure_regions(self):
        regions_list = ['Niamey', 'Dosso', 'Maradi', 'Tahoua', 'Tillabéri', 'Zinder', 'Agadez', 'Diffa']
        for name in regions_list:
            Region.objects.get_or_create(name=name, defaults={'is_active': True})

    def _update_user_locations(self):
        regions = list(Region.objects.all())
        users = User.objects.all()
        for user in users:
            if regions:
                user.location = random.choice(regions)
                user.address = f"Street {random.randint(1, 100)}, {user.location.name}"
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

        # Create Translations
        CategoryTranslation.objects.get_or_create(
            category=category,
            language='fr',
            defaults={
                'name': node['name'],
                'description': node.get('description', f"Catégorie pour {node['name']}")
            }
        )
        CategoryTranslation.objects.get_or_create(
            category=category,
            language='en',
            defaults={
                'name': node['name'],
                'description': node.get('description', f"Category for {node['name']}")
            }
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
            {'title': 'Toyota Camry 2020 XLE - Full Option', 'price': 15500000, 'category': get_cat(['toyota', 'cars']), 'images': ['/car1.jpg'], 'desc': 'Foreign used, full options.'},
            {'title': 'iPhone 15 Pro Max - 256GB Gold', 'price': 950000, 'category': get_cat(['smartphones', 'phones']), 'images': ['/electronics_banner.png'], 'desc': 'Brand new, factory unlocked.'},
            {'title': 'Nike Air Force 1 - White Classic', 'price': 35000, 'category': get_cat(['shoes', 'fashion']), 'images': ['/shoe1.jpg'], 'desc': 'Size 40-45 available.'},
            {'title': 'Luxury 5 Bedroom Duplex for Sale', 'price': 250000000, 'category': get_cat(['houses-apartments-for-sale']), 'images': ['/house1.png'], 'desc': 'Swimming pool and gym.'},
            {'title': 'Senior Software Developer - Node.js', 'price': 1200000, 'category': get_cat(['technology-it']), 'images': ['/services_banner.png'], 'desc': 'Join our tech team.'},
        ]

        for user in users:
            for i in range(random.randint(3, 5)):
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
                
                # Create Translations
                AdTranslation.objects.create(ad=ad, language='fr', title=title, description=template['desc'], is_original=True)
                AdTranslation.objects.create(ad=ad, language='en', title=title, description=template['desc'], is_original=False)
