const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const { getAccessibleUsers } = require('../middleware/auth');

// Lấy danh sách người dùng (có phân quyền)
const getUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, roleId, departmentId, isActive } = req.query;
        const offset = (page - 1) * limit;
        const currentUser = req.user;

        // Xây dựng điều kiện WHERE dựa trên quyền hạn
        let whereConditions = [];
        let params = [];
        let paramIndex = 1;

        // Phân quyền xem user
        switch (currentUser.role_level) {
            case 1: // Admin - xem tất cả
                break;
            case 2: // Director - xem tất cả trừ admin khác
                whereConditions.push(`r.level >= 2`);
                break;
            case 3: // Manager - xem nhân viên trong phòng ban và dưới quyền
                whereConditions.push(`(u.department_id = $${paramIndex} AND r.level >= 3) OR u.manager_id = $${paramIndex + 1} OR u.id = $${paramIndex + 2}`);
                params.push(currentUser.department_id, currentUser.id, currentUser.id);
                paramIndex += 3;
                break;
            case 4: // Employee - xem chính mình và đồng nghiệp cùng phòng
                whereConditions.push(`(u.department_id = $${paramIndex} AND r.level = 4) OR u.id = $${paramIndex + 1}`);
                params.push(currentUser.department_id, currentUser.id);
                paramIndex += 2;
                break;
        }

        // Thêm các filter khác
        if (search) {
            whereConditions.push(`(u.full_name ILIKE $${paramIndex} OR u.username ILIKE $${paramIndex + 1} OR u.email ILIKE $${paramIndex + 2})`);
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
            paramIndex += 3;
        }

        if (roleId) {
            whereConditions.push(`u.role_id = $${paramIndex}`);
            params.push(roleId);
            paramIndex++;
        }

        if (departmentId && currentUser.role_level <= 2) { // Chỉ admin và director mới filter theo department khác
            whereConditions.push(`u.department_id = $${paramIndex}`);
            params.push(departmentId);
            paramIndex++;
        }

        if (isActive !== undefined) {
            whereConditions.push(`u.is_active = $${paramIndex}`);
            params.push(isActive === 'true');
            paramIndex++;
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        // Đếm tổng số users
        const countResult = await query(`
      SELECT COUNT(*) as total
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON u.department_id = d.id
      ${whereClause}
    `, params);

        // Lấy dữ liệu users với phân trang
        const usersResult = await query(`
      SELECT u.id, u.username, u.email, u.full_name, u.phone, u.is_active, u.is_verified, u.last_login, u.created_at,
             r.name as role_name, r.display_name as role_display_name, r.level as role_level,
             d.name as department_name,
             manager.full_name as manager_name,
             (SELECT COUNT(*) FROM users WHERE manager_id = u.id) as subordinates_count
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN users manager ON u.manager_id = manager.id
      ${whereClause}
      ORDER BY r.level, u.full_name
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, limit, offset]);

        const total = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(total / limit);

        res.json({
            users: usersResult.rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalUsers: total,
                limit: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            error: 'Failed to get users',
            message: 'Lỗi lấy danh sách người dùng'
        });
    }
};

// Lấy thông tin chi tiết một user
const getUserById = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);

        const userResult = await query(`
      SELECT u.id, u.username, u.email, u.full_name, u.phone, u.avatar_url, 
             u.is_active, u.is_verified, u.last_login, u.created_at, u.updated_at,
             u.role_id, u.department_id, u.manager_id,
             r.name as role_name, r.display_name as role_display_name, r.level as role_level,
             d.name as department_name,
             manager.full_name as manager_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN users manager ON u.manager_id = manager.id
      WHERE u.id = $1
    `, [userId]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                error: 'User not found',
                message: 'Không tìm thấy người dùng'
            });
        }

        const user = userResult.rows[0];

        // Lấy danh sách nhân viên dưới quyền (nếu có)
        const subordinatesResult = await query(`
      SELECT u.id, u.full_name, u.email, r.display_name as role_name, u.is_active
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.manager_id = $1
      ORDER BY u.full_name
    `, [userId]);

        user.subordinates = subordinatesResult.rows;

        // Lấy thống kê task (nếu user có quyền xem)
        if (req.user.role_level <= 3 || req.user.id === userId) {
            const taskStatsResult = await query(`
        SELECT 
          COUNT(*) as total_tasks,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tasks,
          COUNT(CASE WHEN due_date < CURRENT_DATE AND status != 'completed' THEN 1 END) as overdue_tasks
        FROM tasks 
        WHERE created_by = $1 OR assigned_to = $1
      `, [userId]);

            user.task_stats = taskStatsResult.rows[0];
        }

        res.json({ user });

    } catch (error) {
        console.error('Get user by ID error:', error);
        res.status(500).json({
            error: 'Failed to get user',
            message: 'Lỗi lấy thông tin người dùng'
        });
    }
};

// Tạo người dùng mới (chỉ admin và director)
const createUser = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                message: 'Dữ liệu không hợp lệ',
                details: errors.array()
            });
        }

        const { username, email, password, fullName, phone, roleId, departmentId, managerId } = req.body;
        const currentUser = req.user;

        // Kiểm tra quyền tạo user với role_level này
        const targetRoleResult = await query('SELECT level FROM roles WHERE id = $1', [roleId]);
        if (targetRoleResult.rows.length === 0) {
            return res.status(400).json({
                error: 'Invalid role',
                message: 'Vai trò không hợp lệ'
            });
        }

        const targetRoleLevel = targetRoleResult.rows[0].level;

        // Chỉ có thể tạo user có level thấp hơn hoặc bằng mình (trừ admin)
        if (currentUser.role_level > 1 && targetRoleLevel <= currentUser.role_level) {
            return res.status(403).json({
                error: 'Insufficient permissions',
                message: 'Bạn không có quyền tạo người dùng với vai trò này'
            });
        }

        // Kiểm tra username và email đã tồn tại
        const existingUser = await query(`
      SELECT id, username, email FROM users 
      WHERE username = $1 OR email = $2
    `, [username, email]);

        if (existingUser.rows.length > 0) {
            const existing = existingUser.rows[0];
            const field = existing.username === username ? 'Username' : 'Email';
            return res.status(409).json({
                error: 'User already exists',
                message: `${field} đã được sử dụng`
            });
        }

        // Hash password
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Tạo user mới
        const newUser = await transaction(async (client) => {
            const userResult = await client.query(`
        INSERT INTO users (
          username, email, password_hash, full_name, phone,
          role_id, department_id, manager_id, is_active, is_verified, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, true, $9)
        RETURNING id, username, email, full_name, phone, role_id, department_id, manager_id, created_at
      `, [username, email, passwordHash, fullName, phone, roleId, departmentId, managerId, currentUser.id]);

            const user = userResult.rows[0];

            // Log hoạt động
            await client.query(`
        INSERT INTO activity_logs (user_id, action, resource_type, resource_id, new_values)
        VALUES ($1, 'CREATE_USER', 'user', $2, $3)
      `, [currentUser.id, user.id, JSON.stringify({
                username, email, role_id: roleId, department_id: departmentId
            })]);

            return user;
        });

        // Lấy thông tin đầy đủ của user mới tạo
        const userInfoResult = await query(`
      SELECT u.id, u.username, u.email, u.full_name, u.phone, u.is_active, u.created_at,
             r.name as role_name, r.display_name as role_display_name,
             d.name as department_name,
             manager.full_name as manager_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN users manager ON u.manager_id = manager.id
      WHERE u.id = $1
    `, [newUser.id]);

        res.status(201).json({
            message: 'Tạo người dùng thành công',
            user: userInfoResult.rows[0]
        });

    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({
            error: 'Failed to create user',
            message: 'Lỗi tạo người dùng'
        });
    }
};

// Cập nhật thông tin người dùng
const updateUser = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                message: 'Dữ liệu không hợp lệ',
                details: errors.array()
            });
        }

        const userId = parseInt(req.params.id);
        const { fullName, phone, email, roleId, departmentId, managerId } = req.body;
        const currentUser = req.user;

        // Lấy thông tin user hiện tại
        const existingUserResult = await query(`
      SELECT u.*, r.level as current_role_level
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1
    `, [userId]);

        if (existingUserResult.rows.length === 0) {
            return res.status(404).json({
                error: 'User not found',
                message: 'Không tìm thấy người dùng'
            });
        }

        const existingUser = existingUserResult.rows[0];

        // Kiểm tra quyền cập nhật
        if (currentUser.role_level > 2 && currentUser.id !== userId) {
            // Manager chỉ có thể cập nhật nhân viên dưới quyền
            if (currentUser.role_level === 3) {
                const isSubordinate = await query(`
          SELECT id FROM users WHERE id = $1 AND manager_id = $2
        `, [userId, currentUser.id]);

                if (isSubordinate.rows.length === 0) {
                    return res.status(403).json({
                        error: 'Access denied',
                        message: 'Bạn không có quyền cập nhật người dùng này'
                    });
                }
            } else {
                return res.status(403).json({
                    error: 'Access denied',
                    message: 'Bạn không có quyền cập nhật người dùng này'
                });
            }
        }

        // Kiểm tra email trùng lặp (nếu có thay đổi email)
        if (email && email !== existingUser.email) {
            const emailCheck = await query(`
        SELECT id FROM users WHERE email = $1 AND id != $2
      `, [email, userId]);

            if (emailCheck.rows.length > 0) {
                return res.status(409).json({
                    error: 'Email already exists',
                    message: 'Email đã được sử dụng'
                });
            }
        }

        // Kiểm tra quyền thay đổi role (nếu có)
        if (roleId && roleId !== existingUser.role_id) {
            if (currentUser.role_level > 2) {
                return res.status(403).json({
                    error: 'Insufficient permissions',
                    message: 'Bạn không có quyền thay đổi vai trò người dùng'
                });
            }

            const newRoleResult = await query('SELECT level FROM roles WHERE id = $1', [roleId]);
            if (newRoleResult.rows.length === 0) {
                return res.status(400).json({
                    error: 'Invalid role',
                    message: 'Vai trò không hợp lệ'
                });
            }

            const newRoleLevel = newRoleResult.rows[0].level;

            // Chỉ admin mới có thể thay đổi role của admin khác
            if (existingUser.current_role_level === 1 && currentUser.role_level > 1) {
                return res.status(403).json({
                    error: 'Cannot modify admin user',
                    message: 'Không thể thay đổi vai trò của quản trị viên'
                });
            }

            // Không thể tạo admin mới nếu không phải admin
            if (newRoleLevel === 1 && currentUser.role_level > 1) {
                return res.status(403).json({
                    error: 'Cannot create admin',
                    message: 'Chỉ quản trị viên mới có thể tạo quản trị viên khác'
                });
            }
        }

        // Cập nhật user
        const updatedUser = await transaction(async (client) => {
            // Xây dựng query cập nhật động
            const updateFields = [];
            const updateValues = [];
            let paramIndex = 1;

            if (fullName !== undefined) {
                updateFields.push(`full_name = ${paramIndex++}`);
                updateValues.push(fullName);
            }
            if (phone !== undefined) {
                updateFields.push(`phone = ${paramIndex++}`);
                updateValues.push(phone);
            }
            if (email !== undefined) {
                updateFields.push(`email = ${paramIndex++}`);
                updateValues.push(email);
            }
            if (roleId !== undefined) {
                updateFields.push(`role_id = ${paramIndex++}`);
                updateValues.push(roleId);
            }
            if (departmentId !== undefined) {
                updateFields.push(`department_id = ${paramIndex++}`);
                updateValues.push(departmentId);
            }
            if (managerId !== undefined) {
                updateFields.push(`manager_id = ${paramIndex++}`);
                updateValues.push(managerId);
            }

            updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
            updateValues.push(userId);

            const updateQuery = `
        UPDATE users SET ${updateFields.join(', ')}
        WHERE id = ${paramIndex}
        RETURNING id, username, email, full_name, phone, role_id, department_id, manager_id, updated_at
      `;

            const result = await client.query(updateQuery, updateValues);

            // Log hoạt động
            await client.query(`
        INSERT INTO activity_logs (user_id, action, resource_type, resource_id, old_values, new_values)
        VALUES ($1, 'UPDATE_USER', 'user', $2, $3, $4)
      `, [
                currentUser.id,
                userId,
                JSON.stringify({
                    full_name: existingUser.full_name,
                    email: existingUser.email,
                    role_id: existingUser.role_id
                }),
                JSON.stringify({ fullName, email, roleId })
            ]);

            return result.rows[0];
        });

        // Lấy thông tin đầy đủ sau khi cập nhật
        const userInfoResult = await query(`
      SELECT u.id, u.username, u.email, u.full_name, u.phone, u.is_active, u.updated_at,
             r.name as role_name, r.display_name as role_display_name,
             d.name as department_name,
             manager.full_name as manager_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN users manager ON u.manager_id = manager.id
      WHERE u.id = $1
    `, [userId]);

        res.json({
            message: 'Cập nhật người dùng thành công',
            user: userInfoResult.rows[0]
        });

    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            error: 'Failed to update user',
            message: 'Lỗi cập nhật người dùng'
        });
    }
};

// Vô hiệu hóa/kích hoạt tài khoản
const toggleUserStatus = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { isActive } = req.body;
        const currentUser = req.user;

        // Lấy thông tin user cần thay đổi
        const targetUserResult = await query(`
      SELECT u.*, r.level as role_level
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1
    `, [userId]);

        if (targetUserResult.rows.length === 0) {
            return res.status(404).json({
                error: 'User not found',
                message: 'Không tìm thấy người dùng'
            });
        }

        const targetUser = targetUserResult.rows[0];

        // Kiểm tra quyền
        if (currentUser.role_level > 2) {
            return res.status(403).json({
                error: 'Insufficient permissions',
                message: 'Bạn không có quyền thay đổi trạng thái tài khoản'
            });
        }

        // Không thể vô hiệu hóa chính mình
        if (userId === currentUser.id) {
            return res.status(400).json({
                error: 'Cannot modify own account',
                message: 'Không thể thay đổi trạng thái tài khoản của chính mình'
            });
        }

        // Chỉ admin mới có thể vô hiệu hóa admin khác
        if (targetUser.role_level === 1 && currentUser.role_level > 1) {
            return res.status(403).json({
                error: 'Cannot modify admin account',
                message: 'Chỉ quản trị viên mới có thể thay đổi trạng thái tài khoản quản trị viên'
            });
        }

        // Cập nhật trạng thái
        await transaction(async (client) => {
            await client.query(`
        UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $2
      `, [isActive, userId]);

            // Nếu vô hiệu hóa, xóa tất cả sessions
            if (!isActive) {
                await client.query(`
          UPDATE user_sessions SET is_active = false WHERE user_id = $1
        `, [userId]);
            }

            // Log hoạt động
            await client.query(`
        INSERT INTO activity_logs (user_id, action, resource_type, resource_id, new_values)
        VALUES ($1, $2, 'user', $3, $4)
      `, [
                currentUser.id,
                isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
                userId,
                JSON.stringify({ is_active: isActive })
            ]);
        });

        res.json({
            message: isActive ? 'Kích hoạt tài khoản thành công' : 'Vô hiệu hóa tài khoản thành công'
        });

    } catch (error) {
        console.error('Toggle user status error:', error);
        res.status(500).json({
            error: 'Failed to change user status',
            message: 'Lỗi thay đổi trạng thái tài khoản'
        });
    }
};

// Xóa người dùng (soft delete)
const deleteUser = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const currentUser = req.user;

        // Chỉ admin mới có thể xóa user
        if (currentUser.role_level > 1) {
            return res.status(403).json({
                error: 'Insufficient permissions',
                message: 'Chỉ quản trị viên mới có quyền xóa tài khoản'
            });
        }

        // Không thể xóa chính mình
        if (userId === currentUser.id) {
            return res.status(400).json({
                error: 'Cannot delete own account',
                message: 'Không thể xóa tài khoản của chính mình'
            });
        }

        // Kiểm tra user có tồn tại không
        const userResult = await query('SELECT id, username FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({
                error: 'User not found',
                message: 'Không tìm thấy người dùng'
            });
        }

        // Kiểm tra user có task hoặc data quan trọng không
        const dependenciesResult = await query(`
      SELECT 
        (SELECT COUNT(*) FROM tasks WHERE created_by = $1) as created_tasks,
        (SELECT COUNT(*) FROM tasks WHERE assigned_to = $1) as assigned_tasks,
        (SELECT COUNT(*) FROM users WHERE manager_id = $1) as subordinates
    `, [userId]);

        const dependencies = dependenciesResult.rows[0];

        if (dependencies.created_tasks > 0 || dependencies.assigned_tasks > 0 || dependencies.subordinates > 0) {
            return res.status(400).json({
                error: 'User has dependencies',
                message: 'Không thể xóa người dùng vì còn dữ liệu liên quan (tasks, nhân viên dưới quyền)',
                dependencies: {
                    created_tasks: parseInt(dependencies.created_tasks),
                    assigned_tasks: parseInt(dependencies.assigned_tasks),
                    subordinates: parseInt(dependencies.subordinates)
                }
            });
        }

        // Thực hiện soft delete
        await transaction(async (client) => {
            // Đánh dấu user là đã xóa bằng cách thêm timestamp vào username và email
            const timestamp = Date.now();
            await client.query(`
        UPDATE users SET 
          username = username || '_deleted_' || $1,
          email = email || '_deleted_' || $2,
          is_active = false,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [timestamp, timestamp, userId]);

            // Xóa tất cả sessions
            await client.query(`
        DELETE FROM user_sessions WHERE user_id = $1
      `, [userId]);

            // Log hoạt động
            await client.query(`
        INSERT INTO activity_logs (user_id, action, resource_type, resource_id, new_values)
        VALUES ($1, 'DELETE_USER', 'user', $2, $3)
      `, [currentUser.id, userId, JSON.stringify({ deleted_at: new Date() })]);
        });

        res.json({ message: 'Xóa người dùng thành công' });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            error: 'Failed to delete user',
            message: 'Lỗi xóa người dùng'
        });
    }
};

