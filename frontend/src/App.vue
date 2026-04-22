<template>
  <!-- 登录页面 -->
  <LoginPage v-if="!isLoggedIn" @login-success="handleLoginSuccess" />

  <!-- 主应用 - Blueprint风格 -->
  <div v-else class="bp-app bp-corner-marks bp-corner-bottom">
    <!-- Blueprint grid background -->
    <div class="bp-grid-bg"></div>
    <div class="bp-noise-overlay"></div>

    <div class="bp-layout">
      <!-- ╭── Top Header Bar ──╮ -->
      <header class="bp-top-bar">
        <div class="bp-top-left">
          <svg class="bp-compass" viewBox="0 0 40 40" aria-hidden="true">
            <circle cx="20" cy="20" r="14" fill="none" stroke="currentColor" stroke-width="1"/>
            <circle cx="20" cy="20" r="1.5" fill="currentColor"/>
            <path d="M20 6 L22 20 L20 18 L18 20 Z" fill="currentColor"/>
            <path d="M20 34 L18 20 L20 22 L22 20 Z" fill="currentColor" opacity="0.3"/>
            <text x="20" y="5" font-size="6" fill="currentColor" text-anchor="middle" font-family="JetBrains Mono">N</text>
          </svg>
          <span class="bp-top-tag">SYS::OPERATIONAL</span>
          <span class="bp-top-sep">·</span>
          <span class="bp-top-tag bp-tag-dim">SESSION {{ sessionId }}</span>
        </div>
        <div class="bp-top-right">
          <span class="bp-clock">{{ clockNow }}</span>
          <span class="bp-top-sep">·</span>
          <span class="bp-top-tag bp-tag-dim">{{ todayIso }}</span>
        </div>
      </header>

      <!-- ╭── Main Canvas ──╮ -->
      <div class="bp-canvas">
        <!-- ╭── Left Sidebar ──╮ -->
        <aside class="bp-sidebar">
          <!-- Logo -->
          <div class="bp-logo">
            <div class="bp-logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M12 2v4m0 12v4M2 12h4m12 0h4"></path>
                <path d="M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"></path>
              </svg>
            </div>
            <div class="bp-logo-text">
              <h1>BIG·DATA</h1>
              <span>SRE_PLATFORM</span>
            </div>
          </div>

          <!-- Navigation -->
          <nav class="bp-nav">
            <div class="bp-nav-group">
              <span class="bp-nav-label">01 — 工作区</span>
              <div
                v-for="item in workspaceItems"
                :key="item.key"
                :class="['bp-nav-item', { active: activeMenu === item.key }]"
                @click="activeMenu = item.key"
              >
                <div class="bp-nav-icon" v-html="item.icon"></div>
                <span class="bp-nav-name">{{ item.label }}</span>
                <span v-if="activeMenu === item.key" class="bp-nav-arrow">▸</span>
              </div>
            </div>

            <template v-if="user?.role === ROLE.ADMIN || (normalizedPermissions && normalizedPermissions.includes('dashboard'))">
              <div class="bp-nav-group">
                <span class="bp-nav-label">02 — 监控</span>
                <div
                  v-for="item in monitorItems"
                  :key="item.key"
                  :class="['bp-nav-item', { active: activeMenu === item.key }]"
                  @click="activeMenu = item.key"
                >
                  <div class="bp-nav-icon" v-html="item.icon"></div>
                  <span class="bp-nav-name">{{ item.label }}</span>
                  <span v-if="activeMenu === item.key" class="bp-nav-arrow">▸</span>
                </div>
              </div>
            </template>

            <template v-if="user?.role === ROLE.ADMIN">
              <div class="bp-nav-group">
                <span class="bp-nav-label">03 — 管理</span>
                <div
                  v-for="item in adminItems"
                  :key="item.key"
                  :class="['bp-nav-item', { active: activeMenu === item.key }]"
                  @click="activeMenu = item.key"
                >
                  <div class="bp-nav-icon" v-html="item.icon"></div>
                  <span class="bp-nav-name">{{ item.label }}</span>
                  <span v-if="activeMenu === item.key" class="bp-nav-arrow">▸</span>
                </div>
              </div>
            </template>

            <div class="bp-nav-group">
              <span class="bp-nav-label">04 — 帮助</span>
              <div
                :class="['bp-nav-item', { active: activeMenu === 'guide' }]"
                @click="activeMenu = 'guide'"
              >
                <div class="bp-nav-icon" v-html="guideIcon"></div>
                <span class="bp-nav-name">使用说明</span>
                <span v-if="activeMenu === 'guide'" class="bp-nav-arrow">▸</span>
              </div>
            </div>
          </nav>

          <!-- Status footer -->
          <div class="bp-sidebar-foot">
            <div class="bp-status">
              <span class="bp-status-led"></span>
              <span class="bp-status-text">SYSTEM::ONLINE</span>
            </div>
          </div>
        </aside>

        <!-- ╭── Right Detail Panel ──╮ -->
        <main class="bp-detail">
          <!-- Corner ticks -->
          <span class="bp-tick bp-tick-tl"></span>
          <span class="bp-tick bp-tick-tr"></span>
          <span class="bp-tick bp-tick-bl"></span>
          <span class="bp-tick bp-tick-br"></span>

          <!-- Panel header -->
          <header class="bp-detail-head">
            <span class="bp-detail-k">VIEW</span>
            <span class="bp-detail-v">{{ currentPageCode }}</span>
            <span class="bp-detail-scale">SCALE 1:1</span>

            <!-- User menu -->
            <div class="bp-user-menu" @click="showUserMenu = !showUserMenu">
              <div class="bp-user-avatar">{{ getAvatarChar(user) }}</div>
              <span class="bp-user-name">{{ user?.username || '用户' }}</span>
              <div v-if="showUserMenu" class="bp-dropdown">
                <div class="bp-dropdown-item" @click="handleLogout">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  <span>EXIT SESSION</span>
                </div>
              </div>
            </div>
          </header>

          <!-- Content area -->
          <div class="bp-content bp-scroll">
            <Transition name="bp-page" mode="out-in">
              <KeepAlive>
                <component :is="currentComponent" @navigate="activeMenu = $event" />
              </KeepAlive>
            </Transition>
          </div>
        </main>
      </div>

      <!-- ╭── Bottom Title Block ──╮ -->
      <footer class="bp-title-block">
        <div class="bp-tb-col">
          <div class="bp-tb-row"><span class="bp-tb-k">PROJECT</span><span class="bp-tb-v">BIG DATA SRE PLATFORM</span></div>
          <div class="bp-tb-row"><span class="bp-tb-k">MODULE</span><span class="bp-tb-v">{{ currentPageTitle }}</span></div>
        </div>
        <div class="bp-tb-col">
          <div class="bp-tb-row"><span class="bp-tb-k">USER</span><span class="bp-tb-v">{{ user?.username || 'GUEST' }}</span></div>
          <div class="bp-tb-row"><span class="bp-tb-k">ROLE</span><span class="bp-tb-v">{{ user?.role === 'admin' ? 'ADMIN' : 'USER' }}</span></div>
        </div>
        <div class="bp-tb-col bp-tb-narrow">
          <div class="bp-tb-row"><span class="bp-tb-k">SCALE</span><span class="bp-tb-v">1:1</span></div>
          <div class="bp-tb-row"><span class="bp-tb-k">SHEET</span><span class="bp-tb-v">01/01</span></div>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, defineAsyncComponent } from 'vue'
