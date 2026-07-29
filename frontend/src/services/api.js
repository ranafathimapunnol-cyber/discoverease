// src/services/api.js - COMPLETE FIXED VERSION

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true,  // ✅ CRITICAL for session cookies
});

// ============================================
// CSRF TOKEN HANDLING
// ============================================
const getCSRFToken = () => {
    // Try to get from cookie
    const name = 'csrftoken';
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [key, value] = cookie.trim().split('=');
        if (key === name) {
            return decodeURIComponent(value);
        }
    }
    return null;
};

// ============================================
// IMAGE URL INTERCEPTOR
// ============================================
api.interceptors.response.use(
    (response) => {
        const convertImageUrls = (obj) => {
            if (!obj) return obj;
            
            if (Array.isArray(obj)) {
                return obj.map(item => convertImageUrls(item));
            }
            
            if (typeof obj === 'object') {
                const newObj = { ...obj };
                
                const imageKeys = ['image', 'image_url', 'profile_image', 'avatar', 'photo', 'img', 'picture', 'thumbnail', 'banner', 'profile_picture', 'cover_image'];
                
                for (const key of imageKeys) {
                    if (newObj[key] && typeof newObj[key] === 'string') {
                        const value = newObj[key];
                        if (value.startsWith('/media/') || value.startsWith('/uploads/') || value.startsWith('/static/')) {
                            const baseURL = api.defaults.baseURL || 'http://localhost:8000';
                            const cleanBase = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
                            const mediaBase = cleanBase.replace('/api', '');
                            newObj[key] = `${mediaBase}${value}`;
                        }
                    }
                }
                
                for (const key of Object.keys(newObj)) {
                    if (newObj[key] && typeof newObj[key] === 'object') {
                        newObj[key] = convertImageUrls(newObj[key]);
                    }
                }
                
                return newObj;
            }
            
            return obj;
        };
        
        if (response.data) {
            response.data = convertImageUrls(response.data);
        }
        
        return response;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// ============================================
// AUTH SERVICE - Session Based
// ============================================
export const AuthService = {
    getUser: () => {
        try {
            const userData = sessionStorage.getItem('user');
            if (userData && userData !== 'null' && userData !== 'undefined') {
                return JSON.parse(userData);
            }
            return null;
        } catch {
            return null;
        }
    },
    getRole: () => sessionStorage.getItem('role') || 'tourister',
    getSessionKey: () => sessionStorage.getItem('session_key'),
    
    setAuth: (user, sessionKey, role) => {
        if (user) {
            sessionStorage.setItem('user', JSON.stringify(user));
            sessionStorage.setItem('role', role || user.role || 'tourister');
        }
        if (sessionKey) {
            sessionStorage.setItem('session_key', sessionKey);
        }
    },
    
    clearAuth: () => {
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('role');
        sessionStorage.removeItem('session_key');
    },
    
    isLoggedIn: () => {
        const user = sessionStorage.getItem('user');
        return user && user !== 'null' && user !== 'undefined';
    },
    
    getDashboardUrl: () => {
        const role = AuthService.getRole();
        const dashboards = {
            'tourister': '/',
            'guide': '/guide-dashboard',
            'staff': '/staff-dashboard',
            'admin': '/admin-dashboard',
        };
        return dashboards[role] || '/';
    },
};

// ============================================
// API REQUEST INTERCEPTOR - WITH CSRF TOKEN
// ============================================
api.interceptors.request.use(
    (config) => {
        // Add session key if available
        const sessionKey = AuthService.getSessionKey();
        if (sessionKey) {
            config.headers['X-Session-Key'] = sessionKey;
        }
        
        // ✅ Add CSRF token for non-GET requests
        if (config.method && config.method.toLowerCase() !== 'get') {
            const csrfToken = getCSRFToken();
            if (csrfToken) {
                config.headers['X-CSRFToken'] = csrfToken;
            }
        }
        
        console.log(`📤 ${config.method.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => Promise.reject(error)
);

// ============================================
// API RESPONSE INTERCEPTOR - SESSION HANDLING
// ============================================
api.interceptors.response.use(
    (response) => {
        // ✅ Check if session is still valid
        if (response.data && response.data.success === false) {
            if (response.data.error === 'Not authenticated' || 
                response.data.error === 'Session expired' ||
                response.data.error === 'Invalid session') {
                AuthService.clearAuth();
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login?error=session_expired';
                }
                return Promise.reject(new Error('Session expired'));
            }
        }
        return response;
    },
    (error) => {
        console.error('API Error:', error.response?.status, error.response?.data);
        
        // ✅ Handle session expiration
        if (error.response?.status === 401 || error.response?.status === 403) {
            const errorData = error.response?.data || {};
            
            // Check if it's a session error
            if (errorData.error === 'Session expired' || 
                errorData.error === 'Not authenticated' ||
                errorData.error === 'Invalid session' ||
                errorData.detail === 'Authentication credentials were not provided.') {
                AuthService.clearAuth();
                if (!window.location.pathname.includes('/login') && 
                    !window.location.pathname.includes('/register')) {
                    window.location.href = '/login?error=session_expired';
                }
            }
        }
        return Promise.reject(error);
    }
);

export const ensureAuth = () => {
    const user = AuthService.getUser();
    if (!user) {
        console.warn('⚠️ Not authenticated');
        return false;
    }
    return true;
};

// ============================================
// SESSION KEEP-ALIVE - EXPORTED FUNCTIONS
// ============================================
let sessionKeepAliveInterval = null;

export const startSessionKeepAlive = (intervalMs = 60000) => {
    // Clear any existing interval
    if (sessionKeepAliveInterval) {
        clearInterval(sessionKeepAliveInterval);
        sessionKeepAliveInterval = null;
    }
    
    // Only start if user is logged in
    if (!AuthService.isLoggedIn()) {
        console.log('🔄 User not logged in, skipping session keep-alive');
        return;
    }
    
    console.log(`🔄 Starting session keep-alive every ${intervalMs}ms`);
    
    // Ping immediately
    AuthAPI.ping().catch(() => {});
    
    // Set up interval
    sessionKeepAliveInterval = setInterval(() => {
        AuthAPI.ping().catch(() => {});
    }, intervalMs);
};

export const stopSessionKeepAlive = () => {
    if (sessionKeepAliveInterval) {
        console.log('🔄 Stopping session keep-alive');
        clearInterval(sessionKeepAliveInterval);
        sessionKeepAliveInterval = null;
    }
};

// ============================================
// AUTH API
// ============================================
export const AuthAPI = {
    // ============================================
    // AUTHENTICATION - Session Based
    // ============================================
    login: async (email, password, rememberMe = false) => {
        try {
            const response = await api.post('/auth/login/', { 
                email, 
                password, 
                remember_me: rememberMe 
            });
            
            if (response.data && response.data.success) {
                const { user, session_key, role } = response.data;
                AuthService.setAuth(user, session_key, role);
            }
            return response.data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },
    
    register: async (userData) => {
        try {
            const response = await api.post('/auth/register/', userData);
            return response.data;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    },
    
    logout: async () => {
        try {
            const response = await api.post('/auth/logout/');
            AuthService.clearAuth();
            return response.data;
        } catch (error) {
            console.error('Logout error:', error);
            AuthService.clearAuth();
            throw error;
        }
    },
    
    getMe: async () => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            const response = await api.get('/auth/me/');
            if (response.data && response.data.success && response.data.user) {
                AuthService.setAuth(response.data.user, null, response.data.user.role);
            }
            return response.data;
        } catch (error) {
            console.error('Get me error:', error);
            if (error.response?.status === 401) {
                AuthService.clearAuth();
            }
            throw error;
        }
    },
    
    // ============================================
    // GOOGLE AUTH
    // ============================================
    googleLogin: async () => {
        try {
            const response = await api.get('/auth/google-login/');
            return response.data;
        } catch (error) {
            console.error('Google login error:', error);
            throw error;
        }
    },

    googleCallback: async (code, role = 'tourister') => {
        try {
            const response = await api.post('/auth/google-auth/', { 
                code, 
                role 
            });
            
            if (response.data && response.data.success) {
                const { user, session_key, role: userRole } = response.data;
                AuthService.setAuth(user, session_key, userRole);
            }
            return response.data;
        } catch (error) {
            console.error('Google callback error:', error);
            throw error;
        }
    },
    
    // ============================================
    // SESSION MANAGEMENT
    // ============================================
    ping: async () => {
        try {
            if (!AuthService.isLoggedIn()) return { success: true };
            const response = await api.get('/auth/ping/');
            console.log('🔄 Session ping successful');
            return response.data;
        } catch (error) {
            // ✅ If ping returns 404, the endpoint doesn't exist - just return success
            if (error.response?.status === 404) {
                console.log('⚠️ Ping endpoint not found, ignoring');
                return { success: true };
            }
            console.warn('⚠️ Session ping failed:', error.message);
            if (error.response?.status === 401) {
                AuthService.clearAuth();
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login?error=session_expired';
                }
            }
            throw error;
        }
    },
    
    refreshSession: async () => {
        try {
            if (!AuthService.isLoggedIn()) return { success: false };
            const response = await api.post('/auth/refresh-session/');
            if (response.data && response.data.success) {
                const { user, session_key } = response.data;
                AuthService.setAuth(user, session_key);
            }
            return response.data;
        } catch (error) {
            console.warn('⚠️ Session refresh failed:', error.message);
            if (error.response?.status === 401) {
                AuthService.clearAuth();
            }
            throw error;
        }
    },
    
    // ============================================
    // PROFILE DATA
    // ============================================
    getProfileData: async () => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            console.log('📊 Fetching profile data...');
            const response = await api.get('/auth/profile-data/');
            console.log('📊 Profile data response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error fetching profile data:', error);
            // Try alternative endpoint
            try {
                console.log('🔄 Trying alternative endpoint...');
                const altResponse = await api.get('/auth/profile-data');
                return altResponse.data;
            } catch (altError) {
                console.error('Alternative endpoint also failed:', altError);
                throw error;
            }
        }
    },
    
    updateProfile: async (data) => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            const response = await api.patch('/auth/update-profile/', data);
            if (response.data && response.data.success && response.data.user) {
                AuthService.setAuth(response.data.user, null, response.data.user.role);
            }
            return response.data;
        } catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    },
    
    changePassword: async (data) => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            const response = await api.post('/auth/change-password/', data);
            return response.data;
        } catch (error) {
            console.error('Change password error:', error);
            throw error;
        }
    },
    
    verifyEmail: async (token) => {
        try {
            const response = await api.get(`/auth/verify-email/?token=${token}`);
            return response.data;
        } catch (error) {
            console.error('Verify email error:', error);
            throw error;
        }
    },
    
    resendVerification: async (email) => {
        try {
            const response = await api.post('/auth/resend-verification/', { email });
            return response.data;
        } catch (error) {
            console.error('Resend verification error:', error);
            throw error;
        }
    },

    // ============================================
    // WISHLIST
    // ============================================
    getWishlist: async () => {
        try {
            if (!ensureAuth()) {
                return { success: false, data: [], count: 0, error: 'Not authenticated' };
            }
            const response = await api.get('/destinations/wishlist/');
            return response.data;
        } catch (error) {
            console.error('Error fetching wishlist:', error);
            throw error;
        }
    },
    
    toggleWishlist: async (destinationId) => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            const response = await api.post('/destinations/wishlist/toggle/', { 
                destination_id: destinationId 
            });
            return response.data;
        } catch (error) {
            console.error('Error toggling wishlist:', error);
            throw error;
        }
    },
    
    removeFromWishlist: async (wishlistId) => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            const response = await api.delete(`/destinations/wishlist/${wishlistId}/`);
            return response.data;
        } catch (error) {
            console.error('Error removing from wishlist:', error);
            throw error;
        }
    },
    
    checkWishlist: async (destinationId) => {
        try {
            if (!ensureAuth()) {
                return { success: false, in_wishlist: false, error: 'Not authenticated' };
            }
            const response = await api.get(`/destinations/wishlist/check/?destination_id=${destinationId}`);
            return response.data;
        } catch (error) {
            console.error('Error checking wishlist:', error);
            return { success: false, in_wishlist: false };
        }
    },
    
    getWishlistCount: async () => {
        try {
            if (!ensureAuth()) {
                return { success: false, count: 0 };
            }
            const response = await api.get('/destinations/wishlist/count/');
            return response.data;
        } catch (error) {
            console.error('Error getting wishlist count:', error);
            return { success: false, count: 0 };
        }
    },

    // ============================================
    // DESTINATIONS
    // ============================================
    getDestinations: async (params = {}) => {
        try {
            const response = await api.get('/destinations/destinations/', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching destinations:', error);
            throw error;
        }
    },
    
    getDestination: async (id) => {
        try {
            const response = await api.get(`/destinations/destinations/${id}/`);
            return response.data;
        } catch (error) {
            console.error('Error fetching destination:', error);
            throw error;
        }
    },
    
    createDestination: async (data) => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            const response = await api.post('/destinations/destinations/', data);
            return response.data;
        } catch (error) {
            console.error('Error creating destination:', error);
            throw error;
        }
    },
    
    updateDestination: async (id, data) => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            const response = await api.put(`/destinations/destinations/${id}/`, data);
            return response.data;
        } catch (error) {
            console.error('Error updating destination:', error);
            throw error;
        }
    },
    
    deleteDestination: async (id) => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            const response = await api.delete(`/destinations/destinations/${id}/`);
            return response.data;
        } catch (error) {
            console.error('Error deleting destination:', error);
            throw error;
        }
    },
    
    addReview: async (destinationId, data) => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            const response = await api.post(`/destinations/destinations/${destinationId}/add_review/`, data);
            return response.data;
        } catch (error) {
            console.error('Error adding review:', error);
            throw error;
        }
    },
    
    getReviews: async (destinationId) => {
        try {
            const response = await api.get(`/destinations/destinations/${destinationId}/reviews/`);
            return response.data;
        } catch (error) {
            console.error('Error fetching reviews:', error);
            throw error;
        }
    },

    // ============================================
    // CATEGORY API
    // ============================================
    getCategoryData: async () => {
        try {
            const response = await api.get('/destinations/destinations/category-data/');
            if (response.data && response.data.success) {
                return response.data;
            }
            return { success: true, data: [] };
        } catch (error) {
            console.error('Error fetching category data:', error);
            return { success: false, data: [], error: error.message };
        }
    },
    
    getCategory: async (categoryKey) => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            const response = await api.get(`/destinations/destinations/admin/categories/${categoryKey}/`);
            return response.data;
        } catch (error) {
            console.error('Error fetching category:', error);
            throw error;
        }
    },
    
    addCategory: async (data) => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            const response = await api.post('/destinations/destinations/add-category/', data);
            return response.data;
        } catch (error) {
            console.error('Error adding category:', error);
            throw error;
        }
    },
    
    editCategory: async (categoryKey, data) => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            const response = await api.patch(`/destinations/destinations/admin/categories/${categoryKey}/edit/`, data);
            return response.data;
        } catch (error) {
            console.error('Error editing category:', error);
            throw error;
        }
    },
    
    deleteCategory: async (categoryKey) => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            const response = await api.delete(`/destinations/destinations/admin/categories/${categoryKey}/`);
            return response.data;
        } catch (error) {
            console.error('Error deleting category:', error);
            throw error;
        }
    },
    
    addPlaceToCategory: async (data) => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            const response = await api.post('/destinations/destinations/add-place/', data);
            return response.data;
        } catch (error) {
            console.error('Error adding place:', error);
            throw error;
        }
    },
    
    updatePlace: async (data) => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            const response = await api.post(`/destinations/destinations/admin/places/${data.place_id}/update/`, data.data);
            return response.data;
        } catch (error) {
            console.error('Error updating place:', error);
            throw error;
        }
    },
    
    deletePlace: async (placeId) => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            const response = await api.delete(`/destinations/destinations/admin/places/${placeId}/`);
            return response.data;
        } catch (error) {
            console.error('Error deleting place:', error);
            throw error;
        }
    },

    getHiddenGems: async () => {
        try {
            const response = await api.get('/destinations/destinations/hidden_gems/');
            return response.data;
        } catch (error) {
            console.error('Error fetching hidden gems:', error);
            throw error;
        }
    },
    
    getTopRated: async () => {
        try {
            const response = await api.get('/destinations/destinations/top_rated/');
            return response.data;
        } catch (error) {
            console.error('Error fetching top rated:', error);
            throw error;
        }
    },
    
    getStats: async () => {
        try {
            const response = await api.get('/destinations/destinations/stats/');
            return response.data;
        } catch (error) {
            console.error('Error fetching stats:', error);
            throw error;
        }
    },
    
    searchDestinations: async (query) => {
        try {
            const response = await api.get(`/destinations/destinations/search/?q=${encodeURIComponent(query)}`);
            return response.data;
        } catch (error) {
            console.error('Error searching destinations:', error);
            throw error;
        }
    },
    
    getByDistrict: async (district) => {
        try {
            const response = await api.get(`/destinations/destinations/by_district/?district=${encodeURIComponent(district)}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching by district:', error);
            throw error;
        }
    },

    // ============================================
    // GUIDES
    // ============================================
    getGuides: async (params = {}) => {
        try {
            const response = await api.get('/guides/guides/', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching guides:', error);
            throw error;
        }
    },
    
    getGuide: async (id) => {
        try {
            const response = await api.get(`/guides/guides/${id}/`);
            return response.data;
        } catch (error) {
            console.error('Error fetching guide:', error);
            throw error;
        }
    },
    
    getGuideBookings: async (guideId) => {
        try {
            if (!ensureAuth()) {
                return { success: true, bookings: [] };
            }
            const response = await api.get(`/guides/guides/${guideId}/bookings/`);
            return response.data;
        } catch (error) {
            console.error('Error fetching guide bookings:', error);
            return { success: true, bookings: [] };
        }
    },
    
    getGuideReviews: async (guideId) => {
        try {
            const response = await api.get(`/guides/guides/${guideId}/reviews/`);
            return response.data;
        } catch (error) {
            console.error('Error fetching guide reviews:', error);
            return { success: true, reviews: [] };
        }
    },
    
    addGuideReview: async (guideId, data) => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            const response = await api.post(`/guides/guides/${guideId}/add_review/`, data);
            return response.data;
        } catch (error) {
            console.error('Error adding guide review:', error);
            throw error;
        }
    },
    
    getGuideAvailability: async (guideId, days = 30) => {
        try {
            const response = await api.get(`/guides/guides/${guideId}/availability/`, {
                params: { days }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching guide availability:', error);
            throw error;
        }
    },
    
    getBulkAvailability: async (guideIds, days = 30) => {
        try {
            const params = {
                guide_ids: Array.isArray(guideIds) ? guideIds.join(',') : guideIds,
                days
            };
            const response = await api.get('/guides/guides/bulk-availability/', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching bulk availability:', error);
            throw error;
        }
    },

    // ============================================
    // SUGGESTIONS
    // ============================================
    getSuggestions: async (params = {}) => {
        try {
            const response = await api.get('/suggestions/', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            throw error;
        }
    },
    
    createSuggestion: async (data) => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            const response = await api.post('/suggestions/', data);
            return response.data;
        } catch (error) {
            console.error('Error creating suggestion:', error);
            throw error;
        }
    },
    
    getSuggestionStats: async () => {
        try {
            const response = await api.get('/suggestions/stats/');
            return response.data;
        } catch (error) {
            console.error('Error fetching suggestion stats:', error);
            throw error;
        }
    },

    // ============================================
    // BOOKINGS
    // ============================================
    getMyBookings: async () => {
        try {
            if (!ensureAuth()) {
                return { success: true, bookings: [] };
            }
            try {
                const response = await api.get('/guides/bookings/');
                console.log('📊 My bookings response:', response.data);
                return response.data;
            } catch (error) {
                console.log('Primary endpoint failed, trying fallback...');
                const fallbackResponse = await api.get('/guides/guides/bookings/');
                return fallbackResponse.data;
            }
        } catch (error) {
            console.error('Error fetching my bookings:', error);
            return { success: true, bookings: [] };
        }
    },
    
    createBooking: async (bookingData) => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            
            console.log('📤 Creating booking with data:', bookingData);
            
            const payload = {
                guide: parseInt(bookingData.guide),
                date: bookingData.date,
                time: bookingData.time,
                duration_hours: parseInt(bookingData.duration_hours) || 4,
                number_of_people: parseInt(bookingData.number_of_people) || 1,
                special_requests: bookingData.special_requests || '',
            };
            
            if (bookingData.district) {
                const districtId = parseInt(bookingData.district);
                if (!isNaN(districtId) && districtId > 0) {
                    payload.district = districtId;
                }
            }
            
            console.log('📤 Final payload:', JSON.stringify(payload, null, 2));
            
            const response = await api.post('/guides/bookings/', payload);
            console.log('✅ Booking response:', response.data);
            return response.data;
            
        } catch (error) {
            console.error('❌ Error creating booking:', error);
            
            if (error.response && error.response.status === 201) {
                console.log('✅ Booking created successfully (201)');
                return error.response.data;
            }
            
            if (error.response && error.response.status === 200) {
                console.log('✅ Booking created successfully (200)');
                return error.response.data;
            }
            
            throw error;
        }
    },
    
    cancelBooking: async (bookingId) => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            try {
                const response = await api.post(`/guides/bookings/${bookingId}/cancel/`);
                return response.data;
            } catch (error) {
                const fallbackResponse = await api.post(`/guides/guides/bookings/${bookingId}/cancel/`);
                return fallbackResponse.data;
            }
        } catch (error) {
            console.error('Error cancelling booking:', error);
            throw error;
        }
    },
    
    completeBooking: async (bookingId) => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            try {
                const response = await api.post(`/guides/bookings/${bookingId}/complete/`);
                return response.data;
            } catch (error) {
                const fallbackResponse = await api.post(`/guides/guides/bookings/${bookingId}/complete/`);
                return fallbackResponse.data;
            }
        } catch (error) {
            console.error('Error completing booking:', error);
            throw error;
        }
    },
    
    deleteBooking: async (bookingId) => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            try {
                const response = await api.delete(`/guides/bookings/${bookingId}/`);
                return response.data;
            } catch (error) {
                const fallbackResponse = await api.delete(`/guides/guides/bookings/${bookingId}/`);
                return fallbackResponse.data;
            }
        } catch (error) {
            console.error('Error deleting booking:', error);
            throw error;
        }
    },
    
    submitReview: async (bookingId, reviewData) => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            try {
                const response = await api.post(`/guides/bookings/${bookingId}/review/`, reviewData);
                return response.data;
            } catch (error) {
                const fallbackResponse = await api.post(`/guides/guides/bookings/${bookingId}/review/`, reviewData);
                return fallbackResponse.data;
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            throw error;
        }
    },
};

