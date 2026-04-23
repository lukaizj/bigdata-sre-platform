<template>
  <div class="bp-page">
    <!-- ╭── Blueprint paper (grid + noise) ──╮ -->
    <div class="bp-grid" aria-hidden="true"></div>
    <div class="bp-noise" aria-hidden="true"></div>

    <!-- ╭── TOP BAR: drawing header strip ──╮ -->
    <header class="bp-top">
      <div class="bp-top-left">
        <svg class="bp-compass" viewBox="0 0 40 40" aria-hidden="true">
          <circle cx="20" cy="20" r="14" fill="none" stroke="currentColor" stroke-width="1"/>
          <circle cx="20" cy="20" r="1.5" fill="currentColor"/>
          <path d="M20 6 L22 20 L20 18 L18 20 Z" fill="currentColor"/>
          <path d="M20 34 L18 20 L20 22 L22 20 Z" fill="currentColor" opacity="0.3"/>
          <text x="20" y="5" font-size="6" fill="currentColor" text-anchor="middle" font-family="JetBrains Mono">N</text>
        </svg>
        <span class="bp-top-tag">CLASSIFIED</span>
        <span class="bp-top-sep">·</span>
        <span class="bp-top-tag bp-tag-dim">AUTH_TERMINAL</span>
        <span class="bp-top-sep">·</span>
        <span class="bp-top-tag bp-tag-dim">INTERNAL_USE_ONLY</span>
      </div>
      <div class="bp-top-right">
        <span class="bp-top-key">DWG</span>
        <span class="bp-top-val">042-AUTH</span>
        <span class="bp-top-sep">·</span>
        <span class="bp-top-key">REV</span>
        <span class="bp-top-val">07</span>
        <span class="bp-top-sep">·</span>
        <span class="bp-top-clock">{{ clockNow }}</span>
      </div>
    </header>

    <!-- ╭── Corner marks on viewport ──╮ -->
    <span class="bp-corner bp-c-tl"></span>
    <span class="bp-corner bp-c-tr"></span>
    <span class="bp-corner bp-c-bl"></span>
    <span class="bp-corner bp-c-br"></span>

    <!-- ╭── MAIN CANVAS ──╮ -->
    <main class="bp-canvas">

      <!-- LEFT — the drawing -->
      <section class="bp-drawing">
        <!-- Margin rule with numbered stops -->
        <aside class="bp-margin">
          <span class="bp-margin-tick" v-for="(n, i) in marginTicks" :key="n">
            <em>{{ n }}</em>
            <i></i>
          </span>
        </aside>

        <!-- Huge display title -->
        <div class="bp-title-block">
          <span class="bp-eyebrow">
            <i class="bp-eyebrow-bar"></i>
            <span>PROJECT IDENTITY</span>
          </span>

          <h1 class="bp-title">
            <span class="bp-title-line line-a">BIG</span>
            <span class="bp-title-line line-b">DATA·SRE</span>
            <span class="bp-title-line line-c">PLATFORM</span>
          </h1>

          <!-- Dimension line under the title -->
          <div class="bp-dim">
            <span class="bp-dim-arrow bp-dim-l">◂</span>
            <span class="bp-dim-line"></span>
            <span class="bp-dim-num">{{ titleWidth }}</span>
            <span class="bp-dim-line"></span>
            <span class="bp-dim-arrow bp-dim-r">▸</span>
          </div>

          <p class="bp-sub">大数据运维平台 — Big Data Site Reliability Engineering Console</p>

          <!-- Hand-written annotation -->
          <div class="bp-note">
            <svg class="bp-note-arrow" viewBox="0 0 80 40" aria-hidden="true">
              <path d="M 2 38 Q 25 30, 40 18 T 76 4" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="2 3"/>
              <path d="M 72 2 L 76 4 L 74 8" fill="none" stroke="currentColor" stroke-width="1.2"/>
            </svg>
            <span class="bp-note-text">secure access port, rev. from 2024-Q3 —</span>
          </div>

          <!-- Callout badges pointing to form -->
          <div class="bp-callouts">
            <span class="bp-callout" v-for="c in callouts" :key="c.n">
              <em>{{ c.n }}</em>
              <span>{{ c.label }}</span>
            </span>
          </div>
        </div>

        <!-- Revision stamp -->
        <div class="bp-stamp">
          <div class="bp-stamp-inner">
            <span class="bp-stamp-check">✓</span>
            <div class="bp-stamp-text">
              <strong>APPROVED</strong>
              <small>SEC-AUDIT · {{ stampDate }}</small>
            </div>
          </div>
        </div>
      </section>

      <!-- RIGHT — the detail view (form) -->
      <section class="bp-detail">
        <!-- Detail frame with tick marks -->
        <span class="bp-tick bp-tick-tl"></span>
        <span class="bp-tick bp-tick-tr"></span>
        <span class="bp-tick bp-tick-bl"></span>
        <span class="bp-tick bp-tick-br"></span>

        <header class="bp-detail-head">
          <span class="bp-detail-k">详情</span>
          <span class="bp-detail-v">A — 认证入口</span>
          <span class="bp-detail-scale">比例 1:1</span>
        </header>

        <!-- Tab switch styled as drawing tab -->
        <nav class="bp-tabs">
          <button
            :class="['bp-tab', { active: tab === 'login' }]"
            @click="tab = 'login'"
          >
            <span class="bp-tab-n">01</span>
            <span class="bp-tab-l">登录</span>
          </button>
          <button
            :class="['bp-tab', { active: tab === 'register' }]"
            @click="tab = 'register'"
          >
            <span class="bp-tab-n">02</span>
            <span class="bp-tab-l">注册</span>
          </button>
          <span class="bp-tab-rail" :style="{ transform: `translateX(${tab === 'login' ? 0 : 100}%)` }"></span>
        </nav>

        <!-- LOGIN -->
        <form v-if="tab === 'login'" @submit.prevent="handleLogin" class="bp-form">
          <div class="bp-field">
            <label class="bp-label">
              <span class="bp-label-k">01</span>
              <span class="bp-label-v">邮箱 · 身份</span>
            </label>
            <div class="bp-input-wrap">
              <input v-model="loginForm.email" type="email" placeholder="请输入邮箱" required autocomplete="username" class="bp-input"/>
              <span class="bp-input-arrow">▸</span>
            </div>
          </div>

          <div class="bp-field">
            <label class="bp-label">
              <span class="bp-label-k">02</span>
              <span class="bp-label-v">密码 · 密钥</span>
            </label>
            <div class="bp-input-wrap">
              <input v-model="loginForm.password" :type="showPwd ? 'text' : 'password'" placeholder="请输入密码" required autocomplete="current-password" class="bp-input"/>
              <button type="button" class="bp-input-icon" @click="showPwd = !showPwd" tabindex="-1" :title="showPwd ? '隐藏' : '显示'">
                <svg v-if="showPwd" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/></svg>
                <svg v-else viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781z" clip-rule="evenodd"/></svg>
              </button>
            </div>
          </div>

          <div class="bp-field">
            <label class="bp-label">
              <span class="bp-label-k">03</span>
              <span class="bp-label-v">验证码 · 校验</span>
            </label>
            <div class="bp-captcha-row">
              <div class="bp-input-wrap bp-captcha-wrap">
                <input v-model="loginForm.captchaCode" type="text" placeholder="请输入验证码" required maxlength="6" class="bp-input"/>
              </div>
              <button type="button" class="bp-captcha-img" @click="loadCaptcha" title="点击刷新验证码">
                <span v-if="captchaLoading" class="bp-captcha-load">加载中</span>
                <img v-else-if="captchaSrc" :src="captchaSrc" alt="验证码" />
                <span v-else class="bp-captcha-load">获取验证码</span>
              </button>
            </div>
          </div>

          <button type="submit" class="bp-exec" :disabled="loading">
            <span class="bp-exec-label">
              <span v-if="loading">执行中...</span>
              <span v-else>登录</span>
            </span>
            <span class="bp-exec-arrows" v-if="!loading">
              <span>▸</span><span>▸</span><span>▸</span>
            </span>
            <span v-if="loading" class="bp-spinner"></span>
          </button>

          <div class="bp-form-foot">
            <a href="#" @click.prevent>忘记密码</a>
            <span class="bp-foot-sep">|</span>
            <a href="#" @click.prevent="tab = 'register'">注册账号 →</a>
          </div>
        </form>

        <!-- REGISTER -->
        <form v-else @submit.prevent="handleRegister" class="bp-form">
          <div class="bp-field">
            <label class="bp-label">
              <span class="bp-label-k">01</span>
              <span class="bp-label-v">用户名 · 昵称</span>
            </label>
            <div class="bp-input-wrap">
              <input v-model="registerForm.username" type="text" placeholder="请输入用户名" required class="bp-input"/>
              <span class="bp-input-arrow">▸</span>
            </div>
          </div>
          <div class="bp-field">
            <label class="bp-label">
              <span class="bp-label-k">02</span>
              <span class="bp-label-v">邮箱 · 身份</span>
            </label>
            <div class="bp-input-wrap">
              <input v-model="registerForm.email" type="email" placeholder="请输入邮箱" required class="bp-input"/>
              <span class="bp-input-arrow">▸</span>
            </div>
          </div>
          <div class="bp-field">
            <label class="bp-label">
              <span class="bp-label-k">03</span>
              <span class="bp-label-v">密码 · 密钥 (至少6位)</span>
            </label>
            <div class="bp-input-wrap">
              <input v-model="registerForm.password" :type="showPwd ? 'text' : 'password'" placeholder="请输入密码" required minlength="6" class="bp-input"/>
              <button type="button" class="bp-input-icon" @click="showPwd = !showPwd" tabindex="-1">
                <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/></svg>
              </button>
            </div>
          </div>
          <div class="bp-field">
            <label class="bp-label">
              <span class="bp-label-k">04</span>
              <span class="bp-label-v">确认密码 · 密钥</span>
            </label>
            <div class="bp-input-wrap">
              <input v-model="registerForm.confirmPassword" :type="showPwd ? 'text' : 'password'" placeholder="请确认密码" required class="bp-input"/>
              <span class="bp-input-arrow">▸</span>
            </div>
          </div>
          <div class="bp-field">
            <label class="bp-label">
              <span class="bp-label-k">05</span>
              <span class="bp-label-v">验证码 · 校验</span>
            </label>
            <div class="bp-captcha-row">
              <div class="bp-input-wrap bp-captcha-wrap">
                <input v-model="registerForm.captchaCode" type="text" placeholder="请输入验证码" required maxlength="6" class="bp-input"/>
              </div>
              <button type="button" class="bp-captcha-img" @click="loadCaptcha">
                <span v-if="captchaLoading" class="bp-captcha-load">加载中</span>
                <img v-else-if="captchaSrc" :src="captchaSrc" alt="验证码" />
                <span v-else class="bp-captcha-load">获取验证码</span>
              </button>
            </div>
          </div>
          <button type="submit" class="bp-exec" :disabled="loading">
            <span class="bp-exec-label"><span v-if="loading">提交中...</span><span v-else>注册</span></span>
            <span class="bp-exec-arrows" v-if="!loading"><span>▸</span><span>▸</span><span>▸</span></span>
            <span v-if="loading" class="bp-spinner"></span>
          </button>
          <div class="bp-form-foot">
            <a href="#" @click.prevent="tab = 'login'">← 返回登录</a>
          </div>
        </form>
      </section>
    </main>

    <!-- ╭── BOTTOM: TITLE BLOCK (like real blueprints) ──╮ -->
    <footer class="bp-title-block-foot">
      <div class="bp-tb-col bp-tb-grow">
        <div class="bp-tb-row"><span class="bp-tb-k">PROJECT</span><span class="bp-tb-v">BIG DATA SRE PLATFORM</span></div>
        <div class="bp-tb-row"><span class="bp-tb-k">DRAWING</span><span class="bp-tb-v">AUTHENTICATION GATE</span></div>
      </div>
      <div class="bp-tb-col">
        <div class="bp-tb-row"><span class="bp-tb-k">DATE</span><span class="bp-tb-v">{{ todayIso }}</span></div>
        <div class="bp-tb-row"><span class="bp-tb-k">SESSION</span><span class="bp-tb-v">CH-{{ sessionId }}</span></div>
      </div>
      <div class="bp-tb-col bp-tb-narrow">
        <div class="bp-tb-row"><span class="bp-tb-k">SCALE</span><span class="bp-tb-v">1:1</span></div>
        <div class="bp-tb-row"><span class="bp-tb-k">SHEET</span><span class="bp-tb-v">01 / 01</span></div>
      </div>
    </footer>

    <!-- Toast -->
    <transition name="bp-toast">
      <div v-if="toast.show" :class="['bp-toast', toast.type]">
        <span class="bp-toast-tag">{{ toast.type === 'error' ? '⚠ ERROR' : '✓ OK' }}</span>
        <span class="bp-toast-msg">{{ toast.message }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import axios from 'axios'
import { STORAGE_KEYS } from '../utils/constants'

const emit = defineEmits(['login-success'])

// ── UI state ──────────────────────────────────────────────
const tab = ref('login')
const loading = ref(false)
const showPwd = ref(false)

// ── Drawing flavor ────────────────────────────────────────
const clockNow = ref('')
const todayIso = ref('')
const stampDate = ref('')
const sessionId = ref(Math.random().toString(36).slice(2, 6).toUpperCase())

const marginTicks = ref(['01', '02', '03', '04', '05'])
const callouts = ref([
  { n: 1, label: 'SEE DETAIL A' },
  { n: 2, label: 'AUTH GATE' },
  { n: 3, label: 'ENTRY POINT' }
])

const titleWidth = ref('842')

let clockTimer = null
function tickClock() {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  clockNow.value = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  todayIso.value = `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`
  stampDate.value = `${d.getFullYear()}.${pad(d.getMonth() + 1)}`
}

// ── Form data ─────────────────────────────────────────────
const loginForm = ref({ email: '', password: '', captchaCode: '' })
const registerForm = ref({ username: '', email: '', password: '', confirmPassword: '', captchaCode: '' })

// ── Captcha ───────────────────────────────────────────────
const captchaId = ref('')
const captchaSvg = ref('')
const captchaLoading = ref(false)

const captchaSrc = computed(() =>
  captchaSvg.value
    ? `data:image/svg+xml,${encodeURIComponent(captchaSvg.value)}`
    : ''
)

let captchaGeneration = 0
async function loadCaptcha() {
  const gen = ++captchaGeneration
  captchaLoading.value = true
  captchaSvg.value = ''
  try {
    const { data } = await axios.get('/api/auth/captcha')
    if (gen !== captchaGeneration) return
    captchaId.value = data.captchaId
    captchaSvg.value = data.svg
  } catch {
    if (gen !== captchaGeneration) return
    showToast('验证码加载失败，请重试', 'error')
  } finally {
    if (gen === captchaGeneration) captchaLoading.value = false
  }
}

watch(tab, () => {
  loginForm.value.captchaCode = ''
  registerForm.value.captchaCode = ''
  showPwd.value = false
  loadCaptcha()
})

// ── Toast ─────────────────────────────────────────────────
const toast = ref({ show: false, message: '', type: 'error' })
let toastTimer = null
function showToast(message, type = 'error') {
  toast.value = { show: true, message, type }
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value.show = false }, 3000)
}

