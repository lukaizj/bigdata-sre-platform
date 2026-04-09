<template>
  <!-- 登录页面 -->
  <LoginPage v-if="!isLoggedIn" @login-success="handleLoginSuccess" />

  <!-- 主应用 -->
  <div v-else class="app-wrapper" :data-theme="theme">
    <div class="theme-background"></div>

    <el-container class="main-container">
      <!-- 侧边栏 -->
      <el-aside width="260px" class="sidebar">
        <div class="logo-section">
          <div class="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M12 2v4m0 12v4M2 12h4m12 0h4"></path>
              <path d="M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"></path>
            </svg>
          </div>
          <div class="logo-text">
            <h1>大数据运维平台</h1>
            <span>Big Data SRE</span>
          </div>
        </div>

        <nav class="nav-menu">
          <div
            v-for="item in visibleMenuItems"
            :key="item.key"
            :class="['nav-item', { active: activeMenu === item.key }]"
            @click="activeMenu = item.key"
          >
            <div class="nav-icon" v-html="item.icon"></div>
            <span class="nav-label">{{ item.label }}</span>
          </div>
        </nav>

        <div class="sidebar-footer">
          <div class="status-badge">
            <span class="status-dot"></span>
            <span>系统运行中</span>
          </div>
        </div>
      </el-aside>

      <!-- 主内容区 -->
      <el-container class="content-wrapper">
        <el-header class="top-header">
          <div class="header-left">
            <h2>{{ currentPageTitle }}</h2>
          </div>
          <div class="header-right">
            <!-- 主题切换 -->
            <div class="header-theme-toggle">
              <button
                :class="['theme-btn', { active: theme === 'light' }]"
                @click="setTheme('light')"
                title="白天模式"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                </svg>
              </button>
              <button
                :class="['theme-btn', { active: theme === 'dark' }]"
                @click="setTheme('dark')"
                title="夜晚模式"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              </button>
            </div>

            <!-- 用户信息 -->
            <div class="header-user" @click="showUserMenu = !showUserMenu">
              <div class="user-avatar">{{ user?.username?.charAt(0)?.toUpperCase() || 'U' }}</div>
              <span class="user-name">{{ user?.username || '用户' }}</span>
              <div v-if="showUserMenu" class="user-dropdown">
                <div class="dropdown-item" @click="handleLogout">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  <span>退出登录</span>
                </div>
              </div>
            </div>
          </div>
        </el-header>

        <el-main class="main-content">
          <ChatView v-if="activeMenu === 'chat'" />
          <AgentManagement v-else-if="activeMenu === 'agents'" />
          <SkillManagement v-else-if="activeMenu === 'skills'" />
          <ClusterConfig v-else-if="activeMenu === 'config'" />
          <ClusterDashboard v-else-if="activeMenu === 'dashboard'" />
          <UserManagement v-else-if="activeMenu === 'users'" />
          <UserGuide v-else-if="activeMenu === 'guide'" @navigate="activeMenu = $event" />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'
import ChatView from './components/ChatView.vue'
import AgentManagement from './components/AgentManagement.vue'
import SkillManagement from './components/SkillManagement.vue'
import ClusterConfig from './components/ClusterConfig.vue'
import ClusterDashboard from './components/ClusterDashboard.vue'
import UserGuide from './components/UserGuide.vue'
import LoginPage from './components/LoginPage.vue'
import UserManagement from './components/UserManagement.vue'

const isLoggedIn = ref(false)
const user = ref(null)
const showUserMenu = ref(false)
const activeMenu = ref(localStorage.getItem('activeMenu') || 'chat')
const theme = ref('light')

