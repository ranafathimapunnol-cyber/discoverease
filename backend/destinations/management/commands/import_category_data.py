# management/commands/import_category_data.py - FIXED

import os
import re
import json
import ast
from django.core.management.base import BaseCommand
from destinations.models import CategoryData, CategoryPlace
from accounts.models import User


class Command(BaseCommand):
    help = 'Import category data from frontend/src/data/categoryData.jsx'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            type=str,
            help='Path to categoryData.jsx file',
            default='../frontend/src/data/categoryData.jsx'
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before import'
        )
    
    def handle(self, *args, **options):
        file_path = options['file']
        clear_existing = options.get('clear', False)
        
        self.stdout.write('='*60)
        self.stdout.write('📥 IMPORTING CATEGORY DATA')
        self.stdout.write('='*60)
        
        # Check if file exists
        if not os.path.exists(file_path):
            self.stdout.write(self.style.ERROR(f'❌ File not found: {file_path}'))
            
            # Try alternative paths
            alt_paths = [
                '../frontend/src/data/categoryData.jsx',
                '../../frontend/src/data/categoryData.jsx',
                'frontend/src/data/categoryData.jsx',
                '../src/data/categoryData.jsx',
                '../frontend/src/data/categoryData.js',
                '../frontend/src/data/categoryData.json',
            ]
            
            for alt in alt_paths:
                if os.path.exists(alt):
                    file_path = alt
                    self.stdout.write(f'✅ Found at: {file_path}')
                    break
            else:
                self.stdout.write(self.style.ERROR('❌ Could not find categoryData.jsx'))
                return
        
        self.stdout.write(f'📖 Reading: {file_path}')
        
        # Read file
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Extract data using multiple methods
        data = self._extract_data_safe(content)
        
        if not data:
            self.stdout.write(self.style.ERROR('❌ Could not parse data'))
            self.stdout.write('💡 Using fallback data...')
            data = self._create_fallback_data()
        
        self.stdout.write(f'✅ Found {len(data)} categories')
        
        # Get admin user
        admin, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@discoverease.com',
                'is_staff': True,
                'is_superuser': True
            }
        )
        
        if clear_existing:
            self.stdout.write('🗑️ Clearing existing data...')
            CategoryData.objects.all().delete()
            CategoryPlace.objects.all().delete()
        
        total_categories = 0
        total_places = 0
        created_count = 0
        updated_count = 0
        
        for category_key, category_info in data.items():
            if not category_info or not isinstance(category_info, dict):
                continue
            
            places = category_info.get('places', [])
            if not places:
                continue
            
            # Create category
            cat, is_new = CategoryData.objects.update_or_create(
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
            
            self.stdout.write(f'\n📂 {category_key}: {len(places)} places')
            
            count = 0
            for place in places:
                if not place.get('name'):
                    continue
                
                # Check if exists
                existing = CategoryPlace.objects.filter(
                    category=category_key,
                    name=place.get('name')
                ).first()
                
                if existing:
                    existing.location = place.get('location', existing.location)
                    existing.description = place.get('description', existing.description)
                    existing.difficulty = place.get('difficulty', existing.difficulty)
                    existing.duration = place.get('duration', existing.duration)
                    existing.best_time = place.get('best_time', existing.best_time)
                    existing.image = place.get('image', existing.image)
                    existing.type = place.get('type', existing.type)
                    existing.hidden_gem = place.get('hidden_gem', place.get('hiddenGem', existing.hidden_gem))
                    existing.save()
                    updated_count += 1
                else:
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
                    created_count += 1
                
                count += 1
                total_places += 1
            
            self.stdout.write(self.style.SUCCESS(f'   ✅ Processed {count} places'))
        
        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS('✅ IMPORT COMPLETED!'))
        self.stdout.write(f'   📊 Categories: {total_categories}')
        self.stdout.write(f'   📊 New places: {created_count}')
        self.stdout.write(f'   📊 Updated places: {updated_count}')
        self.stdout.write(f'   📊 Total places: {total_places}')
        self.stdout.write('='*60)
    
    def _extract_data_safe(self, content):
        """Extract data with multiple fallback methods"""
        
        # Method 1: Try to find the data object using regex
        try:
            return self._extract_via_regex(content)
        except Exception as e:
            self.stdout.write(f'⚠️ Method 1 failed: {e}')
        
        # Method 2: Try using ast.literal_eval
        try:
            return self._extract_via_ast(content)
        except Exception as e:
            self.stdout.write(f'⚠️ Method 2 failed: {e}')
        
        # Method 3: Try using json5 (if available)
        try:
            import json5
            return self._extract_via_json5(content)
        except ImportError:
            pass
        except Exception as e:
            self.stdout.write(f'⚠️ Method 3 failed: {e}')
        
        return None
    
    def _extract_via_regex(self, content):
        """Extract data using regex"""
        # Find the data object
        start = content.find('export const categoryData =')
        if start == -1:
            start = content.find('export const categoryData')
        
        if start == -1:
            start = content.find('{')
        else:
            start = content.find('{', start)
        
        if start == -1:
            return None
        
        # Find matching closing brace
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
            return None
        
        data_str = content[start:end]
        
        # Clean the data
        data_str = re.sub(r'//.*?$', '', data_str, flags=re.MULTILINE)
        data_str = re.sub(r'/\*.*?\*/', '', data_str, flags=re.DOTALL)
        data_str = re.sub(r',\s*}', '}', data_str)
        data_str = re.sub(r',\s*]', ']', data_str)
        data_str = re.sub(r":\s*'([^']*)'", r': "\1"', data_str)
        data_str = re.sub(r'([{,])\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:', r'\1"\2":', data_str)
        data_str = re.sub(r'"hiddenGem"', '"hidden_gem"', data_str)
        data_str = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', data_str)
        
        try:
            return json.loads(data_str)
        except json.JSONDecodeError as e:
            self.stdout.write(f'JSON Error: {e}')
            return None
    
    def _extract_via_ast(self, content):
        """Extract using ast.literal_eval"""
        start = content.find('{')
        if start == -1:
            return None
        
        # Find matching brace
        brace_count = 0
        end = start
        for i, char in enumerate(content[start:], start):
            if char == '{':
                brace_count += 1
            elif char == '}':
                brace_count -= 1
                if brace_count == 0:
                    end = i + 1
                    break
        
        if brace_count != 0:
            return None
        
        data_str = content[start:end]
        
        # Convert to Python dict
        data_str = data_str.replace('null', 'None')
        data_str = data_str.replace('true', 'True')
        data_str = data_str.replace('false', 'False')
        data_str = data_str.replace('undefined', 'None')
        
        try:
            return ast.literal_eval(data_str)
        except:
            return None
    
    def _extract_via_json5(self, content):
        """Extract using json5"""
        import json5
        start = content.find('{')
        end = content.rfind('}')
        
        if start == -1 or end == -1:
            return None
        
        data_str = content[start:end+1]
        return json5.loads(data_str)
    
    def _create_fallback_data(self):
        """Create fallback data with all categories"""
        return {
            'beaches': {
                'title': 'Beaches',
                'description': 'Beautiful beaches of Kerala',
                'type': 'beach',
                'places': [
                    {'name': 'Varkala Beach', 'location': 'Thiruvananthapuram', 'description': 'Stunning beach with dramatic red cliffs.', 'type': 'well-known'},
                    {'name': 'Kovalam Beach', 'location': 'Thiruvananthapuram', 'description': 'Popular beach with three crescent-shaped beaches.', 'type': 'well-known'},
                    {'name': 'Muzhappilangad Beach', 'location': 'Kannur', 'description': "Asia's longest drive-in beach.", 'type': 'well-known'},
                    {'name': 'Payyambalam Beach', 'location': 'Kannur', 'description': 'Popular local beach with beautiful sunset views.', 'type': 'well-known'},
                ]
            },
            'hillstations': {
                'title': 'Hill Stations',
                'description': 'Beautiful hill stations of Kerala',
                'type': 'hill_station',
                'places': [
                    {'name': 'Munnar', 'location': 'Idukki', 'description': 'Beautiful hill station with tea gardens and rolling hills.', 'type': 'well-known'},
                    {'name': 'Ranipuram', 'location': 'Kasargod', 'description': 'Scenic hill station with lush green forests.', 'type': 'well-known'},
                    {'name': 'Paithalmala', 'location': 'Kannur', 'description': 'Highest peak in Kannur with stunning sunrise views.', 'type': 'well-known'},
                ]
            },
            'backwaters': {
                'title': 'Backwaters',
                'description': 'Serene backwaters of Kerala',
                'type': 'backwater',
                'places': [
                    {'name': 'Alleppey Backwaters', 'location': 'Alappuzha', 'description': 'World-famous backwaters with houseboat cruises.', 'type': 'well-known'},
                    {'name': 'Kumarakom Backwaters', 'location': 'Kottayam', 'description': 'Peaceful backwaters with bird sanctuary.', 'type': 'well-known'},
                ]
            },
            'waterfalls': {
                'title': 'Waterfalls',
                'description': 'Spectacular waterfalls of Kerala',
                'type': 'waterfall',
                'places': [
                    {'name': 'Athirappilly Waterfalls', 'location': 'Thrissur', 'description': 'The Niagara of India - spectacular waterfall.', 'type': 'well-known'},
                    {'name': 'Cheeyappara Waterfalls', 'location': 'Idukki', 'description': 'Seven-tiered cascade near Munnar.', 'type': 'well-known'},
                    {'name': 'Meenmutty Waterfalls', 'location': 'Wayanad', 'description': '300-meter three-tiered waterfall.', 'type': 'well-known'},
                    {'name': 'Palaruvi Waterfalls', 'location': 'Kollam', 'description': '300-foot cascade in Thenmala.', 'type': 'well-known'},
                ]
            },
            'wildlife': {
                'title': 'Wildlife Sanctuaries',
                'description': 'Wildlife sanctuaries of Kerala',
                'type': 'wildlife',
                'places': [
                    {'name': 'Periyar Wildlife Sanctuary', 'location': 'Idukki', 'description': 'Tiger reserve in the Cardamom Hills.', 'type': 'well-known'},
                    {'name': 'Kumarakom Bird Sanctuary', 'location': 'Kottayam', 'description': 'Bird sanctuary on the banks of Vembanad Lake.', 'type': 'well-known'},
                ]
            }
        }