// ── Auth handlers ─────────────────────────────────────────
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
    showToast('认证通过，正在跳转…', 'success')
    setTimeout(() => emit('login-success', data.user), 500)
  } catch (err) {
    showToast(err.response?.data?.error || '登录失败，请稍后重试', 'error')
    await loadCaptcha()
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
    return showToast('密码至少需要 6 个字符', 'error')
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
    showToast('注册成功，正在跳转…', 'success')
    setTimeout(() => emit('login-success', data.user), 500)
  } catch (err) {
    showToast(err.response?.data?.error || '注册失败，请稍后重试', 'error')
    await loadCaptcha()
    registerForm.value.captchaCode = ''
  } finally {
    loading.value = false
  }
}

// ── Lifecycle ─────────────────────────────────────────────
onMounted(() => {
  tickClock()
  clockTimer = setInterval(tickClock, 1000)
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
  const savedUser = localStorage.getItem(STORAGE_KEYS.USER)
  if (token && savedUser) {
    try { emit('login-success', JSON.parse(savedUser)) }
    catch {
      localStorage.removeItem(STORAGE_KEYS.TOKEN)
      localStorage.removeItem(STORAGE_KEYS.USER)
    }
    return
  }
  loadCaptcha()
})

onBeforeUnmount(() => {
  clearTimeout(toastTimer)
  clearInterval(clockTimer)
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@400;700;900&family=Hanken+Grotesk:wght@300;400;500;600;700&family=Caveat:wght@500&display=swap');

/* ╭── Design tokens ──╮ */
.bp-page {
  --ink:          #0a1726;
  --ink-2:        #0e1d31;
  --ink-3:        #12253c;
  --grid:         rgba(92, 228, 255, 0.06);
  --grid-strong:  rgba(92, 228, 255, 0.12);
  --chalk:        #f0e6d2;
  --chalk-2:      #d8cdb3;
  --chalk-dim:    #aba088;
  --chalk-faint:  rgba(240, 230, 210, 0.3);
  --blueprint:    #5ce4ff;
  --blueprint-2:  #2ba8d0;
  --amber:        #f5a623;
  --amber-2:      #d4881b;
  --red-stamp:    #ff4a3c;
  --green-check:  #8fd4a5;

  --fnt-display:  'Unbounded', 'Hanken Grotesk', sans-serif;
  --fnt-body:     'Hanken Grotesk', -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  --fnt-mono:     'JetBrains Mono', 'Courier New', monospace;
  --fnt-hand:     'Caveat', cursive;

  position: relative;
  min-height: 100vh;
  background: var(--ink);
  color: var(--chalk);
  font-family: var(--fnt-body);
  overflow: hidden;
  isolation: isolate;
}

/* ╭── Blueprint grid paper ──╮ */
.bp-grid {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(to right, var(--grid-strong) 1px, transparent 1px),
    linear-gradient(to bottom, var(--grid-strong) 1px, transparent 1px),
    linear-gradient(to right, var(--grid) 1px, transparent 1px),
    linear-gradient(to bottom, var(--grid) 1px, transparent 1px);
  background-size: 80px 80px, 80px 80px, 20px 20px, 20px 20px;
  background-position: -1px -1px, -1px -1px, -1px -1px, -1px -1px;
  pointer-events: none;
  z-index: 0;
  mask-image: radial-gradient(ellipse at center, black 40%, rgba(0,0,0,0.4) 100%);
  animation: bp-fade 0.8s ease-out backwards;
}

.bp-noise {
  position: absolute; inset: 0;
  pointer-events: none;
  z-index: 1;
  mix-blend-mode: overlay;
  opacity: 0.4;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.3 0 0 0 0 0.5 0 0 0 0 0.7 0 0 0 0.06 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
}

/* ╭── Corner marks ──╮ */
.bp-corner {
  position: fixed;
  width: 22px; height: 22px;
  border: 1.5px solid var(--blueprint);
  opacity: 0.7;
  z-index: 10;
  animation: bp-fade 0.6s ease-out 0.3s backwards;
}
.bp-c-tl { top: 14px; left: 14px; border-right: none; border-bottom: none; }
.bp-c-tr { top: 14px; right: 14px; border-left: none; border-bottom: none; }
.bp-c-bl { bottom: 14px; left: 14px; border-right: none; border-top: none; }
.bp-c-br { bottom: 14px; right: 14px; border-left: none; border-top: none; }

/* ╭── Top bar ──╮ */
.bp-top {
  position: relative;
  z-index: 5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 48px;
  border-bottom: 1px solid var(--chalk-faint);
  font-family: var(--fnt-mono);
  font-size: 11px;
  letter-spacing: 0.14em;
  color: var(--chalk-2);
  animation: bp-slide-down 0.7s cubic-bezier(.2,.8,.2,1) backwards;
}
.bp-top-left, .bp-top-right { display: flex; align-items: center; gap: 10px; }
.bp-compass { width: 28px; height: 28px; color: var(--blueprint); }
.bp-top-tag { text-transform: uppercase; }
.bp-tag-dim { color: var(--chalk-dim); }
.bp-top-sep { color: var(--chalk-dim); opacity: 0.5; }
.bp-top-key { color: var(--chalk-dim); font-weight: 400; }
.bp-top-val { color: var(--amber); font-weight: 700; }
.bp-top-clock { color: var(--blueprint); font-weight: 700; text-shadow: 0 0 12px rgba(92, 228, 255, 0.4); }

/* ╭── Canvas ──╮ */
.bp-canvas {
  position: relative;
  z-index: 4;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(440px, 1fr);
  gap: 64px;
  padding: 64px 72px;
  min-height: calc(100vh - 180px);
  align-items: center;
}

/* ╭── LEFT: Drawing ──╮ */
.bp-drawing {
  position: relative;
  display: flex;
  gap: 32px;
  padding-left: 56px;
}

/* Margin ruler */
.bp-margin {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 40px;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  border-right: 1px solid var(--chalk-faint);
}
.bp-margin-tick {
  display: flex;
  align-items: center;
  gap: 6px;
  position: relative;
  animation: bp-fade 0.4s ease-out backwards;
}
.bp-margin-tick:nth-child(1) { animation-delay: 0.4s; }
.bp-margin-tick:nth-child(2) { animation-delay: 0.5s; }
.bp-margin-tick:nth-child(3) { animation-delay: 0.6s; }
.bp-margin-tick:nth-child(4) { animation-delay: 0.7s; }
.bp-margin-tick:nth-child(5) { animation-delay: 0.8s; }
.bp-margin-tick em {
  font-family: var(--fnt-mono);
  font-size: 10px;
  font-style: normal;
  color: var(--chalk-dim);
  letter-spacing: 0.08em;
}
.bp-margin-tick i {
  display: block;
  width: 8px;
  height: 1px;
  background: var(--blueprint);
}

.bp-title-block {
  position: relative;
  padding: 8px 0;
}

.bp-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-family: var(--fnt-mono);
  font-size: 10px;
  letter-spacing: 0.18em;
  color: var(--amber);
  margin-bottom: 20px;
  animation: bp-fade 0.5s ease-out 0.5s backwards;
}
.bp-eyebrow-bar {
  display: block;
  width: 32px; height: 1px;
  background: var(--amber);
  box-shadow: 0 0 8px rgba(245, 166, 35, 0.5);
}

.bp-title {
  font-family: var(--fnt-display);
  font-weight: 900;
  line-height: 0.88;
  letter-spacing: -0.03em;
  color: var(--chalk);
  margin-bottom: 24px;
}
.bp-title-line {
  display: block;
  font-size: clamp(56px, 8vw, 120px);
  overflow: hidden;
}
.bp-title-line span, .bp-title-line { animation: bp-reveal 0.9s cubic-bezier(.2,.8,.2,1) backwards; }
.line-a { animation-delay: 0.4s; }
.line-b {
  animation-delay: 0.55s;
  background: linear-gradient(100deg, var(--chalk) 0%, var(--blueprint) 55%, var(--chalk) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  position: relative;
}
.line-c {
  animation-delay: 0.7s;
  color: var(--chalk-dim);
  font-size: clamp(42px, 6vw, 90px) !important;
}

/* Dimension line */
.bp-dim {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 20px;
  margin: 16px 0 28px;
  color: var(--blueprint-2);
  font-family: var(--fnt-mono);
  font-size: 11px;
  animation: bp-fade 0.8s ease-out 1s backwards;
}
.bp-dim-arrow { color: var(--blueprint); font-size: 16px; line-height: 1; }
.bp-dim-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, var(--blueprint) 8%, var(--blueprint) 92%, transparent 100%);
  box-shadow: 0 0 8px rgba(92, 228, 255, 0.4);
}
.bp-dim-num {
  padding: 2px 10px;
  background: var(--ink);
  color: var(--blueprint);
  font-weight: 700;
  letter-spacing: 0.1em;
  border: 1px solid rgba(92, 228, 255, 0.4);
}

