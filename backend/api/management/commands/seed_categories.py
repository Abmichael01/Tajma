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
        "name": "Electronics & Gadgets",
        "slug": "electronics-and-gadgets",
        "icon": "Smartphone",
        "type": "product",
        "description": "Buy and sell new and used electronics, smartphones, laptops, and home appliances in Niger, Mali, and Burkina Faso.",
        "custom_fields": [
            {
                "name": "condition",
                "label": "Condition",
                "type": "select",
                "options": [
                    {"value": "brand-new", "label": "Brand New"},
                    {"value": "foreign-used", "label": "Foreign Used"},
                    {"value": "nigerian-used", "label": "Local Used"},
                    {"value": "refurbished", "label": "Refurbished"}
                ],
                "required": True
            }
        ],
        "children": [
            {
                "name": "Phones & Tablets",
                "slug": "phones-and-tablets",
                "description": "Latest smartphones, iPhones, Android tablets, and mobile accessories.",
                "custom_fields": [
                    {
                        "name": "storage_capacity",
                        "label": "Storage Capacity",
                        "type": "select",
                        "options": [
                            {"value": "64gb", "label": "64 GB"},
                            {"value": "128gb", "label": "128 GB"},
                            {"value": "256gb", "label": "256 GB"},
                            {"value": "512gb", "label": "512 GB"}
                        ]
                    },
                    {
                        "name": "ram",
                        "label": "RAM size",
                        "type": "select",
                        "options": [
                            {"value": "4gb", "label": "4 GB"},
                            {"value": "6gb", "label": "6 GB"},
                            {"value": "8gb", "label": "8 GB"},
                            {"value": "12gb", "label": "12 GB"}
                        ]
                    }
                ],
                "children": [
                    {"name": "Smartphones", "slug": "buy-smartphones"},
                    {"name": "Tablets & iPads", "slug": "tablets-and-ipads"},
                    {"name": "Mobile Accessories", "slug": "mobile-phone-accessories"}
                ]
            },
            {
                "name": "Computers & Laptops",
                "slug": "computers-and-laptops",
                "description": "High-performance laptops, desktop computers, and networking gear.",
                "custom_fields": [
                    {
                        "name": "processor",
                        "label": "Processor",
                        "type": "text",
                        "placeholder": "e.g. Intel Core i7, Apple M2"
                    },
                    {
                        "name": "ram",
                        "label": "RAM (GB)",
                        "type": "number"
                    },
                    {
                        "name": "storage_capacity",
                        "label": "Storage (GB/TB)",
                        "type": "text"
                    }
                ],
                "children": [
                    {"name": "Laptops", "slug": "laptops-for-sale"},
                    {"name": "Desktop Computers", "slug": "desktop-computers-and-monitors"},
                    {"name": "Computer Accessories", "slug": "computer-parts-and-accessories"}
                ]
            },
            {
                "name": "TV, Audio & Video",
                "slug": "tv-audio-and-video",
                "description": "Smart TVs, home theater systems, cameras, and gaming consoles.",
                "children": [
                    {"name": "Televisions", "slug": "smart-tvs-and-leds"},
                    {"name": "Audio & Speakers", "slug": "sound-systems-and-speakers"},
                    {"name": "Video Games & Consoles", "slug": "gaming-consoles-ps5-xbox"}
                ]
            }
        ]
    },
    {
        "name": "Vehicles & Motors",
        "slug": "vehicles-and-motors",
        "icon": "Car",
        "type": "vehicle",
        "description": "Find the best deals on new and used cars, motorcycles, and trucks across the Sahel region.",
        "custom_fields": [
            {
                "name": "transmission",
                "label": "Transmission",
                "type": "select",
                "options": [
                    {"value": "automatic", "label": "Automatic"},
                    {"value": "manual", "label": "Manual"}
                ],
                "required": True
            },
            {
                "name": "year",
                "label": "Year",
                "type": "number",
                "required": True
            },
            {
                "name": "fuel_type",
                "label": "Fuel Type",
                "type": "select",
                "options": [
                    {"value": "petrol", "label": "Petrol"},
                    {"value": "diesel", "label": "Diesel"},
                    {"value": "hybrid", "label": "Hybrid"}
                ]
            }
        ],
        "children": [
            {
                "name": "Cars", 
                "slug": "cars-for-sale",
                "children": [
                    {"name": "Toyota", "slug": "toyota-cars"},
                    {"name": "Mercedes-Benz", "slug": "mercedes-benz-cars"},
                    {"name": "Nissan", "slug": "nissan-cars"},
                    {"name": "Hyundai & Kia", "slug": "hyundai-kia-cars"}
                ]
            },
            {"name": "Motorcycles & Scooters", "slug": "motorcycles-and-bikes"},
            {"name": "Trucks & Commercial Vehicles", "slug": "trucks-and-heavy-machinery"}
        ]
    },
    {
        "name": "Real Estate & Property",
        "slug": "real-estate-and-property",
        "icon": "Home",
        "type": "property",
        "description": "Rent or buy houses, apartments, land, and commercial properties in Niamey, Bamako, and Ouagadougou.",
        "children": [
            {"name": "Houses & Apartments for Sale", "slug": "houses-apartments-for-sale"},
            {"name": "Houses & Apartments for Rent", "slug": "houses-apartments-for-rent"},
            {"name": "Land & Plots", "slug": "land-and-plots-for-sale"},
            {"name": "Commercial Property", "slug": "commercial-real-estate"}
        ]
    },
    {
        "name": "Fashion & Clothing",
        "slug": "fashion-and-clothing",
        "icon": "Shirt",
        "type": "product",
        "description": "Trending fashion, designer clothing, shoes, and jewelry for men, women, and children.",
        "children": [
            {"name": "Men's Fashion", "slug": "mens-fashion-and-wear"},
            {"name": "Women's Fashion", "slug": "womens-fashion-and-style"},
            {"name": "Watches & Jewelry", "slug": "watches-and-jewelry"},
            {"name": "Shoes & Footwear", "slug": "shoes-and-sneakers"}
        ]
    },
    {
        "name": "Jobs & Careers",
        "slug": "jobs-and-careers",
        "icon": "Briefcase",
        "type": "job",
        "description": "Find your next career opportunity. Browse job openings in IT, sales, teaching, and more.",
        "children": [
            {"name": "Sales & Marketing", "slug": "sales-and-marketing-jobs"},
            {"name": "Information Technology", "slug": "it-and-software-jobs"},
            {"name": "Teaching & Education", "slug": "teaching-and-education-jobs"},
            {"name": "Driver & Transport", "slug": "driver-and-transport-jobs"}
        ]
    },
    {
        "name": "Professional Services",
        "slug": "professional-services",
        "icon": "Wrench",
        "type": "service",
        "description": "Hire expert services for home repairs, business consulting, legal advice, and event planning.",
        "children": [
            {"name": "Home Repairs & Maintenance", "slug": "home-repairs-and-plumbing"},
            {"name": "Business & Legal Services", "slug": "business-consulting-and-legal"},
            {"name": "Cleaning Services", "slug": "cleaning-and-sanitation-services"},
            {"name": "Events & Catering", "slug": "event-planning-and-catering"}
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
