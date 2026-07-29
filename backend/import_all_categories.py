# import_all_categories.py
import os
import sys
import django
import re

# Setup Django
sys.path.append('/Users/ismailpunnol/DiscoverEase/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from destinations.models import CategoryData, CategoryPlace
from accounts.models import User

def import_all_data():
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
    
    # Read the JSX file
    jsx_path = '/Users/ismailpunnol/DiscoverEase/frontend/src/data/categoryData.jsx'
    
    if not os.path.exists(jsx_path):
        print(f"❌ File not found: {jsx_path}")
        return
    
    print(f"📖 Reading: {jsx_path}")
    
    with open(jsx_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find all categories by looking for patterns like "category_name: {"
    # This is a more robust approach
    data = {}
    total_places = 0
    
    # Split the content by categories
    # Look for top-level keys
    lines = content.split('\n')
    current_category = None
    current_content = []
    
    for line in lines:
        # Check if this line starts a new category
        # Pattern: "    category_name: {"
        stripped = line.strip()
        if stripped and ':' in stripped and '{' in stripped:
            # Extract category name
            parts = stripped.split(':')
            if len(parts) >= 2:
                name = parts[0].strip()
                # Make sure it's not a nested key
                if not name.startswith('"') and not name.startswith("'") and name not in ['export', 'const', 'categoryData']:
                    if current_category:
                        # Process previous category
                        process_category(current_category, '\n'.join(current_content), data)
                    current_category = name
                    current_content = [line]
                    continue
        
        if current_category:
            current_content.append(line)
    
    # Process last category
    if current_category:
        process_category(current_category, '\n'.join(current_content), data)
    
    # If no categories found with this method, try regex
    if not data:
        print("⚠️ No categories found, trying regex method...")
        # Find all category sections
        category_pattern = r'(\w+):\s*{[^}]*"title":\s*"([^"]*)"[^}]*"places":\s*\[([\s\S]*?)\]'
        matches = re.findall(category_pattern, content, re.DOTALL)
        
        for cat_key, title, places_str in matches:
            if cat_key in ['export', 'const', 'categoryData']:
                continue
            
            places = []
            # Extract places
            place_pattern = r'"name":\s*"([^"]*)"[^{}]*"location":\s*"([^"]*)"'
            place_matches = re.findall(place_pattern, places_str)
            
            for name, location in place_matches:
                places.append({
                    'name': name,
                    'location': location,
                    'description': '',
                    'type': 'well-known'
                })
            
            if places:
                data[cat_key] = {
                    'title': title,
                    'description': '',
                    'type': cat_key,
                    'places': places
                }
                print(f"  📂 {cat_key}: {len(places)} places")
                total_places += len(places)
    
    print(f"\n✅ Found {len(data)} categories with {total_places} total places")
    
    # Import data into database
    imported = 0
    for cat_key, cat_info in data.items():
        if not cat_info.get('places'):
            continue
        
        category, created = CategoryData.objects.update_or_create(
            key=cat_key,
            defaults={
                'title': cat_info.get('title', cat_key.title()),
                'description': cat_info.get('description', f'Explore {cat_info.get("title", cat_key)} in Kerala'),
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
                difficulty='',
                duration='',
                best_time='',
                image='https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80',
                type=place.get('type', 'well-known'),
                hidden_gem='',
                created_by=admin,
                is_active=True
            )
            imported += 1
        
        print(f"  ✅ {cat_key}: {len(cat_info.get('places', []))} places imported")
    
    print("\n" + "="*70)
    print("✅ IMPORT COMPLETE!")
    print(f"   📊 Categories: {len(data)}")
    print(f"   📊 Total places: {imported}")
    print("="*70)

def process_category(name, content, data):
    """Process a category section"""
    # Extract title
    title_match = re.search(r'"title":\s*"([^"]*)"', content)
    if not title_match:
        title_match = re.search(r"title:\s*'([^']*)'", content)
    title = title_match.group(1) if title_match else name.title()
    
    # Extract places
    places = []
    place_pattern = r'"name":\s*"([^"]*)"[^{}]*"location":\s*"([^"]*)"'
    place_matches = re.findall(place_pattern, content)
    
    for place_name, location in place_matches:
        places.append({
            'name': place_name,
            'location': location,
            'description': '',
            'type': 'well-known'
        })
    
    if places:
        data[name] = {
            'title': title,
            'description': '',
            'type': name,
            'places': places
        }
        print(f"  📂 {name}: {len(places)} places")

if __name__ == '__main__':
    import_all_data()