.bp-sub {
  color: var(--chalk-dim);
  font-size: 14px;
  letter-spacing: 0.02em;
  line-height: 1.6;
  max-width: 520px;
  margin-bottom: 28px;
  animation: bp-fade 0.6s ease-out 1.2s backwards;
}

/* Handwritten annotation */
.bp-note {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  margin-bottom: 24px;
  animation: bp-fade 0.8s ease-out 1.6s backwards;
}
.bp-note-arrow {
  width: 80px; height: 40px;
  color: var(--amber);
  flex-shrink: 0;
  transform: scaleX(-1);
}
.bp-note-text {
  font-family: var(--fnt-hand);
  font-size: 22px;
  color: var(--amber);
  line-height: 1;
  transform: rotate(-2deg);
  opacity: 0.9;
}

/* Callout badges */
.bp-callouts {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  margin-top: 8px;
  animation: bp-fade 0.7s ease-out 1.8s backwards;
}
.bp-callout {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px 6px 6px;
  border: 1px solid var(--chalk-faint);
  border-radius: 24px;
  font-family: var(--fnt-mono);
  font-size: 10px;
  letter-spacing: 0.14em;
  color: var(--chalk-dim);
  transition: all 0.3s;
}
.bp-callout em {
  display: grid;
  place-items: center;
  width: 22px; height: 22px;
  border: 1px solid var(--blueprint);
  border-radius: 50%;
  background: var(--ink-3);
  color: var(--blueprint);
  font-style: normal;
  font-weight: 700;
  font-size: 10px;
}
.bp-callout:hover { border-color: var(--blueprint); color: var(--chalk); }

