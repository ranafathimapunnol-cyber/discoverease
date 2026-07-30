# ai/llm.py - ENHANCED QUERY UNDERSTANDING WITH COMPLETE FEATURES

import logging
import re
from typing import Dict, List, Optional, Any
from datetime import datetime

logger = logging.getLogger(__name__)


class LLMService:
    """Enhanced LLM Service with comprehensive query understanding and response generation"""
    
    def __init__(self) -> None:
        self.model: Any = None
        self.use_fallback: bool = True
        
        # Complete district list with variations
        self.districts = {
            'kannur': ['kannur', 'kannur district', 'kannur dt', 'kannur dist'],
            'kasargod': ['kasargod', 'kasaragod', 'kasargod district', 'kasaragod district'],
            'wayanad': ['wayanad', 'wayanad district', 'wayanad dt'],
            'idukki': ['idukki', 'idukki district', 'idukki dt'],
            'alappuzha': ['alappuzha', 'alleppey', 'alappuzha district', 'alleppey district'],
            'thrissur': ['thrissur', 'trichur', 'thrissur district', 'trichur district'],
            'ernakulam': ['ernakulam', 'kochi', 'ernakulam district', 'kochi district'],
            'kottayam': ['kottayam', 'kottayam district', 'kottayam dt'],
            'kollam': ['kollam', 'quilon', 'kollam district', 'quilon district'],
            'palakkad': ['palakkad', 'palghat', 'palakkad district', 'palghat district'],
            'malappuram': ['malappuram', 'malappuram district'],
            'kozhikode': ['kozhikode', 'calicut', 'kozhikode district', 'calicut district'],
            'pathanamthitta': ['pathanamthitta', 'pathanamthitta district'],
            'thiruvananthapuram': ['thiruvananthapuram', 'trivandrum', 'tvm', 'thiruvananthapuram district']
        }
        
        # Category keywords for type detection
        self.category_keywords = {
            'beach': ['beach', 'coast', 'sea', 'shore', 'coastal', 'sand', 'surf'],
            'mountain': ['mountain', 'hill', 'peak', 'valley', 'hill station', 'high range', 'mountain range'],
            'waterfall': ['waterfall', 'falls', 'cascade', 'water fall', 'rapids'],
            'backwater': ['backwater', 'houseboat', 'backwaters', 'lake', 'canal', 'lagoon', 'kayak'],
            'wildlife': ['wildlife', 'sanctuary', 'animal', 'safari', 'tiger', 'elephant', 'bird', 'national park', 'reserve'],
            'heritage': ['heritage', 'fort', 'palace', 'historical', 'museum', 'history', 'monument', 'architecture'],
            'temple': ['temple', 'church', 'mosque', 'sacred', 'spiritual', 'pilgrimage', 'worship'],
            'trekking': ['trek', 'hike', 'walk', 'trail', 'adventure', 'climb', 'trekking'],
            'park': ['park', 'garden', 'amusement', 'botanical', 'plantation', 'estate'],
            'water': ['water', 'river', 'stream', 'pond', 'reservoir', 'dam']
        }
        
        # Intent keywords
        self.intent_keywords = {
            'peaceful': ['peaceful', 'serene', 'quiet', 'calm', 'relax', 'tranquil', 'solitude', 'meditation'],
            'budget': ['budget', 'cheap', 'affordable', 'low cost', 'economical', 'low budget', 'frugal'],
            'luxury': ['luxury', 'premium', 'resort', '5-star', 'expensive', 'high-end', 'deluxe'],
            'family': ['family', 'kids', 'children', 'family friendly', 'child friendly', 'with kids'],
            'couple': ['couple', 'romantic', 'honeymoon', 'love', 'together', 'partner'],
            'adventure': ['adventure', 'thrill', 'extreme', 'exciting', 'daring', 'bold'],
            'hidden_gems': ['hidden', 'offbeat', 'unknown', 'lesser known', 'secret', 'untouched', 'off the beaten'],
            'food': ['food', 'cuisine', 'eat', 'restaurant', 'dining', 'cooking', 'taste', 'flavor'],
            'shopping': ['shopping', 'market', 'buy', 'shop', 'mall', 'boutique'],
            'nightlife': ['nightlife', 'party', 'club', 'bar', 'pub', 'evening', 'night'],
            'cultural': ['culture', 'cultural', 'tradition', 'festival', 'art', 'music', 'dance', 'craft'],
            'nature': ['nature', 'natural', 'scenic', 'view', 'panorama', 'landscape', 'beauty'],
            'off_season': ['off season', 'off-season', 'monsoon', 'rainy', 'less crowd', 'uncrowded']
        }
        
        logger.info("✅ Enhanced LLM Service initialized with comprehensive intent detection")
    
    def generate_response(self, query: str, context: str) -> str:
        """Generate response with enhanced understanding and context parsing"""
        try:
            # Parse context to extract destinations
            destinations = self._parse_context(context)
            
            if not destinations:
                return self._generate_no_results_response(query)
            
            # Analyze query intent
            intent = self._analyze_query(query)
            
            # Filter destinations based on intent
            filtered = self._filter_destinations(destinations, intent)
            
            # If no results after filtering, suggest alternatives
            if not filtered:
                filtered = destinations[:5]
                return self._generate_smart_response(query, filtered, intent, alternatives=True)
            
            # Generate intelligent response
            return self._generate_smart_response(query, filtered, intent)
            
        except Exception as e:
            logger.error(f"❌ Generate response error: {e}")
            import traceback
            traceback.print_exc()
            return f"🔍 I encountered an error processing your request. Please try again with a different query."
    
    def generate_itinerary(self, query: str, destinations: list) -> str:
        """Generate a detailed trip itinerary with day-by-day planning"""
        if not destinations:
            return "📅 I couldn't find destinations for your trip. Please try a different query."
        
        # Analyze query for planning context
        intent = self._analyze_query(query)
        district = intent.get('district', 'Kerala')
        
        # Extract number of days from query
        days_match = re.search(r'(\d+)\s*day', query.lower())
        num_days = int(days_match.group(1)) if days_match else 3
        num_days = min(max(num_days, 1), 7)  # Clamp between 1-7 days
        
        # Get destination names
        dest_names = [d.get('name', 'Unknown') for d in destinations[:3]]
        dest_text = ", ".join(dest_names)
        
        # Determine trip type
        trip_type = self._detect_trip_type(query)
        
        # Build comprehensive itinerary
        itinerary = f"📅 **{num_days}-Day Trip Plan for {district.title()}**\n"
        itinerary += f"Based on your request: \"{query}\"\n\n"
        itinerary += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
        
        # Day-wise planning
        for day in range(1, num_days + 1):
            itinerary += self._build_day_plan(day, num_days, dest_names, trip_type, district)
        
        itinerary += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
        
        # Essential tips
        itinerary += self._generate_travel_tips(district, trip_type)
        
        # Destinations considered
        itinerary += f"\n📍 **Destinations Considered:** {dest_text}\n"
        
        return itinerary
    
    def _parse_context(self, context: str) -> List[Dict]:
        """Parse context to extract destination objects with enhanced parsing"""
        if not context or not context.strip():
            return []
        
        destinations = []
        lines = context.strip().split('\n')
        
        current_dest = {}
        description_lines = []
        rating_extracted = False
        
        for line in lines:
            if not line.strip():
                continue
            
            stripped = line.strip()
            
            # Skip metadata lines
            if stripped.startswith('⭐') or stripped.startswith('Category:') or stripped.startswith('Score:'):
                continue
            
            # Check if this is a destination header
            is_header = re.match(r'^\d+\.', stripped) is not None
            
            if is_header:
                # Save previous destination
                if current_dest and current_dest.get('name'):
                    if description_lines:
                        current_dest['description'] = ' '.join(description_lines).strip()
                    destinations.append(current_dest)
                
                # Start new destination
                current_dest = {}
                description_lines = []
                rating_extracted = False
                
                # Parse name and district
                clean_line = re.sub(r'^\d+\.\s*', '', stripped)
                name_match = re.match(r'^([^(]+)(?:\s*\(([^)]+)\))?', clean_line)
                
                if name_match:
                    name = name_match.group(1).strip()
                    district = name_match.group(2).strip() if name_match.group(2) else ''
                    
                    # Try to detect district from name if not provided
                    if not district:
                        district = self._detect_district_from_name(name)
                    
                    current_dest['name'] = name
                    current_dest['district'] = district
                else:
                    current_dest['name'] = clean_line
                    current_dest['district'] = ''
                
                # Initialize default fields
                current_dest['type'] = self._detect_destination_type(clean_line)
                current_dest['category'] = current_dest['type']
                current_dest['tags'] = []
                current_dest['rating'] = 0.0
                current_dest['description'] = ''
                current_dest['best_time'] = ''
                current_dest['activities'] = []
                current_dest['hidden_gem'] = ''
            
            # Parse description lines (indented)
            elif current_dest and (line.startswith('   ') or line.startswith('\t')):
                desc = stripped
                if not desc.startswith('⭐') and not desc.startswith('•') and not desc.startswith('-'):
                    description_lines.append(desc)
            
            # Parse rating
            elif current_dest and '⭐' in stripped and not rating_extracted:
                rating_match = re.search(r'⭐\s*([\d.]+)', stripped)
                if rating_match:
                    try:
                        current_dest['rating'] = float(rating_match.group(1))
                        rating_extracted = True
                    except ValueError:
                        current_dest['rating'] = 0.0
            
            # Parse tags if present
            elif current_dest and ('#' in stripped or 'Tags:' in stripped or '🏷️' in stripped):
                tags_text = stripped.replace('🏷️', '').replace('Tags:', '').strip()
                tags = [tag.strip().strip('#') for tag in tags_text.split() if tag.strip()]
                current_dest['tags'] = tags[:5]  # Limit to 5 tags
        
        # Don't forget the last destination
        if current_dest and current_dest.get('name'):
            if description_lines:
                current_dest['description'] = ' '.join(description_lines).strip()
            destinations.append(current_dest)
        
        return destinations
    
    def _detect_district_from_name(self, name: str) -> str:
        """Detect district from destination name"""
        name_lower = name.lower()
        
        # Map of common destination to district
        dest_to_district = {
            'munnar': 'idukki',
            'alleppey': 'alappuzha',
            'kochi': 'ernakulam',
            'trivandrum': 'thiruvananthapuram',
            'calicut': 'kozhikode',
            'palghat': 'palakkad',
            'quilon': 'kollam',
            'trichur': 'thrissur',
            'athirappilly': 'thrissur',
            'varkala': 'thiruvananthapuram',
            'kumarakom': 'kottayam',
            'periyar': 'idukki',
            'wayanad': 'wayanad',
            'kannur': 'kannur',
            'bekal': 'kasargod',
            'ponmudi': 'thiruvananthapuram',
            'thenmala': 'kollam',
            'silent valley': 'palakkad',
            'vagamon': 'idukki',
            'thekkady': 'idukki',
            'kuttanad': 'alappuzha',
            'kadalundi': 'kozhikode',
            'thusharagiri': 'kozhikode',
            'paithalmala': 'kannur',
            'ranipuram': 'kasargod'
        }
        
        for dest, district in dest_to_district.items():
            if dest in name_lower:
                return district
        
        return ''
    
    def _detect_destination_type(self, name: str) -> str:
        """Detect destination type from name"""
        name_lower = name.lower()
        
        # Check each category
        for category, keywords in self.category_keywords.items():
            if any(keyword in name_lower for keyword in keywords):
                return category
        
        return 'general'
    
    def _analyze_query(self, query: str) -> dict:
        """Enhanced query analysis with more intent types"""
        query_lower = query.lower().strip()
        
        intent = {
            'type': 'general',
            'district': None,
            'exclude_beach': False,
            'wants_mountains': False,
            'wants_waterfall': False,
            'wants_backwater': False,
            'wants_beach': False,
            'wants_wildlife': False,
            'wants_trekking': False,
            'wants_peaceful': False,
            'wants_budget': False,
            'wants_luxury': False,
            'wants_family': False,
            'wants_couple': False,
            'wants_adventure': False,
            'wants_hidden_gems': False,
            'wants_heritage': False,
            'wants_temple': False,
            'wants_food': False,
            'wants_shopping': False,
            'wants_nightlife': False,
            'wants_cultural': False,
            'wants_nature': False,
            'wants_off_season': False,
            'wants_one': False,  # ✅ Only trigger for EXACT "one" queries
            'wants_all_districts': False,
            'wants_plan': False,
            'wants_itinerary': False,
            'wants_best': False,
            'wants_recommendation': False,
            'wants_comparison': False,
            'wants_nearby': False,
        }
        
        # ✅ Check for beach exclusion
        if any(phrase in query_lower for phrase in ['not beach', 'no beach', 'without beach', 'except beach', 'besides beach']):
            intent['exclude_beach'] = True
        
        # ✅ Check for "all 14 districts"
        if any(phrase in query_lower for phrase in ['14 district', 'all district', '14 districts', 'all districts']):
            intent['wants_all_districts'] = True
        
        # ✅ Check for ONE result - ONLY if "one" is the main intent
        one_phrases = ['one place', 'one best', 'top one', 'only one', 'single best', 'best one']
        if any(phrase in query_lower for phrase in one_phrases):
            intent['wants_one'] = True
        # ✅ Also check if query starts with "one" or "single"
        if query_lower.startswith('one ') or query_lower.startswith('single '):
            intent['wants_one'] = True
        # ✅ Check for "1 place" pattern
        if re.search(r'\b1\s*places?\b', query_lower):
            intent['wants_one'] = True
        
        # ✅ Check for BEST / RECOMMENDATION
        if any(word in query_lower for word in ['best', 'top', 'recommended', 'favorite', 'popular']):
            intent['wants_best'] = True
        
        # ✅ Check for PLAN / ITINERARY
        if any(word in query_lower for word in ['plan', 'itinerary', 'trip', 'schedule', 'itinerary', 'travel plan']):
            intent['wants_plan'] = True
        
        # ✅ Check for COMPARISON
        if any(word in query_lower for word in ['compare', 'vs', 'versus', 'better', 'difference']):
            intent['wants_comparison'] = True
        
        # ✅ Check for NEARBY
        if any(word in query_lower for word in ['near', 'nearby', 'around', 'close to']):
            intent['wants_nearby'] = True
        
        # ✅ Detect district (enhanced)
        for district, keywords in self.districts.items():
            for keyword in keywords:
                if keyword in query_lower:
                    intent['district'] = district
                    break
            if intent['district']:
                break
        
        # ✅ Detect types (enhanced)
        type_keywords = {
            'wants_mountains': ['mountain', 'hill', 'peak', 'valley', 'hill station', 'high range'],
            'wants_waterfall': ['waterfall', 'falls', 'cascade', 'water fall'],
            'wants_backwater': ['backwater', 'houseboat', 'backwaters', 'lake', 'canal'],
            'wants_beach': ['beach', 'coast', 'sea', 'shore', 'coastal'],
            'wants_wildlife': ['wildlife', 'sanctuary', 'animal', 'safari', 'tiger', 'elephant', 'bird', 'national park'],
            'wants_trekking': ['trek', 'hike', 'walk', 'trail', 'adventure', 'climb'],
            'wants_peaceful': ['peaceful', 'serene', 'quiet', 'calm', 'relax', 'tranquil', 'solitude'],
            'wants_budget': ['budget', 'cheap', 'affordable', 'low cost', 'economical', 'low budget'],
            'wants_luxury': ['luxury', 'premium', 'resort', '5-star', 'expensive'],
            'wants_family': ['family', 'kids', 'children', 'family friendly', 'child friendly'],
            'wants_hidden_gems': ['hidden', 'offbeat', 'unknown', 'lesser known', 'secret', 'untouched'],
            'wants_heritage': ['heritage', 'fort', 'palace', 'historical', 'museum', 'history'],
            'wants_temple': ['temple', 'church', 'mosque', 'sacred', 'spiritual', 'pilgrimage'],
            'wants_food': ['food', 'cuisine', 'eat', 'restaurant', 'dining', 'cooking'],
            'wants_shopping': ['shopping', 'market', 'buy', 'shop', 'mall'],
            'wants_nightlife': ['nightlife', 'party', 'club', 'bar', 'pub', 'evening']
        }
        
        for intent_key, keywords in type_keywords.items():
            if any(word in query_lower for word in keywords):
                intent[intent_key] = True
                # Set type for filtering
                if 'mountain' in intent_key:
                    intent['type'] = 'mountain'
                elif 'waterfall' in intent_key:
                    intent['type'] = 'waterfall'
                elif 'beach' in intent_key:
                    intent['type'] = 'beach'
                elif 'backwater' in intent_key:
                    intent['type'] = 'backwater'
                elif 'wildlife' in intent_key:
                    intent['type'] = 'wildlife'
        
        # Detect additional intents from intent_keywords
        for intent_key, keywords in self.intent_keywords.items():
            if any(word in query_lower for word in keywords):
                full_key = f'wants_{intent_key}'
                if full_key in intent:
                    intent[full_key] = True
        
        # If type not set but we have specific keywords
        if intent['wants_mountains'] and not intent.get('type'):
            intent['type'] = 'mountain'
        elif intent['wants_beach'] and not intent.get('type'):
            intent['type'] = 'beach'
        elif intent['wants_waterfall'] and not intent.get('type'):
            intent['type'] = 'waterfall'
        elif intent['wants_backwater'] and not intent.get('type'):
            intent['type'] = 'backwater'
        elif intent['wants_wildlife'] and not intent.get('type'):
            intent['type'] = 'wildlife'
        
        # Detect if query is asking for a single destination
        if 'tell me about' in query_lower or 'details about' in query_lower:
            intent['wants_one'] = True
        
        return intent
    
    def _filter_destinations(self, destinations: List[Dict], intent: Dict) -> List[Dict]:
        """Enhanced filtering with comprehensive criteria"""
        filtered = destinations.copy()
        
        # Exclude beaches
        if intent.get('exclude_beach'):
            filtered = [d for d in filtered if 'beach' not in d.get('name', '').lower()]
            filtered = [d for d in filtered if 'beach' not in d.get('type', '').lower()]
            logger.debug(f"🌊 After beach exclusion: {len(filtered)} destinations")
        
        # Filter by district
        if intent.get('district'):
            district = intent['district']
            exact_matches = [d for d in filtered if d.get('district', '').lower() == district]
            if exact_matches:
                filtered = exact_matches
            else:
                filtered = [d for d in filtered if district in d.get('district', '').lower()]
            logger.debug(f"📍 After district filter: {len(filtered)} destinations")
        
        # Filter by type
        dest_type = intent.get('type', 'general')
        if dest_type != 'general':
            type_filtered = []
            for d in filtered:
                d_type = d.get('type', '').lower()
                d_category = d.get('category', '').lower()
                d_name = d.get('name', '').lower()
                d_tags = d.get('tags', [])
                
                # Check if destination matches type
                if dest_type in d_type or dest_type in d_category:
                    type_filtered.append(d)
                elif any(dest_type in tag.lower() for tag in d_tags):
                    type_filtered.append(d)
                elif dest_type in d_name:
                    type_filtered.append(d)
            
            if type_filtered:
                filtered = type_filtered
                logger.debug(f"📂 After type filter: {len(filtered)} destinations")
        
        # Additional filters based on intent
        filters = []
        
        if intent.get('wants_peaceful'):
            filters.append(lambda d: 'peaceful' in d.get('tags', []) or 'peaceful' in d.get('description', '').lower())
        
        if intent.get('wants_hidden_gems'):
            filters.append(lambda d: d.get('hidden_gem') or 'hidden' in d.get('tags', []))
        
        if intent.get('wants_adventure'):
            filters.append(lambda d: any(tag in ['adventure', 'trekking', 'hiking', 'climbing'] for tag in d.get('tags', [])))
        
        if intent.get('wants_budget'):
            filters.append(lambda d: 'budget' in d.get('tags', []) or 'affordable' in d.get('description', '').lower())
        
        if intent.get('wants_luxury'):
            filters.append(lambda d: 'luxury' in d.get('tags', []) or 'resort' in d.get('name', '').lower())
        
        if intent.get('wants_family'):
            filters.append(lambda d: any(tag in ['family', 'kids', 'children'] for tag in d.get('tags', [])))
        
        if intent.get('wants_couple'):
            filters.append(lambda d: any(tag in ['romantic', 'honeymoon', 'couple'] for tag in d.get('tags', [])))
        
        # Apply all filters
        for filter_func in filters:
            result = [d for d in filtered if filter_func(d)]
            if result:
                filtered = result
                logger.debug(f"🔍 After intent filter: {len(filtered)} destinations")
        
        # Sort by rating (higher first)
        filtered.sort(key=lambda x: x.get('rating', 0), reverse=True)
        
        # Limit results
        if intent.get('wants_one'):
            return filtered[:1]
        elif intent.get('wants_all_districts'):
            return filtered[:14]  # One per district
        else:
            return filtered[:10]  # Default limit
    
    def _generate_smart_response(self, query: str, destinations: List[Dict], intent: Dict, alternatives: bool = False) -> str:
        """Generate smart, contextual response with rich details"""
        if not destinations:
            return self._generate_no_results_response(query)
        
        response_parts = []
        
        # Check if user wants ONE result
        is_single = intent.get('wants_one', False) or intent.get('wants_best', False)
        max_results = 1 if is_single else min(10, len(destinations))
        display_destinations = destinations[:max_results]
        
        # Detect if it's a plan/itinerary request
        is_plan = intent.get('wants_plan', False)
        if is_plan:
            return self.generate_itinerary(query, display_destinations)
        
        # Get smart opening
        opening = self._get_smart_opening(query, intent, display_destinations)
        response_parts.append(opening)
        response_parts.append("")
        
        # Destination cards with rich details
        for i, dest in enumerate(display_destinations, 1):
            card = self._build_enhanced_card(dest, i, intent)
            response_parts.append(card)
            response_parts.append("")
        
        # Add smart tips
        tips = self._get_smart_tips(intent, display_destinations, query)
        if tips:
            response_parts.append(tips)
            response_parts.append("")
        
        # Add follow-up suggestions
        if not is_single and len(display_destinations) > 1:
            follow_ups = self._get_follow_up_suggestions(intent, display_destinations)
            if follow_ups:
                response_parts.append(follow_ups)
                response_parts.append("")
        
        # Closing
        closing = self._get_smart_closing(query, display_destinations, intent)
        response_parts.append(closing)
        
        return "\n".join(response_parts)
    
    def _get_smart_opening(self, query: str, intent: dict, destinations: list) -> str:
        """Get smart opening based on query and intent with count display"""
        if not destinations:
            return "🔍 I couldn't find specific destinations for your query."
        
        query_lower = query.lower()
        is_single = intent and intent.get('wants_one', False)
        count = len(destinations)
        
        # Single result - show "best" or "top"
        if is_single:
            if intent.get('wants_mountains') or intent.get('wants_trekking'):
                return "⛰️ **The best hill station for your adventure is:**"
            elif intent.get('wants_beach'):
                return "🏖️ **The best beach for your getaway is:**"
            elif intent.get('wants_waterfall'):
                return "💧 **The best waterfall for your trip is:**"
            elif intent.get('wants_backwater'):
                return "🚣 **The best backwater destination is:**"
            elif intent.get('wants_wildlife'):
                return "🐘 **The best wildlife destination is:**"
            elif intent.get('wants_heritage'):
                return "🏛️ **The best heritage site is:**"
            elif intent.get('wants_temple'):
                return "🛕 **The best sacred place is:**"
            elif intent.get('wants_hidden_gems'):
                return "💎 **The best hidden gem is:**"
            elif intent.get('wants_peaceful'):
                return "🕊️ **The most peaceful destination is:**"
            elif intent.get('wants_family'):
                return "👨‍👩‍👧‍👦 **The best family-friendly destination is:**"
            elif intent.get('wants_couple'):
                return "💕 **The most romantic destination is:**"
            elif intent.get('wants_adventure'):
                return "🎢 **The best adventure destination is:**"
            elif intent.get('wants_budget'):
                return "💰 **The best budget-friendly destination is:**"
            elif intent.get('wants_luxury'):
                return "🌟 **The best luxury destination is:**"
            elif intent.get('district'):
                return f"⭐ **The top destination in {intent['district'].title()} district is:**"
            else:
                return "⭐ **The top recommendation for you is:**"
        
        # ✅ Multiple results - show count
        if intent.get('wants_mountains') or intent.get('wants_trekking'):
            return f"⛰️ **Here are the best {count} hill stations for trekking in Kerala:**"
        elif intent.get('wants_beach'):
            return f"🏖️ **Here are the best {count} beaches in Kerala:**"
        elif intent.get('wants_waterfall'):
            return f"💧 **Here are the most beautiful {count} waterfalls in Kerala:**"
        elif intent.get('wants_backwater'):
            return f"🚣 **Here are the most serene {count} backwater destinations in Kerala:**"
        elif intent.get('wants_wildlife'):
            return f"🐘 **Here are the best {count} wildlife destinations in Kerala:**"
        elif intent.get('wants_heritage'):
            return f"🏛️ **Here are the top {count} heritage sites in Kerala:**"
        elif intent.get('wants_temple'):
            return f"🛕 **Here are the most sacred {count} places in Kerala:**"
        elif intent.get('wants_hidden_gems'):
            return f"💎 **Discover these {count} hidden gems in Kerala:**"
        elif intent.get('wants_peaceful'):
            return f"🕊️ **Here are {count} peaceful destinations in Kerala:**"
        elif intent.get('wants_family'):
            return f"👨‍👩‍👧‍👦 **Here are {count} family-friendly destinations in Kerala:**"
        elif intent.get('wants_couple'):
            return f"💕 **Here are {count} romantic destinations in Kerala:**"
        elif intent.get('wants_adventure'):
            return f"🎢 **Here are {count} adventure destinations in Kerala:**"
        elif intent.get('wants_budget'):
            return f"💰 **Here are {count} budget-friendly destinations in Kerala:**"
        elif intent.get('wants_luxury'):
            return f"🌟 **Here are {count} luxury destinations in Kerala:**"
        elif intent.get('wants_cultural'):
            return f"🎭 **Here are {count} culturally rich destinations in Kerala:**"
        elif intent.get('wants_nature'):
            return f"🌿 **Here are {count} nature-rich destinations in Kerala:**"
        elif intent.get('wants_food'):
            return f"🍽️ **Here are {count} foodie destinations in Kerala:**"
        elif intent.get('wants_shopping'):
            return f"🛍️ **Here are {count} shopping destinations in Kerala:**"
        elif intent.get('wants_nightlife'):
            return f"🌙 **Here are {count} nightlife destinations in Kerala:**"
        elif intent.get('district'):
            return f"📍 **Top {count} destinations in {intent['district'].title()} district:**"
        elif intent.get('wants_all_districts') or '14 district' in query_lower or 'all district' in query_lower:
            return f"🗺️ **Best {count} places across all 14 districts of Kerala:**"
        elif intent.get('wants_nearby'):
            return f"📌 **Here are {count} nearby destinations:**"
        elif intent.get('wants_comparison'):
            return f"📊 **Comparing {count} destinations:**"
        else:
            return f"✨ **Here are {count} recommendations based on your interests:**"
    
    def _build_enhanced_card(self, dest: Dict, index: int, intent: Dict) -> str:
        """Build enhanced destination card with rich details"""
        name = dest.get('name', 'Unknown')
        district = dest.get('district', '')
        description = dest.get('description', '')
        rating = dest.get('rating', 0)
        tags = dest.get('tags', [])
        hidden_gem = dest.get('hidden_gem', '')
        best_time = dest.get('best_time', '')
        activities = dest.get('activities', [])
        dest_type = dest.get('type', '')
        
        emoji = self._get_enhanced_emoji(dest)
        
        parts = [f"{index}. {emoji} **{name}**"]
        if district:
            parts[0] += f" ({district.title()})"
        
        # Add type indicator
        if dest_type:
            parts[0] += f" [{dest_type.title()}]"
        
        # Add rating
        if rating and rating > 0:
            stars = "⭐" * min(int(rating), 5)
            parts.append(f"   {stars} {rating:.1f}/5.0")
        
        # Add description
        if description:
            if len(description) > 200:
                description = description[:197] + "..."
            parts.append(f"   📝 {description}")
        
        # Add tags
        if tags:
            tag_str = " · ".join(tags[:4])
            parts.append(f"   🏷️ {tag_str}")
        
        # Add hidden gem
        if hidden_gem:
            parts.append(f"   💎 {hidden_gem[:150]}...")
        
        # Add best time
        if best_time:
            parts.append(f"   📅 Best time: {best_time}")
        
        # Add activities
        if activities:
            activity_str = ", ".join(activities[:3])
            parts.append(f"   🎯 Activities: {activity_str}")
        
        return "\n".join(parts)
    
    def _get_smart_tips(self, intent: Dict, destinations: List[Dict], query: str) -> str:
        """Generate smart, contextual tips"""
        tips = ["💡 **Tips & Recommendations:**"]
        query_lower = query.lower()
        is_single = intent.get('wants_one', False)
        
        # Specific tips based on intent
        if is_single:
            tips.append("• 📌 This is the top recommendation based on your query")
        
        if intent.get('wants_trekking') or intent.get('wants_mountains'):
            tips.append("• 🥾 Start your trek early morning to avoid afternoon heat")
            tips.append("• 💧 Carry sufficient water (at least 2 liters per person)")
            tips.append("• 👟 Wear comfortable trekking shoes with good grip")
            tips.append("• 🗺️ Check weather conditions before starting")
        
        if intent.get('wants_beach'):
            tips.append("• 🌅 Best time for beach visits: October to March")
            tips.append("• 🍽️ Don't miss local seafood - it's fresh and delicious")
            tips.append("• 🏊 Check tide timings before swimming")
        
        if intent.get('wants_waterfall'):
            tips.append("• 💧 Best time to visit waterfalls: Post-monsoon (September to February)")
            tips.append("• 👟 Wear comfortable footwear and carry water")
            tips.append("• 📸 Visit early morning for best photography light")
        
        if intent.get('wants_backwater'):
            tips.append("• 🚣 Book houseboats in advance during peak season")
            tips.append("• 🌿 Best time: October to March")
            tips.append("• 🦅 Look for bird watching opportunities")
        
        if intent.get('wants_wildlife'):
            tips.append("• 🐘 Book safaris in advance")
            tips.append("• 📷 Bring binoculars and camera with zoom lens")
            tips.append("• 🌅 Best wildlife viewing times: Early morning and evening")
        
        if intent.get('wants_peaceful'):
            tips.append("• 🕊️ Visit on weekdays for the most peaceful experience")
            tips.append("• 🌅 Early morning (6-8 AM) is the quietest time")
        
        if intent.get('wants_budget'):
            tips.append("• 💰 Consider staying in homestays for budget-friendly accommodation")
            tips.append("• 🍛 Local food is affordable and delicious")
            tips.append("• 🚌 Use public transport to save money")
        
        if intent.get('wants_luxury'):
            tips.append("• 🌟 Book luxury resorts with premium amenities")
            tips.append("• 🍷 Look for fine dining experiences")
            tips.append("• 💆 Enjoy spa and wellness treatments")
        
        if intent.get('wants_family'):
            tips.append("• 👨‍👩‍👧‍👦 These destinations have activities suitable for all ages")
            tips.append("• 🏠 Look for family-friendly accommodations with kids' facilities")
            tips.append("• 🎮 Check for kids' activities and entertainment")
        
        if intent.get('wants_couple'):
            tips.append("• 💕 Perfect for romantic getaways and honeymoon")
            tips.append("• 🌅 Look for sunset viewing spots")
            tips.append("• 🍽️ Book candlelight dinners for special moments")
        
        if intent.get('wants_hidden_gems'):
            tips.append("• 💎 These spots are less crowded - perfect for unique experiences")
            tips.append("• 📱 Download offline maps as some areas have limited connectivity")
            tips.append("• 🤫 Respect local culture and privacy")
        
        if intent.get('district'):
            district = intent['district'].title()
            tips.append(f"• 🚗 Check local transportation options in {district}")
            tips.append(f"• 🏨 Look for homestays in {district} for authentic local experience")
        
        # General tips
        tips.append("• 📲 Download maps for easier navigation")
        tips.append("• 🍛 Don't miss local Kerala cuisine - Appam, Fish Curry, Puttu")
        tips.append("• 💰 Carry some cash as smaller shops may not accept cards")
        tips.append("• 🧴 Carry sunscreen and insect repellent")
        
        return "\n".join(tips)
    
    def _get_follow_up_suggestions(self, intent: Dict, destinations: List[Dict]) -> str:
        """Get follow-up suggestions based on intent and results"""
        suggestions = ["💬 **Try asking:**"]
        district = intent.get('district')
        
        # District-based suggestions
        if district:
            district_title = district.title()
            suggestions.append(f"   • \"best time to visit {district_title}\"")
            suggestions.append(f"   • \"hidden gems in {district_title}\"")
            suggestions.append(f"   • \"budget travel in {district_title}\"")
            suggestions.append(f"   • \"hotels in {district_title}\"")
        
        # Type-based suggestions
        if intent.get('wants_mountains') or intent.get('wants_trekking'):
            suggestions.append("   • \"one best hill station for trekking\"")
            suggestions.append("   • \"trekking difficulty levels\"")
            suggestions.append("   • \"best time for trekking in Kerala\"")
        elif intent.get('wants_beach'):
            suggestions.append("   • \"best beach for swimming\"")
            suggestions.append("   • \"peaceful beaches in Kerala\"")
            suggestions.append("   • \"beach with water sports\"")
        elif intent.get('wants_waterfall'):
            suggestions.append("   • \"most beautiful waterfall in Kerala\"")
            suggestions.append("   • \"waterfall trekking routes\"")
            suggestions.append("   • \"swimming spots in waterfalls\"")
        elif intent.get('wants_backwater'):
            suggestions.append("   • \"houseboat booking tips\"")
            suggestions.append("   • \"best time for backwater cruise\"")
            suggestions.append("   • \"backwater bird watching\"")
        elif intent.get('wants_wildlife'):
            suggestions.append("   • \"best time for wildlife safari\"")
            suggestions.append("   • \"animal species in Kerala\"")
            suggestions.append("   • \"wildlife photography tips\"")
        else:
            suggestions.append("   • \"one best place in Kerala\" - for top recommendation")
            suggestions.append("   • \"14 districts best places\" - for all districts")
            suggestions.append("   • \"hidden gems in Kerala\" - for offbeat places")
        
        # Add suggestion to ask about specific destination
        if destinations:
            first_dest = destinations[0].get('name', '')
            if first_dest:
                suggestions.append(f"   • \"tell me more about {first_dest}\"")
        
        return "\n".join(suggestions)
    
    def _get_smart_closing(self, query: str, destinations: List[Dict], intent: Dict) -> str:
        """Get smart closing message"""
        if not destinations:
            return "💬 Try rephrasing your query or asking about specific districts!"
        
        is_single = intent.get('wants_one', False)
        
        if is_single:
            return "💬 Would you like more details about this place? Just ask! 🌟"
        else:
            return "💬 Would you like more details about any of these places? Feel free to ask follow-up questions! 🌟"
    
    def _build_day_plan(self, day: int, total_days: int, dest_names: List[str], trip_type: str, district: str) -> str:
        """Build individual day plan for itinerary"""
        plan = f"**Day {day}: **"
        
        # Determine day type based on position
        if day == 1:
            plan += "Arrival & Exploration\n"
            plan += f"  🌅 Morning: Arrive and visit {dest_names[0] if len(dest_names) > 0 else 'the area'}\n"
            plan += "  🏛️ Afternoon: Explore local attractions and scenic spots\n"
            plan += "  🍽️ Evening: Enjoy authentic Kerala cuisine at nearby restaurants\n"
        elif day == total_days:
            plan += "Final Day & Departure\n"
            plan += f"  🛍️ Morning: Explore {dest_names[-1] if len(dest_names) > 1 else 'local markets'}\n"
            plan += "  📸 Afternoon: Last-minute sightseeing and photography\n"
            plan += "  🚗 Evening: Departure with wonderful memories\n"
        else:
            plan += "Adventure & Culture\n"
            plan += f"  🌄 Morning: Visit {dest_names[day-1] if len(dest_names) > day-1 else 'another attraction'}\n"
            plan += "  🗺️ Afternoon: Discover hidden gems and local culture\n"
            plan += "  🌅 Evening: Watch stunning sunset views and relaxation\n"
        
        # Add activity suggestion based on trip type
        if trip_type == 'adventure':
            plan += "  🎯 Tip: Try adventure activities like trekking, rafting, or zip-lining\n"
        elif trip_type == 'beach':
            plan += "  🏊 Tip: Enjoy water sports, swimming, and beach activities\n"
        elif trip_type == 'nature':
            plan += "  🌿 Tip: Explore nature trails, bird watching, and photography\n"
        elif trip_type == 'cultural':
            plan += "  🎭 Tip: Visit temples, museums, and cultural centers\n"
        
        plan += "\n"
        return plan
    
    def _generate_travel_tips(self, district: str, trip_type: str) -> str:
        """Generate comprehensive travel tips"""
        tips = "💡 **Essential Travel Tips:**\n"
        tips += "• 📅 Best time to visit: October to March is ideal for most destinations\n"
        tips += "• 🏨 Book accommodations 2-3 weeks in advance during peak season\n"
        tips += "• 🍛 Try local Kerala cuisine: Appam, Fish Curry, Puttu, Dosa, and more\n"
        tips += "• 🚗 Renting a vehicle is convenient for exploring, but local transport is also available\n"
        tips += "• 📲 Download offline maps for areas with limited connectivity\n"
        tips += "• 💰 Carry some cash as smaller shops may not accept cards\n"
        tips += "• 🧴 Pack essentials: Sunscreen, insect repellent, comfortable shoes\n"
        tips += "• 📞 Save emergency contact numbers: Police 100, Ambulance 102, Fire 101\n"
        
        if district and district != 'Kerala':
            tips += f"• 🏥 Locate the nearest hospitals in {district.title()} district\n"
            tips += f"• 🚌 Check local transport schedules in {district.title()}\n"
        
        if trip_type == 'adventure':
            tips += "• 🥾 Wear appropriate gear for adventure activities\n"
            tips += "• 💧 Stay hydrated - carry water bottles\n"
        elif trip_type == 'beach':
            tips += "• 🌊 Follow beach safety guidelines and check tide timings\n"
            tips += "• 🏊 Swim only in designated safe areas\n"
        elif trip_type == 'nature':
            tips += "• 🌿 Respect nature - don't litter or disturb wildlife\n"
            tips += "• 📷 Carry camera/binoculars for wildlife spotting\n"
        elif trip_type == 'cultural':
            tips += "• 👘 Dress modestly when visiting temples and sacred places\n"
            tips += "• 📸 Ask permission before taking photos of locals\n"
        
        return tips
    
    def _detect_trip_type(self, query: str) -> str:
        """Detect trip type from query"""
        query_lower = query.lower()
        
        if any(word in query_lower for word in ['adventure', 'trek', 'hike', 'climb', 'rafting']):
            return 'adventure'
        elif any(word in query_lower for word in ['beach', 'coast', 'sea', 'shore']):
            return 'beach'
        elif any(word in query_lower for word in ['nature', 'scenic', 'view', 'landscape']):
            return 'nature'
        elif any(word in query_lower for word in ['culture', 'heritage', 'temple', 'museum', 'art']):
            return 'cultural'
        else:
            return 'general'
    
    def _get_enhanced_emoji(self, dest: Dict) -> str:
        """Get enhanced emoji based on destination characteristics"""
        name = dest.get('name', '').lower()
        category = dest.get('category', '').lower()
        dest_type = dest.get('type', '').lower()
        tags = dest.get('tags', [])
        
        # Check by name
        name_emoji_map = {
            'beach': '🏖️',
            'shore': '🏖️',
            'coast': '🏖️',
            'hill': '⛰️',
            'mountain': '⛰️',
            'peak': '⛰️',
            'waterfall': '💧',
            'falls': '💧',
            'backwater': '🚣',
            'houseboat': '🚣',
            'lake': '🚣',
            'sanctuary': '🐘',
            'wildlife': '🐘',
            'temple': '🛕',
            'church': '⛪',
            'mosque': '🕌',
            'fort': '🏰',
            'palace': '🏛️',
            'museum': '🏛️',
            'park': '🌿',
            'garden': '🌿',
            'plantation': '🌿',
            'ranch': '🌿',
            'island': '🏝️'
        }
        
        for keyword, emoji in name_emoji_map.items():
            if keyword in name:
                return emoji
        
        # Check by category/type
        type_emoji_map = {
            'beach': '🏖️',
            'mountain': '⛰️',
            'waterfall': '💧',
            'backwater': '🚣',
            'wildlife': '🐘',
            'temple': '🛕',
            'heritage': '🏛️',
            'park': '🌿',
            'trekking': '⛰️'
        }
        
        if dest_type in type_emoji_map:
            return type_emoji_map[dest_type]
        
        if category in type_emoji_map:
            return type_emoji_map[category]
        
        # Check by tags
        for tag in tags:
            tag_lower = tag.lower()
            for keyword, emoji in name_emoji_map.items():
                if keyword in tag_lower:
                    return emoji
        
        # Default
        return '📍'
    
    def _generate_no_results_response(self, query: str) -> str:
        """Generate helpful response when no destinations found"""
        query_lower = query.lower()
        
        # Try to extract any keywords
        detected_types = []
        for category, keywords in self.category_keywords.items():
            if any(keyword in query_lower for keyword in keywords):
                detected_types.append(category)
        
        # Try to detect district
        detected_district = None
        for district, keywords in self.districts.items():
            if any(keyword in query_lower for keyword in keywords):
                detected_district = district
                break
        
        if detected_types:
            type_str = " or ".join(detected_types)
            response = f"🔍 I couldn't find specific destinations for '{query}'.\n\n"
            response += "💡 **Try these suggestions:**\n"
            
            if detected_district:
                response += f"• Ask about '{detected_types[0]}' in {detected_district.title()} district\n"
            else:
                response += f"• Ask about '{detected_types[0]}' in a specific district (Kannur, Wayanad, etc.)\n"
                response += f"• Ask about 'best {detected_types[0]} in Kerala'\n"
            
            if len(detected_types) > 1:
                response += f"• Try combining types: '{detected_types[0]} and {detected_types[1]}'\n"
            
            response += f"• Ask about activities related to {detected_types[0]}\n"
        else:
            response = f"🔍 I couldn't find specific destinations for '{query}'.\n\n"
            response += "💡 **Try being more specific:**\n"
            response += "• Mention a district (Kannur, Wayanad, Idukki, etc.)\n"
            response += "• Mention a type (beach, hill station, waterfall, backwater, wildlife)\n"
            response += "• Ask about activities (trekking, boating, photography)\n"
            response += "• Mention a season (monsoon, winter, summer)\n"
        
        response += "\n💬 **Example queries:**\n"
        response += "• \"best beaches in Kannur\"\n"
        response += "• \"hill stations for trekking in Kerala\"\n"
        response += "• \"waterfalls near Wayanad\"\n"
        response += "• \"peaceful places in Idukki\"\n"
        
        return response


# Singleton instance
llm_service = LLMService()