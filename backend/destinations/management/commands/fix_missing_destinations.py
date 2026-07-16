# destinations/management/commands/fix_missing_destinations.py

from django.core.management.base import BaseCommand
from destinations.models import CategoryPlace, Destination
from django.utils.text import slugify

class Command(BaseCommand):
    help = 'Create destinations for all places that are missing them'

    def handle(self, *args, **options):
        self.stdout.write('🔍 Finding places without destinations...')
        
        # Find all places without destinations
        places_without_dest = []
        for place in CategoryPlace.objects.filter(is_active=True):
            dest = Destination.objects.filter(name__iexact=place.name).first()
            if not dest:
                places_without_dest.append(place)
        
        total = len(places_without_dest)
        self.stdout.write(f'📊 Found {total} places without destinations')
        
        if total == 0:
            self.stdout.write(self.style.SUCCESS('✅ All places already have destinations!'))
            return
        
        created = 0
        errors = 0
        
        for place in places_without_dest:
            try:
                # Extract district from location
                district = None
                if place.location:
                    parts = place.location.split(',')
                    if len(parts) > 1:
                        district = parts[-1].strip()
                    else:
                        district = place.location.strip()
                
                # ✅ Always use 'other' as category (max length 20)
                dest = Destination.objects.create(
                    name=place.name,
                    slug=slugify(place.name),
                    short_description=place.description[:300] if place.description else f"Explore {place.name}",
                    long_description=place.description or f"Beautiful place in Kerala",
                    category='other',  # ✅ FIXED: Always use 'other'
                    status='approved',
                    district=district,
                    featured_image=place.image or 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80',
                    average_rating=0,
                    total_reviews=0,
                    visit_count=0,
                )
                created += 1
                
                if created % 10 == 0:
                    self.stdout.write(f'  ✅ Created {created}/{total} destinations...')
                    
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  ❌ Error creating "{place.name}": {e}'))
                errors += 1
        
        self.stdout.write(f'\n📊 Summary:')
        self.stdout.write(f'  Total missing: {total}')
        self.stdout.write(f'  Created: {created}')
        self.stdout.write(f'  Errors: {errors}')
        self.stdout.write(f'  Total destinations now: {Destination.objects.count()}')
        
        if errors == 0:
            self.stdout.write(self.style.SUCCESS('✅ ALL places now have destinations!'))
        else:
            self.stdout.write(self.style.WARNING(f'⚠️ {errors} errors occurred. Please check manually.'))