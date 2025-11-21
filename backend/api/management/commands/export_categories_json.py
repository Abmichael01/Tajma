from django.core.management.base import BaseCommand

from api.utils.category_exporter import export_categories_to_json


class Command(BaseCommand):
    help = 'Export active categories to the CDN JSON file.'

    def handle(self, *args, **options):
        path = export_categories_to_json()
        self.stdout.write(self.style.SUCCESS(f'Categories exported to {path}'))

