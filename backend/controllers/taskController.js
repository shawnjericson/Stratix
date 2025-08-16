const { validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const { getAccessibleTasks } = require('../middleware/auth');

// Lấy danh sách tasks (có phân quyền)
const getTasks = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, priority, search, userId } = req.query;
        const offset = (page - 1) * limit;
        const currentUser = req.user;

        // Xây dựng filters
        const filters = {
            ...(status && { status }),
            ...(priority && { priority }),
            ...(search && { search }),
            ...(userId && { userId })
        };

        // Lấy tasks có phân quyền
        const tasks = await getAccessibleTasks(currentUser, filters);

        // Phân trang
        const startIndex = offset;
        const endIndex = startIndex + parseInt(limit);
        const paginatedTasks = tasks.slice(startIndex, endIndex);

        res.json({
            tasks: paginatedTasks,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(tasks.length / limit),
                totalTasks: tasks.length,
                limit: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({
            error: 'Failed to get tasks',
            message: 'Lỗi lấy danh sách nhiệm vụ'
        });
    }
};

// Lấy task theo ID
const getTaskById = async (req, res) => {
    try {
        const taskId = parseInt(req.params.id);

        const taskResult = await query(`
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
      WHERE t.id = $1
    `, [taskId]);

        if (taskResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Task not found',
                message: 'Không tìm thấy nhiệm vụ'
            });
        }

        res.json({ task: taskResult.rows[0] });

    } catch (error) {
        console.error('Get task by ID error:', error);
        res.status(500).json({
            error: 'Failed to get task',
            message: 'Lỗi lấy thông tin nhiệm vụ'
        });
    }
};

// Tạo task mới
const createTask = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                message: 'Dữ liệu không hợp lệ',
                details: errors.array()
            });
        }

        const {
            title,
            description,
            status,
            priority,
            startDate,
            dueDate,
            estimatedHours,
            assignedTo,
            categoryId,
            departmentId
        } = req.body;

        const currentUser = req.user;

        // Validation business logic
        if (dueDate) {
            const dueDateObj = new Date(dueDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (dueDateObj < today) {
                return res.status(400).json({
                    error: 'Invalid due date',
                    message: 'Ngày hết hạn không thể là ngày trong quá khứ'
                });
            }
        }

        if (startDate && dueDate) {
            if (new Date(startDate) > new Date(dueDate)) {
                return res.status(400).json({
                    error: 'Invalid date range',
                    message: 'Ngày bắt đầu không thể sau ngày kết thúc'
                });
            }
        }

        // Kiểm tra quyền assign cho người khác
        if (assignedTo && assignedTo !== currentUser.id) {
            // Kiểm tra permission tasks.assign
            const hasAssignPermission = await query(`
        SELECT p.* FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = $1 AND p.name = 'tasks.assign'
      `, [currentUser.role_id]);

            if (hasAssignPermission.rows.length === 0) {
                return res.status(403).json({
                    error: 'Insufficient permissions',
                    message: 'Bạn không có quyền gán nhiệm vụ cho người khác'
                });
            }

            // Kiểm tra assignee có tồn tại và active không
            const assigneeResult = await query(`
        SELECT id, full_name, is_active FROM users WHERE id = $1
      `, [assignedTo]);

            if (assigneeResult.rows.length === 0) {
                return res.status(400).json({
                    error: 'Invalid assignee',
                    message: 'Người được gán không tồn tại'
                });
            }

            if (!assigneeResult.rows[0].is_active) {
                return res.status(400).json({
                    error: 'Inactive assignee',
                    message: 'Không thể gán nhiệm vụ cho tài khoản đã bị vô hiệu hóa'
                });
            }
        }

        // Tạo task mới
        const newTask = await transaction(async (client) => {
            const taskResult = await client.query(`
        INSERT INTO tasks (
          title, description, status, priority, start_date, due_date, 
          estimated_hours, created_by, assigned_to, category_id, department_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id, title, description, status, priority, start_date, due_date, 
                  estimated_hours, created_by, assigned_to, category_id, department_id, 
                  created_at, updated_at
      `, [
                title,
                description || null,
                status || 'todo',
                priority || 'medium',
                startDate || null,
                dueDate || null,
                estimatedHours || null,
                currentUser.id,
                assignedTo || currentUser.id,
                categoryId || null,
                departmentId || currentUser.department_id
            ]);

            const task = taskResult.rows[0];

            // Log hoạt động
            await client.query(`
        INSERT INTO activity_logs (user_id, action, resource_type, resource_id, new_values)
        VALUES ($1, 'CREATE_TASK', 'task', $2, $3)
      `, [
                currentUser.id,
                task.id,
                JSON.stringify({
                    title: task.title,
                    status: task.status,
                    priority: task.priority,
                    assigned_to: task.assigned_to
                })
            ]);

            return task;
        });

        // Lấy thông tin đầy đủ của task vừa tạo
        const fullTaskResult = await query(`
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
      WHERE t.id = $1
    `, [newTask.id]);

        res.status(201).json({
            message: 'Tạo nhiệm vụ thành công',
            task: fullTaskResult.rows[0]
        });

    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({
            error: 'Failed to create task',
            message: 'Lỗi tạo nhiệm vụ'
        });
    }
};

