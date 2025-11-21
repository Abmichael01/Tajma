from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.text import slugify

from api.models import Category
from api.utils.category_exporter import export_categories_to_json


CATEGORY_TREE = [
    {
        "name": "CVs (Hire Me)",
        "icon": "UserCheck",
        "type": "cv",
        "children": [
            {
                "name": "IT & Technology",
                "icon": "Code",
                "children": [
                    {
                        "name": "Programming",
                        "icon": "Terminal",
                        "children": [
                            {
                                "name": "Web Programming",
                                "icon": "Globe",
                                "custom_fields": [
                                    {
                                        "name": "education_level",
                                        "label": "Education Level",
                                        "type": "array",
                                        "children": [
                                            {"name": "institution", "label": "Institution", "type": "text", "required": True},
                                            {
                                                "name": "degree",
                                                "label": "Degree",
                                                "type": "text",
                                                "required": True,
                                                "options": [
                                                    {"value": "high-school", "label": "High School"},
                                                    {"value": "diploma", "label": "Diploma"},
                                                    {"value": "bachelor", "label": "Bachelor's Degree"},
                                                    {"value": "master", "label": "Master's Degree"},
                                                    {"value": "phd", "label": "PhD"},
                                                    {"value": "other", "label": "Other"}
                                                ]
                                            },
                                            {"name": "field", "label": "Field of Study", "type": "text", "required": False},
                                            {"name": "year", "label": "Year", "type": "number", "required": False}
                                        ],
                                        "required": False
                                    },
                                    {
                                        "name": "work_experience",
                                        "label": "Work Experience",
                                        "type": "array",
                                        "children": [
                                            {"name": "company", "label": "Company", "type": "text", "required": True},
                                            {"name": "position", "label": "Position", "type": "text", "required": True},
                                            {"name": "duration", "label": "Duration", "type": "text", "required": False},
                                            {"name": "description", "label": "Description", "type": "textarea", "required": False}
                                        ],
                                        "required": False
                                    },
                                    {
                                        "name": "skills",
                                        "label": "Skills",
                                        "type": "tags",
                                        "placeholder": "e.g., JavaScript, React, Node.js",
                                        "required": False
                                    },
                                    {
                                        "name": "experience_years",
                                        "label": "Years of Experience",
                                        "type": "number",
                                        "placeholder": "e.g., 5",
                                        "min": 0,
                                        "required": False
                                    }
                                ]
                            },
                            {
                                "name": "Desktop App Development",
                                "icon": "Monitor",
                                "custom_fields": [
                                    {
                                        "name": "education_level",
                                        "label": "Education Level",
                                        "type": "array",
                                        "children": [
                                            {"name": "institution", "label": "Institution", "type": "text", "required": True},
                                            {
                                                "name": "degree",
                                                "label": "Degree",
                                                "type": "text",
                                                "required": True,
                                                "options": [
                                                    {"value": "high-school", "label": "High School"},
                                                    {"value": "diploma", "label": "Diploma"},
                                                    {"value": "bachelor", "label": "Bachelor's Degree"},
                                                    {"value": "master", "label": "Master's Degree"},
                                                    {"value": "phd", "label": "PhD"},
                                                    {"value": "other", "label": "Other"}
                                                ]
                                            },
                                            {"name": "field", "label": "Field of Study", "type": "text", "required": False},
                                            {"name": "year", "label": "Year", "type": "number", "required": False}
                                        ],
                                        "required": False
                                    },
                                    {
                                        "name": "work_experience",
                                        "label": "Work Experience",
                                        "type": "array",
                                        "children": [
                                            {"name": "company", "label": "Company", "type": "text", "required": True},
                                            {"name": "position", "label": "Position", "type": "text", "required": True},
                                            {"name": "duration", "label": "Duration", "type": "text", "required": False},
                                            {"name": "description", "label": "Description", "type": "textarea", "required": False}
                                        ],
                                        "required": False
                                    },
                                    {
                                        "name": "skills",
                                        "label": "Skills",
                                        "type": "tags",
                                        "placeholder": "e.g., C#, Java, Python",
                                        "required": False
                                    },
                                    {
                                        "name": "experience_years",
                                        "label": "Years of Experience",
                                        "type": "number",
                                        "placeholder": "e.g., 5",
                                        "min": 0,
                                        "required": False
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    },
    {
        "name": "Jobs (Hire Talent)",
        "icon": "Briefcase",
        "type": "job",
        "custom_fields": [
            {
                "name": "job_type",
                "label": "Job Type",
                "type": "select",
                "options": [
                    {"value": "full-time", "label": "Full-time"},
                    {"value": "part-time", "label": "Part-time"},
                    {"value": "contract", "label": "Contract"},
                    {"value": "internship", "label": "Internship"},
                    {"value": "remote", "label": "Remote"}
                ],
                "required": True
            },
            {
                "name": "experience_level",
                "label": "Experience Level Required",
                "type": "select",
                "options": [
                    {"value": "entry", "label": "Entry Level"},
                    {"value": "mid", "label": "Mid Level (2-5 years)"},
                    {"value": "senior", "label": "Senior (5+ years)"},
                    {"value": "executive", "label": "Executive"}
                ],
                "required": True
            },
            {
                "name": "salary_range",
                "label": "Salary Range",
                "type": "text",
                "placeholder": "e.g., Fr 150,000 - Fr 250,000 monthly",
                "required": True
            },
            {
                "name": "education_required",
                "label": "Education Required",
                "type": "select",
                "options": [
                    {"value": "high-school", "label": "High School"},
                    {"value": "diploma", "label": "Diploma"},
                    {"value": "bachelor", "label": "Bachelor's Degree"},
                    {"value": "master", "label": "Master's Degree"},
                    {"value": "phd", "label": "PhD"},
                    {"value": "any", "label": "Any"}
                ],
                "required": False
            },
            {
                "name": "work_location",
                "label": "Work Location",
                "type": "text",
                "placeholder": "e.g., Remote, Niamey, Hybrid",
                "required": False
            },
            {
                "name": "application_deadline",
                "label": "Application Deadline",
                "type": "text",
                "placeholder": "e.g., 2024-12-31 or Open until filled",
                "required": False
            }
        ],
        "children": []
    },
    {
        "name": "Electronics & Gadgets",
        "icon": "Smartphone",
        "type": "product",
        "custom_fields": [
            {
                "name": "brand",
                "label": "Brand",
                "type": "text",
                "placeholder": "e.g., Apple, Samsung",
                "required": False
            },
            {
                "name": "model",
                "label": "Model",
                "type": "text",
                "placeholder": "e.g., iPhone 14 Pro Max",
                "required": False
            },
            {
                "name": "condition",
                "label": "Condition",
                "type": "select",
                "options": [
                    {"value": "new", "label": "New"},
                    {"value": "like-new", "label": "Like New"},
                    {"value": "excellent", "label": "Excellent"},
                    {"value": "good", "label": "Good"},
                    {"value": "fair", "label": "Fair"},
                    {"value": "poor", "label": "Poor"}
                ],
                "required": False
            }
        ],
        "children": [
            {
                "name": "Mobile Phones",
                "icon": "Phone",
                "children": [
                    {"name": "Android Phones", "icon": "Phone", "children": [
                        {"name": "Flagship", "icon": "Star"},
                        {"name": "Mid-range", "icon": "BadgeCheck"},
                        {"name": "Budget", "icon": "Wallet"}
                    ]},
                    {"name": "iPhones", "icon": "Smartphone"},
                ],
            },
            {
                "name": "Computers",
                "icon": "Laptop",
                "children": [
                    {"name": "Laptops", "icon": "Laptop"},
                    {"name": "Desktops", "icon": "Monitor", "children": [
                        {"name": "Gaming Desktops", "icon": "Gamepad"},
                        {"name": "Workstations", "icon": "Cpu"}
                    ]},
                ],
            },
        ],
    },
    {
        "name": "Vehicles & Mobility",
        "icon": "Car",
        "type": "product",
        "custom_fields": [
            {
                "name": "brand",
                "label": "Brand",
                "type": "text",
                "placeholder": "e.g., Toyota, Honda",
                "required": False
            },
            {
                "name": "year",
                "label": "Year",
                "type": "number",
                "placeholder": "e.g., 2023",
                "min": 1900,
                "max": 2025,
                "required": False
            },
            {
                "name": "mileage",
                "label": "Mileage (km)",
                "type": "number",
                "placeholder": "e.g., 45000",
                "min": 0,
                "required": False
            },
            {
                "name": "transmission",
                "label": "Transmission",
                "type": "select",
                "options": [
                    {"value": "manual", "label": "Manual"},
                    {"value": "automatic", "label": "Automatic"},
                    {"value": "cvt", "label": "CVT"}
                ],
                "required": False
            },
            {
                "name": "fuel_type",
                "label": "Fuel Type",
                "type": "select",
                "options": [
                    {"value": "petrol", "label": "Petrol"},
                    {"value": "diesel", "label": "Diesel"},
                    {"value": "electric", "label": "Electric"},
                    {"value": "hybrid", "label": "Hybrid"}
                ],
                "required": False
            }
        ],
        "children": [
            {
                "name": "Cars",
                "icon": "Car",
                "children": [
                    {"name": "Sedans", "icon": "Car"},
                    {"name": "SUVs", "icon": "Car"},
                ],
            },
            {
                "name": "Motorcycles",
                "icon": "Bike",
                "children": [
                    {"name": "Sport Bikes", "icon": "Activity"},
                    {"name": "Scooters", "icon": "Bike"},
                ],
            },
        ],
    },
    {
        "name": "Professional Services",
        "icon": "Wrench",
        "type": "service",
        "custom_fields": [
            {
                "name": "service_type",
                "label": "Service Type",
                "type": "text",
                "placeholder": "e.g., Web Development, Plumbing",
                "required": False
            },
            {
                "name": "experience_years",
                "label": "Years of Experience",
                "type": "number",
                "placeholder": "e.g., 5",
                "min": 0,
                "required": False
            },
            {
                "name": "availability",
                "label": "Availability",
                "type": "select",
                "options": [
                    {"value": "immediate", "label": "Immediate"},
                    {"value": "within-week", "label": "Within a Week"},
                    {"value": "within-month", "label": "Within a Month"},
                    {"value": "flexible", "label": "Flexible"}
                ],
                "required": False
            }
        ],
        "children": [
            {
                "name": "Home Improvement",
                "icon": "Hammer",
                "children": [
                    {"name": "Electricians", "icon": "Zap"},
                    {"name": "Plumbers", "icon": "Droplet"},
                ],
            },
            {
                "name": "Tech Services",
                "icon": "Laptop",
                "children": [
                    {"name": "Developers", "icon": "Code"},
                    {"name": "IT Support", "icon": "Headphones"},
                ],
            },
        ],
    },
]


class Command(BaseCommand):
    help = 'Seed the database with a starter set of hierarchical categories.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Delete existing categories before seeding.',
        )

    def handle(self, *args, **options):
        force = options.get('force', False)

        with transaction.atomic():
            if force:
                self.stdout.write('Clearing existing categories...')
                Category.objects.all().delete()

            self.stdout.write('Creating seed categories...')
            for order, node in enumerate(CATEGORY_TREE):
                self._create_category(node, parent=None, sort_order=order)

        export_categories_to_json()
        self.stdout.write(self.style.SUCCESS('Categories seeded successfully.'))

    def _create_category(self, node, parent=None, sort_order=0, level=0):
        slug = slugify(node['name'])
        defaults = {
            'name': node['name'],
            'icon': node.get('icon', ''),
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

