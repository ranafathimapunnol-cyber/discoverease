import os
import sys
import django

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from destinations.models import CategoryData, CategoryPlace
from accounts.models import User

print("="*50)
print("Creating test data...")
print("="*50)

# Get admin
try:
    admin = User.objects.get(email='admin@discoverease.com')
    print(f"✅ Found admin: {admin.email}")
except User.DoesNotExist:
    admin = User.objects.create_superuser(
        email='admin@discoverease.com',
        username='admin',
        password='admin123'
    )
    print(f"✅ Created admin: {admin.email}")

# Clear all
print("🗑️ Clearing existing data...")
CategoryData.objects.all().delete()
CategoryPlace.objects.all().delete()

# Create one category
cat = CategoryData.objects.create(
    key='test',
    title='Test Category',
    description='This is a test category',
    type='test',
    image='https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
    is_active=True
)
print(f"✅ Created category: {cat.key}")

# Create one place
place = CategoryPlace.objects.create(
    category='test',
    name='Test Place',
    location='Kerala',
    description='A test place for verification',
    difficulty='Easy',
    duration='2 hours',
    best_time='October to March',
    image='https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
    type='well-known',
    hidden_gem='This is a hidden gem',
    is_active=True
)
print(f"✅ Created place: {place.name}")

print("\n📊 Final Summary:")
print(f"Categories: {CategoryData.objects.count()}")
print(f"Places: {CategoryPlace.objects.count()}")

for cat in CategoryData.objects.all():
    count = CategoryPlace.objects.filter(category=cat.key).count()
    print(f"  {cat.key}: {count} places")
