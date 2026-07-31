# api/views/ai_views.py - COMPLETE FIXED VERSION

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
import logging
import re
from typing import Dict, List, Optional
import uuid
from datetime import datetime
from collections import defaultdict
import time

# ============================================
# FORCE IMPORT - No try/except
# ============================================
from destinations.models import Destination

try:
    from ai.vector_store import vector_store
except ImportError:
    vector_store = None
    print("⚠️ vector_store not available")

logger = logging.getLogger(__name__)

conversation_memory = defaultdict(list)
session_last_accessed = {}
SESSION_TIMEOUT = 3600
MAX_SESSIONS = 1000

# ============================================
# CACHE
# ============================================
_destinations_cache = None
_cache_time = None
CACHE_DURATION = 300  # 5 minutes

# ============================================
# CATEGORY EMOJI MAP
# ============================================

CATEGORY_EMOJI = {
    'beach': '🏖️',
    'hill': '⛰️',
    'hill_station': '⛰️',
    'backwater': '🚣',
    'wildlife': '🐘',
    'temple': '🛕',
    'heritage': '🏛️',
    'fort': '🏛️',
    'palace': '🏛️',
    'waterfall': '💧',
    'waterfalls': '💧',
    'nature': '🌿',
    'adventure': '🎢',
    'park': '🌳',
    'parks': '🌳',
    'garden': '🌳',
    'gardens': '🌳',
    'museum': '🏛️',
    'museums': '🏛️',
    'culture': '🎭',
    'viewpoint': '👀',
    'landmark': '📍',
    'general': '📍',
    'other': '📍',
    'resort': '🏨',
    'resorts': '🏨',
    'ayurveda': '💆',
    'spiritual': '🕉️',
    'sacred': '🕉️',
    'mosque': '🕌',
    'church': '⛪',
    'pilgrimage': '🕉️',
    'water': '💧',
    'lake': '🏞️',
    'river': '🏞️',
    'mountain': '⛰️',
    'mountains': '⛰️',
}

def get_category_emoji(category: str) -> str:
    """Get emoji for category"""
    if not category:
        return '📍'
    category_lower = category.lower()
    for key, emoji in CATEGORY_EMOJI.items():
        if key in category_lower:
            return emoji
    return '📍'

# ============================================
# FETCH DATA FROM DATABASE
# ============================================

def fetch_destinations_from_db() -> List[Dict]:
    """Fetch all destinations from PostgreSQL database"""
    destinations = []
    
    try:
        # Get ALL destinations
        queryset = Destination.objects.all()
        total = queryset.count()
        print(f"📊 Found {total} destinations in database")
        
        if total == 0:
            print("⚠️ Database is empty!")
            return []
        
        for dest in queryset:
            # Get category display name
            category_name = dest.category
            if hasattr(dest, 'get_category_display'):
                try:
                    category_name = dest.get_category_display()
                except:
                    category_name = dest.category
            
            # Build location from available fields
            location = ''
            if dest.address:
                location = dest.address
            elif dest.district:
                location = dest.district
            
            # Get description
            description = dest.long_description or dest.short_description or ''
            
            # Fix common data quality issues
            name = dest.name
            # Fix truncated names
            if name == 'Queen':
                name = "Queen's Walkway"
            elif name == 'Vatika Children':
                name = "Vatika Children's Park"
            elif name == 'Overbury':
                name = "Overbury's Folly"
            elif name == 'Jatayu Earth':
                name = "Jatayu Earth's Center"
            elif name == 'kadalpalam':
                name = "Kadalpalam Beach"
            elif name == 'Payyambalam Beach Children':
                name = "Payyambalam Beach Children's Park"
            elif name == 'Sadhoo Merry':
                name = "Sadhoo Merry Kingdom"
            elif name == 'VLand':
                name = "VLand Water Theme Park"
            elif name == 'Wonderla':
                name = "Wonderla Amusement Park"
            elif name == 'Silver Storm':
                name = "Silver Storm Water Theme Park"
            
            destinations.append({
                'id': dest.id,
                'name': name,
                'district': dest.district or 'Unknown',
                'location': location,
                'description': description,
                'category': category_name,
                'category_title': category_name,
                'type': 'hidden' if dest.status == 'hidden' else 'well-known',
                'rating': float(dest.average_rating or 0),
                'image': dest.featured_image or '',
                'tags': [],
                'latitude': float(dest.latitude) if dest.latitude else None,
                'longitude': float(dest.longitude) if dest.longitude else None,
                'status': dest.status,
            })
        
        print(f"✅ Loaded {len(destinations)} destinations from database")
        
    except Exception as e:
        print(f"❌ Failed to fetch destinations: {e}")
        import traceback
        traceback.print_exc()
    
    return destinations

def get_destinations() -> List[Dict]:
    """Get destinations with caching"""
    global _destinations_cache, _cache_time
    
    current_time = time.time()
    if _destinations_cache and _cache_time and (current_time - _cache_time) < CACHE_DURATION:
        return _destinations_cache
    
    print("🔄 Refreshing destination cache...")
    _destinations_cache = fetch_destinations_from_db()
    _cache_time = current_time
    print(f"📊 Cache updated with {len(_destinations_cache)} destinations")
    
    return _destinations_cache

# ============================================
# AI CHAT VIEW
# ============================================

