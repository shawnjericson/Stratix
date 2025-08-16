// components/Auth/LoginPage.jsx
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
    Eye,
    EyeOff,
    User,
    Lock,
    LogIn,
    ArrowRight,
    Shield,
    Sparkles,
    Chrome,
    AlertCircle,
    Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ErrorMessage from '../Common/ErrorMessage';
import LoadingSpinner from '../Common/LoadingSpinner';
import GoldenDustBackground from '../Common/GoldenDustBackground';

export default function LoginPage({ onLogin, isLoggedIn }) {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({ username: '', password: '' });
    const [errors, setErrors] = useState({});
    const [submitError, setSubmitError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [touched, setTouched] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const usernameRef = useRef(null);
    const passwordRef = useRef(null);

    useEffect(() => {
        if (isLoggedIn) navigate('/dashboard');
    }, [isLoggedIn, navigate]);

    useEffect(() => {
        usernameRef.current?.focus();
    }, []);

    const validateField = useCallback((name, value) => {
        switch (name) {
            case 'username':
                if (!value.trim()) return 'Tên đăng nhập là bắt buộc';
                if (value.length < 3) return 'Tên đăng nhập phải có ít nhất 3 ký tự';
                if (value.length > 50) return 'Tên đăng nhập không được vượt quá 50 ký tự';
                return '';
            case 'password':
                if (!value) return 'Mật khẩu là bắt buộc';
                if (value.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự';
                if (value.length > 50) return 'Mật khẩu không được vượt quá 50 ký tự';
                return '';
            default:
                return '';
        }
    }, []);

    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData((p) => ({ ...p, [name]: value }));
        if (submitError) setSubmitError('');
        if (touched[name]) {
            setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
        }
    }, [submitError, touched, validateField]);

    const handleInputBlur = useCallback((e) => {
        const { name, value } = e.target;
        setTouched((p) => ({ ...p, [name]: true }));
        setErrors((p) => ({ ...p, [name]: validateField(name, value) }));
    }, [validateField]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        console.log('🔑 Login form submitted'); // Debug log

        setSubmitError('');

        // validate all
        const newErrors = {};
        const newTouched = {};
        for (const k of Object.keys(formData)) {
            newTouched[k] = true;
            const msg = validateField(k, formData[k]);
            if (msg) newErrors[k] = msg;
        }
        setTouched(newTouched);
        setErrors(newErrors);

        if (Object.keys(newErrors).length) {
            console.log('❌ Validation errors:', newErrors);
            (newErrors.username ? usernameRef : passwordRef)?.current?.focus();
            return;
        }

        if (typeof onLogin !== 'function') {
            console.error('❌ onLogin is not a function');
            setSubmitError('Lỗi hệ thống: onLogin không phải là function');
            return;
        }

        setIsLoading(true);
        try {
            console.log('📡 Calling onLogin with:', { username: formData.username, password: '[HIDDEN]' });
            const result = await onLogin(formData);
            console.log('📡 Login result:', result);

            if (!result?.success) {
                const errorMessage = result?.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
                console.log('❌ Login failed:', errorMessage);
                setSubmitError(errorMessage);
            }
            // success: PublicRoute sẽ tự redirect khi isAuthenticated = true
        } catch (err) {
            console.error('❌ Login error:', err);
            const errorMessage = err?.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
            setSubmitError(errorMessage);
            usernameRef.current?.focus();
        } finally {
            setIsLoading(false);
        }
    }, [formData, onLogin, validateField]);

    const handleRetry = useCallback(() => {
        setSubmitError('');
        setFormData({ username: '', password: '' });
        setErrors({});
        setTouched({});
        usernameRef.current?.focus();
    }, []);

    const handleDismissError = useCallback(() => setSubmitError(''), []);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && e.target.name === 'username') {
            e.preventDefault();
            passwordRef.current?.focus();
        }
    }, []);

    const toggleShowPassword = useCallback(() => {
        setShowPassword(prev => !prev);
    }, []);

    const handleGoogleLogin = useCallback(() => {
        setSubmitError('Tính năng đăng nhập Google sẽ sớm được tích hợp!');
    }, []);

    const handleForgotPassword = useCallback(() => {
        setSubmitError('Tính năng khôi phục mật khẩu sẽ có trong phiên bản tiếp theo!');
    }, []);

    const handleGoToRegister = useCallback(() => {
        navigate('/register');
    }, [navigate]);

    // Memoize form content để tránh re-render
    const formContent = useMemo(() => (
        <form onSubmit={handleSubmit} className="space-y-6">
            {submitError && (
                <div className="mb-6">
                    <ErrorMessage
                        message={submitError}
                        onRetry={handleRetry}
                        onDismiss={handleDismissError}
                    />
                </div>
            )}

            <div>
                <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
                    Tên đăng nhập / Email
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        ref={usernameRef}
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        onKeyDown={handleKeyDown}
                        className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#FBBF77] focus:border-[#FBBF77] transition-colors ${errors.username && touched.username
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-300'
                            }`}
                        placeholder="Nhập tên đăng nhập hoặc email"
                        disabled={isLoading}
                    />
                </div>
                {errors.username && touched.username && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.username}
                    </p>
                )}
            </div>

            <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                    Mật khẩu
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        ref={passwordRef}
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        className={`w-full pl-12 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-[#FBBF77] focus:border-[#FBBF77] transition-colors ${errors.password && touched.password
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-300'
                            }`}
                        placeholder="Nhập mật khẩu"
                        disabled={isLoading}
                    />
                    <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-4 flex items-center"
                        onClick={toggleShowPassword}
                        disabled={isLoading}
                        aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                        {showPassword ? (
                            <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        ) : (
                            <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        )}
                    </button>
                </div>
                {errors.password && touched.password && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.password}
                    </p>
                )}
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        className="h-4 w-4 text-[#FBBF77] focus:ring-[#FBBF77] border-gray-300 rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 text-sm text-gray-600">
                        Ghi nhớ đăng nhập
                    </label>
                </div>
                <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm text-[#F59E0B] hover:text-[#FBBF77] font-medium"
                >
                    Quên mật khẩu?
                </button>
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#FBBF77] to-[#F59E0B] hover:from-[#F59E0B] hover:to-[#FBBF77] text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl flex items-center justify-center"
            >
                {isLoading ? (
                    <>
                        <LoadingSpinner size="small" />
                        <span className="ml-2">Đang đăng nhập...</span>
                    </>
                ) : (
                    <>
                        <span>Đăng nhập</span>
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                )}
            </button>

            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">Hoặc tiếp tục với</span>
                </div>
            </div>

            <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center hover:bg-gray-50"
                disabled={isLoading}
            >
                <Chrome className="w-5 h-5 mr-3" />
                Tiếp tục với Google
            </button>

            <div className="text-center pt-4">
                <p className="text-gray-600">
                    Chưa có tài khoản?{' '}
                    <button
                        type="button"
                        onClick={handleGoToRegister}
                        className="text-[#F59E0B] hover:text-[#FBBF77] font-semibold"
                        disabled={isLoading}
                    >
                        Đăng ký ngay
                    </button>
                </p>
            </div>
        </form>
    ), [
        handleSubmit, submitError, handleRetry, handleDismissError, formData,
        handleInputChange, handleInputBlur, handleKeyDown, errors, touched,
        isLoading, showPassword, toggleShowPassword, handleForgotPassword,
        handleGoogleLogin, handleGoToRegister
    ]);

    return (
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
            <div className="absolute inset-0 opacity-[0.06]">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `radial-gradient(circle at 25% 25%, #FBBF77 0%, transparent 50%),
                               radial-gradient(circle at 75% 75%, #F59E0B 0%, transparent 50%)`,
                    }}
                />
            </div>

            <div className="relative z-10 flex min-h-screen">
                <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                    <GoldenDustBackground />
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-950/50 via-gray-950/35 to-gray-900/30" />
                    <div className="relative z-10 flex flex-col justify-center p-12 text-white">
                        <div className="max-w-md">
                            <div className="mb-8">
                                <div className="h-16 w-16 bg-white/15 backdrop-blur-[2px] rounded-2xl flex items-center justify-center mb-6 shadow-2xl">
                                    <Shield className="w-8 h-8" />
                                </div>
                                <h1 className="text-4xl font-bold mb-4 text-elevated">Chào mừng đến với Stratix</h1>
                                <p className="text-xl text-orange-100 leading-relaxed text-elevated/90">
                                    Nền tảng quản lý nhiệm vụ chuyên nghiệp dành cho đội nhóm và cá nhân hiện đại.
                                </p>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center space-x-3">
                                    <div className="h-8 w-8 bg-white/15 rounded-lg flex items-center justify-center backdrop-blur-[1px]">
                                        <Sparkles className="w-4 h-4" />
                                    </div>
                                    <span className="text-orange-100 text-elevated/90">Phân tích & báo cáo nâng cao</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <div className="h-8 w-8 bg-white/15 rounded-lg flex items-center justify-center backdrop-blur-[1px]">
                                        <Shield className="w-4 h-4" />
                                    </div>
                                    <span className="text-orange-100 text-elevated/90">Bảo mật cấp doanh nghiệp</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <div className="h-8 w-8 bg-white/15 rounded-lg flex items-center justify-center backdrop-blur-[1px]">
                                        <Users className="w-4 h-4" />
                                    </div>
                                    <span className="text-orange-100 text-elevated/90">Công cụ cộng tác nhóm hiệu quả</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                    <div className="w-full max-w-md">
                        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                            <div className="text-center mb-8">
                                <div className="h-16 w-16 bg-gradient-to-br from-[#FBBF77] to-[#F59E0B] rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <LogIn className="w-8 h-8 text-white" />
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">Chào mừng trở lại</h2>
                                <p className="text-gray-600">Đăng nhập vào tài khoản của bạn để tiếp tục</p>
                            </div>

                            {formContent}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes float {
                  0%,
                  100% {
                    transform: translateY(0px) rotate(0deg);
                  }
                  33% {
                    transform: translateY(-20px) rotate(5deg);
                  }
                  66% {
                    transform: translateY(-10px) rotate(-5deg);
                  }
                }
                .animate-float {
                  animation: float 6s ease-in-out infinite;
                }
                .text-elevated {
                  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45), 0 2px 12px rgba(0, 0, 0, 0.35);
                }
                .text-elevated\\/90 {
                  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
                }
            `}</style>
        </div>
    );
}