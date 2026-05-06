import os
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.text import slugify
from django.utils import translation as django_translation

from api.models import Category, CategoryTranslation, Ad, AdTranslation

# SEO Optimized Category Names & Metadata
# We use English as the source for all translations
OPTIMIZED_CATEGORIES = [
    {
        "name": "Vehicles",
        "slug": "vehicles",
        "icon": "Car",
        "type": "vehicle",
        "description": "Find the best deals on new and used cars, motorcycles, and trucks.",
        "custom_fields": [
            {"name": "condition", "label": "Condition", "type": "select", "options": [{"value": "foreign-used", "label": "Foreign Used"}, {"value": "local-used", "label": "Local Used"}, {"value": "new", "label": "Brand New"}], "required": True},
            {"name": "transmission", "label": "Transmission", "type": "select", "options": [{"value": "automatic", "label": "Automatic"}, {"value": "manual", "label": "Manual"}], "required": True},
            {"name": "year", "label": "Year", "type": "number", "required": True},
            {"name": "fuel_type", "label": "Fuel Type", "type": "select", "options": [{"value": "petrol", "label": "Petrol"}, {"value": "diesel", "label": "Diesel"}, {"value": "hybrid", "label": "Hybrid"}], "required": False}
        ],
        "children": [
            {
                "name": "Cars", 
                "slug": "cars",
                "children": [
                    {"name": "Toyota", "slug": "toyota-cars"},
                    {"name": "Mercedes-Benz", "slug": "mercedes-benz-cars"},
                    {"name": "Nissan", "slug": "nissan-cars"}
                ]
            },
            {"name": "Motorcycles", "slug": "motorcycles"},
            {"name": "Trucks & Commercial", "slug": "trucks"}
        ]
    },
    {
        "name": "Property",
        "slug": "property",
        "icon": "Home",
        "type": "property",
        "description": "Rent or buy houses, apartments, land, and commercial properties.",
        "custom_fields": [
            {"name": "bedrooms", "label": "Bedrooms", "type": "number", "required": False},
            {"name": "bathrooms", "label": "Bathrooms", "type": "number", "required": False},
            {"name": "furnished", "label": "Furnished", "type": "select", "options": [{"value": "yes", "label": "Yes"}, {"value": "no", "label": "No"}], "required": False},
            {"name": "square_meters", "label": "Square Meters", "type": "number", "required": False}
        ],
        "children": [
            {"name": "Houses & Apartments for Sale", "slug": "houses-for-sale"},
            {"name": "Houses & Apartments for Rent", "slug": "houses-for-rent"},
            {"name": "Land & Plots", "slug": "land-for-sale"},
            {"name": "Commercial Property", "slug": "commercial-property"}
        ]
    },
    {
        "name": "Phones & Tablets",
        "slug": "phones-tablets",
        "icon": "Smartphone",
        "type": "product",
        "description": "Latest smartphones, iPhones, Android tablets, and mobile accessories.",
        "custom_fields": [
            {"name": "condition", "label": "Condition", "type": "select", "options": [{"value": "new", "label": "Brand New"}, {"value": "used", "label": "Used"}, {"value": "refurbished", "label": "Refurbished"}], "required": True},
            {"name": "storage_capacity", "label": "Storage Capacity", "type": "select", "options": [{"value": "64gb", "label": "64 GB"}, {"value": "128gb", "label": "128 GB"}, {"value": "256gb", "label": "256 GB"}, {"value": "512gb", "label": "512 GB"}], "required": False},
            {"name": "ram", "label": "RAM size", "type": "select", "options": [{"value": "4gb", "label": "4 GB"}, {"value": "6gb", "label": "6 GB"}, {"value": "8gb", "label": "8 GB"}, {"value": "12gb", "label": "12 GB"}], "required": False}
        ],
        "children": [
            {"name": "Mobile Phones", "slug": "mobile-phones"},
            {"name": "Tablets", "slug": "tablets"},
            {"name": "Smartwatches", "slug": "smartwatches"},
            {"name": "Phone Accessories", "slug": "phone-accessories"}
        ]
    },
    {
        "name": "Electronics",
        "slug": "electronics",
        "icon": "Laptop",
        "type": "product",
        "description": "Computers, TVs, home theater systems, cameras, and gaming consoles.",
        "custom_fields": [
            {"name": "condition", "label": "Condition", "type": "select", "options": [{"value": "new", "label": "Brand New"}, {"value": "used", "label": "Used"}], "required": True}
        ],
        "children": [
            {
                "name": "Computers & Laptops",
                "slug": "computers-laptops",
                "custom_fields": [
                    {"name": "processor", "label": "Processor", "type": "text"},
                    {"name": "ram", "label": "RAM (GB)", "type": "number"},
                    {"name": "storage_capacity", "label": "Storage (GB/TB)", "type": "text"}
                ]
            },
            {"name": "TV & Audio", "slug": "tv-audio"},
            {"name": "Video Games & Consoles", "slug": "video-games"},
            {"name": "Cameras & Lenses", "slug": "cameras"}
        ]
    },
    {
        "name": "Home, Furniture & Appliances",
        "slug": "home-furniture",
        "icon": "Sofa",
        "type": "product",
        "description": "Furniture, home decor, and essential home appliances.",
        "custom_fields": [
            {"name": "condition", "label": "Condition", "type": "select", "options": [{"value": "new", "label": "Brand New"}, {"value": "used", "label": "Used"}], "required": True}
        ],
        "children": [
            {"name": "Living Room Furniture", "slug": "living-room"},
            {"name": "Kitchen Appliances", "slug": "kitchen-appliances"},
            {"name": "Home Decor", "slug": "home-decor"}
        ]
    },
    {
        "name": "Fashion",
        "slug": "fashion",
        "icon": "Shirt",
        "type": "product",
        "description": "Trending fashion, designer clothing, shoes, and jewelry.",
        "custom_fields": [
            {"name": "gender", "label": "Gender", "type": "select", "options": [{"value": "male", "label": "Men"}, {"value": "female", "label": "Women"}, {"value": "unisex", "label": "Unisex"}]},
            {"name": "size", "label": "Size", "type": "text", "placeholder": "e.g. M, L, XL, 42"}
        ],
        "children": [
            {"name": "Clothing", "slug": "clothing"},
            {"name": "Shoes", "slug": "shoes"},
            {"name": "Watches & Jewelry", "slug": "watches-jewelry"},
            {"name": "Bags & Accessories", "slug": "bags"}
        ]
    },
    {
        "name": "Beauty & Personal Care",
        "slug": "beauty-personal-care",
        "icon": "Sparkles",
        "type": "product",
        "description": "Skincare, makeup, hair care, and fragrances.",
        "children": [
            {"name": "Makeup", "slug": "makeup"},
            {"name": "Hair Care", "slug": "hair-care"},
            {"name": "Fragrances", "slug": "fragrances"}
        ]
    },
    {
        "name": "Services",
        "slug": "services",
        "icon": "Briefcase",
        "type": "service",
        "description": "Professional services, cleaning, catering, and more.",
        "children": [
            {"name": "Cleaning Services", "slug": "cleaning-services"},
            {"name": "Legal Services", "slug": "legal-services"},
            {"name": "Catering & Events", "slug": "catering"}
        ]
    },
    {
        "name": "Repair & Construction",
        "slug": "repair-construction",
        "icon": "Wrench",
        "type": "service",
        "children": [
            {"name": "Plumbing", "slug": "plumbing"},
            {"name": "Electrical", "slug": "electrical"},
            {"name": "Building Materials", "slug": "building-materials"}
        ]
    },
    {
        "name": "Commercial Equipment & Tools",
        "slug": "commercial-equipment",
        "icon": "Truck",
        "type": "product",
        "children": [
            {"name": "Industrial Machinery", "slug": "machinery"},
            {"name": "Office Furniture", "slug": "office-furniture"},
            {"name": "Farming Tools", "slug": "farming-tools"}
        ]
    },
    {
        "name": "Leisure & Activities",
        "slug": "leisure-activities",
        "icon": "Ticket",
        "type": "product",
        "children": [
            {"name": "Sports Equipment", "slug": "sports"},
            {"name": "Musical Instruments", "slug": "music"},
            {"name": "Books & Games", "slug": "books"}
        ]
    },
    {
        "name": "Babies & Kids",
        "slug": "babies-kids",
        "icon": "Heart",
        "type": "product",
        "children": [
            {"name": "Toys", "slug": "toys"},
            {"name": "Kids Clothing", "slug": "kids-clothing"},
            {"name": "Baby Gear", "slug": "baby-gear"}
        ]
    },
    {
        "name": "Food, Agriculture & Farming",
        "slug": "food-agriculture",
        "icon": "Leaf",
        "type": "product",
        "children": [
            {"name": "Farm Produce", "slug": "produce"},
            {"name": "Livestock", "slug": "livestock"},
            {"name": "Processed Foods", "slug": "processed-foods"}
        ]
    },
    {
        "name": "Animals & Pets",
        "slug": "animals-pets",
        "icon": "Paw",
        "type": "product",
        "children": [
            {"name": "Dogs", "slug": "dogs"},
            {"name": "Cats", "slug": "cats"},
            {"name": "Pet Accessories", "slug": "pet-accessories"}
        ]
    }
]

