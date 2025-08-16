import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    Edit3,
    ChevronLeft,
    ChevronRight,
    CheckCircle
} from 'lucide-react';

// Constants đồng bộ với backend
const FORM_STEPS = {
    BASIC_INFO: 1,
    DETAILS: 2,
    REVIEW: 3
};

const FORM_STEPS_CONFIG = {
    [FORM_STEPS.BASIC_INFO]: {
        title: 'Thông tin cơ bản',
        description: 'Nhập tiêu đề và mô tả công việc'
    },
    [FORM_STEPS.DETAILS]: {
        title: 'Chi tiết',
        description: 'Thiết lập trạng thái, ưu tiên và thời hạn'
    },
    [FORM_STEPS.REVIEW]: {
        title: 'Xem lại',
        description: 'Kiểm tra thông tin trước khi lưu'
    }
};

const TASK_STATUS = {
    TODO: 'todo',
    IN_PROGRESS: 'in_progress',
    REVIEW: 'review',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
};

const TASK_PRIORITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent'
};

const STORAGE_KEYS = {
    DRAFT_TASK: 'taskmaster_draft_task'
};

/** ===========================
 *  Rich Text Editor đơn giản (mobile friendly)
 *  =========================== */
const RichTextEditor = ({ value, onChange, placeholder = 'Nhập nội dung...', disabled }) => {
    const [isPreview, setIsPreview] = useState(false);
    const contentRef = useRef(null);

    const handleFormat = (cmd) => {
        if (disabled) return;
        document.execCommand(cmd, false, null);
        // đồng bộ state
        if (contentRef.current) onChange(contentRef.current.innerHTML);
    };

    const handleInput = () => {
        if (contentRef.current) onChange(contentRef.current.innerHTML);
    };

    useEffect(() => {
        if (contentRef.current && value !== contentRef.current.innerHTML) {
            contentRef.current.innerHTML = value || '';
        }
    }, [value]);

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2 p-2 bg-gray-50 border-b border-gray-200">
                <button
                    type="button"
                    onClick={() => handleFormat('bold')}
                    disabled={disabled}
                    className="px-3 h-9 text-sm font-semibold rounded-lg bg-white border border-gray-200 hover:bg-gray-100 transition disabled:opacity-50"
                    title="In đậm"
                >
                    B
                </button>
                <button
                    type="button"
                    onClick={() => handleFormat('italic')}
                    disabled={disabled}
                    className="px-3 h-9 text-sm italic rounded-lg bg-white border border-gray-200 hover:bg-gray-100 transition disabled:opacity-50"
                    title="Nghiêng"
                >
                    I
                </button>
                <button
                    type="button"
                    onClick={() => handleFormat('underline')}
                    disabled={disabled}
                    className="px-3 h-9 text-sm underline rounded-lg bg-white border border-gray-200 hover:bg-gray-100 transition disabled:opacity-50"
                    title="Gạch chân"
                >
                    U
                </button>

                <span className="w-px h-6 bg-gray-200" />

                <button
                    type="button"
                    onClick={() => handleFormat('insertUnorderedList')}
                    disabled={disabled}
                    className="px-3 h-9 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-100 transition disabled:opacity-50"
                    title="Danh sách đầu dòng"
                >
                    • Danh sách
                </button>

                <div className="ml-auto">
                    <button
                        type="button"
                        onClick={() => setIsPreview((p) => !p)}
                        className="px-3 h-9 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-100 transition"
                        title="Xem trước"
                        disabled={disabled}
                    >
                        {isPreview ? 'Chỉnh sửa' : 'Xem trước'}
                    </button>
                </div>
            </div>

            {/* Vùng nội dung */}
            <div className="min-h-[96px] sm:min-h-[120px]">
                {isPreview ? (
                    <div
                        className="p-3 sm:p-4 bg-gray-50 text-sm sm:text-base prose max-w-none"
                        dangerouslySetInnerHTML={{ __html: value || '<p class="text-gray-400">Không có nội dung</p>' }}
                    />
                ) : (
                    <div
                        ref={contentRef}
                        contentEditable={!disabled}
                        onInput={handleInput}
                        className="p-3 sm:p-4 outline-none text-sm sm:text-base min-h-[88px] sm:min-h-[112px]"
                        suppressContentEditableWarning
                        data-placeholder={placeholder}
                        style={{
                            minHeight: '88px',
                            WebkitUserSelect: disabled ? 'none' : 'text',
                            userSelect: disabled ? 'none' : 'text'
                        }}
                    />
                )}
            </div>

            {/* Placeholder CSS */}
            <style jsx>{`
                [contenteditable='true'][data-placeholder]:empty:before {
                    content: attr(data-placeholder);
                    color: #9ca3af;
                }
                [contenteditable='false'] {
                    background-color: #f9fafb;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
};

/** ===========================
 *  Điều hướng bước (Step Navigation)
 *  =========================== */
const StepNavigation = ({ currentStep, steps, onStepChange, disabled = false }) => {
    return (
        <div className="mb-6 sm:mb-8">
            <div className="flex items-center justify-center gap-3 sm:gap-5 overflow-x-auto pb-2">
                {steps.map((stepKey, index) => {
                    const stepNumber = index + 1;
                    const isActive = currentStep === stepNumber;
                    const isDone = currentStep > stepNumber;
                    const isAccessible = stepNumber <= currentStep || !disabled;

                    return (
                        <div key={stepKey} className="flex items-center flex-shrink-0">
                            <button
                                type="button"
                                onClick={() => isAccessible && onStepChange(stepNumber)}
                                disabled={!isAccessible || disabled}
                                className={[
                                    'w-9 h-9 sm:w-10 sm:h-10 rounded-full text-xs sm:text-sm font-semibold flex items-center justify-center shadow-sm transition-all',
                                    isActive
                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                                        : isDone
                                            ? 'bg-emerald-600 text-white'
                                            : isAccessible
                                                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed',
                                ].join(' ')}
                                title={FORM_STEPS_CONFIG[stepNumber]?.title || `Bước ${stepNumber}`}
                            >
                                {isDone ? <CheckCircle className="w-4 h-4" /> : stepNumber}
                            </button>

                            {index < steps.length - 1 && (
                                <div
                                    className={[
                                        'mx-2 sm:mx-3 h-1 rounded-full transition-all duration-200',
                                        isDone ? 'bg-emerald-500 w-10 sm:w-14' : 'bg-gray-200 w-8 sm:w-12',
                                    ].join(' ')}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="text-center px-3 mt-3">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    {FORM_STEPS_CONFIG[currentStep]?.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    {FORM_STEPS_CONFIG[currentStep]?.description}
                </p>
            </div>
        </div>
    );
};

/** ===========================
 *  Form nhiều bước tạo/chỉnh sửa Task
 *  =========================== */
export default function MultiStepTaskForm({
    task = null,
    currentUser,
    onSave,
    onCancel,
    isLoading = false
}) {
    const [currentStep, setCurrentStep] = useState(FORM_STEPS.BASIC_INFO);
    const [formData, setFormData] = useState({
        title: task?.title || '',
        description: task?.description || '',
        status: task?.status || TASK_STATUS.TODO,
        priority: task?.priority || TASK_PRIORITY.MEDIUM,
        start_date: task?.start_date ? task.start_date.split('T')[0] : '',
        due_date: task?.due_date ? task.due_date.split('T')[0] : '',
        estimated_hours: task?.estimated_hours || '',
        assigned_to: task?.assigned_to || currentUser?.id || '',
        category_id: task?.category_id || '',
        department_id: task?.department_id || currentUser?.department_id || ''
    });

    const [errors, setErrors] = useState({});
    const [submitError, setSubmitError] = useState('');
    const [isDraft, setIsDraft] = useState(false);

    // Refs
    const titleRef = useRef(null);
    const formRef = useRef(null);

    const isEditing = !!task;

    /** Lưu nháp tự động (localStorage) */
    const saveDraft = useCallback(() => {
        if (!task && (formData.title || formData.description)) {
            try {
                const draftData = { ...formData, timestamp: Date.now() };
                localStorage.setItem(STORAGE_KEYS.DRAFT_TASK, JSON.stringify(draftData));
                setIsDraft(true);
            } catch (err) {
                console.error('Lỗi lưu nháp:', err);
            }
        }
    }, [formData, task]);

    // Load nháp khi mount
    useEffect(() => {
        if (!task) {
            try {
                const saved = localStorage.getItem(STORAGE_KEYS.DRAFT_TASK);
                if (saved) {
                    const draft = JSON.parse(saved);
                    if (Date.now() - draft.timestamp < 24 * 60 * 60 * 1000) {
                        setFormData(prev => ({ ...prev, ...draft }));
                        setIsDraft(true);
                    }
                }
            } catch (err) {
                console.error('Lỗi đọc nháp:', err);
            }
        }
    }, [task]);

    // Tự lưu nháp khi thay đổi dữ liệu
    useEffect(() => {
        const timer = setTimeout(() => {
            if (formData.title || formData.description) saveDraft();
        }, 1000);
        return () => clearTimeout(timer);
    }, [formData, saveDraft]);

    // Focus tiêu đề ở bước 1
    useEffect(() => {
        if (currentStep === FORM_STEPS.BASIC_INFO && titleRef.current) {
            setTimeout(() => titleRef.current?.focus(), 100);
        }
    }, [currentStep]);

    const clearDraft = () => {
        try {
            localStorage.removeItem(STORAGE_KEYS.DRAFT_TASK);
            setIsDraft(false);
        } catch (err) {
            console.error('Lỗi xóa nháp:', err);
        }
    };

    /** Helpers */
    const handleInputChange = (name, value) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
        if (submitError) setSubmitError('');
    };

    const getTodayDate = () => new Date().toISOString().split('T')[0];

    /** Validate theo bước */
    const validateStep = (step) => {
        const newErrors = {};

        if (step === FORM_STEPS.BASIC_INFO) {
            if (!formData.title.trim()) newErrors.title = 'Tiêu đề là bắt buộc';
            else if (formData.title.length < 3) newErrors.title = 'Tiêu đề phải có ít nhất 3 ký tự';
            else if (formData.title.length > 200) newErrors.title = 'Tiêu đề không được vượt quá 200 ký tự';

            const plainDesc = formData.description.replace(/<[^>]*>/g, '');
            if (plainDesc && plainDesc.length > 2000) newErrors.description = 'Mô tả không được vượt quá 2000 ký tự';
        }

        if (step === FORM_STEPS.DETAILS) {
            if (formData.start_date && formData.due_date) {
                const start = new Date(formData.start_date);
                const due = new Date(formData.due_date);
                if (start > due) {
                    newErrors.start_date = 'Ngày bắt đầu không thể sau ngày kết thúc';
                    newErrors.due_date = 'Ngày kết thúc không thể trước ngày bắt đầu';
                }
            }

            if (formData.due_date && !isEditing) {
                const due = new Date(formData.due_date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (due < today) {
                    newErrors.due_date = 'Ngày hết hạn không thể là ngày trong quá khứ';
                }
            }

            if (formData.estimated_hours && (isNaN(formData.estimated_hours) || formData.estimated_hours < 1 || formData.estimated_hours > 1000)) {
                newErrors.estimated_hours = 'Số giờ ước tính phải từ 1-1000';
            }

            if (!Object.values(TASK_STATUS).includes(formData.status)) newErrors.status = 'Trạng thái không hợp lệ';
            if (!Object.values(TASK_PRIORITY).includes(formData.priority)) newErrors.priority = 'Độ ưu tiên không hợp lệ';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    /** Điều hướng bước */
    const goToStep = (step) => {
        if (step < currentStep || validateStep(currentStep)) {
            setCurrentStep(step);
            requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
        }
    };

    const nextStep = () => {
        if (validateStep(currentStep) && currentStep < FORM_STEPS.REVIEW) {
            setCurrentStep(currentStep + 1);
            requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
        }
    };

    const prevStep = () => {
        if (currentStep > FORM_STEPS.BASIC_INFO) setCurrentStep(currentStep - 1);
    };

    /** Submit */
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateStep(FORM_STEPS.BASIC_INFO) || !validateStep(FORM_STEPS.DETAILS)) {
            setCurrentStep(FORM_STEPS.BASIC_INFO);
            return;
        }

        try {
            // Prepare data for API - PostgreSQL format
            const taskData = {
                // Include ID if editing
                ...(isEditing && { id: task.id }),

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

            await onSave(taskData);
            clearDraft();
        } catch (error) {
            console.error('Form submission error:', error);
            setSubmitError(error.message || 'Có lỗi xảy ra khi lưu task. Vui lòng thử lại.');
        }
    };

    /** UI từng bước */
    const renderStepContent = () => {
        switch (currentStep) {
            case FORM_STEPS.BASIC_INFO:
                return (
                    <div className="space-y-5 sm:space-y-6">
                        {isDraft && (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4">
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-blue-500">💾</span>
                                    <span className="text-blue-700">Bản nháp đã được lưu tự động</span>
                                    <button
                                        type="button"
                                        onClick={clearDraft}
                                        className="ml-auto text-blue-600 hover:text-blue-800 underline"
                                    >
                                        Xóa bản nháp
                                    </button>
                                </div>
                            </div>
                        )}

                        <div>
                            <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                <FileText className="w-4 h-4 inline mr-1" />
                                Tiêu đề Task *
                            </label>
                            <input
                                ref={titleRef}
                                id="title"
                                type="text"
                                value={formData.title}
                                onChange={(e) => handleInputChange('title', e.target.value)}
                                className={[
                                    'w-full px-4 py-3 rounded-xl border shadow-sm transition',
                                    errors.title
                                        ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-transparent'
                                        : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                                ].join(' ')}
                                placeholder="Nhập tiêu đề task..."
                                maxLength={200}
                                disabled={isLoading}
                            />
                            {errors.title && <p className="text-sm text-red-600 mt-1 flex items-center">
                                <AlertCircle className="w-4 h-4 mr-1" />
                                {errors.title}
                            </p>}
                            <p className="text-xs text-gray-500 mt-1">{formData.title.length}/200 ký tự</p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mô tả chi tiết</label>
                            <RichTextEditor
                                value={formData.description}
                                onChange={(v) => handleInputChange('description', v)}
                                placeholder="Nhập mô tả chi tiết cho task (hỗ trợ Bold / Italic / Underline / List)..."
                                disabled={isLoading}
                            />
                            {errors.description && <p className="text-sm text-red-600 mt-1 flex items-center">
                                <AlertCircle className="w-4 h-4 mr-1" />
                                {errors.description}
                            </p>}
                            <p className="text-xs text-gray-500 mt-1">Gợi ý: Viết ngắn gọn, rõ ràng và có checklist nếu cần.</p>
                        </div>
                    </div>
                );

            case FORM_STEPS.DETAILS:
                return (
                    <div className="space-y-5 sm:space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Trạng thái *</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => handleInputChange('status', e.target.value)}
                                    className={[
                                        'w-full px-4 py-3 rounded-xl border shadow-sm bg-white transition',
                                        errors.status
                                            ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-transparent'
                                            : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                                    ].join(' ')}
                                    disabled={isLoading}
                                >
                                    <option value={TASK_STATUS.TODO}>⏳ Chờ làm</option>
                                    <option value={TASK_STATUS.IN_PROGRESS}>🔄 Đang làm</option>
                                    <option value={TASK_STATUS.REVIEW}>👁️ Đang duyệt</option>
                                    <option value={TASK_STATUS.COMPLETED}>✅ Hoàn thành</option>
                                    <option value={TASK_STATUS.CANCELLED}>❌ Đã hủy</option>
                                </select>
                                {errors.status && <p className="text-sm text-red-600 mt-1 flex items-center">
                                    <AlertCircle className="w-4 h-4 mr-1" />
                                    {errors.status}
                                </p>}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    <Flag className="w-4 h-4 inline mr-1" />
                                    Độ ưu tiên *
                                </label>
                                <select
                                    value={formData.priority}
                                    onChange={(e) => handleInputChange('priority', e.target.value)}
                                    className={[
                                        'w-full px-4 py-3 rounded-xl border shadow-sm bg-white transition',
                                        errors.priority
                                            ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-transparent'
                                            : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                                    ].join(' ')}
                                    disabled={isLoading}
                                >
                                    <option value={TASK_PRIORITY.LOW}>🔵 Thấp</option>
                                    <option value={TASK_PRIORITY.MEDIUM}>🟡 Trung bình</option>
                                    <option value={TASK_PRIORITY.HIGH}>🔴 Cao</option>
                                    <option value={TASK_PRIORITY.URGENT}>🚨 Khẩn cấp</option>
                                </select>
                                {errors.priority && <p className="text-sm text-red-600 mt-1 flex items-center">
                                    <AlertCircle className="w-4 h-4 mr-1" />
                                    {errors.priority}
                                </p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    <Calendar className="w-4 h-4 inline mr-1" />
                                    Ngày bắt đầu
                                </label>
                                <input
                                    type="date"
                                    value={formData.start_date}
                                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                                    className={[
                                        'w-full px-4 py-3 rounded-xl border shadow-sm transition',
                                        errors.start_date
                                            ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-transparent'
                                            : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                                    ].join(' ')}
                                    disabled={isLoading}
                                />
                                {errors.start_date && <p className="text-sm text-red-600 mt-1 flex items-center">
                                    <AlertCircle className="w-4 h-4 mr-1" />
                                    {errors.start_date}
                                </p>}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    <Calendar className="w-4 h-4 inline mr-1" />
                                    Ngày hết hạn
                                </label>
                                <input
                                    type="date"
                                    value={formData.due_date}
                                    onChange={(e) => handleInputChange('due_date', e.target.value)}
                                    min={getTodayDate()}
                                    className={[
                                        'w-full px-4 py-3 rounded-xl border shadow-sm transition',
                                        errors.due_date
                                            ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-transparent'
                                            : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                                    ].join(' ')}
                                    disabled={isLoading}
                                />
                                {errors.due_date && <p className="text-sm text-red-600 mt-1 flex items-center">
                                    <AlertCircle className="w-4 h-4 mr-1" />
                                    {errors.due_date}
                                </p>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                <Clock className="w-4 h-4 inline mr-1" />
                                Số giờ ước tính
                            </label>
                            <input
                                type="number"
                                value={formData.estimated_hours}
                                onChange={(e) => handleInputChange('estimated_hours', e.target.value)}
                                min="1"
                                max="1000"
                                className={[
                                    'w-full px-4 py-3 rounded-xl border shadow-sm transition',
                                    errors.estimated_hours
                                        ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-transparent'
                                        : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                                ].join(' ')}
                                placeholder="Nhập số giờ ước tính..."
                                disabled={isLoading}
                            />
                            {errors.estimated_hours && <p className="text-sm text-red-600 mt-1 flex items-center">
                                <AlertCircle className="w-4 h-4 mr-1" />
                                {errors.estimated_hours}
                            </p>}
                        </div>

                        {/* User info display */}
                        {currentUser && (
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center space-x-2 text-sm text-blue-800">
                                    <User className="w-4 h-4" />
                                    <span>
                                        Người tạo: {currentUser.full_name || currentUser.username} (ID: {currentUser.id})
                                        {currentUser.department_id && ` | Phòng ban: ${currentUser.department_id}`}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case FORM_STEPS.REVIEW:
                return (
                    <div className="space-y-5 sm:space-y-6">
                        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
                            <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Xem lại thông tin</h4>

                            <div className="space-y-4">
                                <div>
                                    <span className="text-sm font-medium text-gray-600">Tiêu đề:</span>
                                    <p className="text-gray-900 text-sm sm:text-base mt-1">{formData.title}</p>
                                </div>

                                {formData.description && (
                                    <div>
                                        <span className="text-sm font-medium text-gray-600">Mô tả:</span>
                                        <div
                                            className="text-gray-900 bg-gray-50 p-3 rounded-lg border text-sm sm:text-base mt-1 prose max-w-none"
                                            dangerouslySetInnerHTML={{ __html: formData.description }}
                                        />
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                    <div>
                                        <span className="text-sm font-medium text-gray-600">Trạng thái:</span>
                                        <p className="text-gray-900 text-sm sm:text-base mt-1">
                                            {formData.status === TASK_STATUS.TODO
                                                ? '⏳ Chờ làm'
                                                : formData.status === TASK_STATUS.IN_PROGRESS
                                                    ? '🔄 Đang làm'
                                                    : formData.status === TASK_STATUS.REVIEW
                                                        ? '👁️ Đang duyệt'
                                                        : formData.status === TASK_STATUS.COMPLETED
                                                            ? '✅ Hoàn thành'
                                                            : '❌ Đã hủy'}
                                        </p>
                                    </div>

                                    <div>
                                        <span className="text-sm font-medium text-gray-600">Độ ưu tiên:</span>
                                        <p className="text-gray-900 text-sm sm:text-base mt-1">
                                            {formData.priority === TASK_PRIORITY.LOW
                                                ? '🔵 Thấp'
                                                : formData.priority === TASK_PRIORITY.MEDIUM
                                                    ? '🟡 Trung bình'
                                                    : formData.priority === TASK_PRIORITY.HIGH
                                                        ? '🔴 Cao'
                                                        : '🚨 Khẩn cấp'}
                                        </p>
                                    </div>

                                    <div>
                                        <span className="text-sm font-medium text-gray-600">Số giờ ước tính:</span>
                                        <p className="text-gray-900 text-sm sm:text-base mt-1">
                                            {formData.estimated_hours ? `${formData.estimated_hours} giờ` : 'Chưa đặt'}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div>
                                        <span className="text-sm font-medium text-gray-600">Ngày bắt đầu:</span>
                                        <p className="text-gray-900 text-sm sm:text-base mt-1">
                                            {formData.start_date
                                                ? `📅 ${new Date(formData.start_date).toLocaleDateString('vi-VN')}`
                                                : 'Chưa đặt'}
                                        </p>
                                    </div>

                                    <div>
                                        <span className="text-sm font-medium text-gray-600">Ngày hết hạn:</span>
                                        <p className="text-gray-900 text-sm sm:text-base mt-1">
                                            {formData.due_date
                                                ? `📅 ${new Date(formData.due_date).toLocaleDateString('vi-VN')}`
                                                : 'Chưa đặt'}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-sm text-blue-700 flex items-center">
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        ✓ Thông tin đã sẵn sàng. Nhấn "Lưu Task" để hoàn tất.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    const steps = Object.keys(FORM_STEPS_CONFIG);

    // Đảm bảo có user context
    if (!currentUser) {
        return (
            <div className="p-6 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Không có thông tin người dùng</h3>
                <p className="text-gray-600 mb-4">Vui lòng đăng nhập để sử dụng tính năng này.</p>
                <button
                    onClick={onCancel}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                    Đóng
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 sm:mb-8">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        {isEditing ? (
                            <Edit3 className="w-5 h-5 text-blue-600" />
                        ) : (
                            <Plus className="w-5 h-5 text-blue-600" />
                        )}
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                            {isEditing ? 'Chỉnh sửa Task' : 'Tạo Task Mới'}
                        </h2>
                        <p className="text-gray-600 text-sm sm:text-base">Điền theo từng bước để hoàn tất task của bạn</p>
                    </div>
                </div>
                <button
                    onClick={onCancel}
                    disabled={isLoading}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                    title="Đóng"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 sm:p-6">
                {/* Nav bước */}
                <StepNavigation
                    currentStep={currentStep}
                    steps={steps}
                    onStepChange={goToStep}
                    disabled={isLoading}
                />

                {/* Lỗi submit tổng */}
                {submitError && (
                    <div className="mb-4 sm:mb-6">
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-red-900">Có lỗi xảy ra</h4>
                                <p className="text-sm text-red-700 mt-1">{submitError}</p>
                            </div>
                            <button
                                onClick={() => setSubmitError('')}
                                className="text-red-400 hover:text-red-600"
                                title="Đóng"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Nội dung từng bước */}
                <div className="mb-6 sm:mb-8">{renderStepContent()}</div>

                {/* Action */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-4 sm:pt-6 border-t border-gray-200">
                    <div className="flex gap-3 order-2 sm:order-1">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
                        >
                            Hủy
                        </button>

                        {currentStep > FORM_STEPS.BASIC_INFO && (
                            <button
                                type="button"
                                onClick={prevStep}
                                disabled={isLoading}
                                className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded-xl hover:bg-blue-200 transition disabled:opacity-50 inline-flex items-center"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" />
                                Quay lại
                            </button>
                        )}
                    </div>

                    <div className="order-1 sm:order-2">
                        {currentStep < FORM_STEPS.REVIEW ? (
                            <button
                                type="button"
                                onClick={nextStep}
                                disabled={isLoading}
                                className="px-5 py-2 text-sm font-medium text-white rounded-xl shadow-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
                            >
                                Tiếp theo
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-6 py-2 text-sm font-medium text-white rounded-xl shadow-sm bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                        <span>Đang lưu...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        <span>{isEditing ? 'Cập nhật Task' : 'Lưu Task'}</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* Tiến độ */}
                <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Tiến độ hoàn thành</span>
                        <span>{Math.round((currentStep / FORM_STEPS.REVIEW) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(currentStep / FORM_STEPS.REVIEW) * 100}%` }}
                        />
                    </div>
                </div>
            </form>
        </div>
    );
}