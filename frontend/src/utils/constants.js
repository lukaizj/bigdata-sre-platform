/**
 * 前端常量定义
 * 避免字符串类型问题
 */

export const THEME = {
  LIGHT: 'light',
  DARK: 'dark'
}

export const ROLE = {
  USER: 'user',
  ADMIN: 'admin'
}

export const STORAGE_KEYS = {
  THEME: 'theme',
  TOKEN: 'token',
  USER: 'user',
  ACTIVE_MENU: 'activeMenu',
  CHAT_SELECTED_SKILLS: 'chat_selected_skills',
  CHAT_SELECTED_AGENT: 'chat_selected_agent',
  CHAT_SELECTED_MODEL: 'chat_selected_model'
}

// 普通用户默认可见的模块
export const DEFAULT_USER_PERMISSIONS = ['guide', 'chat', 'dashboard', 'users']