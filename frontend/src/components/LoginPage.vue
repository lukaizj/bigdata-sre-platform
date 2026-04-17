<template>
  <div class="login-page" @mousemove="handleMouseMove">
    <!-- 左侧动画面板 -->
    <div class="brand-panel" ref="brandPanelRef">
      <div class="scene">
        <div class="char-wrap char1" ref="wrap1">
          <div ref="cont1" class="lottie-cont"></div>
        </div>
        <div class="char-wrap char2" ref="wrap2">
          <div ref="cont2" class="lottie-cont"></div>
        </div>
        <div class="char-wrap char3" ref="wrap3">
          <div ref="cont3" class="lottie-cont"></div>
        </div>
      </div>
    </div>

    <!-- 右侧表单面板 -->
    <div class="form-panel">
      <div class="login-card">
        <!-- Logo -->
        <div class="logo-section">
          <div class="logo-icon">
            <svg viewBox="0 0 64 64" fill="none">
              <rect x="14" y="18" width="36" height="28" rx="10" fill="url(#rg)"/>
              <rect x="22" y="26" width="8" height="8" rx="4" fill="white" opacity="0.9"/>
              <rect x="34" y="26" width="8" height="8" rx="4" fill="white" opacity="0.9"/>
              <rect x="26" y="36" width="12" height="4" rx="2" fill="white" opacity="0.7"/>
              <rect x="31" y="10" width="2" height="8" rx="1" fill="url(#rg)"/>
              <circle cx="32" cy="9" r="3" fill="#a78bfa"/>
              <rect x="29" y="46" width="6" height="6" rx="2" fill="url(#rg)"/>
              <rect x="8" y="26" width="6" height="10" rx="3" fill="url(#rg)"/>
              <rect x="50" y="26" width="6" height="10" rx="3" fill="url(#rg)"/>
              <defs>
                <linearGradient id="rg" x1="14" y1="10" x2="50" y2="52" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#7C3AED"/>
                  <stop offset="1" stop-color="#a78bfa"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 class="logo-title">大数据运维平台</h1>
          <p class="logo-sub">Big Data SRE</p>
        </div>

        <!-- Tab 切换 -->
        <div class="tab-switcher">
          <button :class="['tab-btn', { active: tab === 'login' }]" @click="tab = 'login'">登录</button>
          <button :class="['tab-btn', { active: tab === 'register' }]" @click="tab = 'register'">注册</button>
          <div class="tab-indicator" :style="{ left: tab === 'login' ? '4px' : 'calc(50%)' }"></div>
        </div>

        <!-- 登录表单 -->
        <form v-if="tab === 'login'" @submit.prevent="handleLogin" class="auth-form">
          <div class="field-group">
            <span class="field-icon">
              <svg viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/></svg>
            </span>
            <input v-model="loginForm.email" type="email" placeholder="邮箱地址" required autocomplete="username"/>
          </div>
          <div class="field-group">
            <span class="field-icon">
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/></svg>
            </span>
            <input v-model="loginForm.password" :type="showPwd ? 'text' : 'password'" placeholder="密码" required autocomplete="current-password"/>
            <button type="button" class="pwd-toggle" @click="showPwd = !showPwd" tabindex="-1">
              <svg v-if="showPwd" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/></svg>
              <svg v-else viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd"/><path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.064 7 9.542 7 .847 0 1.669-.105 2.454-.303z"/></svg>
            </button>
          </div>
          <div class="field-group captcha-group">
            <span class="field-icon">
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clip-rule="evenodd"/></svg>
            </span>
            <input v-model="loginForm.captchaCode" type="text" placeholder="验证码" required maxlength="6" class="captcha-input"/>
            <button type="button" class="captcha-img-btn" @click="loadCaptcha" title="点击刷新验证码">
              <span v-if="captchaLoading" class="captcha-loading">加载中...</span>
              <span v-else-if="captchaSvg" v-html="captchaSvg" class="captcha-svg"></span>
              <span v-else class="captcha-placeholder">点击获取</span>
            </button>
          </div>

          <button type="submit" class="submit-btn" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            <span v-else>登录系统</span>
          </button>

          <div class="foot-links">
            <a href="#" @click.prevent>忘记密码?</a>
            <a href="#" @click.prevent="tab = 'register'">注册账号</a>
          </div>
        </form>

        <!-- 注册表单 -->
        <form v-else @submit.prevent="handleRegister" class="auth-form">
          <div class="field-group">
            <span class="field-icon">
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/></svg>
            </span>
            <input v-model="registerForm.username" type="text" placeholder="用户名" required/>
          </div>
          <div class="field-group">
            <span class="field-icon">
              <svg viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/></svg>
            </span>
            <input v-model="registerForm.email" type="email" placeholder="邮箱地址" required/>
          </div>
          <div class="field-group">
            <span class="field-icon">
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/></svg>
            </span>
            <input v-model="registerForm.password" :type="showPwd ? 'text' : 'password'" placeholder="密码（至少6位）" required minlength="6"/>
            <button type="button" class="pwd-toggle" @click="showPwd = !showPwd" tabindex="-1">
              <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/></svg>
            </button>
          </div>
          <div class="field-group">
            <span class="field-icon">
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/></svg>
            </span>
            <input v-model="registerForm.confirmPassword" :type="showPwd ? 'text' : 'password'" placeholder="确认密码" required/>
          </div>
          <div class="field-group captcha-group">
            <span class="field-icon">
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clip-rule="evenodd"/></svg>
            </span>
            <input v-model="registerForm.captchaCode" type="text" placeholder="验证码" required maxlength="6" class="captcha-input"/>
            <button type="button" class="captcha-img-btn" @click="loadCaptcha" title="点击刷新验证码">
              <span v-if="captchaLoading" class="captcha-loading">加载中...</span>
              <span v-else-if="captchaSvg" v-html="captchaSvg" class="captcha-svg"></span>
              <span v-else class="captcha-placeholder">点击获取</span>
            </button>
          </div>

          <button type="submit" class="submit-btn" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            <span v-else>注 册</span>
          </button>

          <div class="foot-links">
            <a href="#" @click.prevent="tab = 'login'">已有账号？登录</a>
          </div>
        </form>
      </div>
    </div>

    <!-- Toast 提示 -->
    <transition name="toast-fade">
      <div v-if="toast.show" :class="['toast', toast.type]">
        <svg v-if="toast.type === 'error'" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>
        <svg v-else viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
        <span>{{ toast.message }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import lottie from 'lottie-web'
import axios from 'axios'
import { STORAGE_KEYS } from '../utils/constants'

const emit = defineEmits(['login-success'])

// ── UI state ──────────────────────────────────────────────────────────────────
const tab = ref('login')
const loading = ref(false)
const showPwd = ref(false)

// ── Form data ─────────────────────────────────────────────────────────────────
const loginForm = ref({ email: '', password: '', captchaCode: '' })
const registerForm = ref({ username: '', email: '', password: '', confirmPassword: '', captchaCode: '' })

// ── Captcha ───────────────────────────────────────────────────────────────────
const captchaId = ref('')
const captchaSvg = ref('')
const captchaLoading = ref(false)

async function loadCaptcha() {
  captchaLoading.value = true
  captchaSvg.value = ''
  try {
    const { data } = await axios.get('/api/auth/captcha')
    captchaId.value = data.captchaId
    captchaSvg.value = data.svg
  } catch {
    showToast('验证码加载失败，请重试', 'error')
  } finally {
    captchaLoading.value = false
  }
}

// 切换 tab 时自动刷新验证码
watch(tab, () => {
  loginForm.value.captchaCode = ''
  registerForm.value.captchaCode = ''
  loadCaptcha()
})

// ── Toast ─────────────────────────────────────────────────────────────────────
const toast = ref({ show: false, message: '', type: 'error' })
let toastTimer = null

function showToast(message, type = 'error') {
  toast.value = { show: true, message, type }
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value.show = false }, 3000)
}

