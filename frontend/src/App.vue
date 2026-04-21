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
          <div class="nav-group-label">工作区</div>
          <div
            v-for="item in workspaceItems"
            :key="item.key"
            :class="['nav-item', { active: activeMenu === item.key }]"
            @click="activeMenu = item.key"
          >
            <div class="nav-icon" v-html="item.icon"></div>
            <span class="nav-label">{{ item.label }}</span>
          </div>

          <template v-if="user?.role === ROLE.ADMIN || (normalizedPermissions && normalizedPermissions.includes('dashboard'))">
            <div class="nav-group-label">监控</div>
            <div
              v-for="item in monitorItems"
              :key="item.key"
              :class="['nav-item', { active: activeMenu === item.key }]"
              @click="activeMenu = item.key"
            >
              <div class="nav-icon" v-html="item.icon"></div>
              <span class="nav-label">{{ item.label }}</span>
            </div>
          </template>

          <template v-if="user?.role === ROLE.ADMIN">
            <div class="nav-group-label">管理</div>
            <div
              v-for="item in adminItems"
              :key="item.key"
              :class="['nav-item', { active: activeMenu === item.key }]"
              @click="activeMenu = item.key"
            >
              <div class="nav-icon" v-html="item.icon"></div>
              <span class="nav-label">{{ item.label }}</span>
            </div>
          </template>

          <div class="nav-group-label">帮助</div>
          <div
            :class="['nav-item', { active: activeMenu === 'guide' }]"
            @click="activeMenu = 'guide'"
          >
            <div class="nav-icon" v-html="guideIcon"></div>
            <span class="nav-label">使用说明</span>
          </div>
        </nav>

        <div class="sidebar-footer">
          <div class="status-badge">
            <span class="status-led"></span>
            <span>SYS::ONLINE</span>
          </div>
        </div>
      </el-aside>

      <!-- 主内容区 -->
      <el-container class="content-wrapper">
        <el-header class="top-header">
          <div class="header-left">
            <h2 class="page-title-mono">// {{ currentPageTitle.toUpperCase().replace(/\s+/g, '_') }}</h2>
          </div>
          <div class="header-right">
            <!-- 主题切换 -->
            <div class="header-theme-toggle">
              <button
                :class="['theme-btn', { active: theme === 'light' }]"
                @click="handleSetTheme('light')"
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
                @click="handleSetTheme('dark')"
                title="夜晚模式"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              </button>
            </div>

            <!-- 用户信息 -->
            <div class="header-user" @click="showUserMenu = !showUserMenu">
              <div class="user-avatar">{{ getAvatarChar(user) }}</div>
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
          <Transition name="page" mode="out-in">
            <KeepAlive>
              <ChatView v-if="activeMenu === 'chat'" />
              <AgentManagement v-else-if="activeMenu === 'agents'" />
              <SkillManagement v-else-if="activeMenu === 'skills'" />
              <DingtalkConfig v-else-if="activeMenu === 'dingtalk'" />
              <ClusterConfig v-else-if="activeMenu === 'config'" />
              <ClusterDashboard v-else-if="activeMenu === 'dashboard'" />
              <UserManagement v-else-if="activeMenu === 'users'" />
              <UserGuide v-else-if="activeMenu === 'guide'" @navigate="activeMenu = $event" />
            </KeepAlive>
          </Transition>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, defineAsyncComponent } from 'vue'
import axios from 'axios'
import { setTheme, initTheme } from './utils/theme'
import { getAvatarChar } from './utils/avatar'
import { STORAGE_KEYS, ROLE, DEFAULT_USER_PERMISSIONS } from './utils/constants'

// 登录页直接加载（首屏需要）
import LoginPage from './components/LoginPage.vue'

// 其他组件懒加载，减少首屏加载时间
const ChatView = defineAsyncComponent(() => import('./components/ChatView.vue'))
const AgentManagement = defineAsyncComponent(() => import('./components/AgentManagement.vue'))
const SkillManagement = defineAsyncComponent(() => import('./components/SkillManagement.vue'))
const ClusterConfig = defineAsyncComponent(() => import('./components/ClusterConfig.vue'))
const ClusterDashboard = defineAsyncComponent(() => import('./components/ClusterDashboard.vue'))
const UserGuide = defineAsyncComponent(() => import('./components/UserGuide.vue'))
const UserManagement = defineAsyncComponent(() => import('./components/UserManagement.vue'))
const DingtalkConfig = defineAsyncComponent(() => import('./components/DingtalkConfig.vue'))

