// frontend/src/services/aiService.js - CLEAN RESPONSES

import api from './api';

const API_BASE = 'http://localhost:8000/api';

let destinationsCache = null;
let destinationsCacheTime = null;
const CACHE_DURATION = 5 * 60 * 1000;

// ============================================
// FETCH DATA
// ============================================

const fetchAllDestinations = async () => {
    if (destinationsCache && destinationsCacheTime && (Date.now() - destinationsCacheTime) < CACHE_DURATION) {
        return destinationsCache;
    }

    try {
        let allDestinations = [];

        try {
            const response = await api.get('/destinations/');
            if (response.data) {
                let dests = [];
                if (response.data.results && Array.isArray(response.data.results)) {
                    dests = response.data.results;
                } else if (Array.isArray(response.data)) {
                    dests = response.data;
                } else if (response.data.destinations && Array.isArray(response.data.destinations)) {
                    dests = response.data.destinations;
                }
                for (const dest of dests) {
                    allDestinations.push({
                        id: dest.id || dest.destination_id,
                        name: dest.name || dest.title || 'Unknown',
                        district: dest.district || dest.location || '',
                        description: dest.description || dest.about || '',
                        image: dest.image || dest.image_url || '',
                        type: dest.type || 'well-known',
                        rating: dest.rating || dest.average_rating || 0,
                        category: dest.category || 'Unknown',
                    });
                }
            }
        } catch (e) { /* ignore */ }

        if (allDestinations.length === 0) {
            try {
                const resp = await api.get('/suggestions/implemented/', { params: { limit: 200 } });
                if (resp.data && resp.data.data) {
                    for (const s of resp.data.data) {
                        allDestinations.push({
                            id: s.id,
                            name: s.name || s.title,
                            district: s.district || '',
                            description: s.description || '',
                            image: s.image || '',
                            type: 'suggestion',
                            rating: s.rating || 0,
                            category: 'Suggestion',
                        });
                    }
                }
            } catch (e) { /* ignore */ }
        }

        destinationsCache = allDestinations;
        destinationsCacheTime = Date.now();
        return allDestinations;
    } catch (error) {
        return [];
    }
};

// ============================================
// SEARCH
// ============================================

const searchDestinations = (query, destinations, topK = 10) => {
    if (!destinations || destinations.length === 0) return [];
    const words = query.toLowerCase().trim().split(/\s+/);
    const scored = destinations.map(dest => {
        let score = 0;
        const searchText = [dest.name, dest.district, dest.description, dest.category]
            .join(' ').toLowerCase();
        if (searchText.includes(query.toLowerCase())) score += 10;
        for (const w of words) {
            if (w.length < 2) continue;
            if ((dest.name || '').toLowerCase().includes(w)) score += 5;
            if ((dest.district || '').toLowerCase().includes(w)) score += 4;
            if ((dest.description || '').toLowerCase().includes(w)) score += 3;
        }
        return { ...dest, score };
    });
    return scored.filter(d => d.score > 0).sort((a,b) => b.score - a.score).slice(0, topK);
};

// ============================================
// GENERATE CLEAN ANSWER
// ============================================

function generateAnswer(query, destinations) {
    if (!destinations || destinations.length === 0) {
        return `🔍 I couldn't find any destinations matching your query.\n\n💡 Try these examples:\n• "14 districts best places list"\n• "beaches in Kerala"\n• "hill stations in Idukki"\n• "waterfalls in Thrissur"\n• "best places in Kannur"`;
    }
    let answer = `🔍 Found ${destinations.length} matching destinations:\n\n`;
    destinations.slice(0, 5).forEach((d, i) => {
        const stars = '⭐'.repeat(Math.round(d.rating || 0) || 0);
        answer += `${i+1}. ${d.name || 'Unknown'}`;
        if (d.district) answer += ` (${d.district})`;
        answer += '\n';
        if (d.description) answer += `   ${d.description.substring(0, 80)}...\n`;
        if (d.rating) answer += `   ${stars} ${d.rating}\n`;
        answer += '\n';
    });
    if (destinations.length > 5) {
        answer += `✨ And ${destinations.length - 5} more results...\n\n`;
    }
    answer += `💡 Tips:\n• Ask for more details about any place\n• Try "best places in [district]" for specific locations`;
    return answer;
}

// ============================================
// AI SERVICE
// ============================================

export const aiService = {
    async ask(query, sessionId = null) {
        const destinations = await fetchAllDestinations();
        const searchResults = searchDestinations(query, destinations, 10);

        try {
            const response = await fetch(`${API_BASE}/ai/chat/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    query, 
                    mode: 'answer', 
                    session_id: sessionId 
                })
            });
            if (!response.ok) throw new Error('API error');
            const data = await response.json();
            if (data.success && data.result?.answer) {
                return {
                    answer: data.result.answer,
                    destinations: data.result.destinations || searchResults,
                    success: true
                };
            }
        } catch (error) {
            console.warn('AI API fallback:', error);
        }

        // Fallback with clean answer
        return {
            answer: generateAnswer(query, searchResults),
            destinations: searchResults,
            success: true
        };
    },

    async search(query, topK = 10) {
        const destinations = await fetchAllDestinations();
        const results = searchDestinations(query, destinations, topK);
        return { results, count: results.length, success: true };
    },

    async planTrip(query) {
        const result = await this.ask(query);
        return {
            itinerary: result.answer || 'No itinerary available',
            destinations: result.destinations || [],
            success: result.success
        };
    }
};

export default aiService;