<template>
  <div class="login-container">
    <!-- 背景装饰 -->
    <div class="bg-decoration"></div>

    <!-- 登录卡片 -->
    <div class="login-card" :class="{ 'fade-in': mounted }">
      <!-- Logo 区域 -->
      <div class="logo-section">
        <div class="logo-icon">
          <svg viewBox="0 0 48 48" fill="none">
            <path d="M24 4L42 14V34L24 44L6 34V14L24 4Z" stroke="currentColor" stroke-width="1.5" fill="none" stroke-opacity="0.2"/>
            <path d="M24 10L36 17V31L24 38L12 31V17L24 10Z" fill="url(#core-gradient)"/>
            <circle cx="24" cy="24" r="4" fill="white"/>
            <circle cx="24" cy="14" r="2.5" fill="white" fill-opacity="0.95"/>
            <circle cx="32" cy="19" r="2.5" fill="white" fill-opacity="0.95"/>
            <circle cx="32" cy="29" r="2.5" fill="white" fill-opacity="0.95"/>
            <circle cx="24" cy="34" r="2.5" fill="white" fill-opacity="0.95"/>
            <circle cx="16" cy="29" r="2.5" fill="white" fill-opacity="0.95"/>
            <circle cx="16" cy="19" r="2.5" fill="white" fill-opacity="0.95"/>
            <line x1="24" y1="18" x2="24" y2="14" stroke="white" stroke-width="1.5" stroke-opacity="0.8"/>
            <line x1="28" y1="21" x2="32" y2="19" stroke="white" stroke-width="1.5" stroke-opacity="0.8"/>
            <line x1="28" y1="27" x2="32" y2="29" stroke="white" stroke-width="1.5" stroke-opacity="0.8"/>
            <line x1="24" y1="30" x2="24" y2="34" stroke="white" stroke-width="1.5" stroke-opacity="0.8"/>
            <line x1="20" y1="27" x2="16" y2="29" stroke="white" stroke-width="1.5" stroke-opacity="0.8"/>
            <line x1="20" y1="21" x2="16" y2="19" stroke="white" stroke-width="1.5" stroke-opacity="0.8"/>
            <defs>
              <linearGradient id="core-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#6366f1"/>
                <stop offset="50%" stop-color="#8b5cf6"/>
                <stop offset="100%" stop-color="#06b6d4"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h1 class="logo-title">Big Data SRE</h1>
        <p class="logo-subtitle">大数据运维智能平台</p>
      </div>

      <!-- 切换标签 -->
      <div class="tab-switcher">
        <button :class="['tab-btn', { active: activeTab === 'login' }]" @click="activeTab = 'login'">
          登录
        </button>
        <button :class="['tab-btn', { active: activeTab === 'register' }]" @click="activeTab = 'register'">
          注册
        </button>
        <div class="tab-indicator" :style="{ left: activeTab === 'login' ? '0' : '50%' }"></div>
      </div>

      <!-- 登录表单 -->
      <form v-if="activeTab === 'login'" @submit.prevent="handleLogin" class="login-form">
        <div class="input-group">
          <div class="input-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <input v-model="loginForm.email" type="email" placeholder="邮箱地址 (默认: admin@bigdata.local)" required />
        </div>

        <div class="input-group">
          <div class="input-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <input v-model="loginForm.password" :type="showPassword ? 'text' : 'password'" placeholder="密码 (默认: admin123)" required />
          <button type="button" class="toggle-password" @click="showPassword = !showPassword">
            <svg v-if="showPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        </div>

        <div class="form-options">
          <label class="remember-me">
            <input type="checkbox" v-model="rememberMe" />
            <span class="checkmark"></span>
            <span>记住我</span>
          </label>
        </div>

        <button type="submit" class="submit-btn" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          <span v-else>登 录</span>
        </button>

        <div class="demo-account">
          <p>演示账号: <code>admin@bigdata.local</code> / <code>admin123</code></p>
        </div>
      </form>

      <!-- 注册表单 -->
      <form v-else @submit.prevent="handleRegister" class="login-form">
        <div class="input-group">
          <div class="input-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <input v-model="registerForm.username" type="text" placeholder="用户名" required />
        </div>

        <div class="input-group">
          <div class="input-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <input v-model="registerForm.email" type="email" placeholder="邮箱地址" required />
        </div>

        <div class="input-group">
          <div class="input-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <input v-model="registerForm.password" :type="showPassword ? 'text' : 'password'" placeholder="密码（至少6位）" required minlength="6" />
          <button type="button" class="toggle-password" @click="showPassword = !showPassword">
            <svg v-if="showPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        </div>

        <div class="input-group">
          <div class="input-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <input v-model="registerForm.confirmPassword" :type="showPassword ? 'text' : 'password'" placeholder="确认密码" required />
        </div>

        <button type="submit" class="submit-btn" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          <span v-else>注 册</span>
        </button>
      </form>

      <!-- 底部链接 -->
      <div class="footer-links">
        <a href="#" @click.prevent="showAbout = true">关于平台</a>
        <span class="divider">|</span>
        <a href="#" @click.prevent="showHelp = true">帮助文档</a>
      </div>

      <!-- 主题切换 -->
      <div class="theme-toggle">
        <button
          :class="['theme-btn', { active: currentTheme === 'light' }]"
          @click="handleSetTheme('light')"
          title="白天模式"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
        </button>
        <button
          :class="['theme-btn', { active: currentTheme === 'dark' }]"
          @click="handleSetTheme('dark')"
          title="夜晚模式"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        </button>
      </div>
    </div>

    <!-- 关于平台弹窗 -->
    <el-dialog v-model="showAbout" title="关于平台" width="500px" class="about-dialog">
      <div class="about-content">
        <div class="about-logo">
          <svg viewBox="0 0 48 48" fill="none" width="56" height="56">
            <path d="M24 4L42 14V34L24 44L6 34V14L24 4Z" stroke="currentColor" stroke-width="1.5" fill="none" stroke-opacity="0.2"/>
            <path d="M24 10L36 17V31L24 38L12 31V17L24 10Z" fill="url(#about-gradient)"/>
            <circle cx="24" cy="24" r="4" fill="white"/>
            <circle cx="24" cy="14" r="2.5" fill="white" fill-opacity="0.95"/>
            <circle cx="32" cy="19" r="2.5" fill="white" fill-opacity="0.95"/>
            <circle cx="32" cy="29" r="2.5" fill="white" fill-opacity="0.95"/>
            <circle cx="24" cy="34" r="2.5" fill="white" fill-opacity="0.95"/>
            <circle cx="16" cy="29" r="2.5" fill="white" fill-opacity="0.95"/>
            <circle cx="16" cy="19" r="2.5" fill="white" fill-opacity="0.95"/>
            <defs>
              <linearGradient id="about-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#6366f1"/>
                <stop offset="50%" stop-color="#8b5cf6"/>
                <stop offset="100%" stop-color="#06b6d4"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h3>Big Data SRE Platform</h3>
        <p class="version">版本 1.0.0 | 基于 AI 驱动的新一代运维平台</p>

        <div class="about-section">
          <h4>平台简介</h4>
          <p>大数据运维智能平台是一个集成了大语言模型能力的智能运维管理系统。通过自然语言交互，运维人员可以轻松查询和管理 HDFS、YARN、Spark 等大数据组件，大幅提升运维效率。</p>
        </div>

        <div class="about-section">
          <h4>核心功能</h4>
          <div class="feature-grid">
            <div class="feature-item"><span>💬</span><span>智能对话</span></div>
            <div class="feature-item"><span>🤖</span><span>智能体管理</span></div>
            <div class="feature-item"><span>⚡</span><span>技能系统</span></div>
            <div class="feature-item"><span>📊</span><span>集群监控</span></div>
          </div>
        </div>

        <div class="about-footer">
          <p>© 2024 Big Data SRE Platform</p>
        </div>
      </div>
    </el-dialog>

    <!-- 帮助文档弹窗 -->
    <el-dialog v-model="showHelp" title="帮助文档" width="560px" class="help-dialog">
      <div class="help-content">
        <div class="help-section">
          <h4>快速开始</h4>
          <div class="steps">
            <div class="step"><span class="step-num">1</span><span>使用演示账号登录系统</span></div>
            <div class="step"><span class="step-num">2</span><span>配置集群地址（HDFS/YARN/Spark）</span></div>
            <div class="step"><span class="step-num">3</span><span>开始智能对话</span></div>
          </div>
        </div>

        <div class="help-section">
          <h4>使用示例</h4>
          <table class="help-table">
            <tr><td>查一下HDFS集群状态</td><td>获取集群健康信息</td></tr>
            <tr><td>HDFS磁盘使用情况</td><td>存储容量统计</td></tr>
            <tr><td>YARN资源使用情况</td><td>资源分配状态</td></tr>
            <tr><td>正在运行的Spark应用</td><td>应用列表查询</td></tr>
            <tr><td>检查集群健康状态</td><td>综合健康报告</td></tr>
          </table>
        </div>
      </div>
    </el-dialog>

    <!-- 提示消息 -->
    <transition name="fade">
      <div v-if="errorMessage" class="toast error">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        <span>{{ errorMessage }}</span>
      </div>
    </transition>
    <transition name="fade">
      <div v-if="successMessage" class="toast success">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <span>{{ successMessage }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { setTheme, initTheme } from '../utils/theme'

const emit = defineEmits(['login-success'])

const mounted = ref(false)
const activeTab = ref('login')
const loading = ref(false)
const showPassword = ref(false)
const rememberMe = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const showAbout = ref(false)
const showHelp = ref(false)
const currentTheme = ref('light')

const handleSetTheme = (theme) => {
  currentTheme.value = theme
  setTheme(theme)
}

const loginForm = ref({ email: '', password: '' })
const registerForm = ref({ username: '', email: '', password: '', confirmPassword: '' })

const handleLogin = async () => {
  errorMessage.value = ''
  loading.value = true
  try {
    const res = await axios.post('/api/auth/login', loginForm.value)
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('user', JSON.stringify(res.data.user))
    axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`
    successMessage.value = '登录成功，正在跳转...'
    setTimeout(() => { emit('login-success', res.data.user) }, 500)
  } catch (err) {
    errorMessage.value = err.response?.data?.error || '登录失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

const handleRegister = async () => {
  errorMessage.value = ''
  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    errorMessage.value = '两次输入的密码不一致'
    return
  }
  if (registerForm.value.password.length < 6) {
    errorMessage.value = '密码至少需要6个字符'
    return
  }
  loading.value = true
  try {
    const res = await axios.post('/api/auth/register', {
      username: registerForm.value.username,
      email: registerForm.value.email,
      password: registerForm.value.password
    })
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('user', JSON.stringify(res.data.user))
    axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`
    successMessage.value = '注册成功，正在跳转...'
    setTimeout(() => { emit('login-success', res.data.user) }, 500)
  } catch (err) {
    errorMessage.value = err.response?.data?.error || '注册失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // 初始化主题
  currentTheme.value = initTheme()

  const token = localStorage.getItem('token')
  const savedUser = localStorage.getItem('user')
  if (token && savedUser) {
    try { emit('login-success', JSON.parse(savedUser)) } catch (e) {}
    return
  }
  setTimeout(() => { mounted.value = true }, 100)
})
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: var(--bg-primary);
}

