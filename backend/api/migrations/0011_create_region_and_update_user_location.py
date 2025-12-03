# Generated migration for Region model and User.location ForeignKey

from django.db import migrations, models
import django.db.models.deletion
from django.utils.text import slugify


def copy_location_data(apps, schema_editor):
    """Copy existing location CharField data to location_old"""
    User = apps.get_model('api', 'User')
    # The location field still exists at this point, so we copy it
    for user in User.objects.all():
        if hasattr(user, 'location') and user.location:
            # Store the old location string value
            user.location_old = user.location if isinstance(user.location, str) else ''
            user.save(update_fields=['location_old'])


def create_regions_and_migrate_locations(apps, schema_editor):
    """Create regions and migrate existing location strings to Region objects"""
    Region = apps.get_model('api', 'Region')
    User = apps.get_model('api', 'User')
    
    # Create all Niger regions
    regions_data = [
        {'name': 'Niamey', 'sort_order': 1},
        {'name': 'Agadez', 'sort_order': 2},
        {'name': 'Diffa', 'sort_order': 3},
        {'name': 'Dosso', 'sort_order': 4},
        {'name': 'Maradi', 'sort_order': 5},
        {'name': 'Tahoua', 'sort_order': 6},
        {'name': 'Tillabéri', 'sort_order': 7},
        {'name': 'Zinder', 'sort_order': 8},
    ]
    
    # Create regions with explicit slugs
    region_map = {}
    for region_data in regions_data:
        # Generate slug manually
        base_slug = slugify(region_data['name'])
        slug = base_slug
        counter = 1
        # Check if slug exists and generate unique one
        while Region.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        # Use update_or_create to handle existing regions
        region, created = Region.objects.update_or_create(
            name=region_data['name'],
            defaults={
                'slug': slug,
                'sort_order': region_data['sort_order'],
                'is_active': True
            }
        )
        region_map[region_data['name']] = region
    
    # Get default region (Niamey)
    default_region = region_map.get('Niamey')
    
    # Migrate existing user locations from location_old
    for user in User.objects.all():
        location_str = getattr(user, 'location_old', '') or ''
        # Try to find matching region by name (case-insensitive)
        region = None
        if location_str:
            for region_name, region_obj in region_map.items():
                if location_str.lower() == region_name.lower():
                    region = region_obj
                    break
        
        # If no match found, use default region
        if not region:
            region = default_region
        
        if region:
            user.location_new = region
            user.save(update_fields=['location_new'])


def reverse_migration(apps, schema_editor):
    """Reverse migration: convert Region ForeignKey back to CharField"""
    User = apps.get_model('api', 'User')
    
    for user in User.objects.exclude(location_new__isnull=True):
        user.location_old = user.location_new.name if user.location_new else ''
        user.save(update_fields=['location_old'])


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0010_adview_and_more'),
    ]

    operations = [
        # Create Region model
        migrations.CreateModel(
            name='Region',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255, unique=True)),
                ('slug', models.SlugField(blank=True, max_length=255, unique=True)),
                ('is_active', models.BooleanField(default=True)),
                ('sort_order', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Region',
                'verbose_name_plural': 'Regions',
                'ordering': ['sort_order', 'name'],
            },
        ),
        # Add temporary fields
        migrations.AddField(
            model_name='user',
            name='location_old',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name='user',
            name='location_new',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='users_temp',
                to='api.region'
            ),
        ),
        # Copy existing location to location_old
        migrations.RunPython(
            copy_location_data,
            reverse_code=migrations.RunPython.noop,
        ),
        # Migrate data from location_old to location_new
        migrations.RunPython(create_regions_and_migrate_locations, reverse_migration),
        # Remove old location field and rename location_new to location
        migrations.RemoveField(
            model_name='user',
            name='location',
        ),
        migrations.RenameField(
            model_name='user',
            old_name='location_new',
            new_name='location',
        ),
        # Remove temporary location_old field
        migrations.RemoveField(
            model_name='user',
            name='location_old',
        ),
    ]
