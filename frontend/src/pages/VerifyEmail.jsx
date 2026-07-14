// pages/VerifyEmail.jsx - CLEAN FIXED VERSION
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [status, setStatus] = useState('loading');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    const verifyEmail = async () => {
      try {
        console.log('🔍 Verifying email with token:', token);
        
        const response = await api.post('/auth/verify-email/', { token });
        console.log('📥 Verification response:', response.data);

        // ✅ SUCCESS
        if (response.data.success) {
          const user = response.data.user;
          const role = response.data.role || 'tourister';
          const session_key = response.data.session_key;
          
          if (user) {
            const userToStore = {
              id: user.id,
              email: user.email,
              first_name: user.first_name || '',
              last_name: user.last_name || '',
              role: role,
              phone: user.phone || '',
              profile_picture: user.profile_picture || null,
              email_verified: true,
            };
            
            sessionStorage.setItem('user', JSON.stringify(userToStore));
            sessionStorage.setItem('role', role);
            if (session_key) {
              sessionStorage.setItem('session_key', session_key);
            }
            
            login(userToStore, session_key);
          }
          
          // ✅ SHOW SUCCESS
          setStatus('success');
          
          // Redirect after 3 seconds
          let count = 3;
          const interval = setInterval(() => {
            count -= 1;
            setCountdown(count);
            if (count <= 0) {
              clearInterval(interval);
              navigate('/', { replace: true });
            }
          }, 1000);
          return;
        }
        
        // ❌ FAILED
        console.log('❌ Verification failed');
        navigate('/login', { replace: true });
        
      } catch (error) {
        console.error('❌ Verification error:', error);
        navigate('/login', { replace: true });
      }
    };

    verifyEmail();
  }, [searchParams, navigate, login]);

  // Loading state
  if (status === 'loading') {
    return (
      <div style={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        background: "#FBF6EA",
        flexDirection: "column"
      }}>
        <div style={{ 
          width: 48, 
          height: 48, 
          border: "3px solid #E4C77B", 
          borderTop: "3px solid transparent", 
          borderRadius: "50%", 
          animation: "spin 0.8s linear infinite" 
        }} />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
        <p style={{ marginTop: 16, color: "#5C6E69", fontSize: 14 }}>Verifying your email...</p>
      </div>
    );
  }

  // ✅ SUCCESS STATE - ONLY SHOWS WHEN VERIFIED
  return (
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      background: "linear-gradient(135deg, #FBF6EA 0%, #F5EDD6 100%)",
      padding: "20px"
    }}>
      <div style={{
        background: "#fff",
        padding: "48px 40px",
        borderRadius: "20px",
        textAlign: "center",
        maxWidth: "440px",
        width: "100%",
        boxShadow: "0 25px 80px rgba(0,0,0,0.08)",
        border: "1px solid rgba(199,154,62,0.1)"
      }}>
        <div style={{ 
          fontSize: "64px", 
          marginBottom: "8px",
          animation: "bounce 1s ease infinite"
        }}>✅</div>
        <style>{`
          @keyframes bounce {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.2); }
          }
        `}</style>
        <h1 style={{ 
          fontSize: "28px", 
          color: "#0B2422", 
          margin: "0 0 8px",
          fontWeight: 700
        }}>
          You're Verified! 🎉
        </h1>
        <p style={{ 
          color: "#5C6E69", 
          fontSize: "15px", 
          margin: "0 0 16px",
          lineHeight: 1.6
        }}>
          Your email has been successfully verified.
        </p>
        <div style={{
          background: "#F3F4F6",
          padding: "12px",
          borderRadius: "8px",
          marginBottom: "16px"
        }}>
          <p style={{ 
            color: "#6B7280", 
            fontSize: "14px", 
            margin: 0
          }}>
            Redirecting to home in <strong style={{ color: "#C79A3E", fontSize: "18px" }}>{countdown}</strong> seconds...
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: "12px 32px",
            borderRadius: "10px",
            border: "none",
            background: "#072E2A",
            color: "#fff",
            cursor: "pointer",
            fontSize: "15px",
            fontWeight: 600,
            transition: "all 0.3s ease",
            fontFamily: "'Inter', sans-serif"
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "#0B2422";
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = "0 4px 16px rgba(7,46,42,0.3)";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "#072E2A";
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "none";
          }}
        >
          Go to Home Now →
        </button>
      </div>
    </div>
  );
};

export default VerifyEmail;