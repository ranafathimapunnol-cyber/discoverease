// pages/VerifyEmail.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api, { AuthService } from '../services/api';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided');
      setTimeout(() => navigate('/login'), 1000);
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await api.post('/auth/verify_email/', { token });
        
        if (response.data.success) {
          const user = response.data.user;
          const role = response.data.role || 'tourister';
          
          if (user) {
            sessionStorage.setItem('user', JSON.stringify(user));
            sessionStorage.setItem('role', role);
          }
          
          setStatus('success');
          
          // ✅ Instant redirect
          const redirectUrl = role === 'guide' ? '/guide-dashboard' : '/';
          setTimeout(() => {
            navigate(redirectUrl, { replace: true });
          }, 500);
          
        } else {
          setStatus('error');
          setMessage(response.data.error || 'Verification failed');
          setTimeout(() => navigate('/login'), 1000);
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage(error.response?.data?.error || 'Verification failed');
        setTimeout(() => navigate('/login'), 1000);
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

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
          width: 40, 
          height: 40, 
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
        <p style={{ marginTop: 16, color: "#5C6E69" }}>Verifying...</p>
      </div>
    );
  }

  if (status === 'success') {
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
          <div style={{ fontSize: "48px", marginBottom: "8px" }}>✅</div>
          <h1 style={{ fontSize: "24px", color: "#0B2422", margin: "0 0 4px" }}>Verified!</h1>
          <p style={{ color: "#5C6E69", fontSize: "14px", margin: 0 }}>Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      background: "#FBF6EA",
      padding: "20px"
    }}>
      <div style={{
        background: "#fff",
        padding: "40px",
        borderRadius: "20px",
        textAlign: "center",
        maxWidth: "400px",
        width: "100%",
        boxShadow: "0 25px 80px rgba(0,0,0,0.08)",
        border: "1px solid rgba(199,154,62,0.1)"
      }}>
        <div style={{ fontSize: "48px", marginBottom: "8px" }}>❌</div>
        <h1 style={{ fontSize: "24px", color: "#0B2422", margin: "0 0 4px" }}>Verification Failed</h1>
        <p style={{ color: "#5C6E69", fontSize: "14px", margin: "0 0 16px" }}>
          {message}
        </p>
        <p style={{ color: "#8A9A95", fontSize: "12px" }}>Redirecting to login...</p>
      </div>
    </div>
  );
};

export default VerifyEmail;