// Cập nhật task
const updateTask = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                message: 'Dữ liệu không hợp lệ',
                details: errors.array()
            });
        }

        const taskId = parseInt(req.params.id);
        const {
            title,
            description,
            status,
            priority,
            startDate,
            dueDate,
            estimatedHours,
            actualHours,
            assignedTo,
            categoryId,
            departmentId
        } = req.body;

        const currentUser = req.user;

        // Lấy task hiện tại
        const existingTaskResult = await query(`
      SELECT t.*, creator.department_id as creator_dept, assignee.department_id as assignee_dept
      FROM tasks t
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      WHERE t.id = $1
    `, [taskId]);

        if (existingTaskResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Task not found',
                message: 'Không tìm thấy nhiệm vụ'
            });
        }

        const existingTask = existingTaskResult.rows[0];

        // Validation dates
        if (dueDate) {
            const dueDateObj = new Date(dueDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (dueDateObj < today && existingTask.status !== 'completed') {
                return res.status(400).json({
                    error: 'Invalid due date',
                    message: 'Ngày hết hạn không thể là ngày trong quá khứ'
                });
            }
        }

        if (startDate && dueDate) {
            if (new Date(startDate) > new Date(dueDate)) {
                return res.status(400).json({
                    error: 'Invalid date range',
                    message: 'Ngày bắt đầu không thể sau ngày kết thúc'
                });
            }
        }

        // Kiểm tra quyền cập nhật assignee
        if (assignedTo && assignedTo !== existingTask.assigned_to) {
            const hasAssignPermission = await query(`
        SELECT p.* FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = $1 AND p.name = 'tasks.assign'
      `, [currentUser.role_id]);

            if (hasAssignPermission.rows.length === 0) {
                return res.status(403).json({
                    error: 'Insufficient permissions',
                    message: 'Bạn không có quyền thay đổi người được gán'
                });
            }
        }

        // Cập nhật task
        const updatedTask = await transaction(async (client) => {
            // Xây dựng query cập nhật động
            const updateFields = [];
            const updateValues = [];
            let paramIndex = 1;

            if (title !== undefined) {
                updateFields.push(`title = ${paramIndex++}`);
                updateValues.push(title);
            }
            if (description !== undefined) {
                updateFields.push(`description = ${paramIndex++}`);
                updateValues.push(description);
            }
            if (status !== undefined) {
                updateFields.push(`status = ${paramIndex++}`);
                updateValues.push(status);

                // Nếu status là completed, set completed_at
                if (status === 'completed' && existingTask.status !== 'completed') {
                    updateFields.push(`completed_at = CURRENT_TIMESTAMP`);
                } else if (status !== 'completed' && existingTask.status === 'completed') {
                    updateFields.push(`completed_at = NULL`);
                }
            }
            if (priority !== undefined) {
                updateFields.push(`priority = ${paramIndex++}`);
                updateValues.push(priority);
            }
            if (startDate !== undefined) {
                updateFields.push(`start_date = ${paramIndex++}`);
                updateValues.push(startDate);
            }
            if (dueDate !== undefined) {
                updateFields.push(`due_date = ${paramIndex++}`);
                updateValues.push(dueDate);
            }
            if (estimatedHours !== undefined) {
                updateFields.push(`estimated_hours = ${paramIndex++}`);
                updateValues.push(estimatedHours);
            }
            if (actualHours !== undefined) {
                updateFields.push(`actual_hours = ${paramIndex++}`);
                updateValues.push(actualHours);
            }
            if (assignedTo !== undefined) {
                updateFields.push(`assigned_to = ${paramIndex++}`);
                updateValues.push(assignedTo);
            }
            if (categoryId !== undefined) {
                updateFields.push(`category_id = ${paramIndex++}`);
                updateValues.push(categoryId);
            }
            if (departmentId !== undefined) {
                updateFields.push(`department_id = ${paramIndex++}`);
                updateValues.push(departmentId);
            }

            if (updateFields.length === 0) {
                throw new Error('No fields to update');
            }

            updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
            updateValues.push(taskId);

            const updateQuery = `
        UPDATE tasks SET ${updateFields.join(', ')}
        WHERE id = ${paramIndex}
        RETURNING id, title, description, status, priority, start_date, due_date, 
                  estimated_hours, actual_hours, created_by, assigned_to, category_id, 
                  department_id, completed_at, created_at, updated_at
      `;

            const result = await client.query(updateQuery, updateValues);

            // Log hoạt động
            await client.query(`
        INSERT INTO activity_logs (user_id, action, resource_type, resource_id, old_values, new_values)
        VALUES ($1, 'UPDATE_TASK', 'task', $2, $3, $4)
      `, [
                currentUser.id,
                taskId,
                JSON.stringify({
                    title: existingTask.title,
                    status: existingTask.status,
                    priority: existingTask.priority
                }),
                JSON.stringify({ title, status, priority })
            ]);

            return result.rows[0];
        });

        // Lấy thông tin đầy đủ sau khi cập nhật
        const fullTaskResult = await query(`
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
      WHERE t.id = $1
    `, [taskId]);

        res.json({
            message: 'Cập nhật nhiệm vụ thành công',
            task: fullTaskResult.rows[0]
        });

    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({
            error: 'Failed to update task',
            message: 'Lỗi cập nhật nhiệm vụ'
        });
    }
};

