from django.core.management.base import BaseCommand
from guides.models import GuideCategory

class Command(BaseCommand):
    help = 'Create guide categories'

    def handle(self, *args, **options):
        categories = [
            {'name': 'History', 'icon': '🏛️', 'description': 'Historical and cultural tours'},
            {'name': 'Food', 'icon': '🍜', 'description': 'Culinary and food tours'},
            {'name': 'Nature', 'icon': '🌿', 'description': 'Nature and wildlife tours'},
            {'name': 'Adventure', 'icon': '🧗', 'description': 'Adventure and activities'},
            {'name': 'Culture', 'icon': '🎭', 'description': 'Cultural and heritage tours'},
            {'name': 'Religion', 'icon': '🛕', 'description': 'Religious and spiritual tours'},
            {'name': 'Photography', 'icon': '📸', 'description': 'Photography tours'},
            {'name': 'Shopping', 'icon': '🛍️', 'description': 'Shopping and local markets'},
        ]
        
        for category_data in categories:
            category, created = GuideCategory.objects.get_or_create(
                name=category_data['name'],
                defaults=category_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created category: {category.name}'))
            else:
                self.stdout.write(self.style.WARNING(f'Category already exists: {category.name}'))