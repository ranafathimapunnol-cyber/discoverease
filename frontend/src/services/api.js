// services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

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

    setAuth: (user, sessionKey) => {
        if (user) {
            sessionStorage.setItem('user', JSON.stringify(user));
            sessionStorage.setItem('role', user.role || 'tourister');
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

    isGuide: () => {
        return AuthService.getRole() === 'guide';
    },

    isAdmin: () => {
        return ['admin', 'staff_admin'].includes(AuthService.getRole());
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

    // ✅ Check session and get user
    checkSession: async () => {
        try {
            const response = await api.get('/auth/me/');
            if (response.data.success) {
                const user = response.data.user;
                const role = response.data.role;
                sessionStorage.setItem('user', JSON.stringify(user));
                sessionStorage.setItem('role', role);
                return true;
            }
            return false;
        } catch (error) {
            return false;
        }
    },

    // ✅ Forgot Password - Send reset link to email
    forgotPassword: async (email) => {
        try {
            const response = await api.post('/auth/forgot-password/', { email });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ✅ Verify Reset Token - Check if token is valid
    verifyResetToken: async (token) => {
        try {
            const response = await api.post('/auth/verify-reset-token/', { token });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ✅ Reset Password - Set new password using token
    resetPassword: async (token, password, confirmPassword) => {
        try {
            const response = await api.post('/auth/reset-password/', {
                token,
                password,
                confirm_password: confirmPassword
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ✅ Change Password - For logged in users
    changePassword: async (currentPassword, newPassword, confirmNewPassword) => {
        try {
            const response = await api.post('/auth/change-password/', {
                current_password: currentPassword,
                new_password: newPassword,
                confirm_new_password: confirmNewPassword
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ✅ Update Profile - For logged in users
    updateProfile: async (profileData) => {
        try {
            const response = await api.patch('/auth/update_profile/', profileData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ✅ Upload Profile Picture
    uploadProfilePicture: async (file) => {
        const formData = new FormData();
        formData.append('profile_picture', file);
        try {
            const response = await api.post('/auth/upload_profile_picture/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ✅ Delete Profile Picture
    deleteProfilePicture: async () => {
        try {
            const response = await api.post('/auth/delete_profile_picture/');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ✅ Delete Account
    deleteAccount: async (password) => {
        try {
            const response = await api.post('/auth/delete_account/', { password });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ✅ Get Trip Stats
    getTripStats: async () => {
        try {
            const response = await api.get('/auth/trip_stats/');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ✅ Get User Bookings
    getBookings: async () => {
        try {
            const response = await api.get('/auth/bookings/');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ✅ Get Guide Availability
    getGuideAvailability: async (guideId) => {
        try {
            const response = await api.get(`/auth/guide_availability/${guideId}/`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ✅ Add Guide Availability
    addGuideAvailability: async (guideId, availabilityData) => {
        try {
            const response = await api.post(`/auth/add_guide_availability/${guideId}/`, availabilityData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ✅ Get Guide Bookings
    getGuideBookings: async () => {
        try {
            const response = await api.get('/auth/my_guide_bookings/');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ✅ Book a Guide
    bookGuide: async (guideId, bookingData) => {
        try {
            const response = await api.post(`/auth/book_guide/${guideId}/`, bookingData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ✅ Update Booking Status (for guides)
    updateBookingStatus: async (bookingId, status) => {
        try {
            const response = await api.post(`/auth/update_booking_status/${bookingId}/`, { status });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ✅ Get All Suggestions (for guides/admin)
    getSuggestions: async (params = {}) => {
        try {
            const response = await api.get('/suggestions/', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ✅ Create Suggestion (for travelers)
    createSuggestion: async (suggestionData) => {
        try {
            const response = await api.post('/suggestions/', suggestionData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ✅ Process Suggestion (for guides/admin)
    processSuggestion: async (suggestionId, action, notes) => {
        try {
            const response = await api.post(`/suggestions/${suggestionId}/process/`, {
                action,
                notes
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ✅ Get Guide Stats (for guide dashboard)
    getGuideStats: async () => {
        try {
            const response = await api.get('/suggestions/guide_stats/');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ✅ Get Available Guides
    getAvailableGuides: async (params = {}) => {
        try {
            const response = await api.get('/guides/available/', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ✅ Get Guide Details
    getGuideDetails: async (guideId) => {
        try {
            const response = await api.get(`/guides/${guideId}/`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ✅ Get Guide Availability (public)
    getGuideAvailabilityPublic: async (guideId, date = null) => {
        try {
            const params = date ? { date } : {};
            const response = await api.get(`/guides/${guideId}/availability/`, { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ✅ Google Login
    googleLogin: () => {
        window.location.href = `${API_BASE_URL}/auth/google_login/`;
    },

    // ✅ Google Callback
    googleCallback: async (code) => {
        try {
            const response = await api.post('/auth/google_callback/', { code });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ✅ Register User
    register: async (userData) => {
        try {
            const response = await api.post('/auth/register/', userData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ✅ Verify Email
    verifyEmail: async (token) => {
        try {
            const response = await api.post('/auth/verify-email/', { token });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ✅ Resend Verification Email
    resendVerification: async (email) => {
        try {
            const response = await api.post('/auth/resend-verification/', { email });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ✅ Get All Categories
    getCategories: async () => {
        try {
            const response = await api.get('/categories/');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ✅ Get Destinations by Category
    getDestinationsByCategory: async (categoryId) => {
        try {
            const response = await api.get(`/categories/${categoryId}/destinations/`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ✅ Get All Destinations
    getDestinations: async (params = {}) => {
        try {
            const response = await api.get('/destinations/', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ✅ Get Destination Details
    getDestinationDetails: async (destinationId) => {
        try {
            const response = await api.get(`/destinations/${destinationId}/`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ✅ Search Destinations
    searchDestinations: async (query) => {
        try {
            const response = await api.get('/destinations/search/', { params: { q: query } });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ✅ AI Trip Planner
    planTrip: async (tripData) => {
        try {
            const response = await api.post('/ai/plan-trip/', tripData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ✅ Get Wishlist
    getWishlist: async () => {
        try {
            const response = await api.get('/wishlist/');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ✅ Add to Wishlist
    addToWishlist: async (destinationId) => {
        try {
            const response = await api.post('/wishlist/add/', { destination_id: destinationId });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ✅ Remove from Wishlist
    removeFromWishlist: async (destinationId) => {
        try {
            const response = await api.post('/wishlist/remove/', { destination_id: destinationId });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ✅ Get Reviews
    getReviews: async (destinationId) => {
        try {
            const response = await api.get(`/destinations/${destinationId}/reviews/`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ✅ Add Review
    addReview: async (destinationId, reviewData) => {
        try {
            const response = await api.post(`/destinations/${destinationId}/reviews/`, reviewData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ✅ Get Local Insights (implemented suggestions)
    getLocalInsights: async () => {
        try {
            const response = await api.get('/suggestions/?status=implemented');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ✅ Get Notifications
    getNotifications: async () => {
        try {
            const response = await api.get('/notifications/');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ✅ Mark Notification as Read
    markNotificationRead: async (notificationId) => {
        try {
            const response = await api.post(`/notifications/${notificationId}/read/`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ✅ Mark All Notifications as Read
    markAllNotificationsRead: async () => {
        try {
            const response = await api.post('/notifications/read-all/');
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

// ✅ Request interceptor
api.interceptors.request.use(
    (config) => {
        // Add session key to headers if available
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
                !window.location.pathname.includes('/register') &&
                !window.location.pathname.includes('/forgot-password') &&
                !window.location.pathname.includes('/reset-password')) {
                window.location.href = '/login?error=session_expired';
            }
        }
        return Promise.reject(error);
    }
);

export default api;