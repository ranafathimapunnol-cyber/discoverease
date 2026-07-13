#!/usr/bin/env python
# scripts/fix_and_convert.py

import json
import re
import os

def fix_jsx_data():
    """Fix and convert the JSX data to JSON"""
    
    print("="*50)
    print("🔧 Fixing and Converting JSX to JSON")
    print("="*50)
    
    js_file = '../frontend/src/data/categoryData.jsx'
    
    print(f"📖 Reading: {js_file}")
    
    with open(js_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract the data
    start = content.find('{')
    end = content.rfind('}')
    
    if start == -1 or end == -1:
        print("❌ Could not find data")
        return False
    
    data_str = content[start:end+1]
    
    print("🔧 Fixing common issues...")
    
    # 1. Fix incomplete image URLs (add placeholder)
    data_str = re.sub(r'image: "https:', r'image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80', data_str)
    
    # 2. Fix single quotes to double quotes in values
    data_str = re.sub(r"type: 'well-known'", r'type: "well-known"', data_str)
    data_str = re.sub(r"type: 'hidden'", r'type: "hidden"', data_str)
    
    # 3. Fix any other single quotes
    def fix_single_quotes(match):
        return match.group(0).replace("'", '"')
    
    data_str = re.sub(r":\s*'([^']*)'", lambda m: f': "{m.group(1)}"', data_str)
    
    # 4. Add missing commas between object properties
    # Pattern: property: value newline property: value
    # Add comma after value if next line has a property
    lines = data_str.split('\n')
    fixed_lines = []
    
    for i, line in enumerate(lines):
        fixed_lines.append(line)
        
        # Check if this line ends a property and next line is a property
        if i < len(lines) - 1:
            current_line = line.strip()
            next_line = lines[i + 1].strip()
            
            # If current line doesn't end with {, [, or , and next line starts with a word ending with :
            if current_line and not current_line.endswith('{') and not current_line.endswith('[') and not current_line.endswith(','):
                if next_line and re.match(r'^[a-zA-Z_]+:', next_line):
                    fixed_lines[i] = line.rstrip() + ','
    
    data_str = '\n'.join(fixed_lines)
    
    # 5. Remove trailing commas in objects and arrays
    data_str = re.sub(r',\s*}', '}', data_str)
    data_str = re.sub(r',\s*]', ']', data_str)
    
    # 6. Fix property names without quotes (add quotes)
    data_str = re.sub(r'([{,])\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:', r'\1"\2":', data_str)
    
    # 7. Fix any remaining issues
    data_str = re.sub(r',\s*,', ',', data_str)
    
    # Save cleaned data for debugging
    with open('cleaned_debug.txt', 'w', encoding='utf-8') as f:
        f.write(data_str)
    
    print("📝 Cleaning complete. Attempting to parse...")
    
    # Try to parse the JSON
    try:
        data = json.loads(data_str)
        print("✅ JSON parsed successfully!")
        
        # Save to fixtures
        output_dir = 'destinations/fixtures'
        os.makedirs(output_dir, exist_ok=True)
        
        output_file = os.path.join(output_dir, 'category_data_full.json')
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"\n✅ JSON saved to: {output_file}")
        
        # Show summary
        print("\n📊 Data Summary:")
        total = 0
        for cat, info in data.items():
            if isinstance(info, dict) and 'places' in info:
                count = len(info['places'])
                total += count
                print(f"   - {cat}: {count} places")
        
        print(f"\n📈 Total: {total} places in {len(data)} categories")
        print("\n💡 Next step: Run import command")
        print(f"   python3 manage.py import_destinations --file={output_file} --clear")
        
        return True
        
    except json.JSONDecodeError as e:
        print(f"❌ JSON Error: {e}")
        print(f"   Line {e.lineno}, Column {e.colno}")
        
        # Show the problematic line
        lines = data_str.split('\n')
        if e.lineno <= len(lines):
            start_line = max(0, e.lineno - 3)
            end_line = min(len(lines), e.lineno + 2)
            print(f"\n🔍 Context around line {e.lineno}:")
            for i in range(start_line, end_line):
                prefix = ">>> " if i == e.lineno - 1 else "    "
                print(f"{prefix}{i+1}: {lines[i]}")
                if i == e.lineno - 1:
                    print(f"     {' ' * (e.colno-1)}^")
        
        print("\n📝 Cleaned data saved to cleaned_debug.txt for inspection")
        return False

def manual_fix():
    """Manual fix approach"""
    print("\n🔄 Trying manual fix approach...")
    
    with open('cleaned_debug.txt', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # More aggressive fixes
    # Fix incomplete URLs
    content = re.sub(r'"https:', r'"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80"', content)
    
    # Fix any remaining issues
    content = re.sub(r',\s*}', '}', content)
    content = re.sub(r',\s*]', ']', content)
    content = re.sub(r'\\"', '"', content)
    
    try:
        data = json.loads(content)
        print("✅ Manual fix successful!")
        
        output_file = 'destinations/fixtures/category_data_full.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"\n✅ JSON saved to: {output_file}")
        return True
        
    except json.JSONDecodeError as e:
        print(f"❌ Manual fix failed: {e}")
        return False

if __name__ == '__main__':
    if not fix_jsx_data():
        manual_fix()
