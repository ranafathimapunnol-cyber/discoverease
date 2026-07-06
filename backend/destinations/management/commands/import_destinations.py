# destinations/management/commands/import_destinations.py
import json
import os
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from django.utils import timezone
from destinations.models import Destination
from accounts.models import User
from django.db import transaction

class Command(BaseCommand):
    help = 'Import destinations from frontend category data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            type=str,
            help='Path to JSON file with destination data',
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing destinations before import',
        )

    def handle(self, *args, **options):
        # Category mapping (frontend key -> backend category)
        CATEGORY_MAPPING = {
            'beaches': Destination.Category.BEACH,
            'backwaters': Destination.Category.BACKWATER,
            'waterfall': Destination.Category.WATERFALLS,
            'hillstations': Destination.Category.HILL,
            'wildlife': Destination.Category.WILDLIFE,
            'walking': Destination.Category.OTHER,
            'junglesafari': Destination.Category.WILDLIFE,
            'rappelling': Destination.Category.OTHER,
            'mountainbiking': Destination.Category.OTHER,
            'kayaking': Destination.Category.BACKWATER,
            'offroading': Destination.Category.OTHER,
            'camping': Destination.Category.OTHER,
            'stargazing': Destination.Category.OTHER,
            'parks': Destination.Category.OTHER,
            'zoos': Destination.Category.WILDLIFE,
            'heritage': Destination.Category.HERITAGE,
            'sacred': Destination.Category.TEMPLE,
            'caves': Destination.Category.OTHER,
            'islands': Destination.Category.BACKWATER,
            'museums': Destination.Category.HERITAGE,
            'houseboats': Destination.Category.BACKWATER,
            'resorts': Destination.Category.OTHER,
        }

        # Hidden gem categories (these will be marked as HIDDEN)
        HIDDEN_CATEGORIES = [
            'walking', 'caves', 'islands', 'stargazing',
            'offroading', 'rappelling', 'camping'
        ]

        # ✅ FIXED: Get or create admin user - using get_or_create properly
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@discoverease.com',
                'is_staff': True,
                'is_superuser': True,
                'first_name': 'Admin',
                'last_name': 'User'
            }
        )
        
        # If user exists but email is different, update it
        if not created and admin_user.email != 'admin@discoverease.com':
            admin_user.email = 'admin@discoverease.com'
            admin_user.save()
            
        self.stdout.write(self.style.SUCCESS(f'✅ Using admin user: {admin_user.email}'))

        # Clear existing data if flag is set
        if options['clear']:
            self.stdout.write('🗑️ Clearing existing destinations...')
            Destination.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('✅ Cleared all destinations'))

        # Load data from file or use embedded data
        if options['file']:
            with open(options['file'], 'r') as f:
                category_data = json.load(f)
        else:
            # Your frontend data embedded here
            category_data = self.get_category_data()

        count = 0
        errors = 0
        skipped = 0

        self.stdout.write('📥 Starting import...')

        with transaction.atomic():
            for category_key, category_info in category_data.items():
                if not category_info.get('places'):
                    continue

                status = Destination.Status.HIDDEN if category_key in HIDDEN_CATEGORIES else Destination.Status.APPROVED
                backend_category = CATEGORY_MAPPING.get(category_key, Destination.Category.OTHER)

                self.stdout.write(f'📂 Processing category: {category_key} ({len(category_info["places"])} places)')

                for place in category_info['places']:
                    try:
                        # Check if destination already exists
                        existing = Destination.objects.filter(
                            name__iexact=place['name'],
                            district__iexact=place.get('location', '')
                        ).first()

                        if existing:
                            skipped += 1
                            continue

                        # Determine if it's a hidden gem
                        is_hidden = place.get('type') == 'hidden' or category_key in HIDDEN_CATEGORIES

                        # Create destination
                        destination = Destination(
                            name=place['name'],
                            slug=slugify(place['name']),
                            short_description=place.get('description', '')[:300],
                            long_description=place.get('hidden_gem_description', place.get('description', '')),
                            category=backend_category,
                            status=Destination.Status.HIDDEN if is_hidden else Destination.Status.APPROVED,
                            district=place.get('location', ''),
                            featured_image=place.get('image', 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80'),
                            added_by=admin_user,
                            verified_by=admin_user if not is_hidden else None,
                            verified_at=timezone.now() if not is_hidden else None,
                        )
                        destination.save()
                        count += 1

                        if count % 100 == 0:
                            self.stdout.write(f'   ✅ Imported {count} destinations so far...')

                    except Exception as e:
                        errors += 1
                        self.stdout.write(self.style.ERROR(f'   ❌ Error importing {place.get("name", "Unknown")}: {str(e)}'))

        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS(f'✅ Import completed!'))
        self.stdout.write(f'   • Imported: {count} destinations')
        self.stdout.write(f'   • Skipped (already exist): {skipped}')
        self.stdout.write(f'   • Errors: {errors}')
        self.stdout.write('='*50)

    def get_category_data(self):
        """Your full category data from frontend - EXTEND THIS WITH YOUR 8000+ RECORDS"""
        return {
            "beaches": {
                "title": "Beaches",
                "description": "Kerala's stunning coastline with golden sands and palm-fringed shores",
                "places": [
                    # Add ALL your beach places here
                    {"id": 101, "name": "Kovalam Beach", "location": "Thiruvananthapuram", "description": "Iconic crescent-shaped beach with lighthouse views", "type": "well-known", "image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80"},
                    {"id": 102, "name": "Varkala Beach", "location": "Thiruvananthapuram", "description": "Cliff-top beach with mineral springs and sunset views", "type": "well-known", "image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80"},
                ]
            },
            "backwaters": {
                "title": "Backwaters",
                "description": "Serene canals, lagoons, and houseboat destinations",
                "places": [
                    # Add ALL your backwater places here
                    {"id": 201, "name": "Alleppey Backwaters", "location": "Alappuzha", "description": "The Venice of the East - houseboat capital", "type": "well-known", "image": "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80"},
                ]
            },
            "waterfall": {
                "title": "Waterfalls",
                "description": "Spectacular cascades from hidden gems to famous falls",
                "places": [
                    # Add ALL your waterfall places here
                    {"id": 301, "name": "Athirappilly Falls", "location": "Thrissur", "description": "The Niagara of India - massive waterfall", "type": "well-known", "image": "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=600&q=80"},
                ]
            },
            "hillstations": {
                "title": "Hill Stations & Trekking",
                "description": "Misty mountains, tea plantations, trekking trails and cool retreats",
                "places": [
                    # Add ALL your hillstation places here
                    {"id": 401, "name": "Munnar", "location": "Idukki", "description": "Rolling tea gardens and misty hills", "type": "well-known", "image": "https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=600&q=80"},
                ]
            },
            "wildlife": {
                "title": "Wildlife Sanctuaries",
                "description": "National parks, tiger reserves, butterfly sanctuaries, and bird sanctuaries",
                "places": [
                    # Add ALL your wildlife places here
                    {"id": 501, "name": "Periyar Tiger Reserve", "location": "Idukki", "description": "Elephants, tigers, and boat safaris on Periyar Lake", "type": "well-known", "image": "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=600&q=80"},
                ]
            },
            # Add ALL your other categories here...
            # walking, junglesafari, rappelling, mountainbiking, kayaking, 
            # offroading, camping, stargazing, parks, zoos, heritage, 
            # sacred, caves, islands, museums, houseboats, resorts
        }