import axios from 'axios'
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

const clockNow = ref('')
const todayIso = ref('')
const sessionId = Math.random().toString(36).slice(2, 6).toUpperCase()

let clockTimer = null
function tickClock() {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  clockNow.value = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  const dateStr = `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`
  if (todayIso.value !== dateStr) todayIso.value = dateStr
}

const menuItems = [
  { key: 'chat', label: '智能对话', num: '01', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>' },
  { key: 'dashboard', label: '集群仪表板', num: '05', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M3 9h18M9 21V9"></path></svg>' },
  { key: 'agents', label: '智能体管理', num: '02', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>' },
  { key: 'skills', label: '技能配置', num: '03', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline></svg>' },
  { key: 'dingtalk', label: '钉钉配置', num: '06', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>' },
  { key: 'config', label: '集群配置', num: '07', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path></svg>' },
  { key: 'users', label: '用户管理', num: '08', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>' },
]

const menuMap = Object.fromEntries(menuItems.map(item => [item.key, item]))

const guideIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>'

const componentMap = {
  chat: ChatView, agents: AgentManagement, skills: SkillManagement,
  dingtalk: DingtalkConfig, config: ClusterConfig, dashboard: ClusterDashboard,
  users: UserManagement, guide: UserGuide,
}

const normalizedPermissions = computed(() => {
  let permissions = user.value?.permissions
  if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
    permissions = DEFAULT_USER_PERMISSIONS
  }
  return permissions
})

const workspaceItems = computed(() => {
  if (user.value?.role === ROLE.ADMIN) {
    return [menuMap.chat, menuMap.agents, menuMap.skills]
  }
  return menuItems.filter(i => normalizedPermissions.value.includes(i.key) && ['chat', 'agents', 'skills'].includes(i.key))
})

const monitorItems = computed(() => {
  if (user.value?.role === ROLE.ADMIN) {
    return [menuMap.dashboard, menuMap.dingtalk, menuMap.config]
  }
  return menuItems.filter(i => normalizedPermissions.value.includes(i.key) && ['dashboard', 'dingtalk', 'config'].includes(i.key))
})

const adminItems = [menuMap.users]

const activeItem = computed(() => menuMap[activeMenu.value])

const currentPageTitle = computed(() => {
  if (activeMenu.value === 'guide') return 'USER_GUIDE'
  return activeItem.value ? activeItem.value.label.toUpperCase().replace(/\s+/g, '_') : 'MAIN'
})

const currentPageCode = computed(() => {
  if (activeMenu.value === 'guide') return '99 — USER_GUIDE'
  return activeItem.value ? `${activeItem.value.num} — ${activeItem.value.label.toUpperCase().replace(/\s+/g, '_')}` : 'VIEW'
})

const currentComponent = computed(() => componentMap[activeMenu.value])

watch(activeMenu, (newVal) => {
  localStorage.setItem(STORAGE_KEYS.ACTIVE_MENU, newVal)
  document.title = `${currentPageTitle.value} · Big Data SRE`
})

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
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      const res = await axios.get('/api/auth/me')
      user.value = res.data.user
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(res.data.user))
      isLoggedIn.value = true
    } catch {
      handleLogout()
    }
  }
}

const handleClickOutside = (e) => {
  if (showUserMenu.value && !e.target.closest('.bp-user-menu')) {
    showUserMenu.value = false
  }
}

onMounted(() => {
  tickClock()
  clockTimer = setInterval(tickClock, 1000)
  checkAuth()
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  clearInterval(clockTimer)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style src="./styles/blueprint.css"></style>

<style scoped>
.bp-app {
  position: relative;
  min-height: 100vh;
  background: var(--bp-ink);
  color: var(--bp-chalk);
  font-family: var(--bp-fnt-body);
  overflow: hidden;
  isolation: isolate;
}

.bp-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* ╭── Top Bar ──╮ */
.bp-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 32px;
  border-bottom: 1px solid var(--bp-border);
  font-family: var(--bp-fnt-mono);
  font-size: 11px;
  letter-spacing: 0.14em;
  color: var(--bp-chalk-2);
  background: rgba(10, 23, 38, 0.6);
  animation: bp-slide-up 0.5s ease-out backwards;
}

.bp-top-left, .bp-top-right { display: flex; align-items: center; gap: 10px; }
.bp-compass { width: 26px; height: 26px; color: var(--bp-blueprint); }
.bp-top-tag { text-transform: uppercase; }
.bp-tag-dim { color: var(--bp-chalk-dim); }
.bp-top-sep { color: var(--bp-chalk-dim); opacity: 0.5; }
.bp-clock {
  color: var(--bp-blueprint);
  font-weight: 700;
  text-shadow: 0 0 12px rgba(92, 228, 255, 0.4);
}

/* ╭── Canvas ──╮ */
.bp-canvas {
  flex: 1;
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 0;
  min-height: calc(100vh - 120px);
}

/* ╭── Sidebar ──╮ */
.bp-sidebar {
  display: flex;
  flex-direction: column;
  background: var(--bp-ink-2);
  border-right: 1px solid var(--bp-border);
  padding: 0;
  animation: bp-slide-left 0.5s ease-out backwards;
}

.bp-logo {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 16px;
  border-bottom: 1px solid var(--bp-border);
}

.bp-logo-icon {
  width: 40px; height: 40px;
  display: grid;
  place-items: center;
  border: 1px solid var(--bp-blueprint);
  color: var(--bp-blueprint);
}

.bp-logo-icon svg { width: 22px; height: 22px; }

.bp-logo-text h1 {
  font-family: var(--bp-fnt-display);
  font-size: 18px;
  font-weight: 900;
  color: var(--bp-chalk);
  letter-spacing: -0.02em;
}

.bp-logo-text span {
  font-family: var(--bp-fnt-mono);
  font-size: 10px;
  color: var(--bp-chalk-dim);
  letter-spacing: 0.12em;
}

/* ╭── Navigation ──╮ */
.bp-nav {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.bp-nav-group {
  margin-bottom: 8px;
}

.bp-nav-label {
  display: block;
  font-family: var(--bp-fnt-mono);
  font-size: 12px;
  color: var(--bp-chalk-dim);
  letter-spacing: 0.12em;
  padding: 14px 12px 10px;
  opacity: 0.75;
  font-weight: 600;
}

.bp-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid transparent;
  color: var(--bp-chalk-dim);
  cursor: pointer;
  transition: all 0.25s ease;
  margin-bottom: 2px;
}

.bp-nav-item:hover {
  border-color: var(--bp-border);
  color: var(--bp-chalk);
}

.bp-nav-item.active {
  border-color: var(--bp-blueprint);
  background: rgba(92, 228, 255, 0.06);
  color: var(--bp-blueprint);
}

.bp-nav-icon {
  width: 18px; height: 18px;
  opacity: 0.7;
}

.bp-nav-item.active .bp-nav-icon { opacity: 1; color: var(--bp-blueprint); }

.bp-nav-name {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.bp-nav-arrow {
  margin-left: auto;
  font-size: 14px;
  animation: bp-fade 0.3s ease;
}

/* ╭── Sidebar Footer ──╮ */
.bp-sidebar-foot {
  padding: 12px 16px;
  border-top: 1px solid var(--bp-border);
}

.bp-status {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--bp-fnt-mono);
  font-size: 10px;
  color: var(--bp-chalk-dim);
  letter-spacing: 0.08em;
}

.bp-status-led {
  width: 6px; height: 6px;
  border-radius: 1px;
  background: var(--bp-green-check);
  box-shadow: 0 0 6px rgba(143, 212, 165, 0.6);
  animation: bp-led-pulse 2.5s ease-in-out infinite;
}

/* ╭── Detail Panel ──╮ */
.bp-detail {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bp-bg-panel);
  border: 1px solid var(--bp-border);
  margin: 16px;
  overflow: hidden;
  animation: bp-scale-in 0.4s ease-out 0.2s backwards;
}

.bp-detail::before {
  content: '';
  position: absolute;
  inset: 6px;
  border: 1px solid rgba(92, 228, 255, 0.08);
  pointer-events: none;
}

.bp-detail-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px dashed var(--bp-border);
  font-family: var(--bp-fnt-mono);
  animation: bp-fade 0.5s ease-out 0.4s backwards;
}

.bp-detail-k {
  font-size: 10px;
  color: var(--bp-chalk-dim);
  letter-spacing: 0.2em;
}

.bp-detail-v {
  font-size: 13px;
  color: var(--bp-blueprint);
  font-weight: 700;
  letter-spacing: 0.08em;
}

.bp-detail-scale {
  font-size: 9px;
  color: var(--bp-chalk-dim);
  letter-spacing: 0.2em;
  margin-right: auto;
}

/* ╭── User Menu ──╮ */
.bp-user-menu {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 12px 4px 4px;
  border: 1px solid transparent;
  transition: all 0.2s;
  position: relative;
}

.bp-user-menu:hover {
  border-color: var(--bp-border);
}

.bp-user-avatar {
  width: 28px; height: 28px;
  display: grid;
  place-items: center;
  border: 1px solid var(--bp-amber);
  color: var(--bp-amber);
  font-weight: 700;
  font-size: 11px;
}

.bp-user-name {
  font-size: 12px;
  color: var(--bp-chalk);
  letter-spacing: 0.04em;
}

.bp-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 160px;
  background: var(--bp-ink-2);
  border: 1px solid var(--bp-border);
  padding: 4px;
  z-index: 100;
}