// Reset mật khẩu người dùng (chỉ admin và director)
const resetUserPassword = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { newPassword } = req.body;
        const currentUser = req.user;

        // Kiểm tra quyền reset password
        if (currentUser.role_level > 2) {
            return res.status(403).json({
                error: 'Insufficient permissions',
                message: 'Bạn không có quyền reset mật khẩu'
            });
        }

        // Kiểm tra user tồn tại
        const userResult = await query(`
      SELECT u.*, r.level as role_level
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1
    `, [userId]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                error: 'User not found',
                message: 'Không tìm thấy người dùng'
            });
        }

        const targetUser = userResult.rows[0];

        // Chỉ admin mới có thể reset password của admin khác
        if (targetUser.role_level === 1 && currentUser.role_level > 1) {
            return res.status(403).json({
                error: 'Cannot reset admin password',
                message: 'Chỉ quản trị viên mới có thể reset mật khẩu của quản trị viên khác'
            });
        }

        // Hash password mới
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(newPassword, saltRounds);

        // Cập nhật password và xóa tất cả sessions
        await transaction(async (client) => {
            await client.query(`
        UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $2
      `, [passwordHash, userId]);

            // Xóa tất cả sessions để buộc đăng nhập lại
            await client.query(`
        UPDATE user_sessions SET is_active = false WHERE user_id = $1
      `, [userId]);

            // Log hoạt động
            await client.query(`
        INSERT INTO activity_logs (user_id, action, resource_type, resource_id)
        VALUES ($1, 'RESET_PASSWORD', 'user', $2)
      `, [currentUser.id, userId]);
        });

        res.json({ message: 'Reset mật khẩu thành công' });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            error: 'Failed to reset password',
            message: 'Lỗi reset mật khẩu'
        });
    }
};

module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    toggleUserStatus,
    deleteUser,
    resetUserPassword
};