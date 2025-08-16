import React, { useState } from 'react';
import {
    Clock,
    Play,
    CheckCircle2,
    Edit3,
    Trash2,
    Flag,
    Calendar,
    MoreVertical,
    Plus,
    Eye,
    AlertTriangle
} from 'lucide-react';

// Status Configuration
const TASK_STATUS = {
    TODO: 'todo',
    IN_PROGRESS: 'in_progress',
    REVIEW: 'review',
    COMPLETED: 'completed'
};

const STATUS_CONFIG = {
    [TASK_STATUS.TODO]: {
        label: 'Chờ làm',
        icon: Clock,
        colors: 'from-amber-400/20 to-orange-400/20',
        border: 'border-amber-300/30',
        text: 'text-amber-700',
        accent: 'bg-gradient-to-r from-amber-500 to-orange-500'
    },
    [TASK_STATUS.IN_PROGRESS]: {
        label: 'Đang thực hiện',
        icon: Play,
        colors: 'from-blue-400/20 to-cyan-400/20',
        border: 'border-blue-300/30',
        text: 'text-blue-700',
        accent: 'bg-gradient-to-r from-blue-500 to-cyan-500'
    },
    [TASK_STATUS.REVIEW]: {
        label: 'Đang duyệt',
        icon: Eye,
        colors: 'from-purple-400/20 to-pink-400/20',
        border: 'border-purple-300/30',
        text: 'text-purple-700',
        accent: 'bg-gradient-to-r from-purple-500 to-pink-500'
    },
    [TASK_STATUS.COMPLETED]: {
        label: 'Hoàn thành',
        icon: CheckCircle2,
        colors: 'from-emerald-400/20 to-green-400/20',
        border: 'border-emerald-300/30',
        text: 'text-emerald-700',
        accent: 'bg-gradient-to-r from-emerald-500 to-green-500'
    }
};

// Priority Configuration
const PRIORITY_CONFIG = {
    low: {
        label: 'Thấp',
        color: 'text-gray-600',
        bg: 'bg-gray-100/80',
        flag: 'text-gray-500'
    },
    medium: {
        label: 'Trung bình',
        color: 'text-blue-600',
        bg: 'bg-blue-100/80',
        flag: 'text-blue-500'
    },
    high: {
        label: 'Cao',
        color: 'text-orange-600',
        bg: 'bg-orange-100/80',
        flag: 'text-orange-500'
    },
    urgent: {
        label: 'Khẩn cấp',
        color: 'text-red-600',
        bg: 'bg-red-100/80',
        flag: 'text-red-500'
    }
};

// Task Card Component
const TaskCard = ({ task, onEdit, onDelete }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [showActions, setShowActions] = useState(false);

    const handleDragStart = (e) => {
        setIsDragging(true);
        e.dataTransfer.setData('text/plain', task.id);
        e.dataTransfer.setData('application/json', JSON.stringify(task));
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnd = () => {
        setIsDragging(false);
    };

    const handleEdit = (e) => {
        e.stopPropagation();
        onEdit(task);
        setShowActions(false);
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        if (window.confirm(`Bạn có chắc chắn muốn xóa "${task.title}"?`)) {
            onDelete(task.id);
        }
        setShowActions(false);
    };

    const formatCreatedDate = (dateString) => {
        if (!dateString) return 'Không rõ';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: 'numeric',
            month: 'short',
            year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
        });
    };

    const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            className={`
                group relative cursor-move
                bg-white/70 backdrop-blur-xl
                border border-white/50 rounded-2xl
                shadow-lg hover:shadow-xl
                transition-all duration-200 ease-out
                ${isDragging ? 'opacity-50 scale-95 rotate-1' : ''}
            `}
            style={{ fontFamily: 'Inter, sans-serif' }}
        >
            <div className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 text-sm leading-tight flex-1 mr-2 line-clamp-2">
                        {task.title}
                    </h4>

                    {/* Actions Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setShowActions(!showActions)}
                            className={`
                                p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100/80
                                transition-all duration-200 backdrop-blur-sm
                                ${showActions ? 'opacity-100 bg-gray-100/80' : 'opacity-0 group-hover:opacity-100'}
                            `}
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>

                        {showActions && (
                            <div className="absolute right-0 top-8 bg-white/90 backdrop-blur-xl rounded-xl shadow-xl border border-white/50 py-2 z-20 min-w-32">
                                <button
                                    onClick={handleEdit}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50/80 flex items-center space-x-2 transition-colors duration-150"
                                >
                                    <Edit3 className="w-4 h-4 text-blue-500" />
                                    <span>Chỉnh sửa</span>
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50/80 flex items-center space-x-2 transition-colors duration-150"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span>Xóa</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Task Info */}
                <div className="space-y-3">
                    {/* Priority */}
                    <div className="flex items-center justify-between">
                        <div className={`
                            inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium
                            ${priorityConfig.bg} ${priorityConfig.color}
                            border border-white/30 backdrop-blur-sm
                        `}>
                            <Flag className={`w-3 h-3 mr-1.5 ${priorityConfig.flag}`} />
                            {priorityConfig.label}
                        </div>
                    </div>

                    {/* Created Date */}
                    <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="w-3 h-3 mr-1.5" />
                        <span>Tạo ngày {formatCreatedDate(task.created_at)}</span>
                    </div>
                </div>
            </div>

            {/* Drag Indicator */}
            {isDragging && (
                <div className="absolute inset-0 border-2 border-dashed border-blue-400/50 rounded-2xl bg-blue-50/20 backdrop-blur-sm" />
            )}
        </div>
    );
};