// Xóa task
const deleteTask = async (req, res) => {
    try {
        const taskId = parseInt(req.params.id);
        const currentUser = req.user;

        // Kiểm tra task có tồn tại không
        const taskResult = await query('SELECT id, title, created_by FROM tasks WHERE id = $1', [taskId]);
        if (taskResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Task not found',
                message: 'Không tìm thấy nhiệm vụ'
            });
        }

        const task = taskResult.rows[0];

        // Xóa task
        await transaction(async (client) => {
            await client.query('DELETE FROM tasks WHERE id = $1', [taskId]);

            // Log hoạt động
            await client.query(`
        INSERT INTO activity_logs (user_id, action, resource_type, resource_id, old_values)
        VALUES ($1, 'DELETE_TASK', 'task', $2, $3)
      `, [
                currentUser.id,
                taskId,
                JSON.stringify({ title: task.title, created_by: task.created_by })
            ]);
        });

        res.json({ message: 'Xóa nhiệm vụ thành công' });

    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({
            error: 'Failed to delete task',
            message: 'Lỗi xóa nhiệm vụ'
        });
    }
};

// Cập nhật status của task (cho Kanban)
const updateTaskStatus = async (req, res) => {
    try {
        const taskId = parseInt(req.params.id);
        const { status } = req.body;
        const currentUser = req.user;

        // Validate status
        const validStatuses = ['todo', 'in_progress', 'review', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                error: 'Invalid status',
                message: 'Trạng thái không hợp lệ'
            });
        }

        // Lấy task hiện tại
        const taskResult = await query('SELECT * FROM tasks WHERE id = $1', [taskId]);
        if (taskResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Task not found',
                message: 'Không tìm thấy nhiệm vụ'
            });
        }

        const task = taskResult.rows[0];

        // Cập nhật status
        const updatedTask = await transaction(async (client) => {
            const updateQuery = status === 'completed'
                ? 'UPDATE tasks SET status = $1, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *'
                : 'UPDATE tasks SET status = $1, completed_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *';

            const result = await client.query(updateQuery, [status, taskId]);

            // Log hoạt động
            await client.query(`
        INSERT INTO activity_logs (user_id, action, resource_type, resource_id, old_values, new_values)
        VALUES ($1, 'UPDATE_TASK_STATUS', 'task', $2, $3, $4)
      `, [
                currentUser.id,
                taskId,
                JSON.stringify({ status: task.status }),
                JSON.stringify({ status })
            ]);

            return result.rows[0];
        });

        res.json({
            message: 'Cập nhật trạng thái thành công',
            task: updatedTask
        });

    } catch (error) {
        console.error('Update task status error:', error);
        res.status(500).json({
            error: 'Failed to update task status',
            message: 'Lỗi cập nhật trạng thái nhiệm vụ'
        });
    }
};

