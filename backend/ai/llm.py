# ai/llm.py - COMPLETE FIXED VERSION

import logging
import re

logger = logging.getLogger(__name__)


class LLMService:
    """Local LLM with improved parsing"""
    
    def __init__(self):
        self.model = None
        self.use_fallback = True
        logger.info("✅ LLM Service initialized")
    
    def generate_response(self, query: str, context: str) -> str:
        """Generate response with proper parsing"""
        try:
            destinations = self._parse_context(context)
            
            if not destinations:
                return f"🔍 I couldn't find specific destinations for your query: '{query}'. Please try a more specific question."
            
            intent = self._analyze_query(query)
            filtered = self._filter_destinations(destinations, intent)
            
            if not filtered:
                filtered = destinations[:5]
            
            return self._generate_intelligent_response(query, filtered, intent)
        except Exception as e:
            logger.error(f"❌ Generate response error: {e}")
            import traceback
            traceback.print_exc()
            return f"🔍 I encountered an error processing your request. Please try again."
    
    def generate_itinerary(self, query: str, destinations: list) -> str:
        """Generate a trip itinerary"""
        if not destinations:
            return "📅 I couldn't find destinations for your trip. Please try a different query."
        
        dest_names = [d.get('name', 'Unknown') for d in destinations[:3]]
        dest_text = ", ".join(dest_names)
        
        return f"""📅 **Travel Itinerary** - Based on your request: "{query}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Day 1: Arrival & Exploration**
  🌅 Morning: Arrive and visit {dest_names[0] if len(dest_names) > 0 else 'the area'}
  🏛️ Afternoon: Explore local attractions and scenic spots
  🍽️ Evening: Enjoy authentic Kerala cuisine at nearby restaurants

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Day 2: Adventure & Culture**
  🌄 Morning: Visit {dest_names[1] if len(dest_names) > 1 else 'another attraction'}
  🗺️ Afternoon: Discover hidden gems and local culture
  🌅 Evening: Watch stunning sunset views and relaxation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Day 3: Final Day & Departure**
  🛍️ Morning: Explore {dest_names[2] if len(dest_names) > 2 else 'local markets'}
  📸 Afternoon: Last-minute sightseeing and photography
  🚗 Evening: Departure with wonderful memories

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 **Tips:**
• Best time to visit: Check seasonal weather patterns
• Book accommodations 2-3 weeks in advance
• Try local Kerala cuisine: Appam, Fish Curry, Puttu

📍 **Destinations:** {dest_text}"""
    
    def _parse_context(self, context: str) -> list:
        """Parse context to extract destination objects"""
        if not context or not context.strip():
            return []
        
        destinations = []
        lines = context.strip().split('\n')
        
        current_dest = {}
        description_lines = []
        
        for line in lines:
            if not line.strip():
                continue
            
            stripped = line.strip()
            
            # Skip lines that are not destinations
            if stripped.startswith('⭐') or stripped.startswith('Category:'):
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
                
                # Parse name and district
                clean_line = re.sub(r'^\d+\.\s*', '', stripped)
                name_match = re.match(r'^([^(]+)(?:\s*\(([^)]+)\))?', clean_line)
                
                if name_match:
                    name = name_match.group(1).strip()
                    district = name_match.group(2).strip() if name_match.group(2) else ''
                    current_dest['name'] = name
                    current_dest['district'] = district
                else:
                    current_dest['name'] = clean_line
                    current_dest['district'] = ''
                
                current_dest['type'] = ''
                current_dest['category'] = ''
                current_dest['tags'] = []
                current_dest['rating'] = 0.0
                current_dest['description'] = ''
            
            # Parse description
            elif current_dest and (line.startswith('   ') or line.startswith('\t')):
                desc = stripped
                if not desc.startswith('⭐') and not desc.startswith('•'):
                    description_lines.append(desc)
            
            # Parse rating
            elif current_dest and '⭐' in stripped:
                rating_match = re.search(r'⭐\s*([\d.]+)', stripped)
                if rating_match:
                    try:
                        current_dest['rating'] = float(rating_match.group(1))
                    except ValueError:
                        current_dest['rating'] = 0.0
        
        # Don't forget the last destination
        if current_dest and current_dest.get('name'):
            if description_lines:
                current_dest['description'] = ' '.join(description_lines).strip()
            destinations.append(current_dest)
        
        return destinations
    
    def _analyze_query(self, query: str) -> dict:
        """Analyze user query"""
        query_lower = query.lower().strip()
        
        intent = {
            'type': 'general',
            'district': None,
            'exclude_beach': False,
            'wants_mountains': False,
            'wants_waterfall': False,
            'wants_backwater': False,
            'wants_all_districts': False,
        }
        
        # Check for beach exclusion
        if any(phrase in query_lower for phrase in ['not beach', 'no beach', 'without beach']):
            intent['exclude_beach'] = True
        
        # Check for "all 14 districts"
        if '14 district' in query_lower or 'all district' in query_lower:
            intent['wants_all_districts'] = True
        
        # Detect district
        districts = ['kannur', 'kasargod', 'wayanad', 'idukki', 'alappuzha', 
                    'thrissur', 'ernakulam', 'kottayam', 'kollam', 'palakkad',
                    'malappuram', 'kozhikode', 'pathanamthitta', 'thiruvananthapuram']
        for district in districts:
            if district in query_lower:
                intent['district'] = district
                break
        
        # Detect types
        if any(word in query_lower for word in ['mountain', 'hill', 'peak', 'trek']):
            intent['wants_mountains'] = True
            intent['type'] = 'mountain'
        
        if any(word in query_lower for word in ['waterfall', 'falls']):
            intent['wants_waterfall'] = True
            intent['type'] = 'waterfall'
        
        if any(word in query_lower for word in ['backwater', 'houseboat']):
            intent['wants_backwater'] = True
            intent['type'] = 'backwater'
        
        return intent
    
    def _filter_destinations(self, destinations: list, intent: dict) -> list:
        """Filter destinations based on intent - FIXED"""
        filtered = destinations.copy()
        
        # Exclude beaches - FIXED: use direct loop instead of any()
        if intent.get('exclude_beach'):
            filtered = [d for d in filtered if 'beach' not in d.get('name', '').lower()]
        
        # Filter by district
        if intent.get('district'):
            district = intent['district']
            exact_matches = [d for d in filtered if d.get('district', '').lower() == district]
            if exact_matches:
                filtered = exact_matches
            else:
                filtered = [d for d in filtered if district in d.get('district', '').lower()]
        
        # Filter by type - FIXED: use direct checks
        if intent.get('type') == 'mountain':
            filtered = [d for d in filtered if 'mountain' in d.get('type', '').lower() or 'hill' in d.get('type', '').lower()]
        elif intent.get('type') == 'waterfall':
            filtered = [d for d in filtered if 'waterfall' in d.get('type', '').lower()]
        elif intent.get('type') == 'backwater':
            filtered = [d for d in filtered if 'backwater' in d.get('type', '').lower()]
        
        # Sort by rating
        filtered.sort(key=lambda x: x.get('rating', 0), reverse=True)
        
        return filtered[:5]
    
    def _generate_intelligent_response(self, query: str, destinations: list, intent: dict) -> str:
        """Generate response"""
        if not destinations:
            return f"🔍 I couldn't find matching destinations for '{query}'."
        
        response_parts = []
        
        # Opening
        if intent.get('wants_mountains'):
            opening = "⛰️ **Here are the best hill stations for trekking in Kerala:**"
        elif intent.get('wants_waterfall'):
            opening = "💧 **Here are the most beautiful waterfalls in Kerala:**"
        elif intent.get('wants_backwater'):
            opening = "🚣 **Here are the most serene backwater destinations:**"
        elif intent.get('exclude_beach'):
            opening = "🌿 **Exploring Kerala beyond beaches - here are beautiful alternatives:**"
        elif intent.get('district'):
            opening = f"📍 **Top destinations in {intent['district'].title()} district:**"
        elif intent.get('wants_all_districts'):
            opening = "🗺️ **Best places across all 14 districts of Kerala:**"
        else:
            opening = "✨ **Here are the top recommendations based on your interests:**"
        
        response_parts.append(opening)
        response_parts.append("")
        
        # Destination cards
        for i, dest in enumerate(destinations, 1):
            name = dest.get('name', 'Unknown')
            district = dest.get('district', '')
            description = dest.get('description', '')
            rating = dest.get('rating', 0)
            
            card = f"{i}. 📍 **{name}**"
            if district:
                card += f" ({district})"
            if description:
                card += f"\n   {description[:200]}"
            if rating:
                card += f"\n   ⭐ {rating:.1f}"
            
            response_parts.append(card)
            response_parts.append("")
        
        # Tips
        tips = ["💡 **Quick Tips:**"]
        tips.append("• 📲 Download maps for easier navigation")
        tips.append("• 🍛 Don't miss local Kerala cuisine")
        response_parts.append("\n".join(tips))
        response_parts.append("")
        
        # Closing
        response_parts.append("\n💬 Would you like more details about any of these places? 🌟")
        
        return "\n".join(response_parts)


# Singleton
llm_service = LLMService()