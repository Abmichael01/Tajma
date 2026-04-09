import json
import os
from django.core.management.base import BaseCommand
from django.db import transaction
from api.models import Region

class Command(BaseCommand):
    help = 'Seed Niger locations (Regions, Departments, Communes) from GeoJSON files'

    def add_arguments(self, parser):
        parser.add_argument('--path', type=str, default='/tmp/ner_admin', help='Path to unzipped GeoJSON files')

    def handle(self, *args, **options):
        path = options['path']
        
        adm1_file = os.path.join(path, 'ner_admin1.geojson')
        adm2_file = os.path.join(path, 'ner_admin2.geojson')
        adm3_file = os.path.join(path, 'ner_admin3.geojson')

        if not all(os.path.exists(f) for f in [adm1_file, adm2_file, adm3_file]):
            self.stdout.write(self.style.ERROR(f"Error: Required GeoJSON files not found in {path}"))
            return

        with transaction.atomic():
            # 1. Process ADM1 (Regions)
            self.stdout.write("Processing ADM1 (Regions)...")
            with open(adm1_file, 'r', encoding='utf-8') as f:
                adm1_data = json.load(f)
                for feature in adm1_data['features']:
                    props = feature['properties']
                    name = props['adm1_name']
                    p_code = props['adm1_pcode']
                    
                    region, created = Region.objects.update_or_create(
                        p_code=p_code,
                        defaults={
                            'name': name,
                            'level': 1,
                            'parent': None
                        }
                    )
                    status = "Created" if created else "Updated"
                    self.stdout.write(f"  {status} Region: {name} ({p_code})")

            # 2. Process ADM2 (Departments)
            self.stdout.write("\nProcessing ADM2 (Departments)...")
            with open(adm2_file, 'r', encoding='utf-8') as f:
                adm2_data = json.load(f)
                for feature in adm2_data['features']:
                    props = feature['properties']
                    name = props['adm2_name']
                    p_code = props['adm2_pcode']
                    parent_p_code = props['adm1_pcode']
                    
                    try:
                        parent = Region.objects.get(p_code=parent_p_code)
                        dept, created = Region.objects.update_or_create(
                            p_code=p_code,
                            defaults={
                                'name': name,
                                'level': 2,
                                'parent': parent
                            }
                        )
                        status = "Created" if created else "Updated"
                        # Only show created or updated with changed parent
                    except Region.DoesNotExist:
                        self.stdout.write(self.style.WARNING(f"  Skip Dept: {name} (Parent {parent_p_code} not found)"))

            # 3. Process ADM3 (Communes)
            self.stdout.write("\nProcessing ADM3 (Communes)...")
            with open(adm3_file, 'r', encoding='utf-8') as f:
                adm3_data = json.load(f)
                for feature in adm3_data['features']:
                    props = feature['properties']
                    name = props['adm3_name']
                    p_code = props['adm3_pcode']
                    parent_p_code = props['adm2_pcode']
                    
                    try:
                        parent = Region.objects.get(p_code=parent_p_code)
                        commune, created = Region.objects.update_or_create(
                            p_code=p_code,
                            defaults={
                                'name': name,
                                'level': 3,
                                'parent': parent
                            }
                        )
                    except Region.DoesNotExist:
                        self.stdout.write(self.style.WARNING(f"  Skip Commune: {name} (Parent {parent_p_code} not found)"))

        self.stdout.write(self.style.SUCCESS("\nSuccessfully seeded all locations!"))
