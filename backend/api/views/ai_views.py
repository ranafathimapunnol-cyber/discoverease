# api/views/ai_views.py - COMPLETE FIXED VERSION

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
import logging
from ai.vector_store import vector_store
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)


class AIChatView(APIView):
    """AI Chat API - Ask questions about Kerala"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            query = request.data.get('query', '')
            mode = request.data.get('mode', 'answer')
            
            if not query:
                return Response({
                    'success': False,
                    'error': 'Query is required'
                }, status=400)
            
            logger.info(f"📝 Processing query: {query}, mode: {mode}")
            
            if mode == 'search':
                return self._handle_search(request, query)
            elif mode == 'plan':
                return self._handle_plan(query)
            else:
                return self._handle_answer(query)
                
        except Exception as e:
            logger.error(f"❌ AI Chat error: {e}", exc_info=True)
            return Response({
                'success': False,
                'error': str(e),
                'message': 'Failed to process your request'
            }, status=500)
    
    def _handle_search(self, request, query):
        """Handle search mode - uses vector store directly"""
        try:
            filters = {}
            for key in ['district', 'category', 'type']:
                value = request.data.get(key)
                if value:
                    filters[key] = value
                    logger.info(f"📍 Applying filter: {key}={value}")
            
            results = vector_store.search(query, top_k=20, filters=filters)
            
            if not results:
                return Response({
                    'success': True,
                    'mode': 'search',
                    'results': [],
                    'count': 0,
                    'query': query,
                    'message': "🔍 I couldn't find any destinations matching your query. Please try different keywords."
                })
            
            formatted_results = []
            for r in results:
                formatted_results.append({
                    'id': r.get('id'),
                    'name': r.get('name'),
                    'district': r.get('district'),
                    'location': r.get('location'),
                    'description': r.get('description'),
                    'category': r.get('category'),
                    'category_title': r.get('category_title'),
                    'type': r.get('type'),
                    'rating': r.get('rating', 0),
                    'tags': r.get('tags', []),
                    'image': r.get('image'),
                    'hidden_gem': r.get('hidden_gem'),
                    'activities': r.get('activities', []),
                    'score': r.get('score', 0),
                    'best_time': r.get('best_time'),
                    'difficulty': r.get('difficulty'),
                    'duration': r.get('duration')
                })
            
            return Response({
                'success': True,
                'mode': 'search',
                'results': formatted_results,
                'count': len(formatted_results),
                'query': query,
                'filters': filters
            })
            
        except Exception as e:
            logger.error(f"Search failed: {e}", exc_info=True)
            return Response({
                'success': False,
                'mode': 'search',
                'error': str(e),
                'message': 'Search failed. Please try again.'
            }, status=500)
    
    def _handle_plan(self, query):
        """Handle plan mode"""
        try:
            results = vector_store.search(query, top_k=10)
            
            if not results:
                return Response({
                    'success': True,
                    'mode': 'plan',
                    'result': {
                        'itinerary': "🔍 I couldn't find any destinations matching your query. Please try different keywords.",
                        'destinations': []
                    }
                })
            
            # Build a simple itinerary
            itinerary = f"📍 **Trip Plan based on your query:**\n\n"
            itinerary += f"Found {len(results)} destinations:\n\n"
            for i, r in enumerate(results[:5], 1):
                itinerary += f"{i}. **{r.get('name')}** ({r.get('district')})\n"
                itinerary += f"   {r.get('description', '')[:100]}...\n\n"
            
            return Response({
                'success': True,
                'mode': 'plan',
                'result': {
                    'itinerary': itinerary,
                    'destinations': results[:5]
                }
            })
            
        except Exception as e:
            logger.error(f"Plan failed: {e}", exc_info=True)
            return Response({
                'success': False,
                'mode': 'plan',
                'error': str(e),
                'message': 'Failed to plan trip.'
            }, status=500)
    
    def _handle_answer(self, query):
        """Handle answer mode - uses vector store directly"""
        try:
            # Search using vector store
            results = vector_store.search(query, top_k=15)
            
            if not results:
                return Response({
                    'success': True,
                    'mode': 'answer',
                    'result': {
                        'answer': "🔍 I couldn't find any destinations matching your query. Please try different keywords.",
                        'destinations': []
                    }
                })
            
            # Build a response with filtering
            answer, final_results = self._build_answer_with_filtering(query, results)
            
            return Response({
                'success': True,
                'mode': 'answer',
                'result': {
                    'answer': answer,
                    'destinations': [
                        {
                            'id': r.get('id'),
                            'name': r.get('name'),
                            'district': r.get('district'),
                            'description': r.get('description', '')[:200],
                            'category': r.get('category'),
                            'rating': r.get('rating', 0),
                            'score': r.get('score', 0),
                        }
                        for r in final_results[:5]
                    ]
                }
            })
            
        except Exception as e:
            logger.error(f"❌ Answer failed: {e}", exc_info=True)
            return Response({
                'success': False,
                'mode': 'answer',
                'error': str(e),
                'message': 'Failed to generate answer.'
            }, status=500)
    
    def _build_answer_with_filtering(self, query: str, results: List[Dict]) -> tuple:
        """Build answer with proper filtering"""
        if not results:
            return "🔍 I couldn't find any destinations matching your query.", []
        
        query_lower = query.lower()
        
        # ✅ Check if user wants to EXCLUDE beaches
        exclude_beach = any(phrase in query_lower for phrase in [
            'not beach', 'no beach', 'without beach', 'except beach', 
            'besides beach', 'beach not', 'no beaches', 'not beaches',
            'excluding beach', 'avoid beach'
        ])
        
        # ✅ Filter results based on query
        final_results = results.copy()
        
        # Exclude beaches if requested
        if exclude_beach:
            final_results = [r for r in final_results if 'beach' not in r.get('name', '').lower()]
            if not final_results:
                return "🌿 I couldn't find any non-beach destinations matching your query. Try searching for hill stations, backwaters, or waterfalls!", []
        
        # Determine what type of answer to give
        if 'waterfall' in query_lower or 'falls' in query_lower:
            answer = self._build_waterfall_answer(final_results)
        elif 'hill' in query_lower or 'mountain' in query_lower or 'trek' in query_lower:
            answer = self._build_hill_answer(final_results)
        elif 'beach' in query_lower and not exclude_beach:
            answer = self._build_beach_answer(final_results)
        elif 'backwater' in query_lower or 'houseboat' in query_lower:
            answer = self._build_backwater_answer(final_results)
        else:
            # For general queries, if beaches were excluded, show no-beach answer
            if exclude_beach:
                answer = self._build_no_beach_answer(final_results)
            else:
                answer = self._build_general_answer(query, final_results)
        
        return answer, final_results
    
    def _build_no_beach_answer(self, results: List[Dict]) -> str:
        """Build answer for 'no beach' queries"""
        if not results:
            return "🌿 I couldn't find any non-beach destinations matching your query."
        
        answer = "🌿 **Exploring Kerala beyond beaches - here are beautiful alternatives:**\n\n"
        
        for i, r in enumerate(results[:5], 1):
            emoji = self._get_category_emoji(r.get('category', ''))
            answer += f"{i}. {emoji} **{r.get('name')}** ({r.get('district')})\n"
            if r.get('description'):
                answer += f"   {r.get('description')[:150]}\n"
            if r.get('rating'):
                answer += f"   ⭐ {r.get('rating')}\n"
            answer += "\n"
        
        answer += "💡 **Tips:**\n"
        answer += "• 🌿 Kerala has diverse landscapes beyond beaches\n"
        answer += "• 🗺️ Explore hills, backwaters, and wildlife sanctuaries\n"
        answer += "• 🕊️ Visit early morning for peaceful experience\n"
        answer += "• 📲 Download maps for easier navigation\n"
        
        return answer
    
    def _get_category_emoji(self, category: str) -> str:
        """Get emoji for category"""
        category_lower = category.lower()
        if 'hill' in category_lower or 'mountain' in category_lower:
            return '⛰️'
        elif 'waterfall' in category_lower:
            return '💧'
        elif 'backwater' in category_lower:
            return '🚣'
        elif 'wildlife' in category_lower or 'sanctuary' in category_lower:
            return '🐘'
        elif 'beach' in category_lower:
            return '🏖️'
        elif 'temple' in category_lower or 'church' in category_lower:
            return '🛕'
        elif 'park' in category_lower or 'garden' in category_lower:
            return '🌿'
        elif 'museum' in category_lower or 'heritage' in category_lower:
            return '🏛️'
        else:
            return '📍'
    
    def _build_waterfall_answer(self, results: List[Dict]) -> str:
        """Build answer for waterfall queries"""
        waterfalls = [r for r in results if 'waterfall' in r.get('category', '').lower() or 'waterfall' in r.get('name', '').lower()]
        
        if not waterfalls:
            return "💧 I couldn't find any waterfalls matching your query. Try searching for a specific district."
        
        answer = "💧 **Here are the most beautiful waterfalls in Kerala:**\n\n"
        for i, w in enumerate(waterfalls[:5], 1):
            answer += f"{i}. 📍 **{w.get('name')}** ({w.get('district')})\n"
            if w.get('description'):
                answer += f"   {w.get('description')[:150]}\n"
            if w.get('rating'):
                answer += f"   ⭐ {w.get('rating')}\n"
            answer += "\n"
        
        answer += "💡 **Tips:**\n"
        answer += "• Best time to visit waterfalls: Post-monsoon (September to February)\n"
        answer += "• Wear comfortable footwear and carry water\n"
        answer += "• 📲 Download maps for easier navigation\n"
        
        return answer
    
    def _build_hill_answer(self, results: List[Dict]) -> str:
        """Build answer for hill station queries"""
        hills = [r for r in results if 'hill' in r.get('category', '').lower() or 'hill' in r.get('name', '').lower()]
        
        if not hills:
            return "⛰️ I couldn't find any hill stations matching your query. Try searching for a specific district."
        
        answer = "⛰️ **Here are the best hill stations for trekking in Kerala:**\n\n"
        for i, h in enumerate(hills[:5], 1):
            answer += f"{i}. 📍 **{h.get('name')}** ({h.get('district')})\n"
            if h.get('description'):
                answer += f"   {h.get('description')[:150]}\n"
            if h.get('rating'):
                answer += f"   ⭐ {h.get('rating')}\n"
            answer += "\n"
        
        answer += "💡 **Tips:**\n"
        answer += "• Start your trek early morning\n"
        answer += "• Carry sufficient water and snacks\n"
        answer += "• Wear comfortable trekking shoes\n"
        
        return answer
    
    def _build_beach_answer(self, results: List[Dict]) -> str:
        """Build answer for beach queries"""
        beaches = [r for r in results if 'beach' in r.get('category', '').lower() or 'beach' in r.get('name', '').lower()]
        
        if not beaches:
            return "🏖️ I couldn't find any beaches matching your query."
        
        answer = "🏖️ **Here are the best beaches in Kerala:**\n\n"
        for i, b in enumerate(beaches[:5], 1):
            answer += f"{i}. 📍 **{b.get('name')}** ({b.get('district')})\n"
            if b.get('description'):
                answer += f"   {b.get('description')[:150]}\n"
            if b.get('rating'):
                answer += f"   ⭐ {b.get('rating')}\n"
            answer += "\n"
        
        answer += "💡 **Tips:**\n"
        answer += "• Best time to visit: October to March\n"
        answer += "• Don't miss local seafood\n"
        answer += "• 📲 Download maps for easier navigation\n"
        
        return answer
    
    def _build_backwater_answer(self, results: List[Dict]) -> str:
        """Build answer for backwater queries"""
        backwaters = [r for r in results if 'backwater' in r.get('category', '').lower() or 'backwater' in r.get('name', '').lower()]
        
        if not backwaters:
            return "🚣 I couldn't find any backwaters matching your query."
        
        answer = "🚣 **Here are the most serene backwater destinations:**\n\n"
        for i, b in enumerate(backwaters[:5], 1):
            answer += f"{i}. 📍 **{b.get('name')}** ({b.get('district')})\n"
            if b.get('description'):
                answer += f"   {b.get('description')[:150]}\n"
            if b.get('rating'):
                answer += f"   ⭐ {b.get('rating')}\n"
            answer += "\n"
        
        answer += "💡 **Tips:**\n"
        answer += "• Best time to visit: October to March\n"
        answer += "• Book houseboats in advance\n"
        answer += "• 📲 Download maps for easier navigation\n"
        
        return answer
    
    def _build_general_answer(self, query: str, results: List[Dict]) -> str:
        """Build general answer"""
        answer = f"✨ **Here are the top recommendations based on your interests:**\n\n"
        
        for i, r in enumerate(results[:5], 1):
            emoji = self._get_category_emoji(r.get('category', ''))
            answer += f"{i}. {emoji} **{r.get('name')}** ({r.get('district')})\n"
            if r.get('description'):
                answer += f"   {r.get('description')[:150]}\n"
            if r.get('rating'):
                answer += f"   ⭐ {r.get('rating')}\n"
            answer += "\n"
        
        answer += "💡 **Tips:**\n"
        answer += "• 📲 Download maps for easier navigation\n"
        answer += "• 🍛 Don't miss local Kerala cuisine\n"
        
        return answer