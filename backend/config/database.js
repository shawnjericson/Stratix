const { Pool } = require('pg');
require('dotenv').config();

// Cấu hình kết nối PostgreSQL với connection pooling limits
const pool = new Pool({
  host: process.env.DB_HOST,
  port: 5432,
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_HOST.includes('supabase.com') ? { rejectUnauthorized: false } : false,

  // 🔥 QUAN TRỌNG: Giới hạn connections cho Supabase
  max: 2, // Tối đa 2 connections (Supabase free tier rất hạn chế)
  min: 0, // Tối thiểu 0 connections
  idleTimeoutMillis: 10000, // 10 giây idle timeout
  connectionTimeoutMillis: 5000, // 5 giây connection timeout
  acquireTimeoutMillis: 5000, // 5 giây acquire timeout
});

// Test kết nối database
pool.on('connect', (client) => {
  console.log('✅ Database client connected');
});

pool.on('error', (err) => {
  console.error('❌ Database pool error:', err.message);
  // Không exit process, để server tiếp tục chạy
});

pool.on('acquire', () => {
  console.log('🔗 Database connection acquired from pool');
});

pool.on('release', () => {
  console.log('🔓 Database connection released back to pool');
});

// Utility function để thực hiện query
const query = async (text, params) => {
  const start = Date.now();
  let client;

  try {
    client = await pool.connect();
    const result = await client.query(text, params);
    const duration = Date.now() - start;

    // Log query trong development mode
    if (process.env.NODE_ENV === 'development') {
      console.log(`📝 Query executed in ${duration}ms:`, text.substring(0, 100));
    }

    return result;
  } catch (error) {
    console.error('❌ Database query error:', error.message);

    // Nếu lỗi max clients, thử lại sau 1 giây
    if (error.message.includes('max clients') || error.message.includes('MaxClientsInSessionMode')) {
      console.log('⏳ Max clients reached, waiting and retrying...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      throw new Error('Database temporarily unavailable - too many connections');
    }

    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Utility function để thực hiện transaction
const transaction = async (callback) => {
  let client;

  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Kiểm tra kết nối database khi khởi động
const checkConnection = async () => {
  try {
    console.log('🔍 Testing database connection...');

    const result = await query('SELECT NOW() as current_time, version() as db_version');

    console.log('🎉 Database connection test successful');
    console.log('⏰ Database time:', result.rows[0].current_time);
    console.log('📊 Database version:', result.rows[0].db_version.split(' ')[0]);

    return true;
  } catch (error) {
    console.error('💥 Database connection test failed:', error.message);

    // Nếu lỗi max clients, suggest fix
    if (error.message.includes('max clients') || error.message.includes('MaxClientsInSessionMode')) {
      console.error('🚨 Supabase connection pool is full!');
      console.error('💡 Try restarting your Supabase project or wait a few minutes');
      console.error('💡 Or reduce the number of concurrent connections');
    }

    return false;
  }
};

// Function để đóng pool gracefully
const closePool = async () => {
  try {
    console.log('🔄 Closing database pool...');
    await pool.end();
    console.log('✅ Database pool closed successfully');
  } catch (error) {
    console.error('❌ Error closing database pool:', error.message);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closePool();
  process.exit(0);
});

module.exports = {
  pool,
  query,
  transaction,
  checkConnection,
  closePool
};