import React, { useState, useEffect } from 'react';
import {
    X,
    Save,
    Calendar,
    Clock,
    Flag,
    User,
    FileText,
    AlertCircle,
    Plus,
    Edit3
} from 'lucide-react';

export default function TaskForm({
    task,
    currentUser,
    onSave,
    onCancel,
    isLoading = false
}) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        start_date: '',
        due_date: '',
        estimated_hours: '',
        assigned_to: '',
        category_id: '',
        department_id: ''
    });

    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    const isEditing = !!task;

    // Khởi tạo form data
    useEffect(() => {
        console.log('=== FORM INIT DEBUG ===');
        console.log('Task prop:', task);
        console.log('Current user prop:', currentUser);

        if (task) {
            // Editing existing task - convert từ PostgreSQL format
            const taskFormData = {
                id: task.id,
                title: task.title || '',
                description: task.description || '',
                status: task.status || 'todo',
                priority: task.priority || 'medium',
                start_date: task.start_date ? task.start_date.split('T')[0] : '',
                due_date: task.due_date ? task.due_date.split('T')[0] : '',
                estimated_hours: task.estimated_hours || '',
                assigned_to: task.assigned_to || currentUser?.id || '',
                category_id: task.category_id || '',
                department_id: task.department_id || currentUser?.department_id || ''
            };

            console.log('Setting form data for editing:', taskFormData);
            setFormData(taskFormData);
        } else {
            // Creating new task
            const newTaskFormData = {
                title: '',
                description: '',
                status: 'todo',
                priority: 'medium',
                start_date: '',
                due_date: '',
                estimated_hours: '',
                assigned_to: currentUser?.id || '',
                category_id: '',
                department_id: currentUser?.department_id || ''
            };

            console.log('Setting form data for new task:', newTaskFormData);
            setFormData(newTaskFormData);
        }
    }, [task, currentUser]);

    // Validation functions
    const validateField = (name, value) => {
        switch (name) {
            case 'title':
                if (!value?.trim()) return 'Tiêu đề là bắt buộc';
                if (value.length < 3) return 'Tiêu đề phải có ít nhất 3 ký tự';
                if (value.length > 200) return 'Tiêu đề không được vượt quá 200 ký tự';
                return '';

            case 'description':
                if (value && value.length > 2000) return 'Mô tả không được vượt quá 2000 ký tự';
                return '';

            case 'estimated_hours':
                if (value && (isNaN(value) || value < 1 || value > 1000)) {
                    return 'Số giờ ước tính phải từ 1-1000';
                }
                return '';

            case 'start_date':
            case 'due_date':
                if (value && isNaN(new Date(value))) {
                    return 'Ngày không hợp lệ';
                }
                return '';

            default:
                return '';
        }
    };

    const validateDates = () => {
        const errors = {};
        const { start_date, due_date } = formData;

        if (start_date && due_date) {
            const start = new Date(start_date);
            const due = new Date(due_date);

            if (start > due) {
                errors.start_date = 'Ngày bắt đầu không thể sau ngày kết thúc';
                errors.due_date = 'Ngày kết thúc không thể trước ngày bắt đầu';
            }
        }

        if (due_date && !isEditing) {
            const due = new Date(due_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (due < today) {
                errors.due_date = 'Ngày hết hạn không thể là ngày trong quá khứ';
            }
        }

        return errors;
    };

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear errors when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }

        // Validate field if it's been touched
        if (touched[name]) {
            const error = validateField(name, value);
            setErrors(prev => ({ ...prev, [name]: error }));
        }
    };

    const handleInputBlur = (e) => {
        const { name, value } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));

        const error = validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: error }));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        console.log('=== FORM SUBMIT DEBUG ===');
        console.log('Raw form data:', formData);
        console.log('Current user:', currentUser);

        // Validate all fields
        const newErrors = {};
        const newTouched = {};

        // Required fields validation
        Object.keys(formData).forEach(key => {
            newTouched[key] = true;
            const error = validateField(key, formData[key]);
            if (error) newErrors[key] = error;
        });

        // Date validation
        const dateErrors = validateDates();
        Object.assign(newErrors, dateErrors);

        setTouched(newTouched);
        setErrors(newErrors);

        // Stop if there are errors
        if (Object.keys(newErrors).length > 0) {
            console.log('Form validation errors:', newErrors);
            return;
        }

        try {
            // Prepare data for API - PostgreSQL format
            const taskData = {
                // Include ID if editing
                ...(isEditing && { id: formData.id }),

                // Basic fields
                title: formData.title.trim(),
                description: formData.description.trim(),
                status: formData.status,
                priority: formData.priority,

                // Dates - null if empty
                start_date: formData.start_date || null,
                due_date: formData.due_date || null,

                // Numbers - null if empty, convert to int if not
                estimated_hours: formData.estimated_hours ? parseInt(formData.estimated_hours, 10) : null,

                // User assignment - ensure we have a valid user ID
                assigned_to: formData.assigned_to ? parseInt(formData.assigned_to, 10) : (currentUser?.id || null),

                // Categories - null if empty, convert to int if not
                category_id: formData.category_id ? parseInt(formData.category_id, 10) : null,
                department_id: formData.department_id ? parseInt(formData.department_id, 10) : (currentUser?.department_id || null)
            };

            console.log('Processed task data for API:', taskData);

            // Validate required user context
            if (!currentUser || !currentUser.id) {
                throw new Error('Thông tin người dùng không hợp lệ. Vui lòng đăng nhập lại.');
            }

            await onSave(taskData);
        } catch (error) {
            console.error('Form submission error:', error);

            // Hiển thị lỗi chi tiết hơn
            let errorMessage = 'Có lỗi xảy ra khi lưu công việc';

            if (error.message.includes('Failed to create task')) {
                errorMessage = 'Không thể tạo công việc. Vui lòng kiểm tra kết nối mạng và thử lại.';
            } else if (error.message.includes('Failed to update task')) {
                errorMessage = 'Không thể cập nhật công việc. Vui lòng thử lại.';
            } else if (error.message.includes('fetch')) {
                errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra server có đang chạy không.';
            } else if (error.message.includes('người dùng')) {
                errorMessage = error.message;
            }

            setErrors({ submit: errorMessage });
        }
    };

    const handleCancel = () => {
        onCancel();
    };

    // Đảm bảo có user context
    if (!currentUser) {
        return (
            <div className="p-6 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Không có thông tin người dùng</h3>
                <p className="text-gray-600 mb-4">Vui lòng đăng nhập để sử dụng tính năng này.</p>
                <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                    Đóng
                </button>
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        {isEditing ? (
                            <Edit3 className="w-5 h-5 text-blue-600" />
                        ) : (
                            <Plus className="w-5 h-5 text-blue-600" />
                        )}
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                            {isEditing ? 'Chỉnh sửa công việc' : 'Tạo công việc mới'}
                        </h2>
                        <p className="text-sm text-gray-600">
                            {isEditing ? 'Cập nhật thông tin công việc' : 'Điền thông tin để tạo công việc mới'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                    title="Đóng"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Submit Error */}
                {errors.submit && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-red-900">Có lỗi xảy ra</h4>
                            <p className="text-sm text-red-700 mt-1">{errors.submit}</p>
                        </div>
                    </div>
                )}

                {/* User Info Display */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2 text-sm text-blue-800">
                        <User className="w-4 h-4" />
                        <span>
                            Người tạo: {currentUser.full_name || currentUser.username} (ID: {currentUser.id})
                            {currentUser.department_id && ` | Phòng ban: ${currentUser.department_id}`}
                        </span>
                    </div>
                </div>

                {/* Title */}
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                        <FileText className="w-4 h-4 inline mr-1" />
                        Tiêu đề công việc *
                    </label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.title && touched.title
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-300'
                            }`}
                        placeholder="Nhập tiêu đề công việc..."
                        disabled={isLoading}
                    />
                    {errors.title && touched.title && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {errors.title}
                        </p>
                    )}
                </div>

                {/* Description */}
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                        Mô tả công việc
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        rows={4}
                        value={formData.description}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none ${errors.description && touched.description
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-300'
                            }`}
                        placeholder="Mô tả chi tiết về công việc..."
                        disabled={isLoading}
                    />
                    {errors.description && touched.description && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {errors.description}
                        </p>
                    )}
                </div>

                {/* Status and Priority */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                            Trạng thái
                        </label>
                        <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            disabled={isLoading}
                        >
                            <option value="todo">Chờ làm</option>
                            <option value="in_progress">Đang làm</option>
                            <option value="review">Đang duyệt</option>
                            <option value="completed">Hoàn thành</option>
                            <option value="cancelled">Đã hủy</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                            <Flag className="w-4 h-4 inline mr-1" />
                            Độ ưu tiên
                        </label>
                        <select
                            id="priority"
                            name="priority"
                            value={formData.priority}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            disabled={isLoading}
                        >
                            <option value="low">Thấp</option>
                            <option value="medium">Trung bình</option>
                            <option value="high">Cao</option>
                            <option value="urgent">Khẩn cấp</option>
                        </select>
                    </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            Ngày bắt đầu
                        </label>
                        <input
                            type="date"
                            id="start_date"
                            name="start_date"
                            value={formData.start_date}
                            onChange={handleInputChange}
                            onBlur={handleInputBlur}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.start_date && touched.start_date
                                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                : 'border-gray-300'
                                }`}
                            disabled={isLoading}
                        />
                        {errors.start_date && touched.start_date && (
                            <p className="mt-1 text-sm text-red-600 flex items-center">
                                <AlertCircle className="w-4 h-4 mr-1" />
                                {errors.start_date}
                            </p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-2">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            Ngày hết hạn
                        </label>
                        <input
                            type="date"
                            id="due_date"
                            name="due_date"
                            value={formData.due_date}
                            onChange={handleInputChange}
                            onBlur={handleInputBlur}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.due_date && touched.due_date
                                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                : 'border-gray-300'
                                }`}
                            disabled={isLoading}
                        />
                        {errors.due_date && touched.due_date && (
                            <p className="mt-1 text-sm text-red-600 flex items-center">
                                <AlertCircle className="w-4 h-4 mr-1" />
                                {errors.due_date}
                            </p>
                        )}
                    </div>
                </div>

                {/* Estimated Hours */}
                <div>
                    <label htmlFor="estimated_hours" className="block text-sm font-medium text-gray-700 mb-2">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Số giờ ước tính
                    </label>
                    <input
                        type="number"
                        id="estimated_hours"
                        name="estimated_hours"
                        min="1"
                        max="1000"
                        value={formData.estimated_hours}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.estimated_hours && touched.estimated_hours
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-300'
                            }`}
                        placeholder="Nhập số giờ ước tính..."
                        disabled={isLoading}
                    />
                    {errors.estimated_hours && touched.estimated_hours && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {errors.estimated_hours}
                        </p>
                    )}
                </div>

                {/* Assigned To */}
                <div>
                    <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700 mb-2">
                        <User className="w-4 h-4 inline mr-1" />
                        Người thực hiện
                    </label>
                    <input
                        type="number"
                        id="assigned_to"
                        name="assigned_to"
                        value={formData.assigned_to}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder={`ID người thực hiện (mặc định: ${currentUser.id})`}
                        disabled={isLoading}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        Để trống hoặc nhập ID người dùng. Mặc định là bạn ({currentUser.id}).
                    </p>
                </div>

                {/* Categories */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-2">
                            Danh mục
                        </label>
                        <input
                            type="number"
                            id="category_id"
                            name="category_id"
                            value={formData.category_id}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="ID danh mục (tùy chọn)"
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <label htmlFor="department_id" className="block text-sm font-medium text-gray-700 mb-2">
                            Phòng ban
                        </label>
                        <input
                            type="number"
                            id="department_id"
                            name="department_id"
                            value={formData.department_id}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder={`ID phòng ban (mặc định: ${currentUser.department_id || 'không có'})`}
                            disabled={isLoading}
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={handleCancel}
                        disabled={isLoading}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-6 py-3 bg-gradient-to-r from-[#FBBF77] to-[#F59E0B] hover:from-[#F59E0B] hover:to-[#FBBF77] text-white rounded-lg font-semibold transition-all duration-200 shadow-sm disabled:opacity-50 hover:shadow-md flex items-center"
                    >
                        {isLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                {isEditing ? 'Đang cập nhật...' : 'Đang tạo...'}
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                {isEditing ? 'Cập nhật' : 'Tạo công việc'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}