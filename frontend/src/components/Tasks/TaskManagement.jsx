import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus,
  Search,
  RotateCcw,
  SlidersHorizontal,
  X,
  Filter,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  Flag,
  User,
  Target
} from 'lucide-react';
import TaskList from './TaskLists';
import TaskForm from './TaskForm';
import ErrorMessage from '../Common/ErrorMessage';

// Import API service
import { api } from '../../services/api';

// Custom hook for debounced value
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Filter Option Component
const FilterOption = ({ icon: Icon, label, value, isActive, onClick, color = "blue" }) => {
  const colorClasses = {
    blue: isActive ? 'bg-blue-500 text-white border-blue-500' : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
    emerald: isActive ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
    amber: isActive ? 'bg-amber-500 text-white border-amber-500' : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
    red: isActive ? 'bg-red-500 text-white border-red-500' : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
    purple: isActive ? 'bg-purple-500 text-white border-purple-500' : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
    gray: isActive ? 'bg-gray-500 text-white border-gray-500' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
  };

  return (
    <button
      onClick={() => onClick(value)}
      className={`
        inline-flex items-center space-x-2 px-3 py-2 rounded-xl border transition-all duration-200
        text-sm font-medium hover:scale-105 active:scale-95
        ${colorClasses[color]}
      `}
    >
      {Icon && <Icon className="w-4 h-4" />}
      <span>{label}</span>
    </button>
  );
};