/* Revision stamp */
.bp-stamp {
  position: absolute;
  bottom: 0;
  right: 0;
  transform: rotate(-8deg);
  animation: bp-stamp-in 0.6s cubic-bezier(.4,1.6,.5,1) 2s backwards;
}
.bp-stamp-inner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 18px;
  border: 2px solid var(--red-stamp);
  color: var(--red-stamp);
  font-family: var(--fnt-mono);
  font-weight: 700;
  letter-spacing: 0.14em;
  background: rgba(255, 74, 60, 0.03);
  box-shadow: 0 0 0 3px rgba(255, 74, 60, 0.1);
  opacity: 0.85;
}
.bp-stamp-check {
  display: grid;
  place-items: center;
  width: 26px; height: 26px;
  border: 2px solid var(--red-stamp);
  border-radius: 50%;
  font-size: 14px;
  font-weight: 900;
}
.bp-stamp-text { line-height: 1.1; }
.bp-stamp-text strong { font-size: 13px; display: block; }
.bp-stamp-text small { font-size: 9px; opacity: 0.8; letter-spacing: 0.2em; }

/* ╭── RIGHT: Detail view (form) ──╮ */
.bp-detail {
  position: relative;
  padding: 36px 40px;
  background: linear-gradient(180deg, var(--ink-2) 0%, var(--ink) 100%);
  border: 1px solid var(--chalk-faint);
  box-shadow:
    0 40px 80px rgba(0, 0, 0, 0.6),
    inset 0 1px 0 rgba(92, 228, 255, 0.1);
  animation: bp-fade 0.7s ease-out 0.8s backwards;
}
.bp-detail::before {
  content: '';
  position: absolute; inset: 0;
  border: 1px solid rgba(92, 228, 255, 0.12);
  margin: 6px;
  pointer-events: none;
}

