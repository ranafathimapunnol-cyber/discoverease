// components/ProtectedRoute.jsx
import React, { useEffect, useState, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const location = useLocation();
  const { isLoggedIn, role, isLoading } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [checking, setChecking] = useState(true);
  const hasRedirected = useRef(false);

  useEffect(() => {
    // ✅ Prevent multiple redirects
    if (hasRedirected.current) return;
    
    if (!isLoading) {
      const loggedIn = isLoggedIn || !!localStorage.getItem('auth_token');
      const userRoleFromStorage = role || localStorage.getItem('role') || 'tourister';
      
      console.log('ProtectedRoute - Check:', { 
        isLoggedIn: loggedIn, 
        role: userRoleFromStorage,
        allowedRoles,
        isLoading 
      });
      
      setIsAuthenticated(loggedIn);
      setUserRole(userRoleFromStorage);
      setChecking(false);
      
      // ✅ If not authenticated and not loading, mark as redirected
      if (!loggedIn) {
        hasRedirected.current = true;
      }
    }
  }, [isLoading, isLoggedIn, role, allowedRoles]);

  // ✅ Show loading
  if (isLoading || checking) {
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

  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ✅ Check role
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    console.log('Role not allowed:', userRole, 'Allowed:', allowedRoles);
    const dashboard = userRole === 'admin' ? '/admin-dashboard' :
                     userRole === 'guide' ? '/guide-dashboard' :
                     userRole === 'staff' ? '/staff-dashboard' :
                     '/';
    return <Navigate to={dashboard} replace />;
  }

  return children;
};

export default ProtectedRoute;