import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    RefreshCw,
    TrendingUp,
    Clock,
    CheckCircle,
    AlertTriangle,
    Users,
    ChevronRight,
    X,
    Grid,
    List,
    Columns,
    BarChart3,
    Settings,
    Bell
} from 'lucide-react';
import TaskManagement from '../components/Tasks/TaskManagement';
import KanbanBoard from '../components/Tasks/KanbanBoard';
import AnalyticsDashboard from '../components/Tasks/AnalyticsDashboard';
import MultiStepTaskForm from '../components/Tasks/MultiStepTaskForm';
import TaskForm from '../components/Tasks/TaskForm';
import MusicPlayer from '../components/Tasks/MusicPlayer';
import { api } from '../services/api';

// Animation variants
const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
};

const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: "easeOut" }
    }
};

const staggerContainer = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.1
        }
    }
};

export default function Dashboard({ user, currentView: propCurrentView, onViewChange: propOnViewChange }) {
    // Neumorphism styles
    const neumorphismButton = "shadow-[8px_8px_16px_#d4d4d8,-8px_-8px_16px_#ffffff] hover:shadow-[12px_12px_24px_#d4d4d8,-12px_-12px_24px_#ffffff]";

    const [currentView, setCurrentView] = useState(propCurrentView || 'overview');
    const [tasks, setTasks] = useState([]);
    const [taskStats, setTaskStats] = useState({
        total: 0,
        completed: 0,
        inProgress: 0,
        todo: 0,
        overdue: 0
    });
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [isLoadingTasks, setIsLoadingTasks] = useState(false);
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [isFormLoading, setIsFormLoading] = useState(false);
    const [taskViewMode, setTaskViewMode] = useState('list');
    const [useAdvancedForm, setUseAdvancedForm] = useState(true);
    const [error, setError] = useState(null);

    // Update currentView when prop changes
    useEffect(() => {
        if (propCurrentView) {
            setCurrentView(propCurrentView);
        }
    }, [propCurrentView]);

    // Load tasks & stats
    useEffect(() => {
        loadTasks();
    }, [user]);

    const loadTasks = async () => {
        setIsLoadingTasks(true);
        setIsLoadingStats(true);
        setError(null);

        try {
            const response = await api.getTasks({ userId: user.id });
            let tasksData = [];
            if (response.tasks) {
                tasksData = response.tasks;
            } else if (Array.isArray(response)) {
                tasksData = response;
            } else if (response.data) {
                tasksData = response.data;
            }

            setTasks(tasksData);
            calculateStats(tasksData);
        } catch (error) {
            console.error('Error loading tasks:', error);
            setError(error.message || 'Không thể tải danh sách công việc.');
        } finally {
            setIsLoadingTasks(false);
            setIsLoadingStats(false);
        }
    };

    const calculateStats = (tasksData) => {
        const stats = {
            total: tasksData.length,
            completed: tasksData.filter(t => t.status === 'completed').length,
            inProgress: tasksData.filter(t => t.status === 'in_progress').length,
            todo: tasksData.filter(t => t.status === 'todo').length,
            overdue: tasksData.filter(t => {
                if (!t.due_date || t.status === 'completed') return false;
                return new Date(t.due_date) < new Date();
            }).length
        };
        setTaskStats(stats);
    };

    const handleTaskStatusChange = async (taskId, newStatus) => {
        try {
            const task = tasks.find(t => t.id.toString() === taskId.toString());
            if (!task) return;

            const response = await api.updateTaskStatus(taskId, newStatus);
            let updatedTask = response;
            if (response.task) {
                updatedTask = response.task;
            } else if (response.data) {
                updatedTask = response.data;
            }

            setTasks(prev => prev.map(t =>
                t.id.toString() === taskId.toString() ? updatedTask : t
            ));

            const updatedTasks = tasks.map(t =>
                t.id.toString() === taskId.toString() ? updatedTask : t
            );
            calculateStats(updatedTasks);
        } catch (error) {
            console.error('Error updating task status:', error);
            setError(error.message || 'Không thể cập nhật trạng thái công việc');
            throw error;
        }
    };

    const handleTaskSave = async (taskData) => {
        setIsFormLoading(true);
        setError(null);

        try {
            if (editingTask) {
                const updatedTaskData = {
                    id: taskData.id,
                    title: taskData.title,
                    description: taskData.description || '',
                    status: taskData.status,
                    priority: taskData.priority,
                    start_date: taskData.start_date,
                    due_date: taskData.due_date,
                    estimated_hours: taskData.estimated_hours,
                    assigned_to: taskData.assigned_to || user.id,
                    category_id: taskData.category_id,
                    department_id: taskData.department_id || user.department_id
                };

                const response = await api.updateTask(taskData.id, updatedTaskData);
                let updatedTask = response;
                if (response.task) {
                    updatedTask = response.task;
                } else if (response.data) {
                    updatedTask = response.data;
                }

                setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
            } else {
                const newTaskData = {
                    title: taskData.title,
                    description: taskData.description || '',
                    status: taskData.status || 'todo',
                    priority: taskData.priority || 'medium',
                    start_date: taskData.start_date,
                    due_date: taskData.due_date,
                    estimated_hours: taskData.estimated_hours,
                    assigned_to: taskData.assigned_to || user.id,
                    category_id: taskData.category_id,
                    department_id: taskData.department_id || user.department_id
                };

                const response = await api.createTask(newTaskData);
                let createdTask = response;
                if (response.task) {
                    createdTask = response.task;
                } else if (response.data) {
                    createdTask = response.data;
                }

                setTasks(prev => [createdTask, ...prev]);
            }

            setShowTaskForm(false);
            setEditingTask(null);
            await loadTasks();
        } catch (error) {
            console.error('Task save error:', error);
            setError(error.message || 'Không thể lưu công việc');
            throw error;
        } finally {
            setIsFormLoading(false);
        }
    };

    const handleEditTask = (task) => {
        setEditingTask(task);
        setShowTaskForm(true);
    };

    const handleDeleteTask = async (taskId) => {
        setError(null);
        const prevTasks = tasks;
        const nextTasks = prevTasks.filter(t => t.id !== taskId);
        setTasks(nextTasks);
        calculateStats(nextTasks);

        try {
            await api.deleteTask(taskId);
        } catch (error) {
            console.error('Error deleting task:', error);
            setTasks(prevTasks);
            calculateStats(prevTasks);
            setError(error.message || 'Không thể xóa công việc');
        }
    };

    const getCompletionPercentage = () => {
        if (taskStats.total === 0) return 0;
        return Math.round((taskStats.completed / taskStats.total) * 100);
    };

    const getTimeGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Chào buổi sáng';
        if (hour < 18) return 'Chào buổi chiều';
        return 'Chào buổi tối';
    };

    const dismissError = () => {
        setError(null);
    };

    // Avatar Component with fallback
    const Avatar = ({ src, alt, size = 'w-8 h-8', className = '', fallbackText = 'U' }) => {
        const [imageError, setImageError] = useState(false);

        if (!src || imageError) {
            return (
                <div className={`${size} bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center ${className}`}>
                    <span className="text-white text-sm font-bold">{fallbackText}</span>
                </div>
            );
        }

        return (
            <img
                src={src}
                alt={alt}
                className={`${size} rounded-full object-cover border border-gray-200 ${className}`}
                onError={() => setImageError(true)}
            />
        );
    };
    // Overview Section with Modern Professional Design
    const renderOverview = () => (
        <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-8"
            style={{ fontFamily: 'Inter, sans-serif' }}
        >
            {/* Error Display */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-2xl p-6 shadow-[0_8px_32px_rgba(239,68,68,0.08)]"
                    >
                        <div className="flex items-start space-x-4">
                            <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                            <div className="flex-1">
                                <h4 className="font-semibold text-red-900">Có lỗi xảy ra</h4>
                                <p className="text-sm text-red-700 mt-2">{error}</p>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={dismissError}
                                className="text-red-400 hover:text-red-600 transition-colors p-1 rounded-xl hover:bg-red-100/50"
                            >
                                <X className="w-5 h-5" />
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Welcome Hero Section */}
            <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-gray-100/50 rounded-2xl border border-gray-200/50 shadow-[0_8px_32px_rgba(0,0,0,0.04)]"
            >
                <div className="relative px-8 lg:px-12 py-12">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <div className="flex items-center space-x-4 mb-6">
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    className="relative"
                                >
                                    <Avatar
                                        src={user?.avatar_url}
                                        alt={user?.full_name || 'User Avatar'}
                                        size="h-16 w-16"
                                        className="shadow-lg"
                                        fallbackText={user?.full_name?.[0] || user?.username?.[0] || 'U'}
                                    />
                                    {/* Online status indicator */}
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                                </motion.div>
                                <div>
                                    <motion.h1
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="text-4xl font-bold text-gray-900 tracking-tight mb-2"
                                    >
                                        {getTimeGreeting()}, {user?.full_name || user?.username}
                                    </motion.h1>
                                    <motion.p
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="text-gray-600 text-lg"
                                    >
                                        Sẵn sàng chinh phục mục tiêu hôm nay?
                                    </motion.p>
                                </div>
                            </div>

                            <motion.div
                                variants={staggerContainer}
                                initial="hidden"
                                animate="visible"
                                className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
                            >
                                {[
                                    { label: 'Tổng số nhiệm vụ', value: taskStats.total, color: 'text-gray-700' },
                                    { label: 'Hoàn thành', value: getCompletionPercentage() + '%', color: 'text-emerald-600' },
                                    { label: 'Đang thực hiện', value: taskStats.inProgress, color: 'text-blue-600' }
                                ].map((stat, index) => (
                                    <motion.div
                                        key={stat.label}
                                        variants={cardVariants}
                                        className="bg-white/70 backdrop-blur-sm rounded-xl p-5 border border-gray-200/50 shadow-[0_4px_16px_rgba(0,0,0,0.03)]"
                                    >
                                        <div className={`text-3xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                                        <div className="text-gray-500 text-sm">{stat.label}</div>
                                    </motion.div>
                                ))}
                            </motion.div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        setEditingTask(null);
                                        setShowTaskForm(true);
                                    }}
                                    className="group inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                                >
                                    <motion.div
                                        whileHover={{ rotate: 90 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <Plus className="w-5 h-5 mr-3" />
                                    </motion.div>
                                    Tạo nhiệm vụ mới
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        setCurrentView('kanban');
                                        if (propOnViewChange) propOnViewChange('kanban');
                                    }}
                                    className="inline-flex items-center justify-center px-8 py-4 bg-white/70 backdrop-blur-sm text-gray-700 rounded-xl font-semibold border border-gray-200/50 shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-300"
                                >
                                    <Columns className="w-5 h-5 mr-3" />
                                    Xem bảng Kanban
                                </motion.button>
                            </div>
                        </div>

                        <motion.div
                            className="hidden lg:block"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 }}
                        >
                            <motion.div
                                animate={{
                                    y: [0, -10, 0],
                                    rotate: [0, 5, 0, -5, 0]
                                }}
                                transition={{
                                    duration: 6,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                className="w-40 h-40 bg-gradient-to-br from-gray-700/20 to-gray-900/20 rounded-full flex items-center justify-center shadow-xl"
                            >
                                <TrendingUp className="w-20 h-20 text-gray-700" />
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6"
            >
                {[
                    {
                        title: 'Tổng nhiệm vụ',
                        value: taskStats.total,
                        icon: CheckCircle,
                        color: 'text-gray-700',
                        bgColor: 'from-gray-50 to-gray-100/50',
                        iconBg: 'from-gray-100 to-gray-200',
                        iconColor: 'text-gray-600'
                    },
                    {
                        title: 'Chờ xử lý',
                        value: taskStats.todo,
                        icon: Clock,
                        color: 'text-amber-600',
                        bgColor: 'from-amber-50 to-amber-100/50',
                        iconBg: 'from-amber-100 to-amber-200',
                        iconColor: 'text-amber-600'
                    },
                    {
                        title: 'Đang thực hiện',
                        value: taskStats.inProgress,
                        icon: TrendingUp,
                        color: 'text-blue-600',
                        bgColor: 'from-blue-50 to-blue-100/50',
                        iconBg: 'from-blue-100 to-blue-200',
                        iconColor: 'text-blue-600'
                    },
                    {
                        title: 'Hoàn thành',
                        value: taskStats.completed,
                        icon: CheckCircle,
                        color: 'text-emerald-600',
                        bgColor: 'from-emerald-50 to-emerald-100/50',
                        iconBg: 'from-emerald-100 to-emerald-200',
                        iconColor: 'text-emerald-600'
                    }
                ].map((stat, index) => (
                    <motion.div
                        key={stat.title}
                        variants={cardVariants}
                        whileHover={{ scale: 1.02, y: -2 }}
                        className={`bg-gradient-to-br ${stat.bgColor} rounded-2xl p-8 border border-gray-200/50 shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.08)] transition-all duration-300 cursor-pointer`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-2">{stat.title}</p>
                                <p className={`text-4xl font-bold ${stat.color} mb-3`}>
                                    {isLoadingStats ? (
                                        <div className="animate-pulse bg-gray-300 h-10 w-16 rounded-xl"></div>
                                    ) : (
                                        stat.value
                                    )}
                                </p>
                                <p className="text-sm text-gray-500 flex items-center">
                                    <TrendingUp className="w-4 h-4 mr-2 text-emerald-500" />
                                    {stat.value > 0 ? `${stat.value} nhiệm vụ` : 'Chưa có dữ liệu'}
                                </p>
                            </div>
                            <div className={`h-16 w-16 bg-gradient-to-br ${stat.iconBg} rounded-2xl flex items-center justify-center shadow-lg`}>
                                <stat.icon className={`w-8 h-8 ${stat.iconColor}`} />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Progress Overview */}
            <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl p-10 border border-gray-200/50 shadow-[0_8px_32px_rgba(0,0,0,0.04)]"
            >
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-bold text-gray-900">Tổng quan tiến độ</h3>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        onClick={() => {
                            setCurrentView('analytics');
                            if (propOnViewChange) propOnViewChange('analytics');
                        }}
                        className="inline-flex items-center text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        Xem chi tiết
                        <ChevronRight className="w-4 h-4 ml-1" />
                    </motion.button>
                </div>

                <div className="space-y-8">
                    <div>
                        <div className="flex justify-between text-sm font-semibold mb-4">
                            <span className="text-gray-700">Hoàn thành tổng thể</span>
                            <span className="text-gray-900">{getCompletionPercentage()}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${getCompletionPercentage()}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="bg-gradient-to-r from-gray-700 to-gray-900 h-3 rounded-full shadow-sm"
                            />
                        </div>
                    </div>

                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-3 gap-6"
                    >
                        {[
                            { label: 'Cần làm', value: taskStats.todo, bg: 'from-amber-50 to-amber-100/50', text: 'text-amber-700' },
                            { label: 'Đang thực hiện', value: taskStats.inProgress, bg: 'from-blue-50 to-blue-100/50', text: 'text-blue-700' },
                            { label: 'Hoàn thành', value: taskStats.completed, bg: 'from-emerald-50 to-emerald-100/50', text: 'text-emerald-700' }
                        ].map((item, index) => (
                            <motion.div
                                key={item.label}
                                variants={cardVariants}
                                whileHover={{ scale: 1.02 }}
                                className={`text-center p-6 bg-gradient-to-br ${item.bg} rounded-xl border border-gray-200/30 shadow-[0_4px_16px_rgba(0,0,0,0.03)] cursor-pointer transition-all duration-300`}
                            >
                                <div className={`text-3xl font-bold ${item.text} mb-2`}>{item.value}</div>
                                <div className="text-sm text-gray-600 font-medium">{item.label}</div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl p-10 border border-gray-200/50 shadow-[0_8px_32px_rgba(0,0,0,0.04)]"
            >
                <h3 className="text-2xl font-bold text-gray-900 mb-8">Thao tác nhanh</h3>
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {[
                        {
                            title: 'Tạo nhiệm vụ',
                            desc: 'Thêm nhiệm vụ mới vào quy trình',
                            icon: Plus,
                            color: 'from-gray-700 to-gray-900',
                            bgColor: 'from-gray-50 to-gray-100/50',
                            action: () => {
                                setEditingTask(null);
                                setShowTaskForm(true);
                            }
                        },
                        {
                            title: 'Bảng Kanban',
                            desc: 'Kéo thả để quản lý nhiệm vụ',
                            icon: Columns,
                            color: 'from-blue-600 to-blue-700',
                            bgColor: 'from-blue-50 to-blue-100/50',
                            action: () => {
                                setCurrentView('kanban');
                                if (propOnViewChange) propOnViewChange('kanban');
                            }
                        },
                        {
                            title: 'Xem phân tích',
                            desc: 'Báo cáo chi tiết và insight',
                            icon: BarChart3,
                            color: 'from-emerald-600 to-emerald-700',
                            bgColor: 'from-emerald-50 to-emerald-100/50',
                            action: () => {
                                setCurrentView('analytics');
                                if (propOnViewChange) propOnViewChange('analytics');
                            }
                        }
                    ].map((action, index) => (
                        <motion.button
                            key={action.title}
                            variants={cardVariants}
                            whileHover={{ scale: 1.02, y: -4 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={action.action}
                            className={`group relative overflow-hidden bg-gradient-to-br ${action.bgColor} rounded-xl p-8 border border-gray-200/50 shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-300 text-left`}
                        >
                            <div className="flex items-center space-x-5">
                                <motion.div
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    className={`h-14 w-14 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center shadow-lg`}
                                >
                                    <action.icon className="w-7 h-7 text-white" />
                                </motion.div>
                                <div className="text-left">
                                    <div className="font-bold text-gray-900 text-lg mb-1">{action.title}</div>
                                    <div className="text-sm text-gray-600">{action.desc}</div>
                                </div>
                            </div>
                        </motion.button>
                    ))}
                </motion.div>
            </motion.div>

            {/* Overdue Alert */}
            <AnimatePresence>
                {taskStats.overdue > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200/50 rounded-2xl p-8 shadow-[0_8px_32px_rgba(239,68,68,0.08)]"
                    >
                        <div className="flex items-start space-x-5">
                            <div className="h-14 w-14 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                                <AlertTriangle className="w-7 h-7 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-red-900 mb-3">
                                    {taskStats.overdue} nhiệm vụ quá hạn cần chú ý
                                </h3>
                                <p className="text-red-700 mb-6 leading-relaxed">
                                    Bạn có các nhiệm vụ đã vượt hạn chót. Hãy rà soát và cập nhật để giữ tiến độ mục tiêu.
                                </p>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        setCurrentView('tasks');
                                        if (propOnViewChange) propOnViewChange('tasks');
                                    }}
                                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
                                >
                                    Xem nhiệm vụ quá hạn
                                    <ChevronRight className="w-4 h-4 ml-2" />
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white" style={{ fontFamily: 'Inter, sans-serif' }}>
            {/* Main Content */}
            <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
                <AnimatePresence mode="wait">
                    {currentView === 'overview' && (
                        <motion.div key="overview">
                            {renderOverview()}
                        </motion.div>
                    )}

                    {currentView === 'tasks' && (
                        <motion.div
                            key="tasks"
                            variants={pageVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl border border-gray-200/50 shadow-[0_8px_32px_rgba(0,0,0,0.04)] overflow-hidden"
                        >
                            <TaskManagement
                                user={user}
                                onStatsUpdate={loadTasks}
                                onEditTask={handleEditTask}
                                onDeleteTask={handleDeleteTask}
                            />
                        </motion.div>
                    )}

                    {currentView === 'kanban' && (
                        <motion.div
                            key="kanban"
                            variants={pageVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl border border-gray-200/50 shadow-[0_8px_32px_rgba(0,0,0,0.04)] p-8"
                        >
                            <KanbanBoard
                                tasks={tasks}
                                onTaskStatusChange={handleTaskStatusChange}
                                onEditTask={handleEditTask}
                                onDeleteTask={handleDeleteTask}
                                isLoading={isLoadingTasks}
                            />
                        </motion.div>
                    )}

                    {currentView === 'analytics' && (
                        <motion.div
                            key="analytics"
                            variants={pageVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl border border-gray-200/50 shadow-[0_8px_32px_rgba(0,0,0,0.04)] overflow-hidden"
                        >
                            <AnalyticsDashboard
                                tasks={tasks}
                                user={user}
                            />
                        </motion.div>
                    )}

                    {currentView === 'people' && (
                        <motion.div
                            key="people"
                            variants={pageVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl border border-gray-200/50 shadow-[0_8px_32px_rgba(0,0,0,0.04)] p-8"
                        >
                            <div className="text-center py-16">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2, type: "spring" }}
                                    className="w-20 h-20 bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
                                >
                                    <Users className="w-10 h-10 text-white" />
                                </motion.div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-3">Quản lý nhân sự</h3>
                                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                                    Tính năng quản lý nhân sự đang được phát triển. Sẽ có sẵn trong phiên bản tiếp theo.
                                </p>
                                <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl font-medium">
                                    <Clock className="w-5 h-5 mr-2" />
                                    Sắp ra mắt
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Task Form Modal */}
            <AnimatePresence>
                {showTaskForm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowTaskForm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.15)] w-full max-w-4xl max-h-[95vh] overflow-y-auto border border-gray-200/50"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {useAdvancedForm ? (
                                <MultiStepTaskForm
                                    task={editingTask}
                                    currentUser={user}
                                    onSave={handleTaskSave}
                                    onCancel={() => {
                                        setShowTaskForm(false);
                                        setEditingTask(null);
                                    }}
                                    isLoading={isFormLoading}
                                />
                            ) : (
                                <TaskForm
                                    task={editingTask}
                                    currentUser={user}
                                    onSave={handleTaskSave}
                                    onCancel={() => {
                                        setShowTaskForm(false);
                                        setEditingTask(null);
                                    }}
                                    isLoading={isFormLoading}
                                />
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Action Button */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                    setEditingTask(null);
                    setShowTaskForm(true);
                }}
                className="fixed bottom-8 right-8 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-40 group"
                title="Tạo nhiệm vụ mới"
            >
                <motion.div
                    whileHover={{ rotate: 90 }}
                    transition={{ duration: 0.3 }}
                >
                    <Plus className="w-6 h-6" />
                </motion.div>
            </motion.button>

            {/* Loading Overlay */}
            <AnimatePresence>
                {(isLoadingTasks || isFormLoading) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white/95 backdrop-blur-md rounded-2xl p-10 shadow-[0_32px_80px_rgba(0,0,0,0.15)] mx-4 max-w-sm w-full border border-gray-200/50"
                        >
                            <div className="flex flex-col items-center space-y-6">
                                <div className="animate-spin rounded-full h-12 w-12 border-3 border-gray-300 border-t-gray-900" />
                                <div className="text-center">
                                    <div className="font-bold text-gray-900 text-lg mb-2">
                                        {isFormLoading ? 'Đang lưu nhiệm vụ...' : 'Đang tải dữ liệu...'}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Vui lòng chờ trong giây lát
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Music Player */}
            <MusicPlayer />
        </div>
    );
}