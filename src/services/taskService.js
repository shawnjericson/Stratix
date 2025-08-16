import { api } from './api';

// Task Service với các helper functions
export const taskService = {
    // Status constants
    STATUS: {
        TODO: 'todo',
        IN_PROGRESS: 'in-progress',
        COMPLETED: 'completed'
    },

    // Priority constants
    PRIORITY: {
        HIGH: 'high',
        MEDIUM: 'medium',
        LOW: 'low'
    },

    // Helper function để format date
    formatDate(dateString) {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('vi-VN');
    },

    // Helper function để kiểm tra task quá hạn
    isOverdue(task) {
        if (!task.dueDate || task.status === 'completed') return false;
        return new Date(task.dueDate) < new Date();
    },

    // Helper function để get màu theo priority
    getPriorityColor(priority) {
        const colors = {
            high: '#e74c3c',
            medium: '#f39c12',
            low: '#27ae60'
        };
        return colors[priority] || colors.medium;
    },

    // Helper function để get màu theo status
    getStatusColor(status) {
        const colors = {
            todo: '#95a5a6',
            'in-progress': '#3498db',
            completed: '#27ae60'
        };
        return colors[status] || colors.todo;
    },

    // Tạo task mới với validation
    async createTask(taskData, userId) {
        try {
            // Validation
            if (!taskData.title || taskData.title.trim() === '') {
                throw new Error('Tiêu đề task là bắt buộc!');
            }

            if (taskData.title.length > 100) {
                throw new Error('Tiêu đề task không được quá 100 ký tự!');
            }

            if (taskData.description && taskData.description.length > 500) {
                throw new Error('Mô tả task không được quá 500 ký tự!');
            }

            // Validate dueDate
            if (taskData.dueDate) {
                const dueDate = new Date(taskData.dueDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                if (dueDate < today) {
                    throw new Error('Ngày hết hạn không thể là ngày trong quá khứ!');
                }
            }

            const newTaskData = {
                ...taskData,
                createdBy: userId,
                status: taskData.status || this.STATUS.TODO,
                priority: taskData.priority || this.PRIORITY.MEDIUM
            };

            return await api.createTask(newTaskData);
        } catch (error) {
            console.error('Error in taskService.createTask:', error);
            throw error;
        }
    },

    // Cập nhật task với validation
    async updateTask(id, taskData) {
        try {
            // Validation tương tự như createTask
            if (taskData.title !== undefined) {
                if (!taskData.title || taskData.title.trim() === '') {
                    throw new Error('Tiêu đề task là bắt buộc!');
                }
                if (taskData.title.length > 100) {
                    throw new Error('Tiêu đề task không được quá 100 ký tự!');
                }
            }

            if (taskData.description !== undefined && taskData.description.length > 500) {
                throw new Error('Mô tả task không được quá 500 ký tự!');
            }

            if (taskData.dueDate) {
                const dueDate = new Date(taskData.dueDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                if (dueDate < today) {
                    throw new Error('Ngày hết hạn không thể là ngày trong quá khứ!');
                }
            }

            return await api.updateTask(id, taskData);
        } catch (error) {
            console.error('Error in taskService.updateTask:', error);
            throw error;
        }
    },

    // Move task to next status
    async moveToNextStatus(taskId) {
        try {
            const task = await api.getTaskById(taskId);
            let newStatus;

            switch (task.status) {
                case this.STATUS.TODO:
                    newStatus = this.STATUS.IN_PROGRESS;
                    break;
                case this.STATUS.IN_PROGRESS:
                    newStatus = this.STATUS.COMPLETED;
                    break;
                case this.STATUS.COMPLETED:
                    newStatus = this.STATUS.TODO; // Reset về đầu
                    break;
                default:
                    newStatus = this.STATUS.TODO;
            }

            return await api.updateTaskStatus(taskId, newStatus);
        } catch (error) {
            console.error('Error in taskService.moveToNextStatus:', error);
            throw error;
        }
    },

    // Get tasks với filter và sort
    async getFilteredTasks(userId, filters = {}) {
        try {
            let tasks = await api.getTasks(userId);

            // Apply filters
            if (filters.status) {
                tasks = tasks.filter(task => task.status === filters.status);
            }

            if (filters.priority) {
                tasks = tasks.filter(task => task.priority === filters.priority);
            }

            if (filters.categoryId) {
                tasks = tasks.filter(task => task.categoryId === filters.categoryId);
            }

            if (filters.overdue) {
                tasks = tasks.filter(task => this.isOverdue(task));
            }

            if (filters.search) {
                const query = filters.search.toLowerCase();
                tasks = tasks.filter(task =>
                    task.title.toLowerCase().includes(query) ||
                    task.description.toLowerCase().includes(query)
                );
            }

            // Apply sorting
            if (filters.sortBy) {
                tasks.sort((a, b) => {
                    switch (filters.sortBy) {
                        case 'dueDate':
                            if (!a.dueDate) return 1;
                            if (!b.dueDate) return -1;
                            return new Date(a.dueDate) - new Date(b.dueDate);

                        case 'priority':
                            const priorityOrder = { high: 3, medium: 2, low: 1 };
                            return priorityOrder[b.priority] - priorityOrder[a.priority];

                        case 'createdAt':
                            return new Date(b.createdAt) - new Date(a.createdAt);

                        case 'title':
                            return a.title.localeCompare(b.title);

                        default:
                            return 0;
                    }
                });
            }

            return tasks;
        } catch (error) {
            console.error('Error in taskService.getFilteredTasks:', error);
            throw error;
        }
    },

    // Duplicate task
    async duplicateTask(taskId, userId) {
        try {
            const originalTask = await api.getTaskById(taskId);

            const duplicatedTask = {
                title: `${originalTask.title} (Copy)`,
                description: originalTask.description,
                priority: originalTask.priority,
                categoryId: originalTask.categoryId,
                dueDate: originalTask.dueDate,
                createdBy: userId
            };

            return await this.createTask(duplicatedTask, userId);
        } catch (error) {
            console.error('Error in taskService.duplicateTask:', error);
            throw error;
        }
    },

    // Bulk operations
    async bulkUpdateStatus(taskIds, newStatus) {
        try {
            const promises = taskIds.map(id => api.updateTaskStatus(id, newStatus));
            return await Promise.all(promises);
        } catch (error) {
            console.error('Error in taskService.bulkUpdateStatus:', error);
            throw error;
        }
    },

    async bulkDeleteTasks(taskIds) {
        try {
            const promises = taskIds.map(id => api.deleteTask(id));
            return await Promise.all(promises);
        } catch (error) {
            console.error('Error in taskService.bulkDeleteTasks:', error);
            throw error;
        }
    }
};