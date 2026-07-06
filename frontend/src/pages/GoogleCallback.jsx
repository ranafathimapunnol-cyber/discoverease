// pages/GoogleCallback.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const GoogleCallback = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { login } = useAuth();
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const hasProcessed = useRef(false);

    useEffect(() => {
        const handleCallback = async () => {
            // ✅ Prevent multiple submissions
            if (hasProcessed.current) {
                console.log('Already processed, skipping...');
                return;
            }
            hasProcessed.current = true;

            const code = searchParams.get('code');
            const errorParam = searchParams.get('error');
            
            console.log('=== Google Callback Debug ===');
            console.log('Code received:', code ? 'Yes' : 'No');
            console.log('Code value:', code?.substring(0, 30) + '...');
            console.log('Error param:', errorParam);
            
            // ✅ Check for error from Google
            if (errorParam) {
                setError(`Google error: ${errorParam}`);
                setLoading(false);
                setTimeout(() => navigate('/login?error=' + encodeURIComponent(errorParam)), 2000);
                return;
            }
            
            if (!code) {
                setError('No authorization code received from Google');
                setLoading(false);
                setTimeout(() => navigate('/login?error=No+code+received'), 2000);
                return;
            }

            try {
                setLoading(true);
                
                console.log('Sending code to backend...');
                
                // ✅ Send code to backend
                const response = await api.post('/auth/google_auth/', { 
                    code: code,
                    role: 'tourister'  // Default role
                });

                console.log('Backend response:', response.data);

                if (response.data.success) {
                    const { user, role, session_key, is_new_user } = response.data;
                    
                    // ✅ Login user
                    login(user, session_key);
                    
                    // ✅ Redirect based on role
                    if (role === 'guide') {
                        navigate('/guide-dashboard', { replace: true });
                    } else if (role === 'admin') {
                        navigate('/admin-dashboard', { replace: true });
                    } else if (role === 'staff') {
                        navigate('/staff-dashboard', { replace: true });
                    } else {
                        navigate('/', { replace: true });
                    }
                } else {
                    const errorMsg = response.data.error || 'Authentication failed';
                    setError(errorMsg);
                    setLoading(false);
                    setTimeout(() => navigate('/login?error=' + encodeURIComponent(errorMsg)), 2000);
                }
            } catch (err) {
                console.error('Google callback error:', err);
                console.error('Error response:', err.response?.data);
                console.error('Error status:', err.response?.status);
                
                let errorMsg = 'Google authentication failed';
                
                if (err.response?.data?.error) {
                    errorMsg = err.response.data.error;
                } else if (err.response?.data?.message) {
                    errorMsg = err.response.data.message;
                } else if (err.message) {
                    errorMsg = err.message;
                }
                
                setError(errorMsg);
                setLoading(false);
                setTimeout(() => navigate('/login?error=' + encodeURIComponent(errorMsg)), 2000);
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
                        e.target.style.background = "#072E2A";
                        e.target.style.transform = "scale(1.02)";
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = "#0E5C53";
                        e.target.style.transform = "scale(1)";
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