from django.contrib.auth import get_user_model
from suggestions.models import Suggestion

User = get_user_model()

# Get the user
try:
    user = User.objects.get(email='test@example.com')
except User.DoesNotExist:
    user = User.objects.first()
    if not user:
        print("No user found! Please create a user first.")
        exit()

print(f"Using user: {user.email}")

# Update ALL existing suggestions to 'implemented'
updated = Suggestion.objects.all().update(status='implemented')
print(f"Updated {updated} suggestions to 'implemented'")

# Create new implemented suggestions if needed
suggestions_data = [
    {
        'name': 'Munnar Tea Gardens',
        'description': 'The rolling hills of tea plantations are breathtaking. Perfect for nature lovers.',
        'category': 'nature',
        'district': 'Idukki',
        'location_info': 'Munnar, Idukki'
    },
    {
        'name': 'Alleppey Backwaters',
        'description': 'Take a traditional houseboat and spend a night on the water for the full experience.',
        'category': 'backwater',
        'district': 'Alappuzha',
        'location_info': 'Alleppey, Alappuzha'
    },
    {
        'name': 'Athirappilly Falls',
        'description': 'Known as the "Niagara of India", this waterfall is majestic and powerful.',
        'category': 'waterfalls',
        'district': 'Thrissur',
        'location_info': 'Athirappilly, Thrissur'
    },
    {
        'name': 'Kovalam Beach',
        'description': 'Beautiful crescent-shaped beach with lighthouse and international tourists.',
        'category': 'beach',
        'district': 'Thiruvananthapuram',
        'location_info': 'Kovalam, Thiruvananthapuram'
    },
    {
        'name': 'Varkala Beach',
        'description': 'Beautiful cliff beach with natural springs and stunning sunsets.',
        'category': 'beach',
        'district': 'Thiruvananthapuram',
        'location_info': 'Varkala, Thiruvananthapuram'
    }
]

created_count = 0
for data in suggestions_data:
    suggestion, created = Suggestion.objects.get_or_create(
        user=user,
        name=data['name'],
        defaults={
            'description': data['description'],
            'category': data['category'],
            'district': data['district'],
            'location_info': data['location_info'],
            'suggestion_type': 'new',
            'status': 'implemented'
        }
    )
    if created:
        created_count += 1
        print(f"Created: {suggestion.name}")
    else:
        if suggestion.status != 'implemented':
            suggestion.status = 'implemented'
            suggestion.save()
            print(f"Updated: {suggestion.name} to implemented")
        else:
            print(f"Already exists: {suggestion.name}")

print("")
print(f"Total suggestions: {Suggestion.objects.count()}")
print(f"Implemented: {Suggestion.objects.filter(status='implemented').count()}")
print(f"Pending: {Suggestion.objects.filter(status='pending').count()}")
