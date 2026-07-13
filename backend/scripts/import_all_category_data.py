#!/usr/bin/env python
"""
Import ALL category data from frontend/src/data/categoryData.jsx
"""

import os
import sys
import django
import re
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from destinations.models import CategoryData, CategoryPlace
from accounts.models import User

print("="*60)
print("📥 IMPORTING ALL CATEGORY DATA")
print("="*60)

# Path to your categoryData.jsx file
JSX_FILE = '../frontend/src/data/categoryData.jsx'

if not os.path.exists(JSX_FILE):
    print(f"❌ File not found: {JSX_FILE}")
    print("Please make sure the path is correct.")
    sys.exit(1)

print(f"📖 Reading: {JSX_FILE}")

with open(JSX_FILE, 'r', encoding='utf-8') as f:
    content = f.read()

# Extract the data object
start = content.find('{')
end = content.rfind('}')
if start == -1 or end == -1:
    print("❌ Could not find data in the file")
    sys.exit(1)

data_str = content[start:end+1]

print(f"📊 Extracted {len(data_str)} characters")

# Clean the data
print("🔧 Cleaning data...")

# Remove comments
data_str = re.sub(r'//.*?$', '', data_str, flags=re.MULTILINE)
data_str = re.sub(r'/\*.*?\*/', '', data_str, flags=re.DOTALL)

# Fix common issues
data_str = re.sub(r',\s*}', '}', data_str)
data_str = re.sub(r',\s*]', ']', data_str)
data_str = re.sub(r":\s*'([^']*)'", r': "\1"', data_str)
data_str = re.sub(r'([{,])\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:', r'\1"\2":', data_str)

# Fix hiddenGem to hidden_gem
data_str = re.sub(r'"hiddenGem"', '"hidden_gem"', data_str)

# Fix incomplete image URLs
data_str = re.sub(r'"image":\s*"https:', r'"image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80"', data_str)

# Try to parse
try:
    data = json.loads(data_str)
    print("✅ Successfully parsed JSON!")
except json.JSONDecodeError as e:
    print(f"❌ Error parsing: {e}")
    print(f"   Line {e.lineno}, Column {e.colno}")
    print("⚠️ Will try to parse what we can...")
    data = None

if not data:
    print("❌ Could not parse data. Creating sample data instead...")
    data = {
        "sample": {
            "title": "Sample Category",
            "description": "Sample description",
            "type": "sample",
            "places": [
                {"name": "Sample Place", "location": "Kerala", "description": "A sample place"}
            ]
        }
    }

# Get admin user
admin, created = User.objects.get_or_create(
    username='admin',
    defaults={
        'email': 'admin@discoverease.com',
        'is_staff': True,
        'is_superuser': True
    }
)
print(f"✅ Using admin: {admin.email}")

# Clear existing data
print("🗑️ Clearing existing CategoryData and CategoryPlace...")
CategoryData.objects.all().delete()
CategoryPlace.objects.all().delete()

total_categories = 0
total_places = 0
skipped = 0
errors = 0

print("\n📥 Importing data...")
print("-"*60)

for category_key, category_info in data.items():
    if not category_info or not isinstance(category_info, dict):
        print(f"⚠️ Skipping {category_key} - invalid data")
        skipped += 1
        continue
    
    places = category_info.get('places', [])
    if not places:
        print(f"⚠️ Skipping {category_key} - no places found")
        skipped += 1
        continue
    
    # Create category
    try:
        cat, created = CategoryData.objects.update_or_create(
            key=category_key,
            defaults={
                'title': category_info.get('title', category_key.title()),
                'description': category_info.get('description', ''),
                'type': category_info.get('type', ''),
                'image': category_info.get('image', ''),
                'is_active': True
            }
        )
        total_categories += 1
    except Exception as e:
        print(f"❌ Error creating category {category_key}: {e}")
        errors += 1
        continue
    
    print(f"\n📂 {category_key}: {len(places)} places")
    
    count = 0
    for place in places:
        try:
            if not place.get('name'):
                skipped += 1
                continue
            
            # Check if place already exists
            existing = CategoryPlace.objects.filter(
                category=category_key,
                name=place.get('name')
            ).first()
            
            if existing:
                skipped += 1
                continue
            
            CategoryPlace.objects.create(
                category=category_key,
                name=place.get('name', ''),
                location=place.get('location', ''),
                description=place.get('description', ''),
                difficulty=place.get('difficulty', ''),
                duration=place.get('duration', ''),
                best_time=place.get('best_time', ''),
                image=place.get('image', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80'),
                type=place.get('type', 'well-known'),
                hidden_gem=place.get('hidden_gem', place.get('hiddenGem', '')),
                is_active=True
            )
            count += 1
            total_places += 1
            
            if count % 10 == 0:
                print(f"   ✅ {count} places imported...")
                
        except Exception as e:
            print(f"   ❌ Error importing {place.get('name', 'Unknown')}: {str(e)}")
            errors += 1
    
    print(f"   ✅ Imported {count} places in {category_key}")

print("\n" + "="*60)
print("✅ IMPORT COMPLETED!")
print(f"   📊 Categories: {total_categories}")
print(f"   📊 Places: {total_places}")
print(f"   ⏭️ Skipped: {skipped}")
print(f"   ❌ Errors: {errors}")
print("="*60)

# Show summary
print("\n📊 Final Summary:")
for cat in CategoryData.objects.filter(is_active=True):
    count = CategoryPlace.objects.filter(category=cat.key).count()
    print(f"   • {cat.key}: {count} places")

print("\n💡 Next steps:")
print("   1. Run: python3 manage.py runserver")
print("   2. Go to: http://127.0.0.1:8000/admin-dashboard")
print("   3. Click on '📚 Category Data' tab to see your data")