const menuItems = [
  { key: 'guide', label: '使用说明', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>' },
  { key: 'chat', label: '智能对话', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>' },
  { key: 'dashboard', label: '集群仪表板', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M3 9h18M9 21V9"></path></svg>' },
  { key: 'agents', label: '智能体管理', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>' },
  { key: 'skills', label: '技能配置', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline></svg>' },
  { key: 'config', label: '集群配置', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path></svg>' },
  { key: 'users', label: '用户管理', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>' },
]

// 普通用户默认可见的模块
const defaultUserPermissions = ['guide', 'chat', 'dashboard', 'users']

const currentPageTitle = computed(() => {
  const item = menuItems.find(i => i.key === activeMenu.value)
  return item ? item.label : ''
})

const visibleMenuItems = computed(() => {
  // 管理员显示所有菜单
  if (user.value?.role === 'admin') {
    return menuItems
  }

  // 获取用户权限，如果没有配置则使用默认权限
  let permissions = user.value?.permissions
  if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
    permissions = defaultUserPermissions
  }

  // 根据权限过滤菜单
  return menuItems.filter(item => permissions.includes(item.key))
})

const setTheme = (newTheme) => {
  theme.value = newTheme
  localStorage.setItem('theme', newTheme)
  document.documentElement.setAttribute('data-theme', newTheme)
}

// 保存当前页面到 localStorage
watch(activeMenu, (newVal) => {
  localStorage.setItem('activeMenu', newVal)
})

const handleLoginSuccess = (userData) => {
  user.value = userData
  isLoggedIn.value = true
}

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  delete axios.defaults.headers.common['Authorization']
  isLoggedIn.value = false
  user.value = null
  showUserMenu.value = false
}

const checkAuth = async () => {
  const token = localStorage.getItem('token')
  const savedUser = localStorage.getItem('user')

  if (token && savedUser) {
    try {
      // 验证 token
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      const res = await axios.get('/api/auth/me')
      user.value = res.data.user
      // 更新 localStorage 中的用户信息
      localStorage.setItem('user', JSON.stringify(res.data.user))
      isLoggedIn.value = true
    } catch (err) {
      // Token 无效，清除登录状态
      handleLogout()
    }
  }
}

onMounted(() => {
  // 从 localStorage 读取主题设置
  const savedTheme = localStorage.getItem('theme') || 'light'
  theme.value = savedTheme
  document.documentElement.setAttribute('data-theme', savedTheme)

  // 检查登录状态
  checkAuth()
})
</script>

<style src="./styles/theme.css"></style>

<style scoped>
.app-wrapper {
  min-height: 100vh;
  padding: 0;
}

.main-container {
  height: 100vh;
  gap: 0;
}

/* ========== 侧边栏 ========== */
.sidebar {
  width: 220px !important;
  background: var(--bg-glass) !important;
  border: none;
  border-right: var(--border-glass);
  padding: 20px 12px;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

[data-theme="dark"] .sidebar {
  background: rgba(24, 24, 27, 0.85) !important;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}

.logo-section {
  padding: 0 8px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: var(--border-light);
  margin-bottom: 16px;
}

.logo-icon {
  width: 36px;
  height: 36px;
  background: var(--gradient-primary);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}
.logo-icon svg {
  width: 20px;
  height: 20px;
}

.logo-text h1 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.logo-text span {
  font-size: 11px;
  color: var(--text-muted);
}

/* 导航菜单 */
.nav-menu {
  flex: 1;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 2px;
  color: var(--text-muted);
  transition: all 0.2s ease;
}

.nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.nav-item.active {
  background: rgba(99, 102, 241, 0.15);
  color: var(--accent);
}

[data-theme="dark"] .nav-item.active {
  background: rgba(129, 140, 248, 0.2);
}

[data-theme="dark"] .nav-item:hover {
  background: rgba(63, 63, 70, 0.5);
}

.nav-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.nav-label {
  font-size: 13px;
  font-weight: 500;
}

/* 侧边栏底部 */
.sidebar-footer {
  padding-top: 12px;
  border-top: var(--border-light);
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--bg-hover);
  border-radius: 8px;
  font-size: 12px;
  color: var(--text-secondary);
}

/* 用户头像基础样式 */
.user-avatar {
  width: 28px;
  height: 28px;
  background: var(--gradient-primary);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 12px;
}

/* ========== 内容区 ========== */
.content-wrapper {
  background: transparent;
  display: flex;
  flex-direction: column;
}

.top-header {
  margin: 0;
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  height: 52px;
  background: var(--bg-glass);
  border-bottom: var(--border-glass);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

[data-theme="dark"] .top-header {
  background: rgba(24, 24, 27, 0.85) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.header-left h2 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 主题切换 */
.header-theme-toggle {
  display: flex;
  background: var(--bg-hover);
  border-radius: 8px;
  padding: 3px;
}

.header-theme-toggle .theme-btn {
  padding: 5px 7px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0.4;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-theme-toggle .theme-btn svg {
  width: 14px;
  height: 14px;
  color: var(--text-secondary);
}

.header-theme-toggle .theme-btn.active svg {
  color: white;
}

.header-theme-toggle .theme-btn:hover {
  opacity: 0.7;
}

.header-theme-toggle .theme-btn.active {
  background: var(--gradient-primary);
  opacity: 1;
}

/* 用户信息 */
.header-user {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  position: relative;
  padding: 4px 8px 4px 4px;
  border-radius: 8px;
  transition: background 0.2s ease;
}

.header-user:hover {
  background: var(--bg-hover);
}

.header-user .user-avatar {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  font-size: 10px;
}

.header-user .user-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
}

.header-user .user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 140px;
  background: var(--bg-card);
  border: var(--border-light);
  border-radius: 10px;
  padding: 6px;
  box-shadow: var(--shadow-lg);
  z-index: 100;
}

[data-theme="dark"] .header-user .user-dropdown {
  backdrop-filter: blur(20px);
}

.header-user .dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  color: var(--text-secondary);
  font-size: 13px;
  transition: all 0.2s ease;
}

.header-user .dropdown-item:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.header-user .dropdown-item svg {
  width: 14px;
  height: 14px;
}

/* 主内容 */
.main-content {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .sidebar {
    width: 60px !important;
    padding: 16px 8px;
  }

  .logo-section {
    padding: 0 0 16px;
    justify-content: center;
    border-bottom: var(--border-light);
  }

  .logo-text {
    display: none;
  }

  .nav-label {
    display: none;
  }

  .nav-item {
    justify-content: center;
    padding: 10px;
  }

  .sidebar-footer {
    display: none;
  }

  .main-content {
    padding: 16px;
  }

  .header-user .user-name {
    display: none;
  }
}
</style>