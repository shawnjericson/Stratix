import React from 'react';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    CheckSquare,
    Columns,
    BarChart3,
    Users
} from 'lucide-react';

const DashboardNavigation = ({ currentView, onViewChange, isMobile = false }) => {
    const navItems = [
        {
            id: 'overview',
            label: 'Tổng quan',
            icon: LayoutDashboard,
        },
        {
            id: 'tasks',
            label: 'Nhiệm vụ',
            icon: CheckSquare,
        },
        {
            id: 'kanban',
            label: 'Bảng Kanban',
            icon: Columns,
        },
        {
            id: 'analytics',
            label: 'Phân tích',
            icon: BarChart3,
        },
        {
            id: 'people',
            label: 'Nhân sự',
            icon: Users,
        }
    ];

    const handleViewChange = (view) => {
        if (onViewChange) {
            onViewChange(view);
        }
    };

    if (isMobile) {
        return (
            <div className="grid grid-cols-2 gap-2 mb-4">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;

                    return (
                        <motion.button
                            key={item.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleViewChange(item.id)}
                            className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${isActive
                                    ? 'bg-gradient-to-r from-[#FFD35B] to-[#F59E0B] text-white shadow-[0_4px_16px_rgba(255,211,91,0.4)]'
                                    : 'text-gray-700 bg-white/40 hover:bg-white/60'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span>{item.label}</span>
                        </motion.button>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="hidden lg:flex items-center">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-2 shadow-[0_8px_32px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.2)] border border-white/20">
                <div className="flex items-center space-x-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentView === item.id;

                        return (
                            <motion.button
                                key={item.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleViewChange(item.id)}
                                className={`relative flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${isActive
                                        ? 'bg-gradient-to-r from-[#FFD35B] to-[#F59E0B] text-white shadow-[0_6px_20px_rgba(255,211,91,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] transform scale-105'
                                        : 'text-gray-700 hover:text-gray-900 hover:bg-white/40 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:scale-102'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="whitespace-nowrap">{item.label}</span>

                                {/* Active indicator */}
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#FFD35B]/20 to-[#F59E0B]/20"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    />
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default DashboardNavigation;