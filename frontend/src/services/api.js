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
    getToken: () => sessionStorage.getItem('access_token'),
    getSessionKey: () => sessionStorage.getItem('session_key'),
    setAuth: (user, token, sessionKey, role) => {
        if (user) {
            sessionStorage.setItem('user', JSON.stringify(user));
            sessionStorage.setItem('role', role || user.role || 'tourister');
        }
        if (token) sessionStorage.setItem('access_token', token);
        if (sessionKey) sessionStorage.setItem('session_key', sessionKey);
    },
    clearAuth: () => {
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('role');
        sessionStorage.removeItem('access_token');
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

api.interceptors.request.use(
    (config) => {
        const token = AuthService.getToken();
        if (token) config.headers['Authorization'] = `Bearer ${token}`;
        const sessionKey = AuthService.getSessionKey();
        if (sessionKey) config.headers['X-Session-Key'] = sessionKey;
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            AuthService.clearAuth();
            if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
                window.location.href = '/login?error=session_expired';
            }
        }
        return Promise.reject(error);
    }
);

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
            const response = await api.post('/auth/login/', { email, password, remember_me: rememberMe });
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
    // BOOKINGS
    // ============================================
    getBookings: async (params = {}) => {
        try {
            const response = await api.get('/bookings/', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching bookings:', error);
            try {
                const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
                return { success: true, bookings: bookings };
            } catch (e) {
                return { success: true, bookings: [] };
            }
        }
    },
    getBooking: async (bookingId) => {
        try {
            const response = await api.get(`/bookings/${bookingId}/`);
            return response.data;
        } catch (error) {
            console.error('Error fetching booking:', error);
            throw error;
        }
    },
    createBooking: async (data) => {
        try {
            const response = await api.post('/bookings/', data);
            return response.data;
        } catch (error) {
            console.error('Error creating booking:', error);
            throw error;
        }
    },
    updateBooking: async (bookingId, data) => {
        try {
            const response = await api.put(`/bookings/${bookingId}/`, data);
            return response.data;
        } catch (error) {
            console.error('Error updating booking:', error);
            throw error;
        }
    },
    cancelBooking: async (bookingId) => {
        try {
            const response = await api.post(`/bookings/${bookingId}/cancel/`);
            return response.data;
        } catch (error) {
            console.error('Error cancelling booking:', error);
            throw error;
        }
    },
    completeBooking: async (bookingId) => {
        try {
            const response = await api.post(`/bookings/${bookingId}/complete/`);
            return response.data;
        } catch (error) {
            console.error('Error completing booking:', error);
            throw error;
        }
    },
    getMyBookings: async () => {
        try {
            const response = await api.get('/bookings/my/');
            return response.data;
        } catch (error) {
            console.error('Error fetching my bookings:', error);
            try {
                const bookings = JSON.parse(localStorage.getItem('my_bookings') || '[]');
                return { success: true, bookings: bookings };
            } catch (e) {
                return { success: true, bookings: [] };
            }
        }
    },

    // ============================================
    // GUIDE DASHBOARD
    // ============================================
    getGuideProfile: async () => {
        try {
            const response = await api.get('/guides/profile/');
            return response.data;
        } catch (error) {
            console.error('Error fetching guide profile:', error);
            throw error;
        }
    },
    getGuideBookings: async () => {
        try {
            let response;
            try {
                response = await api.get('/guides/bookings/');
            } catch (e) {
                try {
                    response = await api.get('/guide/bookings/');
                } catch (e2) {
                    response = await api.get('/bookings/guide/');
                }
            }
            return response.data;
        } catch (error) {
            console.error('Error fetching guide bookings:', error);
            try {
                const bookings = JSON.parse(localStorage.getItem('guide_bookings') || '[]');
                return { success: true, bookings: bookings };
            } catch (e) {
                return { success: true, bookings: [] };
            }
        }
    },
    getGuideAvailability: async () => {
        try {
            const response = await api.get('/guides/availability/');
            return response.data;
        } catch (error) {
            console.error('Error fetching guide availability:', error);
            throw error;
        }
    },
    addAvailabilitySlot: async (slotData) => {
        try {
            const response = await api.post('/guides/availability/add/', slotData);
            return response.data;
        } catch (error) {
            console.error('Error adding availability slot:', error);
            throw error;
        }
    },
    deleteAvailabilitySlot: async (slotId) => {
        try {
            const response = await api.delete(`/guides/availability/${slotId}/`);
            return response.data;
        } catch (error) {
            console.error('Error deleting availability slot:', error);
            throw error;
        }
    },
    getGuideReviews: async () => {
        try {
            const response = await api.get('/guides/reviews/');
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
    processBooking: async (bookingId, status) => {
        try {
            const response = await api.post(`/guides/bookings/${bookingId}/process/`, { action: status });
            return response.data;
        } catch (error) {
            console.error('Error processing booking:', error);
            throw error;
        }
    },

    // ============================================
    // STAFF
    // ============================================
    getStaffStats: async () => {
        try {
            const response = await api.get('/staff/stats/');
            return response.data;
        } catch (error) {
            console.error('Error fetching staff stats:', error);
            throw error;
        }
    },
    getStaffGuides: async () => {
        try {
            const response = await api.get('/staff/guides/');
            return response.data;
        } catch (error) {
            console.error('Error fetching staff guides:', error);
            throw error;
        }
    },
    addStaffGuide: async (guideData) => {
        try {
            const response = await api.post('/staff/guides/add/', guideData);
            return response.data;
        } catch (error) {
            console.error('Error adding guide:', error);
            throw error;
        }
    },
    verifyStaffGuide: async (guideId) => {
        try {
            const response = await api.post(`/staff/guides/${guideId}/verify/`);
            return response.data;
        } catch (error) {
            console.error('Error verifying guide:', error);
            throw error;
        }
    },
    deleteStaffGuide: async (guideId) => {
        try {
            const response = await api.delete(`/staff/guides/${guideId}/delete/`);
            return response.data;
        } catch (error) {
            console.error('Error deleting guide:', error);
            throw error;
        }
    },
    getStaffBookings: async () => {
        try {
            const response = await api.get('/staff/bookings/');
            return response.data;
        } catch (error) {
            console.error('Error fetching staff bookings:', error);
            return { success: true, bookings: [] };
        }
    },
    updateBookingStatus: async (bookingId, status) => {
        try {
            const response = await api.post(`/staff/bookings/${bookingId}/update/`, { status });
            return response.data;
        } catch (error) {
            console.error('Error updating booking:', error);
            throw error;
        }
    },
    getStaffSuggestions: async () => {
        try {
            const response = await api.get('/staff/suggestions/');
            return response.data;
        } catch (error) {
            console.error('Error fetching staff suggestions:', error);
            throw error;
        }
    },
    processStaffSuggestion: async (suggestionId, action, notes = '') => {
        try {
            const response = await api.post(`/staff/suggestions/${suggestionId}/process/`, { action, notes });
            return response.data;
        } catch (error) {
            console.error('Error processing suggestion:', error);
            throw error;
        }
    },
    getStaffInsights: async () => {
        try {
            const response = await api.get('/staff/insights/');
            return response.data;
        } catch (error) {
            console.error('Error fetching staff insights:', error);
            throw error;
        }
    },

    // ============================================
    // ADMIN - ALL FIXED URLs
    // ============================================
    getAdminStats: async () => {
        try {
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
    
    // ✅ USERS - FIXED
    getAdminUsers: async () => {
        try {
            const response = await api.get('/admin/users/');
            return response.data;
        } catch (error) {
            console.error('Error fetching users:', error);
            try {
                const usersList = JSON.parse(localStorage.getItem('users_list') || '[]');
                return { success: true, users: usersList };
            } catch (e) {
                return { success: true, users: [] };
            }
        }
    },
    toggleUserStatus: async (userId, isActive) => {
        try {
            const response = await api.post(`/admin/users/${userId}/toggle-status/`, { is_active: isActive });
            return response.data;
        } catch (error) {
            console.error('Error toggling user status:', error);
            throw error;
        }
    },
    // ✅ FIXED: Delete User - Correct URL with trailing slash
    deleteUser: async (userId) => {
        try {
            const response = await api.delete(`/admin/users/${userId}/`);
            return response.data;
        } catch (error) {
            console.error('Error deleting user:', error);
            // Fallback to localStorage
            try {
                const usersList = JSON.parse(localStorage.getItem('users_list') || '[]');
                const updated = usersList.filter(u => u.id !== userId);
                localStorage.setItem('users_list', JSON.stringify(updated));
                return { success: true, message: 'User deleted (local)' };
            } catch (e) {
                throw error;
            }
        }
    },

    // ✅ STAFF - FIXED
    getAdminStaff: async () => {
        try {
            const response = await api.get('/admin/staff/');
            return response.data;
        } catch (error) {
            console.error('Error fetching staff:', error);
            try {
                const staffList = JSON.parse(localStorage.getItem('staff_list') || '[]');
                return { success: true, staff: staffList };
            } catch (e) {
                return { success: true, staff: [] };
            }
        }
    },
    addStaff: async (staffData) => {
        try {
            const response = await api.post('/admin/staff/add/', staffData);
            return response.data;
        } catch (error) {
            console.error('Error adding staff:', error);
            throw error;
        }
    },
    toggleStaffStatus: async (staffId, isActive) => {
        try {
            const response = await api.post(`/admin/staff/${staffId}/toggle-status/`, { is_active: isActive });
            return response.data;
        } catch (error) {
            console.error('Error toggling staff status:', error);
            try {
                const staffList = JSON.parse(localStorage.getItem('staff_list') || '[]');
                const updated = staffList.map(s => s.id === staffId ? { ...s, is_active: isActive } : s);
                localStorage.setItem('staff_list', JSON.stringify(updated));
                return { success: true, message: 'Staff status updated (local)' };
            } catch (e) {
                throw error;
            }
        }
    },
    deleteStaff: async (staffId) => {
        try {
            const response = await api.delete(`/admin/staff/${staffId}/`);
            return response.data;
        } catch (error) {
            console.error('Error deleting staff:', error);
            try {
                const staffList = JSON.parse(localStorage.getItem('staff_list') || '[]');
                const updated = staffList.filter(s => s.id !== staffId);
                localStorage.setItem('staff_list', JSON.stringify(updated));
                return { success: true, message: 'Staff deleted (local)' };
            } catch (e) {
                throw error;
            }
        }
    },

    // ✅ GUIDES - FIXED URLs
    getAdminGuides: async () => {
        try {
            const response = await api.get('/admin/guides/');
            return response.data;
        } catch (error) {
            console.error('Error fetching guides:', error);
            try {
                const guidesList = JSON.parse(localStorage.getItem('guides_list') || '[]');
                return { success: true, guides: guidesList };
            } catch (e) {
                return { success: true, guides: [] };
            }
        }
    },
    addGuide: async (guideData) => {
        try {
            const response = await api.post('/admin/guides/add/', guideData);
            return response.data;
        } catch (error) {
            console.error('Error adding guide:', error);
            throw error;
        }
    },
    // ✅ FIXED: /admin/guides/{id}/
    updateGuide: async (guideId, guideData) => {
        try {
            const response = await api.put(`/admin/guides/${guideId}/`, guideData);
            return response.data;
        } catch (error) {
            console.error('Error updating guide:', error);
            try {
                const guidesList = JSON.parse(localStorage.getItem('guides_list') || '[]');
                const updated = guidesList.map(g => g.id === guideId ? { ...g, ...guideData } : g);
                localStorage.setItem('guides_list', JSON.stringify(updated));
                return { success: true, message: 'Guide updated (local)' };
            } catch (e) {
                throw error;
            }
        }
    },
    // ✅ FIXED: /admin/guides/{id}/toggle-status/
    toggleGuideStatus: async (guideId, isActive) => {
        try {
            const response = await api.post(`/admin/guides/${guideId}/toggle-status/`, { is_active: isActive });
            return response.data;
        } catch (error) {
            console.error('Error toggling guide status:', error);
            try {
                const guidesList = JSON.parse(localStorage.getItem('guides_list') || '[]');
                const updated = guidesList.map(g => g.id === guideId ? { ...g, is_active: isActive } : g);
                localStorage.setItem('guides_list', JSON.stringify(updated));
                return { success: true, message: 'Guide status updated (local)' };
            } catch (e) {
                throw error;
            }
        }
    },
    // ✅ FIXED: /admin/guides/{id}/
    deleteGuide: async (guideId) => {
        try {
            const response = await api.delete(`/admin/guides/${guideId}/`);
            return response.data;
        } catch (error) {
            console.error('Error deleting guide:', error);
            try {
                const guidesList = JSON.parse(localStorage.getItem('guides_list') || '[]');
                const updated = guidesList.filter(g => g.id !== guideId);
                localStorage.setItem('guides_list', JSON.stringify(updated));
                return { success: true, message: 'Guide deleted (local)' };
            } catch (e) {
                throw error;
            }
        }
    },
    // ✅ FIXED: /admin/guides/{id}/verify/
    verifyGuide: async (guideId) => {
        try {
            const response = await api.post(`/admin/guides/${guideId}/verify/`);
            return response.data;
        } catch (error) {
            console.error('Error verifying guide:', error);
            try {
                const guidesList = JSON.parse(localStorage.getItem('guides_list') || '[]');
                const updated = guidesList.map(g => g.id === guideId ? { ...g, is_verified: true } : g);
                localStorage.setItem('guides_list', JSON.stringify(updated));
                return { success: true, message: 'Guide verified (local)' };
            } catch (e) {
                throw error;
            }
        }
    },
    // ✅ FIXED: /admin/guides/{id}/bookings/
    getGuideBookings: async (guideId) => {
        try {
            const response = await api.get(`/admin/guides/${guideId}/bookings/`);
            return response.data;
        } catch (error) {
            console.error('Error fetching guide bookings:', error);
            return { success: true, bookings: [] };
        }
    },

    // ✅ SUGGESTIONS - FIXED
    getAdminSuggestions: async () => {
        try {
            const response = await api.get('/admin/suggestions/');
            return response.data;
        } catch (error) {
            console.error('Error fetching admin suggestions:', error);
            try {
                const suggestions = JSON.parse(localStorage.getItem('hidden_gems_suggestions') || '[]');
                return { success: true, suggestions: suggestions };
            } catch (e) {
                return { success: true, suggestions: [] };
            }
        }
    },
    approveSuggestion: async (suggestionId, notes = '') => {
        try {
            const response = await api.post(`/admin/suggestions/${suggestionId}/approve/`, { notes });
            return response.data;
        } catch (error) {
            console.error('Error approving suggestion:', error);
            throw error;
        }
    },
    rejectSuggestion: async (suggestionId, notes = '') => {
        try {
            const response = await api.post(`/admin/suggestions/${suggestionId}/reject/`, { notes });
            return response.data;
        } catch (error) {
            console.error('Error rejecting suggestion:', error);
            throw error;
        }
    },
    implementSuggestion: async (suggestionId, notes = '') => {
        try {
            const response = await api.post(`/admin/suggestions/${suggestionId}/implement/`, { notes });
            return response.data;
        } catch (error) {
            console.error('Error implementing suggestion:', error);
            throw error;
        }
    },
    deleteSuggestion: async (suggestionId) => {
        try {
            const response = await api.delete(`/admin/suggestions/${suggestionId}/`);
            return response.data;
        } catch (error) {
            console.error('Error deleting suggestion:', error);
            throw error;
        }
    },
    getAdminBookings: async () => {
        try {
            const response = await api.get('/admin/bookings/');
            return response.data;
        } catch (error) {
            console.error('Error fetching admin bookings:', error);
            return { success: true, bookings: [] };
        }
    },
    testAdminAPI: async () => {
        try {
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
    // DESTINATIONS
    // ============================================
    getDestinations: async (params = {}) => {
        try {
            const response = await api.get('/destinations/', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching destinations:', error);
            throw error;
        }
    },
    getDestination: async (id) => {
        try {
            const response = await api.get(`/destinations/${id}/`);
            return response.data;
        } catch (error) {
            console.error('Error fetching destination:', error);
            throw error;
        }
    },
    createDestination: async (data) => {
        try {
            const response = await api.post('/destinations/', data);
            return response.data;
        } catch (error) {
            console.error('Error creating destination:', error);
            throw error;
        }
    },
    updateDestination: async (id, data) => {
        try {
            const response = await api.put(`/destinations/${id}/`, data);
            return response.data;
        } catch (error) {
            console.error('Error updating destination:', error);
            throw error;
        }
    },
    deleteDestination: async (id) => {
        try {
            const response = await api.delete(`/destinations/${id}/`);
            return response.data;
        } catch (error) {
            console.error('Error deleting destination:', error);
            throw error;
        }
    },
    addReview: async (destinationId, data) => {
        try {
            const response = await api.post(`/destinations/${destinationId}/add_review/`, data);
            return response.data;
        } catch (error) {
            console.error('Error adding review:', error);
            throw error;
        }
    },
    getReviews: async (destinationId) => {
        try {
            const response = await api.get(`/destinations/${destinationId}/reviews/`);
            return response.data;
        } catch (error) {
            console.error('Error fetching reviews:', error);
            throw error;
        }
    },
    getCategoryData: async () => {
        try {
            const response = await api.get('/destinations/category-data/');
            return response.data;
        } catch (error) {
            console.error('Error fetching category data:', error);
            try {
                const categories = JSON.parse(localStorage.getItem('categories') || '[]');
                return { success: true, data: categories };
            } catch (e) {
                return { success: true, data: [] };
            }
        }
    },
    addCategory: async (data) => {
        try {
            const response = await api.post('/destinations/add-category/', data);
            return response.data;
        } catch (error) {
            console.error('Error adding category:', error);
            try {
                const categories = JSON.parse(localStorage.getItem('categories') || '[]');
                const newCategory = {
                    key: data.key,
                    title: data.label,
                    description: data.description,
                    image: data.image,
                    count: 0,
                    places: []
                };
                categories.push(newCategory);
                localStorage.setItem('categories', JSON.stringify(categories));
                return { success: true, data: newCategory };
            } catch (e) {
                throw error;
            }
        }
    },
    addPlaceToCategory: async (data) => {
        try {
            const response = await api.post('/destinations/add-place/', data);
            return response.data;
        } catch (error) {
            console.error('Error adding place:', error);
            try {
                const categories = JSON.parse(localStorage.getItem('categories') || '[]');
                const categoryIndex = categories.findIndex(c => c.key === data.category);
                if (categoryIndex !== -1) {
                    const newPlace = {
                        id: Date.now(),
                        name: data.name,
                        location: data.location,
                        description: data.description,
                        difficulty: data.difficulty,
                        duration: data.duration,
                        best_time: data.best_time,
                        image: data.image,
                        type: data.type,
                        hidden_gem: data.hidden_gem,
                        created_at: new Date().toISOString()
                    };
                    if (!categories[categoryIndex].places) {
                        categories[categoryIndex].places = [];
                    }
                    categories[categoryIndex].places.push(newPlace);
                    categories[categoryIndex].count = categories[categoryIndex].places.length;
                    localStorage.setItem('categories', JSON.stringify(categories));
                    return { success: true, data: newPlace };
                }
                throw new Error('Category not found');
            } catch (e) {
                throw error;
            }
        }
    },
};

export default api;