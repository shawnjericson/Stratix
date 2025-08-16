const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// Middleware xác thực JWT token
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                error: 'Access token required',
                message: 'Vui lòng đăng nhập để tiếp tục'
            });
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Lấy thông tin user từ database
        const userResult = await query(`
      SELECT u.*, r.name as role_name, r.level as role_level, d.name as department_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = $1 AND u.is_active = true
    `, [decoded.userId]);

        if (userResult.rows.length === 0) {
            return res.status(401).json({
                error: 'User not found or inactive',
                message: 'Tài khoản không tồn tại hoặc đã bị vô hiệu hóa'
            });
        }

        // Gắn thông tin user vào request
        req.user = userResult.rows[0];
        next();

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({
                error: 'Invalid token',
                message: 'Token không hợp lệ'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(403).json({
                error: 'Token expired',
                message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại'
            });
        }

        console.error('Auth middleware error:', error);
        res.status(500).json({
            error: 'Authentication failed',
            message: 'Lỗi xác thực người dùng'
        });
    }
};

// Middleware kiểm tra quyền hạn
const requirePermission = (permission) => {
    return async (req, res, next) => {
        try {
            const userId = req.user.id;
            const roleId = req.user.role_id;

            // Kiểm tra quyền của role
            const permissionResult = await query(`
        SELECT p.* FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = $1 AND p.name = $2
      `, [roleId, permission]);

            if (permissionResult.rows.length === 0) {
                return res.status(403).json({
                    error: 'Insufficient permissions',
                    message: 'Bạn không có quyền thực hiện hành động này',
                    required_permission: permission
                });
            }

            next();
        } catch (error) {
            console.error('Permission check error:', error);
            res.status(500).json({
                error: 'Permission check failed',
                message: 'Lỗi kiểm tra quyền hạn'
            });
        }
    };
};

// Middleware kiểm tra cấp độ quyền hạn (level-based authorization)
const requireLevel = (maxLevel) => {
    return (req, res, next) => {
        const userLevel = req.user.role_level;

        if (userLevel > maxLevel) {
            return res.status(403).json({
                error: 'Insufficient role level',
                message: 'Cấp độ quyền hạn không đủ để thực hiện hành động này',
                required_level: maxLevel,
                user_level: userLevel
            });
        }

        next();
    };
};

// Middleware kiểm tra quyền truy cập tài nguyên của user khác
const canAccessUser = async (req, res, next) => {
    try {
        const targetUserId = parseInt(req.params.userId || req.params.id);
        const currentUser = req.user;

        // Admin và Director có thể truy cập tất cả
        if (currentUser.role_level <= 2) {
            return next();
        }

        // User có thể truy cập chính mình
        if (currentUser.id === targetUserId) {
            return next();
        }

        // Manager có thể truy cập nhân viên dưới quyền
        if (currentUser.role_level === 3) {
            const subordinateResult = await query(`
        SELECT id FROM users 
        WHERE manager_id = $1 AND id = $2
      `, [currentUser.id, targetUserId]);

            if (subordinateResult.rows.length > 0) {
                return next();
            }
        }

        return res.status(403).json({
            error: 'Access denied',
            message: 'Bạn không có quyền truy cập thông tin người dùng này'
        });

    } catch (error) {
        console.error('User access check error:', error);
        res.status(500).json({
            error: 'Access check failed',
            message: 'Lỗi kiểm tra quyền truy cập'
        });
    }
};

// Middleware kiểm tra quyền truy cập task
const canAccessTask = async (req, res, next) => {
    try {
        const taskId = parseInt(req.params.taskId || req.params.id);
        const currentUser = req.user;

        // Lấy thông tin task
        const taskResult = await query(`
      SELECT t.*, u1.department_id as creator_dept, u2.department_id as assignee_dept
      FROM tasks t
      LEFT JOIN users u1 ON t.created_by = u1.id
      LEFT JOIN users u2 ON t.assigned_to = u2.id
      WHERE t.id = $1
    `, [taskId]);

        if (taskResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Task not found',
                message: 'Không tìm thấy nhiệm vụ'
            });
        }

        const task = taskResult.rows[0];

        // Admin và Director có thể truy cập tất cả
        if (currentUser.role_level <= 2) {
            return next();
        }

        // Creator và assignee có thể truy cập task
        if (task.created_by === currentUser.id || task.assigned_to === currentUser.id) {
            return next();
        }

        // Manager có thể truy cập task trong phòng ban hoặc của nhân viên dưới quyền
        if (currentUser.role_level === 3) {
            if (task.department_id === currentUser.department_id ||
                task.creator_dept === currentUser.department_id ||
                task.assignee_dept === currentUser.department_id) {
                return next();
            }

            // Kiểm tra xem creator hoặc assignee có phải là nhân viên dưới quyền không
            const subordinateResult = await query(`
        SELECT id FROM users 
        WHERE manager_id = $1 AND (id = $2 OR id = $3)
      `, [currentUser.id, task.created_by, task.assigned_to]);

            if (subordinateResult.rows.length > 0) {
                return next();
            }
        }

        return res.status(403).json({
            error: 'Access denied',
            message: 'Bạn không có quyền truy cập nhiệm vụ này'
        });

    } catch (error) {
        console.error('Task access check error:', error);
        res.status(500).json({
            error: 'Access check failed',
            message: 'Lỗi kiểm tra quyền truy cập nhiệm vụ'
        });
    }
};

