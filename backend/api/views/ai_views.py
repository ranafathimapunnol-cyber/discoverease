from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
import logging
import re
from typing import Dict, List, Optional
import uuid
from collections import defaultdict
import time
from difflib import SequenceMatcher

# ============================================
# FORCE IMPORT
# ============================================
from destinations.models import Destination

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
CACHE_DURATION = 300

# ============================================
# CATEGORY EMOJI MAP
# ============================================

CATEGORY_EMOJI = {
    'beach': '🏖️', 'hill': '⛰️', 'hill_station': '⛰️',
    'backwater': '🚣', 'wildlife': '🐘', 'temple': '🛕',
    'heritage': '🏛️', 'fort': '🏛️', 'palace': '🏛️',
    'waterfall': '💧', 'waterfalls': '💧', 'nature': '🌿',
    'adventure': '🎢', 'park': '🌳', 'garden': '🌳',
    'museum': '🏛️', 'resort': '🏨', 'mosque': '🕌',
    'church': '⛪', 'sacred': '🕉️', 'spiritual': '🕉️',
    'pilgrimage': '🕉️', 'lake': '🏞️', 'river': '🏞️',
    'mountain': '⛰️', 'trek': '⛰️', 'trekking': '⛰️',
    'peak': '⛰️', 'sunset': '🌅', 'sunrise': '🌄',
    'food': '🍛', 'shopping': '🛍️', 'transport': '🚌',
    'boat': '⛵', 'houseboat': '⛵', 'safari': '🐘',
    'birds': '🐦', 'flowers': '🌸', 'valley': '🏞️',
}

def get_category_emoji(category: str) -> str:
    if not category:
        return '📍'
    category_lower = category.lower()
    for key, emoji in CATEGORY_EMOJI.items():
        if key in category_lower:
            return emoji
    return '📍'

# ============================================
# NAME MAPPINGS FOR COMMON SEARCHES
# ============================================

NAME_MAPPINGS = {
    # Forts
    'arakkal fort': 'Arakkal Museum',
    'arakkal': 'Arakkal Museum',
    'bekal fort': 'Bekal Fort',
    'bekal': 'Bekal Fort',
    'palakkad fort': 'Palakkad Fort',
    'anjengo fort': 'Anjengo Fort',
    'chandragiri fort': 'Chandragiri Fort',
    'st angelo fort': 'St. Angelo Fort',
    'fort kochi': 'Fort Kochi',
    
    # Beaches
    'kappad': 'Kappad Beach',
    'muzhappilangad': 'Muzhappilangad Drive-in Beach',
    'kovalam': 'Kovalam Beach',
    'varkala': 'Varkala Beach',
    'marari': 'Marari Beach',
    'cherai': 'Cherai Beach',
    'beypore': 'Beypore Beach',
    
    # Hill Stations
    'paithalmala': 'Paithalmala',
    'ponmudi': 'Ponmudi',
    'nelliyampathy': 'Nelliyampathy',
    'munnar': 'Munnar',
    'vagamon': 'Vagamon',
    'wayanad': 'Wayanad Adventure Camp',
    'idukki': 'Idukki Wildlife Sanctuary',
    
    # Waterfalls
    'athirapally': 'Athirappilly Waterfall',
    'athirapilly': 'Athirappilly Waterfall',
    'athirappilly': 'Athirappilly Waterfall',
    'meenmutty': 'Meenmutty Waterfalls',
    'soochipara': 'Soochipara Waterfalls',
    'thusharagiri': 'Thusharagiri Waterfalls',
    'vazhachal': 'Vazhachal Waterfalls',
    'palaruvi': 'Palaruvi Waterfalls',
    'vellarimala': 'Vellarimala Waterfalls',
    
    # Temples
    'sabarimala': 'Sabarimala Temple',
    'guruvayur': 'Guruvayur Temple',
    'padmanabhaswamy': 'Sree Padmanabhaswamy Temple',
    'chottanikkara': 'Chottanikkara Bhagavathy Temple',
    'vadakkumnathan': 'Vadakkumnathan Temple',
    
    # Mosques
    'ponnani': 'Ponnani Juma Masjid',
    'malik dinar': 'Malik Dinar Mosque',
    'cheraman': 'Cheraman Juma Masjid',
    'mishkal': 'Mishqal Mosque',
    
    # Parks & Gardens
    'malampuzha gardens': 'Malampuzha Gardens',
    'malampuzha': 'Malampuzha Gardens',
    'pookode lake': 'Pookode Lake Garden',
    'sarovaram': 'Sarovaram Bio-Park',
    'active planet': 'Active Planet',
    'activeplanet': 'Active Planet',
    'wonderla': 'Wonderla Amusement Park',
    'vismaya': 'Vismaya Amusement Park',
    'silver storm': 'Silver Storm Water Theme Park',
    'sadhoo merry': 'Sadhoo Merry Kingdom',
    'dream land': 'Dream Land Fun and Adventure Park',
    
    # Backwaters
    'alleppey': 'Alleppey Backwaters',
    'alappuzha': 'Alleppey Backwaters',
    'kumarakom': 'Kumarakom Backwaters',
    'ashtamudi': 'Ashtamudi Lake',
    'vembanad': 'Vembanad Lake',
    'kuttanad': 'Kuttanad Backwaters',
    'munroe island': 'Munroe Island',
    
    # Wildlife
    'thekkady': 'Periyar Tiger Reserve',
    'periyar': 'Periyar Tiger Reserve',
    'silent valley': 'Silent Valley National Park',
    'parambikulam': 'Parambikulam Tiger Reserve',
    'eravikulam': 'Eravikulam National Park',
    'thattekad': 'Thattekad Bird Sanctuary',
    
    # Other
    'nellarchal': 'Vellarimala Waterfalls',
    'nellarchal waterfalls': 'Vellarimala Waterfalls',
    'kadalpalam': 'Kadalpalam Beach',
    'queen walkway': "Queen's Walkway",
    'queens walkway': "Queen's Walkway",
    'vazhamala': 'Vazhamala',
    'knowledge city': 'Markaz Knowledge City',
    'knowledgecity': 'Markaz Knowledge City',
    'knowledgciyt': 'Markaz Knowledge City',
    'markaz': 'Markaz Knowledge City',
}

def get_mapped_name(query: str) -> Optional[str]:
    query_lower = query.lower().strip()
    for key, value in NAME_MAPPINGS.items():
        if key in query_lower or query_lower == key:
            return value
    return None

# ============================================
# RELIGION/CATEGORY KEYWORDS
# ============================================

RELIGION_KEYWORDS = {
    'mosque': ['mosque', 'masjid', 'juma', 'islam', 'muslim', 'muhammad', 'allah', 'dargah', 'jama'],
    'church': ['church', 'basilica', 'cathedral', 'christian', 'jesus', 'saint', 'st.', 'catholic', 'syrian'],
    'temple': ['temple', 'kovil', 'devaswom', 'hindu', 'shiva', 'vishnu', 'devi', 'bhagavathy', 'sree', 'guruvayur'],
    'sacred': ['sacred', 'spiritual', 'pilgrimage', 'holy', 'divine', 'shrine', 'worship'],
}

def detect_religion(query_lower: str) -> Optional[str]:
    for religion, keywords in RELIGION_KEYWORDS.items():
        for keyword in keywords:
            if keyword in query_lower:
                return religion
    return None

# ============================================
# FETCH DATA
# ============================================

