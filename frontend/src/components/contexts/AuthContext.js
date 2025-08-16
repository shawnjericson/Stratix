import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../../services/api';
import { STORAGE_KEYS, ERROR_MESSAGES } from '../constants/TaskConstants';

// Create context
const AuthContext = createContext(null);

// Custom hook để sử dụng context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Auth Provider component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Kiểm tra authentication khi app khởi động
    useEffect(() => {
        checkAuth();
    }, []);

    // Kiểm tra xem user đã đăng nhập chưa
    const checkAuth = async () => {
        try {
            const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
            if (!token) {
                setIsLoading(false);
                return;
            }

            // Gọi API để lấy thông tin user hiện tại
            const response = await api.getCurrentUser();
            if (response.user) {
                setUser(response.user);
                setIsAuthenticated(true);
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            // Nếu token không hợp lệ, xóa khỏi localStorage
            localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        } finally {
            setIsLoading(false);
        }
    };

    // Đăng nhập
    const login = async (credentials) => {
        console.log('Login function called with:', credentials); // Debug log
        try {
            setIsLoading(true);
            const response = await api.login(credentials);
            console.log('Login response:', response); // Debug log

            if (response.user && response.accessToken) {
                setUser(response.user);
                setIsAuthenticated(true);

                // Lưu tokens vào localStorage (đã được xử lý trong api.js)
                return { success: true, user: response.user };
            }

            throw new Error('Invalid login response');
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // Đăng ký
    const register = async (userData) => {
        console.log('Register function called with:', userData); // Debug log
        try {
            setIsLoading(true);
            const response = await api.register(userData);
            console.log('Register response:', response); // Debug log

            if (response.user && response.accessToken) {
                setUser(response.user);
                setIsAuthenticated(true);
                return { success: true, user: response.user };
            }

            throw new Error('Invalid registration response');
        } catch (error) {
            console.error('Registration failed:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // Đăng xuất
    const logout = async () => {
        try {
            await api.logout();
        } catch (error) {
            console.error('Logout API failed:', error);
            // Vẫn tiếp tục logout local dù API fail
        } finally {
            // Clear local state
            setUser(null);
            setIsAuthenticated(false);

            // Clear localStorage
            localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);

            // Redirect hoặc reload trang
            window.location.href = '/login';
        }
    };

    // Cập nhật thông tin user
    const updateUser = (userData) => {
        setUser(prevUser => ({
            ...prevUser,
            ...userData
        }));
    };

    // Kiểm tra quyền hạn
    const hasPermission = (permission) => {
        if (!user || !user.permissions) return false;
        return user.permissions.some(p => p.name === permission);
    };

    // Kiểm tra role level
    const hasLevel = (maxLevel) => {
        if (!user || !user.role_level) return false;
        return user.role_level <= maxLevel;
    };

    // Kiểm tra role cụ thể
    const hasRole = (role) => {
        if (!user || !user.role_name) return false;
        return user.role_name === role;
    };

    // Lấy thông tin người dùng hiện tại (refresh)
    const refreshUser = async () => {
        try {
            const response = await api.getCurrentUser();
            if (response.user) {
                setUser(response.user);
                return response.user;
            }
        } catch (error) {
            console.error('Failed to refresh user:', error);
            // Nếu fail, có thể do token hết hạn
            await logout();
            throw error;
        }
    };

    // Đổi mật khẩu
    const changePassword = async (passwordData) => {
        try {
            await api.changePassword(passwordData);
            return { success: true };
        } catch (error) {
            console.error('Change password failed:', error);
            throw error;
        }
    };

    // Value được cung cấp cho context
    const value = {
        // State
        user,
        isLoading,
        isAuthenticated,

        // Actions - ĐẢM BẢO CÁC FUNCTION NÀY ĐƯỢC EXPORT
        login,
        register,
        logout,
        updateUser,
        refreshUser,
        changePassword,

        // Permission checks
        hasPermission,
        hasLevel,
        hasRole,

        // Utilities
        checkAuth
    };

    console.log('AuthContext value:', value); // Debug log

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// HOC để bảo vệ routes cần authentication
export const withAuth = (Component) => {
    return function AuthenticatedComponent(props) {
        const { isAuthenticated, isLoading } = useAuth();

        if (isLoading) {
            return (
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                        <p className="text-gray-600">Đang kiểm tra đăng nhập...</p>
                    </div>
                </div>
            );
        }

        if (!isAuthenticated) {
            window.location.href = '/login';
            return null;
        }

        return <Component {...props} />;
    };
};

// HOC để bảo vệ routes theo permission
export const withPermission = (Component, requiredPermission) => {
    return function PermissionProtectedComponent(props) {
        const { hasPermission, isLoading } = useAuth();

        if (isLoading) {
            return (
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                        <p className="text-gray-600">Đang kiểm tra quyền hạn...</p>
                    </div>
                </div>
            );
        }

        if (!hasPermission(requiredPermission)) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="text-center max-w-md mx-auto p-8">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">🚫</span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Không có quyền truy cập</h2>
                        <p className="text-gray-600 mb-6">
                            Bạn không có quyền truy cập tính năng này. Vui lòng liên hệ quản trị viên.
                        </p>
                        <button
                            onClick={() => window.history.back()}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Quay lại
                        </button>
                    </div>
                </div>
            );
        }

        return <Component {...props} />;
    };
};

// HOC để bảo vệ routes theo role level
export const withLevel = (Component, maxLevel) => {
    return function LevelProtectedComponent(props) {
        const { hasLevel, isLoading, user } = useAuth();

        if (isLoading) {
            return (
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                        <p className="text-gray-600">Đang kiểm tra quyền hạn...</p>
                    </div>
                </div>
            );
        }

        if (!hasLevel(maxLevel)) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="text-center max-w-md mx-auto p-8">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">🔒</span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Cấp quyền không đủ</h2>
                        <p className="text-gray-600 mb-6">
                            Tính năng này yêu cầu cấp quyền cao hơn. Cấp của bạn: {user?.role_display_name}
                        </p>
                        <button
                            onClick={() => window.history.back()}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Quay lại
                        </button>
                    </div>
                </div>
            );
        }

        return <Component {...props} />;
    };
};

