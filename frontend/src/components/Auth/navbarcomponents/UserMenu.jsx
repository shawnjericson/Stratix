import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, User, Settings, LogOut } from 'lucide-react';
import Avatar from './Avatar';

const UserMenu = ({ user, onLogout, onAvatarChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
        setIsOpen(false);
        if (onLogout) {
            await onLogout();
        }
    };

    const toggleMenu = () => setIsOpen(!isOpen);

    return (
        <div className="relative" ref={menuRef}>
            {/* User Button */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={toggleMenu}
                className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-white/40 rounded-2xl transition-all duration-300 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
            >
                <Avatar
                    src={user?.avatar_url}
                    alt={user?.full_name || 'User Avatar'}
                    size="w-10 h-10"
                    fallbackText={getUserInitials()}
                    editable={true}
                    onAvatarChange={onAvatarChange}
                    user={user}
                />
                <div className="hidden lg:block text-left">
                    <div className="text-sm font-semibold text-gray-800 truncate max-w-32">
                        {getUserDisplayName()}
                    </div>
                    {getUserRole() && (
                        <div className="text-xs text-gray-600 font-medium truncate max-w-32">
                            {getUserRole()}
                        </div>
                    )}
                </div>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                </motion.div>
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-md border border-white/20 rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.12)] py-2 z-50"
                    >
                        {/* User Info Header */}
                        <div className="px-4 py-4 border-b border-gray-100/50">
                            <div className="flex items-center space-x-3">
                                <Avatar
                                    src={user?.avatar_url}
                                    alt={user?.full_name || 'User Avatar'}
                                    size="w-12 h-12"
                                    fallbackText={getUserInitials()}
                                    editable={true}
                                    onAvatarChange={onAvatarChange}
                                    user={user}
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                        {getUserDisplayName()}
                                    </p>
                                    <p className="text-xs text-gray-600 truncate">
                                        {user?.email}
                                    </p>
                                    {getUserRole() && (
                                        <p className="text-xs font-medium bg-gradient-to-r from-[#FFD35B] to-[#F59E0B] bg-clip-text text-transparent">
                                            {getUserRole()}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Menu Items */}
                        <div className="py-2">
                            <motion.button
                                whileHover={{ backgroundColor: 'rgba(255, 211, 91, 0.1)' }}
                                className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 transition-colors flex items-center space-x-3"
                            >
                                <User className="w-4 h-4" />
                                <span>Hồ sơ cá nhân</span>
                            </motion.button>
                            <motion.button
                                whileHover={{ backgroundColor: 'rgba(255, 211, 91, 0.1)' }}
                                className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 transition-colors flex items-center space-x-3"
                            >
                                <Settings className="w-4 h-4" />
                                <span>Cài đặt</span>
                            </motion.button>

                            {/* Admin Menu (if user has admin privileges) */}
                            {user?.role_level <= 2 && (
                                <>
                                    <div className="border-t border-gray-100/50 my-2"></div>
                                    <motion.button
                                        whileHover={{ backgroundColor: 'rgba(147, 51, 234, 0.1)' }}
                                        className="w-full text-left px-4 py-3 text-sm font-medium text-purple-700 transition-colors flex items-center space-x-3"
                                    >
                                        <Settings className="w-4 h-4" />
                                        <span>Quản trị hệ thống</span>
                                    </motion.button>
                                </>
                            )}
                        </div>

                        {/* Logout */}
                        <div className="border-t border-gray-100/50 py-2">
                            <motion.button
                                whileHover={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 transition-colors flex items-center space-x-3"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Đăng xuất</span>
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UserMenu;