import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut } from 'lucide-react';
import Avatar from './Avatar';
import DashboardNavigation from './DashboardNavigation';

const MobileMenu = ({
    isOpen,
    isLoggedIn,
    user,
    isDashboardPage,
    currentView,
    onViewChange,
    onAuthNavigation,
    onLogout,
    onAvatarChange
}) => {
    const getUserDisplayName = () => {
        return user?.full_name || user?.username || 'Tài khoản';
    };

    const getUserRole = () => {
        return user?.role_display_name || user?.role_name || '';
    };

    const getUserInitials = () => {
        const name = user?.full_name || user?.username || 'U';
        return name.charAt(0).toUpperCase();
    };

    const handleLogout = async () => {
        if (onLogout) {
            await onLogout();
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
            >
                <div className="border-t border-[#e6d89c]/30 py-4">
                    {/* Dashboard Navigation for Mobile */}
                    {isDashboardPage && (
                        <DashboardNavigation
                            currentView={currentView}
                            onViewChange={onViewChange}
                            isMobile={true}
                        />
                    )}

                    {/* User Section */}
                    {isLoggedIn ? (
                        <div className="space-y-3">
                            {/* Mobile User Info */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center px-3 py-3 bg-white/30 rounded-2xl"
                            >
                                <Avatar
                                    src={user?.avatar_url}
                                    alt={user?.full_name || 'User Avatar'}
                                    size="w-12 h-12"
                                    fallbackText={getUserInitials()}
                                    editable={true}
                                    onAvatarChange={onAvatarChange}
                                    user={user}
                                />
                                <div className="flex-1 min-w-0 ml-3">
                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                        {getUserDisplayName()}
                                    </p>
                                    <p className="text-xs text-gray-600 truncate">
                                        {user?.email}
                                    </p>
                                    {getUserRole() && (
                                        <p className="text-xs font-medium text-[#FFD35B]">
                                            {getUserRole()}
                                        </p>
                                    )}
                                </div>
                            </motion.div>

                            {/* Logout Button */}
                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleLogout}
                                className="block w-full text-left px-4 py-3 text-red-600 hover:bg-red-50/50 rounded-2xl text-sm font-semibold transition-colors flex items-center"
                            >
                                <LogOut className="w-4 h-4 mr-3" />
                                Đăng xuất
                            </motion.button>
                        </div>
                    ) : (
                        /* Auth Buttons for Non-logged Users */
                        <div className="space-y-2">
                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onAuthNavigation('signin')}
                                className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-white/40 rounded-2xl text-sm font-semibold transition-colors"
                            >
                                Đăng nhập
                            </motion.button>
                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onAuthNavigation('signup')}
                                className="block w-full text-left px-4 py-3 bg-gradient-to-r from-[#FFD35B] to-[#F59E0B] text-white rounded-2xl text-sm font-semibold transition-all duration-200"
                            >
                                Bắt đầu dùng miễn phí
                            </motion.button>
                        </div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default MobileMenu;