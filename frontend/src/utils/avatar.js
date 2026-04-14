/**
 * 用户头像工具
 * 统一处理用户头像首字母生成
 */

/**
 * 获取用户头像首字母
 * @param {Object|string} user - 用户对象或用户名
 * @returns {string} 首字母（大写）
 */
export function getAvatarChar(user) {
  if (!user) return 'U'
  const username = typeof user === 'string' ? user : user.username
  return username?.charAt(0)?.toUpperCase() || 'U'
}