// ── Auth handlers ─────────────────────────────────────────────────────────────
async function handleLogin() {
  loading.value = true
  try {
    const { data } = await axios.post('/api/auth/login', {
      email: loginForm.value.email,
      password: loginForm.value.password,
      captchaId: captchaId.value,
      captchaCode: loginForm.value.captchaCode
    })
    localStorage.setItem(STORAGE_KEYS.TOKEN, data.token)
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user))
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    showToast('登录成功，正在跳转...', 'success')
    setTimeout(() => emit('login-success', data.user), 500)
  } catch (err) {
    const errData = err.response?.data
    showToast(errData?.error || '登录失败，请稍后重试', 'error')
    if (errData?.refreshCaptcha) loadCaptcha()
    loginForm.value.captchaCode = ''
  } finally {
    loading.value = false
  }
}

async function handleRegister() {
  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    return showToast('两次密码不一致', 'error')
  }
  if (registerForm.value.password.length < 6) {
    return showToast('密码至少需要6个字符', 'error')
  }
  loading.value = true
  try {
    const { data } = await axios.post('/api/auth/register', {
      username: registerForm.value.username,
      email: registerForm.value.email,
      password: registerForm.value.password,
      captchaId: captchaId.value,
      captchaCode: registerForm.value.captchaCode
    })
    localStorage.setItem(STORAGE_KEYS.TOKEN, data.token)
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user))
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    showToast('注册成功，正在跳转...', 'success')
    setTimeout(() => emit('login-success', data.user), 500)
  } catch (err) {
    const errData = err.response?.data
    showToast(errData?.error || '注册失败，请稍后重试', 'error')
    if (errData?.refreshCaptcha) loadCaptcha()
    registerForm.value.captchaCode = ''
  } finally {
    loading.value = false
  }
}

