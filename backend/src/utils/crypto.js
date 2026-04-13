const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// 从环境变量获取密钥，如果不存在则生成一个（仅开发环境）
const getMasterKey = () => {
  const key = process.env.ENCRYPTION_KEY;
  if (key) {
    return Buffer.from(key, 'hex');
  }
  // 开发环境：生成随机密钥并警告
  console.warn('WARNING: ENCRYPTION_KEY not set, using random key (data will be lost on restart)');
  return crypto.randomBytes(KEY_LENGTH);
};

const masterKey = getMasterKey();

/**
 * 加密文本
 * @param {string} text - 明文
 * @returns {string} - 加密后的密文（hex格式）
 */
function encrypt(text) {
  if (!text) return '';

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, masterKey, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // 格式: iv:authTag:encryptedData
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

/**
 * 解密密文
 * @param {string} encryptedText - 密文（hex格式）
 * @returns {string} - 明文
 */
function decrypt(encryptedText) {
  if (!encryptedText) return '';

  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) return '';

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, masterKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (err) {
    console.error('Decryption failed:', err.message);
    return '';
  }
}

module.exports = { encrypt, decrypt };