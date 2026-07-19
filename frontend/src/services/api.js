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
// AUTH SERVICE - Session Based (NO TOKENS)
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
// API INTERCEPTORS
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

api.interceptors.response.use(
    (response) => {
        console.log(`📥 ${response.config.method.toUpperCase()} ${response.config.url} - ${response.status} ✅`);
        return response;
    },
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
    // BOOKINGS
    // ============================================
    getBookings: async (params = {}) => {
        try {
            if (!ensureAuth()) {
                return { success: true, bookings: [] };
            }
            const response = await api.get('/bookings/', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching bookings:', error);
            return { success: true, bookings: [] };
        }
    },
    getBooking: async (bookingId) => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            const response = await api.get(`/bookings/${bookingId}/`);
            return response.data;
        } catch (error) {
            console.error('Error fetching booking:', error);
            throw error;
        }
    },
    createBooking: async (data) => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            const response = await api.post('/bookings/', data);
            return response.data;
        } catch (error) {
            console.error('Error creating booking:', error);
            throw error;
        }
    },
    updateBooking: async (bookingId, data) => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            const response = await api.put(`/bookings/${bookingId}/`, data);
            return response.data;
        } catch (error) {
            console.error('Error updating booking:', error);
            throw error;
        }
    },
    cancelBooking: async (bookingId) => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            const response = await api.post(`/bookings/${bookingId}/cancel/`);
            return response.data;
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
            const response = await api.post(`/bookings/${bookingId}/complete/`);
            return response.data;
        } catch (error) {
            console.error('Error completing booking:', error);
            throw error;
        }
    },
    getMyBookings: async () => {
        try {
            if (!ensureAuth()) {
                return { success: true, bookings: [] };
            }
            const response = await api.get('/bookings/my/');
            return response.data;
        } catch (error) {
            console.error('Error fetching my bookings:', error);
            return { success: true, bookings: [] };
        }
    },

    // ============================================
    // ✅ GUIDES - FIXED ENDPOINTS (USING /guides/guides/)
    // ============================================
    getGuides: async (params = {}) => {
        try {
            // ✅ FIXED: Use /guides/guides/ (double guides)
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
    bookGuide: async (guideId, data) => {
        try {
            if (!ensureAuth()) {
                return { success: false, error: 'Not authenticated' };
            }
            // ✅ FIXED: Use /guides/bookings/ for booking creation
            const response = await api.post('/guides/bookings/', {
                guide: guideId,
                ...data
            });
            return response.data;
        } catch (error) {
            console.error('Error booking guide:', error);
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
export const getDestinations = AuthAPI.getDestinations;
export const getDestination = AuthAPI.getDestination;
export const addReview = AuthAPI.addReview;
export const getReviews = AuthAPI.getReviews;
export const getGuides = AuthAPI.getGuides;
export const getGuide = AuthAPI.getGuide;
export const bookGuide = AuthAPI.bookGuide;

export default api;