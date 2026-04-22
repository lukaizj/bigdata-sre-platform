export const ROLE = {
  USER: 'user',
  ADMIN: 'admin'
}

export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  ACTIVE_MENU: 'activeMenu',
  CHAT_SELECTED_SKILLS: 'chat_selected_skills',
  CHAT_SELECTED_AGENT: 'chat_selected_agent',
  CHAT_SELECTED_MODEL: 'chat_selected_model',
  MCP_TOOLS: 'mcp-tools'
}

// 普通用户默认可见的模块
export const DEFAULT_USER_PERMISSIONS = ['guide', 'chat', 'dashboard', 'users']