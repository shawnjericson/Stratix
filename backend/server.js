const express = require('express');// Thêm task routes
// app.use('/api/roles', roleRoutes); // Sẽ thconst express = require('express');
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
const taskRoutes = require('./routes/tasks'); // Thêm task routes

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware cơ bản
app.use(helmet()); // Security headers
app.use(morgan('combined')); // HTTP request logging

// CORS configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests',
        message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use('/api', limiter);

// Trust proxy (nếu deploy đằng sau reverse proxy như nginx)
app.set('trust proxy', 1);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes); // Thêm task routes
// app.use('/api/roles', roleRoutes); // Sẽ thêm sau
// app.use('/api/departments', departmentRoutes); // Sẽ thêm sau

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'TaskMaster API Server',
        version: '1.0.0',
        documentation: '/api/docs', // Có thể thêm Swagger docs sau
        endpoints: {
            auth: '/api/auth',
            users: '/api/users',
            tasks: '/api/tasks',
            // roles: '/api/roles',
            // departments: '/api/departments'
        }
    });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: 'Không tìm thấy endpoint này',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Global error handler:', error);

    // Mongoose validation error
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation Error',
            message: 'Dữ liệu không hợp lệ',
            details: Object.values(error.errors).map(e => e.message)
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

    // Database errors
    if (error.code === '23505') { // PostgreSQL unique constraint violation
        return res.status(409).json({
            error: 'Duplicate Entry',
            message: 'Dữ liệu đã tồn tại'
        });
    }

    if (error.code === '23503') { // PostgreSQL foreign key constraint violation
        return res.status(400).json({
            error: 'Invalid Reference',
            message: 'Tham chiếu dữ liệu không hợp lệ'
        });
    }

    // Default error response
    res.status(error.status || 500).json({
        error: error.name || 'Internal Server Error',
        message: process.env.NODE_ENV === 'production'
            ? 'Có lỗi xảy ra, vui lòng thử lại sau'
            : error.message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
});

// Graceful shutdown handler
const gracefulShutdown = (signal) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);

    const server = app.listen(PORT);

    server.close(() => {
        console.log('HTTP server closed.');

        // Close database connections
        // pool.end() // Uncomment when using connection pool

        console.log('Database connections closed.');
        process.exit(0);
    });

    // Force close server after 30s
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 30000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Start server
const startServer = async () => {
    try {
        // Kiểm tra kết nối database trước khi start server
        const dbConnected = await checkConnection();

        if (!dbConnected) {
            console.error('❌ Cannot start server: Database connection failed');
            process.exit(1);
        }

        const server = app.listen(PORT, () => {
            console.log(`
🚀 TaskMaster API Server đang chạy!
📡 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
📊 Database: PostgreSQL
🔐 CORS: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}
⏰ Started at: ${new Date().toLocaleString('vi-VN')}

📋 Available endpoints:
   • Health: GET  /health
   • Auth:   POST /api/auth/login
   • Users:  GET  /api/users
   
🔍 Documentation: http://localhost:${PORT}
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

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server
startServer();