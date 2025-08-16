import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ArrowRight,
    CheckCircle,
    Users,
    BarChart3,
    Zap,
    Shield,
    Clock,
    Star,
    Target,
    TrendingUp,
    Award,
    Globe,
    Sparkles
} from 'lucide-react';

function useCountUp(target = 0, duration = 1200) {
    const [val, setVal] = useState(0);
    const rafRef = useRef(null);
    useEffect(() => {
        let start = null;
        const animate = (t) => {
            if (!start) start = t;
            const p = Math.min((t - start) / duration, 1);
            setVal(Math.floor(target * (1 - Math.pow(1 - p, 3))));
            if (p < 1) rafRef.current = requestAnimationFrame(animate);
        };
        rafRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(rafRef.current);
    }, [target, duration]);
    return val;
}

// Animation variants
const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: "easeOut" }
    }
};

const staggerContainer = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.2 }
    }
};

const floatingCard = {
    animate: {
        y: [0, -8, 0],
        transition: {
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
        }
    }
};

export default function HomePage({ isLoggedIn }) {
    const [showContent, setShowContent] = useState(false);
    const navigate = useNavigate();

    const users = useCountUp(75000, 1200);
    const tasks = useCountUp(2500000, 1400);
    const companies = useCountUp(5000, 1000);

    useEffect(() => {
        const timer = setTimeout(() => setShowContent(true), 300);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (isLoggedIn) navigate('/dashboard');
    }, [isLoggedIn, navigate]);

    // Neumorphism button component
    const NeumorphButton = ({ children, variant = 'primary', onClick, className = '', ...props }) => {
        const baseClasses = "inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none";

        const variants = {
            primary: `
                px-8 py-4 text-white text-lg
                bg-gradient-to-r from-[#FFD35B] to-[#FFA726] 
                shadow-[8px_8px_16px_#d4d4d8,-8px_-8px_16px_#ffffff,inset_0_1px_0_rgba(255,255,255,0.3)] 
                hover:shadow-[12px_12px_24px_#d4d4d8,-12px_-12px_24px_#ffffff,inset_0_1px_0_rgba(255,255,255,0.4)]
                border border-[#FFD35B]/20
            `,
            secondary: `
                px-8 py-4 text-[#222325] text-lg
                bg-gradient-to-r from-[#F5F5F7] to-[#FFFFFF]
                shadow-[8px_8px_16px_#d4d4d8,-8px_-8px_16px_#ffffff] 
                hover:shadow-[12px_12px_24px_#d4d4d8,-12px_-12px_24px_#ffffff]
                border border-white/50
            `
        };

        return (
            <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ y: 0 }}
                className={`${baseClasses} ${variants[variant]} ${className}`}
                onClick={onClick}
                {...props}
            >
                {children}
            </motion.button>
        );
    };

    // Glass card component
    const GlassCard = ({ children, className = '', delay = 0, ...props }) => (
        <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ delay }}
            whileHover={{ y: -8, scale: 1.02 }}
            className={`
                bg-white/30 backdrop-blur-xl 
                border border-white/40 
                shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.6)] 
                rounded-3xl p-8 
                hover:shadow-[0_16px_48px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.7)]
                hover:bg-white/40
                transition-all duration-500
                ${className}
            `}
            {...props}
        >
            {children}
        </motion.div>
    );

    return (
        <div
            className="min-h-screen relative overflow-hidden font-['Inter',sans-serif]"
            style={{
                background: 'linear-gradient(90deg, #FFF6E8 0%, #FFFFFF 100%)'
            }}
        >
            {/* Decorative Elements */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Floating orbs */}
                <motion.div
                    animate={floatingCard}
                    className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-[#FFD35B]/20 to-[#FFA726]/20 rounded-full blur-2xl"
                />
                <motion.div
                    animate={{ ...floatingCard.animate, transition: { ...floatingCard.animate.transition, delay: 2 } }}
                    className="absolute top-40 right-20 w-48 h-48 bg-gradient-to-r from-[#FFD35B]/15 to-[#FFA726]/15 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{ ...floatingCard.animate, transition: { ...floatingCard.animate.transition, delay: 4 } }}
                    className="absolute bottom-20 left-1/4 w-24 h-24 bg-gradient-to-r from-[#FFD35B]/25 to-[#FFA726]/25 rounded-full blur-xl"
                />

                {/* Geometric shapes */}
                <div className="absolute top-1/3 right-10 w-6 h-6 border-2 border-[#FFD35B]/30 rotate-45 animate-spin-slow" />
                <div className="absolute bottom-1/3 left-16 w-4 h-4 bg-[#FFD35B]/40 rounded-full animate-pulse" />
            </div>

            {/* Hero Section */}
            <div className="relative px-4 sm:px-6 lg:px-8 pt-24 pb-20 sm:pt-32 sm:pb-24">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        className="text-center"
                        variants={staggerContainer}
                        initial="hidden"
                        animate="visible"
                    >
                        {/* Brand Logo */}
                        <motion.div
                            variants={fadeInUp}
                            className="flex justify-center mb-8"
                        >
                            <div className="flex items-center space-x-3 px-6 py-3 bg-white/20 backdrop-blur-xl border border-white/40 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
                                <span className="text-7xl font-bold bg-gradient-to-r from-[#222325] to-[#3A3B3D] bg-clip-text text-transparent">
                                    Stratix
                                </span>
                            </div>
                        </motion.div>

                        {/* Main Heading */}
                        <motion.h1
                            variants={fadeInUp}
                            className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#222325] mb-8 leading-tight"
                        >
                            Nền tảng Quản trị
                            <span className="block bg-gradient-to-r from-[#FFD35B] to-[#FFA726] bg-clip-text text-transparent">
                                Công việc Hiện đại
                            </span>
                        </motion.h1>

                        {/* Subtitle */}
                        <motion.p
                            variants={fadeInUp}
                            className="text-xl sm:text-2xl text-[#9FA2A7] mb-12 max-w-4xl mx-auto leading-relaxed"
                        >
                            Chuẩn hoá quy trình, tăng tốc hiệu suất.
                            <span className="text-[#222325] font-semibold"> Quản trị nhiệm vụ thông minh </span>
                            dành cho đội ngũ đề cao
                            <span className="text-[#222325] font-semibold"> tốc độ, kỷ luật và minh bạch</span>.
                        </motion.p>

                        {/* CTA Buttons */}
                        <motion.div
                            variants={fadeInUp}
                            className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
                        >
                            <NeumorphButton
                                variant="primary"
                                onClick={() => navigate('/register')}
                            >
                                <span className="flex items-center">
                                    Bắt đầu dùng miễn phí
                                    <ArrowRight className="ml-3 h-5 w-5" />
                                </span>
                            </NeumorphButton>

                            <NeumorphButton
                                variant="secondary"
                                onClick={() => navigate('/login')}
                            >
                                Đăng nhập
                            </NeumorphButton>
                        </motion.div>

                        {/* Trust Indicators */}
                        <motion.div
                            variants={fadeInUp}
                            className="flex flex-wrap justify-center items-center gap-8 mb-20"
                        >
                            {[
                                { icon: Shield, label: 'Bảo mật cấp doanh nghiệp', color: 'text-emerald-500' },
                                { icon: Clock, label: 'Đồng bộ thời gian thực', color: 'text-blue-500' },
                                { icon: Zap, label: 'Hiệu năng vượt trội', color: 'text-[#FFD35B]' }
                            ].map((item, index) => (
                                <div key={index} className="flex items-center text-[#9FA2A7] bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl px-4 py-2 shadow-lg">
                                    <div className="mr-3 p-2 bg-white/30 rounded-lg">
                                        <item.icon className={`h-5 w-5 ${item.color}`} />
                                    </div>
                                    <span className="font-medium">{item.label}</span>
                                </div>
                            ))}
                        </motion.div>

                        {/* Decorative separator */}
                        <div className="mx-auto h-px w-32 bg-gradient-to-r from-transparent via-[#FFD35B]/50 to-transparent" />
                    </motion.div>
                </div>
            </div>

            {/* Features Section */}
            <div className="py-20 sm:py-24 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        className="text-center mb-16"
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                    >
                        <motion.h2
                            variants={fadeInUp}
                            className="text-4xl sm:text-5xl font-bold text-[#222325] mb-6"
                        >
                            Đầy đủ công cụ để đội ngũ của bạn
                            <span className="bg-gradient-to-r from-[#FFD35B] to-[#FFA726] bg-clip-text text-transparent"> bứt phá</span>
                        </motion.h2>
                        <motion.p
                            variants={fadeInUp}
                            className="text-xl text-[#9FA2A7] max-w-3xl mx-auto leading-relaxed"
                        >
                            Tính năng <span className="text-[#222325] font-semibold">mạnh mẽ – dễ dùng</span> giúp cộng tác nhịp nhàng và giao hàng nhanh hơn, đúng hơn.
                        </motion.p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Target,
                                title: 'Quản trị nhiệm vụ thông minh',
                                description: 'Ưu tiên thông minh, hạn chót rõ ràng, theo dõi tiến độ trực quan. Không bỏ lỡ deadline, không lệch nhịp sprint.',
                                iconColor: 'text-[#FFD35B]',
                                gradient: 'from-[#FFD35B]/10 to-[#FFA726]/10'
                            },
                            {
                                icon: Users,
                                title: 'Cộng tác đội ngũ chuyên nghiệp',
                                description: 'Giao việc, chia sẻ cập nhật, nắm bắt tiến độ thời gian thực. Tất cả cùng nhìn một sự thật.',
                                iconColor: 'text-blue-500',
                                gradient: 'from-blue-500/10 to-blue-600/10'
                            },
                            {
                                icon: BarChart3,
                                title: 'Phân tích & báo cáo nâng cao',
                                description: 'Insight chi tiết về năng suất và tắc nghẽn. Ra quyết định dựa trên dữ liệu, tối ưu từng sprint.',
                                iconColor: 'text-emerald-500',
                                gradient: 'from-emerald-500/10 to-emerald-600/10'
                            },
                            {
                                icon: Globe,
                                title: 'Tích hợp đa nền tảng',
                                description: 'Kết nối mọi công cụ bạn đang dùng. API mạnh mẽ, webhook thông minh, sync đa hướng.',
                                iconColor: 'text-purple-500',
                                gradient: 'from-purple-500/10 to-purple-600/10'
                            },
                            {
                                icon: Shield,
                                title: 'Bảo mật doanh nghiệp',
                                description: 'Mã hóa end-to-end, kiểm soát truy cập chi tiết, tuân thủ GDPR và ISO 27001.',
                                iconColor: 'text-red-500',
                                gradient: 'from-red-500/10 to-red-600/10'
                            },
                            {
                                icon: Zap,
                                title: 'Hiệu năng siêu tốc',
                                description: 'Load trang dưới 0.5s, sync real-time, uptime 99.9%. Trải nghiệm mượt mà như ứng dụng native.',
                                iconColor: 'text-[#FFD35B]',
                                gradient: 'from-[#FFD35B]/10 to-[#FFA726]/10'
                            }
                        ].map((feature, index) => (
                            <GlassCard key={index} delay={index * 0.1} className="group">
                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                    <feature.icon className={`h-8 w-8 ${feature.iconColor}`} />
                                </div>
                                <h3 className="text-xl font-bold text-[#222325] mb-4">{feature.title}</h3>
                                <p className="text-[#9FA2A7] leading-relaxed">
                                    {feature.description}
                                </p>
                            </GlassCard>
                        ))}
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            <div className="py-20 sm:py-24 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        className="text-center mb-16"
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-4xl sm:text-5xl font-bold text-[#222325] mb-6">
                            Được tin dùng trên toàn cầu
                        </h2>
                        <p className="text-xl text-[#9FA2A7] max-w-2xl mx-auto">
                            Gia nhập cộng đồng đội ngũ đang tăng tốc cùng chúng tôi.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { value: users, suffix: '+', label: 'Người dùng hoạt động', icon: Users },
                            { value: tasks, suffix: '+', label: 'Nhiệm vụ hoàn thành', icon: CheckCircle },
                            { value: companies, suffix: '+', label: 'Doanh nghiệp tin dùng', icon: Award },
                            { value: '99,9', suffix: '%', label: 'Thời gian sẵn sàng', icon: TrendingUp }
                        ].map((stat, index) => (
                            <GlassCard key={index} delay={index * 0.1} className="text-center">
                                <div className="mb-4">
                                    <stat.icon className="h-8 w-8 text-[#FFD35B] mx-auto mb-3" />
                                </div>
                                <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-[#FFD35B] to-[#FFA726] bg-clip-text text-transparent mb-2">
                                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}{stat.suffix}
                                </div>
                                <div className="text-[#9FA2A7] font-medium">{stat.label}</div>
                            </GlassCard>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="py-20 sm:py-24 relative">
                <div className="max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8">
                    <GlassCard className="bg-gradient-to-r from-[#FFD35B]/10 to-[#FFA726]/10 border-[#FFD35B]/30">
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="flex justify-center mb-8">
                                <div className="p-4 bg-gradient-to-r from-[#FFD35B] to-[#FFA726] rounded-2xl shadow-lg">
                                    <Star className="h-8 w-8 text-white" />
                                </div>
                            </div>
                            <h2 className="text-4xl sm:text-5xl font-bold text-[#222325] mb-6">
                                Sẵn sàng nâng cấp quy trình?
                            </h2>
                            <p className="text-xl text-[#9FA2A7] mb-10 max-w-2xl mx-auto">
                                Dùng thử miễn phí ngay hôm nay.
                                <span className="text-[#222325] font-semibold"> Không cần thẻ tín dụng.</span>
                            </p>
                            <div className="flex flex-col sm:flex-row gap-6 justify-center">
                                <NeumorphButton
                                    variant="primary"
                                    onClick={() => navigate('/register')}
                                >
                                    <span className="flex items-center">
                                        Bắt đầu dùng thử
                                        <ArrowRight className="ml-3 h-5 w-5" />
                                    </span>
                                </NeumorphButton>
                                <NeumorphButton
                                    variant="secondary"
                                    onClick={() => navigate('/login')}
                                >
                                    Đăng nhập
                                </NeumorphButton>
                            </div>
                        </motion.div>
                    </GlassCard>
                </div>
            </div>

            {/* Footer */}
            <footer className="relative py-16 border-t border-white/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <GlassCard className="text-center">
                        <div className="flex justify-center mb-6">
                            <div className="flex items-center space-x-3">
                                <span className="text-3xl font-bold bg-gradient-to-r from-[#222325] to-[#3A3B3D] bg-clip-text text-transparent">
                                    Stratix
                                </span>
                            </div>
                        </div>
                        <p className="text-[#9FA2A7] mb-8 text-lg">Kiến tạo tương lai năng suất đội ngũ</p>

                        <div className="flex flex-wrap justify-center gap-8 mb-8 text-[#9FA2A7]">
                            {['Chính sách bảo mật', 'Điều khoản sử dụng', 'Hỗ trợ', 'Blog', 'API Documentation'].map((link, index) => (
                                <a
                                    key={index}
                                    href="#"
                                    className="hover:text-[#222325] transition-colors font-medium"
                                >
                                    {link}
                                </a>
                            ))}
                        </div>

                        <div className="pt-8 border-t border-white/20">
                            <p className="text-[#9FA2A7]">© 2025 Stratix. Bảo lưu mọi quyền.</p>
                        </div>
                    </GlassCard>
                </div>
            </footer>

            {/* Custom animations */}
            <style jsx>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 8s linear infinite;
                }
            `}</style>
        </div>
    );
}