/* 背景装饰 */
.bg-decoration {
  position: absolute;
  inset: 0;
  z-index: 0;
}

:root .bg-decoration {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

[data-theme="dark"] .bg-decoration {
  background: linear-gradient(180deg, #09090b 0%, #18181b 100%);
}

[data-theme="dark"] .bg-decoration::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 102, 241, 0.15), transparent),
              radial-gradient(ellipse 60% 40% at 80% 100%, rgba(139, 92, 246, 0.1), transparent);
}

/* 登录卡片 */
.login-card {
  width: 100%;
  max-width: 400px;
  padding: 40px 48px;
  position: relative;
  z-index: 10;
  opacity: 0;
  transform: translateY(20px);
}

.login-card.fade-in {
  opacity: 1;
  transform: translateY(0);
}

/* 玻璃卡片效果 */
.login-card {
  background: var(--bg-glass);
  border: var(--border-glass);
  border-radius: 24px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

:root .login-card {
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}

[data-theme="dark"] .login-card {
  background: rgba(39, 39, 42, 0.7);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

/* Logo 区域 */
.logo-section {
  text-align: center;
  margin-bottom: 32px;
}

.logo-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-icon svg {
  width: 56px;
  height: 56px;
  color: var(--text-primary);
}

.logo-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
  letter-spacing: -0.02em;
}

.logo-subtitle {
  font-size: 14px;
  color: var(--text-muted);
}

/* 切换标签 */
.tab-switcher {
  display: flex;
  position: relative;
  background: var(--bg-hover);
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 28px;
}

.tab-btn {
  flex: 1;
  padding: 10px 20px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  position: relative;
  z-index: 1;
  transition: color 0.3s ease;
}

.tab-btn.active {
  color: white;
}

.tab-indicator {
  position: absolute;
  top: 4px;
  bottom: 4px;
  width: calc(50% - 4px);
  background: var(--gradient-primary);
  border-radius: 10px;
  transition: left 0.3s ease;
}

/* 表单 */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-group {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 14px;
  width: 18px;
  height: 18px;
  color: var(--text-muted);
  pointer-events: none;
  transition: color 0.2s ease;
}

.input-icon svg {
  width: 100%;
  height: 100%;
}

.input-group input {
  width: 100%;
  padding: 14px 44px 14px 44px;
  background: var(--bg-hover);
  border: 1px solid transparent;
  border-radius: 10px;
  color: var(--text-primary);
  font-size: 14px;
  transition: all 0.2s ease;
}

.input-group input::placeholder {
  color: var(--text-muted);
}

.input-group input:focus {
  outline: none;
  border-color: var(--accent);
  background: var(--bg-card);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.input-group input:focus ~ .input-icon {
  color: var(--accent);
}

.toggle-password {
  position: absolute;
  right: 14px;
  width: 18px;
  height: 18px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
}

.toggle-password:hover {
  color: var(--text-primary);
}

.toggle-password svg {
  width: 100%;
  height: 100%;
}

/* 表单选项 */
.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-secondary);
}

