// API Service để kết nối với Backend mới
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Helper function để handle API responses
const handleResponse = async (response) => {
    console.log('API Response status:', response.status);
    console.log('API Response headers:', response.headers);

    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            // Nếu response không phải JSON
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.error('API Error:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('API Response data:', data);
    return data;
};

// Helper function để lấy token từ localStorage
const getAuthToken = () => {
    return localStorage.getItem('accessToken');
};

// Helper function để set headers với auth
const getAuthHeaders = () => {
    const token = getAuthToken();
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
};

// API functions
export const api = {
    // ===== AUTHENTICATION =====

    // Đăng nhập
    async login(credentials) {
        console.log('API login called with:', credentials);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
            });

            const data = await handleResponse(response);

            // Lưu tokens vào localStorage
            if (data.accessToken) {
                localStorage.setItem('accessToken', data.accessToken);
            }
            if (data.refreshToken) {
                localStorage.setItem('refreshToken', data.refreshToken);
            }

            console.log('Login successful, returning:', data);
            return data;
        } catch (error) {
            console.error('Error during login:', error);
            throw error;
        }
    },

    // Đăng ký
    async register(userData) {
        console.log('API register called with:', userData);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            const data = await handleResponse(response);

            // Lưu tokens vào localStorage nếu có
            if (data.accessToken) {
                localStorage.setItem('accessToken', data.accessToken);
            }
            if (data.refreshToken) {
                localStorage.setItem('refreshToken', data.refreshToken);
            }

            console.log('Register successful, returning:', data);
            return data;
        } catch (error) {
            console.error('Error during registration:', error);
            throw error;
        }
    },

    // Đăng xuất
    async logout() {
        try {
            const refreshToken = localStorage.getItem('refreshToken');

            const response = await fetch(`${API_BASE_URL}/auth/logout`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ refreshToken }),
            });

            // Luôn xóa tokens dù có lỗi hay không
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');

            if (response.ok) {
                const data = await response.json();
                return data;
            }

            return { message: 'Đăng xuất thành công' };
        } catch (error) {
            console.error('Error during logout:', error);
            // Vẫn xóa tokens dù có lỗi
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            throw error;
        }
    },

    // Lấy thông tin user hiện tại
    async getCurrentUser() {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/me`, {
                headers: getAuthHeaders(),
            });

            return await handleResponse(response);
        } catch (error) {
            console.error('Error getting current user:', error);
            throw error;
        }
    },

    // Refresh token
    async refreshToken() {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }

            const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken }),
            });

            const data = await handleResponse(response);

            if (data.accessToken) {
                localStorage.setItem('accessToken', data.accessToken);
            }

            return data;
        } catch (error) {
            console.error('Error refreshing token:', error);
            // Nếu refresh fail, xóa tokens và redirect về login
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            throw error;
        }
    },

    // Đổi mật khẩu
    async changePassword(passwordData) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(passwordData),
            });

            return await handleResponse(response);
        } catch (error) {
            console.error('Error changing password:', error);
            throw error;
        }
    },

    // ===== TASKS =====

    // Lấy tất cả tasks
    async getTasks(params = {}) {
        try {
            const queryParams = new URLSearchParams(params).toString();
            const url = `${API_BASE_URL}/tasks${queryParams ? `?${queryParams}` : ''}`;

            const response = await fetch(url, {
                headers: getAuthHeaders(),
            });

            return await handleResponse(response);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            throw error;
        }
    },

    // Lấy task theo ID
    async getTaskById(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
                headers: getAuthHeaders(),
            });

            return await handleResponse(response);
        } catch (error) {
            console.error('Error fetching task:', error);
            throw error;
        }
    },

    // Tạo task mới
    async createTask(taskData) {
        try {
            const response = await fetch(`${API_BASE_URL}/tasks`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(taskData),
            });

            return await handleResponse(response);
        } catch (error) {
            console.error('Error creating task:', error);
            throw error;
        }
    },

    // Cập nhật task
    async updateTask(id, taskData) {
        try {
            const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(taskData),
            });

            return await handleResponse(response);
        } catch (error) {
            console.error('Error updating task:', error);
            throw error;
        }
    },

    // Cập nhật status task (cho Kanban)
    async updateTaskStatus(id, status) {
        try {
            const response = await fetch(`${API_BASE_URL}/tasks/${id}/status`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify({ status }),
            });

            return await handleResponse(response);
        } catch (error) {
            console.error('Error updating task status:', error);
            throw error;
        }
    },

    // Xóa task
    async deleteTask(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });

            return await handleResponse(response);
        } catch (error) {
            console.error('Error deleting task:', error);
            throw error;
        }
    },

    // Lấy thống kê tasks
    async getTasksStats(params = {}) {
        try {
            const queryParams = new URLSearchParams(params).toString();
            const url = `${API_BASE_URL}/tasks/stats${queryParams ? `?${queryParams}` : ''}`;

            const response = await fetch(url, {
                headers: getAuthHeaders(),
            });

            return await handleResponse(response);
        } catch (error) {
            console.error('Error fetching tasks stats:', error);
            throw error;
        }
    },

    // ===== USER MANAGEMENT =====

    // Lấy danh sách users
    async getUsers(params = {}) {
        try {
            const queryParams = new URLSearchParams(params).toString();
            const url = `${API_BASE_URL}/users${queryParams ? `?${queryParams}` : ''}`;

            const response = await fetch(url, {
                headers: getAuthHeaders(),
            });

            return await handleResponse(response);
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    },

    // Lấy user theo ID
    async getUserById(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/users/${id}`, {
                headers: getAuthHeaders(),
            });

            return await handleResponse(response);
        } catch (error) {
            console.error('Error fetching user:', error);
            throw error;
        }
    },

    // Tạo user mới
    async createUser(userData) {
        try {
            const response = await fetch(`${API_BASE_URL}/users`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(userData),
            });

            return await handleResponse(response);
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    },

    // Cập nhật user
    async updateUser(id, userData) {
        try {
            const response = await fetch(`${API_BASE_URL}/users/${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(userData),
            });

            return await handleResponse(response);
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    },

    // Kích hoạt/vô hiệu hóa user
    async toggleUserStatus(id, isActive) {
        try {
            const response = await fetch(`${API_BASE_URL}/users/${id}/status`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify({ isActive }),
            });

            return await handleResponse(response);
        } catch (error) {
            console.error('Error toggling user status:', error);
            throw error;
        }
    },

    // Xóa user
    async deleteUser(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/users/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });

            return await handleResponse(response);
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    },

    // Reset password user
    async resetUserPassword(id, newPassword) {
        try {
            const response = await fetch(`${API_BASE_URL}/users/${id}/reset-password`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ newPassword }),
            });

            return await handleResponse(response);
        } catch (error) {
            console.error('Error resetting user password:', error);
            throw error;
        }
    }
};

// Interceptor để tự động refresh token khi expired
const originalFetch = window.fetch;
window.fetch = async function (...args) {
    let response = await originalFetch(...args);

    // Nếu response là 401 (Unauthorized) và có refresh token
    if (response.status === 401 && localStorage.getItem('refreshToken')) {
        console.log('Access token expired, attempting to refresh...');

        try {
            // Thử refresh token
            await api.refreshToken();

            // Retry request với token mới
            const newToken = localStorage.getItem('accessToken');
            if (newToken && args[1]?.headers?.Authorization) {
                args[1].headers.Authorization = `Bearer ${newToken}`;
                response = await originalFetch(...args);
            }
        } catch (refreshError) {
            // Nếu refresh fail, redirect về login
            console.error('Token refresh failed:', refreshError);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');

            // Only redirect if we're not already on login page
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
    }

    return response;
};