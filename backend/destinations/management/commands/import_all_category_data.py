# management/commands/import_all_category_data.py

import os
import re
import json
import ast
from django.core.management.base import BaseCommand
from destinations.models import CategoryData, CategoryPlace
from accounts.models import User


class Command(BaseCommand):
    help = 'Import ALL category data from frontend/src/data/categoryData.jsx'
    
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
        self.stdout.write('📥 IMPORTING ALL CATEGORY DATA')
        self.stdout.write('='*60)
        
        # Check if file exists
        if not os.path.exists(file_path):
            self.stdout.write(self.style.ERROR(f'❌ File not found: {file_path}'))
            alt_paths = [
                '../frontend/src/data/categoryData.jsx',
                '../../frontend/src/data/categoryData.jsx',
                'frontend/src/data/categoryData.jsx',
            ]
            for alt in alt_paths:
                if os.path.exists(alt):
                    file_path = alt
                    self.stdout.write(f'✅ Found at: {file_path}')
                    break
            else:
                return
        
        self.stdout.write(f'📖 Reading: {file_path}')
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Parse the JSX file
        data = self._parse_jsx_file(content)
        
        if not data:
            self.stdout.write(self.style.ERROR('❌ Could not parse data'))
            return
        
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
        
        for category_key, category_info in data.items():
            if not category_info or not isinstance(category_info, dict):
                continue
            
            places = category_info.get('places', [])
            if not places:
                continue
            
            # Create category
            cat, created = CategoryData.objects.update_or_create(
                key=category_key,
                defaults={
                    'title': category_info.get('title', category_key.title()),
                    'description': category_info.get('description', ''),
                    'type': category_info.get('type', ''),
                    'is_active': True
                }
            )
            total_categories += 1
            
            self.stdout.write(f'\n📂 {category_key}: {len(places)} places')
            
            count = 0
            for place in places:
                if not place.get('name'):
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
                count += 1
                total_places += 1
                
                if count % 20 == 0:
                    self.stdout.write(f'   ✅ {count} places processed...')
            
            self.stdout.write(self.style.SUCCESS(f'   ✅ Imported {count} places'))
        
        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS('✅ IMPORT COMPLETED!'))
        self.stdout.write(f'   📊 Categories: {total_categories}')
        self.stdout.write(f'   📊 Total places: {total_places}')
        self.stdout.write('='*60)
        
        # Show summary
        self.stdout.write('\n📊 Summary:')
        for cat in CategoryData.objects.filter(is_active=True):
            count = CategoryPlace.objects.filter(category=cat.key).count()
            self.stdout.write(f'   • {cat.key}: {count} places')
    
    def _parse_jsx_file(self, content):
        """Parse the JSX file using multiple methods"""
        data = {}
        
        # Method 1: Find all category sections
        category_pattern = r'(\w+):\s*\{[^}]*title:\s*[\'"]([^\'"]+)[\'"][^}]*places:\s*\[([^\]]*)\]'
        matches = re.findall(category_pattern, content, re.DOTALL)
        
        if matches:
            self.stdout.write(f'🔍 Found {len(matches)} categories with regex')
            for category_key, title, places_str in matches:
                if category_key in ['export', 'const', 'categoryData']:
                    continue
                places = self._parse_places(places_str)
                if places:
                    data[category_key] = {
                        'title': title,
                        'places': places
                    }
                    self.stdout.write(f'  📂 {category_key}: {len(places)} places')
            return data if data else None
        
        # Method 2: Manual parse
        self.stdout.write('⚠️ No categories found with regex, trying manual parse...')
        return self._parse_manually(content)
    
    def _parse_places(self, places_str):
        """Parse places from a category's places array"""
        places = []
        place_pattern = r'\{([^}]*?name:\s*["\']([^"\']+)["\'][^}]*)\}'
        matches = re.findall(place_pattern, places_str, re.DOTALL)
        
        for full_match, name in matches:
            place = {'name': name}
            
            # Extract fields
            fields = ['location', 'description', 'difficulty', 'duration', 'bestTime', 'image', 'type', 'hiddenGem']
            for field in fields:
                pattern = rf'{field}:\s*["\']([^"\']+)["\']'
                match = re.search(pattern, full_match)
                if match:
                    key = 'best_time' if field == 'bestTime' else 'hidden_gem' if field == 'hiddenGem' else field
                    place[key] = match.group(1)
            
            places.append(place)
        
        return places
    
    def _parse_manually(self, content):
        """Manual parse as last resort"""
        data = {}
        
        category_keys = ['resorts', 'wildlife', 'parks', 'walking', 'waterfall', 'beaches', 
                        'backwaters', 'hillstations', 'heritage', 'camping', 'caves', 
                        'spelunking', 'kayaking', 'mountainbiking', 'zoos', 'museums']
        
        for category in category_keys:
            start = content.find(f'{category}:')
            if start == -1:
                continue
            
            # Find places in this category
            place_pattern = r'\{[^}]*name:\s*["\']([^"\']+)["\'][^}]*location:\s*["\']([^"\']+)["\'][^}]*\}'
            places = re.findall(place_pattern, content[start:start+10000])
            
            if places:
                data[category] = {
                    'title': category.title(),
                    'places': [
                        {
                            'name': p[0],
                            'location': p[1],
                            'description': '',
                            'type': 'well-known'
                        }
                        for p in places
                    ]
                }
                self.stdout.write(f'  📂 {category}: {len(places)} places (manual)')
        
        return data if data else None