/* Tick marks at corners of detail frame */
.bp-tick {
  position: absolute;
  width: 14px; height: 14px;
  background:
    linear-gradient(currentColor 0 0) left top/100% 1.5px no-repeat,
    linear-gradient(currentColor 0 0) left top/1.5px 100% no-repeat;
  color: var(--blueprint);
}
.bp-tick-tl { top: -1px; left: -1px; }
.bp-tick-tr { top: -1px; right: -1px; transform: scaleX(-1); }
.bp-tick-bl { bottom: -1px; left: -1px; transform: scaleY(-1); }
.bp-tick-br { bottom: -1px; right: -1px; transform: scale(-1); }

.bp-detail-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 22px;
  padding-bottom: 14px;
  border-bottom: 1px dashed var(--chalk-faint);
  font-family: var(--fnt-mono);
}
.bp-detail-k { font-size: 10px; color: var(--chalk-dim); letter-spacing: 0.2em; }
.bp-detail-v { font-size: 13px; color: var(--blueprint); font-weight: 700; letter-spacing: 0.12em; }
.bp-detail-scale { margin-left: auto; font-size: 9px; color: var(--chalk-dim); letter-spacing: 0.2em; }

/* ╭── Tabs ──╮ */
.bp-tabs {
  position: relative;
  display: flex;
  margin-bottom: 24px;
  border: 1px solid var(--chalk-faint);
}
.bp-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 8px;
  border: none;
  background: transparent;
  color: var(--chalk-dim);
  font-family: var(--fnt-mono);
  font-size: 12px;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: color 0.25s;
  z-index: 2;
}
.bp-tab-n { font-size: 9px; opacity: 0.6; }
.bp-tab-l { font-family: var(--fnt-body); font-weight: 600; font-size: 13px; }
.bp-tab.active { color: var(--ink); }
.bp-tab-rail {
  position: absolute;
  top: 0; bottom: 0; left: 0;
  width: 50%;
  background: var(--blueprint);
  box-shadow: 0 0 20px rgba(92, 228, 255, 0.5);
  transition: transform 0.35s cubic-bezier(.2,.8,.2,1);
  z-index: 1;
}

