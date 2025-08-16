import React from 'react';
import {
    CheckSquare,
    Clock,
    Play,
    CheckCircle2,
    FileText,
    Plus,
    AlertTriangle,
    TrendingUp
} from 'lucide-react';
import TaskItem from './TaskItem';
import ErrorMessage from '../Common/ErrorMessage';

export default function TaskList({
    tasks = [],
    isLoading = false,
    error = null,
    currentUser,
    onEditTask,
    onDeleteTask,
    onRetryLoad,
    onCreateTask
}) {
    // Remove handleCreateTask since we don't need floating button anymore

    // Đang tải
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Đang tải...</h3>
                    <p className="text-gray-500 text-sm">Vui lòng chờ trong giây lát</p>
                </div>
            </div>
        );
    }

    // Lỗi tải dữ liệu
    if (error) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="max-w-md mx-auto">
                    <ErrorMessage
                        message={error}
                        onRetry={onRetryLoad}
                        onDismiss={() => { }}
                    />
                </div>
            </div>
        );
    }

    // Trạng thái rỗng
    if (!tasks || tasks.length === 0) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center max-w-md mx-auto">
                    <div className="mx-auto h-16 w-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-6">
                        <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có công việc</h3>
                    <p className="text-gray-500 mb-6">
                        Tạo công việc đầu tiên để bắt đầu quản lý hiệu quả
                    </p>
                    <button
                        onClick={() => onCreateTask && onCreateTask()}
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Tạo công việc đầu tiên
                    </button>
                </div>
            </div>
        );
    }

    // Nhóm công việc theo trạng thái với ưu tiên hiển thị
    const groupTasksByStatus = (tasks) => {
        const groups = tasks.reduce((acc, task) => {
            const status = task.status || 'todo';
            if (!acc[status]) acc[status] = [];
            acc[status].push(task);
            return acc;
        }, {});

        // Sắp xếp tasks trong mỗi group theo độ ưu tiên + due date
        Object.keys(groups).forEach(status => {
            groups[status].sort((a, b) => {
                // Priority weight
                const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 };
                const priorityDiff = (priorityWeight[b.priority] || 2) - (priorityWeight[a.priority] || 2);
                if (priorityDiff !== 0) return priorityDiff;

                // Due date urgency
                const today = new Date().setHours(0, 0, 0, 0);
                const aOverdue = a.due_date && new Date(a.due_date) < today;
                const bOverdue = b.due_date && new Date(b.due_date) < today;
                if (aOverdue && !bOverdue) return -1;
                if (!aOverdue && bOverdue) return 1;

                // Due date proximity
                if (a.due_date && b.due_date) {
                    return new Date(a.due_date) - new Date(b.due_date);
                }
                if (a.due_date && !b.due_date) return -1;
                if (!a.due_date && b.due_date) return 1;

                // Created time (newest first)
                return new Date(b.created_at || 0) - new Date(a.created_at || 0);
            });
        });

        return groups;
    };

    const groupedTasks = groupTasksByStatus(tasks);
    const statusOrder = ['todo', 'in_progress', 'review', 'completed'];

    const statusConfig = {
        'todo': {
            label: 'Chờ làm',
            icon: Clock,
            colors: 'from-amber-500/10 to-orange-500/10 border-amber-200/50',
            textColor: 'text-amber-700',
            iconColor: 'text-amber-500',
            count: groupedTasks.todo?.length || 0
        },
        'in_progress': {
            label: 'Đang thực hiện',
            icon: Play,
            colors: 'from-blue-500/10 to-cyan-500/10 border-blue-200/50',
            textColor: 'text-blue-700',
            iconColor: 'text-blue-500',
            count: groupedTasks.in_progress?.length || 0
        },
        'review': {
            label: 'Đang duyệt',
            icon: TrendingUp,
            colors: 'from-purple-500/10 to-pink-500/10 border-purple-200/50',
            textColor: 'text-purple-700',
            iconColor: 'text-purple-500',
            count: groupedTasks.review?.length || 0
        },
        'completed': {
            label: 'Hoàn thành',
            icon: CheckCircle2,
            colors: 'from-emerald-500/10 to-green-500/10 border-emerald-200/50',
            textColor: 'text-emerald-700',
            iconColor: 'text-emerald-500',
            count: groupedTasks.completed?.length || 0
        }
    };

    // Tính toán stats tổng quan
    const totalTasks = tasks.length;
    const completedCount = statusConfig.completed.count;
    const overdueTasks = tasks.filter(t => {
        if (!t.due_date || t.status === 'completed') return false;
        return new Date(t.due_date) < new Date();
    }).length;

    const progressPercentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

    return (
        <div className="p-6 font-inter">
            {/* Quick Stats Bar */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 shadow-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                        {statusOrder.map(status => {
                            const config = statusConfig[status];
                            const Icon = config.icon;
                            if (config.count === 0) return null;

                            return (
                                <div key={status} className="flex items-center space-x-2">
                                    <div className={`p-1.5 rounded-lg bg-gradient-to-br ${config.colors}`}>
                                        <Icon className={`w-4 h-4 ${config.iconColor}`} />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">
                                        {config.count}
                                    </span>
                                    <span className="text-xs text-gray-500">{config.label}</span>
                                </div>
                            );
                        })}

                        {overdueTasks > 0 && (
                            <div className="flex items-center space-x-2 text-red-600">
                                <AlertTriangle className="w-4 h-4" />
                                <span className="text-sm font-medium">{overdueTasks}</span>
                                <span className="text-xs">Quá hạn</span>
                            </div>
                        )}
                    </div>

                    {/* Progress indicator */}
                    <div className="flex items-center space-x-3">
                        <div className="text-right">
                            <div className="text-sm font-semibold text-gray-900">
                                {progressPercentage}%
                            </div>
                            <div className="text-xs text-gray-500">
                                {completedCount}/{totalTasks}
                            </div>
                        </div>
                        <div className="w-12 h-12 relative">
                            <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                                <path
                                    className="text-gray-200"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    fill="none"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                                <path
                                    className="text-blue-500"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    strokeDasharray={`${progressPercentage}, 100`}
                                    strokeLinecap="round"
                                    fill="none"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Task Groups */}
            <div className="space-y-6">
                {statusOrder.map(status => {
                    const statusTasks = groupedTasks[status];
                    if (!statusTasks || statusTasks.length === 0) return null;

                    const config = statusConfig[status];
                    const Icon = config.icon;

                    return (
                        <div key={status} className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 shadow-lg overflow-hidden">
                            {/* Section Header - Compact */}
                            <div className={`bg-gradient-to-r ${config.colors} border-b border-white/30 px-6 py-4`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm">
                                            <Icon className={`w-5 h-5 ${config.iconColor}`} />
                                        </div>
                                        <div>
                                            <h3 className={`text-lg font-semibold ${config.textColor}`}>
                                                {config.label}
                                            </h3>
                                        </div>
                                    </div>

                                    <div className={`
                                        inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-semibold
                                        bg-white/80 backdrop-blur-sm ${config.textColor} shadow-sm
                                    `}>
                                        {statusTasks.length}
                                    </div>
                                </div>
                            </div>

                            {/* Task Items - Optimized spacing */}
                            <div className="p-4">
                                <div className="space-y-3">
                                    {statusTasks.map(task => (
                                        <TaskItem
                                            key={task.id}
                                            task={task}
                                            currentUser={currentUser}
                                            onEdit={onEditTask}
                                            onDelete={onDeleteTask}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>


        </div>
    );
}