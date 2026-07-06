from django.core.management.base import BaseCommand
from guides.models import District

class Command(BaseCommand):
    help = 'Create 14 districts'

    def handle(self, *args, **options):
        districts = [
            {'name': 'Colombo', 'code': 'COL', 'description': 'Commercial capital of Sri Lanka'},
            {'name': 'Kandy', 'code': 'KAN', 'description': 'Cultural capital with Temple of the Tooth'},
            {'name': 'Galle', 'code': 'GAL', 'description': 'Historic Dutch fort city'},
            {'name': 'Jaffna', 'code': 'JAF', 'description': 'Northern cultural hub'},
            {'name': 'Anuradhapura', 'code': 'ANU', 'description': 'Ancient capital with sacred sites'},
            {'name': 'Polonnaruwa', 'code': 'POL', 'description': 'Medieval capital with ancient ruins'},
            {'name': 'Nuwara Eliya', 'code': 'NEL', 'description': 'Hill country with tea plantations'},
            {'name': 'Ella', 'code': 'ELL', 'description': 'Scenic mountain village'},
            {'name': 'Sigiriya', 'code': 'SIG', 'description': 'Home to Lion Rock fortress'},
            {'name': 'Trincomalee', 'code': 'TRI', 'description': 'Coastal city with natural harbor'},
            {'name': 'Batticaloa', 'code': 'BAT', 'description': 'Eastern coastal city'},
            {'name': 'Matara', 'code': 'MAT', 'description': 'Southern coastal town'},
            {'name': 'Ratnapura', 'code': 'RAT', 'description': 'Gem mining city'},
            {'name': 'Kurunegala', 'code': 'KUR', 'description': 'Central province capital'},
        ]
        
        for district_data in districts:
            district, created = District.objects.get_or_create(
                code=district_data['code'],
                defaults=district_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created district: {district.name}'))
            else:
                self.stdout.write(self.style.WARNING(f'District already exists: {district.name}'))
        
        total = District.objects.count()
        self.stdout.write(self.style.SUCCESS(f'Total districts: {total}'))