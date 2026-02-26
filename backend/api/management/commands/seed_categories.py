from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.text import slugify

from api.models import Category
from api.utils.category_exporter import export_categories_to_json
from api.management.commands.category_seeds.electronics import ELECTRONICS_CATEGORY
from api.management.commands.category_seeds.vehicles import VEHICLES_CATEGORY
from api.management.commands.category_seeds.property import PROPERTY_CATEGORY
from api.management.commands.category_seeds.fashion import FASHION_CATEGORY
from api.management.commands.category_seeds.home_garden import HOME_GARDEN_CATEGORY
from api.management.commands.category_seeds.beauty_health import BEAUTY_HEALTH_CATEGORY
from api.management.commands.category_seeds.services import SERVICES_CATEGORY
from api.management.commands.category_seeds.jobs import JOBS_CATEGORY

# Combined category tree from all seed modules
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

