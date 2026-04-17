'use strict';

// 内存验证码存储，key = captchaId，value = { answer, expireAt }
const store = new Map();
const TTL_MS = 5 * 60 * 1000; // 5 分钟

// 清理过期条目（防止内存泄漏）
function cleanup() {
  const now = Date.now();
  for (const [id, entry] of store) {
    if (now > entry.expireAt) store.delete(id);
  }
}
const _cleanupTimer = setInterval(cleanup, 60 * 1000);
_cleanupTimer.unref(); // 不阻止进程/测试退出

/**
 * 存储验证码
 * @param {string} id
 * @param {string} answer  原始答案（大小写不敏感，统一转小写存储）
 */
function set(id, answer) {
  if (!id || !answer) throw new TypeError('captchaStore.set: id and answer are required');
  store.set(id, { answer: answer.toLowerCase(), expireAt: Date.now() + TTL_MS });
}

/**
 * 校验验证码（一次性，校验后删除）
 * @param {string} id
 * @param {string} code  用户输入
 * @returns {{ valid: boolean, reason?: 'expired'|'wrong'|'missing' }}
 */
function verify(id, code) {
  if (!id || !code) return { valid: false, reason: 'missing' };

  const entry = store.get(id);
  if (!entry) return { valid: false, reason: 'expired' };

  if (Date.now() > entry.expireAt) {
    store.delete(id);
    return { valid: false, reason: 'expired' };
  }

  store.delete(id); // 一次性，无论对错都删除
  if (entry.answer !== code.toLowerCase()) return { valid: false, reason: 'wrong' };
  return { valid: true };
}

module.exports = { set, verify };
