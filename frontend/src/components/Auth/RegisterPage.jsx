import React, { useState, useRef, useEffect } from 'react';
import {
    Eye,
    EyeOff,
    User,
    Mail,
    Lock,
    UserPlus,
    ArrowRight,
    Shield,
    Sparkles,
    CheckCircle,
    AlertCircle,
    Award
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ErrorMessage from '../Common/ErrorMessage';
import LoadingSpinner from '../Common/LoadingSpinner';

export default function RegisterPage({ onRegister, isLoggedIn }) {
    const navigate = useNavigate();

    // State cho dữ liệu form
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        fullName: ''
    });

    const [errors, setErrors] = useState({});
    const [submitError, setSubmitError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [touched, setTouched] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const usernameRef = useRef(null);

    // Chuyển hướng nếu đã đăng nhập
    useEffect(() => {
        if (isLoggedIn) {
            navigate('/dashboard');
        }
    }, [isLoggedIn, navigate]);

    // Focus vào ô tên đăng nhập khi mount
    useEffect(() => {
        if (usernameRef.current) {
            usernameRef.current.focus();
        }
    }, []);

    // ===== NỀN BỤI VÀNG LƠ LỬNG – CANVAS (giống LoginPage) =====
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
                    color: GOLD_COLORS[Math.floor(Math.random() * GOLD_COLORS.length)]
                }));
            };

            const hexToRgba = (hex, alpha) => {
                const h = hex.replace('#', '');
                const bigint = parseInt(h, 16);
                const r = (bigint >> 16) & 255;
                const g = (bigint >> 8) & 255;
                const b = bigint & 255;
                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
            };

            const drawBackdrop = () => {
                const grad = ctx.createRadialGradient(
                    width * 0.4, height * 0.5, Math.min(width, height) * 0.05,
                    width * 0.4, height * 0.5, Math.max(width, height) * 0.8
                );
                grad.addColorStop(0, 'rgba(31,31,35,0.7)');
                grad.addColorStop(1, 'rgba(17,17,19,0.95)');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, width, height);
            };

            const draw = () => {
                drawBackdrop();
                ctx.globalCompositeOperation = 'lighter';

                for (const p of particlesRef.current) {
                    const tw = (Math.sin(p.twinkle) + 1) * 0.5;
                    const a = p.alpha * (0.7 + tw * 0.6);

                    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
                    g.addColorStop(0, hexToRgba(p.color, Math.min(0.35, a)));
                    g.addColorStop(1, 'rgba(0,0,0,0)');
                    ctx.fillStyle = g;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = hexToRgba(p.color, Math.min(0.9, a));
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

            const resize = () => {
                width = canvas.parentElement.offsetWidth;
                height = canvas.parentElement.offsetHeight;
                canvas.width = width;
                canvas.height = height;
                createParticles();
            };

            const ro = new ResizeObserver(resize);
            ro.observe(canvas.parentElement);

            createParticles();
            draw();

            return () => {
                cancelAnimationFrame(rafRef.current);
                ro.disconnect();
            };
        }, []);

        return (
            <div className="absolute inset-0">
                <canvas ref={canvasRef} className="w-full h-full" />
                <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-black/30 to-transparent pointer-events-none" />
            </div>
        );
    };

    // Hiệu ứng phần tử nổi (nhẹ nhàng) – vẫn giữ nếu cần
    const FloatingElements = () => {
        const elements = Array.from({ length: 6 }, (_, i) => (
            <div
                key={i}
                className="absolute rounded-full bg-gradient-to-br from-[#FBBF77] to-[#F59E0B] opacity-10 animate-float"
                style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    width: `${15 + Math.random() * 30}px`,
                    height: `${15 + Math.random() * 30}px`,
                    animationDelay: `${Math.random() * 3}s`,
                    animationDuration: `${4 + Math.random() * 3}s`
                }}
            />
        ));
        return elements;
    };

    // Hàm kiểm tra hợp lệ từng trường - Updated to match backend validation
    const validateField = (name, value) => {
        switch (name) {
            case 'username':
                if (!value.trim()) return 'Tên đăng nhập là bắt buộc';
                if (value.length < 3) return 'Username phải từ 3-50 ký tự';
                if (value.length > 50) return 'Username phải từ 3-50 ký tự';
                if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Username chỉ được chứa chữ cái, số và dấu gạch dưới';
                return '';
            case 'email':
                if (!value.trim()) return 'Email là bắt buộc';
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Email không hợp lệ';
                return '';
            case 'fullName':
                if (!value.trim()) return 'Họ và tên là bắt buộc';
                if (value.length < 2) return 'Họ tên phải từ 2-100 ký tự';
                if (value.length > 100) return 'Họ tên phải từ 2-100 ký tự';
                return '';
            case 'password':
                if (!value) return 'Mật khẩu là bắt buộc';
                if (value.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự';
                if (!/(?=.*[a-z])/.test(value)) return 'Mật khẩu phải chứa ít nhất 1 chữ thường';
                if (!/(?=.*[A-Z])/.test(value)) return 'Mật khẩu phải chứa ít nhất 1 chữ hoa';
                if (!/(?=.*\d)/.test(value)) return 'Mật khẩu phải chứa ít nhất 1 số';
                return '';
            case 'confirmPassword':
                if (!value) return 'Vui lòng xác nhận mật khẩu';
                if (value !== formData.password) return 'Mật khẩu xác nhận không khớp';
                return '';
            default:
                return '';
        }
    };

    // Xử lý thay đổi input
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (touched[name]) {
            const error = validateField(name, value);
            setErrors(prev => ({ ...prev, [name]: error }));
        }

        if (submitError) setSubmitError('');
    };

    // Xử lý blur input
    const handleInputBlur = (e) => {
        const { name, value } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        const error = validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: error }));
    };

    // Kiểm tra toàn bộ form
    const validateForm = () => {
        const newErrors = {};
        const newTouched = {};

        Object.keys(formData).forEach(field => {
            newTouched[field] = true;
            const error = validateField(field, formData[field]);
            if (error) newErrors[field] = error;
        });

        setTouched(newTouched);
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Submit form - Updated to use API service
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError('');

        if (!validateForm()) {
            const firstErrorField = Object.keys(errors)[0];
            if (usernameRef.current && firstErrorField === 'username') {
                usernameRef.current.focus();
            }
            return;
        }

        setIsLoading(true);
        try {
            // Use the API service directly instead of onRegister prop
            const { api } = await import('../../services/api'); // Adjust path as needed

            const registerData = {
                username: formData.username.trim(),
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
                fullName: formData.fullName.trim(),
                roleId: 4 // Default employee role
            };

            console.log('Sending registration data:', { ...registerData, password: '[HIDDEN]' });

            const result = await api.register(registerData);

            if (!result?.success) {
                // Handle express-validator errors format
                if (result?.errors && Array.isArray(result.errors)) {
                    // Parse express-validator errors
                    const fieldErrors = {};
                    result.errors.forEach(error => {
                        if (error.param && error.msg) {
                            fieldErrors[error.param] = error.msg;
                        }
                    });

                    if (Object.keys(fieldErrors).length > 0) {
                        setErrors(prev => ({ ...prev, ...fieldErrors }));
                        setTouched(prev => {
                            const newTouched = { ...prev };
                            Object.keys(fieldErrors).forEach(field => {
                                newTouched[field] = true;
                            });
                            return newTouched;
                        });
                        return; // Don't set general error if we have field-specific errors
                    }
                }

                // Handle general error messages
                const errorMessage = result?.message || result?.error || 'Đăng ký thất bại. Vui lòng thử lại.';

                // Handle specific error cases
                if (errorMessage.includes('Username') || errorMessage.includes('username') || errorMessage.includes('Tên đăng nhập')) {
                    setErrors(prev => ({ ...prev, username: errorMessage }));
                    setTouched(prev => ({ ...prev, username: true }));
                } else if (errorMessage.includes('Email') || errorMessage.includes('email')) {
                    setErrors(prev => ({ ...prev, email: errorMessage }));
                    setTouched(prev => ({ ...prev, email: true }));
                } else {
                    setSubmitError(errorMessage);
                }
            } else {
                // Registration successful
                setSubmitError('');
                setErrors({});

                // Show success message and redirect to login
                alert('Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.');
                navigate('/login');
            }
        } catch (err) {
            console.error('Registration error:', err);

            let errorMessage = 'Đăng ký thất bại. Vui lòng thử lại.';

            if (err?.message) {
                if (err.message.includes('Network Error') || err.message.includes('fetch')) {
                    errorMessage = 'Lỗi kết nối. Vui lòng kiểm tra internet và thử lại.';
                } else {
                    errorMessage = err.message;
                }
            }

            setSubmitError(errorMessage);
            usernameRef.current?.focus();
        } finally {
            setIsLoading(false);
        }
    };

    // Thử lại từ ErrorMessage
    const handleRetry = () => {
        setSubmitError('');
        setFormData({
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
            fullName: ''
        });
        setErrors({});
        setTouched({});
        if (usernameRef.current) {
            usernameRef.current.focus();
        }
    };

    const handleDismissError = () => setSubmitError('');

    // Đánh giá độ mạnh mật khẩu
    const getPasswordStrength = (password) => {
        if (!password) return { strength: 0, label: '', color: '' };

        let strength = 0;
        if (password.length >= 6) strength++;
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;

        const levels = [
            { label: 'Rất yếu', color: 'bg-red-500', textColor: 'text-red-600' },
            { label: 'Yếu', color: 'bg-orange-500', textColor: 'text-orange-600' },
            { label: 'Trung bình', color: 'bg-yellow-500', textColor: 'text-yellow-600' },
            { label: 'Tốt', color: 'bg-blue-500', textColor: 'text-blue-600' },
            { label: 'Mạnh', color: 'bg-green-500', textColor: 'text-green-600' }
        ];

        return { strength, ...levels[Math.min(strength, 4)] };
    };

    const passwordStrength = getPasswordStrength(formData.password);

    return (
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            {/* Nền họa tiết rất nhẹ */}
            <div className="absolute inset-0 opacity-5">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `radial-gradient(circle at 20% 80%, #FBBF77 0%, transparent 50%),
                                          radial-gradient(circle at 80% 20%, #F59E0B 0%, transparent 50%)`
                    }}
                />
            </div>

            {/* Phần tử nổi (có thể giữ/ bỏ) */}
            <div className="absolute inset-0 pointer-events-none hidden sm:block">
                <FloatingElements />
            </div>

            {/* Nội dung chính */}
            <div className="relative z-10 flex min-h-screen">
                {/* Bên trái - Thương hiệu với bụi vàng */}
                <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                    <GoldenDustBackground />
                    {/* overlay đảm bảo chữ rõ */}
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-950/50 via-gray-950/35 to-gray-900/30" />

                    <div className="relative z-10 flex flex-col justify-center p-12 text-white">
                        <div className="max-w-md">
                            <div className="mb-8">
                                <div className="h-16 w-16 bg-white/15 backdrop-blur-[2px] rounded-2xl flex items-center justify-center mb-6 shadow-2xl">
                                    <Award className="w-8 h-8" />
                                </div>
                                <h1 className="text-4xl font-bold mb-4 text-elevated">
                                    Tham gia Stratix
                                </h1>
                                <p className="text-xl text-orange-100 leading-relaxed text-elevated/90">
                                    Tạo tài khoản của bạn và bắt đầu quản lý công việc như một chuyên gia.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center space-x-3">
                                    <div className="h-8 w-8 bg-white/15 rounded-lg flex items-center justify-center backdrop-blur-[1px]">
                                        <CheckCircle className="w-4 h-4" />
                                    </div>
                                    <span className="text-orange-100 text-elevated/90">Miễn phí vĩnh viễn cho mục đích cá nhân</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <div className="h-8 w-8 bg-white/15 rounded-lg flex items-center justify-center backdrop-blur-[1px]">
                                        <Sparkles className="w-4 h-4" />
                                    </div>
                                    <span className="text-orange-100 text-elevated/90">Tính năng năng suất nâng cao</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <div className="h-8 w-8 bg-white/15 rounded-lg flex items-center justify-center backdrop-blur-[1px]">
                                        <Shield className="w-4 h-4" />
                                    </div>
                                    <span className="text-orange-100 text-elevated/90">Mã hóa dữ liệu an toàn</span>
                                </div>
                            </div>

                            <div className="mt-8 p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                                <p className="text-sm text-orange-100">
                                    "Stratix đã thay đổi cách đội của chúng tôi quản lý dự án. Giao diện trực quan và tính năng mạnh mẽ khiến nó trở nên không thể thiếu."
                                </p>
                                <div className="mt-2 text-xs text-orange-200">
                                    — Sarah Chen, Product Manager
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bên phải - Form đăng ký */}
                <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                    <div className="w-full max-w-md">
                        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                            {/* Header */}
                            <div className="text-center mb-8">
                                <div className="h-16 w-16 bg-gradient-to-br from-[#FBBF77] to-[#F59E0B] rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <UserPlus className="w-8 h-8 text-white" />
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">Tạo tài khoản</h2>
                                <p className="text-gray-600">Tham gia cộng đồng hàng nghìn người làm việc hiệu quả</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {submitError && (
                                    <div className="mb-6">
                                        <ErrorMessage
                                            message={submitError}
                                            onRetry={handleRetry}
                                            onDismiss={handleDismissError}
                                        />
                                    </div>
                                )}

                                {/* Họ và tên */}
                                <div>
                                    <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Họ và tên
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            id="fullName"
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleInputChange}
                                            onBlur={handleInputBlur}
                                            className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#FBBF77] focus:border-[#FBBF77] transition-colors ${errors.fullName && touched.fullName
                                                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                                : 'border-gray-300'
                                                }`}
                                            placeholder="Nhập họ và tên"
                                            disabled={isLoading}
                                        />
                                        {formData.fullName && !errors.fullName && touched.fullName && (
                                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                            </div>
                                        )}
                                    </div>
                                    {errors.fullName && touched.fullName && (
                                        <p className="mt-2 text-sm text-red-600 flex items-center">
                                            <AlertCircle className="w-4 h-4 mr-1" />
                                            {errors.fullName}
                                        </p>
                                    )}
                                </div>

                                {/* Tên đăng nhập */}
                                <div>
                                    <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Tên đăng nhập
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
                                            className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#FBBF77] focus:border-[#FBBF77] transition-colors ${errors.username && touched.username
                                                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                                : 'border-gray-300'
                                                }`}
                                            placeholder="Chọn tên đăng nhập"
                                            disabled={isLoading}
                                        />
                                        {formData.username && !errors.username && touched.username && (
                                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                            </div>
                                        )}
                                    </div>
                                    {errors.username && touched.username && (
                                        <p className="mt-2 text-sm text-red-600 flex items-center">
                                            <AlertCircle className="w-4 h-4 mr-1" />
                                            {errors.username}
                                        </p>
                                    )}
                                </div>

                                {/* Email */}
                                <div>
                                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Email
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Mail className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            onBlur={handleInputBlur}
                                            className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#FBBF77] focus:border-[#FBBF77] transition-colors ${errors.email && touched.email
                                                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                                : 'border-gray-300'
                                                }`}
                                            placeholder="Nhập email của bạn"
                                            disabled={isLoading}
                                        />
                                        {formData.email && !errors.email && touched.email && (
                                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                            </div>
                                        )}
                                    </div>
                                    {errors.email && touched.email && (
                                        <p className="mt-2 text-sm text-red-600 flex items-center">
                                            <AlertCircle className="w-4 h-4 mr-1" />
                                            {errors.email}
                                        </p>
                                    )}
                                </div>

                                {/* Mật khẩu */}
                                <div>
                                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Mật khẩu
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
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
                                            placeholder="Tạo mật khẩu"
                                            disabled={isLoading}
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 pr-4 flex items-center"
                                            onClick={() => setShowPassword(!showPassword)}
                                            disabled={isLoading}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                            ) : (
                                                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                            )}
                                        </button>
                                    </div>

                                    {/* Thanh đo độ mạnh mật khẩu */}
                                    {formData.password && (
                                        <div className="mt-2">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                                                        style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                                                    />
                                                </div>
                                                <span className={`text-xs font-medium ${passwordStrength.textColor}`}>
                                                    {passwordStrength.label}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {errors.password && touched.password && (
                                        <p className="mt-2 text-sm text-red-600 flex items-center">
                                            <AlertCircle className="w-4 h-4 mr-1" />
                                            {errors.password}
                                        </p>
                                    )}
                                </div>

                                {/* Xác nhận mật khẩu */}
                                <div>
                                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Xác nhận mật khẩu
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                            onBlur={handleInputBlur}
                                            className={`w-full pl-12 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-[#FBBF77] focus:border-[#FBBF77] transition-colors ${errors.confirmPassword && touched.confirmPassword
                                                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                                : 'border-gray-300'
                                                }`}
                                            placeholder="Xác nhận mật khẩu của bạn"
                                            disabled={isLoading}
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 pr-4 flex items-center"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            disabled={isLoading}
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                            ) : (
                                                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                            )}
                                        </button>
                                        {formData.confirmPassword && !errors.confirmPassword && touched.confirmPassword && (
                                            <div className="absolute inset-y-0 right-12 pr-2 flex items-center">
                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                            </div>
                                        )}
                                    </div>
                                    {errors.confirmPassword && touched.confirmPassword && (
                                        <p className="mt-2 text-sm text-red-600 flex items-center">
                                            <AlertCircle className="w-4 h-4 mr-1" />
                                            {errors.confirmPassword}
                                        </p>
                                    )}
                                </div>

                                {/* Điều khoản & Chính sách */}
                                <div className="flex items-start space-x-3 pt-2">
                                    <input
                                        id="terms"
                                        name="terms"
                                        type="checkbox"
                                        className="h-4 w-4 text-[#FBBF77] focus:ring-[#FBBF77] border-gray-300 rounded mt-1"
                                        required
                                    />
                                    <label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed">
                                        Tôi đồng ý với{' '}
                                        <button type="button" className="text-[#F59E0B] hover:text-[#FBBF77] font-medium">
                                            Điều khoản Dịch vụ
                                        </button>
                                        {' '}và{' '}
                                        <button type="button" className="text-[#F59E0B] hover:text-[#FBBF77] font-medium">
                                            Chính sách Bảo mật
                                        </button>
                                    </label>
                                </div>

                                {/* Nút gửi */}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-gradient-to-r from-[#FBBF77] to-[#F59E0B] hover:from-[#F59E0B] hover:to-[#FBBF77] text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl flex items-center justify-center mt-6"
                                >
                                    {isLoading ? (
                                        <>
                                            <LoadingSpinner size="small" />
                                            <span className="ml-2">Đang tạo tài khoản...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Tạo tài khoản</span>
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </>
                                    )}
                                </button>

                                {/* Liên kết đăng nhập */}
                                <div className="text-center pt-4">
                                    <p className="text-gray-600">
                                        Đã có tài khoản?{' '}
                                        <button
                                            type="button"
                                            onClick={() => navigate('/login')}
                                            className="text-[#F59E0B] hover:text-[#FBBF77] font-semibold"
                                            disabled={isLoading}
                                        >
                                            Đăng nhập tại đây
                                        </button>
                                    </p>
                                </div>
                            </form>
                        </div>

                        {/* Lợi ích ngắn */}
                        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-[#FFF7ED] border border-[#FDE6C8] rounded-xl">
                                <CheckCircle className="w-8 h-8 text-[#F59E0B] mx-auto mb-2" />
                                <h4 className="font-semibold text-gray-900 text-sm">Miễn phí trọn đời</h4>
                                <p className="text-xs text-gray-600 mt-1">Không cần thẻ tín dụng</p>
                            </div>
                            <div className="text-center p-4 bg-[#FFF7ED] border border-[#FDE6C8] rounded-xl">
                                <Shield className="w-8 h-8 text-[#F59E0B] mx-auto mb-2" />
                                <h4 className="font-semibold text-gray-900 text-sm">An toàn</h4>
                                <p className="text-xs text-gray-600 mt-1">Bảo mật cấp doanh nghiệp</p>
                            </div>
                            <div className="text-center p-4 bg-[#FFF7ED] border border-[#FDE6C8] rounded-xl">
                                <Sparkles className="w-8 h-8 text-[#F59E0B] mx-auto mb-2" />
                                <h4 className="font-semibold text-gray-900 text-sm">Tính năng Pro</h4>
                                <p className="text-xs text-gray-600 mt-1">Bao gồm phân tích nâng cao</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom Styles */}
            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    33% { transform: translateY(-15px) rotate(3deg); }
                    66% { transform: translateY(-8px) rotate(-3deg); }
                }
                .animate-float { animation: float 6s ease-in-out infinite; }

                /* Tăng độ đọc chữ trên nền động */
                .text-elevated { text-shadow: 0 1px 2px rgba(0,0,0,0.45), 0 2px 12px rgba(0,0,0,0.35); }
                .text-elevated\\/90 { text-shadow: 0 1px 2px rgba(0,0,0,0.4); }
            `}</style>
        </div>
    );
}