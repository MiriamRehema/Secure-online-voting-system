// src/utils/crypto.js
const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getKey() {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      "ENCRYPTION_KEY is not defined. Check your environment configuration."
    );
  }

  const bufferKey = Buffer.from(key, "hex");

  if (bufferKey.length !== 32) {
    throw new Error(
      "ENCRYPTION_KEY must be 64 hex characters (32 bytes for AES-256)."
    );
  }

  return bufferKey;
}

// Encrypt face descriptor
function encryptDescriptor(descriptor) {
  const KEY = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([
    cipher.update(descriptor, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return JSON.stringify({
    iv: iv.toString("hex"),
    content: encrypted.toString("hex"),
    tag: authTag.toString("hex"),
  });
}

// Decrypt face descriptor
function decryptDescriptor(encryptedData) {
  const KEY = getKey();
  const json = JSON.parse(encryptedData);

  const iv = Buffer.from(json.iv, "hex");
  const content = Buffer.from(json.content, "hex");
  const tag = Buffer.from(json.tag, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(content), decipher.final()]);

  return decrypted.toString("utf8"); // will be JSON string of array
}

module.exports = { encryptDescriptor, decryptDescriptor };
