# ai/rag_pipeline.py - FIXED VERSION

import logging
from typing import List, Dict, Optional
from .vector_store import vector_store
from .embeddings import embedding_service

logger = logging.getLogger(__name__)

class RAGPipeline:
    """RAG Pipeline for AI chat and search"""
    
    def __init__(self):
        self.vector_store = vector_store
        self.embedding_service = embedding_service
        logger.info("✅ RAG Pipeline initialized")
    
    def search(self, query: str, top_k: int = 20, filters: Dict = None) -> List[Dict]:
        """
        Search for destinations using vector similarity
        
        Args:
            query: Search query
            top_k: Number of results
            filters: Optional filters (district, category, etc.)
            
        Returns:
            List of destination results with scores
        """
        try:
            # Use vector store search
            results = self.vector_store.search(query, top_k=top_k, filters=filters)
            
            if not results:
                logger.warning(f"No results found for query: {query}")
                return []
            
            logger.info(f"Found {len(results)} results for query: {query}")
            return results
            
        except Exception as e:
            logger.error(f"Search failed: {e}", exc_info=True)
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
            f"Name: {r['name']}\n"
            f"District: {r['district']}\n"
            f"Description: {r['description']}\n"
            f"Category: {r['category_title']}\n"
            f"Tags: {', '.join(r.get('tags', []))}\n"
            f"Hidden Gem: {r.get('hidden_gem', 'N/A')}"
            for r in results[:3]
        ])
        
        # Generate answer (you can use LLM here)
        answer = self._generate_answer(query, context, results)
        
        return {
            'answer': answer,
            'sources': results[:5],
            'count': len(results)
        }
    
    def _generate_answer(self, query: str, context: str, results: List[Dict]) -> str:
        """Generate a natural language answer from context"""
        # Simple fallback - you can replace with LLM
        if not results:
            return "🔍 I couldn't find any destinations matching your query. Please try different keywords."
        
        if len(results) == 1:
            return f"Based on your query '{query}', I found **{results[0]['name']}** in {results[0]['district']}. {results[0]['description']}"
        
        # Group results by category
        categories = {}
        for r in results:
            cat = r.get('category_title', 'Other')
            if cat not in categories:
                categories[cat] = []
            categories[cat].append(r)
        
        answer = f"Based on your query '{query}', I found **{len(results)}** destinations:\n\n"
        
        for category, items in categories.items():
            answer += f"**{category}** ({len(items)}):\n"
            for item in items[:3]:
                answer += f"  • {item['name']} ({item['district']})\n"
            if len(items) > 3:
                answer += f"  • ... and {len(items) - 3} more\n"
            answer += "\n"
        
        return answer.strip()
    
    def plan_trip(self, query: str) -> Dict:
        """Plan a trip based on the query"""
        # Search for relevant destinations
        results = self.search(query, top_k=10)
        
        if not results:
            return {
                'itinerary': "🔍 I couldn't find any destinations matching your query. Please try different keywords.",
                'destinations': []
            }
        
        # Group by district for better planning
        districts = {}
        for r in results:
            district = r.get('district', 'Unknown')
            if district not in districts:
                districts[district] = []
            districts[district].append(r)
        
        # Build itinerary
        itinerary = f"🏖️ **Trip Plan based on your query:**\n\n"
        itinerary += f"Found {len(results)} destinations across {len(districts)} districts.\n\n"
        
        for district, places in districts.items():
            itinerary += f"**📍 {district} District** ({len(places)} places):\n"
            for place in places[:3]:
                itinerary += f"  • {place['name']} - {place.get('description', '')[:50]}...\n"
            if len(places) > 3:
                itinerary += f"  • ... and {len(places) - 3} more places\n"
            itinerary += "\n"
        
        return {
            'itinerary': itinerary,
            'destinations': results[:10],
            'districts': list(districts.keys())
        }


# Create singleton instance
rag_pipeline = RAGPipeline()