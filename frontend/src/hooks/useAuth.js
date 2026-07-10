import { useState, useEffect, useCallback } from 'react';
import { AuthService } from '../services/api';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);

  // Check auth status
  const checkAuth = useCallback(() => {
    try {
      const loggedIn = AuthService.isLoggedIn();
      const userData = AuthService.getUser();
      const userRole = AuthService.getRole();

      setIsAuthenticated(loggedIn);
      setUser(userData);
      setRole(userRole);
      setIsLoading(false);
      setError(null);
    } catch (err) {
      setError('Failed to check authentication status');
      setIsLoading(false);
    }
  }, []);

  // Login function
  const login = useCallback(async (email, password, rememberMe = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login/', { 
        email, 
        password,
        remember_me: rememberMe 
      });
      
      if (response.success) {
        const { user, role, session_key, dashboard_url } = response;
        AuthService.setAuth(user, session_key, role);
        setUser(user);
        setRole(role);
        setIsAuthenticated(true);
        return { success: true, dashboard_url };
      }
      return { success: false, error: response.error || 'Login failed' };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Login failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      // Optional: Call backend logout
      await api.post('/auth/logout/');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      AuthService.clearAuth();
      setUser(null);
      setRole(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  }, []);

  // Update user data
  const updateUser = useCallback((userData) => {
    AuthService.setAuth(userData, AuthService.getToken(), AuthService.getRole());
    setUser(userData);
  }, []);

  // Initial auth check
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return { 
    user, 
    role, 
    isLoading, 
    isAuthenticated, 
    error,
    login,
    logout,
    checkAuth,
    updateUser,
    getDashboardUrl: AuthService.getDashboardUrl.bind(AuthService)
  };
};

export default useAuth;