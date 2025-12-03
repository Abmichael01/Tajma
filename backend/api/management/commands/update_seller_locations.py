from django.core.management.base import BaseCommand
from django.db import transaction
from api.models import Region, User


class Command(BaseCommand):
    help = 'Update all seller locations to the first region (Niamey)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be updated without making changes',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        try:
            # Get first region (Niamey)
            first_region = Region.objects.order_by('sort_order', 'name').first()
            
            if not first_region:
                self.stdout.write(
                    self.style.ERROR('No regions found. Please run seed_regions first.')
                )
                return
            
            # Get all sellers
            sellers = User.objects.filter(is_seller=True)
            total_sellers = sellers.count()
            
            if total_sellers == 0:
                self.stdout.write(
                    self.style.WARNING('No sellers found.')
                )
                return
            
            # Count sellers that need updating
            sellers_to_update = sellers.filter(
                location__isnull=True
            ) | sellers.exclude(location=first_region)
            
            update_count = sellers_to_update.count()
            
            self.stdout.write(
                f'Found {total_sellers} sellers. {update_count} need location update.'
            )
            self.stdout.write(
                f'Setting all seller locations to: {first_region.name}'
            )
            
            if dry_run:
                self.stdout.write(
                    self.style.WARNING('\nDRY RUN - No changes will be made')
                )
                for seller in sellers_to_update[:10]:  # Show first 10
                    current_location = seller.location.name if seller.location else 'None'
                    self.stdout.write(
                        f'  Would update: {seller.email} (current: {current_location})'
                    )
                if update_count > 10:
                    self.stdout.write(f'  ... and {update_count - 10} more')
            else:
                with transaction.atomic():
                    updated = sellers_to_update.update(location=first_region)
                    
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'\nSuccessfully updated {updated} seller locations to {first_region.name}'
                        )
                    )
        
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error updating seller locations: {e}')
            )
            raise