def fetch_destinations_from_db() -> List[Dict]:
    destinations = []
    try:
        queryset = Destination.objects.all()
        print(f"📊 Found {queryset.count()} destinations in database")
        
        for dest in queryset:
            category_name = dest.category
            if hasattr(dest, 'get_category_display'):
                try:
                    category_name = dest.get_category_display()
                except:
                    category_name = dest.category
            
            description = dest.long_description or dest.short_description or ''
            
            # Fix common name issues
            name = dest.name
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
            }
            for key, value in fixes.items():
                if key in name:
                    name = value
                    break
            
            destinations.append({
                'id': dest.id,
                'name': name,
                'district': dest.district or 'Unknown',
                'description': description,
                'category': category_name,
                'type': 'hidden' if dest.status == 'hidden' else 'well-known',
                'rating': float(dest.average_rating or 0),
                'image': dest.featured_image or '',
            })
        
        print(f"✅ Loaded {len(destinations)} destinations")
        
    except Exception as e:
        print(f"❌ Failed to fetch destinations: {e}")
    
    return destinations

def get_destinations() -> List[Dict]:
    global _destinations_cache, _cache_time
    current_time = time.time()
    if _destinations_cache and _cache_time and (current_time - _cache_time) < CACHE_DURATION:
        return _destinations_cache
    
    _destinations_cache = fetch_destinations_from_db()
    _cache_time = current_time
    return _destinations_cache

# ============================================
# SEARCH FUNCTIONS
# ============================================

def detect_destination_name(query_lower: str) -> Optional[str]:
    """Detect if query mentions a specific destination name"""
    # Don't detect destination if query is about hidden gems
    hidden_keywords = ['hidden', 'offbeat', 'unknown', 'lesser known', 'secret', 'untouched', 'off the tourist trail']
    if any(kw in query_lower for kw in hidden_keywords):
        return None
    
    destinations = get_destinations()
    for dest in destinations:
        name = dest.get('name', '').lower()
        # Only match if the name is a significant part of the query
        if name in query_lower and len(name) > 3:
            # Check if this is a full destination name match
            if query_lower == name or query_lower.startswith(name + ' ') or query_lower.endswith(' ' + name):
                return dest.get('name')
            # Also match if the name appears as a word in the query
            if f' {name} ' in f' {query_lower} ':
                return dest.get('name')
    return None

def search_data(query: str, destinations: List[Dict], top_k: int = 10, district: str = None) -> List[Dict]:
    if not destinations:
        return []
    
    query_clean = query.lower().strip()
    words = query_clean.split()
    
    scored = []
    for dest in destinations:
        name_lower = dest.get('name', '').lower()
        district_lower = dest.get('district', '').lower()
        category_lower = dest.get('category', '').lower()
        desc_lower = dest.get('description', '').lower()
        
        # If district filter is applied, skip if not matching
        if district and district.lower() != district_lower:
            continue
        
        score = 0
        
        # Exact name match - highest priority
        if query_clean == name_lower:
            score += 100
        elif name_lower.startswith(query_clean):
            score += 80
        elif query_clean in name_lower:
            score += 50
        
        # District match (if no specific district filter)
        if not district and query_clean in district_lower:
            score += 30
        
        # Category match
        if query_clean in category_lower:
            score += 20
        
        # Description match
        if query_clean in desc_lower:
            score += 10
        
        # Word-by-word matching
        for word in words:
            if len(word) < 2:
                continue
            if word in name_lower:
                score += 15
            if word in district_lower:
                score += 10
            if word in category_lower:
                score += 5
            if word in desc_lower:
                score += 2
        
        # Fuzzy matching for misspellings
        if len(query_clean) > 3:
            name_words = name_lower.split()
            for nw in name_words:
                if len(nw) > 3:
                    similarity = SequenceMatcher(None, query_clean, nw).ratio()
                    if similarity > 0.6:
                        score += int(similarity * 30)
        
        if score > 0:
            scored.append({**dest, 'score': min(score / 100, 1.0)})
    
    scored.sort(key=lambda x: x.get('score', 0), reverse=True)
    
    # Remove duplicates
    seen = set()
    unique = []
    for item in scored:
        name = item.get('name', '').lower()
        if name and name not in seen:
            seen.add(name)
            unique.append(item)
    
    return unique[:top_k]

def detect_district(query_lower: str) -> Optional[str]:
    districts = [
        'thiruvananthapuram', 'kollam', 'pathanamthitta', 'alappuzha',
        'kottayam', 'idukki', 'ernakulam', 'thrissur', 'palakkad',
        'malappuram', 'kozhikode', 'wayanad', 'kannur', 'kasargod', 'kasaragod'
    ]
    for d in districts:
        if d in query_lower:
            return d.title()
    return None

def detect_category(query_lower: str) -> Optional[str]:
    categories = {
        'beach': 'Beach', 'beaches': 'Beach',
        'hill': 'Hill Station', 'hills': 'Hill Station',
        'waterfall': 'Waterfall', 'waterfalls': 'Waterfall', 'falls': 'Waterfall',
        'backwater': 'Backwater', 'backwaters': 'Backwater',
        'wildlife': 'Wildlife', 'sanctuary': 'Wildlife',
        'temple': 'Temple', 'temples': 'Temple',
        'heritage': 'Heritage', 'fort': 'Heritage', 'forts': 'Heritage',
        'park': 'Park', 'parks': 'Park', 'garden': 'Park',
        'museum': 'Museum', 'museums': 'Museum',
        'trek': 'Hill Station', 'trekking': 'Hill Station',
        'mountain': 'Hill Station', 'mountains': 'Hill Station',
        'mosque': 'Mosque', 'church': 'Church', 'sacred': 'Sacred',
        'spiritual': 'Sacred', 'pilgrimage': 'Sacred',
        'resort': 'Resort', 'resorts': 'Resort',
        'adventure': 'Adventure', 'nature': 'Nature',
        'viewpoint': 'Viewpoint', 'landmark': 'Landmark',
    }
    for key, value in categories.items():
        if key in query_lower:
            return value
    return None

def safe_truncate(text: str, max_len: int) -> str:
    if not text:
        return ''
    if len(text) <= max_len:
        return text
    truncate_at = text[:max_len].rfind(' ')
    if truncate_at > 0:
        return text[:truncate_at] + '...'
    return text[:max_len - 3] + '...'

def clean_name(name: str) -> str:
    if not name:
        return ''
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
    }
    for key, value in fixes.items():
        if key in name:
            return value
    return name

# ============================================
# ITINERARY BUILDERS
# ============================================