// Quản lý Công việc (Task Management)
export default function TaskManagement({ user, onStatsUpdate }) {
  // State quản lý danh sách công việc
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // State cho modal TaskForm
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isFormLoading, setIsFormLoading] = useState(false);

  // State cho bộ lọc và tìm kiếm
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    search: '',
    assignedTo: 'all'
  });

  // State hiển thị bộ lọc
  const [showFilters, setShowFilters] = useState(false);

  // Debounced search
  const debouncedSearch = useDebounce(filters.search, 300);

  // Ref để cuộn danh sách
  const taskListRef = useRef(null);

  // Tải công việc khi component mount / đổi user
  useEffect(() => {
    if (user?.id != null) {
      loadTasks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Effect cho debounced search
  useEffect(() => {
    if (user?.id != null && debouncedSearch !== filters.search) {
      // Có thể implement search qua API ở đây nếu cần
      // loadTasks({ search: debouncedSearch });
    }
  }, [debouncedSearch, user?.id]);

  // Lấy tất cả công việc từ server
  const loadTasks = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Loading tasks for user:', user?.id);
      const response = await api.getTasks();
      console.log('Tasks response:', response);

      if (response.tasks) {
        setTasks(response.tasks);
      } else if (Array.isArray(response)) {
        setTasks(response);
      } else {
        console.warn('Unexpected response format:', response);
        setTasks([]);
      }

      if (onStatsUpdate) onStatsUpdate();
    } catch (err) {
      console.error('Error loading tasks:', err);
      setError(err.message || 'Không thể tải danh sách công việc. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // Tạo công việc mới
  const createTask = async (taskData) => {
    setIsFormLoading(true);

    try {
      console.log('Creating task:', taskData);

      const newTaskData = {
        title: taskData.title,
        description: taskData.description || '',
        status: taskData.status || 'todo',
        priority: taskData.priority || 'medium',
        start_date: taskData.start_date || null,
        due_date: taskData.due_date || null,
        estimated_hours: taskData.estimated_hours || null,
        assigned_to: taskData.assigned_to || user.id,
        category_id: taskData.category_id || null,
        department_id: taskData.department_id || user.department_id
      };

      const response = await api.createTask(newTaskData);
      console.log('Create task response:', response);

      let createdTask;
      if (response.task) {
        createdTask = response.task;
      } else if (response.data) {
        createdTask = response.data;
      } else {
        createdTask = response;
      }

      setTasks(prev => [createdTask, ...prev]);
      setShowTaskForm(false);
      setEditingTask(null);

      if (onStatsUpdate) onStatsUpdate();

      if (taskListRef.current) {
        taskListRef.current.scrollIntoView({ behavior: 'smooth' });
      }

      console.log('Task created successfully');
    } catch (err) {
      console.error('Error creating task:', err);
      throw new Error(err.message || 'Không thể tạo công việc. Vui lòng thử lại.');
    } finally {
      setIsFormLoading(false);
    }
  };

  // Cập nhật công việc
  const updateTask = async (taskData) => {
    setIsFormLoading(true);

    try {
      console.log('Updating task:', taskData);
      const response = await api.updateTask(taskData.id, taskData);
      console.log('Update task response:', response);

      let updatedTask;
      if (response.task) {
        updatedTask = response.task;
      } else if (response.data) {
        updatedTask = response.data;
      } else {
        updatedTask = response;
      }

      setTasks(prev => prev.map(task => (task.id === updatedTask.id ? updatedTask : task)));
      setShowTaskForm(false);
      setEditingTask(null);

      if (onStatsUpdate) onStatsUpdate();

      console.log('Task updated successfully');
    } catch (err) {
      console.error('Error updating task:', err);
      throw new Error(err.message || 'Không thể cập nhật công việc. Vui lòng thử lại.');
    } finally {
      setIsFormLoading(false);
    }
  };

  // Xóa công việc
  const deleteTask = async (taskId) => {
    console.log('Deleting task:', taskId);

    const originalTasks = tasks;
    setTasks(prev => prev.filter(task => task.id !== taskId));

    try {
      await api.deleteTask(taskId);
      console.log('Task deleted successfully');
      if (onStatsUpdate) onStatsUpdate();
    } catch (err) {
      console.error('Error deleting task:', err);
      setTasks(originalTasks);
      setError(err.message || 'Không thể xóa công việc. Vui lòng thử lại.');
      setTimeout(() => setError(null), 5000);
    }
  };

  // Handlers
  const handleTaskSave = async (taskData) => {
    if (editingTask) {
      await updateTask(taskData);
    } else {
      await createTask(taskData);
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setShowTaskForm(true);
  };

  const handleCancelForm = () => {
    setShowTaskForm(false);
    setEditingTask(null);
  };

  // Filter handlers
  const handleFilterChange = useCallback((filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType] === value ? 'all' : value
    }));
  }, []);

  const handleSearchChange = (e) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  };

  const clearAllFilters = () => {
    setFilters({ status: 'all', priority: 'all', search: '', assignedTo: 'all' });
    setShowFilters(false);
  };

  // Áp dụng bộ lọc
  const getFilteredTasks = () => {
    return tasks.filter(task => {
      if (filters.status !== 'all' && task.status !== filters.status) return false;
      if (filters.priority !== 'all' && task.priority !== filters.priority) return false;

      if (filters.assignedTo !== 'all') {
        if (filters.assignedTo === 'me' && task.assigned_to !== user.id) return false;
        if (filters.assignedTo === 'others' && task.assigned_to === user.id) return false;
        if (filters.assignedTo === 'unassigned' && task.assigned_to) return false;
      }

      if (debouncedSearch) {
        const query = debouncedSearch.toLowerCase();
        const titleMatch = task.title?.toLowerCase().includes(query);
        const descriptionMatch = task.description?.toLowerCase().includes(query);
        if (!titleMatch && !descriptionMatch) return false;
      }

      return true;
    });
  };

  const filteredTasks = getFilteredTasks();

  // Thống kê nhanh
  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const todo = tasks.filter(t => t.status === 'todo').length;
    const overdue = tasks.filter(t => {
      if (!t.due_date || t.status === 'completed') return false;
      return new Date(t.due_date) < new Date();
    }).length;
    const myTasks = tasks.filter(t => t.assigned_to === user.id).length;

    return { total, completed, inProgress, todo, overdue, myTasks };
  };

  const stats = getTaskStats();

  // Có đang bật bộ lọc không?
  const hasActiveFilters =
    filters.status !== 'all' ||
    filters.priority !== 'all' ||
    filters.search !== '' ||
    filters.assignedTo !== 'all';

  const activeFilterCount = [
    filters.status !== 'all',
    filters.priority !== 'all',
    filters.search !== '',
    filters.assignedTo !== 'all'
  ].filter(Boolean).length;

  return (
    <div className="h-full bg-gradient-to-br from-gray-50 to-white" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Compact Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Title & Quick Stats */}
            <div className="flex items-center space-x-8">
              <div>
                <h1 className="text-xl font-bold text-gray-900 mb-1">Quản lý công việc</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Tổng: <span className="font-semibold text-gray-900">{stats.total}</span></span>
                  <span>Hoàn thành: <span className="font-semibold text-emerald-600">{stats.completed}</span></span>
                  <span>Đang làm: <span className="font-semibold text-blue-600">{stats.inProgress}</span></span>
                  {stats.overdue > 0 && (
                    <span>Trễ hạn: <span className="font-semibold text-red-600">{stats.overdue}</span></span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`
                  relative inline-flex items-center px-4 py-2 rounded-xl font-medium transition-all duration-200
                  ${hasActiveFilters
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Lọc
                {activeFilterCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center w-5 h-5 bg-white/20 backdrop-blur-sm text-xs rounded-full font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Refresh */}
              <button
                onClick={loadTasks}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium disabled:opacity-50"
                title="Làm mới"
              >
                <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>

              {/* Create Task */}
              <button
                onClick={handleCreateTask}
                disabled={isLoading}
                className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tạo mới
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Beautiful Filters Panel */}
      {showFilters && (
        <div className="bg-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
          <div className="px-6 py-5 space-y-6">
            {/* Search Bar */}
            <div className="relative max-w-md">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tìm kiếm công việc
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={handleSearchChange}
                  placeholder="Tìm theo tiêu đề hoặc mô tả..."
                  className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                />
                {filters.search && (
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Options Grid */}
            <div className="space-y-4">
              {/* Status Filters */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Trạng thái
                </label>
                <div className="flex flex-wrap gap-2">
                  <FilterOption
                    icon={Target}
                    label="Tất cả"
                    value="all"
                    isActive={filters.status === 'all'}
                    onClick={(value) => handleFilterChange('status', value)}
                    color="gray"
                  />
                  <FilterOption
                    icon={Clock}
                    label="Chờ làm"
                    value="todo"
                    isActive={filters.status === 'todo'}
                    onClick={(value) => handleFilterChange('status', value)}
                    color="amber"
                  />
                  <FilterOption
                    icon={Users}
                    label="Đang làm"
                    value="in_progress"
                    isActive={filters.status === 'in_progress'}
                    onClick={(value) => handleFilterChange('status', value)}
                    color="blue"
                  />
                  <FilterOption
                    icon={CheckCircle2}
                    label="Hoàn thành"
                    value="completed"
                    isActive={filters.status === 'completed'}
                    onClick={(value) => handleFilterChange('status', value)}
                    color="emerald"
                  />
                </div>
              </div>

              {/* Priority Filters */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Độ ưu tiên
                </label>
                <div className="flex flex-wrap gap-2">
                  <FilterOption
                    icon={Filter}
                    label="Tất cả"
                    value="all"
                    isActive={filters.priority === 'all'}
                    onClick={(value) => handleFilterChange('priority', value)}
                    color="gray"
                  />
                  <FilterOption
                    icon={Flag}
                    label="Khẩn cấp"
                    value="urgent"
                    isActive={filters.priority === 'urgent'}
                    onClick={(value) => handleFilterChange('priority', value)}
                    color="red"
                  />
                  <FilterOption
                    icon={Flag}
                    label="Cao"
                    value="high"
                    isActive={filters.priority === 'high'}
                    onClick={(value) => handleFilterChange('priority', value)}
                    color="red"
                  />
                  <FilterOption
                    icon={Flag}
                    label="Trung bình"
                    value="medium"
                    isActive={filters.priority === 'medium'}
                    onClick={(value) => handleFilterChange('priority', value)}
                    color="amber"
                  />
                  <FilterOption
                    icon={Flag}
                    label="Thấp"
                    value="low"
                    isActive={filters.priority === 'low'}
                    onClick={(value) => handleFilterChange('priority', value)}
                    color="blue"
                  />
                </div>
              </div>

              {/* Assignment Filters */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Người thực hiện
                </label>
                <div className="flex flex-wrap gap-2">
                  <FilterOption
                    icon={Users}
                    label="Tất cả"
                    value="all"
                    isActive={filters.assignedTo === 'all'}
                    onClick={(value) => handleFilterChange('assignedTo', value)}
                    color="gray"
                  />
                  <FilterOption
                    icon={User}
                    label="Của tôi"
                    value="me"
                    isActive={filters.assignedTo === 'me'}
                    onClick={(value) => handleFilterChange('assignedTo', value)}
                    color="purple"
                  />
                  <FilterOption
                    icon={Users}
                    label="Người khác"
                    value="others"
                    isActive={filters.assignedTo === 'others'}
                    onClick={(value) => handleFilterChange('assignedTo', value)}
                    color="blue"
                  />
                  <FilterOption
                    icon={AlertTriangle}
                    label="Chưa giao"
                    value="unassigned"
                    isActive={filters.assignedTo === 'unassigned'}
                    onClick={(value) => handleFilterChange('assignedTo', value)}
                    color="amber"
                  />
                </div>
              </div>
            </div>

            {/* Filter Summary & Actions */}
            {hasActiveFilters && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Hiển thị <span className="font-semibold text-gray-900">{filteredTasks.length}</span> /{' '}
                  <span className="font-semibold text-gray-900">{tasks.length}</span> công việc
                </div>
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                >
                  Xóa tất cả bộ lọc
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="px-6 py-4 bg-red-50 border-b border-red-200">
          <ErrorMessage
            message={error}
            onRetry={loadTasks}
            onDismiss={() => setError(null)}
          />
        </div>
      )}

      {/* Task List - Remove onCreateTask prop since we handle it in header */}
      <div ref={taskListRef} className="flex-1 overflow-y-auto">
        <TaskList
          tasks={filteredTasks}
          isLoading={isLoading}
          error={null}
          currentUser={user}
          onEditTask={handleEditTask}
          onDeleteTask={deleteTask}
          onRetryLoad={loadTasks}
          onCreateTask={handleCreateTask}
        />
      </div>
      {showTaskForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <TaskForm
              task={editingTask}
              currentUser={user}
              onSave={handleTaskSave}
              onCancel={handleCancelForm}
              isLoading={isFormLoading}
            />
          </div>
        </div>
      )}

      {/* Form Loading Overlay */}
      {isFormLoading && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-2xl mx-4 max-w-sm w-full">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
              <div className="text-center">
                <div className="font-semibold text-gray-900">
                  {editingTask ? 'Đang cập nhật...' : 'Đang tạo công việc...'}
                </div>
                <div className="text-sm text-gray-600 mt-1">Vui lòng chờ trong giây lát</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}