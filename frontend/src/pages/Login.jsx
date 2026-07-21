// pages/Login.jsx - COMPLETE FIXED VERSION (Session-Based)

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import ReCAPTCHA from 'react-google-recaptcha';

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

  const [captchaValue, setCaptchaValue] = useState(null);
  const [captchaError, setCaptchaError] = useState('');

  useEffect(() => {
    const errorMsg = searchParams.get('error');
    if (errorMsg) {
      setError(decodeURIComponent(errorMsg).replace(/_/g, ' '));
    }

    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, [searchParams, location]);

  useEffect(() => {
    if (isLoggedIn) {
      const role = sessionStorage.getItem('role') || 'tourister';
      const roleRoutes = {
        'guide': '/guide-dashboard',
        'admin': '/admin-dashboard',
        'staff': '/staff-dashboard',
        'tourister': '/'
      };
      navigate(roleRoutes[role] || '/', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  // ✅ FIXED: Login handler - Session Based (NO TOKEN)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    if (!captchaValue) {
      setError('Please complete the CAPTCHA verification');
      setLoading(false);
      return;
    }

    try {
      console.log('📤 Sending login request for:', email);

      const response = await api.post('/auth/login/', {
        email: email.trim(),
        password: password,
        remember_me: rememberMe
      });

      console.log('📥 Login response:', response.data);

      if (response.data && response.data.success) {
        const { user, role: userRole, session_key } = response.data;

        // ✅ NO TOKEN - Just store user data
        const userToStore = {
          id: user.id,
          email: user.email,
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          role: userRole || 'tourister',
          phone: user.phone || '',
          profile_picture: user.profile_picture || null,
          email_verified: user.email_verified || false,
        };

        // ✅ Call login from AuthContext (NO TOKEN)
        const result = login(userToStore, session_key);

        if (result && result.success !== false) {
          const roleRoutes = {
            'guide': '/guide-dashboard',
            'admin': '/admin-dashboard',
            'staff': '/staff-dashboard',
            'tourister': '/'
          };
          navigate(roleRoutes[userRole] || '/', { replace: true });
        } else {
          setError(result?.error || 'Login failed');
        }
      } else {
        setError(response.data?.error || 'Login failed');
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      let errorMsg = 'Login failed. Please try again.';
      if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError('');

    try {
      const response = await api.get('/auth/google-login/');

      console.log('Google login response:', response.data);

      if (response.data && response.data.success && response.data.auth_url) {
        window.location.href = response.data.auth_url;
      } else {
        setError('Failed to get Google login URL');
        setIsGoogleLoading(false);
      }
    } catch (error) {
      console.error('Google login error:', error);
      setError('Failed to connect to Google login. Please try again.');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="gl-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,500&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');

        * { box-sizing: border-box; }

        .gl-page {
          min-height: 100vh;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 18px;
          overflow: hidden;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: linear-gradient(135deg, #FDF9EF 0%, #F3ECD8 45%, #EAF3EE 100%);
        }

        /* Soft blurred color blobs floating behind the glass */
        .gl-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          pointer-events: none;
        }
        .gl-blob.b1 { width: 420px; height: 420px; top: -140px; left: -100px; background: rgba(199,154,62,0.35); }
        .gl-blob.b2 { width: 380px; height: 380px; bottom: -160px; right: -100px; background: rgba(11,77,66,0.28); }
        .gl-blob.b3 { width: 260px; height: 260px; top: 40%; right: 8%; background: rgba(228,199,123,0.30); }

        .gl-grain {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(11,36,34,0.05) 1px, transparent 1px);
          background-size: 26px 26px;
          pointer-events: none;
        }

        /* ---------- GLASS CARD ---------- */
        .gl-card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 400px;
          background: rgba(255,255,255,0.55);
          backdrop-filter: blur(22px) saturate(160%);
          -webkit-backdrop-filter: blur(22px) saturate(160%);
          border: 1px solid rgba(255,255,255,0.6);
          border-radius: 24px;
          box-shadow: 0 24px 70px rgba(11,36,34,0.16), inset 0 1px 0 rgba(255,255,255,0.7);
          padding: 40px 34px 32px;
        }

        .gl-brandmark {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 26px;
        }
        .gl-brandmark-icon {
          width: 38px; height: 38px; border-radius: 11px;
          background: rgba(199,154,62,0.18);
          border: 1px solid rgba(199,154,62,0.4);
          backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .gl-brandmark-text { font-size: 16px; font-weight: 600; color: #0B2422; letter-spacing: 0.2px; }
        .gl-brandmark-text em { font-style: normal; color: #A9781E; }

        .gl-heading { margin: 0 0 24px; }
        .gl-heading-eyebrow {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: #A9781E;
          margin: 0 0 6px;
        }
        .gl-heading-title {
          font-family: 'Fraunces', serif;
          font-style: italic;
          font-weight: 500;
          font-size: 27px;
          color: #0B2422;
          margin: 0 0 4px;
        }
        .gl-heading-sub {
          font-size: 13px;
          color: #5A5548;
          margin: 0;
        }

        .gl-banner {
          padding: 11px 14px;
          border-radius: 12px;
          font-size: 12.5px;
          margin-bottom: 16px;
          display: flex;
          align-items: flex-start;
          gap: 8px;
          line-height: 1.4;
          backdrop-filter: blur(6px);
        }
        .gl-banner.success { background: rgba(240,251,245,0.75); color: #166534; border: 1px solid rgba(191,231,205,0.8); }
        .gl-banner.error { background: rgba(253,243,239,0.8); color: #9A3412; border: 1px solid rgba(243,210,190,0.8); }

        .gl-field { margin-bottom: 15px; }
        .gl-field-label {
          display: block;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #6B5B36;
          margin-bottom: 7px;
        }
        .gl-field-wrap { position: relative; }
        .gl-field-input {
          width: 100%;
          padding: 11px 14px;
          border-radius: 12px;
          border: 1px solid rgba(199,154,62,0.28);
          background: rgba(255,255,255,0.45);
          backdrop-filter: blur(8px);
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          color: #0B2422;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }
        .gl-field-input::placeholder { color: #9C8A6E; }
        .gl-field-input:focus {
          border-color: #C79A3E;
          background: rgba(255,255,255,0.75);
          box-shadow: 0 0 0 3.5px rgba(199,154,62,0.14);
        }
        .gl-pw-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #8A7B54;
          font-size: 16px;
          padding: 2px;
          line-height: 1;
        }

        .gl-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 4px 0 16px;
        }
        .gl-remember { display: flex; align-items: center; gap: 7px; font-size: 12.5px; color: #4B5563; cursor: pointer; }
        .gl-remember input { accent-color: #C79A3E; width: 14px; height: 14px; cursor: pointer; }
        .gl-forgot { color: #A9781E; font-size: 12.5px; text-decoration: none; font-weight: 500; }
        .gl-forgot:hover { text-decoration: underline; }

        /* CAPTCHA — glass checkpoint, right above submit */
        .gl-checkpoint { margin-bottom: 16px; }
        .gl-checkpoint-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #6B5B36;
          margin-bottom: 9px;
        }
        .gl-checkpoint-inner {
          display: flex;
          justify-content: center;
          padding: 12px;
          background: rgba(255,255,255,0.35);
          backdrop-filter: blur(10px);
          border: 1px dashed rgba(199,154,62,0.5);
          border-radius: 14px;
        }
        .gl-captcha-err { color: #B4472A; font-size: 11.5px; margin: 7px 0 0; text-align: center; }

        .gl-submit {
          width: 100%;
          padding: 13.5px;
          border-radius: 13px;
          border: 1px solid rgba(7,46,42,0.15);
          background: linear-gradient(135deg, rgba(11,77,66,0.92), rgba(7,46,42,0.95));
          backdrop-filter: blur(10px);
          color: #FBF6EA;
          font-size: 14.5px;
          font-weight: 600;
          letter-spacing: 0.3px;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.25s ease, filter 0.2s ease;
        }
        .gl-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 10px 26px rgba(7,46,42,0.28);
          filter: brightness(1.06);
        }
        .gl-submit:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .gl-submit:focus-visible,
        .gl-google-btn:focus-visible,
        .gl-field-input:focus-visible {
          outline: 2px solid #C79A3E;
          outline-offset: 2px;
        }

        .gl-divider { display: flex; align-items: center; gap: 12px; margin: 20px 0 15px; }
        .gl-divider-line { flex: 1; height: 1px; background: rgba(199,154,62,0.25); }
        .gl-divider-text {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9.5px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #9C8A5C;
        }

        .gl-google-btn {
          width: 100%;
          padding: 11.5px 16px;
          border-radius: 12px;
          border: 1px solid rgba(199,154,62,0.28);
          background: rgba(255,255,255,0.45);
          backdrop-filter: blur(8px);
          color: #0B2422;
          font-size: 13.5px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, background 0.2s ease;
        }
        .gl-google-btn:hover:not(:disabled) {
          border-color: #C79A3E;
          background: rgba(255,255,255,0.7);
          box-shadow: 0 6px 16px rgba(199,154,62,0.16);
          transform: translateY(-1px);
        }
        .gl-google-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .gl-register {
          text-align: center;
          margin-top: 20px;
          font-size: 12.5px;
          color: #6B6553;
        }
        .gl-register a { color: #A9781E; font-weight: 600; text-decoration: none; }
        .gl-register a:hover { text-decoration: underline; }

        @keyframes gl-spin { to { transform: rotate(360deg); } }
        @keyframes gl-drift {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(14px, -10px); }
        }
        .gl-blob { animation: gl-drift 12s ease-in-out infinite; }
        .gl-blob.b2 { animation-duration: 15s; animation-delay: -3s; }
        .gl-blob.b3 { animation-duration: 10s; animation-delay: -6s; }
        @media (prefers-reduced-motion: reduce) {
          .gl-blob { animation: none; }
        }

        @media (max-width: 420px) {
          .gl-card { padding: 32px 24px 26px; border-radius: 20px; }
        }
      `}</style>

      <div className="gl-blob b1" />
      <div className="gl-blob b2" />
      <div className="gl-blob b3" />
      <div className="gl-grain" />

      <div className="gl-card">
        <div className="gl-brandmark">
          <div className="gl-brandmark-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C12 2 6 8 6 14a6 6 0 0012 0c0-6-6-12-6-12z" stroke="#A9781E" strokeWidth="1.5" />
              <path d="M12 8v10" stroke="#A9781E" strokeWidth="1.5" />
              <circle cx="12" cy="12" r="2" fill="#A9781E" />
            </svg>
          </div>
          <span className="gl-brandmark-text">Discover<em>Ease</em></span>
        </div>

        <div className="gl-heading">
          <p className="gl-heading-eyebrow">Access · Traveler Portal</p>
          <h1 className="gl-heading-title">Welcome back</h1>
          <p className="gl-heading-sub">Sign in to continue your Kerala journey</p>
        </div>

        {successMessage && (
          <div className="gl-banner success">
            <span>✓</span>
            <span>{successMessage}</span>
          </div>
        )}
        {error && (
          <div className="gl-banner error">
            <span>!</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="gl-field">
            <label className="gl-field-label">Email address</label>
            <div className="gl-field-wrap">
              <input
                className="gl-field-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="gl-field">
            <label className="gl-field-label">Password</label>
            <div className="gl-field-wrap">
              <input
                className="gl-field-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                style={{ paddingRight: 38 }}
              />
              <button
                type="button"
                className="gl-pw-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '◠' : '◡'}
              </button>
            </div>
          </div>

          <div className="gl-row">
            <label className="gl-remember">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember me
            </label>
            <Link to="/forgot-password" className="gl-forgot">Forgot password?</Link>
          </div>

          {/* CAPTCHA sits right above the submit button */}
          <div className="gl-checkpoint">
            <p className="gl-checkpoint-label">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                <rect x="4" y="10" width="16" height="10" rx="2" stroke="#6B5B36" strokeWidth="1.5" />
                <path d="M8 10V7a4 4 0 018 0v3" stroke="#6B5B36" strokeWidth="1.5" />
              </svg>
              Security check
            </p>
            <div className="gl-checkpoint-inner">
              <ReCAPTCHA
                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'}
                onChange={(value) => {
                  setCaptchaValue(value);
                  setCaptchaError('');
                }}
                onExpired={() => {
                  setCaptchaValue(null);
                  setCaptchaError('CAPTCHA expired. Please try again.');
                }}
                onErrored={() => setCaptchaError('reCAPTCHA error occurred')}
              />
            </div>
            {captchaError && <p className="gl-captcha-err">{captchaError}</p>}
          </div>

          <button type="submit" className="gl-submit" disabled={loading}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ animation: 'gl-spin 0.8s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" stroke="rgba(251,246,234,0.3)" strokeWidth="4" />
                  <path d="M4 12a8 8 0 018-8" stroke="#FBF6EA" strokeWidth="4" strokeLinecap="round" />
                </svg>
                Signing in...
              </span>
            ) : 'Sign in'}
          </button>
        </form>

        <div className="gl-divider">
          <div className="gl-divider-line" />
          <span className="gl-divider-text">or continue with</span>
          <div className="gl-divider-line" />
        </div>

        <button
          type="button"
          className="gl-google-btn"
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {isGoogleLoading ? 'Redirecting to Google...' : 'Continue with Google'}
        </button>

        <div className="gl-register">
          Don't have an account? <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;