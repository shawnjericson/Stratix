const bcrypt = require('bcryptjs');
const ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 12);
exports.hashPassword = (plain) => bcrypt.hash(plain, ROUNDS);
exports.verifyPassword = (plain, hash) => bcrypt.compare(plain, hash);