def build_alleppey_backwater_itinerary(num_days: int, budget_text: str = "") -> str:
    lines = [
        f"🚣 {num_days}-Day Backwater Escape in Alleppey {budget_text}",
        "",
        "📅 Day-by-Day Plan:",
        ""
    ]
    
    if num_days >= 4:
        lines.append("**Day 1:**")
        lines.append("  • 🚗 Arrive in Alleppey (morning)")
        lines.append("  • 🛳️ Check-in to houseboat (11 AM)")
        lines.append("  • 🚣 Backwater cruise through Vembanad Lake")
        lines.append("  • 🍛 Lunch on houseboat")
        lines.append("  • 🏞️ Explore Kuttanad backwaters")
        lines.append("  • 🌅 Sunset on the water")
        lines.append("  • 🍛 Dinner on houseboat")
        lines.append("")
        lines.append("**Day 2:**")
        lines.append("  • 🌄 Morning village walk (6 AM - 8 AM)")
        lines.append("  • 🍛 Breakfast on houseboat")
        lines.append("  • 🚣 Explore narrow canals")
        lines.append("  • 🍛 Lunch on houseboat")
        lines.append("  • 🏞️ Visit Kumarakom bird sanctuary")
        lines.append("  • 🌅 Sunset boat ride")
        lines.append("  • 🍛 Dinner on houseboat")
        lines.append("")
        lines.append("**Day 3:**")
        lines.append("  • 🍛 Breakfast on houseboat")
        lines.append("  • 🚗 Visit Alleppey Beach")
        lines.append("  • 🍛 Lunch at local restaurant")
        lines.append("  • 🏛️ Visit St. Mary's Forane Church")
        lines.append("  • 🛍️ Explore local markets")
        lines.append("  • 🌅 Sunset at the beach")
        lines.append("  • 🍛 Dinner at beachside restaurant")
        lines.append("")
        lines.append("**Day 4:**")
        lines.append("  • 🚣 Morning boat ride in canals")
        lines.append("  • 🍛 Breakfast at hotel")
        lines.append("  • 🚗 Departure (afternoon)")
    elif num_days == 3:
        lines.append("**Day 1:**")
        lines.append("  • 🚗 Arrive in Alleppey")
        lines.append("  • 🛳️ Check-in to houseboat")
        lines.append("  • 🚣 Backwater cruise through Vembanad Lake")
        lines.append("  • 🌅 Sunset on the water")
        lines.append("")
        lines.append("**Day 2:**")
        lines.append("  • 🌄 Morning village walk")
        lines.append("  • 🏞️ Explore Kuttanad backwaters")
        lines.append("  • 🍛 Lunch on houseboat")
        lines.append("  • 🚣 Evening boat ride through canals")
        lines.append("  • 🌅 Sunset boat ride")
        lines.append("")
        lines.append("**Day 3:**")
        lines.append("  • 🏖️ Visit Alleppey Beach")
        lines.append("  • 🛍️ Explore local markets")
        lines.append("  • 🚗 Departure")
    else:
        for day in range(1, num_days + 1):
            lines.append(f"**Day {day}:**")
            lines.append("  • 🚣 Backwater cruise")
            lines.append("  • 🌿 Village exploration")
            lines.append("  • 🌅 Sunset viewing")
            lines.append("")
    
    lines.append("")
    lines.append("💡 Tips:")
    lines.append("• 🚣 Book houseboat in advance (especially in peak season)")
    lines.append("• 📸 Carry camera for backwater views")
    lines.append("• 🍛 Try local seafood and Kerala cuisine")
    lines.append("• 🌅 Best time for photos: Golden hour (5:30 PM - 6:30 PM)")
    lines.append("• 🧴 Carry sunscreen and mosquito repellent")
    lines.append("• 📅 Best time: October to March")
    if budget_text:
        lines.append(f"• 💰 Budget: ₹2,000-₹4,000 per day per person (including houseboat)")
    
    return "\n".join(lines)

def build_munnar_trekking_itinerary(num_days: int, budget_text: str = "") -> str:
    lines = [
        f"⛰️ Munnar Trekking Itinerary {budget_text}",
        "",
        "📅 Day-by-Day Plan:",
        ""
    ]
    
    if num_days >= 3:
        lines.append("**Day 1:**")
        lines.append("  • 🚗 Arrive in Munnar (morning)")
        lines.append("  • 🏛️ Visit Tea Museum (10 AM - 12 PM)")
        lines.append("  • 🍛 Lunch at local restaurant")
        lines.append("  • 🌿 Walk through tea gardens (2 PM - 4 PM)")
        lines.append("  • 🌅 Sunset at Tea Valley Viewpoint")
        lines.append("  • 🍛 Local dinner")
        lines.append("")
        lines.append("**Day 2:**")
        lines.append("  • 🥾 Trek to Top Station (start 6 AM)")
        lines.append("  • 🌄 Panoramic views from Top Station")
        lines.append("  • 🍽️ Lunch break")
        lines.append("  • 🏞️ Visit Echo Point (2 PM - 3 PM)")
        lines.append("  • 🌅 Sunset at Mattupetty Dam (5 PM - 6 PM)")
        lines.append("  • 🍛 Dinner")
        lines.append("")
        lines.append("**Day 3:**")
        lines.append("  • 🐘 Visit Eravikulam National Park (8 AM - 11 AM)")
        lines.append("  • 🍛 Lunch")
        lines.append("  • 🛍️ Explore local markets")
        lines.append("  • 🚗 Departure (evening)")
    else:
        for day in range(1, num_days + 1):
            lines.append(f"**Day {day}:**")
            lines.append("  • 🥾 Morning trek")
            lines.append("  • 🍛 Lunch")
            lines.append("  • 🌿 Nature walk")
            lines.append("  • 🌅 Sunset viewing")
            lines.append("")
    
    lines.append("")
    lines.append("💡 Tips:")
    lines.append("• 🥾 Start treks early morning (6 AM)")
    lines.append("• 💧 Carry 2L water per person")
    lines.append("• 👟 Wear comfortable trekking shoes")
    lines.append("• 🧥 Carry warm clothing (temperature drops)")
    lines.append("• 🗺️ Hire a local guide for treks")
    if budget_text:
        lines.append(f"• 💰 Estimated cost: ₹1,500-₹2,500 per day")
    
    return "\n".join(lines)

def build_varkala_sunset_itinerary(num_days: int, budget_text: str = "") -> str:
    lines = [
        f"🌅 Varkala Sunset Itinerary {budget_text}",
        "",
        "📅 Day-by-Day Plan:",
        ""
    ]
    
    if num_days >= 3:
        lines.append("**Day 1:**")
        lines.append("  • 🚗 Arrive in Varkala (morning)")
        lines.append("  • 🏖️ Beach time at Papanasam Beach")
        lines.append("  • 🍛 Lunch at cliff cafe")
        lines.append("  • 🚶 Cliff walk (2 PM - 4 PM)")
        lines.append("  • 🌅 Sunset at the cliff (5:30 PM - 6:30 PM)")
        lines.append("  • 🍹 Dinner at cliff cafe with sunset views")
        lines.append("")
        lines.append("**Day 2:**")
        lines.append("  • 🛕 Visit Janardhana Swamy Temple (8 AM - 10 AM)")
        lines.append("  • 🏖️ Beach exploration")
        lines.append("  • 🍛 Lunch at local restaurant")
        lines.append("  • 🚶 Explore Varkala town")
        lines.append("  • 🌅 Sunset at Papanasam Beach (5 PM - 6:30 PM)")
        lines.append("  • 🍛 Local dinner")
        lines.append("")
        lines.append("**Day 3:**")
        lines.append("  • 🏛️ Visit Sivagiri Mutt (8 AM - 10 AM)")
        lines.append("  • 🛍️ Shopping at local markets")
        lines.append("  • 🍛 Lunch")
        lines.append("  • 🚗 Departure (evening)")
    else:
        for day in range(1, num_days + 1):
            lines.append(f"**Day {day}:**")
            lines.append("  • 🌅 Sunset viewing")
            lines.append("  • 🏖️ Beach time")
            lines.append("  • 🍛 Local cuisine")
            lines.append("")
    
    lines.append("")
    lines.append("💡 Tips:")
    lines.append("• 🌅 Reach viewing spot 1 hour before sunset")
    lines.append("• 📷 Best time for photos: 30 mins before sunset")
    lines.append("• 🍹 Visit cliff cafes for sunset views")
    lines.append("• 🏖️ Best beach: Papanasam Beach")
    lines.append("• 📸 Must-visit: Cliff walk at sunset")
    if budget_text:
        lines.append(f"• 💰 Estimated cost: ₹1,500-₹2,500 per day")
    
    return "\n".join(lines)

