// App.jsx
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

import './index.css';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { isLoggedIn, user, loading } = useAuth();

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

    if (!isLoggedIn) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
        return <Navigate to="/" replace />;
    }

    return children;
};

const Logout = () => {
    const { logout } = useAuth();
    logout();
    return <Navigate to="/login" replace />;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route path="/auth/google/callback/" element={<GoogleCallback />} />
                    <Route path="/logout" element={<Logout />} />
                    

                    {/* Home - Protected */}
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute allowedRoles={['tourister', 'guide', 'staff', 'admin']}>
                                <Home />
                            </ProtectedRoute>
                        }
                    />

                    {/* Protected Routes */}
                    <Route
                        path="/local-insights"
                        element={
                            <ProtectedRoute allowedRoles={['tourister', 'guide', 'staff', 'admin']}>
                                <LocalInsights />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/guides"
                        element={
                            <ProtectedRoute allowedRoles={['tourister', 'guide', 'staff', 'admin']}>
                                <Guides />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/categories"
                        element={
                            <ProtectedRoute allowedRoles={['tourister', 'guide', 'staff', 'admin']}>
                                <Categories />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/category/:categoryId"
                        element={
                            <ProtectedRoute allowedRoles={['tourister', 'guide', 'staff', 'admin']}>
                                <CategoryDetail />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/ai-trip-planner"
                        element={
                            <ProtectedRoute allowedRoles={['tourister', 'guide', 'staff', 'admin']}>
                                <AiTripPlanner />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/wishlist"
                        element={
                            <ProtectedRoute allowedRoles={['tourister', 'guide', 'staff', 'admin']}>
                                <Wishlist />
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

                    {/* Role-Specific Dashboards */}
                    <Route
                        path="/guide-dashboard"
                        element={
                            <ProtectedRoute allowedRoles={['guide']}>
                                <GuideDashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/staff-dashboard"
                        element={
                            <ProtectedRoute allowedRoles={['staff']}>
                                <StaffDashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/admin-dashboard"
                        element={
                            <ProtectedRoute allowedRoles={['admin']}>
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />

                    {/* Catch all */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
