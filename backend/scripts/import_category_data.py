# scripts/import_category_data.py - UPDATED FOR JSX

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

def parse_jsx_file():
    """Parse the categoryData.jsx file directly"""
    js_file = '../frontend/src/data/categoryData.jsx'
    
    print("="*50)
    print("📖 Reading categoryData.jsx")
    print("="*50)
    
    if not os.path.exists(js_file):
        print(f"❌ File not found: {js_file}")
        return None
    
    with open(js_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract the data between export const categoryData = { and };
    start = content.find('export const categoryData = {')
    if start == -1:
        # Try alternative format
        start = content.find('export const categoryData =')
        if start == -1:
            print("❌ Could not find 'export const categoryData'")
            return None
    
    start = content.find('{', start)
    if start == -1:
        print("❌ Could not find opening brace")
        return None
    
    # Find the matching closing brace
    brace_count = 0
    in_string = False
    escape = False
    end = start
    
    for i, char in enumerate(content[start:], start):
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
                end = i + 1
                break
    
    if brace_count != 0:
        print("❌ Could not find matching closing brace")
        return None
    
    data_str = content[start:end]
    
    print(f"✅ Extracted data (length: {len(data_str)} chars)")
    
    # Clean the data
    print("🔧 Cleaning data...")
    
    # Remove all single-line comments
    data_str = re.sub(r'//.*?$', '', data_str, flags=re.MULTILINE)
    
    # Remove multi-line comments
    data_str = re.sub(r'/\*.*?\*/', '', data_str, flags=re.DOTALL)
    
    # Remove trailing commas in objects and arrays
    data_str = re.sub(r',\s*}', '}', data_str)
    data_str = re.sub(r',\s*]', ']', data_str)
    
    # Fix property names without quotes - add quotes
    def fix_property_names(text):
        lines = text.split('\n')
        fixed = []
        
        for line in lines:
            if not line.strip():
                fixed.append(line)
                continue
            
            # Skip if line is empty or just whitespace
            stripped = line.strip()
            if not stripped:
                fixed.append(line)
                continue
            
            # Add quotes to property names at start of line
            # Pattern: word: at start of line (after whitespace)
            line = re.sub(r'^(\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*):', r'\1"\2"\3:', line)
            
            # Add quotes to property names after comma
            line = re.sub(r',\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:', r', "\1":', line)
            
            fixed.append(line)
        
        return '\n'.join(fixed)
    
    data_str = fix_property_names(data_str)
    
    # Fix single quotes to double quotes for string values
    def fix_string_values(text):
        # Find patterns like : 'value' and replace with : "value"
        def replace_single_quotes(match):
            value = match.group(1)
            # Escape any double quotes inside
            value = value.replace('"', '\\"')
            return f': "{value}"'
        
        # Replace single quoted values
        text = re.sub(r':\s*\'([^\']*)\'', replace_single_quotes, text)
        
        return text
    
    data_str = fix_string_values(data_str)
    
    # Convert hiddenGem to hidden_gem
    data_str = re.sub(r'"hiddenGem"', '"hidden_gem"', data_str)
    
    # Remove any remaining trailing commas
    data_str = re.sub(r',\s*}', '}', data_str)
    data_str = re.sub(r',\s*]', ']', data_str)
    
    # Fix any double commas
    data_str = re.sub(r',\s*,', ',', data_str)
    
    # Save cleaned version for debugging
    with open('cleaned_data.txt', 'w', encoding='utf-8') as f:
        f.write(data_str)
    
    print("📝 Parsing JSON...")
    
    try:
        data = json.loads(data_str)
        print("✅ Successfully parsed JSON!")
        return data
    except json.JSONDecodeError as e:
        print(f"❌ JSON Error: {e}")
        print(f"   Line {e.lineno}, Column {e.colno}")
        
        # Show the problematic line
        lines = data_str.split('\n')
        if e.lineno <= len(lines):
            print(f"\nProblem line: {lines[e.lineno-1]}")
            
        # Try to find and fix the specific issue
        print("\n🔧 Attempting to fix specific issues...")
        
        # If the error is about property names, try more aggressive fixing
        if "Expecting property name" in str(e):
            # Fix all property names
            data_str = re.sub(r'([{,])\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:', r'\1"\2":', data_str)
        
        # Remove any remaining single quotes
        data_str = re.sub(r':\s*\'([^\']*)\'', r': "\1"', data_str)
        
        # Remove trailing commas
        data_str = re.sub(r',\s*}', '}', data_str)
        data_str = re.sub(r',\s*]', ']', data_str)
        
        try:
            data = json.loads(data_str)
            print("✅ Successfully parsed with fixes!")
            return data
        except json.JSONDecodeError as e2:
            print(f"❌ Still failing: {e2}")
            return None

def import_data(data):
    """Import the parsed data into the database"""
    print("\n" + "="*50)
    print("📥 Importing Data to Database")
    print("="*50)
    
    if not data:
        print("❌ No data to import")
        return
    
    # Get admin user
    admin_user, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@discoverease.com',
            'is_staff': True,
            'is_superuser': True
        }
    )
    print(f"✅ Using admin: {admin_user.email}")
    
    # Clear existing data
    print("🗑️ Clearing existing CategoryData and CategoryPlace...")
    CategoryData.objects.all().delete()
    CategoryPlace.objects.all().delete()
    
    total_categories = 0
    total_places = 0
    skipped = 0
    
    for category_key, category_info in data.items():
        if not category_info or not isinstance(category_info, dict):
            print(f"⚠️ Skipping {category_key} - invalid data")
            continue
        
        places = category_info.get('places', [])
        if not places:
            print(f"⚠️ Skipping {category_key} - no places found")
            continue
        
        # Create category
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
        
        print(f"\n📂 {category_key}: {len(places)} places")
        
        place_count = 0
        for place in places:
            try:
                # Skip if name is missing
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
                    image=place.get('image', ''),
                    type=place.get('type', 'well-known'),
                    hidden_gem=place.get('hidden_gem', place.get('hiddenGem', '')),
                    is_active=True
                )
                place_count += 1
                total_places += 1
                
                if place_count % 10 == 0:
                    print(f"   ✅ {place_count} places imported...")
                    
            except Exception as e:
                print(f"   ❌ Error importing {place.get('name', 'Unknown')}: {str(e)}")
                skipped += 1
        
        print(f"   ✅ Imported {place_count} places in {category_key}")
    
    print("\n" + "="*50)
    print(f"✅ IMPORT COMPLETED!")
    print(f"   • Categories: {total_categories}")
    print(f"   • Places imported: {total_places}")
    print(f"   • Skipped: {skipped}")
    print("="*50)
    
    # Show summary
    print("\n📊 Summary:")
    for cat in CategoryData.objects.filter(is_active=True):
        count = CategoryPlace.objects.filter(category=cat.key).count()
        print(f"   • {cat.key}: {count} places")

if __name__ == '__main__':
    data = parse_jsx_file()
    if data:
        import_data(data)
    else:
        print("\n❌ Could not parse the data file.")
        print("Please check that your categoryData.jsx file is valid.")