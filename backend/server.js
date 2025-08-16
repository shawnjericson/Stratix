const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import database config
const { checkConnection } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const taskRoutes = require('./routes/tasks');

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for Vercel
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

// HTTP request logging
app.use(morgan('combined'));

// CORS configuration for Vercel deployment
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    process.env.CORS_ORIGIN,
    // Specific frontend domains
    'https://stratix-sand.vercel.app',
    'https://stratixbackend.vercel.app',
    // Vercel patterns
    /^https:\/\/.*\.vercel\.app$/,
    /^https:\/\/.*-.*\.vercel\.app$/,
    // Custom domain if any
    process.env.FRONTEND_URL
].filter(Boolean); // Remove undefined values

app.use(cors({
    origin: function (origin, callback) {
        console.log('🌐 Request origin:', origin);

        // Allow requests with no origin (mobile apps, curl requests, Postman)
        if (!origin) {
            console.log('✅ Allowing request with no origin');
            return callback(null, true);
        }

        // Check if origin is allowed
        const isAllowed = allowedOrigins.some(allowedOrigin => {
            if (typeof allowedOrigin === 'string') {
                return allowedOrigin === origin;
            }
            if (allowedOrigin instanceof RegExp) {
                return allowedOrigin.test(origin);
            }
            return false;
        });

        if (isAllowed) {
            console.log('✅ CORS allowed for origin:', origin);
            callback(null, true);
        } else {
            console.log('❌ CORS blocked origin:', origin);
            console.log('📋 Allowed origins:', allowedOrigins);
            callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Cache-Control',
        'X-File-Name'
    ],
    exposedHeaders: ['X-Total-Count'],
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

// Handle preflight requests
app.options('*', cors());

// Body parsing middleware
app.use(express.json({
    limit: '10mb',
    type: ['application/json', 'text/plain']
}));
app.use(express.urlencoded({
    extended: true,
    limit: '10mb'
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
        error: 'Too many requests',
        message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting for health checks
    skip: (req) => req.path === '/health'
});

// Apply rate limiting to API routes only
app.use('/api', limiter);

// Health check endpoint (before other routes)
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        cors: {
            allowedOrigins: process.env.NODE_ENV === 'development' ? allowedOrigins : ['Production domains configured']
        }
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'TaskMaster API Server',
        version: '1.0.0',
        status: 'running',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        endpoints: {
            health: '/health',
            auth: '/api/auth',
            users: '/api/users',
            tasks: '/api/tasks'
        },
        cors: {
            enabled: true,
            allowedOrigins: process.env.NODE_ENV === 'development' ? allowedOrigins : ['Production domains configured']
        }
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        error: 'API Endpoint not found',
        message: 'Không tìm thấy API endpoint này',
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
    });
});

// 404 handler for other routes
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        message: 'Không tìm thấy route này',
        path: req.originalUrl,
        method: req.method,
        availableRoutes: [
            'GET /',
            'GET /health',
            'POST /api/auth/login',
            'POST /api/auth/register',
            'GET /api/users',
            'GET /api/tasks'
        ]
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('🚨 Global error handler:', {
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
        ip: req.ip
    });

    // CORS Error
    if (error.message && error.message.includes('CORS')) {
        return res.status(403).json({
            error: 'CORS Error',
            message: 'Domain không được phép truy cập API này',
            origin: req.get('Origin'),
            timestamp: new Date().toISOString()
        });
    }

    // Mongoose validation error
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation Error',
            message: 'Dữ liệu không hợp lệ',
            details: Object.values(error.errors).map(e => e.message),
            timestamp: new Date().toISOString()
        });
    }

    // JWT errors
    if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'Invalid Token',
            message: 'Token không hợp lệ',
            timestamp: new Date().toISOString()
        });
    }

    if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: 'Token Expired',
            message: 'Token đã hết hạn',
            timestamp: new Date().toISOString()
        });
    }

    // PostgreSQL errors
    if (error.code === '23505') {
        return res.status(409).json({
            error: 'Duplicate Entry',
            message: 'Dữ liệu đã tồn tại',
            timestamp: new Date().toISOString()
        });
    }

    if (error.code === '23503') {
        return res.status(400).json({
            error: 'Invalid Reference',
            message: 'Tham chiếu dữ liệu không hợp lệ',
            timestamp: new Date().toISOString()
        });
    }

    // Default error response
    const statusCode = error.status || error.statusCode || 500;
    res.status(statusCode).json({
        error: error.name || 'Internal Server Error',
        message: process.env.NODE_ENV === 'production'
            ? 'Có lỗi xảy ra, vui lòng thử lại sau'
            : error.message,
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && {
            stack: error.stack
        })
    });
});

// Graceful shutdown handler
const gracefulShutdown = (signal) => {
    console.log(`\n📡 ${signal} received. Starting graceful shutdown...`);

    const server = app.listen(PORT);

    server.close((err) => {
        if (err) {
            console.error('❌ Error during server shutdown:', err);
            process.exit(1);
        }

        console.log('✅ HTTP server closed.');
        console.log('✅ Database connections closed.');
        console.log('🏁 Graceful shutdown completed.');
        process.exit(0);
    });

    // Force close server after 30s
    setTimeout(() => {
        console.error('⏰ Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 30000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🚫 Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Start server function
const startServer = async () => {
    try {
        console.log('🚀 Starting TaskMaster API Server...');

        // Check database connection
        const dbConnected = await checkConnection();
        if (!dbConnected) {
            console.error('❌ Cannot start server: Database connection failed');
            process.exit(1);
        }

        // Start server
        const server = app.listen(PORT, () => {
            const isProduction = process.env.NODE_ENV === 'production';

            console.log(`
🎉 TaskMaster API Server is running!
📡 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
📊 Database: PostgreSQL (Supabase)
🔐 CORS Origins: ${isProduction ? 'Production configured' : 'Development + Vercel'}
⏰ Started at: ${new Date().toLocaleString('vi-VN')}

📋 Available endpoints:
   • Health:     GET  /health
   • Root:       GET  /
   • Auth:       POST /api/auth/login
   • Register:   POST /api/auth/register
   • Users:      GET  /api/users
   • Tasks:      GET  /api/tasks

🔍 Server URL: ${isProduction ? 'https://stratixbackend.vercel.app' : `http://localhost:${PORT}`}
🐛 Debug CORS: Check console logs for origin requests
            `);
        });

        // Handle server errors
        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`❌ Port ${PORT} is already in use`);
            } else {
                console.error('❌ Server error:', error);
            }
            process.exit(1);
        });

        return server;

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Export app for Vercel
module.exports = app;

// Start server only if not in Vercel environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    startServer();
}