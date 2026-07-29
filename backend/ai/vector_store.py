# ai/vector_store.py - COMPLETE FIXED VERSION

import logging
import os
from typing import List, Dict, Optional, Any
from qdrant_client import QdrantClient
from qdrant_client.http.models import (
    Distance, 
    VectorParams, 
    PointStruct, 
    Filter, 
    FieldCondition, 
    MatchValue
)
from django.conf import settings
from .embeddings import embedding_service

logger = logging.getLogger(__name__)

__all__ = ['VectorStore', 'vector_store']


class VectorStore:
    """
    Vector database service for semantic search of destinations.
    
    Supports:
    - Natural language search
    - District filtering
    - Category filtering
    - Hybrid search (vector + filters)
    - Multiple connection modes (Docker, file, memory)
    
    Attributes:
        client: QdrantClient instance
        mode: str - 'docker', 'file', or 'memory'
        collection: str - Collection name in Qdrant
    """
    
    def __init__(self):
        """Initialize Qdrant client and ensure collection exists"""
        self.mode = 'unknown'
        self.collection = getattr(settings, 'QDRANT_COLLECTION', 'kerala_destinations')
        self._initialized = False
        
        # Try connecting to Docker Qdrant first
        try:
            logger.info("🔍 Attempting to connect to Qdrant...")
            self.client = QdrantClient(
                host=getattr(settings, 'QDRANT_HOST', 'localhost'),
                port=getattr(settings, 'QDRANT_PORT', 6333),
                timeout=2
            )
            self.client.get_collections()
            self.mode = 'docker'
            logger.info("✅ Connected to Qdrant Docker")
            
        except Exception as e:
            logger.warning(f"⚠️ Qdrant not available: {e}")
            logger.info("🔄 Falling back to file-based Qdrant")
            # Use persistent file storage
            qdrant_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'qdrant_data')
            os.makedirs(qdrant_path, exist_ok=True)
            self.client = QdrantClient(path=qdrant_path)
            self.mode = 'file'
            logger.info(f"✅ Using file-based Qdrant at: {qdrant_path}")
        
        # Ensure collection exists
        self._ensure_collection()
        self._initialized = True
    
    def _ensure_collection(self):
        """Create Qdrant collection if it doesn't exist."""
        try:
            collections = self.client.get_collections()
            exists = any(c.name == self.collection for c in collections.collections)
            
            if not exists:
                self.client.create_collection(
                    collection_name=self.collection,
                    vectors_config=VectorParams(
                        size=384,
                        distance=Distance.COSINE
                    )
                )
                logger.info(f"✅ Created collection: {self.collection} ({self.mode} mode)")
            else:
                logger.info(f"✅ Collection already exists: {self.collection} ({self.mode} mode)")
                
        except Exception as e:
            logger.error(f"❌ Failed to create collection: {e}")
            raise RuntimeError(f"Could not initialize vector store: {e}")
    
    def search(self, query: str, top_k: int = 10, filters: Dict = None) -> List[Dict]:
        """
        Search destinations using semantic similarity.
        
        Args:
            query: Natural language search query
            top_k: Number of results to return
            filters: Optional filters like {'district': 'Kannur'}
            
        Returns:
            List of destination dictionaries with similarity scores
        """
        if not query:
            logger.warning("Empty query provided")
            return []
        
        try:
            query_vector = embedding_service.embed_query(query)
            qdrant_filter = self._build_filter(filters)
            
            results = self.client.search(
                collection_name=self.collection,
                query_vector=query_vector,
                limit=top_k,
                query_filter=qdrant_filter
            )
            
            return self._format_results(results)
            
        except Exception as e:
            logger.error(f"Search failed: {e}", exc_info=True)
            return []
    
    def _build_filter(self, filters: Dict) -> Optional[Filter]:
        """Build Qdrant filter from dictionary."""
        if not filters:
            return None
        
        filter_conditions = []
        
        if filters.get('district'):
            district_name = filters['district'].title()
            logger.info(f"📍 Applying district filter: {district_name}")
            filter_conditions.append(
                FieldCondition(
                    key='district',
                    match=MatchValue(value=district_name)
                )
            )
        
        if filters.get('category'):
            category = filters['category'].lower()
            logger.info(f"📂 Applying category filter: {category}")
            filter_conditions.append(
                FieldCondition(
                    key='category',
                    match=MatchValue(value=category)
                )
            )
        
        if filters.get('type'):
            type_val = filters['type'].lower()
            logger.info(f"🏷️ Applying type filter: {type_val}")
            filter_conditions.append(
                FieldCondition(
                    key='type',
                    match=MatchValue(value=type_val)
                )
            )
        
        if filter_conditions:
            return Filter(must=filter_conditions)
        
        return None
    
    def _format_results(self, results) -> List[Dict]:
        """Format Qdrant search results into standardized dictionaries."""
        formatted = []
        for hit in results:
            payload = hit.payload or {}
            formatted.append({
                'score': hit.score,
                'id': payload.get('id'),
                'name': payload.get('name', 'Unknown'),
                'district': payload.get('district', 'Unknown'),
                'location': payload.get('location', ''),
                'description': payload.get('description', ''),
                'category': payload.get('category', ''),
                'category_title': payload.get('category_title', ''),
                'type': payload.get('type', ''),
                'source': payload.get('source', 'unknown'),
                'tags': payload.get('tags', []),
                'rating': payload.get('rating', 0),
                'best_time': payload.get('best_time', ''),
                'difficulty': payload.get('difficulty', ''),
                'duration': payload.get('duration', ''),
                'image': payload.get('image', ''),
                'hidden_gem': payload.get('hidden_gem', ''),
                'activities': payload.get('activities', []),
            })
        return formatted
    
    def index_destinations(self, destinations: List[Dict]) -> int:
        """Index destination data into vector store."""
        if not destinations:
            logger.info("No destinations to index")
            return 0
        
        try:
            texts = [d.get('full_text', d.get('description', '')) for d in destinations]
            vectors = embedding_service.embed_batch(texts)
            points = self._create_points(destinations, vectors)
            total_uploaded = self._upload_points(points)
            logger.info(f"✅ Indexed {total_uploaded} items successfully")
            return total_uploaded
            
        except Exception as e:
            logger.error(f"Failed to index destinations: {e}", exc_info=True)
            return 0
    
    def _create_points(self, destinations: List[Dict], vectors: List) -> List[PointStruct]:
        """Create Qdrant PointStruct objects."""
        points = []
        for dest, vector in zip(destinations, vectors):
            district = dest.get('district', dest.get('location', 'Unknown'))
            if district and district != 'Unknown':
                district = district.title()
            
            point_id = dest.get('id')
            if point_id is None:
                point_id = hash(dest.get('name', '')) % 1000000
            
            points.append(PointStruct(
                id=point_id,
                vector=vector,
                payload={
                    'id': dest.get('id'),
                    'name': dest.get('name', ''),
                    'district': district,
                    'location': dest.get('location', ''),
                    'description': dest.get('description', ''),
                    'category': dest.get('category', 'destination'),
                    'category_title': dest.get('category_title', 'Destination'),
                    'type': dest.get('type', 'well-known'),
                    'source': dest.get('source', 'destination'),
                    'tags': dest.get('tags', []),
                    'rating': dest.get('rating', 0),
                    'best_time': dest.get('best_time', ''),
                    'difficulty': dest.get('difficulty', ''),
                    'duration': dest.get('duration', ''),
                    'image': dest.get('image', ''),
                    'hidden_gem': dest.get('hidden_gem', ''),
                    'activities': dest.get('activities', []),
                }
            ))
        
        return points
    
    def _upload_points(self, points: List[PointStruct], batch_size: int = 100) -> int:
        """Upload points to Qdrant in batches."""
        total_uploaded = 0
        for i in range(0, len(points), batch_size):
            batch = points[i:i+batch_size]
            self.client.upsert(
                collection_name=self.collection,
                points=batch,
                wait=True
            )
            total_uploaded += len(batch)
            logger.info(f"📊 Uploaded {len(batch)} vectors (Total: {total_uploaded})")
        
        return total_uploaded
    
    def index_category_data(self, category_data: List[Dict]) -> int:
        """Index CategoryData imported from JSX files."""
        if not category_data:
            return 0
        
        try:
            texts = []
            for item in category_data:
                parts = [
                    str(item.get('name', '')),
                    str(item.get('location', '')),
                    str(item.get('description', '')),
                    str(item.get('category', '')),
                    str(item.get('category_title', '')),
                ]
                texts.append(' '.join(parts))
            
            vectors = embedding_service.embed_batch(texts)
            points = self._create_category_points(category_data, vectors)
            total_uploaded = self._upload_points(points)
            logger.info(f"✅ Indexed {total_uploaded} category items")
            return total_uploaded
            
        except Exception as e:
            logger.error(f"Failed to index category data: {e}", exc_info=True)
            return 0
    
    def _create_category_points(self, category_data: List[Dict], vectors: List) -> List[PointStruct]:
        """Create Qdrant points for category data."""
        points = []
        for item, vector in zip(category_data, vectors):
            point_id = item.get('id')
            if point_id is None:
                point_id = hash(str(item.get('name', ''))) % 1000000
            
            district = item.get('location', item.get('district', 'Unknown'))
            if district and district != 'Unknown':
                district = district.title()
            
            points.append(PointStruct(
                id=point_id,
                vector=vector,
                payload={
                    'id': item.get('id'),
                    'name': str(item.get('name', '')),
                    'district': district,
                    'location': str(item.get('location', '')),
                    'description': str(item.get('description', '')),
                    'category': str(item.get('category', '')),
                    'category_title': str(item.get('category_title', '')),
                    'type': str(item.get('type', 'well-known')),
                    'source': 'category_data',
                    'tags': [],
                    'rating': 0,
                    'best_time': str(item.get('best_time', '')),
                    'difficulty': str(item.get('difficulty', '')),
                    'duration': str(item.get('duration', '')),
                    'image': str(item.get('image', '')),
                    'hidden_gem': str(item.get('hidden_gem', '')),
                    'activities': [],
                }
            ))
        
        return points
    
    def load_sample_data(self):
        """Explicitly load sample data for testing."""
        logger.info("📚 Loading sample destination data...")
        
        sample = [
            {
                'id': 1,
                'name': 'Munnar',
                'district': 'Idukki',
                'location': 'Idukki',
                'description': 'Beautiful hill station with tea gardens and rolling hills.',
                'category': 'hillstations',
                'category_title': 'Hill Stations',
                'type': 'well-known',
                'tags': ['tea', 'nature', 'hills'],
                'rating': 4.8,
                'best_time': 'September to May',
                'difficulty': 'Easy',
                'duration': '2-3 days',
                'activities': ['Tea tasting', 'Nature walks', 'Photography'],
                'hidden_gem': 'Endless tea plantations with three mountain streams.',
                'full_text': 'Munnar Idukki Beautiful hill station with tea gardens and rolling hills.',
                'source': 'destination',
                'image': 'munnar.jpg',
            },
            {
                'id': 2,
                'name': 'Alleppey Backwaters',
                'district': 'Alappuzha',
                'location': 'Alappuzha',
                'description': 'World-famous backwaters with houseboat cruises.',
                'category': 'backwaters',
                'category_title': 'Backwaters',
                'type': 'well-known',
                'tags': ['backwaters', 'houseboat', 'nature'],
                'rating': 4.9,
                'best_time': 'October to March',
                'difficulty': 'Easy',
                'duration': '1-2 days',
                'activities': ['Houseboat cruise', 'Kayaking', 'Village tours'],
                'hidden_gem': "India's longest lake - Vembanad Lake.",
                'full_text': 'Alleppey Backwaters Alappuzha World-famous backwaters with houseboat cruises.',
                'source': 'destination',
                'image': 'alleppey.jpg',
            },
            {
                'id': 3,
                'name': 'Varkala Beach',
                'district': 'Thiruvananthapuram',
                'location': 'Thiruvananthapuram',
                'description': 'Stunning beach with dramatic red cliffs.',
                'category': 'beaches',
                'category_title': 'Beaches',
                'type': 'well-known',
                'tags': ['beach', 'cliff', 'sunset'],
                'rating': 4.6,
                'best_time': 'October to March',
                'difficulty': 'Easy',
                'duration': '1-2 days',
                'activities': ['Sunset viewing', 'Swimming', 'Cliff walking'],
                'hidden_gem': 'Unique pink laterite cliffs with natural springs.',
                'full_text': 'Varkala Beach Thiruvananthapuram Stunning beach with dramatic red cliffs.',
                'source': 'destination',
                'image': 'varkala.jpg',
            },
            {
                'id': 4,
                'name': 'Paithalmala',
                'district': 'Kannur',
                'location': 'Kannur',
                'description': 'The highest peak in Kannur with stunning sunrise views.',
                'category': 'hillstations',
                'category_title': 'Hill Stations',
                'type': 'well-known',
                'tags': ['trekking', 'nature', 'hills'],
                'rating': 4.7,
                'best_time': 'November to February',
                'difficulty': 'Moderate',
                'duration': '1 day',
                'activities': ['Trekking', 'Sunrise viewing', 'Bird watching'],
                'hidden_gem': 'Highest peak in Kannur district at 1,550m.',
                'full_text': 'Paithalmala Kannur Highest peak with stunning sunrise views.',
                'source': 'destination',
                'image': 'paithalmala.jpg',
            },
            {
                'id': 5,
                'name': 'Muzhappilangad Beach',
                'district': 'Kannur',
                'location': 'Kannur',
                'description': "Asia's longest drive-in beach.",
                'category': 'beaches',
                'category_title': 'Beaches',
                'type': 'well-known',
                'tags': ['beach', 'drive-in', 'sunset'],
                'rating': 4.5,
                'best_time': 'October to March',
                'difficulty': 'Easy',
                'duration': 'Half day',
                'activities': ['Driving', 'Sunset viewing', 'Swimming'],
                'hidden_gem': "Asia's longest drive-in beach stretching 5km.",
                'full_text': 'Muzhappilangad Beach Kannur Asias longest drive-in beach.',
                'source': 'destination',
                'image': 'muzhappilangad.jpg',
            },
            {
                'id': 6,
                'name': 'Kovalam Beach',
                'district': 'Thiruvananthapuram',
                'location': 'Thiruvananthapuram',
                'description': 'Popular beach with three crescent-shaped beaches.',
                'category': 'beaches',
                'category_title': 'Beaches',
                'type': 'well-known',
                'tags': ['beach', 'surfing', 'sunset'],
                'rating': 4.4,
                'best_time': 'October to March',
                'difficulty': 'Easy',
                'duration': '1-2 days',
                'activities': ['Surfing', 'Swimming', 'Lighthouse visit'],
                'hidden_gem': 'The iconic lighthouse offers panoramic views.',
                'full_text': 'Kovalam Beach Thiruvananthapuram Popular beach with three crescent-shaped beaches.',
                'source': 'destination',
                'image': 'kovalam.jpg',
            },
            {
                'id': 7,
                'name': 'Kumarakom Bird Sanctuary',
                'district': 'Kottayam',
                'location': 'Kottayam',
                'description': 'Bird sanctuary on the banks of Vembanad Lake.',
                'category': 'wildlife',
                'category_title': 'Wildlife',
                'type': 'well-known',
                'tags': ['birds', 'nature', 'sanctuary'],
                'rating': 4.5,
                'best_time': 'November to February',
                'difficulty': 'Easy',
                'duration': 'Half day',
                'activities': ['Bird watching', 'Boat rides'],
                'hidden_gem': 'Home to Siberian cranes and rare waterfowl.',
                'full_text': 'Kumarakom Bird Sanctuary Kottayam Bird sanctuary on Vembanad Lake.',
                'source': 'destination',
                'image': 'kumarakom.jpg',
            },
            {
                'id': 8,
                'name': 'Periyar Wildlife Sanctuary',
                'district': 'Idukki',
                'location': 'Idukki',
                'description': 'Tiger reserve in the Cardamom Hills.',
                'category': 'wildlife',
                'category_title': 'Wildlife',
                'type': 'well-known',
                'tags': ['wildlife', 'tiger', 'elephant'],
                'rating': 4.7,
                'best_time': 'October to June',
                'difficulty': 'Moderate',
                'duration': '2 days',
                'activities': ['Jungle safari', 'Boat safari', 'Trekking'],
                'hidden_gem': 'One of the best places to spot wild elephants.',
                'full_text': 'Periyar Wildlife Sanctuary Idukki Tiger reserve in Cardamom Hills.',
                'source': 'destination',
                'image': 'periyar.jpg',
            }
        ]
        
        count = self.index_destinations(sample)
        logger.info(f"✅ Loaded {count} sample destinations")
        return count
    
    def delete_collection(self) -> bool:
        """Delete the entire collection (for testing/cleanup)."""
        try:
            self.client.delete_collection(collection_name=self.collection)
            logger.info(f"🗑️ Deleted collection: {self.collection}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete collection: {e}")
            return False
    
    def get_collection_info(self) -> Dict:
        """Get information about the collection."""
        try:
            info = self.client.get_collection(collection_name=self.collection)
            return {
                'name': self.collection,
                'mode': self.mode,
                'points_count': info.points_count,
                'segments_count': info.segments_count,
                'status': info.status,
                'vector_size': info.config.params.vectors.size,
                'distance': info.config.params.vectors.distance.name,
            }
        except Exception as e:
            logger.error(f"Failed to get collection info: {e}")
            return {'error': str(e)}


# Create singleton instance
vector_store = VectorStore()