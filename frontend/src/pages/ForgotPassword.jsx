// pages/ForgotPassword.jsx - FULL REAL VERSION
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // ✅ REAL API CALL
      const response = await api.post('/auth/forgot-password/', { email });
      
      console.log('Forgot password response:', response.data);
      
      if (response.data.success) {
        setSuccess(true);
        // Start countdown for resend
        setCountdown(60);
        const interval = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(response.data.error || 'Failed to send reset link');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      console.error('Error response:', err.response?.data);
      
      // ✅ Show real error from backend
      const errorMsg = err.response?.data?.error || 'Something went wrong. Please try again.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    if (countdown === 0) {
      handleSubmit(new Event('submit'));
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

        {/* Back Button */}
        <Link to="/login" style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          color: "#6B7280",
          textDecoration: "none",
          fontSize: 14,
          marginBottom: 24,
          transition: "color 0.3s ease"
        }}
        onMouseEnter={(e) => e.target.style.color = "#C79A3E"}
        onMouseLeave={(e) => e.target.style.color = "#6B7280"}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Login
        </Link>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
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
            Reset Password
          </h1>
          <p style={{
            color: "#6B7280",
            fontSize: 15,
            margin: 0,
            lineHeight: 1.5
          }}>
            Enter your email and we'll send you a reset link
          </p>
        </div>

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

        {/* Success Message */}
        {success && (
          <div style={{
            padding: "16px 20px",
            background: "#F0FDF4",
            borderRadius: 12,
            color: "#16A34A",
            marginBottom: 24,
            fontSize: 14,
            border: "1px solid #BBF7D0",
            textAlign: "center"
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📧</div>
            <p style={{ fontWeight: 600, margin: "0 0 4px" }}>Check your email!</p>
            <p style={{ margin: 0, color: "#4B5563" }}>
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            {countdown > 0 ? (
              <p style={{ marginTop: 12, fontSize: 13, color: "#6B7280" }}>
                Resend available in {countdown}s
              </p>
            ) : (
              <button
                onClick={handleResend}
                style={{
                  marginTop: 12,
                  background: "none",
                  border: "none",
                  color: "#C79A3E",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 500,
                  textDecoration: "underline"
                }}
              >
                Resend email
              </button>
            )}
          </div>
        )}

        {/* Form - Only show if not success */}
        {!success && (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", marginBottom: 6, color: "#374151", fontSize: 14, fontWeight: 500 }}>
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
                  fontFamily: "'Inter', sans-serif"
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
                  Sending...
                </span>
              ) : 'Send Reset Link'}
            </button>
          </form>
        )}

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <p style={{ color: "#6B7280", fontSize: 14, margin: 0 }}>
            Remember your password?{' '}
            <Link to="/login" style={{ color: "#C79A3E", textDecoration: "none", fontWeight: 600 }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;