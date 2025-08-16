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
app.use(helmet());

// HTTP request logging
app.use(morgan('combined'));

// CORS configuration - SIMPLE VERSION
const allowedOrigins = [
    'http://localhost:3000',
    'https://stratix-sand.vercel.app',
    'https://stratixbackend.vercel.app'
];

app.use(cors({
    origin: function (origin, callback) {
        console.log('🌐 Request origin:', origin);

        // Allow requests with no origin
        if (!origin) {
            console.log('✅ Allowing request with no origin');
            return callback(null, true);
        }

        // Check if origin is allowed
        if (allowedOrigins.includes(origin) || /^https:\/\/.*\.vercel\.app$/.test(origin)) {
            console.log('✅ CORS allowed for origin:', origin);
            callback(null, true);
        } else {
            console.log('❌ CORS blocked origin:', origin);
            callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests
app.options('*', cors());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
        error: 'Too many requests',
        message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        cors: allowedOrigins
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'TaskMaster API Server',
        version: '1.0.0',
        status: 'running',
        environment: process.env.NODE_ENV || 'development',
        endpoints: {
            health: '/health',
            auth: '/api/auth',
            users: '/api/users',
            tasks: '/api/tasks'
        },
        cors: {
            allowedOrigins: allowedOrigins
        }
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);

// Simple 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: 'Endpoint không tồn tại',
        path: req.originalUrl
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Global error handler:', error);

    // CORS Error
    if (error.message && error.message.includes('CORS')) {
        return res.status(403).json({
            error: 'CORS Error',
            message: 'Domain không được phép truy cập',
            origin: req.get('Origin')
        });
    }

    // JWT errors
    if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'Invalid Token',
            message: 'Token không hợp lệ'
        });
    }

    if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: 'Token Expired',
            message: 'Token đã hết hạn'
        });
    }

    // Default error response
    res.status(error.status || 500).json({
        error: error.name || 'Internal Server Error',
        message: process.env.NODE_ENV === 'production'
            ? 'Có lỗi xảy ra, vui lòng thử lại sau'
            : error.message
    });
});

// Start server
const startServer = async () => {
    try {
        const dbConnected = await checkConnection();
        if (!dbConnected) {
            console.error('❌ Database connection failed');
            process.exit(1);
        }

        const server = app.listen(PORT, () => {
            console.log(`
🚀 TaskMaster API Server running!
📡 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
🔐 CORS: ${allowedOrigins.join(', ')}
            `);
        });

        server.on('error', (error) => {
            console.error('❌ Server error:', error);
            process.exit(1);
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Export for Vercel
module.exports = app;

// Start server if not in Vercel
if (!process.env.VERCEL) {
    startServer();
}

// Also export as default for Vercel compatibility
module.exports.default = app;