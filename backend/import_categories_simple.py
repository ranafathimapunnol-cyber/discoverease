# /Users/ismailpunnol/DiscoverEase/backend/import_categories_simple.py
import os
import sys
import django
import json
import re

# Setup Django
sys.path.append('/Users/ismailpunnol/DiscoverEase/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from destinations.models import CategoryData, CategoryPlace
from accounts.models import User

def extract_jsx_data():
    """Extract data from JSX file using multiple methods"""
    
    jsx_paths = [
        '/Users/ismailpunnol/DiscoverEase/frontend/src/data/categoryData.jsx',
        '../frontend/src/data/categoryData.jsx',
        '../../frontend/src/data/categoryData.jsx',
        'frontend/src/data/categoryData.jsx',
    ]
    
    jsx_path = None
    for path in jsx_paths:
        if os.path.exists(path):
            jsx_path = path
            break
    
    if not jsx_path:
        print(f"❌ Could not find categoryData.jsx")
        return None
    
    print(f"📖 Reading: {jsx_path}")
    
    with open(jsx_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Let's look at what's in the file
    print(f"📄 File size: {len(content)} characters")
    
    # Find all category names by looking for patterns
    # Your file has categories like:
    # resorts: {
    #     title: 'Luxury Resorts & Stays',
    #     ...
    #     places: [
    
    data = {}
    
    # Method 1: Find by looking for category patterns
    # Look for "category_name: {" patterns
    category_pattern = r'^(\w+):\s*\{'
    lines = content.split('\n')
    
    current_category = None
    current_section = []
    in_places = False
    places_content = []
    
    for i, line in enumerate(lines):
        stripped = line.strip()
        
        # Check if this line starts a new category
        match = re.match(r'^(\w+):\s*\{$', stripped)
        if match:
            # Save previous category
            if current_category and places_content:
                # Parse places for this category
                places = parse_places(places_content)
                if places:
                    # Try to find title
                    title_match = re.search(r'title:\s*[\'"]([^\'"]+)[\'"]', '\n'.join(current_section))
                    title = title_match.group(1) if title_match else current_category.title()
                    
                    # Try to find description
                    desc_match = re.search(r'description:\s*[\'"]([^\'"]+)[\'"]', '\n'.join(current_section))
                    description = desc_match.group(1) if desc_match else ''
                    
                    # Try to find type
                    type_match = re.search(r'type:\s*[\'"]([^\'"]+)[\'"]', '\n'.join(current_section))
                    type_val = type_match.group(1) if type_match else current_category
                    
                    data[current_category] = {
                        'title': title,
                        'description': description,
                        'type': type_val,
                        'places': places
                    }
                    print(f"  📂 {current_category}: {len(places)} places")
            
            # Start new category
            current_category = match.group(1)
            current_section = [line]
            places_content = []
            in_places = False
            continue
        
        if current_category:
            current_section.append(line)
            
            # Check if we're entering the places array
            if 'places:' in stripped and '[' in stripped:
                in_places = True
                places_content.append(line)
            elif in_places:
                places_content.append(line)
                # Check if we're leaving the places array
                if stripped.endswith(']') or stripped.endswith('],'):
                    # Count brackets to make sure we're done
                    bracket_count = 0
                    for char in ''.join(places_content):
                        if char == '[':
                            bracket_count += 1
                        elif char == ']':
                            bracket_count -= 1
                    if bracket_count == 0:
                        in_places = False
    
    # Save last category
    if current_category and places_content:
        places = parse_places(places_content)
        if places:
            title_match = re.search(r'title:\s*[\'"]([^\'"]+)[\'"]', '\n'.join(current_section))
            title = title_match.group(1) if title_match else current_category.title()
            
            desc_match = re.search(r'description:\s*[\'"]([^\'"]+)[\'"]', '\n'.join(current_section))
            description = desc_match.group(1) if desc_match else ''
            
            type_match = re.search(r'type:\s*[\'"]([^\'"]+)[\'"]', '\n'.join(current_section))
            type_val = type_match.group(1) if type_match else current_category
            
            data[current_category] = {
                'title': title,
                'description': description,
                'type': type_val,
                'places': places
            }
            print(f"  📂 {current_category}: {len(places)} places")
    
    return data

def parse_places(places_content):
    """Parse places from the places array content"""
    places_text = '\n'.join(places_content)
    places = []
    
    # Find individual place objects
    # Pattern: { id: 1101, name: '...', location: '...', ... }
    
    # Split by "id:" to find each place
    parts = re.split(r'{\s*id:\s*\d+', places_text)
    
    for part in parts[1:]:  # Skip the first part (before any place)
        place = {}
        
        # Extract name
        name_match = re.search(r'name:\s*[\'"]([^\'"]+)[\'"]', part)
        if name_match:
            place['name'] = name_match.group(1)
        else:
            continue  # Skip if no name
        
        # Extract location
        location_match = re.search(r'location:\s*[\'"]([^\'"]+)[\'"]', part)
        if location_match:
            place['location'] = location_match.group(1)
        else:
            place['location'] = ''
        
        # Extract description
        desc_match = re.search(r'description:\s*[\'"]([^\'"]+)[\'"]', part)
        if desc_match:
            place['description'] = desc_match.group(1)
        else:
            place['description'] = ''
        
        # Extract type
        type_match = re.search(r'type:\s*[\'"]([^\'"]+)[\'"]', part)
        if type_match:
            place['type'] = type_match.group(1)
        else:
            place['type'] = 'well-known'
        
        # Extract hiddenGem
        hidden_match = re.search(r'hiddenGem:\s*[\'"]([^\'"]+)[\'"]', part)
        if hidden_match:
            place['hiddenGem'] = hidden_match.group(1)
        else:
            place['hiddenGem'] = ''
        
        # Extract difficulty
        diff_match = re.search(r'difficulty:\s*[\'"]([^\'"]+)[\'"]', part)
        if diff_match:
            place['difficulty'] = diff_match.group(1)
        else:
            place['difficulty'] = ''
        
        # Extract duration
        dur_match = re.search(r'duration:\s*[\'"]([^\'"]+)[\'"]', part)
        if dur_match:
            place['duration'] = dur_match.group(1)
        else:
            place['duration'] = ''
        
        # Extract bestTime
        best_match = re.search(r'bestTime:\s*[\'"]([^\'"]+)[\'"]', part)
        if best_match:
            place['bestTime'] = best_match.group(1)
        else:
            place['bestTime'] = ''
        
        # Extract image
        img_match = re.search(r'image:\s*[\'"]([^\'"]+)[\'"]', part)
        if img_match:
            place['image'] = img_match.group(1)
        else:
            place['image'] = 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80'
        
        if place.get('name'):
            places.append(place)
    
    return places

def import_data():
    print("="*70)
    print("📥 IMPORTING ALL CATEGORY DATA")
    print("="*70)
    
    # Get admin user
    admin, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@discoverease.com',
            'is_staff': True,
            'is_superuser': True
        }
    )
    
    # Clear existing data
    print("🗑️ Clearing existing data...")
    CategoryPlace.objects.all().delete()
    CategoryData.objects.all().delete()
    
    # Extract data from JSX
    data = extract_jsx_data()
    
    if not data:
        print("❌ No data extracted!")
        return
    
    print(f"\n✅ Found {len(data)} categories")
    
    # Import data
    total_places = 0
    
    for cat_key, cat_info in data.items():
        if not cat_info.get('places'):
            continue
        
        category, created = CategoryData.objects.update_or_create(
            key=cat_key,
            defaults={
                'title': cat_info.get('title', cat_key.title()),
                'description': cat_info.get('description', ''),
                'type': cat_info.get('type', 'Nature & Outdoor'),
                'is_active': True
            }
        )
        
        for place in cat_info.get('places', []):
            if not place.get('name'):
                continue
            
            location = place.get('location', '')
            district = location.split(',')[0].strip() if location else ''
            
            CategoryPlace.objects.create(
                category=cat_key,
                name=place.get('name', ''),
                location=location,
                district=district,
                description=place.get('description', ''),
                difficulty=place.get('difficulty', ''),
                duration=place.get('duration', ''),
                best_time=place.get('bestTime', ''),
                image=place.get('image', 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80'),
                type=place.get('type', 'well-known'),
                hidden_gem=place.get('hiddenGem', ''),
                created_by=admin,
                is_active=True
            )
            total_places += 1
        
        print(f"  ✅ {cat_key}: {len(cat_info.get('places', []))} places imported")
    
    print("\n" + "="*70)
    print("✅ IMPORT COMPLETE!")
    print(f"   📊 Categories: {len(data)}")
    print(f"   📊 Total places: {total_places}")
    print("="*70)

if __name__ == '__main__':
    import_data()