/* ╭── Form fields ──╮ */
.bp-form { display: flex; flex-direction: column; gap: 18px; }
.bp-field { display: flex; flex-direction: column; gap: 6px; }
.bp-label {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-family: var(--fnt-mono);
}
.bp-label-k {
  font-size: 11px;
  color: var(--blueprint);
  letter-spacing: 0.1em;
  padding: 2px 8px;
  border: 1px solid rgba(92, 228, 255, 0.3);
  background: rgba(92, 228, 255, 0.05);
}
.bp-label-v {
  font-size: 13px;
  color: var(--chalk-dim);
  letter-spacing: 0.08em;
}

.bp-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
  border-bottom: 1.5px solid var(--chalk-faint);
  transition: border-color 0.25s;
  padding-right: 4px;
}
.bp-input-wrap::before,
.bp-input-wrap::after {
  content: '';
  position: absolute;
  bottom: -5px;
  width: 0;
  height: 8px;
  background: var(--blueprint);
  transition: width 0.3s cubic-bezier(.2,.8,.2,1);
}
.bp-input-wrap::before { left: 0; }
.bp-input-wrap::after { right: 0; }
.bp-input-wrap:focus-within { border-bottom-color: var(--blueprint); }
.bp-input-wrap:focus-within::before,
.bp-input-wrap:focus-within::after {
  width: 1.5px;
}

