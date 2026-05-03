import os, sys, django, uuid
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'serverConfig.settings')
django.setup()

from api.models import Ad, Promotion, PromotionPackage, Transaction, User

def test():
    # 1. Get/Create a user and an ad
    user = User.objects.first()
    if not user:
        print("No users found!")
        return
        
    ad = Ad.objects.filter(seller=user).first()
    if not ad:
        print("No ads found for user!")
        return

    print(f"Testing with Ad: {ad.title}")
    print(f"Initial rank: {ad.promotion_rank}, Featured: {ad.is_featured}")

    # 2. Create a package
    package, _ = PromotionPackage.objects.get_or_create(
        name="Test Featured",
        promotion_type="featured",
        price=Decimal("1000.00"),
        duration_days=7,
        defaults={'is_active': True}
    )

    # 3. Create a transaction
    tx = Transaction.objects.create(
        user=user,
        reference=str(uuid.uuid4())[:8],
        amount=package.price,
        status='success'
    )

    # 4. Create a promotion (should trigger ad update)
    promo = Promotion.objects.create(
        ad=ad,
        promotion_type='featured',
        package=package,
        transaction=tx,
        start_at=timezone.now(),
        end_at=timezone.now() + timedelta(days=7)
    )

    ad.refresh_from_db()
    print(f"After Promo: rank={ad.promotion_rank}, Featured={ad.is_featured}")
    
    if ad.is_featured and ad.promotion_rank == 100:
        print("✅ Promotion sync success!")
    else:
        print("❌ Promotion sync failed!")

    # 5. Test management command cleanup
    promo.end_at = timezone.now() - timedelta(minutes=1)
    promo.save()
    
    print("Running update_promotions command...")
    from django.core.management import call_command
    call_command('update_promotions')
    
    ad.refresh_from_db()
    print(f"After Cleanup: rank={ad.promotion_rank}, Featured={ad.is_featured}")
    
    if not ad.is_featured and ad.promotion_rank == 0:
        print("✅ Cleanup success!")
    else:
        print("❌ Cleanup failed!")

if __name__ == "__main__":
    test()
