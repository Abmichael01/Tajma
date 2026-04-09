from api.models import User, Region
from django.db import transaction

def migrate_and_cleanup():
    old_region_ids = [1, 2, 3, 4, 5, 6, 7, 8]
    users_with_old_regions = User.objects.filter(location_id__in=old_region_ids)
    print(f"Found {users_with_old_regions.count()} users with old regions.")

    with transaction.atomic():
        for user in users_with_old_regions:
            old_region_name = user.location.name
            new_region = Region.objects.filter(name=old_region_name, p_code__isnull=False).first()
            if new_region:
                user.location = new_region
                user.save()
                print(f"Migrated User {user.email} from {old_region_name} (old) to {new_region.name} (new)")
            else:
                print(f"Warning: Could not find new region for {old_region_name}")

        deleted, _ = Region.objects.filter(id__in=old_region_ids).delete()
        print(f"Deleted {deleted} old region records.")

if __name__ == "__main__":
    migrate_and_cleanup()
