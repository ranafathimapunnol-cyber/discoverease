# guides/management/commands/create_districts.py
from django.core.management.base import BaseCommand
from guides.models import District

class Command(BaseCommand):
    help = 'Create 14 Kerala districts'

    def handle(self, *args, **options):
        districts = [
            {'name': 'Thiruvananthapuram', 'code': 'TVM', 'description': 'Capital city with beaches and temples'},
            {'name': 'Kollam', 'code': 'KLM', 'description': 'Cashew capital and backwater destination'},
            {'name': 'Pathanamthitta', 'code': 'PTA', 'description': 'Pilgrim destination with Sabarimala'},
            {'name': 'Alappuzha', 'code': 'ALP', 'description': 'Venice of the East with backwaters'},
            {'name': 'Kottayam', 'code': 'KTM', 'description': 'Land of lakes and rubber plantations'},
            {'name': 'Idukki', 'code': 'IDK', 'description': 'Hill station with tea gardens and dams'},
            {'name': 'Ernakulam', 'code': 'EKM', 'description': 'Commercial capital with Kochi city'},
            {'name': 'Thrissur', 'code': 'TSR', 'description': 'Cultural capital with Pooram festival'},
            {'name': 'Palakkad', 'code': 'PLK', 'description': 'Gateway to Kerala with mountain passes'},
            {'name': 'Malappuram', 'code': 'MLP', 'description': 'Hill district with rich history'},
            {'name': 'Kozhikode', 'code': 'CLT', 'description': 'Historic trade center and beaches'},
            {'name': 'Wayanad', 'code': 'WYD', 'description': 'Forest district with wildlife sanctuaries'},
            {'name': 'Kannur', 'code': 'KNR', 'description': 'Land of theyyam and beaches'},
            {'name': 'Kasaragod', 'code': 'KSD', 'description': 'Northernmost district with pristine beaches'},
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
        self.stdout.write(self.style.SUCCESS(f'Total Kerala districts: {total}'))