// ============================================
// EXPORT - FIXED
// ============================================

// Default export for the api instance
export default api;

// Named exports for convenience
export const getWishlist = AuthAPI.getWishlist;
export const toggleWishlist = AuthAPI.toggleWishlist;
export const removeFromWishlist = AuthAPI.removeFromWishlist;
export const checkWishlist = AuthAPI.checkWishlist;
export const getWishlistCount = AuthAPI.getWishlistCount;
export const getCategoryData = AuthAPI.getCategoryData;
export const addCategory = AuthAPI.addCategory;
export const addPlaceToCategory = AuthAPI.addPlaceToCategory;
export const getDestinations = AuthAPI.getDestinations;
export const getDestination = AuthAPI.getDestination;
export const addReview = AuthAPI.addReview;
export const getReviews = AuthAPI.getReviews;
export const getGuides = AuthAPI.getGuides;
export const getGuide = AuthAPI.getGuide;
export const updatePlace = AuthAPI.updatePlace;
export const deletePlace = AuthAPI.deletePlace;
export const deleteCategory = AuthAPI.deleteCategory;
export const getCategory = AuthAPI.getCategory;
export const editCategory = AuthAPI.editCategory;
export const getProfileData = AuthAPI.getProfileData;
export const getMyBookings = AuthAPI.getMyBookings;
export const createBooking = AuthAPI.createBooking;
export const cancelBooking = AuthAPI.cancelBooking;
export const completeBooking = AuthAPI.completeBooking;
export const deleteBooking = AuthAPI.deleteBooking;
export const submitReview = AuthAPI.submitReview;
export const getSuggestions = AuthAPI.getSuggestions;
export const createSuggestion = AuthAPI.createSuggestion;
export const getSuggestionStats = AuthAPI.getSuggestionStats;