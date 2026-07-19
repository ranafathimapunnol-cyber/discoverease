# destinations/management/commands/create_test_suggestions.py
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from suggestions.models import Suggestion
from guides.models import Guide

User = get_user_model()

class Command(BaseCommand):
    help = 'Create test suggestions'

    def handle(self, *args, **options):
        # Get a guide
        guide = Guide.objects.first()
        if not guide:
            self.stdout.write(self.style.ERROR('❌ No guide found!'))
            return

        # Get a user
        user = User.objects.first()
        if not user:
            self.stdout.write(self.style.ERROR('❌ No user found!'))
            return

        # Check what fields the Suggestion model has
        suggestion_fields = [f.name for f in Suggestion._meta.get_fields()]
        self.stdout.write(f'📋 Suggestion model fields: {", ".join(suggestion_fields)}')
        self.stdout.write('')

        # Prepare suggestions with all required fields
        suggestions_to_create = [
            {
                'name': '🏖️ Muzhappilangad Drive-in Beach',
                'title': 'Muzhappilangad Drive-in Beach',
                'description': 'Asia\'s only drive-in beach. You can drive your car on the sandy shores! A must-visit hidden gem in Kannur.',
                'suggestion_type': 'hidden_gem',
                'category': 'beach',
                'district': 'Kannur',
                'location_info': 'Muzhappilangad, Kannur, Kerala',
                'rating': None,
            },
            {
                'name': '🍛 Malabar Cuisine Experience',
                'title': 'Malabar Cuisine Experience',
                'description': 'Authentic Malabar biryani and seafood delicacies in Kannur city. Try the local thali at Kayees Biryani.',
                'suggestion_type': 'local_insight',
                'category': 'food',
                'district': 'Kannur',
                'location_info': 'Kannur City, Kerala',
                'rating': None,
            },
            {
                'name': '🎭 Theyyam Ritual Performance',
                'title': 'Theyyam Ritual Performance',
                'description': 'Ancient ritualistic dance form performed in Kannur temples. A powerful cultural experience you won\'t forget.',
                'suggestion_type': 'review',
                'category': 'culture',
                'district': 'Kannur',
                'location_info': 'Various temples in Kannur',
                'rating': 4.5,
            },
            {
                'name': '🌊 Payyambalam Beach',
                'title': 'Payyambalam Beach',
                'description': 'Beautiful beach with golden sands and stunning sunsets. Perfect for evening walks and photography.',
                'suggestion_type': 'hidden_gem',
                'category': 'beach',
                'district': 'Kannur',
                'location_info': 'Payyambalam, Kannur, Kerala',
                'rating': None,
            },
            {
                'name': '🏛️ St. Angelo Fort',
                'title': 'St. Angelo Fort',
                'description': 'Historic Portuguese fort offering panoramic views of the Arabian Sea. Great for history buffs.',
                'suggestion_type': 'hidden_gem',
                'category': 'historical',
                'district': 'Kannur',
                'location_info': 'St. Angelo Fort, Kannur, Kerala',
                'rating': None,
            },
            {
                'name': '🌅 Ezhara Beach Sunset View',
                'title': 'Ezhara Beach Sunset View',
                'description': 'Stunning sunset views at Ezhara Beach. One of the best sunset spots in Kerala.',
                'suggestion_type': 'local_insight',
                'category': 'viewpoint',
                'district': 'Kannur',
                'location_info': 'Ezhara, Kannur, Kerala',
                'rating': None,
            },
            {
                'name': '⭐ Parassinikadavu Temple',
                'title': 'Parassinikadavu Temple',
                'description': 'Famous temple dedicated to Lord Shiva. Known for its beautiful architecture and peaceful atmosphere.',
                'suggestion_type': 'review',
                'category': 'temple',
                'district': 'Kannur',
                'location_info': 'Parassinikadavu, Kannur, Kerala',
                'rating': 4.8,
            }
        ]

        created_count = 0
        error_count = 0
        
        for data in suggestions_to_create:
            try:
                # Check if exists by name and district
                existing = Suggestion.objects.filter(
                    name=data['name'],
                    district=data['district']
                ).first()
                
                if existing:
                    self.stdout.write(f'⏭️ Already exists: {existing.name}')
                    continue
                
                # Build kwargs with only valid fields
                kwargs = {
                    'name': data['name'],
                    'title': data.get('title', data['name']),
                    'description': data['description'],
                    'suggestion_type': data['suggestion_type'],
                    'category': data.get('category', 'general'),
                    'district': data['district'],
                    'location_info': data.get('location_info', ''),
                    'guide': guide,
                    'user': user,
                    'status': 'pending',
                }
                
                # Add rating only if provided and suggestion_type is review
                if data['suggestion_type'] == 'review' and data.get('rating'):
                    kwargs['rating'] = data['rating']
                
                # Remove any fields that don't exist in the model
                kwargs = {k: v for k, v in kwargs.items() if k in suggestion_fields}
                
                # Create new suggestion
                suggestion = Suggestion.objects.create(**kwargs)
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'✅ Created: {suggestion.name} ({suggestion.suggestion_type})'))
                
            except Exception as e:
                error_count += 1
                self.stdout.write(self.style.ERROR(f'❌ Error creating {data["name"]}: {e}'))

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=' * 50))
        self.stdout.write(self.style.SUCCESS(f'🎉 Done! Created {created_count} new suggestions, {error_count} errors.'))
        self.stdout.write(self.style.SUCCESS('=' * 50))
        self.stdout.write('')
        self.stdout.write('📊 Created suggestions:')
        for s in Suggestion.objects.filter(user=user).order_by('-created_at')[:10]:
            self.stdout.write(f'  - {s.name} ({s.suggestion_type}) - {s.status}')