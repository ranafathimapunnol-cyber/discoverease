# ai/init_data.py - Auto-index data on startup

import logging
from django.apps import AppConfig
from django.db.models.signals import post_migrate
from django.core.management import call_command

logger = logging.getLogger(__name__)

def initialize_vector_store(sender, **kwargs):
    """Initialize vector store with data on startup"""
    try:
        from ai.vector_store import vector_store
        from destinations.models import Destination, CategoryData, CategoryPlace
        
        # Check if there's data in the vector store
        info = vector_store.get_collection_info()
        point_count = info.get('points_count', 0)
        
        if point_count == 0:
            logger.info("📊 Vector store is empty. Indexing data...")
            
            # Index destinations
            destinations = Destination.objects.all()
            if destinations.exists():
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
                
                count = vector_store.index_destinations(dest_data)
                logger.info(f"✅ Indexed {count} destinations")
            
            # Index category data
            categories = CategoryData.objects.filter(is_active=True)
            if categories.exists():
                all_places = []
                for category in categories:
                    places = CategoryPlace.objects.filter(category=category.key, is_active=True)
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
                
                if all_places:
                    count = vector_store.index_category_data(all_places)
                    logger.info(f"✅ Indexed {count} category places")
            
            # Verify
            info = vector_store.get_collection_info()
            logger.info(f"📊 Vector store now has {info.get('points_count', 0)} points")
        else:
            logger.info(f"📊 Vector store already has {point_count} points")
            
    except Exception as e:
        logger.error(f"❌ Failed to initialize vector store: {e}")

def run_indexing():
    """Run indexing immediately"""
    try:
        from ai.vector_store import vector_store
        from destinations.models import Destination, CategoryData, CategoryPlace
        
        logger.info("📊 Running indexing...")
        
        # Index destinations
        destinations = Destination.objects.all()
        if destinations.exists():
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
            
            count = vector_store.index_destinations(dest_data)
            logger.info(f"✅ Indexed {count} destinations")
        
        # Index category data
        categories = CategoryData.objects.filter(is_active=True)
        if categories.exists():
            all_places = []
            for category in categories:
                places = CategoryPlace.objects.filter(category=category.key, is_active=True)
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
            
            if all_places:
                count = vector_store.index_category_data(all_places)
                logger.info(f"✅ Indexed {count} category places")
        
        # Verify
        info = vector_store.get_collection_info()
        logger.info(f"📊 Vector store now has {info.get('points_count', 0)} points")
        
    except Exception as e:
        logger.error(f"❌ Failed to index data: {e}")