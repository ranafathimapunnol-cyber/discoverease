// components/ProtectedRoute.jsx - COMPLETE FIXED VERSION
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isLoggedIn, role, loading } = useAuth();
  const location = useLocation();

  // Show loading while checking auth
  if (loading) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        background: "#FBF6EA"
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
      </div>
    );
  }

  // Not logged in - redirect to login
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has allowed role
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    const dashboards = {
      'admin': '/admin-dashboard',
      'staff': '/staff-dashboard',
      'guide': '/guide-dashboard',
      'tourister': '/',
    };
    return <Navigate to={dashboards[role] || '/'} replace />;
  }

  return children;
};

export default ProtectedRoute;