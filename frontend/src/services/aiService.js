// services/aiService.js - FIXED API CALLS

const API_BASE = 'http://localhost:8000/api';

export const aiService = {
    async chat(query, mode = 'answer', filters = {}) {
        console.log('📡 Calling API:', { query, mode });
        
        try {
            const response = await fetch(`${API_BASE}/ai/chat/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    query, 
                    mode, 
                    filters,
                    top_k: 10 
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('📡 API Response:', data);
            
            return data;
        } catch (error) {
            console.error('❌ API Call Failed:', error);
            // Return a fallback response instead of throwing
            return {
                success: false,
                error: error.message,
                message: 'API call failed, using local data',
                result: {
                    answer: "⚠️ API connection failed. Please check if Django server is running on port 8000.\n\n" + generateFallbackResponse(query)
                }
            };
        }
    },
    
    async ask(query) {
        try {
            const result = await this.chat(query, 'answer');
            
            if (result.success) {
                return {
                    answer: result.result?.answer || 'No answer available',
                    destinations: result.result?.destinations || [],
                    success: true
                };
            } else {
                // Return fallback
                return {
                    answer: "⚠️ " + (result.message || 'API error') + "\n\n" + generateFallbackResponse(query),
                    destinations: [],
                    success: false
                };
            }
        } catch (error) {
            console.error('❌ Ask error:', error);
            return {
                answer: "⚠️ Error: " + error.message + "\n\n" + generateFallbackResponse(query),
                destinations: [],
                success: false
            };
        }
    },
    
    async search(query, topK = 10) {
        const result = await this.chat(query, 'search');
        return {
            results: result.results || [],
            count: result.count || 0,
            success: result.success !== false
        };
    },
    
    async planTrip(query) {
        const result = await this.chat(query, 'plan');
        return {
            itinerary: result.result?.itinerary || result.message || 'No itinerary available',
            destinations: result.result?.destinations || [],
            success: result.success !== false
        };
    }
};

// Fallback response generator
function generateFallbackResponse(query) {
    const lower = query.toLowerCase();
    
    if (lower.includes('hill') || lower.includes('mountain') || lower.includes('trek')) {
        return `⛰️ **Here are the best hill stations for trekking in Kerala:**

1. **Ranipuram** (Kasargod)
   A scenic hill station with lush green forests.
   ⭐ 4.8 · trekking · nature · hills

2. **Paithalmala** (Kannur)
   The highest peak in Kannur with stunning sunrise views.
   ⭐ 4.7 · trekking · nature · hills

3. **Munnar** (Idukki)
   Famous tea gardens and rolling hills.
   ⭐ 4.8 · tea · nature · hills

4. **Chembra Peak** (Wayanad)
   Heart-shaped lake and panoramic views.
   ⭐ 4.3 · trekking · wildlife · hills

5. **Meesapulimala** (Idukki)
   Second highest peak in South India.
   ⭐ 4.8 · trekking · nature · hills

💡 **Tips:**
• Start your trek early morning
• Carry sufficient water and snacks
• Wear comfortable trekking shoes`;
    }
    
    if (lower.includes('14 district') || lower.includes('all district')) {
        return `🗺️ **Best places across all 14 districts of Kerala:**

1. **Munnar** (Idukki)
   Beautiful hill station with tea gardens.

2. **Muzhappilangad Beach** (Kannur)
   Asia's longest drive-in beach.

3. **Paithalmala** (Kannur)
   The highest peak in Kannur.

4. **Varkala Beach** (Thiruvananthapuram)
   Stunning beach with dramatic cliffs.

5. **Alleppey Backwaters** (Alappuzha)
   World-famous backwaters with houseboat cruises.

6. **Chembra Peak** (Wayanad)
   Heart-shaped lake with panoramic views.

7. **Bekal Fort** (Kasargod)
   Historic fort with stunning ocean views.

8. **Athirappilly Waterfalls** (Thrissur)
   The Niagara of India.

9. **Periyar Wildlife Sanctuary** (Idukki)
   Protected reserve with elephants and tigers.

10. **Kumarakom Backwaters** (Kottayam)
    Peaceful backwaters with bird sanctuary.

💡 **Tips:**
• Best time to visit: October to March
• Each district has unique attractions
• Plan 2-3 days per district`;
    }
    
    if (lower.includes('kannur')) {
        return `📍 **Top destinations in Kannur district:**

1. **Paithalmala** (Kannur)
   The highest peak in Kannur with stunning sunrise views.
   ⭐ 4.7 · trekking · nature · hills

2. **Muzhappilangad Beach** (Kannur)
   Asia's longest drive-in beach.
   ⭐ 4.5 · beach · drive-in · sunset

3. **Payyambalam Beach** (Kannur)
   Popular local beach with beautiful sunset views.

4. **Kavvayi Backwaters** (Kannur)
   North Kerala's largest island-heavy backwater system.

5. **St. Angelo Fort** (Kannur)
   Historic Portuguese fort.

💡 **Tips:**
• Best time to visit: October to March
• Check local transportation options
• Don't miss local seafood`;
    }
    
    if (lower.includes('without beach') || lower.includes('no beach')) {
        return `🌿 **Exploring Kerala beyond beaches - here are beautiful alternatives:**

1. **Munnar** (Idukki)
   Beautiful hill station with tea gardens.
   ⭐ 4.8 · tea · nature · hills

2. **Alleppey Backwaters** (Alappuzha)
   World-famous backwaters with houseboat cruises.
   ⭐ 4.9 · backwaters · houseboat · nature

3. **Chembra Peak** (Wayanad)
   Heart-shaped lake and panoramic views.
   ⭐ 4.3 · trekking · wildlife · hills

4. **Athirappilly Waterfalls** (Thrissur)
   The Niagara of India - spectacular waterfall.
   ⭐ 4.7 · waterfall · nature · scenic

5. **Periyar Wildlife Sanctuary** (Idukki)
   Protected reserve with elephants and tigers.
   ⭐ 4.7 · wildlife · nature · forest

💡 **Tips:**
• Kerala has diverse landscapes beyond beaches
• Explore hills, backwaters, and wildlife
• Visit early morning for peaceful experience`;
    }
    
    return `✨ **Here are some popular destinations in Kerala:**

1. **Munnar** (Idukki)
   Beautiful hill station with tea gardens.
   ⭐ 4.8 · tea · nature · hills

2. **Alleppey Backwaters** (Alappuzha)
   World-famous houseboat experience.
   ⭐ 4.9 · backwaters · houseboat

3. **Varkala Beach** (Thiruvananthapuram)
   Stunning beach with dramatic cliffs.
   ⭐ 4.6 · beach · cliff · sunset

💡 **Tips:**
• Best time to visit: October to March
• Try local Kerala cuisine
• Book accommodations in advance`;
}

export default aiService;