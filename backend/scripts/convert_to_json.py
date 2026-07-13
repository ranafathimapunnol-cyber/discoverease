#!/usr/bin/env python
# scripts/convert_to_json.py

import json
import re
import os

def convert_js_to_json():
    """Convert categoryData.jsx to clean JSON"""
    
    print("="*50)
    print("🔄 Converting JavaScript/JSX to JSON")
    print("="*50)
    
    # The file is in the frontend directory
    js_file = '../frontend/src/data/categoryData.jsx'
    
    print(f"🔍 Looking for: {js_file}")
    
    if not os.path.exists(js_file):
        print(f"❌ File not found: {js_file}")
        return False
    
    print(f"✅ Found file: {js_file}")
    print(f"📖 Reading file...")
    
    with open(js_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract JSON data - find the first { and last }
    start = content.find('{')
    end = content.rfind('}')
    
    if start == -1 or end == -1:
        print("❌ Could not find data in the file")
        return False
    
    json_str = content[start:end+1]
    
    print("🔧 Cleaning JSON...")
    
    # Step 1: Remove JavaScript comments
    json_str = re.sub(r'//.*?$', '', json_str, flags=re.MULTILINE)
    json_str = re.sub(r'/\*.*?\*/', '', json_str, flags=re.DOTALL)
    
    # Step 2: Remove trailing commas
    json_str = re.sub(r',\s*}', '}', json_str)
    json_str = re.sub(r',\s*]', ']', json_str)
    
    # Step 3: Fix property names - handle both single and double quotes
    # Convert 'property': to "property":
    json_str = re.sub(r"'([^']+)'\s*:", r'"\1":', json_str)
    
    # Step 4: Fix string values - convert single quotes to double quotes
    # But be careful with strings that contain single quotes
    def fix_string_values(match):
        value = match.group(1)
        # Escape any double quotes inside
        value = value.replace('"', '\\"')
        # Handle special characters
        return f': "{value}"'
    
    json_str = re.sub(r":\s*'([^']*)'", fix_string_values, json_str)
    
    # Step 5: Remove any remaining trailing commas
    json_str = re.sub(r',\s*}', '}', json_str)
    json_str = re.sub(r',\s*]', ']', json_str)
    
    # Step 6: Fix multiple commas
    json_str = re.sub(r',\s*,', ',', json_str)
    
    # Step 7: Handle special characters in strings
    json_str = json_str.replace('\\', '\\\\')
    json_str = json_str.replace('"', '\\"')
    
    # Try to parse
    try:
        data = json.loads(json_str)
    except json.JSONDecodeError as e:
        # If parsing fails, try a more aggressive approach
        print(f"⚠️ Initial parse failed: {e}")
        print("🔄 Trying more aggressive cleaning...")
        
        # More aggressive cleaning
        lines = json_str.split('\n')
        cleaned_lines = []
        
        for line in lines:
            # Skip empty lines
            if not line.strip():
                continue
            
            # Remove trailing commas at the end of lines
            line = re.sub(r',\s*$', '', line)
            
            # Fix property names without quotes
            line = re.sub(r'([{,])\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:', r'\1"\2":', line)
            
            # Fix string values
            line = re.sub(r":\s*'([^']*)'", r': "\1"', line)
            line = re.sub(r':\s*"([^"]*)"', r': "\1"', line)
            
            cleaned_lines.append(line)
        
        json_str = '\n'.join(cleaned_lines)
        
        # Remove any remaining trailing commas
        json_str = re.sub(r',\s*}', '}', json_str)
        json_str = re.sub(r',\s*]', ']', json_str)
        
        try:
            data = json.loads(json_str)
        except json.JSONDecodeError as e2:
            print(f"❌ Still having issues: {e2}")
            print(f"   Line {e2.lineno}, Column {e2.colno}")
            
            # Save for debugging
            with open('debug.txt', 'w', encoding='utf-8') as f:
                f.write(json_str)
            print("   Raw data saved to debug.txt")
            return False
    
    # Save the JSON
    output_dir = 'destinations/fixtures'
    os.makedirs(output_dir, exist_ok=True)
    
    output_file = os.path.join(output_dir, 'category_data_full.json')
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Success! JSON saved to: {output_file}")
    
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

if __name__ == '__main__':
    convert_js_to_json()