.remember-me input {
  display: none;
}

.checkmark {
  width: 16px;
  height: 16px;
  border: 1.5px solid var(--border-color);
  border-radius: 4px;
  position: relative;
  transition: all 0.2s ease;
}

.remember-me input:checked + .checkmark {
  background: var(--accent);
  border-color: var(--accent);
}

.remember-me input:checked + .checkmark::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 1px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

/* 提交按钮 */
.submit-btn {
  height: 44px;
  background: var(--gradient-primary);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;
}

.submit-btn:hover:not(:disabled) {
  filter: brightness(1.1);
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 演示账号 */
.demo-account {
  text-align: center;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
  margin-top: 8px;
}

.demo-account p {
  font-size: 12px;
  color: var(--text-muted);
}

.demo-account code {
  background: var(--bg-hover);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  color: var(--accent);
}

/* 底部链接 */
.footer-links {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
}

.footer-links a {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 13px;
  transition: color 0.2s ease;
}

.footer-links a:hover {
  color: var(--accent);
}

.divider {
  color: var(--border-color);
}

/* 主题切换 */
.theme-toggle {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-top: 20px;
  padding: 4px;
  background: var(--bg-hover);
  border-radius: 10px;
}

.theme-btn {
  padding: 8px 12px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0.5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.theme-btn svg {
  width: 16px;
  height: 16px;
  color: var(--text-secondary);
}

.theme-btn.active svg {
  color: white;
}

.theme-btn:hover {
  opacity: 0.8;
}

.theme-btn.active {
  background: var(--gradient-primary);
  opacity: 1;
}

/* 提示消息 */
.toast {
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  z-index: 1000;
}

.toast svg {
  width: 16px;
  height: 16px;
}

.toast.error {
  background: #ef4444;
  color: white;
}

.toast.success {
  background: #10b981;
  color: white;
}

.fade-enter-active, .fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-10px);
}