// Column Header Component
const ColumnHeader = ({ status, taskCount }) => {
    const config = STATUS_CONFIG[status];
    const Icon = config.icon;

    return (
        <div className={`
            bg-gradient-to-br ${config.colors} backdrop-blur-xl
            border ${config.border} rounded-2xl p-4 mb-4
        `}>
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className={`p-2.5 rounded-xl ${config.accent} shadow-lg`}>
                        <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className={`font-bold text-lg ${config.text}`}>
                            {config.label}
                        </h3>
                        <p className="text-sm text-gray-600">
                            {taskCount} công việc
                        </p>
                    </div>
                </div>

                <div className={`
                    ${config.accent} text-white px-3 py-1.5 rounded-xl text-sm font-bold
                    shadow-lg backdrop-blur-sm
                `}>
                    {taskCount}
                </div>
            </div>
        </div>
    );
};

// Empty State Component
const EmptyState = ({ status }) => {
    const config = STATUS_CONFIG[status];
    const Icon = config.icon;

    return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100/80 to-gray-200/80 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <Icon className="w-8 h-8" />
            </div>
            <p className="text-sm font-medium text-gray-500 text-center">
                Chưa có công việc
            </p>
            <p className="text-xs text-gray-400 text-center mt-1">
                Kéo thả công việc vào đây
            </p>
        </div>
    );
};

// Drop Zone Component
const DropZone = ({ isDragOver, status }) => {
    const config = STATUS_CONFIG[status];

    if (!isDragOver) return null;

    return (
        <div className={`
            mt-4 border-2 border-dashed rounded-2xl p-6
            bg-gradient-to-br ${config.colors} backdrop-blur-xl
            ${config.border} animate-pulse
        `}>
            <div className={`flex items-center justify-center space-x-2 ${config.text}`}>
                <Plus className="w-5 h-5" />
                <span className="font-medium">Thả công việc vào đây</span>
            </div>
        </div>
    );
};

// Kanban Column Component
const KanbanColumn = ({ status, tasks, onTaskDrop, onEditTask, onDeleteTask }) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const config = STATUS_CONFIG[status];

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setIsDragOver(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);

        const taskId = e.dataTransfer.getData('text/plain');
        const taskData = JSON.parse(e.dataTransfer.getData('application/json'));

        if (taskData.status !== status) {
            onTaskDrop(taskId, status);
        }
    };

    return (
        <div className="flex-1 min-w-80 max-w-sm">
            <ColumnHeader status={status} taskCount={tasks.length} />

            <div
                className={`
                    min-h-96 rounded-2xl p-4 transition-all duration-300
                    bg-white/40 backdrop-blur-xl border border-white/30
                    ${isDragOver ? `bg-gradient-to-br ${config.colors} ${config.border} border-2 border-dashed` : ''}
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <div className="space-y-4">
                    {tasks.map(task => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            onEdit={onEditTask}
                            onDelete={onDeleteTask}
                        />
                    ))}
                </div>

                {tasks.length === 0 && <EmptyState status={status} />}

                <DropZone isDragOver={isDragOver} status={status} />
            </div>
        </div>
    );
};

// Stats Card Component
const StatsCard = ({ icon: Icon, label, value, color = "gray" }) => {
    const colorClasses = {
        gray: "from-gray-400/20 to-gray-500/20 border-gray-300/30 text-gray-700",
        blue: "from-blue-400/20 to-cyan-400/20 border-blue-300/30 text-blue-700",
        emerald: "from-emerald-400/20 to-green-400/20 border-emerald-300/30 text-emerald-700",
        amber: "from-amber-400/20 to-orange-400/20 border-amber-300/30 text-amber-700"
    };

    return (
        <div className={`
            bg-gradient-to-br ${colorClasses[color]}
            backdrop-blur-xl border rounded-2xl p-4 text-center
            shadow-lg hover:shadow-xl transition-all duration-200
        `}>
            <Icon className="w-6 h-6 mx-auto mb-2 opacity-80" />
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-sm opacity-75">{label}</div>
        </div>
    );
};

// Notification Component
const showNotification = (message, type = 'success') => {
    const notification = document.createElement('div');
    notification.className = `
        fixed top-6 right-6 z-50 p-4 rounded-2xl shadow-2xl backdrop-blur-xl
        transition-all duration-300 max-w-sm border border-white/50
        ${type === 'success'
            ? 'bg-emerald-500/90 text-white'
            : 'bg-red-500/90 text-white'
        }
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
};

// Loading Overlay Component
const LoadingOverlay = ({ isVisible, message }) => {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/50 max-w-sm mx-4">
                <div className="flex items-center space-x-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
                    <span className="text-gray-700 font-medium">{message}</span>
                </div>
            </div>
        </div>
    );
};

