// pages/GoogleCallback.jsx - Callback Handler
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AuthAPI } from '../services/api';

const GoogleCallback = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { login } = useAuth();
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const hasProcessed = useRef(false);

    useEffect(() => {
        const code = searchParams.get('code');
        const errorParam = searchParams.get('error');
        
        if (errorParam) {
            setError(`Google authentication failed: ${errorParam}`);
            setLoading(false);
            setTimeout(() => navigate('/login?error=google_auth_failed'), 3000);
            return;
        }
        
        if (!code) {
            setError('No authorization code received from Google');
            setLoading(false);
            setTimeout(() => navigate('/login?error=no_code'), 3000);
            return;
        }

        const handleCallback = async () => {
            if (hasProcessed.current) return;
            hasProcessed.current = true;

            try {
                // ✅ Use AuthAPI.googleCallback from services/api.js
                const response = await AuthAPI.googleCallback(code);
                
                if (response && response.success) {
                    const { user, role: userRole, session_key, dashboard_url } = response;
                    
                    const userToStore = {
                        id: user.id,
                        email: user.email,
                        username: user.username || user.email?.split('@')[0] || '',
                        first_name: user.first_name || '',
                        last_name: user.last_name || '',
                        role: userRole || 'tourister',
                        profile_picture: user.profile_picture || null,
                        email_verified: user.email_verified || false,
                    };
                    
                    sessionStorage.setItem('user', JSON.stringify(userToStore));
                    sessionStorage.setItem('role', userRole || 'tourister');
                    
                    if (session_key) {
                        sessionStorage.setItem('session_key', session_key);
                    }
                    
                    const loginResult = login(userToStore, session_key);
                    
                    if (loginResult && loginResult.success !== false) {
                        const roleRoutes = {
                            'guide': '/guide-dashboard',
                            'admin': '/admin-dashboard',
                            'staff': '/staff-dashboard',
                            'tourister': '/'
                        };
                        const redirectUrl = dashboard_url || roleRoutes[userRole] || '/';
                        navigate(redirectUrl, { replace: true });
                    } else {
                        setError('Failed to complete login');
                        setLoading(false);
                    }
                } else {
                    setError(response?.error || 'Authentication failed');
                    setLoading(false);
                }
            } catch (err) {
                console.error('Google callback error:', err);
                const errorMessage = err.response?.data?.error || err.message || 'Authentication failed';
                setError(errorMessage);
                setLoading(false);
            }
        };

        handleCallback();
    }, [searchParams, navigate, login]);

    // Loading state
    if (loading) {
        return (
            <div style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: "20px",
                background: "#FBF6EA",
                fontFamily: "'Inter', sans-serif"
            }}>
                <div style={{
                    width: 50,
                    height: 50,
                    border: "3px solid rgba(199,154,62,0.2)",
                    borderTop: "3px solid #C79A3E",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite"
                }} />
                <style>{`
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
                <p style={{ color: "#5C6E69", fontSize: 16 }}>Signing in with Google...</p>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: "16px",
                background: "#FBF6EA",
                fontFamily: "'Inter', sans-serif",
                padding: "20px"
            }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>❌</div>
                <h2 style={{ color: "#0B2422", margin: 0 }}>Authentication Failed</h2>
                <p style={{ color: "#5C6E69", fontSize: 14, textAlign: "center", maxWidth: 400 }}>
                    {error}
                </p>
                <button
                    onClick={() => navigate('/login')}
                    style={{
                        marginTop: 16,
                        padding: "12px 32px",
                        background: "#0E5C53",
                        color: "#fff",
                        border: "none",
                        borderRadius: 999,
                        fontSize: 12,
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        cursor: "pointer",
                        fontFamily: "'IBM Plex Mono', monospace",
                        transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#072E2A";
                        e.currentTarget.style.transform = "scale(1.02)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#0E5C53";
                        e.currentTarget.style.transform = "scale(1)";
                    }}
                >
                    Back to Login
                </button>
            </div>
        );
    }

    return null;
};

export default GoogleCallback;