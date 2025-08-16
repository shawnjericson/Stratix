import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Import AuthContext
import { AuthProvider, useAuth } from './components/contexts/AuthContext';

// Import components
import ModernNavbar from './components/Auth/Navbar';
import Homepage from './pages/HomePage';
import LoginPage from './components/Auth/LoginPage';
import RegisterPage from './components/Auth/RegisterPage';
import Dashboard from './pages/DashBoard';

// Import updated constants
import { USER_ROLES, PERMISSIONS } from './components/constants/TaskConstants';

// Loading screen component
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fdfbf7] to-[#f8f6f0]" style={{ fontFamily: 'Inter, sans-serif' }}>
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#FFD35B] border-t-transparent mx-auto mb-4 shadow-[0_8px_24px_rgba(255,211,91,0.3)]"></div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">Stratix</h2>
      <p className="text-gray-600">Đang khởi động ứng dụng...</p>
    </div>
  </div>
);

// Protected route wrapper
const ProtectedRoute = React.memo(({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
});

// Public route wrapper (redirect if logged in)
const PublicRoute = React.memo(({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
});

// Admin route wrapper
const AdminRoute = React.memo(({ children }) => {
  const { isAuthenticated, isLoading, hasLevel } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasLevel(2)) { // Chỉ Admin và Director
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fdfbf7] to-[#f8f6f0]" style={{ fontFamily: 'Inter, sans-serif' }}>
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-[inset_0_2px_8px_rgba(239,68,68,0.1)]">
            <span className="text-2xl">🔒</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Không có quyền truy cập</h2>
          <p className="text-gray-600 mb-6">
            Tính năng này chỉ dành cho Admin và Director.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-gradient-to-r from-[#FFD35B] to-[#F59E0B] text-white rounded-2xl hover:from-[#F59E0B] hover:to-[#FFD35B] transition-all duration-300 font-semibold shadow-[0_8px_24px_rgba(255,211,91,0.3)] hover:scale-105"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return children;
});

// Error Boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fdfbf7] to-[#f8f6f0]" style={{ fontFamily: 'Inter, sans-serif' }}>
          <div className="text-center max-w-md mx-auto p-8">
            <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-[inset_0_2px_8px_rgba(239,68,68,0.1)]">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Có lỗi xảy ra</h2>
            <p className="text-gray-600 mb-6">
              Ứng dụng gặp sự cố bất ngờ. Vui lòng làm mới trang.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gradient-to-r from-[#FFD35B] to-[#F59E0B] text-white rounded-2xl hover:from-[#F59E0B] hover:to-[#FFD35B] transition-all duration-300 font-semibold shadow-[0_8px_24px_rgba(255,211,91,0.3)] hover:scale-105"
            >
              Làm mới trang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Dashboard wrapper component to handle navigation state
const DashboardWrapper = ({ user }) => {
  const [currentView, setCurrentView] = useState('overview');

  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  return (
    <Dashboard
      user={user}
      currentView={currentView}
      onViewChange={handleViewChange}
    />
  );
};

// Main App component content (inside AuthProvider)
const AppContent = () => {
  const { user, isLoading, isAuthenticated, logout, login, register } = useAuth();
  const [showNav, setShowNav] = useState(false);
  const [currentView, setCurrentView] = useState('overview');
  const location = useLocation();

  // Navigation animation
  useEffect(() => {
    const timer = setTimeout(() => setShowNav(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Show loading screen during initial auth check
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Handler functions
  const handleLogin = (credentials) => {
    return login(credentials);
  };

  const handleRegister = async (userData) => {
    try {
      const result = await register(userData);
      if (result.success) {
        return result;
      }
    } catch (error) {
      console.error('Register error in App:', error);
      throw error;
    }
  };

  // Handle dashboard navigation
  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  // Check if we're on dashboard page
  const isDashboardPage = location.pathname === '/dashboard' || location.pathname.startsWith('/dashboard/');

  return (
    <div className="App min-h-screen bg-gradient-to-br from-[#fdfbf7] to-[#f8f6f0]" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Navbar - hiển thị trên tất cả trang */}
      <ModernNavbar
        isLoggedIn={isAuthenticated}
        user={user}
        onLogout={logout}
        showNav={showNav}
        currentView={isDashboardPage ? currentView : null}
        onViewChange={isDashboardPage ? handleViewChange : null}
      />

      <Routes>
        {/* Public routes */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <Homepage isLoggedIn={isAuthenticated} />
            </PublicRoute>
          }
        />

        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage
                onLogin={handleLogin}
                isLoading={isLoading}
                isLoggedIn={isAuthenticated}
              />
            </PublicRoute>
          }
        />

        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage
                onRegister={handleRegister}
                isLoading={isLoading}
                isLoggedIn={isAuthenticated}
              />
            </PublicRoute>
          }
        />

        {/* Protected routes */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <Dashboard
                user={user}
                currentView={currentView}
                onViewChange={handleViewChange}
              />
            </ProtectedRoute>
          }
        />

        {/* Admin routes - chỉ admin và director */}
        <Route
          path="/admin/*"
          element={
            <AdminRoute>
              <div className="p-8 text-center bg-gradient-to-br from-[#fdfbf7] to-[#f8f6f0] min-h-screen" style={{ fontFamily: 'Inter, sans-serif' }}>
                <div className="max-w-2xl mx-auto">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-50 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-[inset_0_2px_8px_rgba(147,51,234,0.1)]">
                    <span className="text-2xl">👑</span>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-800 mb-4">Admin Panel</h1>
                  <p className="text-gray-600 mb-8">
                    Khu vực quản trị dành cho Admin và Director. Các tính năng đang được phát triển.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-white to-gray-50/30 rounded-3xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.6)] border border-gray-100/50">
                      <h3 className="font-bold text-gray-800 mb-2">Quản lý người dùng</h3>
                      <p className="text-sm text-gray-600">Tạo, sửa, xóa tài khoản và phân quyền</p>
                    </div>
                    <div className="bg-gradient-to-br from-white to-gray-50/30 rounded-3xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.6)] border border-gray-100/50">
                      <h3 className="font-bold text-gray-800 mb-2">Cấu hình hệ thống</h3>
                      <p className="text-sm text-gray-600">Thiết lập và cấu hình hệ thống</p>
                    </div>
                  </div>
                </div>
              </div>
            </AdminRoute>
          }
        />

        {/* User management routes */}
        <Route
          path="/users/*"
          element={
            <AdminRoute>
              <div className="p-8 text-center bg-gradient-to-br from-[#fdfbf7] to-[#f8f6f0] min-h-screen" style={{ fontFamily: 'Inter, sans-serif' }}>
                <div className="max-w-2xl mx-auto">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-[inset_0_2px_8px_rgba(59,130,246,0.1)]">
                    <span className="text-2xl">👥</span>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-800 mb-4">Quản lý người dùng</h1>
                  <p className="text-gray-600 mb-8">
                    Quản lý tài khoản, phân quyền và cấu trúc tổ chức.
                  </p>
                  <div className="bg-gradient-to-br from-white to-gray-50/30 rounded-3xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.6)] border border-gray-100/50">
                    <p className="text-sm text-gray-600">
                      Giao diện quản lý người dùng đang được phát triển.
                      Hiện tại bạn có thể sử dụng API endpoints để quản lý.
                    </p>
                  </div>
                </div>
              </div>
            </AdminRoute>
          }
        />

        {/* Reports routes */}
        <Route
          path="/reports/*"
          element={
            <ProtectedRoute>
              <div className="p-8 text-center bg-gradient-to-br from-[#fdfbf7] to-[#f8f6f0] min-h-screen" style={{ fontFamily: 'Inter, sans-serif' }}>
                <div className="max-w-2xl mx-auto">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-[inset_0_2px_8px_rgba(16,185,129,0.1)]">
                    <span className="text-2xl">📊</span>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-800 mb-4">Báo cáo & Phân tích</h1>
                  <p className="text-gray-600 mb-8">
                    Báo cáo chi tiết về hiệu suất và tiến độ công việc.
                  </p>
                  <div className="bg-gradient-to-br from-white to-gray-50/30 rounded-3xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.6)] border border-gray-100/50">
                    <p className="text-sm text-gray-600">
                      Tính năng báo cáo nâng cao đang được phát triển.
                      Hiện tại bạn có thể xem phân tích cơ bản trong Dashboard.
                    </p>
                  </div>
                </div>
              </div>
            </ProtectedRoute>
          }
        />

        {/* Settings routes */}
        <Route
          path="/settings/*"
          element={
            <ProtectedRoute>
              <div className="p-8 text-center bg-gradient-to-br from-[#fdfbf7] to-[#f8f6f0] min-h-screen" style={{ fontFamily: 'Inter, sans-serif' }}>
                <div className="max-w-2xl mx-auto">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-[inset_0_2px_8px_rgba(156,163,175,0.1)]">
                    <span className="text-2xl">⚙️</span>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-800 mb-4">Cài đặt</h1>
                  <p className="text-gray-600 mb-8">
                    Cài đặt cá nhân và tùy chỉnh giao diện.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-white to-gray-50/30 rounded-3xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.6)] border border-gray-100/50">
                      <h3 className="font-bold text-gray-800 mb-2">Thông tin cá nhân</h3>
                      <p className="text-sm text-gray-600">Cập nhật thông tin và đổi mật khẩu</p>
                    </div>
                    <div className="bg-gradient-to-br from-white to-gray-50/30 rounded-3xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.6)] border border-gray-100/50">
                      <h3 className="font-bold text-gray-800 mb-2">Tùy chỉnh giao diện</h3>
                      <p className="text-sm text-gray-600">Theme, ngôn ngữ và thông báo</p>
                    </div>
                  </div>
                </div>
              </div>
            </ProtectedRoute>
          }
        />

        {/* Profile routes */}
        <Route
          path="/profile/*"
          element={
            <ProtectedRoute>
              <div className="p-8 bg-gradient-to-br from-[#fdfbf7] to-[#f8f6f0] min-h-screen" style={{ fontFamily: 'Inter, sans-serif' }}>
                <div className="max-w-4xl mx-auto">
                  <div className="bg-gradient-to-br from-white to-gray-50/30 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.6)] border border-gray-100/50 p-10">
                    <div className="flex items-center space-x-6 mb-8">
                      <div className="w-20 h-20 bg-gradient-to-br from-[#FFD35B] to-[#F59E0B] rounded-3xl flex items-center justify-center text-white text-2xl font-bold shadow-[0_12px_32px_rgba(255,211,91,0.3)]">
                        {user?.full_name?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold text-gray-800">{user?.full_name || user?.username}</h1>
                        <p className="text-lg text-gray-600 font-medium">{user?.role_display_name}</p>
                        <p className="text-sm text-gray-500">{user?.department_name}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h3 className="font-bold text-gray-800 mb-4">Thông tin tài khoản</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-semibold text-gray-600">Email</label>
                            <p className="text-gray-800 font-medium">{user?.email}</p>
                          </div>
                          <div>
                            <label className="text-sm font-semibold text-gray-600">Tên đăng nhập</label>
                            <p className="text-gray-800 font-medium">{user?.username}</p>
                          </div>
                          <div>
                            <label className="text-sm font-semibold text-gray-600">Phòng ban</label>
                            <p className="text-gray-800 font-medium">{user?.department_name || 'Chưa gán'}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-bold text-gray-800 mb-4">Quyền hạn</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-semibold text-gray-600">Vai trò</label>
                            <p className="text-gray-800 font-medium">{user?.role_display_name}</p>
                          </div>
                          <div>
                            <label className="text-sm font-semibold text-gray-600">Cấp độ</label>
                            <p className="text-gray-800 font-medium">Level {user?.role_level}</p>
                          </div>
                          <div>
                            <label className="text-sm font-semibold text-gray-600">Trạng thái</label>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800">
                              Hoạt động
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ProtectedRoute>
          }
        />

        {/* 404 route */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fdfbf7] to-[#f8f6f0]" style={{ fontFamily: 'Inter, sans-serif' }}>
              <div className="text-center max-w-md mx-auto p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-[inset_0_2px_8px_rgba(156,163,175,0.1)]">
                  <span className="text-2xl">🔍</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Không tìm thấy trang</h2>
                <p className="text-gray-600 mb-6">
                  Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
                </p>
                <div className="space-x-4">
                  <button
                    onClick={() => window.history.back()}
                    className="px-4 py-2 bg-white/70 backdrop-blur-sm text-gray-700 rounded-2xl hover:bg-white/90 transition-all duration-300 font-medium shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
                  >
                    Quay lại
                  </button>
                  <button
                    onClick={() => window.location.href = isAuthenticated ? '/dashboard' : '/'}
                    className="px-4 py-2 bg-gradient-to-r from-[#FFD35B] to-[#F59E0B] text-white rounded-2xl hover:from-[#F59E0B] hover:to-[#FFD35B] transition-all duration-300 font-semibold shadow-[0_8px_24px_rgba(255,211,91,0.3)] hover:scale-105"
                  >
                    Về trang chủ
                  </button>
                </div>
              </div>
            </div>
          }
        />
      </Routes>
    </div>
  );
};

// Root App component with providers
function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;