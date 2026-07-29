# management/commands/index_all_data.py

from django.core.management.base import BaseCommand
from django.utils import timezone
from destinations.models import Destination, CategoryData, CategoryPlace
from ai.vector_store import vector_store
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Index ALL data (Destinations + CategoryData) to Qdrant'
    
    def handle(self, *args, **options):
        self.stdout.write('='*60)
        self.stdout.write('📊 INDEXING ALL DATA TO QDRANT')
        self.stdout.write('='*60)
        
        total_indexed = 0
        
        # 1. Index Destinations
        self.stdout.write('\n📍 Indexing Destinations...')
        destinations = Destination.objects.all()
        dest_count = destinations.count()
        
        if dest_count > 0:
            dest_data = []
            for dest in destinations:
                full_text = dest.get_full_text() if hasattr(dest, 'get_full_text') else dest.name
                dest_data.append({
                    'id': dest.id,
                    'name': dest.name,
                    'district': dest.district or 'Unknown',
                    'description': dest.long_description or dest.short_description or '',
                    'category': dest.category or 'destination',
                    'category_title': dest.category or 'Destination',
                    'type': 'well-known' if dest.status != 'hidden' else 'hidden',
                    'tags': [],
                    'rating': float(dest.average_rating or 0),
                    'best_time': '',
                    'difficulty': 'Easy',
                    'duration': '',
                    'image': dest.featured_image or '',
                    'hidden_gem': '',
                    'activities': [],
                    'full_text': full_text,
                    'source': 'destination',
                })
            
            count = vector_store.index_destinations(dest_data)
            total_indexed += count
            self.stdout.write(self.style.SUCCESS(f'  ✅ Indexed {count} destinations'))
            
            # Update sync status
            Destination.objects.all().update(
                vector_synced=True,
                last_synced_at=timezone.now()
            )
        else:
            self.stdout.write('  ⚠️ No destinations found')
        
        # 2. Index CategoryData
        self.stdout.write('\n📂 Indexing Category Data...')
        categories = CategoryData.objects.filter(is_active=True)
        
        if categories.exists():
            all_places = []
            for category in categories:
                places = CategoryPlace.objects.filter(
                    category=category.key,
                    is_active=True
                )
                
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
                        'source': 'category_data',
                    })
            
            if all_places:
                count = vector_store.index_category_data(all_places)
                total_indexed += count
                self.stdout.write(self.style.SUCCESS(f'  ✅ Indexed {count} category items'))
            else:
                self.stdout.write('  ⚠️ No category places found')
        else:
            self.stdout.write('  ⚠️ No category data found')
        
        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS(f'✅ TOTAL INDEXED: {total_indexed} items'))
        self.stdout.write('='*60)
        
        # Test search
        self.stdout.write('\n🔍 Testing search...')
        test_result = vector_store.search('beach', top_k=5)
        self.stdout.write(f'📊 Search test returned {len(test_result)} results')
        for r in test_result[:5]:
            source = r.get('source', 'unknown')
            self.stdout.write(f'  - {r.get("name")} ({source}) - score: {r.get("score", 0):.3f}')