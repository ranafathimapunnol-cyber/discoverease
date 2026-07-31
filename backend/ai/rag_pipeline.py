# ai/rag_pipeline.py - FIXED TO WORK WITHOUT QDRANT

import logging
from typing import List, Dict, Optional
import json
import os
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

# Try to import vector_store, but handle if it's None
try:
    from .vector_store import vector_store
except ImportError:
    vector_store = None
    logger.warning("⚠️ vector_store not available")

from .embeddings import embedding_service

__all__ = ['RAGPipeline', 'rag_pipeline']


class RAGPipeline:
    """
    RAG Pipeline for AI chat and search - Works with or without Qdrant
    """
    
    def __init__(self):
        self.vector_store = vector_store
        self.embedding_service = embedding_service
        self._api_data_cache = None
        self._api_data_cache_time = None
        self.CACHE_DURATION = 300  # 5 minutes
        
        # Check if vector store is available
        if self.vector_store:
            logger.info("✅ RAG Pipeline initialized with Qdrant vector store")
        else:
            logger.info("🔄 RAG Pipeline initialized in API-only mode (Qdrant disabled)")
    
    def _fetch_api_data(self) -> List[Dict]:
        """Fetch destination data from API endpoints"""
        import time
        
        # Check cache
        if self._api_data_cache and self._api_data_cache_time:
            if time.time() - self._api_data_cache_time < self.CACHE_DURATION:
                logger.debug(f"📦 Using cached API data: {len(self._api_data_cache)} items")
                return self._api_data_cache
        
        destinations = []
        api_base = getattr(settings, 'API_BASE_URL', 'http://localhost:8000/api')
        
        try:
            # Try destinations endpoint
            dest_url = f"{api_base}/destinations/"
            logger.info(f"📡 Fetching from: {dest_url}")
            
            response = requests.get(dest_url, timeout=5)
            if response.status_code == 200:
                data = response.json()
                logger.info(f"✅ Destinations response received")
                
                # Parse response
                if isinstance(data, dict):
                    if data.get('results') and isinstance(data['results'], list):
                        destinations = data['results']
                    elif data.get('data') and isinstance(data['data'], list):
                        destinations = data['data']
                    elif data.get('destinations') and isinstance(data['destinations'], list):
                        destinations = data['destinations']
                elif isinstance(data, list):
                    destinations = data
                
                logger.info(f"📊 Found {len(destinations)} destinations")
                
        except Exception as e:
            logger.error(f"❌ Error fetching destinations: {e}")
        
        # If no destinations, try suggestions endpoint
        if not destinations:
            try:
                sugg_url = f"{api_base}/suggestions/implemented/"
                logger.info(f"📡 Fetching from: {sugg_url}")
                
                response = requests.get(sugg_url, params={'limit': 200}, timeout=5)
                if response.status_code == 200:
                    data = response.json()
                    logger.info(f"✅ Suggestions response received")
                    
                    if isinstance(data, dict):
                        if data.get('data') and isinstance(data['data'], list):
                            destinations = data['data']
                        elif data.get('results') and isinstance(data['results'], list):
                            destinations = data['results']
                        
                logger.info(f"📊 Found {len(destinations)} suggestions")
                
            except Exception as e:
                logger.error(f"❌ Error fetching suggestions: {e}")
        
        # Format destinations
        formatted = []
        for d in destinations:
            # Get the name
            name = d.get('name') or d.get('title') or d.get('destination_name') or 'Unknown'
            
            # Get district
            district = d.get('district') or d.get('location') or d.get('destination_district') or ''
            
            # Get description
            description = d.get('description') or d.get('destination_description') or d.get('review_text') or ''
            
            formatted.append({
                'id': d.get('id') or d.get('destination_id'),
                'name': name,
                'district': district.title() if district else '',
                'location': district,
                'description': description[:300] if description else '',
                'category': d.get('category') or d.get('destination_category') or 'General',
                'category_title': d.get('category_title') or d.get('category') or 'General',
                'type': d.get('type') or d.get('suggestion_type') or 'well-known',
                'rating': float(d.get('rating') or d.get('destination_rating') or 0),
                'image': d.get('image') or d.get('destination_image') or d.get('image_url') or '',
                'tags': d.get('tags') or d.get('activities') or [],
                'full_text': f"{name} {district} {description}"
            })
        
        # Cache
        self._api_data_cache = formatted
        self._api_data_cache_time = time.time()
        
        logger.info(f"✅ Total {len(formatted)} destinations loaded from API")
        return formatted
    
    def search(self, query: str, top_k: int = 20, filters: Dict = None) -> List[Dict]:
        """
        Search for destinations using vector similarity or keyword matching
        """
        if not query:
            logger.warning("Empty query provided")
            return []
        
        try:
            results = []
            
            # Try vector search first if available
            if self.vector_store:
                try:
                    results = self.vector_store.search(query, top_k=top_k, filters=filters)
                    if results:
                        logger.info(f"✅ Vector search found {len(results)} results")
                        return results
                except Exception as e:
                    logger.warning(f"⚠️ Vector search failed: {e}, falling back to API")
            
            # Fallback: Use API data with keyword matching
            api_data = self._fetch_api_data()
            
            if not api_data:
                logger.warning("⚠️ No API data available for search")
                return []
            
            # Apply filters
            filtered_data = api_data
            if filters:
                if filters.get('district'):
                    district = filters['district'].lower()
                    filtered_data = [
                        d for d in filtered_data 
                        if district in d.get('district', '').lower() 
                        or district in d.get('location', '').lower()
                    ]
                
                if filters.get('category'):
                    category = filters['category'].lower()
                    filtered_data = [
                        d for d in filtered_data 
                        if category in d.get('category', '').lower()
                        or category in d.get('category_title', '').lower()
                    ]
                
                if filters.get('type'):
                    type_val = filters['type'].lower()
                    filtered_data = [
                        d for d in filtered_data 
                        if type_val in d.get('type', '').lower()
                    ]
            
            # Keyword search
            query_lower = query.lower()
            scored = []
            
            for item in filtered_data:
                score = 0
                search_text = ' '.join([
                    item.get('name', ''),
                    item.get('district', ''),
                    item.get('location', ''),
                    item.get('description', ''),
                    item.get('category', ''),
                    ' '.join(item.get('tags', []))
                ]).lower()
                
                # Exact phrase match
                if query_lower in search_text:
                    score += 10
                
                # Word matches
                for word in query_lower.split():
                    if len(word) < 2:
                        continue
                    if word in search_text:
                        score += 2
                    if word in item.get('name', '').lower():
                        score += 3
                    if word in item.get('district', '').lower():
                        score += 2
                
                if score > 0:
                    scored.append({**item, 'score': min(score / 10, 1.0)})
            
            # Sort by score
            scored.sort(key=lambda x: x.get('score', 0), reverse=True)
            results = scored[:top_k]
            
            logger.info(f"🔍 Keyword search found {len(results)} results")
            return results
            
        except Exception as e:
            logger.error(f"❌ Search failed: {e}", exc_info=True)
            return []
    
    def answer(self, query: str) -> Dict:
        """Answer a question using RAG"""
        # Search for relevant context
        results = self.search(query, top_k=5)
        
        if not results:
            return {
                'answer': "🔍 I couldn't find any destinations matching your query. Please try different keywords.",
                'sources': []
            }
        
        # Build context from results
        context = "\n\n".join([
            f"Name: {r.get('name', 'Unknown')}\n"
            f"District: {r.get('district', 'Unknown')}\n"
            f"Description: {r.get('description', '')[:150]}\n"
            f"Category: {r.get('category_title', '')}\n"
            f"Tags: {', '.join(r.get('tags', [])[:3])}"
            for r in results[:3]
        ])
        
        # Generate answer
        from .llm import llm_service
        answer = llm_service.generate_response(query, context)
        
        return {
            'answer': answer,
            'sources': results[:5],
            'count': len(results)
        }
    
    def plan_trip(self, query: str) -> Dict:
        """Plan a trip based on the query"""
        # Search for relevant destinations
        results = self.search(query, top_k=10)
        
        if not results:
            return {
                'itinerary': "🔍 I couldn't find any destinations matching your query. Please try different keywords.",
                'destinations': []
            }
        
        # Generate itinerary using LLM
        from .llm import llm_service
        itinerary = llm_service.generate_itinerary(query, results)
        
        return {
            'itinerary': itinerary,
            'destinations': results[:10],
            'districts': list(set(r.get('district') for r in results if r.get('district')))
        }


# Create singleton instance
rag_pipeline = RAGPipeline()