.bp-dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  color: var(--bp-chalk-dim);
  font-size: 11px;
  letter-spacing: 0.08em;
  transition: all 0.2s;
}

.bp-dropdown-item:hover {
  background: rgba(255, 74, 60, 0.1);
  color: var(--bp-red-stamp);
}

.bp-dropdown-item svg { width: 14px; height: 14px; }

/* ╭── Content Area ──╮ */
.bp-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

/* ╭── Title Block Footer ──╮ */
.bp-title-block {
  display: flex;
  border-top: 1px solid var(--bp-border);
  margin: 0;
  font-family: var(--bp-fnt-mono);
  background: rgba(10, 23, 38, 0.6);
  animation: bp-slide-up 0.5s ease-out 0.3s backwards;
}

.bp-tb-col {
  display: flex;
  flex-direction: column;
  padding: 12px 20px;
  border-right: 1px solid var(--bp-border);
  min-width: 180px;
}

.bp-tb-col:last-child { border-right: none; }
.bp-tb-narrow { min-width: 140px; }

.bp-tb-row {
  display: flex;
  gap: 12px;
  line-height: 1.7;
}

.bp-tb-k {
  font-size: 9px;
  color: var(--bp-chalk-dim);
  letter-spacing: 0.2em;
  width: 60px;
}

.bp-tb-v {
  font-size: 11px;
  color: var(--bp-chalk);
  letter-spacing: 0.06em;
  font-weight: 700;
}

/* ╭── Page Transition ──╮ */
.bp-page-enter-active,
.bp-page-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.bp-page-enter-from {
  opacity: 0;
  transform: translateX(12px);
}

.bp-page-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}

/* ╭── Responsive ──╮ */
@media (max-width: 768px) {
  .bp-canvas { grid-template-columns: 60px 1fr; }
  .bp-logo-text, .bp-nav-label, .bp-nav-name, .bp-nav-arrow { display: none; }
  .bp-nav-item { justify-content: center; padding: 12px; }
  .bp-sidebar-foot { display: none; }
  .bp-detail { margin: 8px; }
  .bp-detail-head { padding: 10px 14px; }
  .bp-content { padding: 12px; }
  .bp-top-bar { padding: 10px 16px; }
  .bp-title-block { display: none; }
  .bp-user-name { display: none; }
}
</style>