// ── Lottie ────────────────────────────────────────────────────────────────────
const cont1 = ref(null)
const cont2 = ref(null)
const cont3 = ref(null)
const wrap1 = ref(null)
const wrap2 = ref(null)
const wrap3 = ref(null)
const brandPanelRef = ref(null)
let lottieInsts = []

function initLottie() {
  const chars = [
    { cont: cont1.value, path: '/lottie/char1.json' },
    { cont: cont2.value, path: '/lottie/char2.json' },
    { cont: cont3.value, path: '/lottie/char3.json' },
  ]
  lottieInsts = chars.map(({ cont, path }) =>
    lottie.loadAnimation({ container: cont, renderer: 'svg', loop: true, autoplay: true, path })
  )
}

// ── Mouse tracking ────────────────────────────────────────────────────────────
const wraps = [wrap1, wrap2, wrap3]
const factors = [1.0, 0.65, 1.3]

function handleMouseMove(e) {
  const panel = brandPanelRef.value
  if (!panel) return
  const rect = panel.getBoundingClientRect()
  if (e.clientX > rect.right) return
  const nx = (e.clientX - rect.left) / rect.width - 0.5
  const ny = (e.clientY - rect.top) / rect.height - 0.5
  wraps.forEach((wRef, i) => {
    if (!wRef.value) return
    const f = factors[i]
    wRef.value.style.transform = `translate(${nx * 28 * f}px, ${ny * 20 * f}px)`
  })
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(async () => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
  const savedUser = localStorage.getItem(STORAGE_KEYS.USER)
  if (token && savedUser) {
    try { emit('login-success', JSON.parse(savedUser)) } catch {}
    return
  }

  initLottie()
  loadCaptcha()
})

onBeforeUnmount(() => {
  lottieInsts.forEach(i => i.destroy())
  clearTimeout(toastTimer)
})
</script>

<style scoped>
/* ── Layout ─────────────────────────────────────────────────────── */
.login-page {
  display: flex;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Segoe UI', sans-serif;
}

/* ── Left brand panel ───────────────────────────────────────────── */
.brand-panel {
  flex: 1;
  background: linear-gradient(150deg, #0d1b4b 0%, #1a2f7a 50%, #0a1a3e 100%);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding-bottom: 48px;
}

.brand-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
  background-size: 48px 48px;
}

.scene {
  position: relative;
  width: 340px;
  height: 260px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 16px;
}

.char-wrap {
  transition: transform 0.12s ease-out;
  display: flex;
  align-items: flex-end;
}

.char1 { width: 120px; }
.char2 { width: 100px; margin-bottom: 30px; }
.char3 { width: 110px; margin-bottom: 10px; }

.lottie-cont {
  width: 100%;
  height: 100%;
}

/* ── Right form panel ───────────────────────────────────────────── */
.form-panel {
  width: 440px;
  min-height: 100vh;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
}

.login-card {
  width: 100%;
  max-width: 360px;
  background: #ffffff;
  border-radius: 16px;
  padding: 36px 32px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
}

/* ── Logo ───────────────────────────────────────────────────────── */
.logo-section {
  text-align: center;
  margin-bottom: 28px;
}

.logo-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 14px;
}

