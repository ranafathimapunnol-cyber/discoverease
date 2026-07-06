// pages/AuthSuccess.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AuthSuccess = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    useEffect(() => {
        // Get user data from URL params
        const params = new URLSearchParams(window.location.search);
        const userData = params.get('user');
        const role = params.get('role');
        const sessionKey = params.get('session_key');

        if (userData) {
            try {
                const user = JSON.parse(decodeURIComponent(userData));
                
                // ✅ Use AuthContext login
                login(user, sessionKey, role || 'tourister');
                
                // Redirect to dashboard based on role
                setTimeout(() => {
                    if (role === 'admin') {
                        navigate('/admin-dashboard');
                    } else if (role === 'guide') {
                        navigate('/guide-dashboard');
                    } else if (role === 'staff') {
                        navigate('/staff-dashboard');
                    } else {
                        navigate('/');
                    }
                }, 1500);
            } catch (error) {
                console.error('Error parsing user data:', error);
                navigate('/login?error=invalid_data');
            }
        } else {
            navigate('/login?error=no_user_data');
        }
    }, [navigate, login]);

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#FBF6EA",
            fontFamily: "'Inter', sans-serif"
        }}>
            <div style={{
                background: "#fff",
                padding: "48px 40px",
                borderRadius: "20px",
                boxShadow: "0 25px 80px rgba(0,0,0,0.08)",
                textAlign: "center",
                maxWidth: 440,
                width: "100%"
            }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>🌴</div>
                <h1 style={{ fontSize: 28, color: "#0B2422", marginBottom: 8 }}>Login Successful!</h1>
                <p style={{ color: "#5C6E69", marginBottom: 24 }}>Redirecting to your dashboard...</p>
                <div style={{
                    width: 40,
                    height: 40,
                    border: "3px solid #E4C77B",
                    borderTop: "3px solid transparent",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                    margin: "0 auto"
                }} />
                <style>{`
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        </div>
    );
};

export default AuthSuccess;