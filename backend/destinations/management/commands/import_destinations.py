# destinations/management/commands/import_destinations.py

import json
import os
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from django.utils import timezone
from destinations.models import Destination, CategoryData, CategoryPlace
from accounts.models import User
from django.db import transaction

class Command(BaseCommand):
    help = 'Import destinations from JSON file'

    def add_arguments(self, parser):
        parser.add_argument('--file', type=str, required=True, help='Path to JSON file')
        parser.add_argument('--clear', action='store_true', help='Clear existing data')

    def handle(self, *args, **options):
        # Category mapping
        CATEGORY_MAPPING = {
            'beaches': Destination.CategoryChoice.BEACH,
            'backwaters': Destination.CategoryChoice.BACKWATER,
            'waterfall': Destination.CategoryChoice.WATERFALLS,
            'hillstations': Destination.CategoryChoice.HILL,
            'wildlife': Destination.CategoryChoice.WILDLIFE,
            'walking': Destination.CategoryChoice.OTHER,
            'junglesafari': Destination.CategoryChoice.WILDLIFE,
            'rappelling': Destination.CategoryChoice.OTHER,
            'mountainbiking': Destination.CategoryChoice.OTHER,
            'kayaking': Destination.CategoryChoice.BACKWATER,
            'offroading': Destination.CategoryChoice.OTHER,
            'camping': Destination.CategoryChoice.OTHER,
            'stargazing': Destination.CategoryChoice.OTHER,
            'parks': Destination.CategoryChoice.OTHER,
            'zoos': Destination.CategoryChoice.WILDLIFE,
            'heritage': Destination.CategoryChoice.HERITAGE,
            'sacred': Destination.CategoryChoice.TEMPLE,
            'caves': Destination.CategoryChoice.OTHER,
            'islands': Destination.CategoryChoice.BACKWATER,
            'museums': Destination.CategoryChoice.HERITAGE,
            'houseboats': Destination.CategoryChoice.BACKWATER,
            'resorts': Destination.CategoryChoice.OTHER,
        }

        HIDDEN_CATEGORIES = [
            'walking', 'caves', 'islands', 'stargazing',
            'offroading', 'rappelling', 'camping', 'kayaking'
        ]

        # Get admin user
        admin_user, _ = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@discoverease.com',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        self.stdout.write(self.style.SUCCESS(f'✅ Using admin: {admin_user.email}'))

        # Clear data
        if options['clear']:
            self.stdout.write('🗑️ Clearing data...')
            Destination.objects.all().delete()
            CategoryData.objects.all().delete()
            CategoryPlace.objects.all().delete()
            self.stdout.write('✅ Cleared')

        # Load JSON
        file_path = options['file']
        if not os.path.exists(file_path):
            self.stdout.write(self.style.ERROR(f'❌ File not found: {file_path}'))
            return

        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Import
        total = 0
        errors = 0
        skipped = 0

        self.stdout.write('📥 Importing...')

        with transaction.atomic():
            for category_key, category_info in data.items():
                if not category_info.get('places'):
                    continue

                # Create CategoryData
                cat_data, created = CategoryData.objects.update_or_create(
                    key=category_key,
                    defaults={
                        'title': category_info.get('title', category_key),
                        'description': category_info.get('description', ''),
                        'type': category_info.get('type', ''),
                        'is_active': True
                    }
                )

                backend_cat = CATEGORY_MAPPING.get(category_key, Destination.CategoryChoice.OTHER)
                is_hidden_cat = category_key in HIDDEN_CATEGORIES

                self.stdout.write(f'📂 {category_key}: {len(category_info["places"])} places')

                for place in category_info['places']:
                    try:
                        # Check for duplicates
                        existing = Destination.objects.filter(
                            name__iexact=place['name'],
                            district__iexact=place.get('location', '')
                        ).first()

                        if existing:
                            skipped += 1
                            continue

                        is_hidden = place.get('type') == 'hidden' or is_hidden_cat

                        # Create Destination
                        dest = Destination(
                            name=place['name'],
                            slug=slugify(place['name']),
                            short_description=place.get('description', '')[:300],
                            long_description=place.get('hidden_gem', place.get('description', '')),
                            category=backend_cat,
                            status=Destination.Status.HIDDEN if is_hidden else Destination.Status.APPROVED,
                            district=place.get('location', ''),
                            featured_image=place.get('image', ''),
                            added_by=admin_user,
                            verified_by=admin_user if not is_hidden else None,
                            verified_at=timezone.now() if not is_hidden else None,
                        )
                        dest.save()
                        total += 1

                        # Create CategoryPlace
                        CategoryPlace.objects.update_or_create(
                            category=category_key,
                            name=place['name'],
                            defaults={
                                'location': place.get('location', ''),
                                'description': place.get('description', ''),
                                'difficulty': place.get('difficulty', ''),
                                'duration': place.get('duration', ''),
                                'best_time': place.get('best_time', ''),
                                'image': place.get('image', ''),
                                'type': place.get('type', 'well-known'),
                                'hidden_gem': place.get('hidden_gem', ''),
                                'is_active': True
                            }
                        )

                    except Exception as e:
                        errors += 1
                        self.stdout.write(self.style.ERROR(f'❌ {place.get("name")}: {e}'))

        # Summary
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS('✅ Import Complete!'))
        self.stdout.write(f'   • Imported: {total}')
        self.stdout.write(f'   • Skipped: {skipped}')
        self.stdout.write(f'   • Errors: {errors}')
        self.stdout.write('='*50)