const isLoggedIn = ref(false)
const user = ref(null)
const showUserMenu = ref(false)
const activeMenu = ref(localStorage.getItem(STORAGE_KEYS.ACTIVE_MENU) || 'chat')
const theme = ref('light')

const menuItems = [
  { key: 'chat', label: '智能对话', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>' },
  { key: 'dashboard', label: '集群仪表板', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M3 9h18M9 21V9"></path></svg>' },
  { key: 'agents', label: '智能体管理', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>' },
  { key: 'skills', label: '技能配置', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline></svg>' },
  { key: 'dingtalk', label: '钉钉配置', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>' },
  { key: 'config', label: '集群配置', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path></svg>' },
  { key: 'users', label: '用户管理', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>' },
]

const guideIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>'

// Normalized permissions - deduplicated normalization logic
const normalizedPermissions = computed(() => {
  let permissions = user.value?.permissions
  if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
    permissions = DEFAULT_USER_PERMISSIONS
  }
  return permissions
})

// Nav groups - workspace items always visible
const workspaceItems = computed(() => {
  if (user.value?.role === ROLE.ADMIN) {
    return [menuItems[0], menuItems[2], menuItems[3]]  // chat, agents, skills
  }
  return menuItems.filter(i => normalizedPermissions.value.includes(i.key) && ['chat', 'agents', 'skills'].includes(i.key))
})

// Monitor items - dashboard + dingtalk + config
const monitorItems = computed(() => {
  if (user.value?.role === ROLE.ADMIN) {
    return [menuItems[1], menuItems[4], menuItems[5]]  // dashboard, dingtalk, config
  }
  return menuItems.filter(i => normalizedPermissions.value.includes(i.key) && ['dashboard', 'dingtalk', 'config'].includes(i.key))
})

// Admin items - users only
const adminItems = computed(() => {
  return [menuItems[6]]  // users
})

const currentPageTitle = computed(() => {
  const item = menuItems.find(i => i.key === activeMenu.value)
  if (activeMenu.value === 'guide') return '使用说明'
  return item ? item.label : ''
})

const handleSetTheme = (newTheme) => {
  theme.value = newTheme
  setTheme(newTheme)
}

// 保存当前页面到 localStorage，并同步更新标签页标题
watch(activeMenu, (newVal) => {
  localStorage.setItem(STORAGE_KEYS.ACTIVE_MENU, newVal)
  document.title = `${currentPageTitle.value} · Big Data SRE`
})

// 登录后初始化标题
watch(isLoggedIn, (val) => {
  if (val) document.title = `${currentPageTitle.value} · Big Data SRE`
})

const handleLoginSuccess = (userData) => {
  user.value = userData
  isLoggedIn.value = true
}

const handleLogout = () => {
  localStorage.removeItem(STORAGE_KEYS.TOKEN)
  localStorage.removeItem(STORAGE_KEYS.USER)
  delete axios.defaults.headers.common['Authorization']
  isLoggedIn.value = false
  user.value = null
  showUserMenu.value = false
}

const checkAuth = async () => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
  const savedUser = localStorage.getItem(STORAGE_KEYS.USER)

  if (token && savedUser) {
    try {
      // 验证 token
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      const res = await axios.get('/api/auth/me')
      user.value = res.data.user
      // 更新 localStorage 中的用户信息
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(res.data.user))
      isLoggedIn.value = true
    } catch (err) {
      // Token 无效，清除登录状态
      handleLogout()
    }
  }
}

const handleClickOutside = (e) => {
  if (showUserMenu.value && !e.target.closest('.header-user')) {
    showUserMenu.value = false
  }
}

onMounted(() => {
  theme.value = initTheme()
  checkAuth()
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
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

/* ========== 侧边栏 - Dark brand sidebar ========== */
.sidebar {
  width: 240px !important;
  background: var(--sidebar-bg) !important;
  padding: 0;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

/* Sidebar ambient glow */
.sidebar::before {
  content: '';
  position: absolute;
  top: -40%;
  left: -20%;
  width: 140%;
  height: 60%;
  background: radial-gradient(ellipse, rgba(13, 148, 136, 0.12) 0%, transparent 70%);
  pointer-events: none;
}

.logo-section {
  padding: 20px 16px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid var(--sidebar-border);
  margin-bottom: 4px;
  position: relative;
}

.logo-icon {
  width: 36px;
  height: 36px;
  background: var(--accent-gradient);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(13, 148, 136, 0.3);
}
.logo-icon svg {
  width: 20px;
  height: 20px;
}

.logo-text h1 {
  font-size: 14px;
  font-weight: 700;
  color: var(--sidebar-text);
  letter-spacing: -0.01em;
}

.logo-text span {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--sidebar-text-muted);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

/* 导航菜单 */
.nav-menu {
  flex: 1;
  overflow-y: auto;
  padding: 4px 10px;
}

.nav-group-label {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--sidebar-text-muted);
  padding: 18px 12px 6px;
  opacity: 0.65;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  margin-bottom: 2px;
  color: var(--sidebar-text-muted);
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.nav-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%) scaleY(0);
  width: 3px;
  height: 60%;
  background: var(--accent-gradient);
  border-radius: 0 2px 2px 0;
  transition: transform 0.25s ease;
}

.nav-item:hover {
  background: var(--sidebar-hover);
  color: var(--sidebar-text);
}

.nav-item:hover::before {
  transform: translateY(-50%) scaleY(0.5);
}

.nav-item.active {
  background: var(--sidebar-active);
  color: white;
}

.nav-item.active::before {
  transform: translateY(-50%) scaleY(1);
}

.nav-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  opacity: 0.7;
}

.nav-item.active .nav-icon {
  opacity: 1;
}

.nav-label {
  font-size: 15px;
  font-weight: 500;
}

/* 侧边栏底部 */
.sidebar-footer {
  padding: 12px 10px 16px;
  border-top: 1px solid var(--sidebar-border);
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--sidebar-text-muted);
}

.status-led {
  width: 6px;
  height: 6px;
  border-radius: 1px;
  background: #10b981;
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.8), 0 0 12px rgba(16, 185, 129, 0.4);
  flex-shrink: 0;
  animation: led-pulse 2.5s ease-in-out infinite;
}

/* Page transition */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateX(8px);
}
.page-leave-to {
  opacity: 0;
  transform: translateX(-4px);
}

@keyframes led-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
}