# ============================================
# RESPONSE BUILDERS
# ============================================

def build_all_districts_answer(destinations: List[Dict]) -> str:
    main_districts = [
        'Alappuzha', 'Ernakulam', 'Idukki', 'Kannur', 'Kasaragod',
        'Kollam', 'Kottayam', 'Kozhikode', 'Malappuram', 'Palakkad',
        'Pathanamthitta', 'Thiruvananthapuram', 'Thrissur', 'Wayanad'
    ]
    
    district_map = defaultdict(list)
    for dest in destinations:
        district = dest.get('district', 'Unknown')
        if district in main_districts:
            district_map[district].append(dest)
    
    lines = ["🗺️ Best places across all 14 districts of Kerala:", ""]
    
    for district in main_districts:
        places = district_map.get(district, [])
        if places:
            sorted_places = sorted(places, key=lambda x: x.get('rating', 0), reverse=True)
            top_names = [p['name'] for p in sorted_places[:3]]
            if len(places) > 3:
                lines.append(f"{district}: {', '.join(top_names)} and {len(places) - 3} more")
            else:
                lines.append(f"{district}: {', '.join(top_names)}")
        else:
            lines.append(f"{district}: No data available")
    
    lines.append("")
    lines.append("💡 Tips:")
    lines.append("• Best time to visit: October to March")
    lines.append("• Each district has unique attractions")
    lines.append("• Plan 2-3 days per district")
    
    return "\n".join(lines)

def build_district_answer(district: str, destinations: List[Dict], category: str = None) -> str:
    district_dests = [d for d in destinations if d.get('district', '').lower() == district.lower()]
    
    # Filter by category if specified
    if category:
        category_lower = category.lower()
        district_dests = [d for d in district_dests if category_lower in d.get('category', '').lower() or category_lower in d.get('name', '').lower()]
    
    if not district_dests:
        if category:
            return f"📍 No {category} destinations found in {district} district."
        return f"📍 No destinations found in {district} district."
    
    sorted_dests = sorted(district_dests, key=lambda x: x.get('rating', 0), reverse=True)
    
    title = f"📍 Top {category} destinations in {district} district:" if category else f"📍 Top destinations in {district} district:"
    lines = [title, f"📊 Found {len(sorted_dests)} places", ""]
    
    for i, place in enumerate(sorted_dests[:10], 1):
        emoji = get_category_emoji(place.get('category', ''))
        name = place.get('name', 'Unknown')
        desc = place.get('description', '')
        rating = place.get('rating', 0)
        
        lines.append(f"{i}. {emoji} {name}")
        if desc:
            lines.append(f"   {safe_truncate(desc, 120)}")
        if rating and rating > 0:
            lines.append(f"   ⭐ {rating}/5")
        lines.append("")
    
    lines.append("💡 Tips:")
    lines.append("• 📲 Download maps for navigation")
    lines.append("• 🍛 Try local Kerala cuisine")
    lines.append("• 🌅 Visit early morning for best experience")
    
    return "\n".join(lines)

def build_destination_detail(dest: Dict) -> str:
    name = dest.get('name', 'Unknown')
    district = dest.get('district', 'Unknown')
    category = dest.get('category', '')
    rating = dest.get('rating', 0)
    desc = dest.get('description', '')
    emoji = get_category_emoji(category)
    
    lines = [
        f"📍 {name}",
        f"📌 District: {district}",
        f"🏷️ Category: {category}",
    ]
    if rating and rating > 0:
        lines.append(f"⭐ Rating: {rating}/5")
    lines.append("")
    if desc:
        lines.append(f"📝 {desc}")
        lines.append("")
    lines.append("💡 Tips:")
    lines.append("• 📲 Download maps for navigation")
    lines.append("• 🍛 Try local Kerala cuisine")
    lines.append("• 🌅 Visit early morning for best experience")
    
    return "\n".join(lines)

