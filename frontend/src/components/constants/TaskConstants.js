// Task Status Constants - ĐỒNG BỘ VỚI BACKEND
export const TASK_STATUS = {
    TODO: 'todo',
    IN_PROGRESS: 'in_progress', // Đổi từ 'in-progress' thành 'in_progress'
    COMPLETED: 'completed'
};

export const TASK_PRIORITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent' // Thêm urgent như backend
};

// Task Status Display Config
export const TASK_STATUS_CONFIG = {
    [TASK_STATUS.TODO]: {
        label: 'Chờ làm',
        color: 'yellow',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        borderColor: 'border-yellow-200',
        icon: '⏳'
    },
    [TASK_STATUS.IN_PROGRESS]: {
        label: 'Đang làm',
        color: 'blue',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800',
        borderColor: 'border-blue-200',
        icon: '🔄'
    },
    [TASK_STATUS.COMPLETED]: {
        label: 'Hoàn thành',
        color: 'green',
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        borderColor: 'border-green-200',
        icon: '✅'
    }
};

// Task Priority Display Config
export const TASK_PRIORITY_CONFIG = {
    [TASK_PRIORITY.LOW]: {
        label: 'Thấp',
        color: 'gray',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-700',
        icon: '🔵'
    },
    [TASK_PRIORITY.MEDIUM]: {
        label: 'Trung bình',
        color: 'orange',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-700',
        icon: '🟡'
    },
    [TASK_PRIORITY.HIGH]: {
        label: 'Cao',
        color: 'red',
        bgColor: 'bg-red-100',
        textColor: 'text-red-700',
        icon: '🔴'
    },
    [TASK_PRIORITY.URGENT]: {
        label: 'Khẩn cấp',
        color: 'purple',
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-700',
        icon: '🟣'
    }
};

// Form Steps for Multi-step Form
export const FORM_STEPS = {
    BASIC_INFO: 1,
    DETAILS: 2,
    REVIEW: 3
};

export const FORM_STEPS_CONFIG = {
    [FORM_STEPS.BASIC_INFO]: {
        title: 'Thông tin cơ bản',
        description: 'Nhập tiêu đề và mô tả task'
    },
    [FORM_STEPS.DETAILS]: {
        title: 'Chi tiết task',
        description: 'Thiết lập trạng thái, độ ưu tiên và ngày hạn'
    },
    [FORM_STEPS.REVIEW]: {
        title: 'Xem lại thông tin',
        description: 'Kiểm tra và xác nhận thông tin task'
    }
};

// Chart Colors
export const CHART_COLORS = {
    [TASK_STATUS.TODO]: '#FEF3C7',
    [TASK_STATUS.IN_PROGRESS]: '#DBEAFE',
    [TASK_STATUS.COMPLETED]: '#D1FAE5'
};

// Export Formats
export const EXPORT_FORMATS = {
    CSV: 'csv',
    JSON: 'json',
    PDF: 'pdf'
};

// Local Storage Keys
export const STORAGE_KEYS = {
    DRAFT_TASK: 'draftTask',
    DASHBOARD_SETTINGS: 'dashboardSettings',
    USER_PREFERENCES: 'userPreferences',
    ACCESS_TOKEN: 'accessToken',
    REFRESH_TOKEN: 'refreshToken'
};

// API Endpoints
export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        LOGOUT: '/auth/logout',
        ME: '/auth/me',
        REFRESH: '/auth/refresh',
        CHANGE_PASSWORD: '/auth/change-password'
    },
    USERS: {
        LIST: '/users',
        CREATE: '/users',
        UPDATE: (id) => `/users/${id}`,
        DELETE: (id) => `/users/${id}`,
        TOGGLE_STATUS: (id) => `/users/${id}/status`,
        RESET_PASSWORD: (id) => `/users/${id}/reset-password`
    },
    TASKS: {
        LIST: '/tasks',
        CREATE: '/tasks',
        UPDATE: (id) => `/tasks/${id}`,
        DELETE: (id) => `/tasks/${id}`,
        BY_STATUS: (status) => `/tasks?status=${status}`,
        BY_USER: (userId) => `/tasks?userId=${userId}`
    }
};

// User Roles - ĐỒNG BỘ VỚI BACKEND
export const USER_ROLES = {
    ADMIN: 'admin',
    DIRECTOR: 'director',
    MANAGER: 'manager',
    EMPLOYEE: 'employee'
};

export const USER_ROLE_CONFIG = {
    [USER_ROLES.ADMIN]: {
        label: 'Quản trị viên',
        level: 1,
        color: 'purple',
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-800'
    },
    [USER_ROLES.DIRECTOR]: {
        label: 'Giám đốc',
        level: 2,
        color: 'red',
        bgColor: 'bg-red-100',
        textColor: 'text-red-800'
    },
    [USER_ROLES.MANAGER]: {
        label: 'Trưởng phòng',
        level: 3,
        color: 'blue',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800'
    },
    [USER_ROLES.EMPLOYEE]: {
        label: 'Nhân viên',
        level: 4,
        color: 'green',
        bgColor: 'bg-green-100',
        textColor: 'text-green-800'
    }
};

// Permissions
export const PERMISSIONS = {
    USERS_CREATE: 'users.create',
    USERS_READ: 'users.read',
    USERS_UPDATE: 'users.update',
    USERS_DELETE: 'users.delete',
    USERS_MANAGE: 'users.manage',
    USERS_DEACTIVATE: 'users.deactivate',

    TASKS_CREATE: 'tasks.create',
    TASKS_READ: 'tasks.read',
    TASKS_UPDATE: 'tasks.update',
    TASKS_DELETE: 'tasks.delete',
    TASKS_ASSIGN: 'tasks.assign',
    TASKS_VIEW_ALL: 'tasks.view_all',

    REPORTS_VIEW: 'reports.view',
    REPORTS_EXPORT: 'reports.export',
    REPORTS_ADVANCED: 'reports.advanced',

    SYSTEM_SETTINGS: 'system.settings',
    SYSTEM_LOGS: 'system.logs'
};

// HTTP Status Codes
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500
};

// Error Messages
export const ERROR_MESSAGES = {
    NETWORK_ERROR: 'Lỗi kết nối mạng. Vui lòng kiểm tra internet.',
    UNAUTHORIZED: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    FORBIDDEN: 'Bạn không có quyền thực hiện hành động này.',
    NOT_FOUND: 'Không tìm thấy dữ liệu.',
    SERVER_ERROR: 'Lỗi hệ thống. Vui lòng thử lại sau.',
    VALIDATION_ERROR: 'Dữ liệu không hợp lệ.'
};