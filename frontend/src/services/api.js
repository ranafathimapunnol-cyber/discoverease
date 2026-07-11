// services/api.js - COMPLETE FIXED VERSION

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

// ✅ Auth Service
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

    getRole: () => {
        return sessionStorage.getItem('role') || 'tourister';
    },

    getSessionKey: () => {
        return sessionStorage.getItem('session_key');
    },

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

// ✅ Complete API Methods
export const AuthAPI = {
    // ============================================
    // AUTHENTICATION ENDPOINTS
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
            return response.data;
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    },

    getMe: async () => {
        try {
            const response = await api.get('/auth/me/');
            return response.data;
        } catch (error) {
            console.error('Get me error:', error);
            throw error;
        }
    },

    updateProfile: async (data) => {
        try {
            const response = await api.patch('/auth/update-profile/', data);
            return response.data;
        } catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    },

    changePassword: async (data) => {
        try {
            const response = await api.post('/auth/change-password/', data);
            return response.data;
        } catch (error) {
            console.error('Change password error:', error);
            throw error;
        }
    },

    forgotPassword: async (email) => {
        try {
            const response = await api.post('/auth/forgot-password/', { email });
            return response.data;
        } catch (error) {
            console.error('Forgot password error:', error);
            throw error;
        }
    },

    resetPassword: async (data) => {
        try {
            const response = await api.post('/auth/reset-password/', data);
            return response.data;
        } catch (error) {
            console.error('Reset password error:', error);
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
    // GUIDE DASHBOARD ENDPOINTS
    // ============================================
    
    getGuideProfile: async () => {
        try {
            const response = await api.get('/guides/guides/profile/');
            return response.data;
        } catch (error) {
            console.error('Error fetching guide profile:', error);
            throw error;
        }
    },

    getGuideBookings: async () => {
        try {
            const response = await api.get('/guides/guides/bookings/');
            return response.data;
        } catch (error) {
            console.error('Error fetching guide bookings:', error);
            throw error;
        }
    },

    getGuideAvailability: async () => {
        try {
            const response = await api.get('/guides/guides/availability/');
            return response.data;
        } catch (error) {
            console.error('Error fetching guide availability:', error);
            throw error;
        }
    },

    addAvailabilitySlot: async (slotData) => {
        try {
            const response = await api.post('/guides/guides/availability/add/', slotData);
            return response.data;
        } catch (error) {
            console.error('Error adding availability slot:', error);
            throw error;
        }
    },

    deleteAvailabilitySlot: async (slotId) => {
        try {
            const response = await api.delete(`/guides/guides/availability/${slotId}/`);
            return response.data;
        } catch (error) {
            console.error('Error deleting availability slot:', error);
            throw error;
        }
    },

    getGuideReviews: async () => {
        try {
            const response = await api.get('/guides/guides/reviews/');
            return response.data;
        } catch (error) {
            console.error('Error fetching guide reviews:', error);
            throw error;
        }
    },
    reviewBooking: async (bookingId, reviewData) => {
  try {
    const response = await api.post(`/guides/bookings/${bookingId}/review/`, {
      rating: reviewData.rating,
      comment: reviewData.comment,
    });
    return response.data;
  } catch (error) {
    console.error('Error submitting review:', error);
    throw error;
  }
},

    // ============================================
    // BOOKING ENDPOINTS - FIXED
    // ============================================
    // services/api.js - FIXED processBooking

processBooking: async (bookingId, status) => {
    try {
        // ✅ Valid actions: confirm, reject, complete
        const validActions = ['confirm', 'reject', 'complete'];
        if (!validActions.includes(status)) {
            throw new Error(`Invalid action: ${status}. Use confirm, reject, or complete`);
        }
        
        const response = await api.post(`/guides/bookings/${bookingId}/process/`, { action: status });
        return response.data;
    } catch (error) {
        console.error('Error processing booking:', error);
        throw error;
    }
},
    completeBooking: async (bookingId) => {
        try {
            const response = await api.post(`/guides/bookings/${bookingId}/complete/`);
            return response.data;
        } catch (error) {
            console.error('Error completing booking:', error);
            throw error;
        }
    },

    cancelBooking: async (bookingId) => {
        try {
            const response = await api.post(`/guides/bookings/${bookingId}/cancel/`);
            return response.data;
        } catch (error) {
            console.error('Error cancelling booking:', error);
            throw error;
        }
    },

    // ============================================
    // STAFF ENDPOINTS
    // ============================================
    
    getStaffStats: async () => {
        try {
            const response = await api.get('/staff/staff/stats/');
            return response.data;
        } catch (error) {
            console.error('Error fetching staff stats:', error);
            throw error;
        }
    },

    getStaffGuides: async () => {
        try {
            const response = await api.get('/staff/staff/guides/');
            return response.data;
        } catch (error) {
            console.error('Error fetching staff guides:', error);
            throw error;
        }
    },

    addGuide: async (guideData) => {
        try {
            const response = await api.post('/staff/staff/guides/add/', guideData);
            return response.data;
        } catch (error) {
            console.error('Error adding guide:', error);
            throw error;
        }
    },

    verifyGuide: async (guideId) => {
        try {
            const response = await api.post(`/staff/staff/guides/${guideId}/verify/`);
            return response.data;
        } catch (error) {
            console.error('Error verifying guide:', error);
            throw error;
        }
    },

    deleteGuide: async (guideId) => {
        try {
            const response = await api.delete(`/staff/staff/guides/${guideId}/`);
            return response.data;
        } catch (error) {
            console.error('Error deleting guide:', error);
            throw error;
        }
    },

    getStaffBookings: async () => {
        try {
            const response = await api.get('/staff/staff/bookings/');
            return response.data;
        } catch (error) {
            console.error('Error fetching staff bookings:', error);
            throw error;
        }
    },

    updateBookingStatus: async (bookingId, status) => {
        try {
            const response = await api.post(`/staff/staff/bookings/${bookingId}/update/`, { status });
            return response.data;
        } catch (error) {
            console.error('Error updating booking:', error);
            throw error;
        }
    },

    getStaffSuggestions: async () => {
        try {
            const response = await api.get('/staff/staff/suggestions/');
            return response.data;
        } catch (error) {
            console.error('Error fetching staff suggestions:', error);
            throw error;
        }
    },

    processSuggestion: async (suggestionId, action, notes = '') => {
        try {
            const response = await api.post(`/staff/staff/suggestions/${suggestionId}/process/`, { action, notes });
            return response.data;
        } catch (error) {
            console.error('Error processing suggestion:', error);
            throw error;
        }
    },

    getStaffInsights: async () => {
        try {
            const response = await api.get('/staff/staff/insights/');
            return response.data;
        } catch (error) {
            console.error('Error fetching staff insights:', error);
            throw error;
        }
    },

    // ============================================
    // ADMIN ENDPOINTS
    // ============================================
    
    getAdminStats: async () => {
        try {
            const response = await api.get('/admin/admin/stats/');
            return response.data;
        } catch (error) {
            console.error('Error fetching admin stats:', error);
            throw error;
        }
    },

    getAdminUsers: async () => {
        try {
            const response = await api.get('/admin/admin/users/');
            return response.data;
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    },

    getAdminStaff: async () => {
        try {
            const response = await api.get('/admin/admin/staff/');
            return response.data;
        } catch (error) {
            console.error('Error fetching staff:', error);
            throw error;
        }
    },

    addStaff: async (staffData) => {
        try {
            const response = await api.post('/admin/admin/staff/add/', staffData);
            return response.data;
        } catch (error) {
            console.error('Error adding staff:', error);
            throw error;
        }
    },

    deleteStaff: async (staffId) => {
        try {
            const response = await api.delete(`/admin/admin/staff/${staffId}/`);
            return response.data;
        } catch (error) {
            console.error('Error deleting staff:', error);
            throw error;
        }
    },

    toggleUserStatus: async (userId) => {
        try {
            const response = await api.post(`/admin/admin/users/${userId}/toggle-status/`);
            return response.data;
        } catch (error) {
            console.error('Error toggling user status:', error);
            throw error;
        }
    },

    deleteUser: async (userId) => {
        try {
            const response = await api.delete(`/admin/admin/users/${userId}/`);
            return response.data;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    },

    changeUserRole: async (userId, role) => {
        try {
            const response = await api.post(`/admin/admin/users/${userId}/change-role/`, { role });
            return response.data;
        } catch (error) {
            console.error('Error changing user role:', error);
            throw error;
        }
    },

    getAdminSuggestions: async () => {
        try {
            const response = await api.get('/admin/admin/suggestions/');
            return response.data;
        } catch (error) {
            console.error('Error fetching admin suggestions:', error);
            throw error;
        }
    },

    rejectSuggestion: async (suggestionId, notes = '') => {
        try {
            const response = await api.post(`/admin/admin/suggestions/${suggestionId}/reject/`, { notes });
            return response.data;
        } catch (error) {
            console.error('Error rejecting suggestion:', error);
            throw error;
        }
    },

    approveSuggestion: async (suggestionId, notes = '') => {
        try {
            const response = await api.post(`/admin/admin/suggestions/${suggestionId}/approve/`, { notes });
            return response.data;
        } catch (error) {
            console.error('Error approving suggestion:', error);
            throw error;
        }
    },

    getGuideVerifications: async () => {
        try {
            const response = await api.get('/admin/admin/guide-verifications/');
            return response.data;
        } catch (error) {
            console.error('Error fetching guide verifications:', error);
            throw error;
        }
    },

    getAdminBookings: async () => {
        try {
            const response = await api.get('/admin/admin/bookings/');
            return response.data;
        } catch (error) {
            console.error('Error fetching admin bookings:', error);
            throw error;
        }
    },

    getAdminInsights: async () => {
        try {
            const response = await api.get('/admin/admin/insights/');
            return response.data;
        } catch (error) {
            console.error('Error fetching admin insights:', error);
            throw error;
        }
    },

    sendNotification: async (subject, message, user_ids = []) => {
        try {
            const response = await api.post('/admin/admin/notify/', { subject, message, user_ids });
            return response.data;
        } catch (error) {
            console.error('Error sending notification:', error);
            throw error;
        }
    },

    // ============================================
    // SUGGESTION ENDPOINTS
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
            const response = await api.post('/suggestions/', data);
            return response.data;
        } catch (error) {
            console.error('Error creating suggestion:', error);
            throw error;
        }
    },

    getSuggestionStats: async () => {
        try {
            const response = await api.get('/suggestions/guide_stats/');
            return response.data;
        } catch (error) {
            console.error('Error fetching suggestion stats:', error);
            throw error;
        }
    },
};

// ✅ Request interceptor
api.interceptors.request.use(
    (config) => {
        const sessionKey = AuthService.getSessionKey();
        if (sessionKey) {
            config.headers['X-Session-Key'] = sessionKey;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ✅ Response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            AuthService.clearAuth();
            if (!window.location.pathname.includes('/login') &&
                !window.location.pathname.includes('/register')) {
                window.location.href = '/login?error=session_expired';
            }
        }
        return Promise.reject(error);
    }
);

export default api;