const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');

// Helper function để tạo JWT tokens
const generateTokens = (userId) => {
    const accessToken = jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '1h' }
    );

    const refreshToken = jwt.sign(
        { userId },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
    );

    return { accessToken, refreshToken };
};

// Đăng ký người dùng mới
const register = async (req, res) => {
    try {
        // Kiểm tra validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                message: 'Dữ liệu không hợp lệ',
                details: errors.array()
            });
        }

        const { username, email, password, fullName, roleId, departmentId } = req.body;

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

        // Tạo user mới trong transaction
        const newUser = await transaction(async (client) => {
            // Tạo user
            const userResult = await client.query(`
        INSERT INTO users (
          username, email, password_hash, full_name, 
          role_id, department_id, is_active, is_verified
        ) VALUES ($1, $2, $3, $4, $5, $6, true, true)
        RETURNING id, username, email, full_name, role_id, department_id, created_at
      `, [username, email, passwordHash, fullName, roleId || 4, departmentId]);

            const user = userResult.rows[0];

            // Log hoạt động
            await client.query(`
        INSERT INTO activity_logs (user_id, action, resource_type, resource_id, new_values)
        VALUES ($1, 'REGISTER', 'user', $2, $3)
      `, [user.id, user.id, JSON.stringify({ username, email, role_id: roleId || 4 })]);

            return user;
        });

        // Tạo tokens
        const { accessToken, refreshToken } = generateTokens(newUser.id);

        // Lưu refresh token vào database
        await query(`
      INSERT INTO user_sessions (user_id, refresh_token, expires_at)
      VALUES ($1, $2, $3)
    `, [newUser.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]);

        // Lấy thông tin đầy đủ của user để trả về
        const userInfo = await query(`
      SELECT u.id, u.username, u.email, u.full_name, u.is_active,
             r.name as role_name, r.display_name as role_display_name, r.level as role_level,
             d.name as department_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = $1
    `, [newUser.id]);

        res.status(201).json({
            message: 'Đăng ký thành công',
            user: userInfo.rows[0],
            accessToken,
            refreshToken
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            error: 'Registration failed',
            message: 'Lỗi hệ thống, vui lòng thử lại sau'
        });
    }
};

// Đăng nhập
const login = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                message: 'Dữ liệu không hợp lệ',
                details: errors.array()
            });
        }

        const { username, password } = req.body;

        // Tìm user trong database
        const userResult = await query(`
      SELECT u.id, u.username, u.email, u.password_hash, u.full_name, u.is_active,
             r.name as role_name, r.display_name as role_display_name, r.level as role_level,
             d.name as department_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE (u.username = $1 OR u.email = $1) AND u.is_active = true
    `, [username]);

        if (userResult.rows.length === 0) {
            return res.status(401).json({
                error: 'Invalid credentials',
                message: 'Tên đăng nhập hoặc mật khẩu không đúng'
            });
        }

        const user = userResult.rows[0];

        // Kiểm tra password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({
                error: 'Invalid credentials',
                message: 'Tên đăng nhập hoặc mật khẩu không đúng'
            });
        }

        // Tạo tokens
        const { accessToken, refreshToken } = generateTokens(user.id);

        // Cập nhật last_login và lưu refresh token
        await transaction(async (client) => {
            // Cập nhật last_login
            await client.query(`
        UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1
      `, [user.id]);

            // Xóa refresh tokens cũ của user này
            await client.query(`
        DELETE FROM user_sessions WHERE user_id = $1 OR expires_at < CURRENT_TIMESTAMP
      `, [user.id]);

            // Lưu refresh token mới
            await client.query(`
        INSERT INTO user_sessions (user_id, refresh_token, expires_at)
        VALUES ($1, $2, $3)
      `, [user.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]);

            // Log hoạt động đăng nhập
            await client.query(`
        INSERT INTO activity_logs (user_id, action, resource_type, resource_id, ip_address, user_agent)
        VALUES ($1, 'LOGIN', 'user', $2, $3, $4)
      `, [user.id, user.id, req.ip, req.get('User-Agent')]);
        });

        // Loại bỏ password_hash trước khi trả về
        const { password_hash, ...userInfo } = user;

        res.json({
            message: 'Đăng nhập thành công',
            user: userInfo,
            accessToken,
            refreshToken
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Login failed',
            message: 'Lỗi hệ thống, vui lòng thử lại sau'
        });
    }
};