def build_itinerary_answer(query: str, destinations: List[Dict]) -> str:
    query_lower = query.lower()
    
    # Detect duration
    day_match = re.search(r'(\d+)\s*(day|days?)', query_lower)
    num_days = min(int(day_match.group(1)), 5) if day_match else 3
    
    # Enhanced budget detection
    budget_text = ""
    budget_match = re.search(r'under\s*[₹]?\s*([\d,]+[kK]?)', query_lower)
    if not budget_match:
        budget_match = re.search(r'budget\s*[₹]?\s*([\d,]+[kK]?)', query_lower)
    if budget_match:
        budget_text = f"under ₹{budget_match.group(1)}"
    
    # Check for Alleppey specifically - force backwater itinerary
    if 'alleppey' in query_lower or 'alappuzha' in query_lower:
        return build_alleppey_backwater_itinerary(num_days, budget_text)
    
    # Check for Varkala specifically - force sunset itinerary
    if 'varkala' in query_lower:
        return build_varkala_sunset_itinerary(num_days, budget_text)
    
    # Check for Munnar trekking specifically
    if 'munnar' in query_lower and ('trekking' in query_lower or 'trek' in query_lower):
        return build_munnar_trekking_itinerary(num_days, budget_text)
    
    # Detect destination
    dest_name = detect_destination_name(query_lower)
    
    # If no specific destination, try common names
    common_dests = ['Munnar', 'Varkala', 'Alleppey', 'Kochi', 'Wayanad', 'Thrissur', 'Kannur', 'Idukki']
    if not dest_name:
        for d in common_dests:
            if d.lower() in query_lower:
                dest_name = d
                break
    
    # Detect if it's a waterfall itinerary
    is_waterfall = 'waterfall' in query_lower or 'falls' in query_lower
    
    # Detect if it's monsoon
    is_monsoon = 'monsoon' in query_lower or 'rainy' in query_lower
    
    # Detect if it's backwater (but not already handled by Alleppey)
    is_backwater = 'backwater' in query_lower or 'houseboat' in query_lower
    
    # Detect if it's family
    is_family = 'family' in query_lower or 'kid' in query_lower or 'children' in query_lower
    
    # Detect if it's sunset (but not already handled by Varkala)
    is_sunset = 'sunset' in query_lower or 'sun set' in query_lower
    
    # ============================================
    # WATERFALL / MONSOON ITINERARY
    # ============================================
    if is_waterfall or is_monsoon:
        waterfalls = [d for d in destinations if 'waterfall' in d.get('category', '').lower()]
        waterfall_names = [w['name'] for w in waterfalls[:5]]
        
        lines = [
            f"🌧️ {num_days}-Day Monsoon Waterfall Itinerary {budget_text}",
            "",
            "💧 Top Waterfalls to Visit:",
        ]
        for i, w in enumerate(waterfall_names[:5], 1):
            lines.append(f"   {i}. {w}")
        lines.append("")
        lines.append("📅 Day-by-Day Plan:")
        lines.append("")
        
        waterfall_places = ['Athirappilly Waterfall', 'Meenmutty Waterfall', 'Thusharagiri Waterfall', 'Vazhachal Waterfall', 'Soochipara Waterfall']
        
        for day in range(1, num_days + 1):
            lines.append(f"**Day {day}:**")
            if day == 1:
                lines.append("  • 🌅 Morning: Drive to Thrissur")
                if waterfall_places:
                    lines.append(f"  • 💧 Afternoon: Visit {waterfall_places[0]}")
                lines.append("  • 🌿 Evening: Nature walk and local dinner")
            elif day == 2:
                lines.append("  • 🌄 Morning: Drive to Wayanad")
                if len(waterfall_places) > 1:
                    lines.append(f"  • 💧 Afternoon: Visit {waterfall_places[1]}")
                lines.append("  • 🌅 Evening: Sunset at Soochipara Waterfall")
            else:
                lines.append("  • 🌊 Morning: Visit more waterfalls")
                lines.append("  • 🍽️ Afternoon: Local cuisine")
                lines.append("  • 🚗 Evening: Departure")
            lines.append("")
        
        lines.append("💡 Tips:")
        lines.append("• 🧥 Carry raincoat and waterproof bags")
        lines.append("• 👟 Wear waterproof footwear with good grip")
        lines.append("• 📸 Protect camera from rain")
        lines.append("• 🚗 Check road conditions before traveling")
        
        if budget_text:
            lines.append(f"• 💰 Budget: ₹1,500-₹2,500 per day per person")
        
        return "\n".join(lines)
    
    # ============================================
    # BACKWATER ITINERARY (generic)
    # ============================================
    if is_backwater:
        return build_alleppey_backwater_itinerary(num_days, budget_text)
    
    # ============================================
    # FAMILY ITINERARY
    # ============================================
    if is_family:
        lines = [
            f"👨‍👩‍👧‍👦 {num_days}-Day Family Itinerary in {dest_name or 'Kerala'} {budget_text}",
            "",
            "📅 Day-by-Day Plan:",
            ""
        ]
        
        if dest_name and 'kochi' in dest_name.lower():
            lines.append("**Day 1:**")
            lines.append("  • 🚗 Arrive in Kochi")
            lines.append("  • 🏛️ Visit Fort Kochi (walking tour)")
            lines.append("  • 🎣 See Chinese fishing nets")
            lines.append("  • 🍛 Family dinner at local restaurant")
            lines.append("")
            lines.append("**Day 2:**")
            lines.append("  • 🎢 Visit Wonderla Amusement Park")
            lines.append("  • 🎠 Kids water park activities")
            lines.append("  • 🍽️ Family lunch")
            lines.append("  • 🌅 Evening at Marine Drive")
            lines.append("")
            if num_days >= 3:
                lines.append("**Day 3:**")
                lines.append("  • 🏛️ Visit Hill Palace Museum")
                lines.append("  • 🛍️ Shopping at local markets")
                lines.append("  • 🚗 Departure")
        elif dest_name and 'munnar' in dest_name.lower():
            lines.append("**Day 1:**")
            lines.append("  • 🚗 Drive to Munnar")
            lines.append("  • 🏛️ Visit Tea Museum")
            lines.append("  • 🌿 Walk through tea gardens")
            lines.append("  • 🌅 Sunset at Tea Valley Viewpoint")
            lines.append("")
            lines.append("**Day 2:**")
            lines.append("  • 🐘 Visit Eravikulam National Park")
            lines.append("  • 🍽️ Family lunch")
            lines.append("  • 🏞️ Visit Mattupetty Dam")
            lines.append("  • 🌅 Sunset view")
            lines.append("")
            if num_days >= 3:
                lines.append("**Day 3:**")
                lines.append("  • 🚗 Visit Top Station")
                lines.append("  • 🛍️ Shopping at local markets")
                lines.append("  • 🚗 Departure")
        else:
            lines.append("**Day 1:**")
            lines.append("  • 🚗 Arrive and check-in to family-friendly accommodation")
            lines.append("  • 🏛️ Visit kid-friendly attractions")
            lines.append("  • 🍽️ Family dinner")
            lines.append("")
            lines.append("**Day 2:**")
            lines.append("  • 🎢 Theme park or nature walk")
            lines.append("  • 🍛 Lunch")
            lines.append("  • 🎠 Kids activities")
            lines.append("")
            if num_days >= 3:
                lines.append("**Day 3:**")
                lines.append("  • 🏛️ Visit educational sites")
                lines.append("  • 🛍️ Shopping")
                lines.append("  • 🚗 Departure")
        
        lines.append("")
        lines.append("💡 Tips:")
        lines.append("• 👨‍👩‍👧‍👦 Book family-friendly accommodation")
        lines.append("• 🧸 Carry activities for kids")
        lines.append("• 🍽️ Look for kid-friendly restaurants")
        lines.append("• 🩹 Carry first aid kit")
        if budget_text:
            lines.append(f"• 💰 Budget: ₹2,000-₹3,500 per day per family")
        
        return "\n".join(lines)
    
    # ============================================
    # SUNSET ITINERARY (generic)
    # ============================================
    if is_sunset:
        return build_varkala_sunset_itinerary(num_days, budget_text)
    
    # ============================================
    # GENERIC ITINERARY
    # ============================================
    lines = [
        f"🗺️ {num_days}-Day Itinerary for {dest_name or 'Kerala'} {budget_text}",
        "",
        "📅 Day-by-Day Plan:",
        ""
    ]
    
    for day in range(1, num_days + 1):
        lines.append(f"**Day {day}:**")
        if day == 1:
            lines.append("  • 🚗 Arrive and check-in")
            lines.append("  • 🏛️ Explore local attractions")
            lines.append("  • 🌅 Sunset viewing")
            lines.append("  • 🍛 Local dinner")
        elif day == num_days:
            lines.append("  • 🏛️ Visit key attractions")
            lines.append("  • 🛍️ Shopping")
            lines.append("  • 🚗 Departure")
        else:
            lines.append("  • 🌄 Morning exploration")
            lines.append("  • 🍽️ Lunch")
            lines.append("  • 🌿 Afternoon activities")
            lines.append("  • 🌅 Sunset viewing")
            lines.append("  • 🍛 Dinner")
        lines.append("")
    
    lines.append("💡 Tips:")
    lines.append("• 📲 Book accommodations in advance")
    lines.append("• 🍛 Try local Kerala cuisine")
    lines.append("• 📲 Download maps for navigation")
    if budget_text:
        lines.append(f"• 💰 Budget: ₹1,500-₹2,500 per day per person")
    
    return "\n".join(lines)