// Middleware kiểm tra quyền xem dữ liệu của phòng ban
const canAccessDepartment = async (req, res, next) => {
    try {
        const targetDepartmentId = parseInt(req.params.departmentId);
        const currentUser = req.user;

        // Admin và Director có thể truy cập tất cả phòng ban
        if (currentUser.role_level <= 2) {
            return next();
        }

        // Manager chỉ có thể truy cập phòng ban của mình
        if (currentUser.role_level === 3) {
            if (currentUser.department_id === targetDepartmentId) {
                return next();
            }
        }

        // Employee không thể truy cập dữ liệu cấp phòng ban
        return res.status(403).json({
            error: 'Access denied',
            message: 'Bạn không có quyền truy cập dữ liệu phòng ban này'
        });

    } catch (error) {
        console.error('Department access check error:', error);
        res.status(500).json({
            error: 'Access check failed',
            message: 'Lỗi kiểm tra quyền truy cập phòng ban'
        });
    }
};

// Utility function để lấy danh sách user mà current user có thể quản lý
const getAccessibleUsers = async (currentUser) => {
    try {
        let whereClause = '';
        let params = [];

        switch (currentUser.role_level) {
            case 1: // Admin - có thể xem tất cả
                whereClause = 'WHERE 1=1';
                break;

            case 2: // Director - có thể xem tất cả trừ admin khác
                whereClause = 'WHERE r.level >= 2';
                break;

            case 3: // Manager - chỉ xem nhân viên trong phòng ban và dưới quyền
                whereClause = `WHERE (u.department_id = $1 AND r.level >= 3) OR u.manager_id = $2 OR u.id = $3`;
                params = [currentUser.department_id, currentUser.id, currentUser.id];
                break;

            case 4: // Employee - chỉ xem chính mình và đồng nghiệp cùng phòng
                whereClause = `WHERE u.department_id = $1 AND r.level = 4 OR u.id = $2`;
                params = [currentUser.department_id, currentUser.id];
                break;

            default:
                whereClause = 'WHERE u.id = $1';
                params = [currentUser.id];
        }

        const result = await query(`
      SELECT u.id, u.username, u.email, u.full_name, u.is_active,
             r.name as role_name, r.display_name as role_display_name,
             d.name as department_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON u.department_id = d.id
      ${whereClause}
      ORDER BY r.level, u.full_name
    `, params);

        return result.rows;
    } catch (error) {
        console.error('Error getting accessible users:', error);
        throw error;
    }
};

// Utility function để lấy danh sách task mà current user có thể truy cập
const getAccessibleTasks = async (currentUser, filters = {}) => {
    try {
        let whereClause = '';
        let params = [];
        let paramIndex = 1;

        switch (currentUser.role_level) {
            case 1: // Admin
            case 2: // Director - có thể xem tất cả task
                whereClause = 'WHERE 1=1';
                break;

            case 3: // Manager - xem task trong phòng ban và của nhân viên dưới quyền
                whereClause = `WHERE (
          t.department_id = ${paramIndex} OR 
          t.created_by = ${paramIndex + 1} OR 
          t.assigned_to = ${paramIndex + 2} OR
          t.created_by IN (SELECT id FROM users WHERE manager_id = ${paramIndex + 3}) OR
          t.assigned_to IN (SELECT id FROM users WHERE manager_id = ${paramIndex + 4})
        )`;
                params = [
                    currentUser.department_id,
                    currentUser.id,
                    currentUser.id,
                    currentUser.id,
                    currentUser.id
                ];
                paramIndex += 5;
                break;

            case 4: // Employee - chỉ xem task của mình và task được gán
                whereClause = `WHERE (t.created_by = ${paramIndex} OR t.assigned_to = ${paramIndex + 1})`;
                params = [currentUser.id, currentUser.id];
                paramIndex += 2;
                break;
        }

        // Thêm filters bổ sung
        if (filters.status) {
            whereClause += ` AND t.status = ${paramIndex}`;
            params.push(filters.status);
            paramIndex++;
        }

        if (filters.priority) {
            whereClause += ` AND t.priority = ${paramIndex}`;
            params.push(filters.priority);
            paramIndex++;
        }

        if (filters.departmentId && currentUser.role_level <= 2) {
            whereClause += ` AND t.department_id = ${paramIndex}`;
            params.push(filters.departmentId);
            paramIndex++;
        }

        const result = await query(`
      SELECT t.*, 
             creator.full_name as creator_name,
             assignee.full_name as assignee_name,
             c.name as category_name,
             d.name as department_name
      FROM tasks t
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN departments d ON t.department_id = d.id
      ${whereClause}
      ORDER BY t.created_at DESC
    `, params);

        return result.rows;
    } catch (error) {
        console.error('Error getting accessible tasks:', error);
        throw error;
    }
};

module.exports = {
    authenticateToken,
    requirePermission,
    requireLevel,
    canAccessUser,
    canAccessTask,
    canAccessDepartment,
    getAccessibleUsers,
    getAccessibleTasks
};