// src/services/api.js - COMPLETE FIXED VERSION

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true,
});

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
// API REQUEST INTERCEPTOR
// ============================================
api.interceptors.request.use(
    (config) => {
        const sessionKey = AuthService.getSessionKey();
        if (sessionKey) {
            config.headers['X-Session-Key'] = sessionKey;
        }
        console.log(`📤 ${config.method.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => Promise.reject(error)
);

// ============================================
// API RESPONSE INTERCEPTOR
// ============================================
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error.response?.status, error.response?.data);
        
        if (error.response?.status === 401 || error.response?.status === 403) {
            AuthService.clearAuth();
            if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
                window.location.href = '/login?error=session_expired';
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
// AUTH API
// ============================================
export const AuthAPI = {
    // ============================================
    // AUTHENTICATION
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
    googleCallback: async (code) => {
        try {
            const response = await api.post('/auth/google-auth/', { code });
            return response.data;
        } catch (error) {
            console.error('Google callback error:', error);
            throw error;
        }
    },
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
            return response.data;
        } catch (error) {
            console.error('Get me error:', error);
            throw error;
        }
    },
    updateProfile: async (data) => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            const response = await api.patch('/auth/update-profile/', data);
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
    // ADMIN API
    // ============================================
    getAdminStaff: async () => {
        try {
            if (!ensureAuth()) {
                return { success: true, staff: [] };
            }
            const response = await api.get('/admin/admin/staff/');
            return response.data;
        } catch (error) {
            console.error('Error fetching staff:', error);
            return { success: true, staff: [] };
        }
    },
    
    getAdminUsers: async () => {
        try {
            if (!ensureAuth()) {
                return { success: true, users: [] };
            }
            const response = await api.get('/admin/admin/users/');
            return response.data;
        } catch (error) {
            console.error('Error fetching users:', error);
            return { success: true, users: [] };
        }
    },
    
    getAdminGuides: async () => {
        try {
            if (!ensureAuth()) {
                return { success: true, guides: [] };
            }
            const response = await api.get('/admin/admin/guides/');
            return response.data;
        } catch (error) {
            console.error('Error fetching guides:', error);
            return { success: true, guides: [] };
        }
    },
    
    addStaff: async (staffData) => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            const response = await api.post('/admin/admin/staff/add/', staffData);
            return response.data;
        } catch (error) {
            console.error('Error adding staff:', error);
            throw error;
        }
    },

    // ============================================
    // GUIDES - BOOKINGS (FIXED)
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
    
    // In api.js - FIXED createBooking function

createBooking: async (bookingData) => {
    try {
        if (!ensureAuth()) {
            return { success: false, error: 'Not authenticated' };
        }
        
        console.log('📤 Creating booking with data:', bookingData);
        
        // ✅ Build payload - time should be HH:MM
        const payload = {
            guide: parseInt(bookingData.guide),
            date: bookingData.date,
            time: bookingData.time,
            duration_hours: parseInt(bookingData.duration_hours) || 4,
            number_of_people: parseInt(bookingData.number_of_people) || 1,
            special_requests: bookingData.special_requests || '',
        };
        
        // ✅ Add district if provided
        if (bookingData.district) {
            const districtId = parseInt(bookingData.district);
            if (!isNaN(districtId) && districtId > 0) {
                payload.district = districtId;
            }
        }
        
        console.log('📤 Final payload:', JSON.stringify(payload, null, 2));
        
        // ✅ Try the endpoint
        const response = await api.post('/guides/bookings/', payload);
        console.log('✅ Booking response:', response.data);
        
        // ✅ Return the response data - even if it doesn't have 'success' field
        return response.data;
        
    } catch (error) {
        console.error('❌ Error creating booking:', error);
        
        // ✅ If the error is actually a success (201 Created), return the data
        if (error.response && error.response.status === 201) {
            console.log('✅ Booking created successfully (201)');
            return error.response.data;
        }
        
        // ✅ If the error is 200 OK with data, return it
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
                const response = await api.post(`/guides/bookings/${bookingId}/review/`, reviewData, {
                    headers: reviewData instanceof FormData 
                        ? { 'Content-Type': 'multipart/form-data' }
                        : { 'Content-Type': 'application/json' },
                });
                return response.data;
            } catch (error) {
                const fallbackResponse = await api.post(`/guides/guides/bookings/${bookingId}/review/`, reviewData, {
                    headers: reviewData instanceof FormData 
                        ? { 'Content-Type': 'multipart/form-data' }
                        : { 'Content-Type': 'application/json' },
                });
                return fallbackResponse.data;
            }
        } catch (error) {
            console.error('Error submitting review:', error);
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
    // STAFF ENDPOINTS
    // ============================================
    getStaffStats: async () => {
        try {
            if (!ensureAuth()) {
                return { success: true, stats: { pendingSuggestions: 0, totalSuggestions: 0, totalGuides: 0, totalBookings: 0, confirmedBookings: 0, totalReviews: 0, pendingReviews: 0 } };
            }
            const response = await api.get('/staff/stats/');
            return response.data;
        } catch (error) {
            console.error('Error fetching staff stats:', error);
            return { 
                success: true, 
                stats: { 
                    pendingSuggestions: 0,
                    totalSuggestions: 0,
                    totalGuides: 0,
                    totalBookings: 0,
                    confirmedBookings: 0,
                    totalReviews: 0,
                    pendingReviews: 0,
                } 
            };
        }
    },
    getStaffGuides: async () => {
        try {
            if (!ensureAuth()) {
                return { success: true, guides: [] };
            }
            const response = await api.get('/staff/guides/');
            return response.data;
        } catch (error) {
            console.error('Error fetching staff guides:', error);
            return { success: true, guides: [] };
        }
    },
    addStaffGuide: async (guideData) => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            const response = await api.post('/staff/guides/add/', guideData);
            return response.data;
        } catch (error) {
            console.error('Error adding guide:', error);
            throw error;
        }
    },
    verifyStaffGuide: async (guideId) => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            const response = await api.post(`/staff/guides/${guideId}/verify/`);
            return response.data;
        } catch (error) {
            console.error('Error verifying guide:', error);
            throw error;
        }
    },
    deleteStaffGuide: async (guideId) => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            const response = await api.delete(`/staff/guides/${guideId}/delete/`);
            return response.data;
        } catch (error) {
            console.error('Error deleting guide:', error);
            throw error;
        }
    },
    getStaffBookings: async () => {
        try {
            if (!ensureAuth()) {
                return { success: true, bookings: [] };
            }
            const response = await api.get('/staff/bookings/');
            return response.data;
        } catch (error) {
            console.error('Error fetching staff bookings:', error);
            return { success: true, bookings: [] };
        }
    },
    updateStaffBooking: async (bookingId, status) => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            const response = await api.post(`/staff/bookings/${bookingId}/update/`, { status });
            return response.data;
        } catch (error) {
            console.error('Error updating booking:', error);
            throw error;
        }
    },
    getStaffSuggestions: async () => {
        try {
            if (!ensureAuth()) {
                return { success: true, suggestions: [] };
            }
            const response = await api.get('/staff/suggestions/');
            return response.data;
        } catch (error) {
            console.error('Error fetching staff suggestions:', error);
            return { success: true, suggestions: [] };
        }
    },
    processStaffSuggestion: async (suggestionId, action, notes = '') => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            const response = await api.post(`/staff/suggestions/${suggestionId}/process/`, { action, notes });
            return response.data;
        } catch (error) {
            console.error('Error processing suggestion:', error);
            throw error;
        }
    },
    getStaffInsights: async () => {
        try {
            if (!ensureAuth()) {
                return { success: true, insights: [] };
            }
            const response = await api.get('/staff/insights/');
            return response.data;
        } catch (error) {
            console.error('Error fetching staff insights:', error);
            return { success: true, insights: [] };
        }
    },
    getStaffReviews: async () => {
        try {
            if (!ensureAuth()) {
                return { success: true, reviews: [] };
            }
            const response = await api.get('/staff/reviews/');
            return response.data;
        } catch (error) {
            console.error('Error fetching staff reviews:', error);
            return { success: true, reviews: [] };
        }
    },
    processStaffReview: async (reviewId, action) => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            const response = await api.post(`/staff/reviews/${reviewId}/process/`, { action });
            return response.data;
        } catch (error) {
            console.error('Error processing review:', error);
            throw error;
        }
    },

    // ============================================
    // ADMIN ENDPOINTS
    // ============================================
    getAdminStats: async () => {
        try {
            if (!ensureAuth()) {
                return { success: true, stats: { totalUsers: 0, totalStaff: 0, totalGuides: 0, totalBookings: 0, totalSuggestions: 0, pendingSuggestions: 0 } };
            }
            const response = await api.get('/admin/stats/');
            return response.data;
        } catch (error) {
            console.error('Error fetching admin stats:', error);
            return { 
                success: true, 
                stats: { 
                    totalUsers: 0, 
                    totalStaff: 0, 
                    totalGuides: 0, 
                    totalBookings: 0, 
                    totalSuggestions: 0, 
                    pendingSuggestions: 0 
                } 
            };
        }
    },
    getAdminUsers: async () => {
        try {
            if (!ensureAuth()) {
                return { success: true, users: [] };
            }
            const response = await api.get('/admin/users/');
            return response.data;
        } catch (error) {
            console.error('Error fetching users:', error);
            return { success: true, users: [] };
        }
    },
    toggleUserStatus: async (userId, isActive) => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            const response = await api.post(`/admin/users/${userId}/toggle-status/`, { is_active: isActive });
            return response.data;
        } catch (error) {
            console.error('Error toggling user status:', error);
            throw error;
        }
    },
    deleteUser: async (userId) => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            const response = await api.delete(`/admin/users/${userId}/`);
            return response.data;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    },
    getAdminStaff: async () => {
        try {
            if (!ensureAuth()) {
                return { success: true, staff: [] };
            }
            const response = await api.get('/admin/staff/');
            return response.data;
        } catch (error) {
            console.error('Error fetching staff:', error);
            return { success: true, staff: [] };
        }
    },
    addStaff: async (staffData) => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            const response = await api.post('/admin/staff/add/', staffData);
            return response.data;
        } catch (error) {
            console.error('Error adding staff:', error);
            throw error;
        }
    },
    toggleStaffStatus: async (staffId, isActive) => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            const response = await api.post(`/admin/staff/${staffId}/toggle-status/`, { is_active: isActive });
            return response.data;
        } catch (error) {
            console.error('Error toggling staff status:', error);
            throw error;
        }
    },
    deleteStaff: async (staffId) => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            const response = await api.delete(`/admin/staff/${staffId}/`);
            return response.data;
        } catch (error) {
            console.error('Error deleting staff:', error);
            throw error;
        }
    },
    getAdminGuides: async () => {
        try {
            if (!ensureAuth()) {
                return { success: true, guides: [] };
            }
            const response = await api.get('/admin/guides/');
            return response.data;
        } catch (error) {
            console.error('Error fetching guides:', error);
            return { success: true, guides: [] };
        }
    },
    addGuide: async (guideData) => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            const response = await api.post('/admin/guides/add/', guideData);
            return response.data;
        } catch (error) {
            console.error('Error adding guide:', error);
            throw error;
        }
    },
    updateGuide: async (guideId, guideData) => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            const response = await api.put(`/admin/guides/${guideId}/`, guideData);
            return response.data;
        } catch (error) {
            console.error('Error updating guide:', error);
            throw error;
        }
    },
    toggleGuideStatus: async (guideId, isActive) => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            const response = await api.post(`/admin/guides/${guideId}/toggle-status/`, { is_active: isActive });
            return response.data;
        } catch (error) {
            console.error('Error toggling guide status:', error);
            throw error;
        }
    },
    deleteGuide: async (guideId) => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            const response = await api.delete(`/admin/guides/${guideId}/`);
            return response.data;
        } catch (error) {
            console.error('Error deleting guide:', error);
            throw error;
        }
    },
    verifyGuide: async (guideId) => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            const response = await api.post(`/admin/guides/${guideId}/verify/`);
            return response.data;
        } catch (error) {
            console.error('Error verifying guide:', error);
            throw error;
        }
    },
    getGuideBookings: async (guideId) => {
        try {
            if (!ensureAuth()) {
                return { success: true, bookings: [] };
            }
            const response = await api.get(`/admin/guides/${guideId}/bookings/`);
            return response.data;
        } catch (error) {
            console.error('Error fetching guide bookings:', error);
            return { success: true, bookings: [] };
        }
    },
    getAdminSuggestions: async () => {
        try {
            if (!ensureAuth()) {
                return { success: true, suggestions: [] };
            }
            const response = await api.get('/admin/suggestions/');
            return response.data;
        } catch (error) {
            console.error('Error fetching admin suggestions:', error);
            return { success: true, suggestions: [] };
        }
    },
    approveSuggestion: async (suggestionId, notes = '') => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            const response = await api.post(`/admin/suggestions/${suggestionId}/approve/`, { notes });
            return response.data;
        } catch (error) {
            console.error('Error approving suggestion:', error);
            throw error;
        }
    },
    rejectSuggestion: async (suggestionId, notes = '') => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            const response = await api.post(`/admin/suggestions/${suggestionId}/reject/`, { notes });
            return response.data;
        } catch (error) {
            console.error('Error rejecting suggestion:', error);
            throw error;
        }
    },
    implementSuggestion: async (suggestionId, notes = '') => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            const response = await api.post(`/admin/suggestions/${suggestionId}/implement/`, { notes });
            return response.data;
        } catch (error) {
            console.error('Error implementing suggestion:', error);
            throw error;
        }
    },
    deleteSuggestion: async (suggestionId) => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            const response = await api.delete(`/admin/suggestions/${suggestionId}/`);
            return response.data;
        } catch (error) {
            console.error('Error deleting suggestion:', error);
            throw error;
        }
    },
    getAdminBookings: async () => {
        try {
            if (!ensureAuth()) {
                return { success: true, bookings: [] };
            }
            const response = await api.get('/admin/bookings/');
            return response.data;
        } catch (error) {
            console.error('Error fetching admin bookings:', error);
            return { success: true, bookings: [] };
        }
    },
    testAdminAPI: async () => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            const response = await api.get('/admin/test/');
            return response.data;
        } catch (error) {
            console.error('Error testing admin API:', error);
            throw error;
        }
    },

    // ============================================
    // SUGGESTIONS (Public)
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
};

// ============================================
// EXPORT ALL FUNCTIONS
// ============================================
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

export default api;