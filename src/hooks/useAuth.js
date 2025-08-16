// src/hooks/useAuth.js
import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            getCurrentUser();
        } else {
            setLoading(false);
        }
    }, []);

    const getCurrentUser = async () => {
        try {
            const data = await api.getCurrentUser();
            setUser(data.user);
        } catch (error) {
            console.error('Get current user error:', error);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
        } finally {
            setLoading(false);
        }
    };

    const login = async (credentials) => {
        try {
            const data = await api.login(credentials);
            setUser(data.user);
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    };

    const register = async (userData) => {
        try {
            const data = await api.register(userData);
            setUser(data.user);
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    };

    const logout = async () => {
        try {
            await api.logout();
            setUser(null);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const hasPermission = (permission) => {
        return user?.permissions?.some(p => p.name === permission) || false;
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        hasPermission,
        getCurrentUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};