.bp-input {
  flex: 1;
  width: 100%;
  padding: 10px 4px 10px 0;
  background: transparent;
  border: none;
  color: var(--chalk);
  font-family: var(--fnt-mono);
  font-size: 14px;
  letter-spacing: 0.04em;
  outline: none;
}
.bp-input::placeholder { color: var(--chalk-dim); opacity: 0.45; }
.bp-input-arrow {
  color: var(--chalk-dim);
  font-size: 14px;
  opacity: 0.5;
  transition: all 0.25s;
}
.bp-input-wrap:focus-within .bp-input-arrow {
  color: var(--blueprint);
  opacity: 1;
  transform: translateX(2px);
}
.bp-input-icon {
  width: 28px; height: 28px;
  display: grid;
  place-items: center;
  background: transparent;
  border: none;
  color: var(--chalk-dim);
  cursor: pointer;
  transition: color 0.2s;
}
.bp-input-icon:hover { color: var(--blueprint); }
.bp-input-icon svg { width: 16px; height: 16px; }

.bp-captcha-row { display: flex; gap: 12px; align-items: flex-end; }
.bp-captcha-wrap { flex: 1; }
.bp-captcha-img {
  width: 128px; height: 44px;
  flex-shrink: 0;
  padding: 0;
  background: rgba(92, 228, 255, 0.05);
  border: 1px solid rgba(92, 228, 255, 0.3);
  color: var(--blueprint);
  font-family: var(--fnt-mono);
  font-size: 11px;
  letter-spacing: 0.14em;
  cursor: pointer;
  transition: all 0.2s;
  display: grid;
  place-items: center;
  overflow: hidden;
}
.bp-captcha-img:hover { border-color: var(--blueprint); background: rgba(92, 228, 255, 0.1); }
.bp-captcha-img img {
  width: 120px; height: 40px; display: block;
}
.bp-captcha-load { font-weight: 700; }

/* ╭── Execute button ──╮ */
.bp-exec {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 22px;
  margin-top: 12px;
  background: var(--chalk);
  border: 1.5px solid var(--chalk);
  color: var(--ink);
  font-family: var(--fnt-display);
  font-weight: 700;
  font-size: 15px;
  letter-spacing: 0.14em;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(.2,.8,.2,1);
  text-transform: uppercase;
}
.bp-exec::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--blueprint);
  transform: translateX(-101%);
  transition: transform 0.35s cubic-bezier(.2,.8,.2,1);
  z-index: 0;
}
.bp-exec:hover::before { transform: translateX(0); }
.bp-exec:hover { color: var(--ink); border-color: var(--blueprint); box-shadow: 0 0 32px rgba(92, 228, 255, 0.4); }
.bp-exec:disabled { opacity: 0.5; cursor: not-allowed; }
.bp-exec-label, .bp-exec-arrows { position: relative; z-index: 1; }
.bp-exec-arrows { display: flex; gap: 2px; }
.bp-exec-arrows span {
  display: block;
  opacity: 0;
  animation: bp-arrows 1.2s ease-in-out infinite;
  color: var(--ink);
}
.bp-exec-arrows span:nth-child(2) { animation-delay: 0.15s; }
.bp-exec-arrows span:nth-child(3) { animation-delay: 0.3s; }
.bp-exec:hover .bp-exec-arrows span { animation-play-state: running; }

.bp-spinner {
  width: 16px; height: 16px;
  border: 2px solid var(--ink);
  border-top-color: transparent;
  border-radius: 50%;
  animation: bp-spin 0.7s linear infinite;
}

