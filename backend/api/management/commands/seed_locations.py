import json
from django.core.management.base import BaseCommand
from api.models import Country, Region
from django.utils.text import slugify

class Command(BaseCommand):
    help = 'Seed countries and administrative subdivisions (Regions, Departments, Cercles, Provinces)'

    def handle(self, *args, **options):
        self.stdout.write('Seeding Countries...')
        
        countries_data = [
            {'name': 'Niger', 'code': 'NE', 'flag_emoji': '🇳🇪'},
            {'name': 'Mali', 'code': 'ML', 'flag_emoji': '🇲🇱'},
            {'name': 'Burkina Faso', 'code': 'BF', 'flag_emoji': '🇧🇫'},
        ]

        countries = {}
        for data in countries_data:
            country, created = Country.objects.get_or_create(
                code=data['code'],
                defaults={
                    'name': data['name'],
                    'flag_emoji': data['flag_emoji']
                }
            )
            countries[data['code']] = country
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created Country: {country.name}'))

        niger = countries['NE']

        # SEED NIGER DATA
        self.stdout.write('Seeding Niger subdivisions...')
        niger_data = [
            {
                'name': 'Niamey',
                'type': 'Région',
                'children': [
                    {'name': 'Commune I', 'type': 'Commune'},
                    {'name': 'Commune II', 'type': 'Commune'},
                    {'name': 'Commune III', 'type': 'Commune'},
                    {'name': 'Commune IV', 'type': 'Commune'},
                    {'name': 'Commune V', 'type': 'Commune'},
                ]
            },
            {
                'name': 'Agadez',
                'type': 'Région',
                'children': [
                    {'name': 'Arlit', 'type': 'Département'},
                    {'name': 'Bilma', 'type': 'Département'},
                    {'name': 'Tchirozérine', 'type': 'Département'},
                ]
            },
            {
                'name': 'Maradi',
                'type': 'Région',
                'children': [
                    {'name': 'Aguié', 'type': 'Département'},
                    {'name': 'Dakoro', 'type': 'Département'},
                    {'name': 'Madarounfa', 'type': 'Département'},
                ]
            },
            {
                'name': 'Zinder',
                'type': 'Région',
                'children': [
                    {'name': 'Mirriah', 'type': 'Département'},
                    {'name': 'Magaria', 'type': 'Département'},
                    {'name': 'Tanout', 'type': 'Département'},
                ]
            }
        ]
        self.seed_subdivisions(niger, niger_data)

        # SEED MALI DATA
        self.stdout.write('Seeding Mali subdivisions...')
        mali = countries['ML']
        mali_data = [
            {
                'name': 'District de Bamako',
                'type': 'Région',
                'children': [
                    {'name': 'Commune I', 'type': 'Commune'},
                    {'name': 'Commune II', 'type': 'Commune'},
                    {'name': 'Commune III', 'type': 'Commune'},
                    {'name': 'Commune IV', 'type': 'Commune'},
                    {'name': 'Commune V', 'type': 'Commune'},
                    {'name': 'Commune VI', 'type': 'Commune'},
                ]
            },
            {
                'name': 'Kayes',
                'type': 'Région',
                'children': [
                    {'name': 'Kayes', 'type': 'Cercle'},
                    {'name': 'Bafoulabé', 'type': 'Cercle'},
                    {'name': 'Diéma', 'type': 'Cercle'},
                    {'name': 'Kita', 'type': 'Cercle'},
                    {'name': 'Kéniéba', 'type': 'Cercle'},
                    {'name': 'Nioro du Sahel', 'type': 'Cercle'},
                    {'name': 'Yélimané', 'type': 'Cercle'},
                ]
            },
            {
                'name': 'Koulikoro',
                'type': 'Région',
                'children': [
                    {'name': 'Koulikoro', 'type': 'Cercle'},
                    {'name': 'Banamba', 'type': 'Cercle'},
                    {'name': 'Dioïla', 'type': 'Cercle'},
                    {'name': 'Kangaba', 'type': 'Cercle'},
                    {'name': 'Kolokani', 'type': 'Cercle'},
                    {'name': 'Nara', 'type': 'Cercle'},
                    {'name': 'Kati', 'type': 'Cercle'},
                ]
            },
            {
                'name': 'Sikasso',
                'type': 'Région',
                'children': [
                    {'name': 'Sikasso', 'type': 'Cercle'},
                    {'name': 'Bougouni', 'type': 'Cercle'},
                    {'name': 'Kadiolo', 'type': 'Cercle'},
                    {'name': 'Kolondiéba', 'type': 'Cercle'},
                    {'name': 'Koutiala', 'type': 'Cercle'},
                    {'name': 'Yanfolila', 'type': 'Cercle'},
                    {'name': 'Yorosso', 'type': 'Cercle'},
                ]
            },
            {
                'name': 'Ségou',
                'type': 'Région',
                'children': [
                    {'name': 'Ségou', 'type': 'Cercle'},
                    {'name': 'Bla', 'type': 'Cercle'},
                    {'name': 'Barouéli', 'type': 'Cercle'},
                    {'name': 'Macina', 'type': 'Cercle'},
                    {'name': 'Niono', 'type': 'Cercle'},
                    {'name': 'San', 'type': 'Cercle'},
                    {'name': 'Tominian', 'type': 'Cercle'},
                ]
            },
            {
                'name': 'Mopti',
                'type': 'Région',
                'children': [
                    {'name': 'Mopti', 'type': 'Cercle'},
                    {'name': 'Bandiagara', 'type': 'Cercle'},
                    {'name': 'Bankass', 'type': 'Cercle'},
                    {'name': 'Djenné', 'type': 'Cercle'},
                    {'name': 'Douentza', 'type': 'Cercle'},
                    {'name': 'Koro', 'type': 'Cercle'},
                    {'name': 'Ténenkou', 'type': 'Cercle'},
                    {'name': 'Youwarou', 'type': 'Cercle'},
                ]
            },
            {
                'name': 'Tombouctou',
                'type': 'Région',
                'children': [
                    {'name': 'Tombouctou', 'type': 'Cercle'},
                    {'name': 'Diré', 'type': 'Cercle'},
                    {'name': 'Goundam', 'type': 'Cercle'},
                    {'name': 'Gourma-Rharous', 'type': 'Cercle'},
                    {'name': 'Niafunké', 'type': 'Cercle'},
                ]
            },
            {
                'name': 'Gao',
                'type': 'Région',
                'children': [
                    {'name': 'Gao', 'type': 'Cercle'},
                    {'name': 'Ansongo', 'type': 'Cercle'},
                    {'name': 'Bourem', 'type': 'Cercle'},
                    {'name': 'Ménaka', 'type': 'Cercle'},
                ]
            }
        ]

        self.seed_subdivisions(mali, mali_data)

        # SEED BURKINA FASO DATA
        self.stdout.write('Seeding Burkina Faso subdivisions...')
        burkina = countries['BF']
        burkina_data = [
            {
                'name': 'Centre',
                'type': 'Région',
                'children': [
                    {
                        'name': 'Kadiogo', 
                        'type': 'Province',
                        'children': [
                            {'name': 'Ouagadougou', 'type': 'Commune'},
                            {'name': 'Komki-Ipala', 'type': 'Commune'},
                            {'name': 'Komsilga', 'type': 'Commune'},
                            {'name': 'Koubri', 'type': 'Commune'},
                            {'name': 'Saaba', 'type': 'Commune'},
                            {'name': 'Tanghin-Dassouri', 'type': 'Commune'},
                        ]
                    }
                ]
            },
            {
                'name': 'Hauts-Bassins',
                'type': 'Région',
                'children': [
                    {'name': 'Houet', 'type': 'Province'},
                    {'name': 'Kénédougou', 'type': 'Province'},
                    {'name': 'Tuy', 'type': 'Province'},
                ]
            },
            {
                'name': 'Boucle du Mouhoun',
                'type': 'Région',
                'children': [
                    {'name': 'Balé', 'type': 'Province'},
                    {'name': 'Banwa', 'type': 'Province'},
                    {'name': 'Kossi', 'type': 'Province'},
                    {'name': 'Mouhoun', 'type': 'Province'},
                    {'name': 'Nayala', 'type': 'Province'},
                    {'name': 'Sourou', 'type': 'Province'},
                ]
            },
            {
                'name': 'Cascades',
                'type': 'Région',
                'children': [
                    {'name': 'Comoé', 'type': 'Province'},
                    {'name': 'Léraba', 'type': 'Province'},
                ]
            },
            {
                'name': 'Centre-Est',
                'type': 'Région',
                'children': [
                    {'name': 'Boulgou', 'type': 'Province'},
                    {'name': 'Koulpélogo', 'type': 'Province'},
                    {'name': 'Kouritenga', 'type': 'Province'},
                ]
            },
            {
                'name': 'Centre-Nord',
                'type': 'Région',
                'children': [
                    {'name': 'Bam', 'type': 'Province'},
                    {'name': 'Namentenga', 'type': 'Province'},
                    {'name': 'Sanmatenga', 'type': 'Province'},
                ]
            },
            {
                'name': 'Centre-Ouest',
                'type': 'Région',
                'children': [
                    {'name': 'Boulkiemdé', 'type': 'Province'},
                    {'name': 'Sanguié', 'type': 'Province'},
                    {'name': 'Sissili', 'type': 'Province'},
                    {'name': 'Ziro', 'type': 'Province'},
                ]
            }
        ]

        self.seed_subdivisions(burkina, burkina_data)

        self.stdout.write(self.style.SUCCESS('Seeding completed!'))

    def seed_subdivisions(self, country, data, parent=None, level=1):
        for item in data:
            name = item['name']
            sub_type = item['type']
            
            full_name = f"{name}, {country.name}"
            if parent:
                full_name = f"{name}, {parent.name}, {country.name}"

            sub, created = Region.objects.get_or_create(
                name=name,
                country=country,
                level=level,
                parent=parent,
                defaults={
                    'subdivision_type': sub_type,
                    'full_name': full_name,
                    'is_active': True
                }
            )
            
            if created:
                self.stdout.write(f'  Created {sub_type}: {name}')
            
            children = item.get('children', [])
            if children:
                self.seed_subdivisions(country, children, parent=sub, level=level + 1)