def build_hill_station_answer(query: str, destinations: List[Dict]) -> str:
    hills = [d for d in destinations if 'hill' in d.get('category', '').lower() or 'mountain' in d.get('category', '').lower()]
    
    if not hills:
        return "⛰️ No hill stations found in the database."
    
    query_lower = query.lower()
    is_trekking = 'trekking' in query_lower
    
    # Check if specific destination mentioned
    dest_name = detect_destination_name(query_lower)
    
    if dest_name:
        specific_hills = [h for h in hills if dest_name.lower() in h.get('name', '').lower()]
        if specific_hills:
            hills = specific_hills
    
    if is_trekking:
        trekking_hills = [h for h in hills if 'trek' in h.get('description', '').lower()]
        if trekking_hills:
            hills = trekking_hills
    
    max_results = 1 if 'one best' in query_lower else min(8, len(hills))
    hills_sorted = sorted(hills, key=lambda x: x.get('rating', 0), reverse=True)
    
    if dest_name:
        lines = [f"⛰️ {dest_name} - Trekking Guide:", ""]
    elif 'one best' in query_lower:
        lines = ["⭐ Top hill station recommendation:", ""]
    elif is_trekking:
        lines = ["⛰️ Best hill stations for trekking:", ""]
    else:
        lines = ["⛰️ Top hill stations in Kerala:", ""]
    
    for i, h in enumerate(hills_sorted[:max_results], 1):
        name = h.get('name', 'Unknown')
        district = h.get('district', 'Unknown')
        desc = h.get('description', '')
        rating = h.get('rating', 0)
        
        lines.append(f"{i}. {name} ({district})")
        if desc:
            lines.append(f"   {safe_truncate(desc, 100)}")
        if rating and rating > 0:
            lines.append(f"   ⭐ {rating}/5")
        lines.append("")
    
    lines.append("💡 Tips:")
    lines.append("• Best time to visit: September to May")
    if is_trekking:
        lines.append("• 🥾 Start your trek early morning")
        lines.append("• 💧 Carry sufficient water (2L per person)")
        lines.append("• 👟 Wear comfortable trekking shoes")
        lines.append("• 🗺️ Hire a local guide for the best experience")
    else:
        lines.append("• 📲 Download maps for navigation")
        lines.append("• 🍛 Try local Kerala cuisine")
    
    return "\n".join(lines)

def build_general_answer(query: str, results: List[Dict]) -> str:
    if not results:
        return "🔍 No destinations found."
    
    lines = [f"🔍 Found {len(results)} matching destinations:", ""]
    
    for i, r in enumerate(results[:8], 1):
        emoji = get_category_emoji(r.get('category', ''))
        name = r.get('name', 'Unknown')
        district = r.get('district', '')
        desc = r.get('description', '')
        rating = r.get('rating', 0)
        
        lines.append(f"{i}. {emoji} {name}" + (f" ({district})" if district else ""))
        if desc:
            lines.append(f"   {safe_truncate(desc, 100)}")
        if rating and rating > 0:
            lines.append(f"   ⭐ {rating}/5")
        lines.append("")
    
    lines.append("💡 Tips:")
    lines.append("• 📲 Download maps for navigation")
    lines.append("• 🍛 Try local Kerala cuisine")
    lines.append("• 🌅 Visit early morning for best experience")
    
    return "\n".join(lines)

def build_backwater_answer(query: str, destinations: List[Dict]) -> str:
    backwaters = [d for d in destinations if 'backwater' in d.get('category', '').lower() or 'lake' in d.get('category', '').lower()]
    
    if not backwaters:
        return "🚣 No backwater destinations found."
    
    sorted_dests = sorted(backwaters, key=lambda x: x.get('rating', 0), reverse=True)
    lines = ["🚣 Top backwater destinations:", ""]
    
    for i, b in enumerate(sorted_dests[:8], 1):
        name = b.get('name', 'Unknown')
        district = b.get('district', 'Unknown')
        desc = b.get('description', '')
        rating = b.get('rating', 0)
        
        lines.append(f"{i}. {name} ({district})")
        if desc:
            lines.append(f"   {safe_truncate(desc, 100)}")
        if rating and rating > 0:
            lines.append(f"   ⭐ {rating}/5")
        lines.append("")
    
    lines.append("💡 Tips:")
    lines.append("• Best time to visit: October to March")
    lines.append("• 🚣 Book houseboats in advance")
    lines.append("• 📸 Best photos: Golden hour")
    
    return "\n".join(lines)

def build_waterfall_answer(query: str, destinations: List[Dict]) -> str:
    waterfalls = [d for d in destinations if 'waterfall' in d.get('category', '').lower()]
    
    if not waterfalls:
        return "💧 No waterfalls found."
    
    sorted_dests = sorted(waterfalls, key=lambda x: x.get('rating', 0), reverse=True)
    lines = ["💧 Top waterfalls in Kerala:", ""]
    
    for i, w in enumerate(sorted_dests[:8], 1):
        name = w.get('name', 'Unknown')
        district = w.get('district', 'Unknown')
        desc = w.get('description', '')
        rating = w.get('rating', 0)
        
        lines.append(f"{i}. {name} ({district})")
        if desc:
            lines.append(f"   {safe_truncate(desc, 100)}")
        if rating and rating > 0:
            lines.append(f"   ⭐ {rating}/5")
        lines.append("")
    
    lines.append("💡 Tips:")
    lines.append("• Best time: Post-monsoon (September to February)")
    lines.append("• 👟 Wear comfortable footwear")
    lines.append("• 📸 Protect camera from water")
    
    return "\n".join(lines)

def build_hidden_gems_answer(query: str, destinations: List[Dict]) -> str:
    """Build response for hidden gems queries"""
    query_lower = query.lower()
    
    # Get hidden destinations (type='hidden' or description contains 'hidden')
    hidden = []
    for d in destinations:
        is_hidden = False
        if d.get('type') == 'hidden':
            is_hidden = True
        if 'hidden' in d.get('description', '').lower():
            is_hidden = True
        if 'offbeat' in d.get('description', '').lower():
            is_hidden = True
        if 'lesser known' in d.get('description', '').lower():
            is_hidden = True
        if is_hidden:
            hidden.append(d)
    
    # If no hidden gems found, fall back to general search
    if not hidden:
        # Try to find any destinations in the specified district
        district = detect_district(query_lower)
        if district:
            district_dests = [d for d in destinations if d.get('district', '').lower() == district.lower()]
            if district_dests:
                sorted_dests = sorted(district_dests, key=lambda x: x.get('rating', 0), reverse=True)
                lines = [f"💎 Exploring {district} district:", ""]
                lines.append("While we don't have specific 'hidden gems' marked, here are some great places to explore:")
                lines.append("")
                for i, d in enumerate(sorted_dests[:8], 1):
                    emoji = get_category_emoji(d.get('category', ''))
                    lines.append(f"{i}. {emoji} {d.get('name', 'Unknown')}")
                    if d.get('district'):
                        lines.append(f"   📍 {d.get('district')}")
                    if d.get('description'):
                        lines.append(f"   {safe_truncate(d.get('description'), 80)}")
                    lines.append("")
                lines.append("💡 Tips for offbeat exploration:")
                lines.append("• 🚗 Ask locals for lesser-known spots")
                lines.append("• 🌅 Visit early morning for peaceful experience")
                lines.append("• 📸 Respect local culture and privacy")
                return "\n".join(lines)
        
        return "💎 No hidden gems found in the database.\n\n💡 Try searching for specific categories like 'beaches' or 'hill stations' in a district instead.\n\nExample: 'beaches in Kannur' or 'hill stations in Idukki'"
    
    # Filter by district if specified
    district = detect_district(query_lower)
    if district:
        hidden = [h for h in hidden if h.get('district', '').lower() == district.lower()]
    
    if not hidden:
        if district:
            return f"💎 No hidden gems found in {district} district.\n\n💡 Try searching for specific categories like 'beaches' or 'hill stations' instead."
        return "💎 No hidden gems found in the database."
    
    sorted_hidden = sorted(hidden, key=lambda x: x.get('rating', 0), reverse=True)
    
    title = "💎 Hidden Gems in Kerala"
    if district:
        title = f"💎 Hidden Gems in {district} district"
    
    lines = [title, f"📊 Found {len(sorted_hidden)} offbeat destinations", ""]
    
    for i, gem in enumerate(sorted_hidden[:10], 1):
        emoji = get_category_emoji(gem.get('category', ''))
        name = gem.get('name', 'Unknown')
        district_text = gem.get('district', 'Unknown')
        desc = gem.get('description', '')
        rating = gem.get('rating', 0)
        
        lines.append(f"{i}. {emoji} {name}")
        lines.append(f"   📍 {district_text}")
        if desc:
            lines.append(f"   {safe_truncate(desc, 100)}")
        if rating and rating > 0:
            lines.append(f"   ⭐ {rating}/5")
        lines.append("")
    
    lines.append("💡 Tips for Hidden Gems:")
    lines.append("• 🌅 Visit early morning for peaceful experience")
    lines.append("• 🚗 Check local access and transportation")
    lines.append("• 🎒 Carry snacks and water (limited facilities)")
    lines.append("• 🙏 Respect local culture and privacy")
    
    return "\n".join(lines)

