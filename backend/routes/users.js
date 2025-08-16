const express = require('express');
const { body, param } = require('express-validator');
const { 
  getUsers, 
  getUserById, 
  createUser, 
  updateUser, 
  toggleUserStatus, 
  deleteUser, 
  resetUserPassword 
} = require('../controllers/userController');
const { 
  authenticateToken, 
  requirePermission, 
  requireLevel,
  canAccessUser 
} = require('../middleware/auth');

const router = express.Router();

// Validation rules
const createUserValidation = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username phải từ 3-50 ký tự')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username chỉ được chứa chữ cái, số và dấu gạch dưới'),
  
  body('email')
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Mật khẩu phải có ít nhất 8 ký tự')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Mật khẩu phải chứa ít nhất 1 chữ thường, 1 chữ hoa và 1 số'),
  
  body('fullName')
    .isLength({ min: 2, max: 100 })
    .withMessage('Họ tên phải từ 2-100 ký tự')
    .trim(),
  
  body('phone')
    .optional()
    .isMobilePhone('vi-VN')
    .withMessage('Số điện thoại không hợp lệ'),
  
  body('roleId')
    .isInt({ min: 1 })
    .withMessage('ID vai trò không hợp lệ'),
  
  body('departmentId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID phòng ban không hợp lệ'),
  
  body('managerId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID người quản lý không hợp lệ')
];

const updateUserValidation = [
  body('fullName')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Họ tên phải từ 2-100 ký tự')
    .trim(),
  
  body('phone')
    .optional()
    .isMobilePhone('vi-VN')
    .withMessage('Số điện thoại không hợp lệ'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),
  
  body('roleId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID vai trò không hợp lệ'),
  
  body('departmentId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID phòng ban không hợp lệ'),
  
  body('managerId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID người quản lý không hợp lệ')
];

const toggleStatusValidation = [
  body('isActive')
    .isBoolean()
    .withMessage('Trạng thái phải là true hoặc false')
];

const resetPasswordValidation = [
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Mật khẩu mới phải có ít nhất 8 ký tự')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Mật khẩu mới phải chứa ít nhất 1 chữ thường, 1 chữ hoa và 1 số')
];

const userIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID người dùng không hợp lệ')
];

// Routes

/**
 * @route   GET /api/users
 * @desc    Lấy danh sách người dùng (có phân quyền và phân trang)
 * @access  Private - Requires 'users.read' permission
 */
router.get('/', 
  authenticateToken, 
  requirePermission('users.read'), 
  getUsers
);

/**
 * @route   GET /api/users/:id
 * @desc    Lấy thông tin chi tiết một người dùng
 * @access  Private - Requires access to specific user
 */
router.get('/:id', 
  userIdValidation,
  authenticateToken, 
  canAccessUser, 
  getUserById
);

/**
 * @route   POST /api/users
 * @desc    Tạo người dùng mới
 * @access  Private - Requires 'users.create' permission and level <= 2
 */
router.post('/', 
  createUserValidation,
  authenticateToken, 
  requirePermission('users.create'),
  requireLevel(2), // Chỉ Admin và Director
  createUser
);

/**
 * @route   PUT /api/users/:id
 * @desc    Cập nhật thông tin người dùng
 * @access  Private - Requires 'users.update' permission and access to user
 */
router.put('/:id', 
  userIdValidation,
  updateUserValidation,
  authenticateToken, 
  requirePermission('users.update'),
  canAccessUser,
  updateUser
);

/**
 * @route   PATCH /api/users/:id/status
 * @desc    Kích hoạt/Vô hiệu hóa tài khoản người dùng
 * @access  Private - Requires 'users.deactivate' permission and level <= 2
 */
router.patch('/:id/status', 
  userIdValidation,
  toggleStatusValidation,
  authenticateToken, 
  requirePermission('users.deactivate'),
  requireLevel(2), // Chỉ Admin và Director
  toggleUserStatus
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Xóa người dùng (soft delete)
 * @access  Private - Requires 'users.delete' permission and level = 1 (Admin only)
 */
router.delete('/:id', 
  userIdValidation,
  authenticateToken, 
  requirePermission('users.delete'),
  requireLevel(1), // Chỉ Admin
  deleteUser
);

/**
 * @route   POST /api/users/:id/reset-password
 * @desc    Reset mật khẩu người dùng
 * @access  Private - Requires 'users.manage' permission and level <= 2
 */
router.post('/:id/reset-password', 
  userIdValidation,
  resetPasswordValidation,
  authenticateToken, 
  requirePermission('users.manage'),
  requireLevel(2), // Chỉ Admin và Director
  resetUserPassword
);

module.exports = router;