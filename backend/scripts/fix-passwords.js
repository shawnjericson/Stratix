const { Pool } = require('pg');
const { hashPassword } = require('../utils/password');
require('dotenv').config();

const PLACEHOLDER = '$2b$10$example_hashed_password';
const PASSWORDS = {
    'admin@taskmaster.com': 'Admin@123',
    'director@taskmaster.com': 'Director@123',
    'manager.tech@taskmaster.com': 'Manager@123',
    'manager.marketing@taskmaster.com': 'Manager@123',
    'emp01@taskmaster.com': 'Emp@123',
    'emp02@taskmaster.com': 'Emp@123',
    'emp03@taskmaster.com': 'Emp@123',
};

const pool = new Pool({
    host: process.env.DB_HOST,
    port: +process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

(async () => {
    const client = await pool.connect();
    try {
        const { rows } = await client.query('SELECT id, email, password_hash FROM users');
        for (const r of rows) {
            if (r.password_hash === PLACEHOLDER) {
                const email = String(r.email).toLowerCase();
                const raw = PASSWORDS[email] || 'ChangeMe@123';
                const hash = await hashPassword(raw);
                await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, r.id]);
                console.log(`✅ ${email} đặt lại mật khẩu: ${raw}`);
            } else {
                console.log(`⏩ Bỏ qua ${r.email} (đã có hash thật)`);
            }
        }
        console.log('🎉 Hoàn tất');
    } catch (e) {
        console.error('❌ Error:', e);
    } finally {
        client.release();
        await pool.end();
    }
})();
