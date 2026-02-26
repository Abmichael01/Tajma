
import os
import random
from decimal import Decimal
from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.text import slugify
from django.utils import timezone
from api.models import Category, Ad, User, Region
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
    help = 'Clear and seed categories and ads with detailed data.'

    def handle(self, *args, **options):
        # Paths for automation
        frontend_public = os.path.join(settings.BASE_DIR, '..', 'frontend', 'public')
        media_root = settings.MEDIA_ROOT
        
        with transaction.atomic():
            self.stdout.write('Syncing image assets from frontend...')
            self._copy_assets(frontend_public, media_root)
            
            self.stdout.write('Checking Regions...')
            self._ensure_regions()
            
            self.stdout.write('Clearing existing ads...')
            Ad.objects.all().delete()
            
            self.stdout.write('Clearing existing categories...')
            Category.objects.all().delete()

            self.stdout.write('Seeding categories...')
            for order, node in enumerate(CATEGORY_TREE):
                self._create_category(node, parent=None, sort_order=order)
            
            export_categories_to_json()
            
            self.stdout.write('Updating User locations...')
            self._update_user_locations()
            
            self.stdout.write('Seeding ads...')
            self._seed_ads()

        self.stdout.write(self.style.SUCCESS('Successfully seeded everything and synced assets.'))

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
            self.stdout.write(self.style.WARNING(f'Frontend public dir not found: {src_dir}'))
            return

        os.makedirs(dest_dir, exist_ok=True)
        
        # List of assets used in seeding
        assets = [
            'car1.jpg', 'car2.jpg', 'car3.jpg',
            'shoe1.jpg', 'shoe2.jpg', 'shoe3.jpg',
            'plumbing1.jpg', 'plumbing2.jpg', 'plumbing3.jpg',
            'cloth1.jpg', 'cloth2.jpg',
            'cream1.jpg', 'cream2.jpg', 'cream3.jpg',
            'perf1.jpg', 'perf2.jpg', 'perf3.jpg',
            'electronics_banner.png', 'vehicles_banner.png', 'fashion_banner.png',
            'property_banner.png', 'services_banner.png', 'logo.jpg', 'logo.webp',
            'electronics_banner_bg_1768445147615.png'
        ]

        for asset in assets:
            src_path = os.path.join(src_dir, asset)
            dest_path = os.path.join(dest_dir, asset)
            
            if os.path.exists(src_path):
                shutil.copy2(src_path, dest_path)
                # self.stdout.write(f'  Copied {asset}')
            else:
                self.stdout.write(self.style.WARNING(f'  Asset not found: {asset}'))

    def _create_category(self, node, parent=None, sort_order=0, level=0):
        slug = slugify(node['name'])
        defaults = {
            'name': node['name'],
            'icon': node.get('icon', ''),
            'image_url': node.get('image_url', ''),
            'category_type': node.get('type', parent.category_type if parent else 'product'),
            'custom_fields': node.get('custom_fields', []),
            'parent': parent,
            'sort_order': sort_order,
            'is_active': True,
        }

        category, _ = Category.objects.update_or_create(
            slug=slug,
            defaults=defaults,
        )

        for index, child in enumerate(node.get('children', [])):
            self._create_category(child, parent=category, sort_order=index, level=level + 1)

    def _seed_ads(self):
        users = list(User.objects.all())
        if not users:
            self.stdout.write('No users found. Please create users first.')
            return

        def get_cat(slug_list):
            for s in slug_list:
                try:
                    return Category.objects.get(slug=s)
                except Category.DoesNotExist:
                    continue
            return Category.objects.first()

        # Map categories to use for ads
        cars_cat = get_cat(['toyota', 'cars', 'vehicles'])
        phones_cat = get_cat(['smartphones', 'mobile-phones', 'phones-tablets'])
        fashion_cat = get_cat(['mens-clothing', 'fashion'])
        shoes_cat = get_cat(['mens-shoes', 'shoes', 'fashion'])
        beauty_cat = get_cat(['skin-care', 'health-beauty'])
        perfume_cat = get_cat(['mens-perfumes', 'fragrances', 'health-beauty'])
        services_cat = get_cat(['plumbers', 'building-trades', 'services'])
        jobs_cat = get_cat(['technology-it', 'job-opportunities'])
        rent_cat = get_cat(['houses-apartments-for-rent', 'real-estate'])
        sale_cat = get_cat(['houses-apartments-for-sale', 'real-estate'])

        ad_templates = [
            {
                'title': 'Toyota Camry 2020 XLE - Full Option',
                'description': 'Very clean foreign used Toyota Camry 2020 XLE. Full options with sunroof, leather seats, and reverse camera. Low mileage and strictly serviced.',
                'price': Decimal('15500000.00'),
                'category': cars_cat,
                'images': ['/car1.jpg', '/car2.jpg', '/car3.jpg'],
                'attributes': {
                    'condition': 'foreign-used',
                    'make': 'Toyota', 'model': 'Camry', 'year': 2020,
                    'transmission': 'automatic', 'fuel_type': 'petrol'
                }
            },
            {
                'title': 'Toyota Corolla 2018 - Nigerian Used',
                'description': 'Reliable Toyota Corolla 2018. Fuel efficient and clean interior. AC chilling.',
                'price': Decimal('8500000.00'),
                'category': cars_cat,
                'images': ['/car2.jpg', '/car1.jpg', '/car3.jpg'],
                'attributes': {
                    'condition': 'nigerian-used',
                    'make': 'Toyota', 'model': 'Corolla', 'year': 2018,
                    'transmission': 'automatic', 'fuel_type': 'petrol'
                }
            },
            {
                'title': 'iPhone 15 Pro Max - 256GB Gold',
                'description': 'Brand new iPhone 15 Pro Max, 256GB storage, Gold color. Factory unlocked.',
                'price': Decimal('950000.00'),
                'category': phones_cat,
                'images': ['/electronics_banner.png', '/logo.jpg'],
                'attributes': {
                    'brand': 'Apple', 'model': 'iPhone 15 Pro Max',
                    'storage': '256GB', 'colour': 'Gold', 'condition': 'brand-new'
                }
            },
            {
                'title': 'Samsung Galaxy S23 Ultra - 512GB',
                'description': 'Open box Samsung Galaxy S23 Ultra. Phantom Black, 12GB RAM, 512GB Storage. 100x Zoom camera.',
                'price': Decimal('750000.00'),
                'category': phones_cat,
                'images': ['/electronics_banner.png', '/logo.webp'],
                'attributes': {
                    'brand': 'Samsung', 'model': 'S23 Ultra',
                    'storage': '512GB', 'colour': 'Black', 'condition': 'open-box'
                }
            },
            {
                'title': 'Premium Leather Men\'s Formal Shoes',
                'description': 'High-quality handcrafted leather shoes for men. Perfect for formal occasions.',
                'price': Decimal('45000.00'),
                'category': shoes_cat,
                'images': ['/shoe1.jpg', '/shoe2.jpg', '/shoe3.jpg'],
                'attributes': {
                    'gender': 'male', 'material': 'Leather', 'size': '42', 'condition': 'brand-new'
                }
            },
            {
                'title': 'Nike Air Force 1 - White Classic',
                'description': 'Brand new Nike Air Force 1. All white, size 40-45 available.',
                'price': Decimal('35000.00'),
                'category': shoes_cat,
                'images': ['/shoe2.jpg', '/shoe3.jpg', '/shoe1.jpg'],
                'attributes': {
                    'gender': 'unisex', 'material': 'Leather', 'size': '44', 'condition': 'brand-new'
                }
            },
            {
                'title': 'Designer Men\'s Casual Cotton Shirt',
                'description': 'Trendy casual shirt for men. Breathable cotton fabric.',
                'price': Decimal('15000.00'),
                'category': fashion_cat,
                'images': ['/cloth1.jpg', '/cloth2.jpg', '/fashion_banner.png'],
                'attributes': {
                    'gender': 'male', 'material': 'Cotton', 'size': 'XL', 'condition': 'brand-new'
                }
            },
            {
                'title': 'Traditional Men\'s Agbada - Complete Set',
                'description': 'Exquisite native wear for men. High quality fabric, perfect for weddings.',
                'price': Decimal('85000.00'),
                'category': fashion_cat,
                'images': ['/cloth2.jpg', '/cloth1.jpg', '/logo.jpg'],
                'attributes': {
                    'gender': 'male', 'material': 'Native Fabric', 'size': 'L', 'condition': 'brand-new'
                }
            },
            {
                'title': 'Organic Skin Care Set - Glow Pack',
                'description': 'Complete skin care set for a naturally glowing skin.',
                'price': Decimal('25000.00'),
                'category': beauty_cat,
                'images': ['/cream1.jpg', '/cream2.jpg', '/cream3.jpg'],
                'attributes': {
                    'brand': 'GlowNatural', 'gender': 'unisex', 'condition': 'brand-new'
                }
            },
            {
                'title': 'Dior Sauvage - 100ml Eau de Parfum',
                'description': 'Original Dior Sauvage perfume. Long lasting scent.',
                'price': Decimal('120000.00'),
                'category': perfume_cat,
                'images': ['/perf1.jpg', '/perf2.jpg', '/perf3.jpg'],
                'attributes': {
                    'brand': 'Dior', 'gender': 'male', 'condition': 'brand-new', 'formulation': 'spray'
                }
            },
            {
                'title': 'Chanel No. 5 - 50ml Classic',
                'description': 'The iconic Chanel No. 5 fragrance. 100% authentic.',
                'price': Decimal('150000.00'),
                'category': perfume_cat,
                'images': ['/perf2.jpg', '/perf1.jpg', '/perf3.jpg'],
                'attributes': {
                    'brand': 'Chanel', 'gender': 'female', 'condition': 'brand-new', 'formulation': 'spray'
                }
            },
            {
                'title': 'Professional Plumbing Services',
                'description': 'Expert plumbing services for residential buildings.',
                'price': Decimal('5000.00'),
                'category': services_cat,
                'images': ['/plumbing1.jpg', '/plumbing2.jpg', '/plumbing3.jpg'],
                'attributes': {
                    'service_type': 'building', 'availability': '24-7', 'experience_years': 10,
                    'service_area': ['Niamey', 'Plateau'],
                    'packages': [{'name': 'Basic Fix', 'price': 5000, 'description': 'Minor repairs'}]
                }
            },
            {
                'title': 'Modern 3 Bedroom Flat for Rent - Niamey',
                'description': 'Spacious 3 bedroom flat with POP ceilings and tiles. Constant water and security.',
                'price': Decimal('350000.00'),
                'category': rent_cat,
                'images': ['/house2.jpg', '/logo.webp', '/logo.jpg'],
                'attributes': {
                    'bedrooms': 3, 'bathrooms': 3, 'furnishing': 'unfurnished',
                    'facilities': ['pop-ceiling', 'tiled-floor', 'running-water', 'security']
                }
            },
            {
                'title': 'Luxury 5 Bedroom Duplex for Sale - Plateau',
                'description': 'Magnificent 5 bedroom duplex with swimming pool and gym. Fully furnished and automated.',
                'price': Decimal('250000000.00'),
                'category': sale_cat,
                'images': ['/house1.jpg', '/house2.jpg', '/logo.jpg'],
                'attributes': {
                    'bedrooms': 5, 'bathrooms': 6, 'furnishing': 'furnished',
                    'facilities': ['pool', 'gym', 'electricity', 'security']
                }
            },
            {
                'title': 'Senior Software Developer - Node.js',
                'description': 'Build scalable applications with our tech team.',
                'price': Decimal('1200000.00'),
                'category': jobs_cat,
                'images': ['/services_banner.png', '/logo.jpg'],
                'attributes': {
                    'job_type': 'full-time', 'company_name': 'Tajma Tech',
                    'salary_range': '1,2M - 1,5M XOF', 'experience_level': 'senior',
                    'location_type': 'hybrid', 'skills_required': ['React', 'Node.js']
                }
            },
            {
                'title': 'Digital Marketing Manager',
                'description': 'Lead our marketing campaigns and grow our brand.',
                'price': Decimal('400000.00'),
                'category': get_cat(['digital-marketers', 'sales-marketing']),
                'images': ['/logo.jpg', '/services_banner.png'],
                'attributes': {
                    'job_type': 'full-time', 'company_name': 'AdGrowth',
                    'salary_range': '300k - 500k XOF', 'experience_level': 'mid',
                    'location_type': 'on-site', 'skills_required': ['SEO', 'Ads', 'Social Media']
                }
            },
            {
                'title': 'HP EliteBook 840 G5 - 16GB RAM',
                'description': 'Professional business laptop. Intel Core i7, 16GB RAM, 512GB SSD. Backlit keyboard.',
                'price': Decimal('250000.00'),
                'category': get_cat(['computers-laptops', 'electronics']),
                'images': ['/electronics_banner.png', '/logo.webp'],
                'attributes': {
                    'condition': 'foreign-used', 'brand': 'HP', 'model': 'EliteBook 840 G5',
                    'processor': 'Intel Core i7', 'ram': 16, 'storage_capacity': 512, 'storage_type': 'ssd'
                }
            },
            {
                'title': 'Luxury 4-Piece Sofa Set',
                'description': 'Very comfortable and stylish gray sofa set for your living room.',
                'price': Decimal('450000.00'),
                'category': get_cat(['living-room-furniture', 'home-furniture-garden']),
                'images': ['/property_banner.png', '/logo.jpg'],
                'attributes': {
                    'condition': 'brand-new', 'material': 'Fabric', 'colour': 'Gray'
                }
            },
            {
                'title': 'Custom Gaming PC - RTX 4080',
                'description': 'High-end gaming desktop. AMD Ryzen 9, 32GB RAM, RTX 4080 16GB. Water cooled.',
                'price': Decimal('1800000.00'),
                'category': get_cat(['desktop-computers', 'computers-laptops']),
                'images': ['/electronics_banner.png', '/logo.webp'],
                'attributes': {
                    'condition': 'brand-new', 'processor': 'Ryzen 9', 'ram': 32, 'storage_capacity': 2000, 'storage_type': 'ssd'
                }
            },
            {
                'title': 'Nivea Radiant & Beauty Lotion - Duo Pack',
                'description': 'Moisturizing body lotion for glowing skin. Pack of 2.',
                'price': Decimal('12000.00'),
                'category': get_cat(['body-creams-lotions', 'skin-care']),
                'images': ['/cream3.jpg', '/cream1.jpg', '/cream2.jpg'],
                'attributes': {
                    'brand': 'Nivea', 'gender': 'unisex', 'condition': 'brand-new'
                }
            }
        ]

        # Seed 5-8 ads per user for more volume
        for user in users:
            num_ads = random.randint(5, 8)
            for i in range(num_ads):
                template = random.choice(ad_templates)
                Ad.objects.create(
                    seller=user,
                    category=template['category'],
                    title=f"{template['title']} - {i+1}",
                    description=template['description'],
                    price=template['price'],
                    images=template['images'],
                    attributes=template['attributes'],
                    ad_type=template['category'].category_type,
                    status='published',
                    published_at=timezone.now()
                )
