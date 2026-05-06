import requests
from django.core.management.base import BaseCommand
from api.models import Country, Region
from django.utils.text import slugify

class Command(BaseCommand):
    help = 'Seed official location data down to Level 2 (Department/Cercle/Province)'

    def handle(self, *args, **options):
        countries_config = [
            {'code': 'NE', 'iso3': 'NER', 'name': 'Niger', 'flag': '🇳🇪'},
            {'code': 'ML', 'iso3': 'MLI', 'name': 'Mali', 'flag': '🇲🇱'},
            {'code': 'BF', 'iso3': 'BFA', 'name': 'Burkina Faso', 'flag': '🇧🇫'},
        ]

        # First, clear existing to ensure clean slate with official names
        # Region.objects.all().delete() 
        # (Optional: uncomment if you want to wipe previous experiments)

        for config in countries_config:
            self.stdout.write(f"Processing {config['name']}...")
            
            country, created = Country.objects.get_or_create(
                code=config['code'],
                defaults={
                    'name': config['name'],
                    'flag_emoji': config['flag'],
                    'is_active': True
                }
            )

            # 1. Sync ADM1 (Regions)
            adm1_map = self.seed_level(country, config['iso3'], 'ADM1', None)

            # 2. Sync ADM2 (Cercles/Provinces/Departments)
            self.seed_level(country, config['iso3'], 'ADM2', adm1_map)

        self.stdout.write(self.style.SUCCESS('Final Lean Seeding completed!'))

    def seed_level(self, country, iso3, level, parent_map):
        api_url = f"https://www.geoboundaries.org/api/current/gbOpen/{iso3}/{level}/"
        current_level_map = {}
        
        try:
            res = requests.get(api_url)
            res.raise_for_status()
            metadata = res.json()
            gj_url = metadata.get('gjDownloadURL')
            if not gj_url: return {}

            self.stdout.write(f"  Fetching {level} for {country.name}...")
            gj_res = requests.get(gj_url)
            gj_res.raise_for_status()
            data = gj_res.json()

            for feature in data.get('features', []):
                props = feature.get('properties', {})
                name = props.get('shapeName')
                shape_id = props.get('shapeID', '')
                if not name: continue

                sub_type = "Region" if level == 'ADM1' else "Subdivision"
                if iso3 == 'MLI' and level == 'ADM2': sub_type = "Cercle"
                elif iso3 == 'BFA' and level == 'ADM2': sub_type = "Province"
                elif iso3 == 'NER' and level == 'ADM2': sub_type = "Département"

                slug = slugify(f"{name}-{sub_type}-{country.code}-{shape_id[-4:]}")
                full_name = f"{name}, {country.name}"

                parent = None
                if parent_map:
                    for p_id, p_obj in parent_map.items():
                        if p_id in shape_id:
                            parent = p_obj
                            full_name = f"{name}, {parent.name}, {country.name}"
                            break

                region, created = Region.objects.update_or_create(
                    slug=slug,
                    defaults={
                        'name': name,
                        'country': country,
                        'level': int(level[-1]),
                        'subdivision_type': sub_type,
                        'full_name': full_name,
                        'parent': parent,
                        'is_active': True
                    }
                )
                
                id_part = shape_id.split('-')[-1] if '-' in shape_id else shape_id[-10:]
                current_level_map[id_part] = region
                
            self.stdout.write(self.style.SUCCESS(f"  Synced {len(data.get('features', []))} units"))
            return current_level_map

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"  Error: {str(e)}"))
            return {}
