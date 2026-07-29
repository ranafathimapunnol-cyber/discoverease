import os
import sys
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.append('/Users/ismailpunnol/DiscoverEase/backend')
import django
django.setup()

from destinations.models import Destination, CategoryData, CategoryPlace
from ai.vector_store import vector_store
from ai.embeddings import embedding_service
from qdrant_client.http.models import PointStruct, Distance, VectorParams

print("="*60)
print("🔥 FINAL FIX - INDEXING ALL DATA (PERSISTENT)")
print("="*60)

# Check if collection exists
info = vector_store.get_collection_info()
points_count = info.get('points_count', 0)

if points_count > 0:
    print(f"📊 Collection already has {points_count} points")
    print("✅ Data already indexed! No need to re-index.")
    exit()

# Create collection if not exists
try:
    collections = vector_store.client.get_collections()
    exists = any(c.name == 'kerala_destinations' for c in collections.collections)
    if not exists:
        vector_store.client.create_collection(
            collection_name='kerala_destinations',
            vectors_config=VectorParams(size=384, distance=Distance.COSINE)
        )
        print("✅ Created collection")
except:
    vector_store.client.create_collection(
        collection_name='kerala_destinations',
        vectors_config=VectorParams(size=384, distance=Distance.COSINE)
    )
    print("✅ Created collection")

# INDEX DESTINATIONS
print("\n📍 Indexing destinations...")
dest_data = []
for d in Destination.objects.all():
    dest_data.append({
        'id': d.id,
        'name': d.name,
        'district': d.district or 'Unknown',
        'description': d.long_description or d.short_description or '',
        'category': 'destination',
        'category_title': 'Destinations',
        'source': 'destination',
        'full_text': f"{d.name} {d.district} {d.long_description or d.short_description or ''}"
    })

print(f"  Found {len(dest_data)} destinations")

texts = [d['full_text'] for d in dest_data]
vectors = embedding_service.embed_batch(texts)

points = []
for d, v in zip(dest_data, vectors):
    points.append(PointStruct(
        id=d['id'],
        vector=v,
        payload={
            'id': d['id'],
            'name': d['name'],
            'district': d['district'],
            'description': d['description'],
            'category': 'destination',
            'category_title': 'Destinations',
            'source': 'destination',
        }
    ))

for i in range(0, len(points), 100):
    batch = points[i:i+100]
    vector_store.client.upsert(collection_name='kerala_destinations', points=batch, wait=True)
    print(f"  ✅ Uploaded {len(batch)} destination vectors")

print(f"✅ Indexed {len(points)} destinations")

# INDEX CATEGORY DATA
print("\n📂 Indexing category data...")
places = []
for cat in CategoryData.objects.filter(is_active=True):
    category_places = CategoryPlace.objects.filter(category=cat.key, is_active=True)
    print(f"  {cat.key}: {category_places.count()} places")
    for p in category_places:
        places.append({
            'id': p.id,
            'name': p.name,
            'district': p.location,
            'description': p.description,
            'category': cat.key,
            'category_title': cat.title,
            'source': 'category_data',
        })

print(f"  Total category places: {len(places)}")

if places:
    texts = [f"{p['name']} {p['district']} {p['description']}" for p in places]
    vectors = embedding_service.embed_batch(texts)
    points = []
    for p, v in zip(places, vectors):
        points.append(PointStruct(
            id=p['id'],
            vector=v,
            payload={
                'id': p['id'],
                'name': p['name'],
                'district': p['district'],
                'description': p['description'],
                'category': p['category'],
                'category_title': p['category_title'],
                'source': 'category_data',
            }
        ))
    for i in range(0, len(points), 100):
        batch = points[i:i+100]
        vector_store.client.upsert(collection_name='kerala_destinations', points=batch, wait=True)
        print(f"  ✅ Uploaded {len(batch)} category vectors")
    print(f"✅ Indexed {len(points)} category places")

# VERIFY
print("\n🔍 Verifying...")
results = vector_store.search("waterfall", top_k=5)
print(f"Found {len(results)} results for 'waterfall':")
for r in results[:5]:
    print(f"  - {r.get('name')} ({r.get('category')}) - {r.get('score', 0):.3f}")

info = vector_store.get_collection_info()
print(f"\n📊 TOTAL POINTS: {info.get('points_count', 0)}")
print("\n✅ DONE! Data is now PERSISTENT in file storage.")
print("💡 You can now restart Django and the data will still be there!")