// Main Kanban Board Component
export default function KanbanBoard({ tasks, onTaskStatusChange, onEditTask, onDeleteTask, isLoading }) {
    const [isUpdating, setIsUpdating] = useState(false);

    const displayStatuses = [TASK_STATUS.TODO, TASK_STATUS.IN_PROGRESS, TASK_STATUS.REVIEW, TASK_STATUS.COMPLETED];

    const groupedTasks = displayStatuses.reduce((acc, status) => {
        acc[status] = tasks.filter(task => task.status === status);
        return acc;
    }, {});

    const handleTaskDrop = async (taskId, newStatus) => {
        const task = tasks.find(t => t.id.toString() === taskId.toString());
        if (!task || task.status === newStatus) return;

        setIsUpdating(true);

        try {
            await onTaskStatusChange(taskId, newStatus);
            showNotification(
                `"${task.title}" đã được chuyển sang ${STATUS_CONFIG[newStatus].label}`,
                'success'
            );
        } catch (error) {
            console.error('Error updating task status:', error);
            showNotification('Cập nhật trạng thái thất bại', 'error');
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Inter, sans-serif' }}>
                            Đang tải bảng Kanban
                        </h3>
                        <p className="text-gray-600">Đang sắp xếp công việc...</p>
                    </div>
                </div>
            </div>
        );
    }

    const total = tasks.length;
    const completed = groupedTasks[TASK_STATUS.COMPLETED].length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return (
        <div className="space-y-8" style={{ fontFamily: 'Inter, sans-serif' }}>
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        Bảng Kanban
                    </h2>
                    <p className="text-gray-600 text-lg">
                        Kéo thả để cập nhật trạng thái công việc
                    </p>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatsCard
                        icon={Clock}
                        label="Tổng cộng"
                        value={total}
                        color="gray"
                    />
                    <StatsCard
                        icon={Play}
                        label="Đang làm"
                        value={groupedTasks[TASK_STATUS.IN_PROGRESS].length}
                        color="blue"
                    />
                    <StatsCard
                        icon={CheckCircle2}
                        label="Hoàn thành"
                        value={`${completionRate}%`}
                        color="emerald"
                    />
                    <StatsCard
                        icon={AlertTriangle}
                        label="Chờ duyệt"
                        value={groupedTasks[TASK_STATUS.REVIEW].length}
                        color="amber"
                    />
                </div>
            </div>

            {/* Kanban Columns */}
            <div className="flex gap-6 overflow-x-auto pb-4 min-h-96">
                {displayStatuses.map(status => (
                    <KanbanColumn
                        key={status}
                        status={status}
                        tasks={groupedTasks[status]}
                        onTaskDrop={handleTaskDrop}
                        onEditTask={onEditTask}
                        onDeleteTask={onDeleteTask}
                    />
                ))}
            </div>

            {/* Loading Overlay */}
            <LoadingOverlay
                isVisible={isUpdating}
                message="Đang cập nhật công việc..."
            />

            {/* Custom Styles */}
            <style jsx>{`
                .line-clamp-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                /* Custom Scrollbar */
                div::-webkit-scrollbar {
                    height: 8px;
                    width: 8px;
                }
                div::-webkit-scrollbar-track {
                    background: rgba(241, 245, 249, 0.5);
                    border-radius: 8px;
                }
                div::-webkit-scrollbar-thumb {
                    background: linear-gradient(90deg, #3b82f6, #06b6d4);
                    border-radius: 8px;
                }
                div::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(90deg, #2563eb, #0891b2);
                }
            `}</style>
        </div>
    );
}