class Command(BaseCommand):
    help = 'Production seed for Countries, Departments, and SEO-optimized Categories.'

    def add_arguments(self, parser):
        parser.add_argument('--clear', action='store_true', help='Clear existing categories and locations before seeding')

    def handle(self, *args, **options):
        django_translation.activate('en')
        
        with transaction.atomic():
            if options['clear']:
                self.stdout.write('Clearing existing ads and categories...')
                AdTranslation.objects.all().delete()
                Ad.objects.all().delete()
                CategoryTranslation.objects.all().delete()
                Category.objects.all().delete()

            self.stdout.write('Seeding SEO-optimized Categories...')
            for order, node in enumerate(OPTIMIZED_CATEGORIES):
                self._create_category(node, parent=None, sort_order=order)

        self.stdout.write(self.style.SUCCESS('Successfully seeded production data. Run turbo_translate to generate FR/HA versions.'))


    def _create_category(self, node, parent=None, sort_order=0):
        slug = node.get('slug') or slugify(node['name'])
        
        category, created = Category.objects.get_or_create(
            slug=slug,
            defaults={
                'icon': node.get('icon', ''),
                'image_url': node.get('image_url', ''),
                'category_type': node.get('type', parent.category_type if parent else 'product'),
                'custom_fields': node.get('custom_fields', []),
                'sort_order': sort_order,
                'is_active': True,
                'parent': parent
            }
        )

        if not created:
            category.icon = node.get('icon', category.icon)
            category.image_url = node.get('image_url', category.image_url)
            category.custom_fields = node.get('custom_fields', category.custom_fields)
            category.parent = parent
            category.sort_order = sort_order
            category.save()

        # Create or update English translation
        trans, trans_created = CategoryTranslation.objects.get_or_create(
            category=category,
            language='en',
            defaults={
                'name': node['name'],
                'description': node.get('description', f"Buy and sell {node['name']} in Niger, Mali, and Burkina Faso."),
                'is_original': True
            }
        )
        
        if not trans_created:
            trans.name = node['name']
            trans.description = node.get('description', trans.description)
            trans.save()

        if created:
            self.stdout.write(f'  Created category: {node["name"]}')

        for index, child in enumerate(node.get('children', [])):
            self._create_category(child, parent=category, sort_order=index)
