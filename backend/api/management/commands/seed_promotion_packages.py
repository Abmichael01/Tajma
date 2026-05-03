from django.core.management.base import BaseCommand
from api.models.promotion_package import PromotionPackage

class Command(BaseCommand):
    help = 'Seed promotion packages with tiered pricing and durations'

    def handle(self, *args, **kwargs):
        packages = [
            # Boost Packages
            {
                'name': '1 Day Boost',
                'description': 'Visibility boost for 24 hours. Ideal for quick sales.',
                'promotion_type': 'boost',
                'price': 250,
                'duration_days': 1
            },
            {
                'name': '7 Days Boost',
                'description': 'Standard weekly boost. Perfect balance of price and exposure.',
                'promotion_type': 'boost',
                'price': 1000,
                'duration_days': 7
            },
            {
                'name': '30 Days Boost',
                'description': 'Maximum value monthly boost for long-term inventory.',
                'promotion_type': 'boost',
                'price': 3500,
                'duration_days': 30
            },
            
            # Featured Packages
            {
                'name': '1 Day Featured',
                'description': 'Top of search results for 24 hours. Grab attention fast.',
                'promotion_type': 'featured',
                'price': 1500,
                'duration_days': 1
            },
            {
                'name': '7 Days Featured',
                'description': 'Our most popular featured package. High visibility for a week.',
                'promotion_type': 'featured',
                'price': 5000,
                'duration_days': 7
            },
            {
                'name': '30 Days Featured',
                'description': 'Elite monthly placement. Dominate your category for 30 days.',
                'promotion_type': 'featured',
                'price': 15000,
                'duration_days': 30
            },
        ]

        self.stdout.write('Seeding promotion packages...')
        
        for pkg_data in packages:
            pkg, created = PromotionPackage.objects.get_or_create(
                promotion_type=pkg_data['promotion_type'],
                duration_days=pkg_data['duration_days'],
                defaults={
                    'name': pkg_data['name'],
                    'description': pkg_data['description'],
                    'price': pkg_data['price'],
                    'is_active': True
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created package: {pkg.name}"))
            else:
                self.stdout.write(f"Package already exists: {pkg.name}")

        self.stdout.write(self.style.SUCCESS('Successfully seeded promotion packages.'))
