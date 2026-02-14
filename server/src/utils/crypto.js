const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, "utf8"); // 32 bytes
const IV = Buffer.alloc(16, 0); // initialization vector

function encryptDescriptor(descriptor) {
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, IV);
  let encrypted = cipher.update(JSON.stringify(descriptor), "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

function decryptDescriptor(encrypted) {
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, IV);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return JSON.parse(decrypted);
}

module.exports = { encryptDescriptor, decryptDescriptor };