// Refresh token
const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({
                error: 'Refresh token required',
                message: 'Refresh token không được cung cấp'
            });
        }

        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        // Kiểm tra refresh token trong database
        const sessionResult = await query(`
      SELECT user_id FROM user_sessions 
      WHERE refresh_token = $1 AND expires_at > CURRENT_TIMESTAMP AND is_active = true
    `, [refreshToken]);

        if (sessionResult.rows.length === 0) {
            return res.status(403).json({
                error: 'Invalid refresh token',
                message: 'Refresh token không hợp lệ hoặc đã hết hạn'
            });
        }

        // Tạo access token mới
        const { accessToken: newAccessToken } = generateTokens(decoded.userId);

        res.json({
            accessToken: newAccessToken,
            message: 'Token đã được làm mới'
        });

    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(403).json({
                error: 'Invalid refresh token',
                message: 'Refresh token không hợp lệ'
            });
        }

        console.error('Refresh token error:', error);
        res.status(500).json({
            error: 'Token refresh failed',
            message: 'Lỗi làm mới token'
        });
    }
};

// Đăng xuất
const logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (refreshToken) {
            // Xóa refresh token khỏi database
            await query(`
        UPDATE user_sessions SET is_active = false 
        WHERE refresh_token = $1
      `, [refreshToken]);
        }

        // Log hoạt động đăng xuất
        if (req.user) {
            await query(`
        INSERT INTO activity_logs (user_id, action, resource_type, resource_id, ip_address)
        VALUES ($1, 'LOGOUT', 'user', $2, $3)
      `, [req.user.id, req.user.id, req.ip]);
        }

        res.json({ message: 'Đăng xuất thành công' });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            error: 'Logout failed',
            message: 'Lỗi đăng xuất'
        });
    }
};

// Lấy thông tin user hiện tại
const getCurrentUser = async (req, res) => {
    try {
        const userId = req.user.id;

        const userResult = await query(`
      SELECT u.id, u.username, u.email, u.full_name, u.phone, u.avatar_url, u.is_active, u.last_login,
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
                message: 'Không tìm thấy thông tin người dùng'
            });
        }

        // Lấy danh sách quyền của user
        const permissionsResult = await query(`
      SELECT p.name, p.description, p.resource, p.action
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = $1
    `, [req.user.role_id]);

        const user = userResult.rows[0];
        user.permissions = permissionsResult.rows;

        res.json({ user });

    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            error: 'Failed to get user info',
            message: 'Lỗi lấy thông tin người dùng'
        });
    }
};

// Đổi mật khẩu
const changePassword = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                message: 'Dữ liệu không hợp lệ',
                details: errors.array()
            });
        }

        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        // Lấy password hash hiện tại
        const userResult = await query(`
      SELECT password_hash FROM users WHERE id = $1
    `, [userId]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                error: 'User not found',
                message: 'Không tìm thấy người dùng'
            });
        }

        // Kiểm tra mật khẩu hiện tại
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                error: 'Invalid current password',
                message: 'Mật khẩu hiện tại không đúng'
            });
        }

        // Hash mật khẩu mới
        const saltRounds = 12;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

        // Cập nhật mật khẩu
        await transaction(async (client) => {
            await client.query(`
        UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $2
      `, [newPasswordHash, userId]);

            // Log hoạt động
            await client.query(`
        INSERT INTO activity_logs (user_id, action, resource_type, resource_id)
        VALUES ($1, 'CHANGE_PASSWORD', 'user', $2)
      `, [userId, userId]);

            // Vô hiệu hóa tất cả refresh tokens để buộc đăng nhập lại
            await client.query(`
        UPDATE user_sessions SET is_active = false WHERE user_id = $1
      `, [userId]);
        });

        res.json({ message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.' });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            error: 'Password change failed',
            message: 'Lỗi đổi mật khẩu'
        });
    }
};

module.exports = {
    register,
    login,
    refreshToken,
    logout,
    getCurrentUser,
    changePassword
};