/**
 * 主题管理工具
 * 统一处理主题切换和存储逻辑
 */

/**
 * 获取已保存的主题
 * @returns {string} 'light' 或 'dark'
 */
export function getSavedTheme() {
  return localStorage.getItem('theme') || 'light'
}

/**
 * 设置主题
 * @param {string} theme - 'light' 或 'dark'
 */
export function setTheme(theme) {
  localStorage.setItem('theme', theme)
  document.documentElement.setAttribute('data-theme', theme)
}

/**
 * 初始化主题（应用已保存的主题）
 */
export function initTheme() {
  const savedTheme = getSavedTheme()
  setTheme(savedTheme)
  return savedTheme
}