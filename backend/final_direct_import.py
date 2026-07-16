import re
import os
import sys

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from django.contrib.auth import get_user_model
from destinations.models import CategoryData, CategoryPlace
from django.db import transaction

User = get_user_model()

def parse_jsx_directly(file_path):
    """Parse the JSX file directly using regex - bypasses JSON completely"""
    print(f"📖 Reading: {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find the categoryData object
    match = re.search(r'export\s+const\s+categoryData\s*=\s*({[\s\S]*?});', content)
    if not match:
        print("❌ Could not extract categoryData")
        return None
    
    text = match.group(1)
    
    # Remove comments
    text = re.sub(r'//[^\n]*', '', text)
    text = re.sub(r'/\*[\s\S]*?\*/', '', text)
    
    # Find all category keys
    categories = {}
    
    # Find all category blocks
    category_pattern = r'"([^"]+)"\s*:\s*{([^{}]*(?:{[^{}]*}[^{}]*)*)}'
    for match in re.finditer(category_pattern, text, re.DOTALL):
        key = match.group(1)
        obj_text = match.group(2)
        
        # Extract title (handle both single and double quotes)
        title_match = re.search(r'"title"\s*:\s*"([^"]*)"', obj_text)
        if not title_match:
            title_match = re.search(r"title\s*:\s*'([^']*)'", obj_text)
        title = title_match.group(1) if title_match else key
        
        # Extract description
        desc_match = re.search(r'"description"\s*:\s*"([^"]*)"', obj_text)
        if not desc_match:
            desc_match = re.search(r"description\s*:\s*'([^']*)'", obj_text)
        description = desc_match.group(1) if desc_match else ''
        
        # Extract type
        type_match = re.search(r'"type"\s*:\s*"([^"]*)"', obj_text)
        if not type_match:
            type_match = re.search(r"type\s*:\s*'([^']*)'", obj_text)
        place_type = type_match.group(1) if type_match else ''
        
        # Extract places
        places = []
        places_match = re.search(r'"places"\s*:\s*\[([\s\S]*?)\]', obj_text)
        if not places_match:
            places_match = re.search(r"places\s*:\s*\[([\s\S]*?)\]", obj_text)
        
        if places_match:
            places_text = places_match.group(1)
            
            # Find each place object
            place_objects = re.findall(r'{([^{}]*)}', places_text)
            
            for place_obj in place_objects:
                # Extract fields with both single and double quotes
                def extract_field(field_name, text):
                    patterns = [
                        rf'"{field_name}"\s*:\s*"([^"]*)"',
                        rf"{field_name}\s*:\s*'([^']*)'",
                    ]
                    for pattern in patterns:
                        match = re.search(pattern, text)
                        if match:
                            return match.group(1)
                    return ''
                
                name = extract_field('name', place_obj)
                if not name:
                    continue
                
                place = {
                    'name': name,
                    'location': extract_field('location', place_obj),
                    'description': extract_field('description', place_obj),
                    'image': extract_field('image', place_obj),
                    'type': extract_field('type', place_obj) or 'well-known',
                    'hidden_gem': extract_field('hidden_gem', place_obj) or extract_field('hiddenGem', place_obj),
                    'difficulty': extract_field('difficulty', place_obj) or 'Easy',
                    'duration': extract_field('duration', place_obj) or '2-3 hours',
                    'best_time': extract_field('best_time', place_obj) or extract_field('bestTime', place_obj) or 'October to March',
                }
                if place['name']:
                    places.append(place)
        
        categories[key] = {
            'title': title,
            'description': description,
            'type': place_type,
            'places': places
        }
    
    return categories

def import_from_jsx():
    """Import data directly from JSX file"""
    
    try:
        admin = User.objects.get(email='admin@discoverease.com')
        print(f"✅ Using admin: {admin.email}")
    except User.DoesNotExist:
        print("❌ Admin user not found. Please create one first.")
        print("   Run: python3 manage.py createsuperuser")
        return
    
    # Parse the JSX file
    data = parse_jsx_directly('categoryData.jsx')
    if not data:
        print("❌ No data extracted")
        return
    
    print(f"✅ Found {len(data)} categories")
    
    total_categories = 0
    total_places = 0
    errors = 0
    
    with transaction.atomic():
        for key, category_info in data.items():
            places_list = category_info.get('places', [])
            if not places_list:
                print(f"⚠️ Skipping {key}: no places")
                continue
            
            # Create/Update Category
            try:
                category, created = CategoryData.objects.update_or_create(
                    key=key,
                    defaults={
                        'title': category_info.get('title', key)[:255],
                        'description': category_info.get('description', '')[:5000],
                        'type': category_info.get('type', '')[:50],
                        'is_active': True
                    }
                )
                total_categories += 1
                print(f"{'✅' if created else '🔄'} Category: {key} ({len(places_list)} places)")
            except Exception as e:
                print(f"❌ Error creating category {key}: {e}")
                errors += 1
                continue
            
            # Bulk create places
            places_to_create = []
            for place in places_list:
                try:
                    places_to_create.append(
                        CategoryPlace(
                            category=key,
                            name=place.get('name', '')[:255],
                            location=place.get('location', '')[:255],
                            description=place.get('description', '')[:1000],
                            difficulty=place.get('difficulty', 'Easy')[:100],
                            duration=place.get('duration', '2-3 hours')[:100],
                            best_time=place.get('best_time', 'October to March')[:100],
                            image=place.get('image', '')[:500],
                            type=place.get('type', 'well-known')[:50],
                            hidden_gem=place.get('hidden_gem', '')[:1000],
                            is_active=True
                        )
                    )
                except Exception as e:
                    print(f"⚠️ Error creating place {place.get('name', 'unknown')}: {e}")
                    errors += 1
            
            # Bulk insert
            if places_to_create:
                try:
                    CategoryPlace.objects.bulk_create(
                        places_to_create,
                        ignore_conflicts=True,
                        batch_size=100
                    )
                    total_places += len(places_to_create)
                except Exception as e:
                    print(f"❌ Error bulk inserting places for {key}: {e}")
                    errors += 1
    
    print(f"\n{'='*50}")
    print(f"🎉 Import Complete!")
    print(f"   Categories: {total_categories}")
    print(f"   Places: {total_places}")
    print(f"   Errors: {errors}")
    print(f"{'='*50}")

if __name__ == '__main__':
    import_from_jsx()
