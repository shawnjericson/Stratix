import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Mail, Menu, X, Bell } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import UserMenu from './navbarcomponents/UserMenu';
import DashboardNavigation from './navbarcomponents/DashboardNavigation';
import MobileMenu from './navbarcomponents/MobileMenu';

export default function Navbar({
    isLoggedIn,
    user,
    onLogout,
    showNav = true,
    currentView,
    onViewChange,
    onUserUpdate
}) {
    const navigate = useNavigate();
    const location = useLocation();
    const isHomePage = location.pathname === '/';
    const isDashboardPage = location.pathname === '/dashboard';
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Handle authentication navigation
    const handleAuthNavigation = useCallback((authType) => {
        if (authType === 'signin') {
            navigate('/login');
        } else {
            navigate('/register');
        }
        setIsMobileMenuOpen(false);
    }, [navigate]);

    // Handle logout
    const handleLogout = useCallback(async () => {
        try {
            await onLogout();
            navigate('/');
        } catch (error) {
            console.error('Logout failed:', error);
            navigate('/');
        } finally {
            setIsMobileMenuOpen(false);
        }
    }, [onLogout, navigate]);

    // Handle view changes
    const handleViewChange = useCallback((view) => {
        if (onViewChange) {
            onViewChange(view);
        }
        setIsMobileMenuOpen(false);
    }, [onViewChange]);

    // Handle avatar change
    const handleAvatarChange = useCallback(async (newAvatarUrl) => {
        try {
            // Update user object with new avatar
            const updatedUser = { ...user, avatar_url: newAvatarUrl };

            // Call parent component to update user state
            if (onUserUpdate) {
                onUserUpdate(updatedUser);
            }
        } catch (error) {
            console.error('Failed to update avatar:', error);
        }
    }, [user, onUserUpdate]);

    // Toggle mobile menu
    const toggleMobileMenu = useCallback(() => {
        setIsMobileMenuOpen(prev => !prev);
    }, []);

    // Homepage navbar
    if (isHomePage) {
        return (
            <nav
                className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${showNav ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
                    }`}
                style={{ fontFamily: 'Inter, sans-serif' }}
            >
                <div className="bg-white/80 backdrop-blur-md border border-gray-200/50 rounded-full px-6 py-3 shadow-lg">
                    <div className="flex items-center space-x-6">
                        {/* Brand */}
                        <motion.div
                            className="flex items-center cursor-pointer"
                            onClick={() => navigate('/')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <div className="w-8 h-8 bg-gradient-to-br from-[#FFD35B] to-[#F59E0B] rounded-lg flex items-center justify-center">
                                <div className="w-4 h-4 bg-white rounded-sm"></div>
                            </div>
                            <span className="ml-2 font-semibold text-gray-900 hidden sm:block">
                                Stratix
                            </span>
                        </motion.div>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-6">
                            {!isLoggedIn ? (
                                <>
                                    <button
                                        onClick={() => handleAuthNavigation('signin')}
                                        className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Đăng nhập
                                    </button>
                                    <button
                                        onClick={() => handleAuthNavigation('signup')}
                                        className="bg-gradient-to-r from-[#FFD35B] to-[#F59E0B] hover:from-[#F59E0B] hover:to-[#FFD35B] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                                    >
                                        Bắt đầu dùng miễn phí
                                    </button>
                                </>
                            ) : (
                                <UserMenu
                                    user={user}
                                    onLogout={handleLogout}
                                    onAvatarChange={handleAvatarChange}
                                />
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden">
                            <button
                                onClick={toggleMobileMenu}
                                className="text-gray-600 hover:text-gray-900 p-2 rounded-lg transition-colors"
                            >
                                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    <MobileMenu
                        isOpen={isMobileMenuOpen}
                        isLoggedIn={isLoggedIn}
                        user={user}
                        isDashboardPage={false}
                        onAuthNavigation={handleAuthNavigation}
                        onLogout={handleLogout}
                        onAvatarChange={handleAvatarChange}
                    />
                </div>
            </nav>
        );
    }

    // Main navbar (Dashboard and other pages)
    return (
        <nav
            className="bg-gradient-to-r from-[#f8f6f0] to-[#faf8f2] border-b border-[#e6d89c]/30 sticky top-0 z-40 backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,211,91,0.1)]"
            style={{ fontFamily: 'Inter, sans-serif' }}
        >
            <div className="max-w-full mx-auto px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    {/* Brand */}
                    <motion.div
                        className="flex items-center cursor-pointer group"
                        onClick={() => navigate('/')}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <h1 className="text-3xl text-gray-800 tracking-tight border-b-2 border-transparent group-hover:border-[#FFD35B] transition-all duration-300 font-bold">
                            Stratix
                        </h1>
                    </motion.div>

                    {/* Dashboard Navigation - Only show on dashboard page */}
                    {isDashboardPage && (
                        <DashboardNavigation
                            currentView={currentView}
                            onViewChange={handleViewChange}
                        />
                    )}

                    {/* Right side actions */}
                    <div className="hidden md:flex items-center space-x-4">
                        {/* Notifications */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="relative p-3 text-gray-600 hover:text-[#FFD35B] rounded-2xl hover:bg-white/40 transition-all duration-300 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
                        >
                            <Bell className="w-6 h-6" />
                            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-gradient-to-r from-red-400 to-red-500 rounded-full animate-pulse shadow-[0_2px_8px_rgba(239,68,68,0.4)]"></span>
                        </motion.button>

                        {isLoggedIn ? (
                            <UserMenu
                                user={user}
                                onLogout={handleLogout}
                                onAvatarChange={handleAvatarChange}
                            />
                        ) : (
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => handleAuthNavigation('signin')}
                                    className="text-gray-600 hover:text-gray-900 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 hover:bg-white/40"
                                >
                                    Đăng nhập
                                </button>
                                <button
                                    onClick={() => handleAuthNavigation('signup')}
                                    className="bg-gradient-to-r from-[#FFD35B] to-[#F59E0B] hover:from-[#F59E0B] hover:to-[#FFD35B] text-white px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 shadow-[0_6px_20px_rgba(255,211,91,0.4)] hover:shadow-[0_8px_28px_rgba(255,211,91,0.5)] hover:scale-105"
                                >
                                    Bắt đầu dùng miễn phí
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center space-x-2">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="relative p-3 text-gray-600 hover:text-[#FFD35B] rounded-2xl hover:bg-white/40 transition-all duration-300"
                        >
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        </motion.button>

                        <button
                            onClick={toggleMobileMenu}
                            className="p-3 text-gray-600 hover:text-gray-900 rounded-2xl hover:bg-white/40 transition-all duration-300 hover:scale-105"
                        >
                            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <MobileMenu
                    isOpen={isMobileMenuOpen}
                    isLoggedIn={isLoggedIn}
                    user={user}
                    isDashboardPage={isDashboardPage}
                    currentView={currentView}
                    onViewChange={handleViewChange}
                    onAuthNavigation={handleAuthNavigation}
                    onLogout={handleLogout}
                    onAvatarChange={handleAvatarChange}
                />
            </div>
        </nav>
    );
}

// Export individual components for use elsewhere
export { UserMenu, DashboardNavigation, MobileMenu };