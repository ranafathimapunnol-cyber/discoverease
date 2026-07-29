# force_index.py - Run this with python manage.py shell < force_index.py

import os
import sys
import django

# Setup Django
sys.path.append('/Users/ismailpunnol/DiscoverEase/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from destinations.models import Destination, CategoryData, CategoryPlace
from ai.vector_store import vector_store
from ai.embeddings import embedding_service
from qdrant_client.http.models import PointStruct, Distance, VectorParams

print("="*60)
print("📊 FORCE INDEXING ALL DATA")
print("="*60)

# Delete and recreate collection
try:
    vector_store.delete_collection()
    print("✅ Deleted old collection")
except:
    print("⚠️ No collection to delete")

vector_store.client.create_collection(
    collection_name='kerala_destinations',
    vectors_config=VectorParams(size=384, distance=Distance.COSINE)
)
print("✅ Recreated collection")

# 1. Index Destinations
print("\n📍 Indexing Destinations...")
destinations = Destination.objects.all()
dest_data = []

for dest in destinations:
    dest_data.append({
        'id': dest.id,
        'name': dest.name,
        'district': dest.district or 'Unknown',
        'description': dest.long_description or dest.short_description or '',
        'category': dest.category or 'destination',
        'category_title': dest.category or 'Destination',
        'type': 'well-known',
        'source': 'destination',
        'rating': float(dest.average_rating or 0),
        'full_text': f"{dest.name} {dest.district} {dest.long_description or dest.short_description or ''}"
    })

print(f"  Found {len(dest_data)} destinations")

if dest_data:
    texts = [d['full_text'] for d in dest_data]
    vectors = embedding_service.embed_batch(texts)
    
    points = []
    for dest, vector in zip(dest_data, vectors):
        points.append(PointStruct(
            id=dest['id'],
            vector=vector,
            payload={
                'id': dest['id'],
                'name': dest['name'],
                'district': dest['district'],
                'description': dest['description'],
                'category': dest['category'],
                'category_title': dest['category_title'],
                'type': dest['type'],
                'source': 'destination',
                'rating': dest['rating'],
            }
        ))
    
    # Upload in batches
    for i in range(0, len(points), 100):
        batch = points[i:i+100]
        vector_store.client.upsert(
            collection_name='kerala_destinations',
            points=batch,
            wait=True
        )
        print(f"  ✅ Uploaded {len(batch)} destination vectors")
    
    print(f"✅ Indexed {len(points)} destinations")

# 2. Index Category Data
print("\n📂 Indexing Category Data...")
categories = CategoryData.objects.filter(is_active=True)
all_places = []

for category in categories:
    places = CategoryPlace.objects.filter(category=category.key, is_active=True)
    print(f"  {category.key}: {places.count()} places")
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
            'source': 'category_data',
        })

print(f"  Total category places: {len(all_places)}")

if all_places:
    texts = [f"{p['name']} {p['location']} {p['description']} {p['category']}" for p in all_places]
    vectors = embedding_service.embed_batch(texts)
    
    points = []
    for item, vector in zip(all_places, vectors):
        points.append(PointStruct(
            id=item['id'],
            vector=vector,
            payload={
                'id': item['id'],
                'name': item['name'],
                'district': item['district'],
                'location': item['location'],
                'description': item['description'],
                'category': item['category'],
                'category_title': item['category_title'],
                'type': item['type'],
                'source': 'category_data',
            }
        ))
    
    # Upload in batches
    for i in range(0, len(points), 100):
        batch = points[i:i+100]
        vector_store.client.upsert(
            collection_name='kerala_destinations',
            points=batch,
            wait=True
        )
        print(f"  ✅ Uploaded {len(batch)} category vectors")
    
    print(f"✅ Indexed {len(points)} category places")

# 3. Test
print("\n🔍 Testing search...")
results = vector_store.search("beach", top_k=5)
print(f"Found {len(results)} results:")
for r in results[:5]:
    print(f"  - {r.get('name')} ({r.get('category')}) - score: {r.get('score', 0):.3f}")

results = vector_store.search("waterfall", top_k=5)
print(f"\nFound {len(results)} waterfall results:")
for r in results[:5]:
    print(f"  - {r.get('name')} ({r.get('category')}) - score: {r.get('score', 0):.3f}")

info = vector_store.get_collection_info()
print(f"\n📊 Total points in collection: {info.get('points_count', 0)}")
print("\n✅ DONE! Data is now indexed.")
