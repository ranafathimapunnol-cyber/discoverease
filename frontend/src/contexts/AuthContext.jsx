// contexts/AuthContext.jsx - COMPLETE FIXED VERSION
import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState(null);

  // ============================================
  // CHECK AUTHENTICATION STATUS - FIXED
  // ============================================
  const checkAuth = async () => {
    try {
      // ✅ First check sessionStorage
      const storedUser = sessionStorage.getItem('user');
      const storedRole = sessionStorage.getItem('role');
      const sessionKey = sessionStorage.getItem('session_key');

      if (storedUser && storedUser !== 'null' && storedUser !== 'undefined') {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setRole(storedRole || userData.role || 'tourister');
          setIsLoggedIn(true);
          setLoading(false);
          
          // ✅ If we have a session key, set it in axios headers
          if (sessionKey) {
            api.defaults.headers.common['X-Session-Key'] = sessionKey;
          }
          return;
        } catch (e) {
          console.warn('Failed to parse stored user:', e);
        }
      }

      // ✅ Try API check only if we have a session cookie
      // Check if session cookie exists by looking at document.cookie
      const hasSession = document.cookie.split(';').some(c => c.trim().startsWith('sessionid='));
      
      if (hasSession) {
        try {
          const response = await api.get('/auth/me/');
          if (response.data && response.data.success) {
            const userData = response.data.user;
            const userRole = response.data.role || userData.role || 'tourister';
            
            const userToStore = {
              id: userData.id,
              email: userData.email,
              username: userData.username || userData.email?.split('@')[0] || '',
              first_name: userData.first_name || '',
              last_name: userData.last_name || '',
              role: userRole,
              phone: userData.phone || '',
              bio: userData.bio || '',
              profile_picture: userData.profile_picture || null,
              email_verified: userData.email_verified || false,
            };
            
            sessionStorage.setItem('user', JSON.stringify(userToStore));
            sessionStorage.setItem('role', userRole);
            
            setUser(userToStore);
            setRole(userRole);
            setIsLoggedIn(true);
          }
        } catch (apiError) {
          // ✅ Silent fail - user is not logged in
          console.log('No active session found');
          // Clear any stale session data
          sessionStorage.removeItem('user');
          sessionStorage.removeItem('role');
          sessionStorage.removeItem('session_key');
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // INITIAL AUTH CHECK
  // ============================================
  useEffect(() => {
    checkAuth();
    
    const handleStorageChange = (e) => {
      if (e.key === 'user' || e.key === 'role') {
        checkAuth();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // ============================================
  // LOGIN FUNCTION - FIXED
  // ============================================
  const login = (userData, sessionKey) => {
    try {
      console.log('Login called with user data:', userData);
      
      if (!userData) {
        return { success: false, error: 'No user data provided' };
      }

      const userToStore = {
        id: userData.id,
        email: userData.email,
        username: userData.username || userData.email?.split('@')[0] || '',
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        role: userData.role || 'tourister',
        phone: userData.phone || '',
        bio: userData.bio || '',
        profile_picture: userData.profile_picture || null,
        email_verified: userData.email_verified || false,
      };
      
      sessionStorage.setItem('user', JSON.stringify(userToStore));
      sessionStorage.setItem('role', userToStore.role);
      
      if (sessionKey) {
        sessionStorage.setItem('session_key', sessionKey);
        // ✅ Set session key in axios headers
        api.defaults.headers.common['X-Session-Key'] = sessionKey;
      }
      
      setUser(userToStore);
      setRole(userToStore.role);
      setIsLoggedIn(true);
      
      return { success: true, user: userToStore };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  // ============================================
  // LOGOUT FUNCTION
  // ============================================
  const logout = async () => {
    try {
      await api.post('/auth/logout/');
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Clear all session data
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('role');
      sessionStorage.removeItem('session_key');
      delete api.defaults.headers.common['X-Session-Key'];
      
      setUser(null);
      setRole(null);
      setIsLoggedIn(false);
    }
  };

  // ============================================
  // GET DASHBOARD URL BY ROLE
  // ============================================
  const getDashboardUrl = () => {
    const dashboards = {
      'admin': '/admin-dashboard',
      'staff': '/staff-dashboard',
      'staff_admin': '/staff-dashboard',
      'guide': '/guide-dashboard',
      'tourister': '/',
    };
    return dashboards[role || 'tourister'] || '/';
  };

  // ============================================
  // UPDATE USER DATA
  // ============================================
  const updateUser = (userData) => {
    try {
      const updatedUser = {
        ...user,
        ...userData,
      };
      
      sessionStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      return { success: true };
    } catch (error) {
      console.error('Update user error:', error);
      return { success: false, error: error.message };
    }
  };

  // ============================================
  // CONTEXT VALUE
  // ============================================
  const value = {
    user,
    role,
    loading,
    isLoggedIn,
    login,
    logout,
    updateUser,
    getDashboardUrl,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;