// src/pages/Register.jsx - FINAL VERSION
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirm_password: '',
    first_name: '',
    last_name: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const user = sessionStorage.getItem('user');
    if (user && user !== 'null' && user !== 'undefined') {
      navigate('/');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/register/', {
        email: formData.email,
        password: formData.password,
        confirm_password: formData.confirm_password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        // No username - backend auto-generates
        // No role - backend defaults to 'tourister'
      });
      
      console.log('Registration response:', response.data);

      if (response.data.success) {
        setSuccess('✅ Registration successful! Please check your email to verify your account.');
        
        setFormData({
          email: '',
          password: '',
          confirm_password: '',
          first_name: '',
          last_name: '',
          phone: '',
        });
        
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        if (response.data.errors) {
          const errorMessages = [];
          for (const [field, errors] of Object.entries(response.data.errors)) {
            errorMessages.push(`${field}: ${errors.join(', ')}`);
          }
          setError(errorMessages.join(' | '));
        } else {
          setError(response.data.error || 'Registration failed. Please try again.');
        }
      }
    } catch (err) {
      console.error('Registration error:', err);
      
      if (err.response?.data?.errors) {
        const errorMessages = [];
        for (const [field, errors] of Object.entries(err.response.data.errors)) {
          errorMessages.push(`${field}: ${errors.join(', ')}`);
        }
        setError(errorMessages.join(' | '));
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
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
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{
        maxWidth: 480,
        width: "100%",
        background: "#FFFFFF",
        padding: "48px 40px",
        borderRadius: "20px",
        boxShadow: "0 25px 80px rgba(0,0,0,0.08), 0 10px 30px rgba(0,0,0,0.03)",
        border: "1px solid rgba(199,154,62,0.08)",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background: "linear-gradient(90deg, #C79A3E, #E4C77B, #C79A3E)",
        }} />

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

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{
            fontSize: 28,
            fontWeight: 700,
            color: "#0B2422",
            margin: 0,
            marginBottom: 8,
            letterSpacing: "-0.5px"
          }}>
            Create Account
          </h1>
          <p style={{
            color: "#6B7280",
            fontSize: 15,
            margin: 0,
            lineHeight: 1.5
          }}>
            Join DiscoverEase and explore Kerala
          </p>
          <p style={{
            color: "#9CA3AF",
            fontSize: 13,
            margin: "8px 0 0 0"
          }}>
            All users start as Touristers. Staff and Admin accounts are created by administrators.
          </p>
        </div>

        {success && (
          <div style={{
            padding: "14px 16px",
            background: "#DCFCE7",
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
            <span dangerouslySetInnerHTML={{ __html: success.replace(/\n/g, '<br/>') }} />
          </div>
        )}

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

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 6, color: "#374151", fontSize: 14, fontWeight: 500 }}>
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              autoComplete="email"
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #D1D5DB",
                fontSize: 14,
                background: "#FAFAFA",
                fontFamily: "'Inter', sans-serif",
                transition: "all 0.3s ease"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#C79A3E";
                e.target.style.background = "#FFFFFF";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#D1D5DB";
                e.target.style.background = "#FAFAFA";
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ display: "block", marginBottom: 6, color: "#374151", fontSize: 14, fontWeight: 500 }}>
                First Name
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="First name"
                autoComplete="given-name"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #D1D5DB",
                  fontSize: 14,
                  background: "#FAFAFA",
                  fontFamily: "'Inter', sans-serif",
                  transition: "all 0.3s ease"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#C79A3E";
                  e.target.style.background = "#FFFFFF";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#D1D5DB";
                  e.target.style.background = "#FAFAFA";
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 6, color: "#374151", fontSize: 14, fontWeight: 500 }}>
                Last Name
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Last name"
                autoComplete="family-name"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #D1D5DB",
                  fontSize: 14,
                  background: "#FAFAFA",
                  fontFamily: "'Inter', sans-serif",
                  transition: "all 0.3s ease"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#C79A3E";
                  e.target.style.background = "#FFFFFF";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#D1D5DB";
                  e.target.style.background = "#FAFAFA";
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 6, color: "#374151", fontSize: 14, fontWeight: 500 }}>
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+91 98765 43210"
              autoComplete="tel"
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #D1D5DB",
                fontSize: 14,
                background: "#FAFAFA",
                fontFamily: "'Inter', sans-serif",
                transition: "all 0.3s ease"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#C79A3E";
                e.target.style.background = "#FFFFFF";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#D1D5DB";
                e.target.style.background = "#FAFAFA";
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 6, color: "#374151", fontSize: 14, fontWeight: 500 }}>
              Password *
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password (min 8 characters)"
                required
                autoComplete="new-password"
                style={{
                  width: "100%",
                  padding: "10px 40px 10px 14px",
                  borderRadius: 8,
                  border: "1px solid #D1D5DB",
                  fontSize: 14,
                  background: "#FAFAFA",
                  fontFamily: "'Inter', sans-serif",
                  transition: "all 0.3s ease"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#C79A3E";
                  e.target.style.background = "#FFFFFF";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#D1D5DB";
                  e.target.style.background = "#FAFAFA";
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#9CA3AF",
                  fontSize: 18,
                  padding: 0
                }}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", marginBottom: 6, color: "#374151", fontSize: 14, fontWeight: 500 }}>
              Confirm Password *
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
                autoComplete="new-password"
                style={{
                  width: "100%",
                  padding: "10px 40px 10px 14px",
                  borderRadius: 8,
                  border: "1px solid #D1D5DB",
                  fontSize: 14,
                  background: "#FAFAFA",
                  fontFamily: "'Inter', sans-serif",
                  transition: "all 0.3s ease"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#C79A3E";
                  e.target.style.background = "#FFFFFF";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#D1D5DB";
                  e.target.style.background = "#FAFAFA";
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#9CA3AF",
                  fontSize: 18,
                  padding: 0
                }}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
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
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.background = "#072E2A";
              }
            }}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <p style={{ color: "#6B7280", fontSize: 14, margin: 0 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: "#C79A3E", textDecoration: "none", fontWeight: 600 }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;