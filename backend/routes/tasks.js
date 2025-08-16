const express = require('express');
const { body, param, query } = require('express-validator');
const {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    getTasksStats
} = require('../controllers/taskController');
const {
    authenticateToken,
    requirePermission,
    canAccessTask
} = require('../middleware/auth');

const router = express.Router();

// Validation rules
const createTaskValidation = [
    body('title')
        .trim()
        .isLength({ min: 3, max: 200 })
        .withMessage('Tiêu đề phải từ 3-200 ký tự'),

    body('description')
        .optional()
        .isLength({ max: 2000 })
        .withMessage('Mô tả không được vượt quá 2000 ký tự'),

    body('status')
        .optional()
        .isIn(['todo', 'in_progress', 'review', 'completed', 'cancelled'])
        .withMessage('Trạng thái không hợp lệ'),

    body('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'urgent'])
        .withMessage('Độ ưu tiên không hợp lệ'),

    body('startDate')
        .optional()
        .isISO8601()
        .withMessage('Ngày bắt đầu không hợp lệ'),

    body('dueDate')
        .optional()
        .isISO8601()
        .withMessage('Ngày hết hạn không hợp lệ'),

    body('estimatedHours')
        .optional()
        .isInt({ min: 1, max: 1000 })
        .withMessage('Số giờ ước tính phải từ 1-1000'),

    body('assignedTo')
        .optional()
        .isInt({ min: 1 })
        .withMessage('ID người được gán không hợp lệ'),

    body('categoryId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('ID danh mục không hợp lệ'),

    body('departmentId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('ID phòng ban không hợp lệ')
];

const updateTaskValidation = [
    body('title')
        .optional()
        .trim()
        .isLength({ min: 3, max: 200 })
        .withMessage('Tiêu đề phải từ 3-200 ký tự'),

    body('description')
        .optional()
        .isLength({ max: 2000 })
        .withMessage('Mô tả không được vượt quá 2000 ký tự'),

    body('status')
        .optional()
        .isIn(['todo', 'in_progress', 'review', 'completed', 'cancelled'])
        .withMessage('Trạng thái không hợp lệ'),

    body('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'urgent'])
        .withMessage('Độ ưu tiên không hợp lệ'),

    body('startDate')
        .optional()
        .isISO8601()
        .withMessage('Ngày bắt đầu không hợp lệ'),

    body('dueDate')
        .optional()
        .isISO8601()
        .withMessage('Ngày hết hạn không hợp lệ'),

    body('estimatedHours')
        .optional()
        .isInt({ min: 1, max: 1000 })
        .withMessage('Số giờ ước tính phải từ 1-1000'),

    body('actualHours')
        .optional()
        .isInt({ min: 1, max: 1000 })
        .withMessage('Số giờ thực tế phải từ 1-1000'),

    body('assignedTo')
        .optional()
        .isInt({ min: 1 })
        .withMessage('ID người được gán không hợp lệ'),

    body('categoryId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('ID danh mục không hợp lệ'),

    body('departmentId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('ID phòng ban không hợp lệ')
];

const updateStatusValidation = [
    body('status')
        .isIn(['todo', 'in_progress', 'review', 'completed', 'cancelled'])
        .withMessage('Trạng thái không hợp lệ')
];

const taskIdValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID nhiệm vụ không hợp lệ')
];

const queryValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Số trang phải lớn hơn 0'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Giới hạn phải từ 1-100'),

    query('status')
        .optional()
        .isIn(['todo', 'in_progress', 'review', 'completed', 'cancelled'])
        .withMessage('Trạng thái không hợp lệ'),

    query('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'urgent'])
        .withMessage('Độ ưu tiên không hợp lệ'),

    query('userId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('ID người dùng không hợp lệ')
];

// Routes

/**
 * @route   GET /api/tasks
 * @desc    Lấy danh sách nhiệm vụ (có phân quyền, phân trang, lọc)
 * @access  Private - Requires 'tasks.read' permission
 */
router.get('/',
    queryValidation,
    authenticateToken,
    requirePermission('tasks.read'),
    getTasks
);

/**
 * @route   GET /api/tasks/stats
 * @desc    Lấy thống kê nhiệm vụ
 * @access  Private - Requires 'tasks.read' permission
 */
router.get('/stats',
    authenticateToken,
    requirePermission('tasks.read'),
    getTasksStats
);

/**
 * @route   GET /api/tasks/:id
 * @desc    Lấy chi tiết một nhiệm vụ
 * @access  Private - Requires access to specific task
 */
router.get('/:id',
    taskIdValidation,
    authenticateToken,
    canAccessTask,
    getTaskById
);

/**
 * @route   POST /api/tasks
 * @desc    Tạo nhiệm vụ mới
 * @access  Private - Requires 'tasks.create' permission
 */
router.post('/',
    createTaskValidation,
    authenticateToken,
    requirePermission('tasks.create'),
    createTask
);

/**
 * @route   PUT /api/tasks/:id
 * @desc    Cập nhật nhiệm vụ
 * @access  Private - Requires 'tasks.update' permission and access to task
 */
router.put('/:id',
    taskIdValidation,
    updateTaskValidation,
    authenticateToken,
    requirePermission('tasks.update'),
    canAccessTask,
    updateTask
);

/**
 * @route   PATCH /api/tasks/:id/status
 * @desc    Cập nhật trạng thái nhiệm vụ (cho Kanban)
 * @access  Private - Requires 'tasks.update' permission and access to task
 */
router.patch('/:id/status',
    taskIdValidation,
    updateStatusValidation,
    authenticateToken,
    requirePermission('tasks.update'),
    canAccessTask,
    updateTaskStatus
);

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Xóa nhiệm vụ
 * @access  Private - Requires 'tasks.delete' permission and access to task
 */
router.delete('/:id',
    taskIdValidation,
    authenticateToken,
    requirePermission('tasks.delete'),
    canAccessTask,
    deleteTask
);

module.exports = router;