/* 弹窗内容 */
.about-content, .help-content {
  color: var(--text-primary);
}

.about-content {
  text-align: center;
}

.about-logo {
  margin-bottom: 12px;
}

.about-content h3 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 4px;
}

.about-content .version {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 20px;
}

.about-section {
  text-align: left;
  margin-bottom: 16px;
  padding: 16px;
  background: var(--bg-hover);
  border-radius: 12px;
}

.about-section h4 {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 10px;
  color: var(--accent);
}

.about-section p {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.feature-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--bg-card);
  border-radius: 8px;
  font-size: 13px;
}

.about-footer {
  text-align: center;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
  margin-top: 16px;
}

.about-footer p {
  font-size: 12px;
  color: var(--text-muted);
}

/* 帮助文档 */
.help-section {
  margin-bottom: 20px;
}

.help-section h4 {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--accent);
}

.steps {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.step {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: var(--bg-hover);
  border-radius: 8px;
  font-size: 13px;
  color: var(--text-secondary);
}

.step-num {
  width: 24px;
  height: 24px;
  background: var(--gradient-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: white;
  flex-shrink: 0;
}

.help-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.help-table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border-color);
}

.help-table td:first-child {
  color: var(--accent);
  font-weight: 500;
}

/* 响应式 */
@media (max-width: 480px) {
  .login-card {
    margin: 16px;
    padding: 32px;
    width: calc(100% - 32px);
  }

  .logo-icon {
    width: 48px;
    height: 48px;
  }

  .logo-icon svg {
    width: 48px;
    height: 48px;
  }

  .logo-title {
    font-size: 20px;
  }
}
</style>