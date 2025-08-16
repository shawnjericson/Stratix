// components/Auth/LoginPage.jsx
import React, { useEffect, useRef, useState } from 'react';
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

    const validateField = (name, value) => {
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
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((p) => ({ ...p, [name]: value }));
        if (submitError) setSubmitError('');
        if (touched[name]) {
            setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
        }
    };

    const handleInputBlur = (e) => {
        const { name, value } = e.target;
        setTouched((p) => ({ ...p, [name]: true }));
        setErrors((p) => ({ ...p, [name]: validateField(name, value) }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
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
            (newErrors.username ? usernameRef : passwordRef)?.current?.focus();
            return;
        }

        if (typeof onLogin !== 'function') {
            setSubmitError('Lỗi hệ thống: onLogin không phải là function');
            return;
        }

        setIsLoading(true);
        try {
            const result = await onLogin(formData);
            if (!result?.success) {
                setSubmitError(result?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
            }
            // success: PublicRoute sẽ tự redirect khi isAuthenticated = true
        } catch (err) {
            setSubmitError(err?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
            usernameRef.current?.focus();
        } finally {
            setIsLoading(false);
        }
    };

    const handleRetry = () => {
        setSubmitError('');
        setFormData({ username: '', password: '' });
        setErrors({});
        setTouched({});
        usernameRef.current?.focus();
    };

    const handleDismissError = () => setSubmitError('');

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && e.target.name === 'username') {
            e.preventDefault();
            passwordRef.current?.focus();
        }
    };

    // ==== NỀN HIỆU ỨNG (giữ nguyên phần UI của bạn) ====
    const GoldenDustBackground = () => {
        const canvasRef = useRef(null);
        const rafRef = useRef(null);
        const particlesRef = useRef([]);

        useEffect(() => {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d', { alpha: true });

            let width = canvas.parentElement.offsetWidth;
            let height = canvas.parentElement.offsetHeight;
            canvas.width = width;
            canvas.height = height;

            const resize = () => {
                width = canvas.parentElement.offsetWidth;
                height = canvas.parentElement.offsetHeight;
                canvas.width = width;
                canvas.height = height;
                createParticles();
            };

            const GOLD_COLORS = ['#F8D38F', '#F6B756', '#FFD8A8', '#F4C06A'];

            const createParticles = () => {
                const count = Math.floor((width * height) / 8000);
                particlesRef.current = Array.from({ length: count }).map(() => ({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    r: 0.7 + Math.random() * 1.8,
                    vx: -0.15 + Math.random() * 0.8,
                    vy: -0.05 + Math.random() * 0.1,
                    alpha: 0.35 + Math.random() * 0.4,
                    twinkle: Math.random() * Math.PI * 2,
                    color: GOLD_COLORS[Math.floor(Math.random() * GOLD_COLORS.length)],
                }));
            };

            const drawGlowBackdrop = () => {
                const grad = ctx.createRadialGradient(
                    width * 0.4,
                    height * 0.5,
                    Math.min(width, height) * 0.05,
                    width * 0.4,
                    height * 0.5,
                    Math.max(width, height) * 0.8
                );
                grad.addColorStop(0, 'rgba(31,31,35,0.7)');
                grad.addColorStop(1, 'rgba(17,17,19,0.95)');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, width, height);
            };

            const hexToRgba = (hex, alpha) => {
                const h = hex.replace('#', '');
                const bigint = parseInt(h, 16);
                const r = (bigint >> 16) & 255;
                const g = (bigint >> 8) & 255;
                const b = bigint & 255;
                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
            };

            const draw = () => {
                drawGlowBackdrop();

                ctx.globalCompositeOperation = 'lighter';
                for (let i = 0; i < particlesRef.current.length; i++) {
                    const p = particlesRef.current[i];
                    const tw = (Math.sin(p.twinkle) + 1) * 0.5;
                    const a = p.alpha * (0.7 + tw * 0.6);

                    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
                    g.addColorStop(0, `${hexToRgba(p.color, Math.min(0.35, a))}`);
                    g.addColorStop(1, 'rgba(0,0,0,0)');
                    ctx.fillStyle = g;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = `${hexToRgba(p.color, Math.min(0.9, a))}`;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                    ctx.fill();

                    p.x += p.vx;
                    p.y += p.vy;
                    p.twinkle += 0.01 + Math.random() * 0.01;

                    if (p.x < -10) p.x = width + 10;
                    if (p.x > width + 10) p.x = -10;
                    if (p.y < -10) p.y = height + 10;
                    if (p.y > height + 10) p.y = -10;
                }
                ctx.globalCompositeOperation = 'source-over';

                rafRef.current = requestAnimationFrame(draw);
            };

            const ro = new ResizeObserver(resize);
            ro.observe(canvas.parentElement);
            createParticles();
            draw();

            return () => {
                cancelAnimationFrame(rafRef.current);
                ro.disconnect();
            };
        }, []);  // Chỉ tạo lại khi component mount hoặc unmount, không tái tạo lại khi thao tác nhập liệu

        return (
            <div className="absolute inset-0">
                <canvas ref={canvasRef} className="w-full h-full" />
                <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-black/30 to-transparent pointer-events-none" />
            </div>
        );
    };
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
                                            onClick={() => setShowPassword((s) => !s)}
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
                                        onClick={() => setSubmitError('Tính năng khôi phục mật khẩu sẽ có trong phiên bản tiếp theo!')}
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
                                    onClick={() => setSubmitError('Tính năng đăng nhập Google sẽ sớm được tích hợp!')}
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
                                            onClick={() => navigate('/register')}
                                            className="text-[#F59E0B] hover:text-[#FBBF77] font-semibold"
                                            disabled={isLoading}
                                        >
                                            Đăng ký ngay
                                        </button>
                                    </p>
                                </div>
                            </form>
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
        .text-elevated\/90 {
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
        }
      `}</style>
        </div>
    );
}
