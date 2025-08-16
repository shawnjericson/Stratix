// components/Common/GoldenDustBackground.jsx
import React, { useRef, useEffect } from 'react';

const GoldenDustBackground = React.memo(() => {
    const canvasRef = useRef(null);
    const rafRef = useRef(null);
    const particlesRef = useRef([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

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
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
            ro.disconnect();
        };
    }, []); // Chỉ chạy một lần khi mount

    return (
        <div className="absolute inset-0">
            <canvas ref={canvasRef} className="w-full h-full" />
            <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-black/30 to-transparent pointer-events-none" />
        </div>
    );
});

GoldenDustBackground.displayName = 'GoldenDustBackground';

export default GoldenDustBackground;