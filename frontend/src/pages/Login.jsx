// pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoggedIn } = useAuth();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Handle query params and location state
  useEffect(() => {
    const errorMsg = searchParams.get('error');
    if (errorMsg) {
      setError(decodeURIComponent(errorMsg).replace(/_/g, ' '));
    }
    
    // Handle success message from reset password
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the state after showing
      window.history.replaceState({}, document.title);
    }
  }, [searchParams, location]);

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      const role = sessionStorage.getItem('role') || 'tourister';
      if (role === 'guide') {
        navigate('/guide-dashboard', { replace: true });
      } else if (role === 'admin') {
        navigate('/admin-dashboard', { replace: true });
      } else if (role === 'staff') {
        navigate('/staff-dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [isLoggedIn, navigate]);

  // Handle email/password login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login/', { 
        email, 
        password,
        remember_me: rememberMe 
      });
      
      console.log('Login response:', response.data);

      if (response.data.success) {
        const { user, role, session_key } = response.data;
        login(user, session_key);
        
        // Redirect based on role
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
        setError(response.data.error || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      console.error('Error response:', err.response?.data);
      
      let errorMsg = 'Login failed. Please try again.';
      if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      
      // Handle specific errors
      if (err.response?.data?.verification_required) {
        errorMsg = 'Please verify your email first. Check your inbox for the verification link.';
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Google login
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError('');
    
    try {
      // Get Google auth URL from backend
      const response = await api.get('/auth/google_login/');
      
      console.log('Google login response:', response.data);
      
      if (response.data.success && response.data.auth_url) {
        // Redirect to Google
        window.location.href = response.data.auth_url;
      } else {
        setError(response.data.message || 'Failed to get Google login URL');
        setIsGoogleLoading(false);
      }
    } catch (error) {
      console.error('Google login error:', error);
      console.error('Error response:', error.response?.data);
      
      const errorMsg = error.response?.data?.error || 'Failed to connect to Google login';
      setError(errorMsg);
      setIsGoogleLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #FBF6EA 0%, #F5EDD6 100%)",
      padding: "20px",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      <div style={{
        maxWidth: 440,
        width: "100%",
        background: "#FFFFFF",
        padding: "48px 40px",
        borderRadius: "20px",
        boxShadow: "0 25px 80px rgba(0,0,0,0.08), 0 10px 30px rgba(0,0,0,0.03)",
        border: "1px solid rgba(199,154,62,0.08)",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Decorative accent */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background: "linear-gradient(90deg, #C79A3E, #E4C77B, #C79A3E)",
        }} />

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Link to="/" style={{ textDecoration: "none", display: "inline-block" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: "14px",
                background: "#072E2A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(7,46,42,0.2)"
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C12 2 6 8 6 14a6 6 0 0012 0c0-6-6-12-6-12z" stroke="#E4C77B" strokeWidth="1.5" />
                  <path d="M12 8v10" stroke="#E4C77B" strokeWidth="1.5" />
                  <circle cx="12" cy="12" r="2" fill="#E4C77B" />
                </svg>
              </div>
              <span style={{
                fontSize: 24,
                fontWeight: 700,
                color: "#0B2422",
                letterSpacing: "-0.5px"
              }}>
                Discover<span style={{ color: "#C79A3E" }}>Ease</span>
              </span>
            </div>
          </Link>
        </div>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{
            fontSize: 28,
            fontWeight: 700,
            color: "#0B2422",
            margin: 0,
            marginBottom: 8,
            letterSpacing: "-0.5px"
          }}>
            Welcome Back
          </h1>
          <p style={{
            color: "#6B7280",
            fontSize: 15,
            margin: 0,
            lineHeight: 1.5
          }}>
            Sign in to continue your Kerala journey
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div style={{
            padding: "14px 16px",
            background: "#F0FDF4",
            borderRadius: 12,
            color: "#16A34A",
            marginBottom: 24,
            fontSize: 14,
            border: "1px solid #BBF7D0",
            display: "flex",
            alignItems: "center",
            gap: 8
          }}>
            <span style={{ fontSize: 18 }}>✅</span>
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{
            padding: "14px 16px",
            background: "#FEF2F2",
            borderRadius: 12,
            color: "#DC2626",
            marginBottom: 24,
            fontSize: 14,
            border: "1px solid #FECACA",
            display: "flex",
            alignItems: "center",
            gap: 8
          }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            {error}
          </div>
        )}

        {/* Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading}
          style={{
            width: "100%",
            padding: "14px 20px",
            borderRadius: 12,
            border: "1px solid #E5E7EB",
            background: "#FFFFFF",
            color: "#1F2937",
            fontSize: 15,
            fontWeight: 500,
            cursor: isGoogleLoading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            transition: "all 0.3s ease",
            opacity: isGoogleLoading ? 0.7 : 1,
            fontFamily: "'Inter', sans-serif"
          }}
          onMouseEnter={(e) => {
            if (!isGoogleLoading) {
              e.target.style.borderColor = "#C79A3E";
              e.target.style.boxShadow = "0 4px 12px rgba(199,154,62,0.15)";
              e.target.style.transform = "translateY(-1px)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isGoogleLoading) {
              e.target.style.borderColor = "#E5E7EB";
              e.target.style.boxShadow = "none";
              e.target.style.transform = "translateY(0)";
            }
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {isGoogleLoading ? 'Redirecting to Google...' : 'Continue with Google'}
        </button>

        {/* Divider */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          margin: "24px 0"
        }}>
          <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
          <span style={{
            color: "#9CA3AF",
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: "0.5px",
            textTransform: "uppercase"
          }}>
            or sign in with email
          </span>
          <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ 
              display: "block", 
              marginBottom: 6, 
              color: "#374151", 
              fontSize: 14, 
              fontWeight: 500 
            }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 10,
                border: "1px solid #D1D5DB",
                fontSize: 14,
                outline: "none",
                transition: "all 0.3s ease",
                background: "#FAFAFA",
                fontFamily: "'Inter', sans-serif",
                boxSizing: "border-box"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#C79A3E";
                e.target.style.background = "#FFFFFF";
                e.target.style.boxShadow = "0 0 0 4px rgba(199,154,62,0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#D1D5DB";
                e.target.style.background = "#FAFAFA";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ 
              display: "block", 
              marginBottom: 6, 
              color: "#374151", 
              fontSize: 14, 
              fontWeight: 500 
            }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  paddingRight: "48px",
                  borderRadius: 10,
                  border: "1px solid #D1D5DB",
                  fontSize: 14,
                  outline: "none",
                  transition: "all 0.3s ease",
                  background: "#FAFAFA",
                  fontFamily: "'Inter', sans-serif",
                  boxSizing: "border-box"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#C79A3E";
                  e.target.style.background = "#FFFFFF";
                  e.target.style.boxShadow = "0 0 0 4px rgba(199,154,62,0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#D1D5DB";
                  e.target.style.background = "#FAFAFA";
                  e.target.style.boxShadow = "none";
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#9CA3AF",
                  fontSize: 18,
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24
          }}>
            <label style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 14,
              color: "#4B5563",
              cursor: "pointer"
            }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  width: 16,
                  height: 16,
                  accentColor: "#C79A3E",
                  cursor: "pointer",
                  borderRadius: 4
                }}
              />
              Remember me
            </label>
            <Link to="/forgot-password" style={{
              color: "#C79A3E",
              fontSize: 14,
              textDecoration: "none",
              fontWeight: 500
            }}>
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: 12,
              border: "none",
              background: loading ? "#9CA3AF" : "#072E2A",
              color: "#FFFFFF",
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.3s ease",
              opacity: loading ? 0.7 : 1,
              fontFamily: "'Inter', sans-serif",
              letterSpacing: "0.3px"
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.background = "#0B2422";
                e.target.style.transform = "translateY(-1px)";
                e.target.style.boxShadow = "0 4px 16px rgba(7,46,42,0.3)";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.background = "#072E2A";
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "none";
              }
            }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 0.8s linear infinite" }}>
                  <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="4" />
                  <path d="M4 12a8 8 0 018-8" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
                </svg>
                Signing in...
              </span>
            ) : 'Sign In'}
          </button>
        </form>

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <p style={{ color: "#6B7280", fontSize: 14, margin: 0 }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: "#C79A3E", textDecoration: "none", fontWeight: 600 }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;