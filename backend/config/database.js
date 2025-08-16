const { Pool } = require('pg');
require('dotenv').config();

// Cấu hình kết nối PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST, // your-project.supabase.co
  port: 5432,
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD, // Supabase database password
  ssl: process.env.DB_HOST.includes('supabase.com') ? { rejectUnauthorized: false } : false
});

// Test kết nối database
pool.on('connect', () => {
  console.log('✅ Database connected successfully');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
  process.exit(-1);
});

// Utility function để thực hiện query
const query = async (text, params) => {
  const start = Date.now();
  const client = await pool.connect();

  try {
    const result = await client.query(text, params);
    const duration = Date.now() - start;

    // Log query trong development mode
    if (process.env.NODE_ENV === 'development') {
      console.log(`📝 Query executed in ${duration}ms:`, text.substring(0, 100));
    }

    return result;
  } catch (error) {
    console.error('❌ Database query error:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Utility function để thực hiện transaction
const transaction = async (callback) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Kiểm tra kết nối database khi khởi động
const checkConnection = async () => {
  try {
    await query('SELECT NOW()');
    console.log('🎉 Database connection test successful');
    return true;
  } catch (error) {
    console.error('💥 Database connection test failed:', error.message);
    return false;
  }
};

module.exports = {
  pool,
  query,
  transaction,
  checkConnection
};
