from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import Promotion, Ad
from django.db.models import Max

class Command(BaseCommand):
    help = 'Updates ad promotion status and cleans up expired promotions'

    def handle(self, *args, **options):
        now = timezone.now()
        self.stdout.write(f"Starting promotion update at {now}")

        # 1. Deactivate expired promotions
        expired = Promotion.objects.filter(is_active=True, end_at__lt=now)
        expired_count = expired.count()
        if expired_count > 0:
            self.stdout.write(f"Deactivating {expired_count} expired promotions...")
            expired.update(is_active=False)

        # 2. Re-calculate denormalized fields for all ads that ever had a promotion 
        # (or just all ads to be safe, but targeting is better)
        # We find ads that currently have active promotions
        active_promotions = Promotion.objects.filter(is_active=True, start_at__lte=now)
        ad_ids_with_active = active_promotions.values_list('ad_id', flat=True).distinct()

        # Update ads with active promotions
        for ad_id in ad_ids_with_active:
            promotions = Promotion.objects.filter(ad_id=ad_id, is_active=True, start_at__lte=now)
            is_featured = promotions.filter(promotion_type='featured').exists()
            max_rank = 0
            if is_featured:
                max_rank = 100
            elif promotions.filter(promotion_type='boost').exists():
                max_rank = 50
            
            Ad.objects.filter(id=ad_id).update(is_featured=is_featured, promotion_rank=max_rank)

        # 3. Reset ads that no longer have active promotions but still have a rank
        ads_to_reset = Ad.objects.filter(promotion_rank__gt=0).exclude(id__in=ad_ids_with_active)
        reset_count = ads_to_reset.count()
        if reset_count > 0:
            self.stdout.write(f"Resetting promotion status for {reset_count} ads...")
            ads_to_reset.update(is_featured=False, promotion_rank=0)

        self.stdout.write(self.style.SUCCESS("Promotion update complete."))
