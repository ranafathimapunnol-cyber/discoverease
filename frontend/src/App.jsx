// App.jsx - COMPLETE FIXED VERSION

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import GoogleCallback from './pages/GoogleCallback';
import Categories from './pages/Categories';
import CategoryDetail from './pages/CategoryDetail';
import LocalInsights from './pages/LocalInsights';
import AiTripPlanner from './pages/AiTripPlanner';
import Profile from './pages/Profile';
import Wishlist from './pages/Wishlist';
import Guides from './pages/Guides';
import GuideDashboard from './pages/GuideDashboard';
import StaffDashboard from './pages/StaffDashboard';
import AdminDashboard from './pages/AdminDashboard';
import MyBookings from './pages/MyBookings';
import Reviews from './pages/Reviews';

import './index.css';

// ============================================
// PROTECTED ROUTE COMPONENT - FIXED
// ============================================
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { isLoggedIn, role, loading } = useAuth();

    // ✅ Show loading spinner while checking auth
    if (loading) {
        return (
            <div
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#FBF6EA',
                }}>
                <div
                    style={{
                        width: 40,
                        height: 40,
                        border: '3px solid #E4C77B',
                        borderTop: '3px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                    }}
                />
                <style>{`
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    // ✅ Not logged in - redirect to login
    if (!isLoggedIn) {
        return <Navigate to="/login" replace />;
    }

    // ✅ Check if user has required role
    if (allowedRoles.length > 0) {
        const userRole = role || 'tourister';
        const hasAccess = allowedRoles.some(r => {
            // Handle role variations
            if (r === 'staff' && ['staff', 'staff_admin', 'admin'].includes(userRole)) {
                return true;
            }
            if (r === 'admin' && ['admin', 'staff_admin'].includes(userRole)) {
                return true;
            }
            return userRole === r;
        });

        if (!hasAccess) {
            // Redirect to appropriate dashboard
            const redirectMap = {
                'tourister': '/',
                'guide': '/guide-dashboard',
                'staff': '/staff-dashboard',
                'admin': '/admin-dashboard',
                'staff_admin': '/staff-dashboard'
            };
            return <Navigate to={redirectMap[userRole] || '/'} replace />;
        }
    }

    return children;
};

// ============================================
// DASHBOARD REDIRECT COMPONENT
// ============================================
const DashboardRedirect = () => {
    const { role, loading } = useAuth();

    if (loading) {
        return (
            <div
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#FBF6EA',
                }}>
                <div
                    style={{
                        width: 40,
                        height: 40,
                        border: '3px solid #E4C77B',
                        borderTop: '3px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                    }}
                />
            </div>
        );
    }

    const redirectMap = {
        'tourister': '/',
        'guide': '/guide-dashboard',
        'staff': '/staff-dashboard',
        'staff_admin': '/staff-dashboard',
        'admin': '/admin-dashboard'
    };
    
    return <Navigate to={redirectMap[role || 'tourister'] || '/'} replace />;
};

// ============================================
// LOGOUT COMPONENT
// ============================================
const Logout = () => {
    const { logout } = useAuth();
    React.useEffect(() => {
        logout();
    }, [logout]);
    return <Navigate to="/login" replace />;
};

// ============================================
// APP COMPONENT
// ============================================
function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* ========================================== */}
                    {/* PUBLIC ROUTES - No login required          */}
                    {/* ========================================== */}
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route path="/auth/google/callback/" element={<GoogleCallback />} />
                    <Route path="/logout" element={<Logout />} />

                    {/* ========================================== */}
                    {/* PROTECTED ROUTES - Login required          */}
                    {/* ========================================== */}
                    
                    {/* ✅ Tourister Routes - Fixed */}
                    <Route
                        path="/categories"
                        element={
                            <ProtectedRoute allowedRoles={['tourister']}>
                                <Categories />
                            </ProtectedRoute>
                        }
                    />
                    
                    {/* ✅ CategoryDetail - Fixed with correct route */}
                    <Route
                        path="/category/:categoryId"
                        element={
                            <ProtectedRoute allowedRoles={['tourister']}>
                                <CategoryDetail />
                            </ProtectedRoute>
                        }
                    />
                    
                    <Route
                        path="/local-insights"
                        element={
                            <ProtectedRoute allowedRoles={['tourister']}>
                                <LocalInsights />
                            </ProtectedRoute>
                        }
                    />
                    
                    <Route
                        path="/ai-trip-planner"
                        element={
                            <ProtectedRoute allowedRoles={['tourister']}>
                                <AiTripPlanner />
                            </ProtectedRoute>
                        }
                    />
                    
                    <Route
                        path="/wishlist"
                        element={
                            <ProtectedRoute allowedRoles={['tourister']}>
                                <Wishlist />
                            </ProtectedRoute>
                        }
                    />
                    
                    <Route
                        path="/guides"
                        element={
                            <ProtectedRoute allowedRoles={['tourister', 'guide']}>
                                <Guides />
                            </ProtectedRoute>
                        }
                    />
                    
                    <Route
                        path="/my-bookings"
                        element={
                            <ProtectedRoute allowedRoles={['tourister', 'guide']}>
                                <MyBookings />
                            </ProtectedRoute>
                        }
                    />
                    
                    <Route
                        path="/reviews"
                        element={
                            <ProtectedRoute allowedRoles={['tourister', 'guide']}>
                                <Reviews />
                            </ProtectedRoute>
                        }
                    />
                    
                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute allowedRoles={['tourister', 'guide', 'staff', 'admin']}>
                                <Profile />
                            </ProtectedRoute>
                        }
                    />

                    {/* ========================================== */}
                    {/* ROLE-SPECIFIC DASHBOARDS                  */}
                    {/* ========================================== */}
                    
                    {/* Guide Dashboard */}
                    <Route
                        path="/guide-dashboard"
                        element={
                            <ProtectedRoute allowedRoles={['guide']}>
                                <GuideDashboard />
                            </ProtectedRoute>
                        }
                    />

                    {/* Staff Dashboard - Also accessible by staff_admin and admin */}
                    <Route
                        path="/staff-dashboard"
                        element={
                            <ProtectedRoute allowedRoles={['staff', 'staff_admin', 'admin']}>
                                <StaffDashboard />
                            </ProtectedRoute>
                        }
                    />

                    {/* Admin Dashboard */}
                    <Route
                        path="/admin-dashboard"
                        element={
                            <ProtectedRoute allowedRoles={['admin', 'staff_admin']}>
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />

                    {/* ========================================== */}
                    {/* DASHBOARD REDIRECT                        */}
                    {/* ========================================== */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <DashboardRedirect />
                            </ProtectedRoute>
                        }
                    />

                    {/* ========================================== */}
                    {/* CATCH ALL - 404                           */}
                    {/* ========================================== */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;