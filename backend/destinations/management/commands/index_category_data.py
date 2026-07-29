# destinations/management/commands/index_category_data.py

from django.core.management.base import BaseCommand
from destinations.models import CategoryData, CategoryPlace
from ai.vector_store import vector_store
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Index CategoryData into Qdrant vector database'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--category',
            type=str,
            help='Index only specific category (e.g., beaches)'
        )
    
    def handle(self, *args, **options):
        self.stdout.write('='*60)
        self.stdout.write('📊 INDEXING CATEGORY DATA TO QDRANT')
        self.stdout.write('='*60)
        
        categories = CategoryData.objects.filter(is_active=True)
        
        if options.get('category'):
            categories = categories.filter(key=options['category'])
        
        total_categories = categories.count()
        
        if total_categories == 0:
            self.stdout.write(self.style.WARNING('⚠️ No categories found!'))
            self.stdout.write('💡 Run import_category_data first to import data from JSX.')
            return
        
        self.stdout.write(f'📂 Found {total_categories} categories')
        
        all_places = []
        total_places = 0
        
        for category in categories:
            places = CategoryPlace.objects.filter(
                category=category.key,
                is_active=True
            )
            
            if not places:
                self.stdout.write(f'⚠️ No places in {category.key}')
                continue
            
            self.stdout.write(f'📍 Processing {category.key}: {places.count()} places')
            
            for place in places:
                all_places.append({
                    'id': place.id,
                    'name': place.name,
                    'location': place.location,
                    'district': place.location,
                    'description': place.description,
                    'category': category.key,
                    'category_title': category.title,
                    'type': place.type or 'well-known',
                    'tags': [],
                    'rating': 0,
                    'best_time': place.best_time or '',
                    'difficulty': place.difficulty or 'Easy',
                    'duration': place.duration or '',
                    'image': place.image or '',
                    'hidden_gem': place.hidden_gem or '',
                    'activities': [],
                    'price': '',
                    'timings': '',
                    'nearby': '',
                    'how_to_reach': '',
                    'source': 'category_data',
                })
                total_places += 1
        
        if not all_places:
            self.stdout.write(self.style.ERROR('❌ No data to index'))
            return
        
        self.stdout.write(f'\n📤 Indexing {total_places} places...')
        
        batch_size = 100
        indexed = 0
        
        for i in range(0, len(all_places), batch_size):
            batch = all_places[i:i+batch_size]
            count = vector_store.index_category_data(batch)
            indexed += count
            self.stdout.write(f'  ✅ Indexed {indexed}/{total_places}')
        
        self.stdout.write(self.style.SUCCESS(f'\n✅ Successfully indexed {indexed} places'))
        
        # Test search
        self.stdout.write('\n🔍 Testing search...')
        test_result = vector_store.search('beach', top_k=3)
        self.stdout.write(f'📊 Search test returned {len(test_result)} results')
        for r in test_result[:3]:
            source = r.get('source', 'unknown')
            self.stdout.write(f'  - {r.get("name")} ({source}) - score: {r.get("score", 0):.3f}')