def build_sacred_answer(query: str, destinations: List[Dict]) -> str:
    query_lower = query.lower()
    
    religion = detect_religion(query_lower)
    
    sacred_places = []
    sacred_keywords = ['temple', 'mosque', 'church', 'basilica', 'cathedral', 'masjid', 'dargah', 'shrine', 'sacred', 'holy', 'pilgrimage']
    
    for dest in destinations:
        name_lower = dest.get('name', '').lower()
        category_lower = dest.get('category', '').lower()
        desc_lower = dest.get('description', '').lower()
        
        is_sacred = False
        for keyword in sacred_keywords:
            if keyword in name_lower or keyword in category_lower or keyword in desc_lower:
                is_sacred = True
                break
        
        if is_sacred:
            if religion == 'mosque':
                if 'mosque' in name_lower or 'masjid' in name_lower or 'juma' in name_lower:
                    sacred_places.append(dest)
            elif religion == 'church':
                if 'church' in name_lower or 'basilica' in name_lower or 'cathedral' in name_lower:
                    sacred_places.append(dest)
            elif religion == 'temple':
                if 'temple' in name_lower or 'kovil' in name_lower:
                    sacred_places.append(dest)
            else:
                sacred_places.append(dest)
    
    if not sacred_places:
        return "🕉️ No sacred places found.\n\n💡 Try searching for 'temples', 'mosques', or 'churches' instead."
    
    sorted_sacred = sorted(sacred_places, key=lambda x: x.get('rating', 0), reverse=True)
    
    title = "🕉️ Sacred Places in Kerala"
    if religion == 'mosque':
        title = "🕌 Mosques in Kerala"
    elif religion == 'church':
        title = "⛪ Churches in Kerala"
    elif religion == 'temple':
        title = "🛕 Temples in Kerala"
    
    lines = [title, ""]
    
    for i, place in enumerate(sorted_sacred[:10], 1):
        emoji = get_category_emoji(place.get('category', ''))
        name = place.get('name', 'Unknown')
        district = place.get('district', 'Unknown')
        desc = place.get('description', '')
        rating = place.get('rating', 0)
        
        lines.append(f"{i}. {emoji} {name} ({district})")
        if desc:
            lines.append(f"   {safe_truncate(desc, 100)}")
        if rating and rating > 0:
            lines.append(f"   ⭐ {rating}/5")
        lines.append("")
    
    lines.append("💡 Tips:")
    lines.append("• 👘 Dress modestly when visiting sacred places")
    lines.append("• 📸 Ask permission before taking photos")
    lines.append("• 📅 Check timings before visiting")
    lines.append("• 🙏 Respect local customs and traditions")
    
    return "\n".join(lines)

def build_no_results_answer() -> str:
    return """🔍 I couldn't find any destinations matching your query.

💡 Try these examples:

• "best places in Kannur"
• "beaches in Kerala"
• "hill stations in Idukki"
• "waterfalls in Thrissur"
• "backwaters in Alappuzha"
• "Hidden gems in Wayanad"
• "one best hill station"
• "Budget trekking itinerary for Munnar"
• "A 3-day trip to Varkala"
• "Family-friendly plan in Kochi"
• "Monsoon waterfalls itinerary"
• "Plan a backwater escape in Kerala"
• "Plan a 4-day backwater escape in Alleppey"
• "sacred places"
• "mosques in Kerala"
• "temples in Kerala"
• "churches in Kerala"
• "Active Planet"
• "park in Kannur"
• "Vazhamala"
• "Munnar"
• "Bekal Fort"
• "Kovalam Beach"
• "knowledge city"
• "Markaz" """

def build_greeting_response() -> str:
    return """👋 Hi! I'm your Kerala travel assistant.

I can help you with:
• 🗺️ Destinations - Best places in Kerala
• 🏖️ Beaches - Coastal getaways
• ⛰️ Hill Stations - Mountain retreats
• 💧 Waterfalls - Cascading beauty
• 🚣 Backwaters - Houseboat experiences
• 🐘 Wildlife - Sanctuaries and safaris
• 🛕 Temples - Sacred sites
• 🕌 Mosques - Islamic heritage
• ⛪ Churches - Christian heritage
• 💰 Budget - Travel cost planning
• 📅 Itineraries - Day-by-day plans
• 👨‍👩‍👧‍👦 Family - Kid-friendly places

💡 Try asking:
• "14 districts best places list"
• "best places in Kannur"
• "park in Kannur"
• "Active Planet"
• "sacred places"
• "mosques in Kerala"
• "temples in Kerala"
• "Vazhamala"
• "Budget trekking itinerary for Munnar"
• "A 3-day trip to Varkala"
• "Family-friendly plan in Kochi"
• "Hidden gems in Wayanad"
• "Monsoon waterfalls itinerary"
• "Plan a backwater escape in Kerala"
• "Plan a 4-day backwater escape in Alleppey"
• "knowledge city"
• "Markaz" """

# ============================================
# AI CHAT VIEW
# ============================================

