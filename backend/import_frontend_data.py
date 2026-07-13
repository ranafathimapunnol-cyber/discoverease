import os
import django
import re

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from destinations.models import CategoryData, CategoryPlace
from accounts.models import User

print("="*60)
print("📥 IMPORTING FRONTEND DATA TO BACKEND - IMPROVED")
print("="*60)

# Read the frontend JSX file
with open('../frontend/src/data/categoryData.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

print("📖 Reading file...")

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
print("🗑️ Clearing existing data...")
CategoryData.objects.all().delete()
CategoryPlace.objects.all().delete()

# Find all categories - look for pattern: categoryName: {
category_pattern = r'(\w+):\s*{'
category_matches = re.finditer(category_pattern, content)

total_places = 0
categories_found = 0

for match in category_matches:
    cat_key = match.group(1)
    
    # Skip if it's a variable or function
    if cat_key in ['export', 'default', 'const', 'let', 'var', 'function']:
        continue
    
    # Find where this category ends
    start_pos = match.end()
    brace_count = 1
    in_string = False
    escape = False
    end_pos = start_pos
    
    for i, char in enumerate(content[start_pos:], start_pos):
        if escape:
            escape = False
            continue
        if char == '\\':
            escape = True
            continue
        if char == '"' or char == "'":
            if not in_string:
                in_string = True
                quote_char = char
            elif char == quote_char:
                in_string = False
            continue
        if in_string:
            continue
        if char == '{':
            brace_count += 1
        elif char == '}':
            brace_count -= 1
            if brace_count == 0:
                end_pos = i
                break
    
    if end_pos == start_pos:
        continue
    
    category_text = content[start_pos:end_pos]
    
    # Extract category metadata
    title_match = re.search(r'title:\s*["\']([^"\']*)["\']', category_text)
    desc_match = re.search(r'description:\s*["\']([^"\']*)["\']', category_text)
    type_match = re.search(r'type:\s*["\']([^"\']*)["\']', category_text)
    image_match = re.search(r'image:\s*["\']([^"\']*)["\']', category_text)
    
    title = title_match.group(1) if title_match else cat_key
    description = desc_match.group(1) if desc_match else ''
    cat_type = type_match.group(1) if type_match else ''
    image = image_match.group(1) if image_match else 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80'
    
    # Create category
    cat, created = CategoryData.objects.get_or_create(
        key=cat_key,
        defaults={
            'title': title,
            'description': description,
            'type': cat_type,
            'image': image,
            'is_active': True
        }
    )
    categories_found += 1
    
    print(f"\n📂 Processing: {cat_key}")
    
    # Find all places in this category - look for { ... } blocks inside places array
    # First find the places array
    places_match = re.search(r'places:\s*\[([\s\S]*?)\]', category_text)
    
    if places_match:
        places_text = places_match.group(1)
        # Find each place object - look for { ... }
        place_objects = re.finditer(r'{([^{}]*?)}', places_text, re.DOTALL)
        place_count = 0
        
        for place_match in place_objects:
            place_str = place_match.group(1)
            
            try:
                # Extract place fields using regex
                name_match = re.search(r'name:\s*["\']([^"\']*)["\']', place_str)
                loc_match = re.search(r'location:\s*["\']([^"\']*)["\']', place_str)
                desc_match_place = re.search(r'description:\s*["\']([^"\']*)["\']', place_str)
                diff_match = re.search(r'difficulty:\s*["\']([^"\']*)["\']', place_str)
                dur_match = re.search(r'duration:\s*["\']([^"\']*)["\']', place_str)
                time_match = re.search(r'bestTime:\s*["\']([^"\']*)["\']', place_str)
                img_match = re.search(r'image:\s*["\']([^"\']*)["\']', place_str)
                type_match_place = re.search(r'type:\s*["\']([^"\']*)["\']', place_str)
                gem_match = re.search(r'hiddenGem:\s*["\']([^"\']*)["\']', place_str)
                
                name = name_match.group(1) if name_match else ''
                if not name:
                    continue
                
                CategoryPlace.objects.create(
                    category=cat_key,
                    name=name,
                    location=loc_match.group(1) if loc_match else '',
                    description=desc_match_place.group(1) if desc_match_place else '',
                    difficulty=diff_match.group(1) if diff_match else '',
                    duration=dur_match.group(1) if dur_match else '',
                    best_time=time_match.group(1) if time_match else '',
                    image=img_match.group(1) if img_match else 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
                    type=type_match_place.group(1) if type_match_place else 'well-known',
                    hidden_gem=gem_match.group(1) if gem_match else '',
                    is_active=True
                )
                place_count += 1
                total_places += 1
                
            except Exception as e:
                print(f"   ⚠️ Error importing place: {e}")
                continue
        
        print(f"   ✅ Imported {place_count} places")

print("\n" + "="*60)
print(f"✅ IMPORT COMPLETED!")
print(f"   📊 Categories found: {categories_found}")
print(f"   📊 Categories in DB: {CategoryData.objects.count()}")
print(f"   📊 Places in DB: {CategoryPlace.objects.count()}")
print("="*60)

print("\n📊 Summary:")
for cat in CategoryData.objects.filter(is_active=True):
    count = CategoryPlace.objects.filter(category=cat.key).count()
    print(f"   • {cat.key}: {count} places")