class AIChatView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            # Cleanup old sessions
            if len(session_last_accessed) > MAX_SESSIONS:
                self._cleanup_old_sessions()
            
            query = request.data.get('query', '')
            mode = request.data.get('mode', 'answer')
            session_id = request.data.get('session_id', None)
            
            if not session_id:
                session_id = str(uuid.uuid4())
            
            if not query:
                return Response({
                    'success': False,
                    'error': 'Query is required'
                }, status=400)
            
            print(f"📝 Query: '{query[:50]}...' (mode: {mode})")
            
            session_last_accessed[session_id] = time.time()
            history = conversation_memory.get(session_id, [])
            
            # Get destinations from database
            destinations = get_destinations()
            
            if mode == 'search':
                return self._handle_search(query, destinations, session_id, history)
            elif mode == 'plan':
                return self._handle_plan(query, destinations, session_id, history)
            else:
                return self._handle_answer(query, destinations, session_id, history)
                
        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()
            return Response({
                'success': False,
                'mode': 'answer',
                'error': str(e),
                'message': 'Failed to process your request'
            }, status=400)
    
    def _cleanup_old_sessions(self):
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
    
    # ============================================
    # SEARCH
    # ============================================
    
    def _search_data(self, query: str, destinations: List[Dict], top_k: int = 30) -> List[Dict]:
        """Search destinations using vector search or keyword fallback"""
        query_lower = query.lower().strip()
        
        print(f"🔍 Searching: '{query}' among {len(destinations)} destinations")
        
        if not destinations:
            print("❌ No destinations to search!")
            return []
        
        # Try vector search first
        if vector_store:
            try:
                results = vector_store.search(query, top_k=top_k)
                if results:
                    print(f"✅ Vector search found {len(results)} results")
                    return results
            except Exception as e:
                print(f"⚠️ Vector search failed: {e}")
        
        # Fallback to keyword search
        words = query_lower.split()
        scored = []
        
        for dest in destinations:
            score = 0
            search_text = ' '.join([
                dest.get('name', ''),
                dest.get('district', ''),
                dest.get('category', ''),
                dest.get('description', '')
            ]).lower()
            
            if query_lower in search_text:
                score += 10
            
            for word in words:
                if len(word) < 2:
                    continue
                if word in dest.get('name', '').lower():
                    score += 5
                if word in dest.get('district', '').lower():
                    score += 4
                if word in dest.get('category', '').lower():
                    score += 3
                if word in dest.get('description', '').lower():
                    score += 2
            
            if score > 0:
                scored.append({**dest, 'score': min(score / 10, 1.0)})
        
        scored.sort(key=lambda x: x.get('score', 0), reverse=True)
        print(f"✅ Keyword search found {len(scored)} results")
        return scored[:top_k]
    
    def _detect_district(self, query_lower: str) -> Optional[str]:
        districts = [
            'thiruvananthapuram', 'kollam', 'pathanamthitta', 'alappuzha', 
            'kottayam', 'idukki', 'ernakulam', 'thrissur', 'palakkad',
            'malappuram', 'kozhikode', 'wayanad', 'kannur', 'kasargod',
            'kasaragod'
        ]
        for district in districts:
            if district in query_lower:
                return district.title()
        return None
    
    def _detect_category(self, query_lower: str) -> Optional[str]:
        categories = {
            'beach': 'Beach',
            'beaches': 'Beach',
            'hill': 'Hill Station',
            'hills': 'Hill Station',
            'hill station': 'Hill Station',
            'hill stations': 'Hill Station',
            'mountain': 'Hill Station',
            'mountains': 'Hill Station',
            'waterfall': 'Waterfall',
            'waterfalls': 'Waterfall',
            'falls': 'Waterfall',
            'backwater': 'Backwater',
            'backwaters': 'Backwater',
            'lake': 'Backwater',
            'lakes': 'Backwater',
            'wildlife': 'Wildlife',
            'sanctuary': 'Wildlife',
            'sanctuaries': 'Wildlife',
            'temple': 'Temple',
            'temples': 'Temple',
            'heritage': 'Heritage',
            'fort': 'Heritage',
            'forts': 'Heritage',
            'palace': 'Heritage',
            'adventure': 'Adventure',
            'nature': 'Nature',
            'park': 'Park',
            'parks': 'Park',
            'garden': 'Park',
            'gardens': 'Park',
            'museum': 'Museum',
            'museums': 'Museum',
            'resort': 'Resort',
            'resorts': 'Resort',
            'spa': 'Wellness',
            'ayurveda': 'Wellness',
            'spiritual': 'Spiritual',
            'sacred': 'Spiritual',
            'church': 'Spiritual',
            'mosque': 'Spiritual',
            'pilgrimage': 'Spiritual',
        }
        
        for key, value in categories.items():
            if key in query_lower:
                return value
        return None
    
    def _safe_truncate(self, text: str, max_length: int) -> str:
        if not text:
            return ''
        if len(text) <= max_length:
            return text
        truncate_at = text[:max_length].rfind(' ')
        if truncate_at > 0:
            return text[:truncate_at] + '...'
        return text[:max_length - 3] + '...'
    
    def _clean_name(self, name: str) -> str:
        """Clean and fix common data quality issues in names"""
        if not name:
            return ''
        
        # Fix common truncations
        fixes = {
            'Queen': "Queen's Walkway",
            'Vatika Children': "Vatika Children's Park",
            'Overbury': "Overbury's Folly",
            'Jatayu Earth': "Jatayu Earth's Center",
            'kadalpalam': "Kadalpalam Beach",
            'Changkampuzha': "Changampuzha Park",
            'Sadhoo Merry': "Sadhoo Merry Kingdom",
            'VLand': "VLand Water Theme Park",
            'Wonderla': "Wonderla Amusement Park",
            'Silver Storm': "Silver Storm Water Theme Park",
            'Payyambalam Beach Children': "Payyambalam Beach Children's Park",
        }
        
        for key, value in fixes.items():
            if key in name:
                return value
        
        return name
    
    # ============================================
    # SEARCH HANDLER
    # ============================================
    
    def _handle_search(self, query, destinations, session_id, history):
        try:
            results = self._search_data(query, destinations, top_k=30)
            return self._format_search_response(results, session_id, history, query)
            
        except Exception as e:
            print(f"❌ Search error: {e}")
            return Response({
                'success': False,
                'mode': 'search',
                'error': str(e),
                'message': 'Failed to perform search.'
            }, status=400)
    
    def _format_search_response(self, results, session_id, history, query):
        unique = []
        seen = set()
        for r in results:
            name = r.get('name', '').lower()
            if name and name not in seen:
                seen.add(name)
                # Clean the name before displaying
                r['name'] = self._clean_name(r.get('name', ''))
                unique.append(r)
        
        conversation_memory[session_id] = history + [
            {'role': 'user', 'content': query},
            {'role': 'assistant', 'content': f"Search returned {len(unique)} results"}
        ]
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
                        'name': self._clean_name(r.get('name', '')),
                        'district': r.get('district'),
                        'description': self._safe_truncate(r.get('description', ''), 200),
                        'category': r.get('category'),
                        'rating': r.get('rating', 0),
                        'score': r.get('score', 0),
                    }
                    for r in unique[:20]
                ],
                'total_count': len(unique)
            }
        })
    
    # ============================================
    # PLAN HANDLER
    # ============================================
    
    def _handle_plan(self, query, destinations, session_id, history):
        try:
            results = self._search_data(query, destinations, top_k=50)
            
            if not results:
                return Response({
                    'success': True,
                    'mode': 'plan',
                    'session_id': session_id,
                    'result': {
                        'plan': self._build_comprehensive_plan(query),
                        'itinerary': []
                    }
                })
            
            itinerary = self._create_itinerary(query, results[:10])
            
            conversation_memory[session_id] = history + [
                {'role': 'user', 'content': query},
                {'role': 'assistant', 'content': f"Created itinerary with {len(itinerary)} stops"}
            ]
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
            print(f"❌ Plan error: {e}")
            return Response({
                'success': False,
                'mode': 'plan',
                'error': str(e),
                'message': 'Failed to create itinerary.'
            }, status=400)
    
    def _create_itinerary(self, query: str, results: List[Dict]) -> List[Dict]:
        query_lower = query.lower()
        
        day_match = re.search(r'(\d+)\s*(day|days?)', query_lower)
        num_days = min(int(day_match.group(1)), 7) if day_match else 3
        
        is_beach = 'beach' in query_lower
        is_hill = 'hill' in query_lower or 'mountain' in query_lower
        is_waterfall = 'waterfall' in query_lower or 'falls' in query_lower
        
        categorized = defaultdict(list)
        for r in results:
            cat = r.get('category', '').lower()
            if 'beach' in cat:
                categorized['beach'].append(r)
            elif 'hill' in cat or 'mountain' in cat:
                categorized['hill'].append(r)
            elif 'waterfall' in cat:
                categorized['waterfall'].append(r)
            else:
                categorized['general'].append(r)
        
        itinerary = []
        used = set()
        
        for day in range(1, num_days + 1):
            day_plan = {'day': day, 'destinations': []}
            
            if day == 1:
                if is_beach and categorized.get('beach'):
                    day_plan['title'] = f"Day {day} - Beach Day"
                    dests = categorized['beach'][:3]
                elif is_waterfall and categorized.get('waterfall'):
                    day_plan['title'] = f"Day {day} - Waterfall Adventure"
                    dests = categorized['waterfall'][:3]
                elif is_hill and categorized.get('hill'):
                    day_plan['title'] = f"Day {day} - Hill Station Adventure"
                    dests = categorized['hill'][:3]
                else:
                    day_plan['title'] = f"Day {day} - Explore Highlights"
                    dests = results[:3]
            else:
                day_plan['title'] = f"Day {day} - Local Experience"
                remaining = [r for r in results if r.get('name') not in used]
                dests = remaining[:3] if remaining else results[:3]
            
            for dest in dests:
                dest_name = dest.get('name')
                if dest_name and dest_name not in used:
                    day_plan['destinations'].append({
                        'name': self._clean_name(dest_name),
                        'district': dest.get('district', 'Unknown'),
                        'category': dest.get('category', 'General'),
                        'description': self._safe_truncate(dest.get('description', ''), 100)
                    })
                    used.add(dest_name)
            
            itinerary.append(day_plan)
        
        return itinerary
    
    def _build_itinerary_text(self, itinerary: List[Dict]) -> str:
        if not itinerary:
            return "Could not create an itinerary."
        
        text = "🗺️ **Your Kerala Itinerary**\n\n"
        
        for day in itinerary:
            day_num = day.get('day', 1)
            day_title = day.get('title', f'Day {day_num}')
            text += f"**{day_title}**\n"
            
            for dest in day.get('destinations', []):
                emoji = get_category_emoji(dest.get('category', ''))
                dest_name = dest.get('name', 'Unknown')
                dest_district = dest.get('district', 'Unknown')
                text += f"  {emoji} {dest_name} ({dest_district})\n"
            text += "\n"
        
        text += "💡 **Tips:**\n"
        text += "• Book accommodations in advance\n"
        text += "• Carry comfortable shoes and water\n"
        text += "• Check weather before traveling"
        
        return text
    
    def _build_comprehensive_plan(self, query: str) -> str:
        query_lower = query.lower()
        num_days = 3
        
        day_match = re.search(r'(\d+)\s*(day|days?)', query_lower)
        if day_match:
            num_days = min(int(day_match.group(1)), 7)
        
        return f"""🗺️ **Kerala Trip Plan**\n\n
Based on your query: "{query}"

**📅 {num_days}-Day Recommended Itinerary:**

**Day 1:**
• Morning: Arrival and check-in
• Afternoon: Explore local attractions
• Evening: Sunset viewing and local dinner

**Day 2:**
• Morning: Visit key attractions
• Afternoon: Local experiences and cuisine
• Evening: Relax and enjoy

**Day 3:**
• Morning: Explore more attractions
• Afternoon: Shopping and local experiences
• Evening: Departure

💡 **Tips:**
• Book accommodations in advance
• Check local transport options
• Download offline maps
• Carry water and comfortable shoes"""
    
    # ============================================
    # ANSWER HANDLER - FIXED ORDER
    # ============================================
    
    def _handle_answer(self, query, destinations, session_id, history):
        try:
            query_lower = query.lower().strip()
            
            print(f"📝 Answer mode: '{query}'")
            print(f"📊 Destinations available: {len(destinations)}")
            
            # ============================================
            # 1. FIRST: Check for category queries
            # (This runs BEFORE greetings)
            # ============================================
            
            # Check for specific categories
            category_handlers = {
                'hill station': self._build_hill_station_answer,
                'hill stations': self._build_hill_station_answer,
                'hill': self._build_hill_station_answer,
                'hills': self._build_hill_station_answer,
                'mountain': self._build_hill_station_answer,
                'mountains': self._build_hill_station_answer,
                'trekking': self._build_hill_station_answer,
                'beach': self._build_beach_answer,
                'beaches': self._build_beach_answer,
                'waterfall': self._build_waterfall_answer,
                'waterfalls': self._build_waterfall_answer,
                'falls': self._build_waterfall_answer,
                'backwater': self._build_backwater_answer,
                'backwaters': self._build_backwater_answer,
                'wildlife': self._build_wildlife_answer,
                'sanctuary': self._build_wildlife_answer,
                'sanctuaries': self._build_wildlife_answer,
                'temple': self._build_temple_answer,
                'temples': self._build_temple_answer,
                'heritage': self._build_heritage_answer,
                'fort': self._build_heritage_answer,
                'forts': self._build_heritage_answer,
                'palace': self._build_heritage_answer,
                'park': self._build_parks_answer,
                'parks': self._build_parks_answer,
                'garden': self._build_parks_answer,
                'gardens': self._build_parks_answer,
                'museum': self._build_museum_answer,
                'museums': self._build_museum_answer,
            }
            
            # Check if any category matches
            for category, handler in category_handlers.items():
                if category in query_lower:
                    return Response({
                        'success': True,
                        'mode': 'answer',
                        'session_id': session_id,
                        'result': {
                            'answer': handler(query, destinations),
                            'destinations': []
                        }
                    })
            
            # ============================================
            # 2. Check for "one best" queries (BEFORE district)
            # ============================================
            if any(phrase in query_lower for phrase in ['one best', 'top one', 'only one', 'single best', 'best one']):
                return Response({
                    'success': True,
                    'mode': 'answer',
                    'session_id': session_id,
                    'result': {
                        'answer': self._build_one_best_answer(query, destinations),
                        'destinations': []
                    }
                })
            
            # ============================================
            # 3. Check for district queries
            # ============================================
            district = self._detect_district(query_lower)
            if district and any(phrase in query_lower for phrase in ['best', 'place', 'places', 'top', 'list', 'parks', 'beaches', 'hill']):
                return Response({
                    'success': True,
                    'mode': 'answer',
                    'session_id': session_id,
                    'result': {
                        'answer': self._build_district_answer(district, destinations),
                        'destinations': []
                    }
                })
            
            # ============================================
            # 4. All districts
            # ============================================
            if any(phrase in query_lower for phrase in ['14 district', 'all district', '14 districts', 'all districts', 'all 14']):
                return Response({
                    'success': True,
                    'mode': 'answer',
                    'session_id': session_id,
                    'result': {
                        'answer': self._build_all_districts_answer(destinations),
                        'destinations': []
                    }
                })
            
            # ============================================
            # 5. Hidden gems
            # ============================================
            if any(phrase in query_lower for phrase in ['hidden', 'offbeat', 'unknown', 'lesser known', 'secret', 'untouched']):
                return Response({
                    'success': True,
                    'mode': 'answer',
                    'session_id': session_id,
                    'result': {
                        'answer': self._build_hidden_gems_answer(query, destinations),
                        'destinations': []
                    }
                })
            
            # ============================================
            # 6. Itinerary/Plan
            # ============================================
            if any(phrase in query_lower for phrase in ['itinerary', 'plan', 'trip', 'schedule', 'day trip']):
                return Response({
                    'success': True,
                    'mode': 'answer',
                    'session_id': session_id,
                    'result': {
                        'answer': self._build_itinerary_answer(query, destinations),
                        'destinations': []
                    }
                })
            
            # ============================================
            # 7. Budget
            # ============================================
            if any(phrase in query_lower for phrase in ['budget', 'under ₹', 'under rs', 'cheap', 'affordable', 'low cost']):
                return Response({
                    'success': True,
                    'mode': 'answer',
                    'session_id': session_id,
                    'result': {
                        'answer': self._build_budget_answer(query, destinations),
                        'destinations': []
                    }
                })
            
            # ============================================
            # 8. Family
            # ============================================
            if any(phrase in query_lower for phrase in ['family', 'kids', 'children', 'kid friendly', 'child friendly']):
                return Response({
                    'success': True,
                    'mode': 'answer',
                    'session_id': session_id,
                    'result': {
                        'answer': self._build_family_answer(query, destinations),
                        'destinations': []
                    }
                })
            
            # ============================================
            # 9. Monsoon
            # ============================================
            if any(phrase in query_lower for phrase in ['monsoon', 'rainy', 'rain', 'wet season']):
                return Response({
                    'success': True,
                    'mode': 'answer',
                    'session_id': session_id,
                    'result': {
                        'answer': self._build_monsoon_answer(query, destinations),
                        'destinations': []
                    }
                })
            
            # ============================================
            # 10. Without beach
            # ============================================
            if any(phrase in query_lower for phrase in ['without beach', 'no beach', 'not beach', 'excluding beach']):
                return Response({
                    'success': True,
                    'mode': 'answer',
                    'session_id': session_id,
                    'result': {
                        'answer': self._build_without_beach_answer(query, destinations),
                        'destinations': []
                    }
                })
            
            # ============================================
            # 11. Greetings (LAST - only if nothing else matches)
            # ============================================
            if any(word in query_lower for word in ['hi', 'hello', 'hey', 'good morning', 'good evening', 'good afternoon']):
                return Response({
                    'success': True,
                    'mode': 'answer',
                    'session_id': session_id,
                    'result': {
                        'answer': self._get_greeting_response(),
                        'destinations': []
                    }
                })
            
            # ============================================
            # 12. Help
            # ============================================
            if any(word in query_lower for word in ['help', 'what can you do', 'capabilities']):
                return Response({
                    'success': True,
                    'mode': 'answer',
                    'session_id': session_id,
                    'result': {
                        'answer': self._get_help_response(),
                        'destinations': []
                    }
                })
            
            # ============================================
            # 13. GENERAL SEARCH
            # ============================================
            
            results = self._search_data(query, destinations, top_k=30)
            
            if not results:
                return Response({
                    'success': True,
                    'mode': 'answer',
                    'session_id': session_id,
                    'result': {
                        'answer': self._build_no_results_answer(),
                        'destinations': []
                    }
                })
            
            unique = []
            seen = set()
            for r in results:
                name = r.get('name', '').lower()
                if name and name not in seen:
                    seen.add(name)
                    r['name'] = self._clean_name(r.get('name', ''))
                    unique.append(r)
            
            answer = self._build_general_answer(query, unique)
            max_results = self._get_max_results(query, len(unique))
            
            conversation_memory[session_id] = history + [
                {'role': 'user', 'content': query},
                {'role': 'assistant', 'content': answer[:500]}
            ]
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
                            'name': self._clean_name(r.get('name', '')),
                            'district': r.get('district'),
                            'description': self._safe_truncate(r.get('description', ''), 200),
                            'category': r.get('category'),
                            'rating': r.get('rating', 0),
                            'score': r.get('score', 0),
                        }
                        for r in unique[:max_results]
                    ],
                    'total_count': len(unique),
                    'displayed_count': max_results
                }
            })
            
        except Exception as e:
            print(f"❌ Answer failed: {e}")
            import traceback
            traceback.print_exc()
            return Response({
                'success': False,
                'mode': 'answer',
                'error': str(e),
                'message': 'Failed to generate answer.'
            }, status=400)
    
    # ============================================
    # ANSWER BUILDERS (WITH DATABASE DATA)
    # ============================================
    
    def _get_greeting_response(self) -> str:
        return """👋 **Hello! Welcome to DiscoverEase Kerala Travel Assistant!**

I can help you with:
• 🗺️ **Destinations** - Best places in Kerala
• 🏖️ **Beaches** - Coastal getaways
• ⛰️ **Hill Stations** - Mountain retreats
• 💧 **Waterfalls** - Cascading beauty
• 🚣 **Backwaters** - Houseboat experiences
• 🐘 **Wildlife** - Sanctuaries and safaris
• 🛕 **Temples** - Sacred sites
• 💰 **Budget** - Travel cost planning
• 📅 **Itineraries** - Day-by-day plans
• 👨‍👩‍👧‍👦 **Family** - Kid-friendly places

💡 **Try asking:**
• "14 districts best places list"
• "Best hill stations for trekking"
• "One best hill station"
• "Budget travel guide for Munnar"
• "3-day itinerary for Varkala"
• "Family-friendly places in Kochi"
• "Hidden gems in Wayanad"
• "Monsoon waterfalls itinerary"
• "Backwater escape in Alleppey"
• "Best places in Kannur district"""
    
    def _get_help_response(self) -> str:
        return self._get_greeting_response()
    
    def _build_all_districts_answer(self, destinations: List[Dict]) -> str:
        # Group by district
        district_map = defaultdict(list)
        for dest in destinations:
            district = dest.get('district', 'Unknown')
            if district != 'Unknown':
                district_map[district].append(dest)
        
        answer = "🗺️ **Best places across all districts:**\n\n"
        
        for district, places in sorted(district_map.items()):
            sorted_places = sorted(places, key=lambda x: x.get('rating', 0), reverse=True)
            top_names = [self._clean_name(p['name']) for p in sorted_places[:3]]
            
            answer += f"**{district}**: "
            answer += ", ".join(top_names)
            if len(places) > 3:
                answer += f" and {len(places) - 3} more"
            answer += "\n"
        
        answer += "\n💡 **Tips:**\n"
        answer += "• Best time to visit: October to March\n"
        answer += "• Each district has unique attractions\n"
        answer += "• Plan 2-3 days per district"
        
        return answer
    
    def _build_district_answer(self, district: str, destinations: List[Dict]) -> str:
        print(f"📍 Building answer for district: {district}")
        
        district_dests = [d for d in destinations if d.get('district', '').lower() == district.lower()]
        
        if not district_dests:
            district_dests = [d for d in destinations if district.lower() in d.get('district', '').lower()]
        
        print(f"📊 Found {len(district_dests)} destinations in {district}")
        
        if not district_dests:
            return f"📍 No destinations found in {district} district.\n\n💡 Try asking for a specific category like 'beaches in {district}' or 'hill stations in {district}'."
        
        sorted_dests = sorted(district_dests, key=lambda x: x.get('rating', 0), reverse=True)
        
        answer = f"📍 **Top destinations in {district} district:**\n\n"
        answer += f"📊 Found {len(sorted_dests)} places\n\n"
        
        for i, place in enumerate(sorted_dests[:15], 1):
            emoji = get_category_emoji(place.get('category', ''))
            name = self._clean_name(place.get('name', 'Unknown'))
            answer += f"{i}. {emoji} **{name}**\n"
            if place.get('description'):
                answer += f"   {self._safe_truncate(place.get('description', ''), 150)}\n"
            if place.get('rating'):
                answer += f"   ⭐ {place['rating']}/5\n"
            answer += "\n"
        
        answer += "💡 **Tips:**\n"
        answer += "• 📲 Download maps for easier navigation\n"
        answer += "• 🍛 Try local Kerala cuisine\n"
        answer += "• 🌅 Visit early morning for the best experience"
        
        return answer
    
    def _build_beach_answer(self, query: str, destinations: List[Dict]) -> str:
        beaches = [d for d in destinations if 'beach' in d.get('category', '').lower() or 'beach' in d.get('name', '').lower()]
        
        if not beaches:
            return "🏖️ No beaches found in the database."
        
        query_lower = query.lower()
        is_single = any(phrase in query_lower for phrase in ['one', 'single', 'best', 'top'])
        max_results = 1 if is_single else min(10, len(beaches))
        beaches_sorted = sorted(beaches, key=lambda x: x.get('rating', 0), reverse=True)
        
        answer = "🏖️ **Top beaches in Kerala:**\n\n" if not is_single else "🏖️ **The best beach in Kerala is:**\n\n"
        
        for i, b in enumerate(beaches_sorted[:max_results], 1):
            name = self._clean_name(b.get('name', ''))
            answer += f"{i}. 🏖️ **{name}** ({b['district']})\n"
            answer += f"   {self._safe_truncate(b.get('description', ''), 120)}\n"
            if b.get('rating'):
                answer += f"   ⭐ {b['rating']}/5\n"
            answer += "\n"
        
        answer += "💡 **Tips:**\n"
        answer += "• Best time to visit: October to March\n"
        answer += "• Don't miss local seafood\n"
        answer += "• 📲 Download maps for navigation"
        
        return answer
    
    def _build_parks_answer(self, query: str, destinations: List[Dict]) -> str:
        parks = [d for d in destinations if 'park' in d.get('category', '').lower() or 'garden' in d.get('category', '').lower()]
        
        if not parks:
            return "🌳 No parks found in the database."
        
        query_lower = query.lower()
        is_single = any(phrase in query_lower for phrase in ['one', 'single', 'best', 'top'])
        max_results = 1 if is_single else min(10, len(parks))
        parks_sorted = sorted(parks, key=lambda x: x.get('rating', 0), reverse=True)
        
        answer = "🌳 **Top parks and gardens in Kerala:**\n\n" if not is_single else "🌳 **The best park in Kerala is:**\n\n"
        
        for i, p in enumerate(parks_sorted[:max_results], 1):
            name = self._clean_name(p.get('name', ''))
            answer += f"{i}. 🌳 **{name}** ({p['district']})\n"
            answer += f"   {self._safe_truncate(p.get('description', ''), 120)}\n"
            if p.get('rating'):
                answer += f"   ⭐ {p['rating']}/5\n"
            answer += "\n"
        
        answer += "💡 **Tips:**\n"
        answer += "• Best time to visit: Morning or evening\n"
        answer += "• Carry water and snacks\n"
        answer += "• 📲 Download maps for navigation"
        
        return answer
    
    def _build_museum_answer(self, query: str, destinations: List[Dict]) -> str:
        museums = [d for d in destinations if 'museum' in d.get('category', '').lower()]
        
        if not museums:
            return "🏛️ No museums found in the database."
        
        query_lower = query.lower()
        is_single = any(phrase in query_lower for phrase in ['one', 'single', 'best', 'top'])
        max_results = 1 if is_single else min(10, len(museums))
        museums_sorted = sorted(museums, key=lambda x: x.get('rating', 0), reverse=True)
        
        answer = "🏛️ **Top museums in Kerala:**\n\n" if not is_single else "🏛️ **The best museum in Kerala is:**\n\n"
        
        for i, m in enumerate(museums_sorted[:max_results], 1):
            name = self._clean_name(m.get('name', ''))
            answer += f"{i}. 🏛️ **{name}** ({m['district']})\n"
            answer += f"   {self._safe_truncate(m.get('description', ''), 120)}\n"
            if m.get('rating'):
                answer += f"   ⭐ {m['rating']}/5\n"
            answer += "\n"
        
        answer += "💡 **Tips:**\n"
        answer += "• 📅 Check museum timings before visiting\n"
        answer += "• 📸 Some museums restrict photography\n"
        answer += "• 📲 Download maps for navigation"
        
        return answer
    
    def _build_hill_station_answer(self, query: str, destinations: List[Dict]) -> str:
        hills = [d for d in destinations if 'hill' in d.get('category', '').lower() or 'mountain' in d.get('category', '').lower()]
        
        if not hills:
            return "⛰️ No hill stations found in the database."
        
        query_lower = query.lower()
        is_single = any(phrase in query_lower for phrase in ['one', 'single', 'best', 'top', 'one best'])
        is_trekking = 'trekking' in query_lower
        
        if is_trekking:
            trekking_hills = [h for h in hills if 'trek' in h.get('description', '').lower()]
            if trekking_hills:
                hills = trekking_hills
        
        max_results = 1 if is_single else min(10, len(hills))
        hills_sorted = sorted(hills, key=lambda x: x.get('rating', 0), reverse=True)
        
        answer = "⛰️ **Top hill stations in Kerala:**\n\n" if not is_single else "⛰️ **The best hill station in Kerala is:**\n\n"
        if is_trekking and not is_single:
            answer = "⛰️ **Best hill stations for trekking:**\n\n"
        if is_trekking and is_single:
            answer = "⛰️ **The best hill station for trekking is:**\n\n"
        
        for i, h in enumerate(hills_sorted[:max_results], 1):
            name = self._clean_name(h.get('name', ''))
            answer += f"{i}. ⛰️ **{name}** ({h['district']})\n"
            answer += f"   {self._safe_truncate(h.get('description', ''), 120)}\n"
            if h.get('rating'):
                answer += f"   ⭐ {h['rating']}/5\n"
            answer += "\n"
        
        answer += "💡 **Tips:**\n"
        answer += "• Best time to visit: September to May\n"
        if is_trekking:
            answer += "• 🥾 Start your trek early morning\n"
            answer += "• 💧 Carry sufficient water (2L per person)\n"
            answer += "• 👟 Wear comfortable trekking shoes\n"
        else:
            answer += "• 📲 Download maps for easier navigation\n"
            answer += "• 🍛 Don't miss local Kerala cuisine\n"
        
        return answer
    
    def _build_waterfall_answer(self, query: str, destinations: List[Dict]) -> str:
        waterfalls = [d for d in destinations if 'waterfall' in d.get('category', '').lower() or 'falls' in d.get('name', '').lower()]
        
        if not waterfalls:
            return "💧 No waterfalls found in the database."
        
        query_lower = query.lower()
        is_single = any(phrase in query_lower for phrase in ['one', 'single', 'best', 'top'])
        max_results = 1 if is_single else min(10, len(waterfalls))
        waterfalls_sorted = sorted(waterfalls, key=lambda x: x.get('rating', 0), reverse=True)
        
        answer = "💧 **Top waterfalls in Kerala:**\n\n" if not is_single else "💧 **The best waterfall in Kerala is:**\n\n"
        
        for i, w in enumerate(waterfalls_sorted[:max_results], 1):
            name = self._clean_name(w.get('name', ''))
            answer += f"{i}. 💧 **{name}** ({w['district']})\n"
            answer += f"   {self._safe_truncate(w.get('description', ''), 120)}\n"
            if w.get('rating'):
                answer += f"   ⭐ {w['rating']}/5\n"
            answer += "\n"
        
        answer += "💡 **Tips:**\n"
        answer += "• Best time to visit: Post-monsoon (September to February)\n"
        answer += "• 👟 Wear comfortable footwear\n"
        answer += "• 📲 Download maps for navigation"
        
        return answer
    
    def _build_backwater_answer(self, query: str, destinations: List[Dict]) -> str:
        backwaters = [d for d in destinations if 'backwater' in d.get('category', '').lower() or 'lake' in d.get('category', '').lower()]
        
        if not backwaters:
            return "🚣 No backwater destinations found in the database."
        
        query_lower = query.lower()
        is_single = any(phrase in query_lower for phrase in ['one', 'single', 'best', 'top'])
        max_results = 1 if is_single else min(10, len(backwaters))
        backwaters_sorted = sorted(backwaters, key=lambda x: x.get('rating', 0), reverse=True)
        
        answer = "🚣 **Top backwater destinations:**\n\n" if not is_single else "🚣 **The best backwater destination is:**\n\n"
        
        for i, b in enumerate(backwaters_sorted[:max_results], 1):
            name = self._clean_name(b.get('name', ''))
            answer += f"{i}. 🚣 **{name}** ({b['district']})\n"
            answer += f"   {self._safe_truncate(b.get('description', ''), 120)}\n"
            if b.get('rating'):
                answer += f"   ⭐ {b['rating']}/5\n"
            answer += "\n"
        
        answer += "💡 **Tips:**\n"
        answer += "• Best time to visit: October to March\n"
        answer += "• 🚣 Book houseboats in advance\n"
        answer += "• 📲 Download maps for navigation"
        
        return answer
    
    def _build_wildlife_answer(self, query: str, destinations: List[Dict]) -> str:
        wildlife = [d for d in destinations if 'wildlife' in d.get('category', '').lower() or 'sanctuary' in d.get('category', '').lower()]
        
        if not wildlife:
            return "🐘 No wildlife destinations found in the database."
        
        query_lower = query.lower()
        is_single = any(phrase in query_lower for phrase in ['one', 'single', 'best', 'top'])
        max_results = 1 if is_single else min(10, len(wildlife))
        wildlife_sorted = sorted(wildlife, key=lambda x: x.get('rating', 0), reverse=True)
        
        answer = "🐘 **Top wildlife destinations:**\n\n" if not is_single else "🐘 **The best wildlife destination is:**\n\n"
        
        for i, w in enumerate(wildlife_sorted[:max_results], 1):
            name = self._clean_name(w.get('name', ''))
            answer += f"{i}. 🐘 **{name}** ({w['district']})\n"
            answer += f"   {self._safe_truncate(w.get('description', ''), 120)}\n"
            if w.get('rating'):
                answer += f"   ⭐ {w['rating']}/5\n"
            answer += "\n"
        
        answer += "💡 **Tips:**\n"
        answer += "• Best time to visit: October to June\n"
        answer += "• 🐘 Book safaris in advance\n"
        answer += "• 📷 Bring binoculars and camera"
        
        return answer
    
    def _build_temple_answer(self, query: str, destinations: List[Dict]) -> str:
        temples = [d for d in destinations if 'temple' in d.get('category', '').lower() or 'sacred' in d.get('category', '').lower()]
        
        if not temples:
            return "🛕 No temples found in the database."
        
        query_lower = query.lower()
        is_single = any(phrase in query_lower for phrase in ['one', 'single', 'best', 'top'])
        max_results = 1 if is_single else min(10, len(temples))
        temples_sorted = sorted(temples, key=lambda x: x.get('rating', 0), reverse=True)
        
        answer = "🛕 **Top sacred places in Kerala:**\n\n" if not is_single else "🛕 **The best sacred place is:**\n\n"
        
        for i, t in enumerate(temples_sorted[:max_results], 1):
            name = self._clean_name(t.get('name', ''))
            answer += f"{i}. 🛕 **{name}** ({t['district']})\n"
            answer += f"   {self._safe_truncate(t.get('description', ''), 120)}\n"
            if t.get('rating'):
                answer += f"   ⭐ {t['rating']}/5\n"
            answer += "\n"
        
        answer += "💡 **Tips:**\n"
        answer += "• 👘 Dress modestly when visiting temples\n"
        answer += "• 📸 Ask permission before taking photos\n"
        answer += "• 📅 Check temple timings before visiting"
        
        return answer
    
    def _build_heritage_answer(self, query: str, destinations: List[Dict]) -> str:
        heritage = [d for d in destinations if 'heritage' in d.get('category', '').lower() or 'fort' in d.get('category', '').lower() or 'palace' in d.get('category', '').lower()]
        
        if not heritage:
            return "🏛️ No heritage sites found in the database."
        
        query_lower = query.lower()
        is_single = any(phrase in query_lower for phrase in ['one', 'single', 'best', 'top'])
        max_results = 1 if is_single else min(10, len(heritage))
        heritage_sorted = sorted(heritage, key=lambda x: x.get('rating', 0), reverse=True)
        
        answer = "🏛️ **Top heritage sites in Kerala:**\n\n" if not is_single else "🏛️ **The best heritage site is:**\n\n"
        
        for i, h in enumerate(heritage_sorted[:max_results], 1):
            name = self._clean_name(h.get('name', ''))
            answer += f"{i}. 🏛️ **{name}** ({h['district']})\n"
            answer += f"   {self._safe_truncate(h.get('description', ''), 120)}\n"
            if h.get('rating'):
                answer += f"   ⭐ {h['rating']}/5\n"
            answer += "\n"
        
        answer += "💡 **Tips:**\n"
        answer += "• 🗺️ Hire a guide for historical context\n"
        answer += "• 📸 Best time for photos: Morning and evening\n"
        answer += "• 📅 Check opening hours before visiting"
        
        return answer
    
    def _build_budget_answer(self, query: str, destinations: List[Dict]) -> str:
        return """💰 **Kerala Budget Travel Guide**\n\n

**🏨 Accommodation Budget:**
• Hostels: ₹500-₹1,500/night
• Budget Hotels: ₹1,500-₹3,000/night
• Homestays: ₹1,000-₹2,500/night

**🍛 Food Budget:**
• Local meals: ₹100-₹300/meal
• Street food: ₹50-₹150/snack
• Mid-range restaurant: ₹300-₹600/meal

**🚌 Transport Budget:**
• Bus: ₹50-₹200/trip
• Train: ₹100-₹500/trip
• Auto-rickshaw: ₹30-₹100/short trip

**💰 Daily Budget Estimate:**
• Backpacker: ₹1,500-₹2,500/day
• Budget traveler: ₹2,500-₹4,000/day
• Mid-range: ₹4,000-₹7,000/day

💡 **Money-Saving Tips:**
• Travel during off-season (June-September)
• Use public transport instead of taxis
• Eat at local restaurants
• Book accommodations online in advance
• Carry your own water bottle"""
    
    def _build_family_answer(self, query: str, destinations: List[Dict]) -> str:
        return """👨‍👩‍👧‍👦 **Family-Friendly Kerala Travel Guide**\n\n

**🏖️ Best Family Destinations:**
• **Alleppey** - Houseboat cruises, beach time
• **Kochi** - Fort walking, boating, marine drive
• **Munnar** - Tea gardens, nature walks
• **Varkala** - Cliff walks, beach time
• **Thrissur** - Temple visits, waterfall picnic

**👶 Kid-Friendly Activities:**
• Nature walks and exploration
• Bird watching
• Safe swimming spots
• Educational tours
• Fun outdoor activities

**🏠 Family Accommodation Tips:**
• Look for family rooms or suites
• Check for kid-friendly amenities
• Book places with play areas
• Consider homestays

💡 **Tips for Families:**
• Carry snacks and water
• Plan for rest breaks
• Keep a flexible schedule
• Pack appropriate clothing"""
    
    def _build_hidden_gems_answer(self, query: str, destinations: List[Dict]) -> str:
        query_lower = query.lower()
        district = self._detect_district(query_lower)
        
        hidden = [d for d in destinations if d.get('type') == 'hidden']
        
        if district:
            hidden = [d for d in hidden if d.get('district', '').lower() == district.lower()]
        
        if not hidden:
            return "💎 No hidden gems found in the database."
        
        hidden_sorted = sorted(hidden, key=lambda x: x.get('rating', 0), reverse=True)
        
        district_title = f" in {district}" if district else ""
        answer = f"💎 **Hidden Gems{district_title}**\n\n"
        answer += "Discover these offbeat destinations:\n\n"
        
        for i, gem in enumerate(hidden_sorted[:5], 1):
            emoji = get_category_emoji(gem.get('category', ''))
            name = self._clean_name(gem.get('name', ''))
            answer += f"{i}. {emoji} **{name}** ({gem['district']})\n"
            answer += f"   {self._safe_truncate(gem.get('description', ''), 100)}\n"
            if gem.get('rating'):
                answer += f"   ⭐ {gem['rating']}/5\n"
            answer += "\n"
        
        answer += "💡 **Tips for Hidden Gems:**\n"
        answer += "• Visit early morning for peaceful experience\n"
        answer += "• Check local access and transportation\n"
        answer += "• Carry snacks and water (limited facilities)\n"
        answer += "• Respect local culture and privacy"
        
        return answer
    
    def _build_one_best_answer(self, query: str, destinations: List[Dict]) -> str:
        query_lower = query.lower()
        category = self._detect_category(query_lower)
        district = self._detect_district(query_lower)
        
        best_places = []
        for dest in destinations:
            if district and dest.get('district', '').lower() != district.lower():
                continue
            if category and category.lower() not in dest.get('category', '').lower():
                continue
            best_places.append(dest)
        
        if not best_places:
            return "⭐ I couldn't find a top recommendation matching your query.\n\n💡 Try being more specific (e.g., 'one best hill station', 'best beach in Kerala')"
        
        best_place = sorted(best_places, key=lambda x: x.get('rating', 0), reverse=True)[0]
        
        emoji = get_category_emoji(best_place.get('category', ''))
        name = self._clean_name(best_place.get('name', ''))
        answer = f"⭐ **The top recommendation for you is:**\n\n"
        answer += f"1. {emoji} **{name}** ({best_place['district']})\n"
        answer += f"   {self._safe_truncate(best_place.get('description', ''), 150)}\n"
        if best_place.get('rating'):
            answer += f"   ⭐ {best_place['rating']}/5\n"
        answer += "\n"
        answer += "💡 **Tips:**\n"
        answer += "• 📲 Download maps for easier navigation\n"
        answer += "• 🍛 Don't miss local Kerala cuisine\n"
        answer += "• 🌅 Visit early morning for the best experience"
        
        return answer
    
    def _build_itinerary_answer(self, query: str, destinations: List[Dict]) -> str:
        query_lower = query.lower()
        
        day_match = re.search(r'(\d+)\s*(day|days?)', query_lower)
        num_days = min(int(day_match.group(1)), 5) if day_match else 3
        
        dest_names = ['Munnar', 'Varkala', 'Alleppey', 'Kochi', 'Wayanad', 'Thrissur', 'Kannur', 'Idukki']
        target_dest = None
        for dest in dest_names:
            if dest.lower() in query_lower:
                target_dest = dest
                break
        
        if target_dest:
            matching = [d for d in destinations if d.get('name', '').lower() == target_dest.lower()]
            if matching:
                place = matching[0]
                return self._build_specific_itinerary(target_dest, place, num_days)
        
        return self._build_generic_itinerary("Kerala", num_days)
    
    def _build_specific_itinerary(self, dest_name: str, place: Dict, num_days: int) -> str:
        emoji = get_category_emoji(place.get('category', ''))
        name = self._clean_name(place.get('name', ''))
        
        answer = f"🗺️ **{num_days}-Day Itinerary for {name}**\n\n"
        answer += f"{emoji} {place.get('category', '')} | ⭐ {place.get('rating', 0)}/5\n\n"
        answer += f"📝 {place.get('description', '')}\n\n"
        
        activities = [
            "🏔️ Explore the main attractions",
            "🌿 Nature walks and photography",
            "🍽️ Local cuisine tasting",
            "🌅 Sunset viewing",
            "🛍️ Visit local markets",
            "📸 Scenic viewpoints"
        ]
        
        for day in range(1, num_days + 1):
            answer += f"**Day {day}:**\n"
            if day == 1:
                answer += f"  • Morning: Arrive and check-in\n"
                answer += f"  • Afternoon: {activities[0]}\n"
                answer += f"  • Evening: {activities[3]}\n"
            elif day == num_days:
                answer += f"  • Morning: {activities[1]}\n"
                answer += f"  • Afternoon: {activities[4]}\n"
                answer += f"  • Evening: Departure\n"
            else:
                answer += f"  • Morning: {activities[day % len(activities)]}\n"
                answer += f"  • Afternoon: {activities[(day + 1) % len(activities)]}\n"
                answer += f"  • Evening: {activities[(day + 2) % len(activities)]}\n"
            answer += "\n"
        
        answer += "💡 **Tips:**\n"
        answer += "• Book accommodations in advance\n"
        answer += "• Start early to avoid crowds\n"
        answer += "• Carry water and snacks\n"
        answer += "• Check weather before traveling"
        
        return answer
    
    def _build_generic_itinerary(self, dest_name: str, num_days: int) -> str:
        answer = f"🗺️ **{num_days}-Day Itinerary for {dest_name}**\n\n"
        
        for day in range(1, num_days + 1):
            answer += f"**Day {day}:**\n"
            if day == 1:
                answer += "  • Morning: Arrival and check-in\n"
                answer += "  • Afternoon: Explore local attractions\n"
                answer += "  • Evening: Sunset viewing and local dinner\n"
            elif day == num_days:
                answer += "  • Morning: Visit key attractions\n"
                answer += "  • Afternoon: Shopping and local experiences\n"
                answer += "  • Evening: Departure\n"
            else:
                answer += "  • Morning: Full day exploration\n"
                answer += "  • Afternoon: Continue exploring\n"
                answer += "  • Evening: Relax and enjoy local cuisine\n"
            answer += "\n"
        
        answer += "💡 **Tips:**\n"
        answer += "• Book accommodations in advance\n"
        answer += "• Check local transport options\n"
        answer += "• Try local Kerala cuisine\n"
        answer += "• Download offline maps"
        
        return answer
    
    def _build_monsoon_answer(self, query: str, destinations: List[Dict]) -> str:
        if 'waterfall' in query.lower() or 'falls' in query.lower():
            waterfalls = [d for d in destinations if 'waterfall' in d.get('category', '').lower()]
            waterfall_names = [f"**{self._clean_name(w['name'])}** ({w['district']})" for w in waterfalls[:5]]
            
            answer = "🌧️ **Monsoon Waterfall Itinerary for Kerala**\n\n"
            answer += "Experience Kerala's waterfalls at their most powerful during the monsoon!\n\n"
            answer += "**🌊 Top Monsoon Waterfalls:**\n"
            for i, name in enumerate(waterfall_names, 1):
                answer += f"{i}. {name}\n"
            answer += "\n**📅 3-Day Monsoon Waterfall Itinerary:**\n\n"
            answer += "**Day 1: Thrissur Waterfalls**\n"
            answer += "  • 🌅 Morning: Athirappilly Waterfall\n"
            answer += "  • 🍽️ Afternoon: Lunch at local restaurant\n"
            answer += "  • 🌿 Evening: Visit Vazhachal Waterfall\n\n"
            answer += "**Day 2: Wayanad Waterfalls**\n"
            answer += "  • 🌄 Morning: Drive to Wayanad\n"
            answer += "  • 💧 Afternoon: Meenmutty Waterfall\n"
            answer += "  • 🌅 Evening: Soochipara Waterfall\n\n"
            answer += "**Day 3: Kozhikode & Departure**\n"
            answer += "  • 🌊 Morning: Thusharagiri Waterfall\n"
            answer += "  • 🛍️ Afternoon: Local shopping\n"
            answer += "  • 🚗 Evening: Departure\n\n"
            answer += "💡 **Monsoon Tips:**\n"
            answer += "• 🧥 Carry raincoat and waterproof bags\n"
            answer += "• 👟 Wear waterproof footwear\n"
            answer += "• 📸 Protect camera from rain\n"
            answer += "• 🚗 Check road conditions"
            return answer
        
        return """🌧️ **Monsoon Travel Guide for Kerala**\n\n
Kerala is beautiful during the monsoon season (June-September).

**🌊 Best Monsoon Destinations:**
• Athirappilly Waterfall - The Niagara of India
• Meenmutty Waterfall - 3-tiered stunning waterfall
• Thusharagiri Waterfall - Trekking trails
• Munnar - Misty hills and tea gardens

**✅ Monsoon Activities:**
• 💧 Waterfall visits (best during monsoon)
• 🌿 Nature walks in lush greenery
• 📸 Photography of misty landscapes
• 🍛 Enjoy hot local cuisine

**⚠️ Monsoon Tips:**
• 🧥 Carry raincoat and waterproof bags
• 👟 Wear waterproof footwear with good grip
• 📸 Protect camera equipment from rain
• 🚗 Check road conditions before traveling"""
    
    def _build_without_beach_answer(self, query: str, destinations: List[Dict]) -> str:
        non_beach = [d for d in destinations if 'beach' not in d.get('category', '').lower()]
        
        if not non_beach:
            return "🌿 No non-beach destinations found."
        
        sorted_dests = sorted(non_beach, key=lambda x: x.get('rating', 0), reverse=True)
        
        answer = "🌿 **Exploring Kerala beyond beaches:**\n\n"
        
        for i, p in enumerate(sorted_dests[:10], 1):
            emoji = get_category_emoji(p.get('category', ''))
            name = self._clean_name(p.get('name', ''))
            answer += f"{i}. {emoji} **{name}** ({p['district']})\n"
            answer += f"   {self._safe_truncate(p.get('description', ''), 100)}\n"
            if p.get('rating'):
                answer += f"   ⭐ {p['rating']}/5\n"
            answer += "\n"
        
        answer += "💡 **Tips:**\n"
        answer += "• 🌿 Kerala has diverse landscapes beyond beaches\n"
        answer += "• 🗺️ Explore hills, backwaters, and wildlife sanctuaries\n"
        answer += "• 🕊️ Visit early morning for peaceful experience"
        
        return answer
    
    def _build_general_answer(self, query: str, results: List[Dict]) -> str:
        if not results:
            return self._build_no_results_answer()
        
        max_results = min(10, len(results))
        
        answer = f"✨ **Found {len(results)} matching destinations:**\n\n"
        
        for i, r in enumerate(results[:max_results], 1):
            emoji = get_category_emoji(r.get('category', ''))
            name = self._clean_name(r.get('name', 'Unknown'))
            district = r.get('district', '')
            description = r.get('description', '')
            rating = r.get('rating', 0)
            
            answer += f"{i}. {emoji} **{name}**"
            if district:
                answer += f" ({district})"
            answer += "\n"
            
            if description:
                answer += f"   {self._safe_truncate(description, 120)}\n"
            
            if rating:
                stars = "⭐" * min(int(rating), 5)
                answer += f"   {stars} {rating}/5\n"
            answer += "\n"
        
        answer += "💡 **Tips:**\n"
        answer += "• 📲 Download maps for easier navigation\n"
        answer += "• 🍛 Don't miss local Kerala cuisine\n"
        answer += "• 🌅 Visit early morning for the best experience"
        
        return answer
    
    def _build_no_results_answer(self) -> str:
        return """🔍 I couldn't find any destinations matching your query.

💡 **Try these examples:**
• "14 districts best places list" - All districts
• "best places in Kannur" - Specific district
• "beaches in Kerala" - By type
• "hill stations in Idukki" - Category in district
• "waterfalls in Thrissur" - Category in district
• "backwaters in Alappuzha" - Category in district
• "hidden gems in Wayanad" - Offbeat destinations
• "one best hill station" - Top recommendation
• "budget travel guide" - Budget planning
• "3-day itinerary for Varkala" - Trip planning
• "family-friendly places in Kochi" - Family travel
• "monsoon waterfalls itinerary" - Seasonal travel"""
    
    def _get_max_results(self, query: str, total_available: int) -> int:
        query_lower = query.lower()
        
        if any(phrase in query_lower for phrase in ['one best', 'top one', 'only one']):
            return min(1, total_available)
        if query_lower.startswith('one ') or query_lower.startswith('single '):
            return min(1, total_available)
        
        num_match = re.search(r'(\d+)\s*places?', query_lower)
        if num_match:
            requested = int(num_match.group(1))
            return min(requested, 14, total_available)
        
        if '14' in query_lower or 'all' in query_lower:
            return min(14, total_available)
        if '10' in query_lower:
            return min(10, total_available)
        if '5' in query_lower:
            return min(5, total_available)
        
        return min(10, total_available)