/* 用户头像 */
.user-avatar {
  width: 28px;
  height: 28px;
  background: var(--accent-gradient);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 11px;
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
  padding: 12px 28px;
  height: 56px;
  background: var(--bg-primary);
  border-bottom: var(--border-weak-line);
}

.header-left h2 {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.page-title-mono {
  font-family: var(--font-mono) !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  color: var(--accent) !important;
  letter-spacing: 0.08em !important;
  opacity: 0.9;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-theme-toggle {
  display: flex;
  background: var(--bg-hover);
  border-radius: var(--radius-sm);
  padding: 3px;
}

.header-theme-toggle .theme-btn {
  padding: 5px 8px;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0.4;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-theme-toggle .theme-btn svg { width: 14px; height: 14px; color: var(--text-secondary); }
.header-theme-toggle .theme-btn.active svg { color: white; }
.header-theme-toggle .theme-btn:hover { opacity: 0.7; }
.header-theme-toggle .theme-btn.active { background: var(--accent-gradient); opacity: 1; box-shadow: 0 1px 4px var(--accent-glow); }

.header-user {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  position: relative;
  padding: 4px 10px 4px 4px;
  border-radius: var(--radius-sm);
  transition: background 0.15s;
}
.header-user:hover { background: var(--bg-hover); }
.header-user .user-avatar { width: 26px; height: 26px; border-radius: var(--radius-sm); font-size: 10px; }
.header-user .user-name { font-size: 13px; font-weight: 500; color: var(--text-primary); }

.header-user .user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 150px;
  background: var(--bg-secondary);
  border: var(--border-medium-line);
  border-radius: var(--radius-md);
  padding: 4px;
  box-shadow: var(--shadow-lg);
  z-index: 100;
}
.header-user .dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 13px;
  transition: all 0.15s;
}
.header-user .dropdown-item:hover { background: var(--tag-red-bg); color: var(--danger); }
.header-user .dropdown-item svg { width: 14px; height: 14px; }

/* 主内容 */
.main-content {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .sidebar { width: 60px !important; padding: 16px 8px; }
  .sidebar::before { display: none; }
  .logo-section { padding: 12px 0 16px; justify-content: center; border-bottom: 1px solid var(--sidebar-border); }
  .logo-text { display: none; }
  .nav-label, .nav-group-label { display: none; }
  .nav-item { justify-content: center; padding: 10px; }
  .nav-item.active::before { display: none; }
  .sidebar-footer { display: none; }
  .main-content { padding: 16px; }
  .header-user .user-name { display: none; }
}
</style>