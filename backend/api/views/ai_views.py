# api/views/ai_views.py - WITH CONVERSATION MEMORY AND FIXED QUERY HANDLING

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
import logging
import re
from ai.vector_store import vector_store
from typing import Dict, List, Optional
import uuid
from datetime import datetime
from collections import defaultdict
import time

logger = logging.getLogger(__name__)

# Store conversation history in memory with timestamps
# In production, use Redis or Database
conversation_memory = defaultdict(list)
session_last_accessed = {}  # Track last access time for cleanup
SESSION_TIMEOUT = 3600  # 1 hour timeout
MAX_SESSIONS = 1000  # Maximum number of sessions to keep


class AIChatView(APIView):
    """AI Chat API - Ask questions about Kerala with conversation memory"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            # Clean up old sessions periodically (every 100 requests)
            if len(session_last_accessed) > MAX_SESSIONS:
                self._cleanup_old_sessions()
            
            query = request.data.get('query', '')
            mode = request.data.get('mode', 'answer')
            session_id = request.data.get('session_id', None)
            
            # Generate session ID if not provided
            if not session_id:
                session_id = str(uuid.uuid4())
            
            if not query:
                return Response({
                    'success': False,
                    'error': 'Query is required'
                }, status=400)
            
            logger.info(f"📝 Processing query: {query}, mode: {mode}, session: {session_id[:8]}")
            
            # Update last access time
            session_last_accessed[session_id] = time.time()
            
            # Get conversation history
            history = conversation_memory.get(session_id, [])
            
            if mode == 'search':
                return self._handle_search(request, query, session_id, history)
            elif mode == 'plan':
                return self._handle_plan(query, session_id, history)
            else:
                return self._handle_answer(query, session_id, history)
                
        except Exception as e:
            logger.error(f"❌ AI Chat error: {e}", exc_info=True)
            return Response({
                'success': False,
                'error': str(e),
                'message': 'Failed to process your request'
            }, status=500)
    
    def _cleanup_old_sessions(self):
        """Remove sessions that haven't been accessed recently"""
        current_time = time.time()
        expired_sessions = [
            sid for sid, last_access in session_last_accessed.items()
            if current_time - last_access > SESSION_TIMEOUT
        ]
        
        for sid in expired_sessions:
            if sid in conversation_memory:
                del conversation_memory[sid]
            if sid in session_last_accessed:
                del session_last_accessed[sid]
        
        # If still too many sessions, remove oldest
        if len(session_last_accessed) > MAX_SESSIONS:
            sorted_sessions = sorted(
                session_last_accessed.items(),
                key=lambda x: x[1]
            )
            to_remove = len(session_last_accessed) - MAX_SESSIONS
            for sid, _ in sorted_sessions[:to_remove]:
                if sid in conversation_memory:
                    del conversation_memory[sid]
                if sid in session_last_accessed:
                    del session_last_accessed[sid]
        
        logger.info(f"🧹 Cleaned up {len(expired_sessions)} expired sessions")
    
    def _get_context_from_history(self, history: List[Dict], query: str) -> Dict:
        """Extract context from conversation history"""
        context = {
            'last_query': None,
            'last_category': None,
            'last_district': None,
            'last_type': None,
            'mentioned_places': []
        }
        
        # Check if query refers to previous conversation
        is_followup = any(word in query.lower() for word in ['again', 'also', 'next', 'previous', 'another', 'more'])
        
        if history:
            # Get last 3 messages for context
            recent = history[-3:] if len(history) >= 3 else history
            
            for msg in recent:
                if msg.get('role') == 'user':
                    content = msg.get('content', '').lower()
                    # Extract district from previous query
                    districts = ['kannur', 'wayanad', 'idukki', 'alappuzha', 'thrissur', 
                                'ernakulam', 'trivandrum', 'kottayam', 'kozhikode', 
                                'palakkad', 'malappuram', 'pathanamthitta', 'kollam', 'kasargod']
                    for district in districts:
                        if district in content:
                            context['last_district'] = district
                    
                    # Extract category from previous query
                    for category in ['hill', 'beach', 'waterfall', 'backwater', 'temple', 
                                   'wildlife', 'heritage', 'sacred', 'museum', 'fort']:
                        if category in content:
                            context['last_category'] = category
                    
                    context['last_query'] = content
            
            # If query is a follow-up, use previous context
            if is_followup or len(query.split()) < 4:
                return context
        
        return context
    
    def _handle_search(self, request, query, session_id, history):
        """Handle search mode - returns raw search results"""
        try:
            # Get context from history
            context = self._get_context_from_history(history, query)
            
            # Enhance query with context if needed
            enhanced_query = self._enhance_query_with_context(query, context)
            
            # Search
            results = vector_store.search(enhanced_query, top_k=30)
            
            if not results:
                results = vector_store.search(query, top_k=30)
            
            # Deduplicate results
            unique_results = self._deduplicate_results(results)
            
            # Save to conversation history
            conversation_memory[session_id] = history + [
                {'role': 'user', 'content': query, 'timestamp': str(datetime.now())},
                {'role': 'assistant', 'content': f"Search returned {len(unique_results)} results", 'timestamp': str(datetime.now())}
            ]
            
            # Limit history to last 20 messages
            if len(conversation_memory[session_id]) > 20:
                conversation_memory[session_id] = conversation_memory[session_id][-20:]
            
            return Response({
                'success': True,
                'mode': 'search',
                'session_id': session_id,
                'result': {
                    'destinations': [
                        {
                            'id': r.get('id'),
                            'name': r.get('name'),
                            'district': r.get('district'),
                            'description': r.get('description', '')[:200],
                            'category': r.get('category'),
                            'rating': r.get('rating', 0),
                            'score': r.get('score', 0),
                            'hidden_gem': r.get('hidden_gem', False)
                        }
                        for r in unique_results[:20]
                    ],
                    'total_count': len(unique_results)
                }
            })
            
        except Exception as e:
            logger.error(f"❌ Search failed: {e}", exc_info=True)
            return Response({
                'success': False,
                'mode': 'search',
                'error': str(e),
                'message': 'Failed to perform search.'
            }, status=500)
    
    def _handle_plan(self, query, session_id, history):
        """Handle plan mode - creates an itinerary"""
        try:
            # Get context from history
            context = self._get_context_from_history(history, query)
            
            # Enhance query with context
            enhanced_query = self._enhance_query_with_context(query, context)
            
            # Search for destinations
            results = vector_store.search(enhanced_query, top_k=50)
            
            if not results:
                results = vector_store.search(query, top_k=50)
            
            # Deduplicate results
            unique_results = self._deduplicate_results(results)
            
            if not unique_results:
                return Response({
                    'success': True,
                    'mode': 'plan',
                    'session_id': session_id,
                    'result': {
                        'plan': "🔍 I couldn't find enough destinations to create a plan. Please try a different query.",
                        'itinerary': []
                    }
                })
            
            # Create itinerary
            itinerary = self._create_itinerary(query, unique_results)
            
            # Save to conversation history
            conversation_memory[session_id] = history + [
                {'role': 'user', 'content': query, 'timestamp': str(datetime.now())},
                {'role': 'assistant', 'content': f"Created itinerary with {len(itinerary)} stops", 'timestamp': str(datetime.now())}
            ]
            
            # Limit history
            if len(conversation_memory[session_id]) > 20:
                conversation_memory[session_id] = conversation_memory[session_id][-20:]
            
            return Response({
                'success': True,
                'mode': 'plan',
                'session_id': session_id,
                'result': {
                    'plan': self._build_itinerary_text(itinerary),
                    'itinerary': itinerary
                }
            })
            
        except Exception as e:
            logger.error(f"❌ Plan failed: {e}", exc_info=True)
            return Response({
                'success': False,
                'mode': 'plan',
                'error': str(e),
                'message': 'Failed to create itinerary.'
            }, status=500)
    
    def _enhance_query_with_context(self, query: str, context: Dict) -> str:
        """Enhance query with context from conversation history"""
        query_lower = query.lower()
        enhanced = query
        
        # If it's a follow-up and we have context
        is_followup = any(word in query_lower for word in ['again', 'also', 'next', 'previous', 'another', 'more', 'then', 'about'])
        
        if is_followup:
            if context.get('last_district') and 'in' not in query_lower:
                enhanced = f"{query} in {context['last_district']}"
            elif context.get('last_category') and context['last_category'] not in query_lower:
                enhanced = f"{query} {context['last_category']}"
        
        return enhanced
    
    def _deduplicate_results(self, results: List[Dict]) -> List[Dict]:
        """Deduplicate results by name"""
        seen = {}
        unique_results = []
        
        for r in results:
            name = r.get('name', '').strip()
            if not name:
                continue
            
            key = name.lower()
            if key not in seen:
                seen[key] = r
                unique_results.append(r)
            else:
                # Keep the one with higher score
                existing_score = seen[key].get('score', 0)
                new_score = r.get('score', 0)
                if new_score > existing_score:
                    seen[key] = r
                    # Remove old and add new
                    unique_results = [u for u in unique_results if u.get('name', '').lower() != key]
                    unique_results.append(r)
        
        logger.info(f"📊 Deduplicated: {len(results)} → {len(unique_results)} results")
        return unique_results
    
    def _create_itinerary(self, query: str, results: List[Dict]) -> List[Dict]:
        """Create a day-by-day itinerary from results"""
        query_lower = query.lower()
        
        # Determine number of days
        day_match = re.search(r'(\d+)\s*(day|days?)', query_lower)
        if day_match:
            num_days = min(int(day_match.group(1)), 7)  # Max 7 days
        else:
            num_days = 3  # Default 3 days
        
        # Determine if it's a specific type of trip
        is_beach = 'beach' in query_lower
        is_hill = 'hill' in query_lower or 'mountain' in query_lower or 'trek' in query_lower
        is_waterfall = 'waterfall' in query_lower or 'falls' in query_lower
        is_backwater = 'backwater' in query_lower or 'houseboat' in query_lower
        is_heritage = 'heritage' in query_lower or 'fort' in query_lower or 'temple' in query_lower
        
        # Categorize results
        categorized = defaultdict(list)
        for r in results:
            category = r.get('category', '').lower()
            if 'beach' in category:
                categorized['beach'].append(r)
            elif 'hill' in category or 'mountain' in category:
                categorized['hill'].append(r)
            elif 'waterfall' in category:
                categorized['waterfall'].append(r)
            elif 'backwater' in category:
                categorized['backwater'].append(r)
            elif 'temple' in category or 'church' in category or 'fort' in category:
                categorized['heritage'].append(r)
            else:
                categorized['general'].append(r)
        
        # Build itinerary days
        itinerary = []
        used_destinations = set()
        
        for day in range(1, num_days + 1):
            day_plan = {
                'day': day,
                'title': f"Day {day}",
                'destinations': [],
                'description': []
            }
            
            # Determine focus for each day
            if day == 1:
                if is_beach and categorized.get('beach'):
                    day_plan['title'] = f"Day {day} - Beach Day"
                    destinations = categorized.get('beach', [])[:3]
                elif is_waterfall and categorized.get('waterfall'):
                    day_plan['title'] = f"Day {day} - Waterfall Exploration"
                    destinations = categorized.get('waterfall', [])[:3]
                elif is_hill and categorized.get('hill'):
                    day_plan['title'] = f"Day {day} - Hill Station Adventure"
                    destinations = categorized.get('hill', [])[:3]
                else:
                    # Mix of attractions
                    day_plan['title'] = f"Day {day} - Explore Highlights"
                    destinations = results[:3]
            elif day == 2 and num_days > 2:
                if is_backwater and categorized.get('backwater'):
                    day_plan['title'] = f"Day {day} - Backwater Experience"
                    destinations = categorized.get('backwater', [])[:3]
                elif is_heritage and categorized.get('heritage'):
                    day_plan['title'] = f"Day {day} - Heritage & Culture"
                    destinations = categorized.get('heritage', [])[:3]
                else:
                    day_plan['title'] = f"Day {day} - Hidden Gems"
                    # Get destinations not used in day 1
                    remaining = [r for r in results if r.get('name') not in used_destinations]
                    destinations = remaining[:3] if remaining else results[:3]
            else:
                day_plan['title'] = f"Day {day} - Local Experience"
                remaining = [r for r in results if r.get('name') not in used_destinations]
                destinations = remaining[:3] if remaining else results[:3]
            
            # Add destinations to day plan
            for dest in destinations[:3]:
                if dest.get('name') not in used_destinations:
                    day_plan['destinations'].append({
                        'name': dest.get('name'),
                        'district': dest.get('district'),
                        'category': dest.get('category'),
                        'description': dest.get('description', '')[:150]
                    })
                    used_destinations.add(dest.get('name'))
            
            # Generate day description
            if day_plan['destinations']:
                day_plan['description'] = f"Visit {', '.join([d['name'] for d in day_plan['destinations']])}"
            
            itinerary.append(day_plan)
        
        return itinerary
    
    def _build_itinerary_text(self, itinerary: List[Dict]) -> str:
        """Build text description of itinerary"""
        if not itinerary:
            return "Could not create an itinerary."
        
        text = "🗺️ **Your Kerala Itinerary**\n\n"
        
        for day in itinerary:
            text += f"**{day['title']}**\n"
            if day['description']:
                text += f"{day['description']}\n"
            
            for dest in day['destinations']:
                emoji = self._get_category_emoji(dest.get('category', ''))
                text += f"  {emoji} {dest['name']} ({dest.get('district', 'Unknown')})\n"
            
            text += "\n"
        
        text += "💡 **Tips:**\n"
        text += "• Book accommodations in advance\n"
        text += "• Carry comfortable shoes and water\n"
        text += "• Check local weather before traveling\n"
        text += "• 📲 Download maps for offline use\n"
        
        return text
    
    def _handle_answer(self, query, session_id, history):
        try:
            # Get context from history
            context = self._get_context_from_history(history, query)
            
            # ✅ IMPORTANT FIX: Extract specific location names from query
            location_names = self._extract_location_names(query)
            
            # ✅ FIX: Check for typo corrections (e.g., "besta" -> "best")
            corrected_query = self._correct_query_typos(query)
            
            # Enhance query with context
            enhanced_query = self._enhance_query_with_context(corrected_query, context)
            
            # ✅ If query has specific location like "Wayanad" - check if the query makes sense
            district_info = self._get_district_info(query)
            
            # ✅ If query is asking for beach in Wayanad - Wayanad has no beaches
            if 'beach' in query.lower() and 'wayanad' in query.lower():
                return Response({
                    'success': True,
                    'mode': 'answer',
                    'session_id': session_id,
                    'result': {
                        'answer': "🏔️ **Wayanad is a hill district in Kerala and does not have any beaches.**\n\n"
                                  "Wayanad is known for its:\n"
                                  "• ⛰️ **Hill stations** - Chembra Peak, Banasura Hill\n"
                                  "• 💧 **Waterfalls** - Meenmutty, Soochipara, Kanthanpara\n"
                                  "• 🌿 **Wildlife** - Wayanad Wildlife Sanctuary\n"
                                  "• 🏛️ **Heritage** - Edakkal Caves, Wayanad Heritage Museum\n\n"
                                  "💡 **Would you like recommendations for hill stations, waterfalls, or wildlife in Wayanad?**",
                        'destinations': []
                    }
                })
            
            # ✅ If query has specific location like "Malappuram" - handle typos
            if 'malappuram' in query.lower() and ('besta' in query.lower() or 'best' in query.lower()):
                # Search specifically for Malappuram
                results = vector_store.search(f"{corrected_query} malappuram", top_k=50)
            else:
                # Search with the specific location first
                if location_names:
                    location_query = f"{corrected_query} {location_names[0]}"
                    results = vector_store.search(location_query, top_k=50)
                    
                    # If no results, try with just the location
                    if not results:
                        results = vector_store.search(location_names[0], top_k=50)
                else:
                    # Search using enhanced query
                    results = vector_store.search(enhanced_query, top_k=50)
            
            if not results:
                # If no results, try with original query
                results = vector_store.search(corrected_query, top_k=50)
                
                if not results:
                    # Check if this is a "suggest" or "without beaches" query that might have local data
                    query_lower = corrected_query.lower()
                    if 'suggest' in query_lower or 'without beaches' in query_lower or 'no beach' in query_lower:
                        # Try to get some results for related terms
                        if 'peaceful' in query_lower:
                            related_results = vector_store.search("peaceful places", top_k=30)
                            if related_results:
                                results = related_results
                        elif 'hill' in query_lower:
                            related_results = vector_store.search("hill stations", top_k=30)
                            if related_results:
                                results = related_results
                        elif 'waterfall' in query_lower:
                            related_results = vector_store.search("waterfalls", top_k=30)
                            if related_results:
                                results = related_results
                    
                    if not results:
                        return Response({
                            'success': True,
                            'mode': 'answer',
                            'session_id': session_id,
                            'result': {
                                'answer': "🔍 I couldn't find any destinations matching your query. Please try different keywords.",
                                'destinations': []
                            }
                        })
            
            # DEDUPLICATE RESULTS
            unique_results = self._deduplicate_results(results)
            
            logger.info(f"📊 Deduplicated: {len(results)} → {len(unique_results)} results")
            
            # Build answer with context
            answer, filtered_results = self._build_answer_with_filtering(enhanced_query, unique_results, context, location_names)
            
            # Determine how many results to show
            max_results = self._get_max_results(corrected_query, len(filtered_results))
            
            # Save to conversation history
            conversation_memory[session_id] = history + [
                {'role': 'user', 'content': query, 'timestamp': str(datetime.now())},
                {'role': 'assistant', 'content': answer[:500], 'timestamp': str(datetime.now())}
            ]
            
            # Limit history to last 20 messages
            if len(conversation_memory[session_id]) > 20:
                conversation_memory[session_id] = conversation_memory[session_id][-20:]
            
            return Response({
                'success': True,
                'mode': 'answer',
                'session_id': session_id,
                'result': {
                    'answer': answer,
                    'destinations': [
                        {
                            'id': r.get('id'),
                            'name': r.get('name'),
                            'district': r.get('district'),
                            'description': self._safe_truncate(r.get('description', ''), 200),
                            'category': r.get('category'),
                            'rating': r.get('rating', 0),
                            'score': r.get('score', 0),
                            'hidden_gem': r.get('hidden_gem', False)
                        }
                        for r in filtered_results[:max_results]
                    ],
                    'total_count': len(filtered_results),
                    'displayed_count': max_results
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
    
    def _correct_query_typos(self, query: str) -> str:
        """Correct common typos in queries"""
        corrected = query
        
        # Common typos
        typos = {
            'besta': 'best',
            'beste': 'best',
            'bestt': 'best',
            'beachh': 'beach',
            'beac': 'beach',
            'waterfal': 'waterfall',
            'waterfals': 'waterfall',
            'hilll': 'hill',
            'hills': 'hill',
            'mountan': 'mountain',
            'mountin': 'mountain',
            'trekkingg': 'trekking',
            'treking': 'trekking',
            'itineraryy': 'itinerary',
            'itinirary': 'itinerary',
            'planning': 'plan',
            'plann': 'plan',
        }
        
        words = corrected.split()
        corrected_words = []
        
        for word in words:
            word_lower = word.lower()
            if word_lower in typos:
                # Replace the word preserving case
                if word[0].isupper():
                    corrected_words.append(typos[word_lower].capitalize())
                else:
                    corrected_words.append(typos[word_lower])
            else:
                corrected_words.append(word)
        
        return ' '.join(corrected_words)
    
    def _get_district_info(self, query: str) -> Dict:
        """Get information about a district mentioned in the query"""
        query_lower = query.lower()
        
        # District characteristics
        district_info = {
            'wayanad': {
                'has_beaches': False,
                'has_hills': True,
                'has_waterfalls': True,
                'has_wildlife': True,
                'type': 'hill',
                'description': 'A hill district known for its lush green landscapes, tea plantations, and wildlife sanctuaries.'
            },
            'idukki': {
                'has_beaches': False,
                'has_hills': True,
                'has_waterfalls': True,
                'has_wildlife': True,
                'type': 'hill',
                'description': 'A high-range district with the highest peak in Kerala, known for tea gardens and wildlife.'
            },
            'alappuzha': {
                'has_beaches': True,
                'has_hills': False,
                'has_waterfalls': False,
                'has_wildlife': False,
                'type': 'backwater',
                'description': 'Known as the Venice of the East, famous for backwaters and houseboat cruises.'
            },
            'kannur': {
                'has_beaches': True,
                'has_hills': True,
                'has_waterfalls': False,
                'has_wildlife': True,
                'type': 'coastal',
                'description': 'A coastal district with beautiful beaches, historic forts, and lush green hills.'
            },
            'kasargod': {
                'has_beaches': True,
                'has_hills': True,
                'has_waterfalls': False,
                'has_wildlife': False,
                'type': 'coastal',
                'description': 'The northernmost district with pristine beaches and historic forts.'
            }
        }
        
        for district, info in district_info.items():
            if district in query_lower:
                return info
        
        return None
    
    def _extract_location_names(self, query: str) -> List[str]:
        """Extract specific location names from query"""
        query_lower = query.lower()
        locations = []
        
        # Common Kerala destinations
        destination_names = [
            'varkala', 'alleppey', 'alappuzha', 'munnar', 'kochi', 'ernakulam',
            'trivandrum', 'thiruvananthapuram', 'kannur', 'wayanad', 'idukki',
            'kottayam', 'kollam', 'palakkad', 'thrissur', 'kozhikode', 'kasargod',
            'pathanamthitta', 'malappuram', 'kovalam', 'kumarakom', 'thekkady',
            'vagamon', 'periyar', 'athirappilly', 'bekal', 'ponmudi',
            'sulthan bathery', 'nilambur', 'ponnani', 'kadalundi'
        ]
        
        for loc in destination_names:
            if loc in query_lower:
                locations.append(loc)
        
        return locations
    
    def _safe_truncate(self, text: str, max_length: int) -> str:
        """Safely truncate text without cutting words mid-sentence"""
        if not text:
            return ''
        
        if len(text) <= max_length:
            return text
        
        # Find the last space within max_length
        truncate_at = text[:max_length].rfind(' ')
        if truncate_at > 0:
            return text[:truncate_at] + '...'
        else:
            return text[:max_length - 3] + '...'
    
    def _build_answer_with_filtering(self, query: str, results: List[Dict], context: Dict = None, location_names: List[str] = None) -> tuple:
        """Build answer with proper filtering - results should already be deduplicated"""
        if not results:
            return "🔍 I couldn't find any destinations matching your query.", []
        
        query_lower = query.lower()
        final_results = results.copy()
        
        # ✅ Check if user wants to EXCLUDE beaches
        exclude_beach = any(phrase in query_lower for phrase in [
            'not beach', 'no beach', 'without beach', 'except beach', 
            'besides beach', 'beach not', 'no beaches', 'not beaches',
            'excluding beach', 'avoid beach', 'without beaches',
            'excluding beaches', 'avoid beaches', 'no beach destinations',
            'without beaches in', 'without any beaches'
        ])
        
        # ✅ Detect "suggest" queries - we should be more lenient with results
        is_suggest_query = 'suggest' in query_lower
        is_peaceful_query = 'peaceful' in query_lower
        
        # ✅ Detect specific location from query - prioritize these
        detected_location = None
        if location_names:
            detected_location = location_names[0]
            logger.info(f"📍 Detected location: {detected_location}")
            
            # Filter results by the specific location
            location_results = [r for r in final_results if detected_location.lower() in r.get('district', '').lower() 
                              or detected_location.lower() in r.get('name', '').lower()
                              or detected_location.lower() in r.get('description', '').lower()]
            if location_results:
                final_results = location_results
                logger.info(f"📍 Filtered to location {detected_location}: {len(final_results)} results")
        
        # Detect district (if not already detected via location)
        if not detected_location:
            detected_district = self._detect_district(query_lower)
            
            # If no district in query but context has district, use it
            if not detected_district and context and context.get('last_district'):
                detected_district = context['last_district']
                logger.info(f"📍 Using context district: {detected_district}")
            
            # Filter by district if detected
            if detected_district:
                district_results = [r for r in final_results if detected_district in r.get('district', '').lower()]
                if district_results:
                    final_results = district_results
                    logger.info(f"📍 Filtered to {detected_district}: {len(final_results)} results")
        
        # Exclude beaches if requested
        if exclude_beach:
            # More aggressive beach filtering
            final_results = [r for r in final_results if 'beach' not in r.get('name', '').lower()]
            final_results = [r for r in final_results if 'beach' not in r.get('category', '').lower()]
            final_results = [r for r in final_results if 'coast' not in r.get('category', '').lower()]
            
            logger.info(f"🌊 After beach exclusion: {len(final_results)} results")
            
            if not final_results:
                return "🌿 I couldn't find any non-beach destinations matching your query. Try searching for hill stations, backwaters, or waterfalls!", []
        
        # Type detection
        is_waterfall_query = any([
            'waterfall' in query_lower, 'falls' in query_lower,
            'cascade' in query_lower, 'monsoon' in query_lower
        ])
        
        is_hill_query = any([
            'hill' in query_lower, 'mountain' in query_lower, 
            'peak' in query_lower, 'trek' in query_lower,
            'trekking' in query_lower
        ])
        
        is_beach_query = any([
            'beach' in query_lower, 'coast' in query_lower,
            'sea' in query_lower, 'shore' in query_lower
        ])
        
        is_backwater_query = any([
            'backwater' in query_lower, 'houseboat' in query_lower,
            'backwaters' in query_lower, 'lake' in query_lower
        ])
        
        is_heritage_query = any([
            'heritage' in query_lower, 'fort' in query_lower,
            'palace' in query_lower, 'museum' in query_lower,
            'historical' in query_lower
        ])
        
        is_sacred_query = any([
            'temple' in query_lower, 'church' in query_lower,
            'mosque' in query_lower, 'sacred' in query_lower,
            'spiritual' in query_lower, 'pilgrimage' in query_lower
        ])
        
        # Filter by type
        if is_waterfall_query:
            filtered = [r for r in final_results if 'waterfall' in r.get('category', '').lower() or 'waterfall' in r.get('name', '').lower()]
            if filtered:
                final_results = filtered
            answer = self._build_waterfall_answer(final_results, query_lower)
        elif is_hill_query:
            filtered = [r for r in final_results if 'hill' in r.get('category', '').lower() or 'hill' in r.get('name', '').lower()]
            if filtered:
                final_results = filtered
            answer = self._build_hill_answer(final_results, query_lower)
        elif is_beach_query and not exclude_beach:
            answer = self._build_beach_answer(final_results)
        elif is_backwater_query:
            answer = self._build_backwater_answer(final_results)
        elif is_heritage_query:
            answer = self._build_general_answer(query, final_results, "heritage")
        elif is_sacred_query:
            answer = self._build_general_answer(query, final_results, "sacred")
        elif detected_location or (context and context.get('last_district')):
            answer = self._build_general_answer(query, final_results, "location")
        elif exclude_beach:
            answer = self._build_no_beach_answer(final_results)
        elif is_suggest_query or is_peaceful_query:
            # For suggest queries, try to find the best matches based on intent
            if is_peaceful_query:
                # Filter peaceful places
                peaceful_results = [r for r in final_results if 'peaceful' in r.get('description', '').lower() or 'peaceful' in r.get('tags', [])]
                if peaceful_results:
                    final_results = peaceful_results
            answer = self._build_general_answer(query, final_results, "suggest")
        else:
            answer = self._build_general_answer(query, final_results, "general")
        
        return answer, final_results
    
    def _get_category_emoji(self, category: str) -> str:
        """Get emoji for category - FIXED with more accurate mapping"""
        if not category:
            return '📍'
        
        category_lower = category.lower()
        
        # ✅ More accurate emoji mapping based on actual category
        if 'beach' in category_lower:
            return '🏖️'
        elif 'hill' in category_lower or 'mountain' in category_lower:
            return '⛰️'
        elif 'waterfall' in category_lower:
            return '💧'
        elif 'backwater' in category_lower:
            return '🚣'
        elif 'wildlife' in category_lower or 'sanctuary' in category_lower:
            return '🐘'
        elif 'temple' in category_lower:
            return '🛕'
        elif 'church' in category_lower:
            return '⛪'
        elif 'mosque' in category_lower:
            return '🕌'
        elif 'fort' in category_lower or 'heritage' in category_lower:
            return '🏛️'
        elif 'museum' in category_lower:
            return '🏛️'
        elif 'park' in category_lower or 'garden' in category_lower:
            return '🌳'
        else:
            return '📍'
    
    def _get_max_results(self, query: str, total_available: int) -> int:
        """Determine how many results to show based on query - FIXED for "one best" queries"""
        query_lower = query.lower()
        
        # ✅ Check if user explicitly wants ONE result
        one_phrases = [
            'one best', 'top one', 'only one', 'single best', 'best one',
            'one hill station', 'one place', 'one destination', 'one beach',
            'one waterfall', 'one temple', 'one fort', 'one museum',
            'one hill', 'one mountain', 'one peak', 'one trek',
            'one best place', 'the best', 'top recommendation'
        ]
        if any(phrase in query_lower for phrase in one_phrases):
            return min(1, total_available)
        
        # ✅ Check for "one" at start of query
        if query_lower.startswith('one ') or query_lower.startswith('single '):
            return min(1, total_available)
        
        # ✅ Check for "1 place" pattern
        if re.search(r'\b1\s*(place|destination|hill|beach|waterfall|temple|fort|museum)s?\b', query_lower):
            return min(1, total_available)
        
        # ✅ Check if user explicitly asks for "suggest me X places"
        num_match = re.search(r'suggest me (\d+)\s*places?', query_lower)
        if num_match:
            requested = int(num_match.group(1))
            return min(requested, 14, total_available)
        
        # ✅ Check if user wants a specific number of places
        num_match = re.search(r'(\d+)\s*places?', query_lower)
        if num_match:
            requested = int(num_match.group(1))
            return min(requested, 14, total_available)
        
        # ✅ Check for specific numbers in query
        if '14' in query_lower or 'fourteen' in query_lower:
            return min(14, total_available)
        if '12' in query_lower or 'twelve' in query_lower:
            return min(12, total_available)
        if '10' in query_lower or 'ten' in query_lower:
            return min(10, total_available)
        if '5' in query_lower or 'five' in query_lower:
            return min(5, total_available)
        if 'all' in query_lower:
            return min(14, total_available)
        
        # ✅ Check if query is asking for "best places" (plural) - show 10
        if 'places' in query_lower and not any(word in query_lower for word in ['one', 'single']):
            return min(10, total_available)
        
        # ✅ Check if query has a district or location name - show 10
        districts = ['kannur', 'kasargod', 'wayanad', 'idukki', 'alappuzha', 
                    'thrissur', 'ernakulam', 'kottayam', 'kollam', 'palakkad',
                    'malappuram', 'kozhikode', 'pathanamthitta', 'thiruvananthapuram',
                    'varkala', 'munnar', 'kochi', 'alleppey', 'kovalam']
        if any(district in query_lower for district in districts):
            return min(10, total_available)
        
        # ✅ Check if query is asking for "suggest" - show 10
        if 'suggest' in query_lower:
            return min(10, total_available)
        
        # ✅ Check if query has "itinerary" or "plan" - show 5 (itinerary-style)
        if 'itinerary' in query_lower or 'plan' in query_lower:
            return min(5, total_available)
        
        # ✅ Default: Show 10 results for general queries
        return min(10, total_available)
    
    def _detect_district(self, query_lower: str) -> Optional[str]:
        """Detect district name in query"""
        districts = [
            'kannur', 'wayanad', 'idukki', 'alappuzha', 'thrissur', 
            'ernakulam', 'trivandrum', 'kottayam', 'kozhikode', 
            'palakkad', 'malappuram', 'pathanamthitta', 'kollam', 'kasargod'
        ]
        
        for district in districts:
            if district in query_lower:
                return district
        
        return None
    
    def _build_general_answer(self, query: str, results: List[Dict], context: str = "general") -> str:
        """Build general answer with proper deduplication - FIXED for "one best" queries"""
        if not results:
            return "🔍 I couldn't find any destinations matching your query."
        
        query_lower = query.lower()
        
        # ✅ Check if user wants only ONE result
        is_single = any(phrase in query_lower for phrase in [
            'one best', 'top one', 'only one', 'single best', 'best one',
            'one hill station', 'one place', 'one destination', 'one beach',
            'one waterfall', 'one temple', 'one fort', 'one museum',
            'one hill', 'one mountain', 'one peak', 'one trek',
            'one best place', 'the best', 'top recommendation'
        ])
        
        # Check if query starts with "one" or "single"
        if query_lower.startswith('one ') or query_lower.startswith('single '):
            is_single = True
        
        # Check for "1 place" pattern
        if re.search(r'\b1\s*(place|destination|hill|beach|waterfall|temple|fort|museum)s?\b', query_lower):
            is_single = True
        
        # ✅ Check if user explicitly asks for "suggest me X places"
        num_match = re.search(r'suggest me (\d+)\s*places?', query_lower)
        if num_match:
            max_results = int(num_match.group(1))
            max_results = min(max_results, 14)
        else:
            # ✅ Determine how many results to show
            if is_single:
                max_results = 1
            elif 'itinerary' in query_lower or 'plan' in query_lower:
                max_results = min(5, len(results))
            else:
                num_match = re.search(r'(\d+)\s*places?', query_lower)
                if num_match:
                    max_results = int(num_match.group(1))
                    max_results = min(max_results, 14)
                elif '14' in query_lower or 'fourteen' in query_lower:
                    max_results = 14
                elif '12' in query_lower or 'twelve' in query_lower:
                    max_results = 12
                elif '10' in query_lower or 'ten' in query_lower:
                    max_results = 10
                elif '5' in query_lower or 'five' in query_lower:
                    max_results = 5
                elif 'suggest' in query_lower:
                    max_results = 10
                elif 'places' in query_lower or 'district' in query_lower:
                    max_results = 10
                else:
                    max_results = 10
        
        max_results = min(max_results, len(results))
        
        # Customize opening
        if is_single:
            if 'hill' in query_lower or 'mountain' in query_lower:
                opening = "⛰️ **The best hill station in Kerala is:**\n\n"
            elif 'beach' in query_lower:
                opening = "🏖️ **The best beach in Kerala is:**\n\n"
            elif 'waterfall' in query_lower:
                opening = "💧 **The best waterfall in Kerala is:**\n\n"
            elif 'temple' in query_lower or 'church' in query_lower or 'mosque' in query_lower:
                opening = "🛕 **The best sacred place in Kerala is:**\n\n"
            elif 'backwater' in query_lower:
                opening = "🚣 **The best backwater destination in Kerala is:**\n\n"
            else:
                opening = "⭐ **The top recommendation for you is:**\n\n"
        elif context == "suggest":
            opening = f"✨ **Here are {max_results} recommendations based on your interests:**\n\n"
        elif context == "location" or any(district in query_lower for district in ['kannur', 'wayanad', 'idukki', 'alappuzha', 'thrissur', 'ernakulam', 'kottayam', 'kollam', 'palakkad', 'malappuram', 'kozhikode', 'pathanamthitta', 'thiruvananthapuram', 'varkala', 'munnar', 'kochi', 'alleppey']):
            district = self._detect_district(query_lower) or "Kerala"
            opening = f"📍 **Top {max_results} destinations in {district.title()} district:**\n\n"
        elif '14 districts' in query_lower or 'all districts' in query_lower:
            opening = f"🗺️ **Top {max_results} places across all 14 districts of Kerala:**\n\n"
        elif context == "heritage" or 'heritage' in query_lower:
            opening = f"🏛️ **Top {max_results} heritage sites in Kerala:**\n\n"
        elif context == "sacred" or 'temple' in query_lower or 'church' in query_lower:
            opening = f"🛕 **Top {max_results} sacred places in Kerala:**\n\n"
        else:
            opening = f"✨ **Top {max_results} recommendations based on your interests:**\n\n"
        
        answer = opening
        
        for i, r in enumerate(results[:max_results], 1):
            emoji = self._get_category_emoji(r.get('category', ''))
            district = r.get('district', 'Unknown')
            name = r.get('name', 'Unknown')
            description = r.get('description', '')
            
            answer += f"{i}. {emoji} **{name}**"
            if district and district != 'Unknown':
                answer += f" ({district})"
            answer += "\n"
            
            # ✅ Use safe truncation
            if description:
                answer += f"   {self._safe_truncate(description, 200)}\n"
            
            if r.get('rating'):
                answer += f"   ⭐ {r.get('rating')}\n"
            
            if r.get('hidden_gem'):
                answer += f"   💎 Hidden Gem: {self._safe_truncate(r.get('hidden_gem'), 150)}\n"
            
            answer += "\n"
        
        answer += "💡 **Tips:**\n"
        answer += "• 📲 Download maps for easier navigation\n"
        answer += "• 🍛 Don't miss local Kerala cuisine\n"
        answer += "• 🌅 Visit early morning for the best experience\n"
        
        return answer
    
    def _build_no_beach_answer(self, results: List[Dict]) -> str:
        """Build answer for 'no beach' queries"""
        if not results:
            return "🌿 I couldn't find any non-beach destinations matching your query. Try searching for hill stations, backwaters, or waterfalls!"
        
        max_results = min(10, len(results))
        answer = "🌿 **Exploring Kerala beyond beaches - here are beautiful alternatives:**\n\n"
        
        for i, r in enumerate(results[:max_results], 1):
            emoji = self._get_category_emoji(r.get('category', ''))
            name = r.get('name', 'Unknown')
            district = r.get('district', 'Unknown')
            description = r.get('description', '')
            rating = r.get('rating', 0)
            
            answer += f"{i}. {emoji} **{name}**"
            if district and district != 'Unknown':
                answer += f" ({district})"
            answer += "\n"
            
            if description:
                answer += f"   {self._safe_truncate(description, 150)}\n"
            
            if rating:
                stars = "⭐" * min(int(rating), 5)
                answer += f"   {stars} {rating:.1f}\n"
            
            answer += "\n"
        
        answer += "💡 **Tips:**\n"
        answer += "• 🌿 Kerala has diverse landscapes beyond beaches\n"
        answer += "• 🗺️ Explore hills, backwaters, and wildlife sanctuaries\n"
        answer += "• 🕊️ Visit early morning for peaceful experience\n"
        answer += "• 📲 Download maps for easier navigation\n"
        
        return answer
    
    def _build_waterfall_answer(self, results: List[Dict], query_lower: str = "") -> str:
        """Build answer for waterfall queries - FIXED for "one best" queries"""
        waterfalls = [r for r in results if 'waterfall' in r.get('category', '').lower() or 'waterfall' in r.get('name', '').lower()]
        
        if not waterfalls:
            return "💧 I couldn't find any waterfalls matching your query. Try searching for a specific district."
        
        # ✅ Check if user wants only ONE waterfall
        is_single = any(phrase in query_lower for phrase in [
            'one', 'single', 'best', 'one best', 'top one', 'only one', 
            'single best', 'best one', 'one waterfall', 'top waterfall'
        ])
        
        if query_lower.startswith('one ') or query_lower.startswith('single '):
            is_single = True
        
        if re.search(r'\b1\s*waterfall\b', query_lower):
            is_single = True
        
        max_results = 1 if is_single else min(10, len(waterfalls))
        
        if is_single:
            answer = "💧 **The best waterfall in Kerala is:**\n\n"
        else:
            answer = "💧 **Here are the most beautiful waterfalls in Kerala:**\n\n"
        
        for i, w in enumerate(waterfalls[:max_results], 1):
            name = w.get('name', 'Unknown')
            district = w.get('district', 'Unknown')
            description = w.get('description', '')
            rating = w.get('rating', 0)
            
            answer += f"{i}. 📍 **{name}**"
            if district and district != 'Unknown':
                answer += f" ({district})"
            answer += "\n"
            
            if description:
                answer += f"   {self._safe_truncate(description, 150)}\n"
            
            if rating:
                stars = "⭐" * min(int(rating), 5)
                answer += f"   {stars} {rating:.1f}\n"
            
            answer += "\n"
        
        answer += "💡 **Tips:**\n"
        answer += "• Best time to visit waterfalls: Post-monsoon (September to February)\n"
        answer += "• Wear comfortable footwear and carry water\n"
        answer += "• 📲 Download maps for easier navigation\n"
        
        return answer
    
    def _build_hill_answer(self, results: List[Dict], query_lower: str) -> str:
        """Build answer for hill station queries - FIXED for "one best" queries"""
        hills = [r for r in results if 'hill' in r.get('category', '').lower() or 'hill' in r.get('name', '').lower()]
        
        if not hills:
            return "⛰️ I couldn't find any hill stations matching your query. Try searching for a specific district."
        
        # ✅ Check if user wants only ONE hill station
        is_single = any(phrase in query_lower for phrase in [
            'one', 'single', 'best', 'one best', 'top one', 'only one', 
            'single best', 'best one', 'one hill', 'one mountain', 'one peak',
            'top hill', 'top mountain'
        ])
        
        if query_lower.startswith('one ') or query_lower.startswith('single '):
            is_single = True
        
        if re.search(r'\b1\s*(hill|mountain|peak|station)s?\b', query_lower):
            is_single = True
        
        max_results = 1 if is_single else min(10, len(hills))
        
        if is_single:
            answer = "⛰️ **The best hill station for trekking in Kerala is:**\n\n"
        else:
            answer = "⛰️ **Here are the best hill stations for trekking in Kerala:**\n\n"
        
        for i, h in enumerate(hills[:max_results], 1):
            name = h.get('name', 'Unknown')
            district = h.get('district', 'Unknown')
            description = h.get('description', '')
            rating = h.get('rating', 0)
            
            answer += f"{i}. 📍 **{name}**"
            if district and district != 'Unknown':
                answer += f" ({district})"
            answer += "\n"
            
            if description:
                answer += f"   {self._safe_truncate(description, 150)}\n"
            
            if rating:
                stars = "⭐" * min(int(rating), 5)
                answer += f"   {stars} {rating:.1f}\n"
            
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
        
        max_results = min(10, len(beaches))
        answer = "🏖️ **Here are the best beaches in Kerala:**\n\n"
        
        for i, b in enumerate(beaches[:max_results], 1):
            name = b.get('name', 'Unknown')
            district = b.get('district', 'Unknown')
            description = b.get('description', '')
            rating = b.get('rating', 0)
            
            answer += f"{i}. 📍 **{name}**"
            if district and district != 'Unknown':
                answer += f" ({district})"
            answer += "\n"
            
            if description:
                answer += f"   {self._safe_truncate(description, 150)}\n"
            
            if rating:
                stars = "⭐" * min(int(rating), 5)
                answer += f"   {stars} {rating:.1f}\n"
            
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
        
        max_results = min(10, len(backwaters))
        answer = "🚣 **Here are the most serene backwater destinations:**\n\n"
        
        for i, b in enumerate(backwaters[:max_results], 1):
            name = b.get('name', 'Unknown')
            district = b.get('district', 'Unknown')
            description = b.get('description', '')
            rating = b.get('rating', 0)
            
            answer += f"{i}. 📍 **{name}**"
            if district and district != 'Unknown':
                answer += f" ({district})"
            answer += "\n"
            
            if description:
                answer += f"   {self._safe_truncate(description, 150)}\n"
            
            if rating:
                stars = "⭐" * min(int(rating), 5)
                answer += f"   {stars} {rating:.1f}\n"
            
            answer += "\n"
        
        answer += "💡 **Tips:**\n"
        answer += "• Best time to visit: October to March\n"
        answer += "• Book houseboats in advance\n"
        answer += "• 📲 Download maps for easier navigation\n"
        
        return answer