// Lấy thống kê tasks
const getTasksStats = async (req, res) => {
    try {
        const currentUser = req.user;
        const { userId, departmentId } = req.query;

        // Xây dựng điều kiện WHERE dựa trên quyền hạn
        let whereClause = 'WHERE 1=1';
        let params = [];
        let paramIndex = 1;

        // Phân quyền xem thống kê
        switch (currentUser.role_level) {
            case 1: // Admin - xem tất cả
            case 2: // Director - xem tất cả
                if (userId) {
                    whereClause += ` AND (t.created_by = ${paramIndex} OR t.assigned_to = ${paramIndex})`;
                    params.push(userId);
                    paramIndex++;
                }
                if (departmentId) {
                    whereClause += ` AND t.department_id = ${paramIndex}`;
                    params.push(departmentId);
                    paramIndex++;
                }
                break;

            case 3: // Manager - xem phòng ban và nhân viên dưới quyền
                whereClause += ` AND (t.department_id = ${paramIndex} OR t.created_by = ${paramIndex + 1} OR t.assigned_to = ${paramIndex + 2})`;
                params.push(currentUser.department_id, currentUser.id, currentUser.id);
                paramIndex += 3;
                break;

            case 4: // Employee - chỉ xem task của mình
                whereClause += ` AND (t.created_by = ${paramIndex} OR t.assigned_to = ${paramIndex + 1})`;
                params.push(currentUser.id, currentUser.id);
                paramIndex += 2;
                break;
        }

        const statsResult = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'todo' THEN 1 END) as todo,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'review' THEN 1 END) as review,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
        COUNT(CASE WHEN priority = 'low' THEN 1 END) as low_priority,
        COUNT(CASE WHEN priority = 'medium' THEN 1 END) as medium_priority,
        COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority,
        COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_priority,
        COUNT(CASE WHEN due_date < CURRENT_DATE AND status != 'completed' THEN 1 END) as overdue,
        COUNT(CASE WHEN due_date = CURRENT_DATE AND status != 'completed' THEN 1 END) as due_today
      FROM tasks t
      ${whereClause}
    `, params);

        const stats = statsResult.rows[0];

        // Convert strings to numbers
        Object.keys(stats).forEach(key => {
            stats[key] = parseInt(stats[key]) || 0;
        });

        res.json({ stats });

    } catch (error) {
        console.error('Get tasks stats error:', error);
        res.status(500).json({
            error: 'Failed to get tasks stats',
            message: 'Lỗi lấy thống kê nhiệm vụ'
        });
    }
};

module.exports = {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    getTasksStats
};