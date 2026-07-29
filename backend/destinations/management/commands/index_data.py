from django.core.management.base import BaseCommand
from django.utils import timezone
from destinations.models import Destination
from ai.vector_store import vector_store
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Index destinations to Qdrant vector database'
    
    def handle(self, *args, **options):
        self.stdout.write('🔄 Indexing destinations to Qdrant...')
        
        destinations = Destination.objects.all()
        total = destinations.count()
        
        if total == 0:
            self.stdout.write(self.style.WARNING('⚠️ No destinations found!'))
            self.stdout.write('💡 Make sure you have data in your database.')
            return
        
        self.stdout.write(f'📊 Found {total} destinations')
        
        dest_data = []
        
        for dest in destinations:
            full_text = dest.get_full_text()
            if not full_text:
                self.stdout.write(f'⚠️ Skipping {dest.name} (no text)')
                continue
            
            dest_data.append({
                'id': dest.id,
                'name': dest.name,
                'district': dest.district or 'Unknown',
                'description': dest.long_description or dest.short_description or '',
                'category': dest.category,
                'difficulty': 'Easy',  # Default since your model doesn't have this
                'best_time': '',  # You can add this field if needed
                'image': dest.featured_image,
                'type': 'well-known' if dest.status != 'hidden' else 'hidden',
                'hidden_gem': '',
                'price': 'Free',
                'rating': float(dest.average_rating or 0),
                'full_text': full_text,
            })
        
        if not dest_data:
            self.stdout.write(self.style.ERROR('❌ No data to index'))
            return
        
        batch_size = 100
        indexed = 0
        total_to_index = len(dest_data)
        
        self.stdout.write(f'📤 Indexing {total_to_index} destinations...')
        
        for i in range(0, total_to_index, batch_size):
            batch = dest_data[i:i+batch_size]
            count = vector_store.index_destinations(batch)
            indexed += count
            self.stdout.write(f'  ✅ Indexed {indexed}/{total_to_index}')
        
        # Update sync status
        Destination.objects.all().update(
            vector_synced=True,
            last_synced_at=timezone.now()
        )
        
        self.stdout.write(self.style.SUCCESS(f'✅ Successfully indexed {indexed} destinations'))
        
        # Test search
        self.stdout.write('🔍 Testing search...')
        test_result = vector_store.search('beach', top_k=3)
        self.stdout.write(f'📊 Search test returned {len(test_result)} results')
        for r in test_result[:3]:
            self.stdout.write(f'  - {r.get("name")} (score: {r.get("score", 0):.3f})')