class AIChatView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            query = request.data.get('query', '')
            session_id = request.data.get('session_id', None)
            
            if not session_id:
                session_id = str(uuid.uuid4())
            
            if not query:
                return Response({
                    'success': False,
                    'error': 'Query is required'
                }, status=400)
            
            print(f"📝 Query: '{query}'")
            
            destinations = get_destinations()
            query_clean = query.lower().strip()
            
            # ============================================
            # 1. CHECK FOR HIDDEN GEMS (HIGHEST PRIORITY)
            # ============================================
            hidden_keywords = ['hidden', 'offbeat', 'unknown', 'lesser known', 'secret', 'untouched', 'off the tourist trail', 'offbeat']
            if any(p in query_clean for p in hidden_keywords):
                return Response({
                    'success': True,
                    'result': {
                        'answer': build_hidden_gems_answer(query, destinations),
                        'destinations': []
                    },
                    'session_id': session_id
                })
            
            # ============================================
            # 2. CHECK NAME MAPPINGS
            # ============================================
            mapped_name = get_mapped_name(query_clean)
            if mapped_name:
                for dest in destinations:
                    if dest.get('name', '').lower() == mapped_name.lower():
                        return Response({
                            'success': True,
                            'result': {
                                'answer': build_destination_detail(dest),
                                'destinations': [dest]
                            },
                            'session_id': session_id
                        })
                results = search_data(mapped_name, destinations, 5)
                if results:
                    return Response({
                        'success': True,
                        'result': {
                            'answer': build_general_answer(query, results),
                            'destinations': results[:5]
                        },
                        'session_id': session_id
                    })
            
            # ============================================
            # 3. CHECK FOR ITINERARY / PLAN QUERIES
            # ============================================
            itinerary_keywords = ['itinerary', 'plan', 'trip', 'schedule', 'day trip', 'escape', 'built around']
            
            is_itinerary_query = any(p in query_clean for p in itinerary_keywords)
            
            # Special cases: specific destination + activity combinations
            if 'munnar' in query_clean and ('trekking' in query_clean or 'trek' in query_clean):
                is_itinerary_query = True
            if 'varkala' in query_clean and ('sunset' in query_clean or 'sun set' in query_clean):
                is_itinerary_query = True
            if 'alleppey' in query_clean and ('backwater' in query_clean or 'escape' in query_clean):
                is_itinerary_query = True
            if 'waterfall' in query_clean and ('monsoon' in query_clean or 'itinerary' in query_clean):
                is_itinerary_query = True
            
            if is_itinerary_query:
                return Response({
                    'success': True,
                    'result': {
                        'answer': build_itinerary_answer(query, destinations),
                        'destinations': []
                    },
                    'session_id': session_id
                })
            
            # ============================================
            # 4. CHECK FOR EXACT NAME MATCH
            # ============================================
            for dest in destinations:
                if dest.get('name', '').lower() == query_clean:
                    return Response({
                        'success': True,
                        'result': {
                            'answer': build_destination_detail(dest),
                            'destinations': [dest]
                        },
                        'session_id': session_id
                    })
            
            # ============================================
            # 5. DISTRICT + CATEGORY QUERIES (e.g., "park in kannur")
            # ============================================
            district = detect_district(query_clean)
            category = detect_category(query_clean)
            
            if district and category:
                # Special handling for park/garden queries
                if category == 'Park':
                    park_dests = [d for d in destinations if 'park' in d.get('category', '').lower() or 'garden' in d.get('category', '').lower()]
                    district_park_dests = [d for d in park_dests if d.get('district', '').lower() == district.lower()]
                    
                    if district_park_dests:
                        return Response({
                            'success': True,
                            'result': {
                                'answer': build_district_answer(district, destinations, 'Park'),
                                'destinations': []
                            },
                            'session_id': session_id
                        })
                
                return Response({
                    'success': True,
                    'result': {
                        'answer': build_district_answer(district, destinations, category),
                        'destinations': []
                    },
                    'session_id': session_id
                })
            
            # ============================================
            # 6. SACRED / RELIGION QUERIES
            # ============================================
            religion_keywords = ['sacred', 'holy', 'pilgrimage', 'mosque', 'masjid', 'church', 'temple', 'spiritual']
            if any(kw in query_clean for kw in religion_keywords):
                return Response({
                    'success': True,
                    'result': {
                        'answer': build_sacred_answer(query, destinations),
                        'destinations': []
                    },
                    'session_id': session_id
                })
            
            # ============================================
            # 7. ALL DISTRICTS
            # ============================================
            if any(p in query_clean for p in ['14 district', 'all district', '14 districts', 'all districts', 'all 14']):
                return Response({
                    'success': True,
                    'result': {
                        'answer': build_all_districts_answer(destinations),
                        'destinations': []
                    },
                    'session_id': session_id
                })
            
            # ============================================
            # 8. DISTRICT QUERIES
            # ============================================
            if district and any(p in query_clean for p in ['best', 'place', 'places', 'top', 'list']):
                return Response({
                    'success': True,
                    'result': {
                        'answer': build_district_answer(district, destinations),
                        'destinations': []
                    },
                    'session_id': session_id
                })
            
            # ============================================
            # 9. HILL STATION / TREKKING QUERIES
            # ============================================
            if any(p in query_clean for p in ['hill', 'mountain', 'peak']):
                return Response({
                    'success': True,
                    'result': {
                        'answer': build_hill_station_answer(query, destinations),
                        'destinations': []
                    },
                    'session_id': session_id
                })
            
            # ============================================
            # 10. BACKWATER QUERIES
            # ============================================
            if any(p in query_clean for p in ['backwater', 'backwaters', 'houseboat', 'lake']):
                return Response({
                    'success': True,
                    'result': {
                        'answer': build_backwater_answer(query, destinations),
                        'destinations': []
                    },
                    'session_id': session_id
                })
            
            # ============================================
            # 11. WATERFALL QUERIES
            # ============================================
            if any(p in query_clean for p in ['waterfall', 'waterfalls', 'falls']):
                return Response({
                    'success': True,
                    'result': {
                        'answer': build_waterfall_answer(query, destinations),
                        'destinations': []
                    },
                    'session_id': session_id
                })
            
            # ============================================
            # 12. CATEGORY QUERIES
            # ============================================
            if category:
                category_handlers = {
                    'Hill Station': build_hill_station_answer,
                    'Beach': lambda q, d: build_general_answer(q, [x for x in d if 'beach' in x.get('category', '').lower()]),
                    'Backwater': build_backwater_answer,
                    'Waterfall': build_waterfall_answer,
                    'Wildlife': lambda q, d: build_general_answer(q, [x for x in d if 'wildlife' in x.get('category', '').lower() or 'sanctuary' in x.get('category', '').lower()]),
                    'Temple': lambda q, d: build_general_answer(q, [x for x in d if 'temple' in x.get('category', '').lower()]),
                    'Heritage': lambda q, d: build_general_answer(q, [x for x in d if 'heritage' in x.get('category', '').lower() or 'fort' in x.get('category', '').lower()]),
                    'Park': lambda q, d: build_general_answer(q, [x for x in d if 'park' in x.get('category', '').lower() or 'garden' in x.get('category', '').lower()]),
                    'Museum': lambda q, d: build_general_answer(q, [x for x in d if 'museum' in x.get('category', '').lower()]),
                    'Sacred': build_sacred_answer,
                }
                handler = category_handlers.get(category)
                if handler:
                    return Response({
                        'success': True,
                        'result': {
                            'answer': handler(query, destinations),
                            'destinations': []
                        },
                        'session_id': session_id
                    })
            
            # ============================================
            # 13. ONE BEST
            # ============================================
            if 'one best' in query_clean:
                return Response({
                    'success': True,
                    'result': {
                        'answer': build_hill_station_answer(query, destinations),
                        'destinations': []
                    },
                    'session_id': session_id
                })
            
            # ============================================
            # 14. GREETINGS
            # ============================================
            if any(w in query_clean for w in ['hi', 'hello', 'hey', 'good morning', 'good evening']):
                return Response({
                    'success': True,
                    'result': {
                        'answer': build_greeting_response(),
                        'destinations': []
                    },
                    'session_id': session_id
                })
            
            # ============================================
            # 15. GENERAL SEARCH
            # ============================================
            results = search_data(query, destinations, 10, district)
            
            if not results:
                return Response({
                    'success': True,
                    'result': {
                        'answer': build_no_results_answer(),
                        'destinations': []
                    },
                    'session_id': session_id
                })
            
            return Response({
                'success': True,
                'result': {
                    'answer': build_general_answer(query, results),
                    'destinations': results[:5]
                },
                'session_id': session_id
            })
            
        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()
            return Response({
                'success': False,
                'error': str(e),
                'message': 'Failed to process request'
            }, status=400)