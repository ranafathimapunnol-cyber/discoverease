import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from destinations.models import CategoryData, CategoryPlace
from accounts.models import User

print("="*60)
print("📥 ADDING DATA TO DATABASE")
print("="*60)

# Get or create admin user
admin, created = User.objects.get_or_create(
    username='admin',
    defaults={
        'email': 'admin@discoverease.com',
        'is_staff': True,
        'is_superuser': True
    }
)
print(f"✅ Admin: {admin.email}")

# Clear existing data
print("🗑️ Clearing old data...")
CategoryData.objects.all().delete()
CategoryPlace.objects.all().delete()

# Define categories with places
data = {
    "beaches": {
        "title": "Beaches",
        "description": "Kerala's stunning coastline with golden sands and palm-fringed shores",
        "type": "beach",
        "image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80",
        "places": [
            {"name": "Kovalam Beach", "location": "Thiruvananthapuram", "description": "Iconic crescent-shaped beach with lighthouse views", "difficulty": "Easy", "duration": "2-3 hours", "best_time": "October to March", "type": "well-known", "hidden_gem": "Climb the Vizhinjam Lighthouse for panoramic views"},
            {"name": "Varkala Beach", "location": "Thiruvananthapuram", "description": "Cliff-top beach with mineral springs", "difficulty": "Easy", "duration": "2-3 hours", "best_time": "October to March", "type": "well-known", "hidden_gem": "Unique pink laterite cliffs"},
            {"name": "Cherai Beach", "location": "Ernakulam", "description": "Where backwaters meet the Arabian Sea", "difficulty": "Easy", "duration": "2-3 hours", "best_time": "October to March", "type": "well-known", "hidden_gem": "Dolphin sightings possible"}
        ]
    },
    "backwaters": {
        "title": "Backwaters",
        "description": "Serene canals, lagoons, and houseboat destinations",
        "type": "backwater",
        "image": "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80",
        "places": [
            {"name": "Alleppey Backwaters", "location": "Alappuzha", "description": "The Venice of the East - houseboat capital", "difficulty": "Easy", "duration": "Full day", "best_time": "October to March", "type": "well-known", "hidden_gem": "Famous Nehru Trophy Boat Race"},
            {"name": "Kumarakom Backwaters", "location": "Kottayam", "description": "Luxury resorts and bird sanctuary", "difficulty": "Easy", "duration": "Full day", "best_time": "October to March", "type": "well-known", "hidden_gem": "Kumarakom Bird Sanctuary nearby"},
            {"name": "Ashtamudi Lake", "location": "Kollam", "description": "Second largest lake in Kerala", "difficulty": "Easy", "duration": "Half-day", "best_time": "October to March", "type": "well-known", "hidden_gem": "8-armed palm-shaped lake"}
        ]
    },
    "waterfall": {
        "title": "Waterfalls",
        "description": "Spectacular cascades from hidden gems to famous falls",
        "type": "waterfall",
        "image": "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=600&q=80",
        "places": [
            {"name": "Athirappilly Falls", "location": "Thrissur", "description": "The Niagara of India", "difficulty": "Easy", "duration": "2-3 hours", "best_time": "August to February", "type": "well-known", "hidden_gem": "Featured in Bollywood movies"},
            {"name": "Vazhachal Falls", "location": "Thrissur", "description": "Powerful rapids upstream", "difficulty": "Easy", "duration": "2-3 hours", "best_time": "August to February", "type": "well-known", "hidden_gem": "Located 5km from Athirappilly"},
            {"name": "Meenmutty Falls", "location": "Wayanad", "description": "Three-tiered waterfall", "difficulty": "Moderate", "duration": "3-4 hours", "best_time": "September to February", "type": "well-known", "hidden_gem": "300-meter cascade"}
        ]
    },
    "hillstations": {
        "title": "Hill Stations & Trekking",
        "description": "Misty mountains, tea plantations, and cool retreats",
        "type": "hill_station",
        "image": "https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=600&q=80",
        "places": [
            {"name": "Munnar", "location": "Idukki", "description": "Rolling tea gardens and misty hills", "difficulty": "Easy", "duration": "Full day", "best_time": "October to March", "type": "well-known", "hidden_gem": "World's highest tea plantation"},
            {"name": "Vagamon", "location": "Idukki", "description": "Rolling meadows and pine forests", "difficulty": "Easy", "duration": "Full day", "best_time": "October to March", "type": "well-known", "hidden_gem": "Paragliding takeoff zone"},
            {"name": "Wayanad", "location": "Wayanad", "description": "Coffee plantations and wildlife", "difficulty": "Easy", "duration": "Full day", "best_time": "October to March", "type": "well-known", "hidden_gem": "Edakkal Caves with Neolithic carvings"}
        ]
    },
    "wildlife": {
        "title": "Wildlife Sanctuaries",
        "description": "National parks, tiger reserves, and sanctuaries",
        "type": "wildlife",
        "image": "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=600&q=80",
        "places": [
            {"name": "Periyar Tiger Reserve", "location": "Idukki", "description": "Elephants, tigers, and boat safaris", "difficulty": "Easy", "duration": "Full day", "best_time": "October to March", "type": "well-known", "hidden_gem": "Boat safaris on Periyar Lake"},
            {"name": "Silent Valley", "location": "Palakkad", "description": "Untouched tropical rainforest", "difficulty": "Moderate", "duration": "Full day", "best_time": "October to March", "type": "well-known", "hidden_gem": "UNESCO World Heritage site"},
            {"name": "Thattekad Bird Sanctuary", "location": "Ernakulam", "description": "Kerala's first avian sanctuary", "difficulty": "Easy", "duration": "2-3 hours", "best_time": "September to March", "type": "well-known", "hidden_gem": "Sri Lanka frogmouth and Malabar trogon"}
        ]
    }
}

total_categories = 0
total_places = 0

print("\n📥 Importing data...")
print("-"*60)

for cat_key, cat_info in data.items():
    # Create category
    cat, created = CategoryData.objects.get_or_create(
        key=cat_key,
        defaults={
            'title': cat_info['title'],
            'description': cat_info['description'],
            'type': cat_info['type'],
            'image': cat_info['image'],
            'is_active': True
        }
    )
    total_categories += 1
    print(f"\n📂 {cat_key}: {len(cat_info['places'])} places")
    
    # Add places
    count = 0
    for place_info in cat_info['places']:
        place, created = CategoryPlace.objects.get_or_create(
            category=cat_key,
            name=place_info['name'],
            defaults={
                'location': place_info['location'],
                'description': place_info['description'],
                'difficulty': place_info.get('difficulty', ''),
                'duration': place_info.get('duration', ''),
                'best_time': place_info.get('best_time', ''),
                'image': place_info.get('image', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80'),
                'type': place_info.get('type', 'well-known'),
                'hidden_gem': place_info.get('hidden_gem', ''),
                'is_active': True
            }
        )
        count += 1
        total_places += 1
        print(f"   ✅ {place.name} - {place.location}")
    
    print(f"   📊 Total: {count} places")

print("\n" + "="*60)
print("✅ IMPORT COMPLETED!")
print(f"   📊 Categories: {total_categories}")
print(f"   📊 Places: {total_places}")
print("="*60)

# Show summary
print("\n📊 Final Summary:")
for cat in CategoryData.objects.all():
    count = CategoryPlace.objects.filter(category=cat.key).count()
    print(f"   • {cat.key}: {count} places")
