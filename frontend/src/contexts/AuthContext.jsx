// contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        // Check if user is already logged in
        const checkAuth = async () => {
            try {
                const sessionKey = localStorage.getItem('session_key');
                if (sessionKey) {
                    const response = await api.get('/auth/me/');
                    if (response.data.success) {
                        setUser(response.data.user);
                        setIsLoggedIn(true);
                        sessionStorage.setItem('role', response.data.user.role);
                    }
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                localStorage.removeItem('session_key');
                sessionStorage.removeItem('role');
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = (userData, sessionKey) => {
        setUser(userData);
        setIsLoggedIn(true);
        if (sessionKey) {
            localStorage.setItem('session_key', sessionKey);
        }
        sessionStorage.setItem('role', userData.role);
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout/');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setUser(null);
            setIsLoggedIn(false);
            localStorage.removeItem('session_key');
            sessionStorage.removeItem('role');
        }
    };

    const value = {
        user,
        loading,
        isLoggedIn,
        login,
        logout,
        isGuide: user?.role === 'guide',
        isAdmin: user?.role === 'admin',
        isStaff: user?.role === 'staff',
        isTourister: user?.role === 'tourister',
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