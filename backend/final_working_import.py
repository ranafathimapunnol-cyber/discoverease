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
    """Parse the JSX file directly - handles both single and double quotes"""
    print(f"📖 Reading: {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find the categoryData object - handle both JS and JSX
    patterns = [
        r'export\s+const\s+categoryData\s*=\s*({[\s\S]*?});',
        r'const\s+categoryData\s*=\s*({[\s\S]*?});',
        r'categoryData\s*=\s*({[\s\S]*?});',
    ]
    
    text = None
    for pattern in patterns:
        match = re.search(pattern, content)
        if match:
            text = match.group(1)
            break
    
    if not text:
        print("❌ Could not extract categoryData")
        return None
    
    print(f"✅ Extracted {len(text)} characters")
    
    # Remove comments
    text = re.sub(r'//[^\n]*', '', text)
    text = re.sub(r'/\*[\s\S]*?\*/', '', text)
    
    # Find all category blocks - handle both quoted and unquoted keys
    categories = {}
    
    # Find category keys (both quoted and unquoted)
    # Pattern 1: "key": { or key: {
    category_pattern = r'(?:"([^"]+)"|([a-zA-Z_][a-zA-Z0-9_]*))\s*:\s*{'
    
    # We'll find each category by scanning
    pos = 0
    while pos < len(text):
        # Find next category key
        match = re.search(category_pattern, text[pos:])
        if not match:
            break
        
        # Get the key
        key = match.group(1) or match.group(2)
        start_pos = pos + match.end()
        
        # Find matching closing brace
        brace_count = 1
        current_pos = start_pos
        while current_pos < len(text) and brace_count > 0:
            if text[current_pos] == '{':
                brace_count += 1
            elif text[current_pos] == '}':
                brace_count -= 1
            current_pos += 1
        
        if brace_count != 0:
            print(f"⚠️ Could not find closing brace for {key}")
            pos += match.end()
            continue
        
        obj_text = text[start_pos:current_pos-1]
        
        # Extract category info
        def extract_field(field_name, text):
            # Try double quotes first
            patterns = [
                rf'"{field_name}"\s*:\s*"([^"]*)"',
                rf"{field_name}\s*:\s*'([^']*)'",
                rf'"{field_name}"\s*:\s*"([^"]*)"\s*,',
                rf"{field_name}\s*:\s*'([^']*)'\s*,",
            ]
            for pattern in patterns:
                match = re.search(pattern, text)
                if match:
                    return match.group(1)
            return ''
        
        title = extract_field('title', obj_text) or key
        description = extract_field('description', obj_text) or ''
        place_type = extract_field('type', obj_text) or ''
        
        # Extract places
        places = []
        places_match = re.search(r'(?:places|"places")\s*:\s*\[([\s\S]*?)\]', obj_text)
        if places_match:
            places_text = places_match.group(1)
            
            # Find each place object
            place_objects = re.findall(r'{([^{}]*)}', places_text)
            
            for place_obj in place_objects:
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
        
        # Move to after the closing brace
        pos = current_pos
    
    return categories

def import_from_jsx():
    """Import data directly from JSX file"""
    
    try:
        admin = User.objects.get(email='admin@discoverease.com')
        print(f"✅ Using admin: {admin.email}")
    except User.DoesNotExist:
        print("❌ Admin user not found. Please create one first.")
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
