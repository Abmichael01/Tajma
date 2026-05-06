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
            {"name": "Cars", "slug": "cars", "icon": "Car"},
            {"name": "Motorcycles", "slug": "motorcycles", "icon": "Bike"},
            {"name": "Trucks & Commercial", "slug": "trucks", "icon": "Truck"},
            {"name": "Auto Parts & Accessories", "slug": "auto-parts", "icon": "Wrench"},
            {"name": "Buses & Microbuses", "slug": "buses", "icon": "Bus"},
            {"name": "Watercraft & Boats", "slug": "watercraft", "icon": "Ship"}
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
            {"name": "Houses & Apartments for Sale", "slug": "houses-for-sale", "icon": "Home"},
            {"name": "Houses & Apartments for Rent", "slug": "houses-for-rent", "icon": "Key"},
            {"name": "Land & Plots", "slug": "land-for-sale", "icon": "Map"},
            {"name": "Commercial Property", "slug": "commercial-property", "icon": "Building"},
            {"name": "Short Let Property", "slug": "short-lets", "icon": "Calendar"},
            {"name": "Event Centers & Venues", "slug": "venues", "icon": "PartyPopper"}
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
            {"name": "Mobile Phones", "slug": "mobile-phones", "icon": "Smartphone"},
            {"name": "Tablets", "slug": "tablets", "icon": "Tablet"},
            {"name": "Smartwatches", "slug": "smartwatches", "icon": "Watch"},
            {"name": "Phone Accessories", "slug": "phone-accessories", "icon": "Headphones"},
            {"name": "Power Banks", "slug": "power-banks", "icon": "Battery"},
            {"name": "SIM Cards & Data", "slug": "sim-cards", "icon": "Wifi"}
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
            {"name": "Computers & Laptops", "slug": "computers-laptops", "icon": "Laptop"},
            {"name": "TV & Audio", "slug": "tv-audio", "icon": "Tv"},
            {"name": "Video Games & Consoles", "slug": "video-games", "icon": "Gamepad2"},
            {"name": "Cameras & Lenses", "slug": "cameras", "icon": "Camera"},
            {"name": "Security & Surveillance", "slug": "security", "icon": "Shield"},
            {"name": "Printers & Scanners", "slug": "printers", "icon": "Printer"}
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
            {"name": "Living Room Furniture", "slug": "living-room", "icon": "Sofa"},
            {"name": "Kitchen Appliances", "slug": "kitchen-appliances", "icon": "ChefHat"},
            {"name": "Home Decor", "slug": "home-decor", "icon": "Lamp"},
            {"name": "Bedroom Furniture", "slug": "bedroom-furniture", "icon": "Bed"},
            {"name": "Office Furniture", "slug": "office-furniture", "icon": "Briefcase"},
            {"name": "Outdoor & Garden", "slug": "outdoor-garden", "icon": "TreeDeciduous"}
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
            {"name": "Clothing", "slug": "clothing", "icon": "Shirt"},
            {"name": "Shoes", "slug": "shoes", "icon": "Footprints"},
            {"name": "Watches & Jewelry", "slug": "watches-jewelry", "icon": "Watch"},
            {"name": "Bags & Accessories", "slug": "bags", "icon": "Briefcase"},
            {"name": "Wedding Wear", "slug": "wedding-wear", "icon": "Heart"},
            {"name": "Kids Fashion", "slug": "kids-fashion", "icon": "Baby"}
        ]
    },
    {
        "name": "Beauty & Personal Care",
        "slug": "beauty-personal-care",
        "icon": "Sparkles",
        "type": "product",
        "description": "Skincare, makeup, hair care, and fragrances.",
        "children": [
            {"name": "Makeup", "slug": "makeup", "icon": "Palette"},
            {"name": "Hair Care", "slug": "hair-care", "icon": "Scissors"},
            {"name": "Fragrances", "slug": "fragrances", "icon": "Wind"},
            {"name": "Skin Care", "slug": "skin-care", "icon": "Sparkles"},
            {"name": "Vitamins & Supplements", "slug": "vitamins", "icon": "Pill"}
        ]
    },
    {
        "name": "Services",
        "slug": "services",
        "icon": "Briefcase",
        "type": "service",
        "description": "Professional services, cleaning, catering, and more.",
        "children": [
            {"name": "Cleaning Services", "slug": "cleaning-services", "icon": "Sparkles"},
            {"name": "Legal Services", "slug": "legal-services", "icon": "Scale"},
            {"name": "Catering & Events", "slug": "catering", "icon": "Utensils"},
            {"name": "Education & Tutoring", "slug": "education", "icon": "BookOpen"},
            {"name": "Health & Wellness", "slug": "health-wellness", "icon": "HeartPulse"},
            {"name": "Creative & Design", "slug": "creative-design", "icon": "PenTool"}
        ]
    },
    {
        "name": "Repair & Construction",
        "slug": "repair-construction",
        "icon": "Wrench",
        "type": "service",
        "children": [
            {"name": "Plumbing", "slug": "plumbing", "icon": "Droplet"},
            {"name": "Electrical", "slug": "electrical", "icon": "Zap"},
            {"name": "Building Materials", "slug": "building-materials", "icon": "BrickWall"},
            {"name": "Painting & Decorating", "slug": "painting", "icon": "Paintbrush"},
            {"name": "Roofing", "slug": "roofing", "icon": "Home"},
            {"name": "Tools & Hardware", "slug": "tools", "icon": "Hammer"}
        ]
    },
    {
        "name": "Commercial Equipment & Tools",
        "slug": "commercial-equipment",
        "icon": "Truck",
        "type": "product",
        "children": [
            {"name": "Industrial Machinery", "slug": "machinery", "icon": "Factory"},
            {"name": "Medical Supplies", "slug": "medical-supplies", "icon": "Stethoscope"},
            {"name": "Restaurant Equipment", "slug": "restaurant-equipment", "icon": "UtensilsCrossed"},
            {"name": "Stationery & Office Supplies", "slug": "stationery", "icon": "Paperclip"}
        ]
    },
    {
        "name": "Leisure & Activities",
        "slug": "leisure-activities",
        "icon": "Ticket",
        "type": "product",
        "children": [
            {"name": "Sports Equipment", "slug": "sports", "icon": "Trophy"},
            {"name": "Musical Instruments", "slug": "music", "icon": "Music"},
            {"name": "Books & Games", "slug": "books", "icon": "Book"},
            {"name": "Event Tickets", "slug": "tickets", "icon": "Ticket"},
            {"name": "Travel Packages", "slug": "travel", "icon": "Plane"},
            {"name": "Bicycles", "slug": "bicycles", "icon": "Bike"}
        ]
    },
    {
        "name": "Babies & Kids",
        "slug": "babies-kids",
        "icon": "Heart",
        "type": "product",
        "children": [
            {"name": "Toys", "slug": "toys", "icon": "Gamepad"},
            {"name": "Kids Clothing", "slug": "kids-clothing", "icon": "Shirt"},
            {"name": "Baby Gear", "slug": "baby-gear", "icon": "Baby"},
            {"name": "Baby Food", "slug": "baby-food", "icon": "Cookie"},
            {"name": "Strollers & Prams", "slug": "strollers", "icon": "Car"}
        ]
    },
    {
        "name": "Food, Agriculture & Farming",
        "slug": "food-agriculture",
        "icon": "Leaf",
        "type": "product",
        "children": [
            {"name": "Farm Produce", "slug": "produce", "icon": "Carrot"},
            {"name": "Livestock", "slug": "livestock", "icon": "Cow"},
            {"name": "Processed Foods", "slug": "processed-foods", "icon": "Coffee"},
            {"name": "Feeds & Supplements", "slug": "feeds", "icon": "Wheat"},
            {"name": "Farm Machinery", "slug": "farm-machinery", "icon": "Tractor"}
        ]
    },
    {
        "name": "Animals & Pets",
        "slug": "animals-pets",
        "icon": "Paw",
        "type": "product",
        "children": [
            {"name": "Dogs", "slug": "dogs", "icon": "Dog"},
            {"name": "Cats", "slug": "cats", "icon": "Cat"},
            {"name": "Pet Accessories", "slug": "pet-accessories", "icon": "Bone"},
            {"name": "Birds", "slug": "birds", "icon": "Bird"},
            {"name": "Fish & Reptiles", "slug": "fish", "icon": "Fish"}
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