.bp-form-foot {
  display: flex;
  justify-content: center;
  gap: 14px;
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px dashed var(--chalk-faint);
  font-family: var(--fnt-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
}
.bp-form-foot a {
  color: var(--chalk-dim);
  text-decoration: none;
  transition: color 0.2s;
}
.bp-form-foot a:hover { color: var(--blueprint); }
.bp-foot-sep { color: var(--chalk-faint); }

/* ╭── Title block (bottom) ──╮ */
.bp-title-block-foot {
  position: relative;
  z-index: 5;
  display: flex;
  border-top: 1px solid var(--chalk-faint);
  margin: 0 48px;
  font-family: var(--fnt-mono);
  animation: bp-slide-up 0.7s cubic-bezier(.2,.8,.2,1) 0.3s backwards;
}
.bp-tb-col {
  display: flex;
  flex-direction: column;
  padding: 14px 22px;
  border-right: 1px solid var(--chalk-faint);
  min-width: 180px;
}
.bp-tb-col:last-child { border-right: none; }
.bp-tb-grow { flex: 1; }
.bp-tb-narrow { min-width: 140px; }
.bp-tb-row { display: flex; gap: 12px; line-height: 1.8; }
.bp-tb-k {
  font-size: 9px;
  color: var(--chalk-dim);
  letter-spacing: 0.2em;
  width: 70px;
  flex-shrink: 0;
}
.bp-tb-v {
  font-size: 11px;
  color: var(--chalk);
  letter-spacing: 0.08em;
  font-weight: 700;
}

/* ╭── Toast ──╮ */
.bp-toast {
  position: fixed;
  top: 80px; left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 22px;
  background: var(--ink-2);
  border: 1px solid var(--red-stamp);
  box-shadow: 0 10px 40px rgba(255, 74, 60, 0.2);
  font-family: var(--fnt-mono);
  font-size: 12px;
  letter-spacing: 0.08em;
  color: var(--chalk);
  z-index: 100;
}
.bp-toast.success { border-color: var(--green-check); box-shadow: 0 10px 40px rgba(143, 212, 165, 0.2); }
.bp-toast-tag {
  padding: 3px 9px;
  background: var(--red-stamp);
  color: var(--ink);
  font-weight: 700;
  font-size: 10px;
  letter-spacing: 0.14em;
}
.bp-toast.success .bp-toast-tag { background: var(--green-check); }

.bp-toast-enter-from, .bp-toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-12px) rotate(-1deg);
}
.bp-toast-enter-active, .bp-toast-leave-active { transition: all 0.35s cubic-bezier(.2,.8,.2,1); }

/* ╭── Keyframes ──╮ */
@keyframes bp-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes bp-slide-down { from { transform: translateY(-100%); opacity: 0; } }
@keyframes bp-slide-up { from { transform: translateY(100%); opacity: 0; } }
@keyframes bp-reveal {
  from { clip-path: inset(0 100% 0 0); }
  to { clip-path: inset(0 0 0 0); }
}
@keyframes bp-spin { to { transform: rotate(360deg); } }
@keyframes bp-arrows {
  0%, 100% { opacity: 0; transform: translateX(-4px); }
  50% { opacity: 1; transform: translateX(0); }
}
@keyframes bp-stamp-in {
  0% { opacity: 0; transform: rotate(-20deg) scale(2); }
  60% { opacity: 1; transform: rotate(-6deg) scale(0.95); }
  100% { opacity: 0.85; transform: rotate(-8deg) scale(1); }
}

/* ╭── Responsive ──╮ */
@media (max-width: 1024px) {
  .bp-canvas {
    grid-template-columns: 1fr;
    padding: 48px 32px;
    gap: 48px;
  }
  .bp-drawing { padding-left: 44px; }
  .bp-title-line { font-size: clamp(44px, 10vw, 80px); }
  .line-c { font-size: clamp(32px, 7vw, 56px) !important; }
  .bp-stamp { position: static; margin-top: 32px; align-self: flex-start; display: inline-block; }
  .bp-title-block-foot { margin: 0 24px; flex-wrap: wrap; }
  .bp-tb-col { min-width: 160px; }
}

@media (max-width: 640px) {
  .bp-top { padding: 12px 20px; font-size: 9px; gap: 8px; flex-wrap: wrap; }
  .bp-top-left, .bp-top-right { gap: 6px; }
  .bp-compass { width: 22px; height: 22px; }
  .bp-canvas { padding: 32px 20px; gap: 32px; }
  .bp-drawing { padding-left: 32px; }
  .bp-margin { width: 28px; }
  .bp-detail { padding: 24px 22px; }
  .bp-title-line { font-size: clamp(36px, 12vw, 54px); }
  .line-c { font-size: clamp(24px, 8vw, 36px) !important; }
  .bp-note-text { font-size: 18px; }
  .bp-callouts { gap: 8px; }
  .bp-callout { font-size: 9px; padding: 4px 10px 4px 4px; }
  .bp-title-block-foot { margin: 0 12px; }
  .bp-tb-col { flex: 1 1 50%; min-width: 140px; padding: 10px 16px; }
  .bp-corner { width: 14px; height: 14px; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01s !important;
    transition-duration: 0.01s !important;
  }
}
</style>
