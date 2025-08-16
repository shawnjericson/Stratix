// test-connection.js (tạo trong thư mục backend)
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
});

async function testConnection() {
    console.log('🚀 Testing Supabase connection...');
    console.log('Host:', process.env.DB_HOST);
    console.log('User:', process.env.DB_USER);

    try {
        // Test basic connection
        const client = await pool.connect();
        console.log('✅ Connected successfully!');

        // Test query
        const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
        console.log('📅 Current time:', result.rows[0].current_time);
        console.log('🐘 PostgreSQL version:', result.rows[0].postgres_version);

        // Test if tables exist (nếu đã import schema)
        const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

        if (tables.rows.length > 0) {
            console.log('📋 Tables found:');
            tables.rows.forEach(row => console.log('  -', row.table_name));
        } else {
            console.log('📋 No tables found (need to import schema)');
        }

        client.release();
        console.log('🎉 Connection test successful!');

    } catch (error) {
        console.error('❌ Connection failed:');
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);

        if (error.code === 'ENOTFOUND') {
            console.log('💡 Suggestion: Check DB_HOST');
        } else if (error.code === '28P01') {
            console.log('💡 Suggestion: Check DB_PASSWORD');
        } else if (error.code === '3D000') {
            console.log('💡 Suggestion: Check DB_NAME');
        }
    } finally {
        await pool.end();
    }
}

testConnection();