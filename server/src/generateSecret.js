const crypto = require('crypto');

// Generate a secure random 64-byte hexadecimal string
const jwtSecret = crypto.randomBytes(64).toString('hex');

console.log(jwtSecret);