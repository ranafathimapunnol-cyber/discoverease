#!/usr/bin/env python
# scripts/convert_final.py

import json
import re
import os

def convert_jsx_to_json():
    """Convert JSX to clean JSON - Final version"""
    
    print("="*50)
    print("🔄 Converting JSX to JSON")
    print("="*50)
    
    js_file = '../frontend/src/data/categoryData.jsx'
    
    if not os.path.exists(js_file):
        print(f"❌ File not found: {js_file}")
        return False
    
    print(f"📖 Reading: {js_file}")
    
    with open(js_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Step 1: Extract the data
    start = content.find('{')
    end = content.rfind('}')
    
    if start == -1 or end == -1:
        print("❌ Could not find data")
        return False
    
    data_str = content[start:end+1]
    
    print("🔧 Converting to JSON format...")
    
    # Step 2: Remove all comments
    data_str = re.sub(r'//.*?$', '', data_str, flags=re.MULTILINE)
    data_str = re.sub(r'/\*.*?\*/', '', data_str, flags=re.DOTALL)
    
    # Step 3: Fix the image URLs (replace incomplete ones)
    data_str = re.sub(r'image: "https:', r'image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80",', data_str)
    
    # Step 4: Fix single quotes in type
    data_str = re.sub(r"type: 'well-known'", r'type: "well-known"', data_str)
    data_str = re.sub(r"type: 'hidden'", r'type: "hidden"', data_str)
    
    # Step 5: Fix any other single quotes
    data_str = re.sub(r":\s*'([^']*)'", r': "\1"', data_str)
    
    # Step 6: Add quotes to property names
    # Pattern: start of line or after { or , then property name, then :
    def fix_property_names(text):
        # Find all property names without quotes
        # Look for patterns like: propertyName: or "propertyName":
        lines = text.split('\n')
        fixed_lines = []
        
        for line in lines:
            # Skip empty lines
            if not line.strip():
                fixed_lines.append(line)
                continue
            
            # If line has a property: value pattern
            # Match property names that don't have quotes
            # This pattern finds: word: at the start of a line or after a {
            pattern = r'^(\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*):'
            
            def add_quotes(match):
                indent = match.group(1)
                prop = match.group(2)
                space = match.group(3)
                # Don't add quotes if already has them
                return f'{indent}"{prop}"{space}:'
            
            line = re.sub(pattern, add_quotes, line)
            
            # Also handle properties that appear after a comma
            line = re.sub(r',\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:', r', "\1":', line)
            
            fixed_lines.append(line)
        
        return '\n'.join(fixed_lines)
    
    data_str = fix_property_names(data_str)
    
    # Step 7: Add missing commas
    lines = data_str.split('\n')
    fixed_lines = []
    
    for i, line in enumerate(lines):
        fixed_lines.append(line)
        
        # Check if we need to add a comma
        if i < len(lines) - 1:
            stripped = line.strip()
            next_line = lines[i + 1].strip()
            
            # If current line has a value and next line is a property
            if stripped and not stripped.endswith('{') and not stripped.endswith('[') and not stripped.endswith(','):
                if next_line and next_line.startswith('"') and ':' in next_line:
                    fixed_lines[i] = line.rstrip() + ','
    
    data_str = '\n'.join(fixed_lines)
    
    # Step 8: Remove trailing commas
    data_str = re.sub(r',\s*}', '}', data_str)
    data_str = re.sub(r',\s*]', ']', data_str)
    
    # Step 9: Fix any double commas
    data_str = re.sub(r',\s*,', ',', data_str)
    
    # Step 10: Ensure all strings have proper quotes
    def fix_string_values(text):
        # Find string values without quotes
        # Pattern: : value where value doesn't have quotes
        def add_quotes_to_value(match):
            key = match.group(1)
            value = match.group(2).strip()
            # Skip if already has quotes
            if value.startswith('"') or value.startswith("'"):
                return f'"{key}": {value}'
            # Skip if it's a number or boolean
            if value.isdigit() or value in ['true', 'false', 'null']:
                return f'"{key}": {value}'
            # Add quotes
            return f'"{key}": "{value}"'
        
        # Find patterns like "key": value
        text = re.sub(r'"([^"]+)":\s*([^,}]+)', add_quotes_to_value, text)
        return text
    
    data_str = fix_string_values(data_str)
    
    # Step 11: Fix the specific issue with "resorts"
    data_str = re.sub(r'"resorts":\s*{', '"resorts": {', data_str)
    
    # Step 12: Fix duplicate commas
    data_str = re.sub(r',\s*,', ',', data_str)
    data_str = re.sub(r',\s*}', '}', data_str)
    data_str = re.sub(r',\s*]', ']', data_str)
    
    # Save cleaned data for debugging
    with open('final_clean.txt', 'w', encoding='utf-8') as f:
        f.write(data_str)
    
    print("📝 Attempting to parse JSON...")
    
    try:
        # Try to parse
        data = json.loads(data_str)
        print("✅ Successfully parsed!")
        
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
                print(f"{prefix}{i+1}: {lines[i][:200]}")
                if i == e.lineno - 1:
                    print(f"     {' ' * (e.colno-1)}^")
        
        print("\n📝 Full cleaned data saved to: final_clean.txt")
        print("🔧 To fix manually, open final_clean.txt and check the error line")
        
        return False

if __name__ == '__main__':
    convert_jsx_to_json()
