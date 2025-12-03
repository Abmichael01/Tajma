from django.core.management.base import BaseCommand
from django.db import transaction
from api.models import Region


REGIONS = [
    {'name': 'Niamey', 'sort_order': 1},
    {'name': 'Agadez', 'sort_order': 2},
    {'name': 'Diffa', 'sort_order': 3},
    {'name': 'Dosso', 'sort_order': 4},
    {'name': 'Maradi', 'sort_order': 5},
    {'name': 'Tahoua', 'sort_order': 6},
    {'name': 'Tillabéri', 'sort_order': 7},
    {'name': 'Zinder', 'sort_order': 8},
]


class Command(BaseCommand):
    help = 'Seed the database with Niger regions'

    def handle(self, *args, **options):
        with transaction.atomic():
            created_count = 0
            updated_count = 0
            
            for region_data in REGIONS:
                region, created = Region.objects.get_or_create(
                    name=region_data['name'],
                    defaults={
                        'sort_order': region_data['sort_order'],
                        'is_active': True
                    }
                )
                
                if created:
                    created_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(f'Created region: {region.name}')
                    )
                else:
                    # Update sort_order if it changed
                    if region.sort_order != region_data['sort_order']:
                        region.sort_order = region_data['sort_order']
                        region.save(update_fields=['sort_order'])
                        updated_count += 1
                        self.stdout.write(
                            self.style.WARNING(f'Updated region: {region.name}')
                        )
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'\nSuccessfully seeded regions: {created_count} created, {updated_count} updated'
                )
            )