.logo-icon svg {
  width: 64px;
  height: 64px;
}

.logo-title {
  font-size: 22px;
  font-weight: 700;
  color: #1e3a8a;
  letter-spacing: 0.02em;
  margin: 0 0 4px;
}

.logo-sub {
  font-size: 12px;
  color: #94a3b8;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin: 0;
}

/* ── Tab switcher ───────────────────────────────────────────────── */
.tab-switcher {
  display: flex;
  position: relative;
  background: #f1f5f9;
  border-radius: 10px;
  padding: 4px;
  margin-bottom: 24px;
}

.tab-btn {
  flex: 1;
  padding: 9px;
  background: transparent;
  border: none;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  position: relative;
  z-index: 1;
  transition: color 0.25s;
  border-radius: 7px;
}

.tab-btn.active { color: white; }

.tab-indicator {
  position: absolute;
  top: 4px;
  bottom: 4px;
  width: calc(50% - 4px);
  background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
  border-radius: 7px;
  transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.35);
}

/* ── Form fields ────────────────────────────────────────────────── */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field-group {
  position: relative;
  display: flex;
  align-items: center;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.field-group:focus-within {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
  background: #fff;
}

.field-icon {
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  flex-shrink: 0;
}

.field-icon svg { width: 16px; height: 16px; }

.field-group input {
  flex: 1;
  height: 44px;
  border: none;
  background: transparent;
  font-size: 14px;
  color: #1e293b;
  padding: 0 12px 0 0;
  outline: none;
}

.field-group input::placeholder { color: #94a3b8; }

.pwd-toggle {
  width: 40px;
  height: 44px;
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: color 0.15s;
}
.pwd-toggle:hover { color: #475569; }
.pwd-toggle svg { width: 16px; height: 16px; }

/* ── Captcha field ──────────────────────────────────────────────── */
.captcha-group { gap: 0; }

.captcha-input { width: 0; flex: 1; }

.captcha-img-btn {
  height: 44px;
  min-width: 110px;
  border: none;
  border-left: 1.5px solid #e2e8f0;
  background: #f1f5f9;
  border-radius: 0 8px 8px 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 0 8px;
  transition: background 0.15s;
  flex-shrink: 0;
}
.captcha-img-btn:hover { background: #e2e8f0; }

.captcha-svg {
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
}
.captcha-svg :deep(svg) {
  width: 100px;
  height: 36px;
  display: block;
}

.captcha-loading,
.captcha-placeholder {
  font-size: 12px;
  color: #64748b;
  white-space: nowrap;
}

/* ── Submit button ──────────────────────────────────────────────── */
.submit-btn {
  height: 46px;
  background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  letter-spacing: 0.05em;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 4px;
  box-shadow: 0 2px 12px rgba(37, 99, 235, 0.3);
}
.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(37, 99, 235, 0.4);
}
.submit-btn:active:not(:disabled) { transform: translateY(0); }
.submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.spinner {
  width: 18px; height: 18px;
  border: 2px solid rgba(255,255,255,0.35);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Footer links ───────────────────────────────────────────────── */
.foot-links {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
}

.foot-links a {
  font-size: 13px;
  color: #2563eb;
  text-decoration: none;
  transition: color 0.15s;
}
.foot-links a:hover { color: #1d4ed8; }

/* ── Toast ──────────────────────────────────────────────────────── */
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
  z-index: 9999;
  max-width: 400px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}
.toast svg { width: 18px; height: 18px; flex-shrink: 0; }
.toast.error { background: #ef4444; color: white; }
.toast.success { background: #059669; color: white; }

.toast-fade-enter-active, .toast-fade-leave-active { transition: all 0.3s ease; }
.toast-fade-enter-from, .toast-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-12px);
}

/* ── Responsive ─────────────────────────────────────────────────── */
@media (max-width: 900px) {
  .login-page { flex-direction: column; }
  .brand-panel { min-height: 220px; flex: none; align-items: center; padding-bottom: 24px; }
  .scene { width: 260px; height: 180px; }
  .char1 { width: 88px; }
  .char2 { width: 74px; }
  .char3 { width: 82px; }
  .form-panel { width: 100%; min-height: auto; }
}

@media (max-width: 480px) {
  .login-card { padding: 28px 20px; }
  .brand-panel { min-height: 180px; }
}
</style>
