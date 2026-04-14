const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// 从环境变量获取密钥，如果不存在则生成一个（仅开发环境）
const getMasterKey = () => {
  const key = process.env.ENCRYPTION_KEY;
  if (key) {
    if (key.length !== 64 || !/^[0-9a-fA-F]+$/.test(key)) {
      throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
    }
    return Buffer.from(key, 'hex');
  }
  // 生产环境必须设置密钥
  if (process.env.NODE_ENV === 'production') {
    throw new Error('ENCRYPTION_KEY environment variable is required in production');
  }
  // 开发环境：生成随机密钥并警告
  console.warn('WARNING: ENCRYPTION_KEY not set, using random key (data will be lost on restart)');
  return crypto.randomBytes(KEY_LENGTH);
};

let masterKey = null;

// 延迟获取密钥，允许测试时先设置环境变量
const getOrCreateMasterKey = () => {
  if (!masterKey) {
    masterKey = getMasterKey();
  }
  return masterKey;
};

// 用于测试重置密钥
const resetKey = () => {
  masterKey = null;
};

/**
 * 加密文本
 * @param {string} text - 明文
 * @returns {string} - 加密后的密文（hex格式）
 */
function encrypt(text) {
  if (!text) return '';

  const key = getOrCreateMasterKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

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
    const key = getOrCreateMasterKey();
    const parts = encryptedText.split(':');
    if (parts.length !== 3) return '';

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (err) {
    console.error('Decryption failed:', {
      error: err.message,
      inputLength: encryptedText?.length,
      hasCorrectFormat: encryptedText?.split(':').length === 3
    });
    return '';
  }
}

module.exports = { encrypt, decrypt, resetKey };