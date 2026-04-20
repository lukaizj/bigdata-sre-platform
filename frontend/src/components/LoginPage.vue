<template>
  <div class="login-page">
    <!-- ╭─── 顶部任务控制状态栏 ───╮ -->
    <div class="mission-bar">
      <div class="mb-left">
        <span class="mb-dot"></span>
        <span class="mb-tag">NEXUS</span>
        <span class="mb-sep">//</span>
        <span class="mb-tag-dim">SRE_COMMAND</span>
      </div>
      <div class="mb-center">
        <span class="mb-label">CLASSIFICATION</span>
        <span class="mb-value">INTERNAL · UNRESTRICTED</span>
        <span class="mb-sep">·</span>
        <span class="mb-label">BUILD</span>
        <span class="mb-value">4.2.1 / STABLE</span>
      </div>
      <div class="mb-right">
        <span class="mb-label">UTC</span>
        <span class="mb-clock">{{ clockNow }}</span>
        <span class="mb-pill">● NOMINAL</span>
      </div>
    </div>

    <!-- ╭─── 视口四角框选 ───╮ -->
    <span class="corner-bracket cb-tl"></span>
    <span class="corner-bracket cb-tr"></span>
    <span class="corner-bracket cb-bl"></span>
    <span class="corner-bracket cb-br"></span>

    <!-- ╭───────────────── 左侧品牌区 ─────────────────╮ -->
    <div class="brand-panel">
      <!-- CRT 噪点层 -->
      <div class="grain-overlay"></div>

      <!-- 六边形网格背景 -->
      <div class="hex-grid"></div>

      <!-- 水平扫描线 -->
      <div class="crt-scan"></div>

      <!-- 脉冲光环 -->
      <div class="pulse-ring ring-1"></div>
      <div class="pulse-ring ring-2"></div>
      <div class="pulse-ring ring-3"></div>

      <!-- 星点 -->
      <div class="star" v-for="n in 18" :key="'s'+n" :style="starStyle(n)"></div>

      <!-- 左侧纵向读数 -->
      <aside class="side-readout side-readout-l">
        <div class="sr-head">
          <span>SYS//METRICS</span>
          <span class="sr-live">●&nbsp;LIVE</span>
        </div>
        <div v-for="m in metrics" :key="m.k" class="sr-row">
          <span class="sr-k">{{ m.k }}</span>
          <span class="sr-v" :class="m.tone">{{ m.v }}</span>
          <span class="sr-bar"><i :style="{width: m.pct + '%', background: m.bar}"></i></span>
        </div>
      </aside>

      <!-- 底部坐标条 -->
      <div class="coord-strip">
        <span>LAT&nbsp;31°14'18.7"N</span>
        <span class="cs-sep">│</span>
        <span>LNG&nbsp;121°28'41.2"E</span>
        <span class="cs-sep">│</span>
        <span>ZONE&nbsp;SH-01</span>
        <span class="cs-sep">│</span>
        <span class="cs-pulse">RX&nbsp;{{ rxRate }}Mb/s</span>
      </div>

      <!-- 中央全息数据终端 -->
      <div class="data-terminal">
        <!-- 全息投影核心 -->
        <div class="holo-core">
          <div class="holo-radar">
            <svg viewBox="0 0 200 200" class="radar-svg">
              <!-- 外圈扫描 -->
              <circle cx="100" cy="100" r="90" fill="none" stroke="#14b8a6" stroke-width="0.5" opacity="0.3"/>
              <circle cx="100" cy="100" r="70" fill="none" stroke="#14b8a6" stroke-width="0.5" opacity="0.4"/>
              <circle cx="100" cy="100" r="50" fill="none" stroke="#14b8a6" stroke-width="0.5" opacity="0.5"/>
              <circle cx="100" cy="100" r="30" fill="none" stroke="#14b8a6" stroke-width="0.8" opacity="0.6"/>
              <!-- 扫描线 -->
              <line x1="100" y1="100" x2="100" y2="10" stroke="#14b8a6" stroke-width="1" opacity="0.8" class="scan-line"/>
              <!-- 数据点 -->
              <circle cx="130" cy="40" r="4" fill="#14b8a6" class="data-point" opacity="0.9"/>
              <circle cx="60" cy="70" r="3" fill="#5eead4" class="data-point" opacity="0.8"/>
              <circle cx="150" cy="100" r="5" fill="#f59e0b" class="data-point" opacity="0.9"/>
              <circle cx="40" cy="130" r="4" fill="#fbbf24" class="data-point" opacity="0.7"/>
              <circle cx="120" cy="150" r="3" fill="#10b981" class="data-point" opacity="0.8"/>
              <!-- 中心核心 -->
              <circle cx="100" cy="100" r="12" fill="#14b8a6" opacity="0.3"/>
              <circle cx="100" cy="100" r="8" fill="#14b8a6" opacity="0.5"/>
              <circle cx="100" cy="100" r="4" fill="#14b8a6"/>
            </svg>
          </div>
          <!-- 数据波形环绕 -->
          <div class="data-orbit orbit-1"></div>
          <div class="data-orbit orbit-2"></div>
          <div class="data-orbit orbit-3"></div>
        </div>

        <!-- 全息数据流 -->
        <div class="holo-streams">
          <div class="stream stream-l"></div>
          <div class="stream stream-r"></div>
          <div class="stream stream-t"></div>
          <div class="stream stream-b"></div>
        </div>

        <!-- 终端日志 -->
        <div class="terminal-log">
          <div class="log-line"><span class="log-time">14:32:05</span><span class="log-pulse"></span><span class="log-status ok">●</span> NODE_01 :: HDFS healthy</div>
          <div class="log-line"><span class="log-time">14:32:06</span><span class="log-pulse"></span><span class="log-status ok">●</span> NODE_02 :: YARN active</div>
          <div class="log-line"><span class="log-time">14:32:07</span><span class="log-pulse"></span><span class="log-status warn">●</span> NODE_03 :: Spark pending</div>
          <div class="log-line"><span class="log-time">14:32:08</span><span class="log-pulse"></span><span class="log-status ok">●</span> NODE_04 :: Kafka 98.2%</div>
          <div class="log-line"><span class="log-time">14:32:09</span><span class="log-pulse"></span><span class="log-status ok">●</span> CLUSTER :: All nodes UP</div>
        </div>

        <!-- 悬浮数据卡片 -->
        <div class="data-cards">
          <div class="data-card card-1">
            <div class="card-value">98.7%</div>
            <div class="card-label">CLUSTER HEALTH</div>
          </div>
          <div class="data-card card-2">
            <div class="card-value">1.2TB</div>
            <div class="card-label">DATA THROUGHPUT</div>
          </div>
        </div>
      </div>

      <!-- 文案 -->
      <div class="brand-copy">
        <div class="bc-meta">
          <span class="bc-chip">MISSION_ID / SRE-7741</span>
          <span class="bc-chip bc-chip-alt">MODE / OBSERVATION</span>
        </div>
        <h2 class="brand-title"><span class="bt-slash">//</span> 让运维 <span class="bt-accent">更聪明</span> 一点</h2>
        <p class="brand-sub">Big Data SRE · 实时洞察 · 智能告警 · 自动化处置</p>
      </div>
    </div>

    <!-- ╭───────────────── 右侧表单 ─────────────────╮ -->
    <div class="form-panel">
      <div class="fp-label">
        <span class="fp-dot"></span>
        <span>// AUTH_CONSOLE</span>
        <span class="fp-spacer"></span>
        <span class="fp-id">CH-{{ sessionId }}</span>
      </div>
      <div class="login-card">
        <span class="card-bracket cb-card-tl"></span>
        <span class="card-bracket cb-card-tr"></span>
        <span class="card-bracket cb-card-bl"></span>
        <span class="card-bracket cb-card-br"></span>
        <!-- Logo -->
        <div class="logo-section">
          <div class="logo-icon">
            <svg width="56" height="56" viewBox="0 0 56 56">
              <defs>
                <linearGradient id="logoG" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="#0f766e"/>
                  <stop offset="100%" stop-color="#14b8a6"/>
                </linearGradient>
              </defs>
              <!-- 六边形外壳 -->
              <polygon points="28,4 48,16 48,40 28,52 8,40 8,16" fill="none" stroke="url(#logoG)" stroke-width="2.5"/>
              <!-- 内部数据波形 -->
              <path d="M16 28 Q20 20, 24 28 T32 28 T40 28" stroke="#14b8a6" stroke-width="2" fill="none"/>
              <!-- 中心点 -->
              <circle cx="28" cy="28" r="4" fill="#14b8a6"/>
              <!-- 连接节点 -->
              <circle cx="28" cy="4" r="2" fill="#5eead4"/>
              <circle cx="48" cy="16" r="2" fill="#fbbf24"/>
              <circle cx="8" cy="40" r="2" fill="#5eead4"/>
            </svg>
          </div>
          <h1 class="logo-title" aria-label="大数据运维平台">
            <span
              v-for="(ch, i) in titleChars"
              :key="i"
              class="title-ch"
              :style="{ '--i': i }"
            >{{ ch }}</span>
          </h1>
          <p class="logo-sub">BIG · DATA · SRE</p>
        </div>

        <!-- Tab 切换 -->
        <div class="tab-switcher">
          <button :class="['tab-btn', { active: tab === 'login' }]" @click="tab = 'login'">登录</button>
          <button :class="['tab-btn', { active: tab === 'register' }]" @click="tab = 'register'">注册</button>
          <div class="tab-indicator" :style="{ left: tab === 'login' ? '4px' : 'calc(50% - 2px)' }"></div>
        </div>

        <!-- 登录 -->
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
              <img v-else-if="captchaSrc" :src="captchaSrc" alt="验证码" style="display:block;width:120px;height:40px;" />
              <span v-else class="captcha-placeholder">点击获取</span>
            </button>
          </div>

          <button type="submit" class="submit-btn" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            <span v-else>登 录 系 统</span>
          </button>

          <div class="foot-links">
            <a href="#" @click.prevent>忘记密码?</a>
            <a href="#" @click.prevent="tab = 'register'">注册账号</a>
          </div>
        </form>

        <!-- 注册 -->
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
              <img v-else-if="captchaSrc" :src="captchaSrc" alt="验证码" style="display:block;width:120px;height:40px;" />
              <span v-else class="captcha-placeholder">点击获取</span>
            </button>
          </div>

          <button type="submit" class="submit-btn" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            <span v-else>立 即 注 册</span>
          </button>

          <div class="foot-links">
            <a href="#" @click.prevent="tab = 'login'">已有账号？登录</a>
          </div>
        </form>
      </div>
    </div>

    <!-- Toast -->
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
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import axios from 'axios'
import { STORAGE_KEYS } from '../utils/constants'

const emit = defineEmits(['login-success'])

// ── UI state ──────────────────────────────────────────────
const tab = ref('login')
const titleChars = ['大', '数', '据', '运', '维', '平', '台']
const loading = ref(false)
const showPwd = ref(false)

// ── HUD realtime readouts ────────────────────────────────
const clockNow = ref('')
const rxRate = ref('148.2')
const sessionId = ref(Math.random().toString(36).slice(2, 8).toUpperCase())
const metrics = ref([
  { k: 'CPU', v: '42%', pct: 42, tone: 'ok',   bar: 'linear-gradient(90deg,#0f766e,#14b8a6)' },
  { k: 'MEM', v: '67%', pct: 67, tone: 'ok',   bar: 'linear-gradient(90deg,#0f766e,#5eead4)' },
  { k: 'NET', v: '1.2G',pct: 83, tone: 'warn', bar: 'linear-gradient(90deg,#d97706,#fbbf24)' },
  { k: 'DSK', v: '58%', pct: 58, tone: 'ok',   bar: 'linear-gradient(90deg,#0f766e,#14b8a6)' },
  { k: 'JOB', v: '214', pct: 74, tone: 'ok',   bar: 'linear-gradient(90deg,#0f766e,#14b8a6)' }
])

let hudTimer = null
function tickHud() {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  clockNow.value = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  rxRate.value = (140 + Math.random() * 30).toFixed(1)
  metrics.value = metrics.value.map(m => {
    const delta = (Math.random() - 0.5) * 4
    const pct = Math.min(95, Math.max(8, m.pct + delta))
    let v
    if (m.k === 'NET') v = (0.8 + pct / 80).toFixed(1) + 'G'
    else if (m.k === 'JOB') v = String(Math.max(1, Math.round(pct * 2.8)))
    else v = Math.round(pct) + '%'
    return { ...m, pct, v }
  })
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
    showToast('登录成功，正在跳转...', 'success')
    setTimeout(() => emit('login-success', data.user), 500)
  } catch (err) {
    const errData = err.response?.data
    showToast(errData?.error || '登录失败，请稍后重试', 'error')
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
    await loadCaptcha()
    registerForm.value.captchaCode = ''
  } finally {
    loading.value = false
  }
}

// ── Stars (procedural) ────────────────────────────────────
const STAR_SEEDS = [
  [8, 12], [15, 6], [28, 18], [45, 8], [62, 15], [78, 22],
  [88, 35], [12, 45], [35, 52], [55, 48], [72, 55], [85, 42],
  [18, 68], [42, 75], [65, 72], [80, 65], [92, 58], [25, 82]
]
function starStyle(n) {
  const [x, y] = STAR_SEEDS[(n - 1) % STAR_SEEDS.length]
  return {
    left: x + '%',
    top: y + '%',
    animationDuration: (1.8 + (n % 5) * 0.4) + 's',
    animationDelay: ((n % 7) * 0.25) + 's'
  }
}

// ── Lifecycle ─────────────────────────────────────────────
onMounted(() => {
  tickHud()
  hudTimer = setInterval(tickHud, 1000)
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
  const savedUser = localStorage.getItem(STORAGE_KEYS.USER)
  if (token && savedUser) {
    try {
      emit('login-success', JSON.parse(savedUser))
    } catch {
      localStorage.removeItem(STORAGE_KEYS.TOKEN)
      localStorage.removeItem(STORAGE_KEYS.USER)
    }
    return
  }
  loadCaptcha()
})

onBeforeUnmount(() => {
  clearTimeout(toastTimer)
  clearInterval(hudTimer)
})
</script>

<style scoped>
/* ── Layout ─────────────────────────────────────────────── */
.login-page {
  display: flex;
  min-height: 100vh;
  font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Segoe UI', sans-serif;
  background: #0a0e14;
  position: relative;
  padding-top: 32px;
}

/* ── Mission Control Top Bar ─────────────────────────────── */
.mission-bar {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: linear-gradient(180deg, #0b1016 0%, #0a0e14 100%);
  border-bottom: 1px solid rgba(20,184,166,0.18);
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  font-size: 10.5px;
  letter-spacing: 0.08em;
  color: #7d8590;
  z-index: 100;
  user-select: none;
  animation: boot-fade 0.6s ease-out 0.1s backwards;
}
.mission-bar::before {
  content: '';
  position: absolute;
  bottom: -1px; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(20,184,166,0.5), rgba(251,191,36,0.35), rgba(20,184,166,0.5), transparent);
}
.mb-left, .mb-center, .mb-right {
  display: flex; align-items: center; gap: 8px;
}
.mb-dot {
  width: 7px; height: 7px;
  background: #14b8a6;
  box-shadow: 0 0 8px #14b8a6, 0 0 14px rgba(20,184,166,0.6);
  animation: pulse-dot 1.2s infinite;
}
.mb-tag { color: #5eead4; font-weight: 700; letter-spacing: 0.14em; }
.mb-tag-dim { color: #6b7280; letter-spacing: 0.12em; }
.mb-sep { color: #374151; }
.mb-label { color: #4b5563; text-transform: uppercase; }
.mb-value { color: #9ca3af; }
.mb-clock { color: #fbbf24; font-weight: 700; letter-spacing: 0.14em; text-shadow: 0 0 8px rgba(251,191,36,0.3); }
.mb-pill {
  padding: 2px 10px;
  border: 1px solid rgba(16,185,129,0.4);
  background: rgba(16,185,129,0.08);
  border-radius: 2px;
  color: #10b981;
  font-weight: 700;
  letter-spacing: 0.14em;
}

/* ── Viewport corner brackets ────────────────────────────── */
.corner-bracket {
  position: fixed;
  width: 24px; height: 24px;
  border-color: rgba(20,184,166,0.55);
  pointer-events: none;
  z-index: 90;
  animation: boot-fade 0.6s ease-out 0.4s backwards;
}
.cb-tl { top: 38px; left: 14px; border-top: 2px solid; border-left: 2px solid; }
.cb-tr { top: 38px; right: 14px; border-top: 2px solid; border-right: 2px solid; }
.cb-bl { bottom: 14px; left: 14px; border-bottom: 2px solid; border-left: 2px solid; }
.cb-br { bottom: 14px; right: 14px; border-bottom: 2px solid; border-right: 2px solid; }

@keyframes boot-fade {
  0%   { opacity: 0; filter: blur(2px); }
  100% { opacity: 1; filter: blur(0); }
}

/* ── CRT grain + horizontal scan ─────────────────────────── */
.grain-overlay {
  position: absolute; inset: 0;
  pointer-events: none;
  opacity: 0.35;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.08 0 0 0 0 0.72 0 0 0 0 0.65 0 0 0 0.9 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
  z-index: 3;
}
.crt-scan {
  position: absolute; left: 0; right: 0;
  top: 0; height: 3px;
  background: linear-gradient(90deg, transparent, rgba(20,184,166,0.7), transparent);
  box-shadow: 0 0 14px rgba(20,184,166,0.6);
  z-index: 4;
  animation: crt-sweep 6s linear infinite;
  pointer-events: none;
}
@keyframes crt-sweep {
  0%   { top: -3px; opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 1; }
  100% { top: 100%; opacity: 0; }
}

/* ── Side readout (left panel vertical metrics) ──────────── */
.side-readout {
  position: absolute;
  top: 56px;
  width: 172px;
  background: rgba(10,14,20,0.78);
  border: 1px solid rgba(20,184,166,0.25);
  border-left: 2px solid #14b8a6;
  padding: 10px 12px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: #8b949e;
  z-index: 5;
  backdrop-filter: blur(2px);
  animation: boot-slide-l 0.7s cubic-bezier(.2,.8,.2,1) 0.5s backwards;
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%);
}
.side-readout-l { left: 20px; }

.sr-head {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 9.5px; letter-spacing: 0.14em;
  color: #5eead4;
  padding-bottom: 6px; margin-bottom: 8px;
  border-bottom: 1px dashed rgba(20,184,166,0.2);
}
.sr-live { color: #fbbf24; animation: pulse-dot 1.4s infinite; }
.sr-row {
  display: grid;
  grid-template-columns: 28px 44px 1fr;
  gap: 6px;
  align-items: center;
  margin-bottom: 5px;
  font-size: 10px;
}
.sr-k { color: #4b5563; letter-spacing: 0.12em; }
.sr-v { color: #e6edf3; font-weight: 700; }
.sr-v.warn { color: #fbbf24; }
.sr-v.err  { color: #ef4444; }
.sr-bar {
  height: 3px;
  background: rgba(20,184,166,0.1);
  border-radius: 1px;
  overflow: hidden;
}
.sr-bar i {
  display: block; height: 100%;
  transition: width 0.8s ease-out;
  box-shadow: 0 0 6px rgba(20,184,166,0.6);
}

@keyframes boot-slide-l {
  0%   { opacity: 0; transform: translateX(-20px); }
  100% { opacity: 1; transform: translateX(0); }
}

/* ── Coordinate strip ────────────────────────────────────── */
.coord-strip {
  position: absolute;
  left: 20px; right: 20px;
  bottom: 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 12px;
  height: 24px;
  background: rgba(10,14,20,0.6);
  border: 1px solid rgba(20,184,166,0.18);
  border-radius: 2px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  letter-spacing: 0.14em;
  color: #6b7280;
  z-index: 5;
  animation: boot-fade 0.6s ease-out 0.7s backwards;
}
.cs-sep { color: #262e3a; }
.cs-pulse { color: #5eead4; margin-left: auto; }
.cs-pulse::before {
  content: '▶ '; color: #14b8a6;
  animation: pulse-dot 1s infinite;
}

/* ── Brand copy meta chips ───────────────────────────────── */
.bc-meta {
  display: flex; gap: 8px;
  justify-content: center;
  margin-bottom: 12px;
}
.bc-chip {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  letter-spacing: 0.14em;
  color: #5eead4;
  padding: 3px 10px;
  border: 1px solid rgba(20,184,166,0.3);
  background: rgba(20,184,166,0.06);
  border-radius: 2px;
}
.bc-chip-alt {
  color: #fbbf24;
  border-color: rgba(251,191,36,0.3);
  background: rgba(251,191,36,0.06);
}
.bt-slash {
  font-family: 'JetBrains Mono', monospace;
  color: #14b8a6;
  font-weight: 400;
  margin-right: 6px;
  opacity: 0.7;
}
.bt-accent {
  background: linear-gradient(90deg, #fbbf24, #f59e0b, #5eead4);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* ── Form panel label ────────────────────────────────────── */
.fp-label {
  position: absolute;
  top: 44px; left: 24px; right: 24px;
  display: flex; align-items: center; gap: 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.18em;
  color: #5eead4;
  z-index: 3;
  animation: boot-fade 0.6s ease-out 0.6s backwards;
}
.fp-dot {
  width: 6px; height: 6px;
  background: #fbbf24;
  box-shadow: 0 0 6px #fbbf24;
  animation: pulse-dot 1s infinite;
}
.fp-spacer { flex: 1; height: 1px; background: linear-gradient(90deg, rgba(20,184,166,0.3), transparent); }
.fp-id { color: #6b7280; font-size: 9px; letter-spacing: 0.14em; }

/* ── Login card L-brackets ───────────────────────────────── */
.card-bracket {
  position: absolute;
  width: 14px; height: 14px;
  border-color: #14b8a6;
  pointer-events: none;
  opacity: 0.85;
}
.cb-card-tl { top: -1px;    left: -1px;    border-top: 2px solid; border-left: 2px solid; }
.cb-card-tr { top: -1px;    right: -1px;   border-top: 2px solid; border-right: 2px solid; }
.cb-card-bl { bottom: -1px; left: -1px;    border-bottom: 2px solid; border-left: 2px solid; }
.cb-card-br { bottom: -1px; right: -1px;   border-bottom: 2px solid; border-right: 2px solid; }

/* ── Left brand panel ───────────────────────────────────── */
.brand-panel {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: radial-gradient(ellipse at 50% 30%, rgba(20,184,166,0.15) 0%, transparent 50%),
              linear-gradient(180deg, #0a0e14 0%, #0d1117 50%, #0f1419 100%);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 80px;
}
.brand-panel::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse 120% 80% at 50% 100%, transparent 40%, rgba(0,0,0,0.6) 100%),
    radial-gradient(ellipse 120% 80% at 50% 0%, transparent 50%, rgba(0,0,0,0.4) 100%);
  z-index: 2;
}

/* 六边形网格背景 */
.hex-grid {
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='52' viewBox='0 0 60 52' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0 L60 15 L60 37 L30 52 L0 37 L0 15 Z' fill='none' stroke='%2314b8a6' stroke-width='0.3' opacity='0.15'/%3E%3C/svg%3E");
  background-size: 60px 52px;
  opacity: 0.6;
  mask-image: radial-gradient(ellipse at 50% 50%, #000 30%, transparent 70%);
}

/* 脉冲光环 */
.pulse-ring {
  position: absolute;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  border: 1px solid #14b8a6;
  opacity: 0;
  animation: pulse-expand 4s ease-out infinite;
}
.ring-1 { top: 50%; left: 50%; transform: translate(-50%, -50%); animation-delay: 0s; }
.ring-2 { top: 50%; left: 50%; transform: translate(-50%, -50%); animation-delay: 1.3s; }
.ring-3 { top: 50%; left: 50%; transform: translate(-50%, -50%); animation-delay: 2.6s; border-color: #5eead4; }

@keyframes pulse-expand {
  0% { width: 100px; height: 100px; opacity: 0.6; border-width: 2px; }
  100% { width: 500px; height: 500px; opacity: 0; border-width: 0.5px; }
}

/* 星点 */
.star {
  position: absolute;
  width: 2px; height: 2px;
  background: #14b8a6;
  border-radius: 50%;
  box-shadow: 0 0 8px 3px rgba(20,184,166,0.8);
  animation: star-pulse 3s infinite;
  pointer-events: none;
}
.star:nth-child(odd) { background: #5eead4; box-shadow: 0 0 8px 3px rgba(94,234,212,0.8); }

@keyframes star-pulse {
  0%, 100% { opacity: 0.3; transform: scale(0.5); }
  50% { opacity: 1; transform: scale(1.2); }
}

/* 品牌文案 */
.brand-copy {
  position: absolute;
  top: 7%;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  color: #fff;
  z-index: 6;
  white-space: nowrap;
  animation: boot-fade 0.8s ease-out 0.9s backwards;
}
.brand-title {
  font-family: 'JetBrains Mono', 'DM Sans', sans-serif;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 0.06em;
  margin: 0 0 10px;
  text-shadow: 0 0 20px rgba(20,184,166,0.5);
}
.brand-sub {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.28em;
  color: rgba(94,234,212,0.7);
  margin: 0;
  text-transform: uppercase;
}

/* ── Data Terminal Visualization ─────────────────────────── */
.data-terminal {
  position: relative;
  width: min(560px, 88%);
  height: 360px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
  margin-bottom: 18px;
}

/* Holographic core */
.holo-core {
  position: relative;
  width: 260px;
  height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.holo-radar {
  width: 200px;
  height: 200px;
  animation: radar-spin 8s linear infinite;
}

.radar-svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 0 20px rgba(20,184,166,0.4));
}

@keyframes radar-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.scan-line {
  animation: scan-pulse 2s ease-in-out infinite;
  transform-origin: center;
}

@keyframes scan-pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; stroke-width: 2; }
}

.data-point {
  animation: point-blink 1.5s ease-in-out infinite;
}

@keyframes point-blink {
  0%, 100% { opacity: 0.4; r: 3; }
  50% { opacity: 1; r: 5; }
}

/* Data orbit rings */
.data-orbit {
  position: absolute;
  border-radius: 50%;
  border: 1px solid;
  animation: orbit-rotate 6s linear infinite;
}

.orbit-1 {
  width: 280px;
  height: 280px;
  border-color: rgba(20,184,166,0.3);
  animation-duration: 12s;
}

.orbit-2 {
  width: 320px;
  height: 320px;
  border-color: rgba(94,234,212,0.2);
  animation-duration: 15s;
  animation-direction: reverse;
}

.orbit-3 {
  width: 360px;
  height: 360px;
  border-color: rgba(251,191,36,0.15);
  animation-duration: 18s;
}

.orbit-1::before, .orbit-2::before, .orbit-3::before {
  content: '';
  position: absolute;
  width: 8px;
  height: 8px;
  background: #14b8a6;
  border-radius: 50%;
  top: -4px;
  left: 50%;
  transform: translateX(-50%);
  box-shadow: 0 0 12px 4px rgba(20,184,166,0.8);
}

.orbit-2::before { background: #5eead4; box-shadow: 0 0 12px 4px rgba(94,234,212,0.8); }
.orbit-3::before { background: #fbbf24; box-shadow: 0 0 12px 4px rgba(251,191,36,0.8); }

@keyframes orbit-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Holo streams */
.holo-streams {
  position: absolute;
  width: 100%;
  height: 100%;
}

.stream {
  position: absolute;
  width: 120px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #14b8a6, transparent);
  opacity: 0.6;
  animation: stream-flow 3s ease-in-out infinite;
}

.stream-l { left: -60px; top: 50%; transform: translateY(-50%) rotate(180deg); }
.stream-r { right: -60px; top: 50%; transform: translateY(-50%); animation-delay: -0.5s; }
.stream-t { top: -40px; left: 50%; transform: translateX(-50%) rotate(90deg); animation-delay: -1s; width: 80px; }
.stream-b { bottom: -40px; left: 50%; transform: translateX(-50%) rotate(-90deg); animation-delay: -1.5s; width: 80px; }

@keyframes stream-flow {
  0% { opacity: 0.2; width: 80px; }
  50% { opacity: 0.8; width: 140px; }
  100% { opacity: 0.2; width: 80px; }
}

/* Terminal log */
.terminal-log {
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: min(420px, 85%);
  background: rgba(10,14,20,0.85);
  border: 1px solid rgba(20,184,166,0.35);
  border-radius: 8px;
  padding: 12px 16px;
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  font-size: 11px;
  color: #7d8590;
}

.log-line {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 5px;
  animation: log-appear 0.4s ease-out backwards;
}

.log-line:nth-child(1) { animation-delay: 0.1s; }
.log-line:nth-child(2) { animation-delay: 0.2s; }
.log-line:nth-child(3) { animation-delay: 0.3s; }
.log-line:nth-child(4) { animation-delay: 0.4s; }
.log-line:nth-child(5) { animation-delay: 0.5s; }

.log-time { color: #4a5568; font-size: 10px; }
.log-pulse { width: 4px; height: 4px; background: #14b8a6; border-radius: 50%; animation: pulse-dot 1s infinite; }
.log-status.ok { color: #10b981; }
.log-status.warn { color: #f59e0b; }

@keyframes pulse-dot {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

@keyframes log-appear {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Data cards */
.data-cards {
  position: absolute;
  width: 100%;
  height: 100%;
}

.data-card {
  position: absolute;
  background: rgba(10,14,20,0.7);
  border: 1px solid rgba(20,184,166,0.4);
  border-radius: 6px;
  padding: 10px 14px;
  font-family: 'JetBrains Mono', monospace;
  animation: card-float 4s ease-in-out infinite;
}

.card-1 { top: 20px; left: 20px; animation-delay: 0s; }
.card-2 { top: 20px; right: 20px; animation-delay: -2s; }

.card-value {
  font-size: 18px;
  font-weight: 700;
  color: #14b8a6;
  text-shadow: 0 0 8px rgba(20,184,166,0.5);
}

.card-label {
  font-size: 9px;
  color: #5eead4;
  letter-spacing: 1px;
  margin-top: 4px;
}

@keyframes card-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
.log-line:nth-child(3) { animation-delay: 0.3s; }
.log-line:nth-child(4) { animation-delay: 0.4s; }
.log-line:nth-child(5) { animation-delay: 0.5s; }

.log-time {
  color: #6e7681;
}

.log-status {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
}

.log-status.ok {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.log-status.warn {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

@keyframes log-appear {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ── Right form panel ───────────────────────────────────── */
.form-panel {
  width: 440px;
  min-height: calc(100vh - 32px);
  background:
    linear-gradient(180deg, #0f1419 0%, #0a0e14 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 28px 32px;
  position: relative;
  border-left: 1px solid rgba(20,184,166,0.15);
}
.form-panel::after {
  content: '';
  position: absolute;
  top: 0; bottom: 0; left: -1px;
  width: 1px;
  background: linear-gradient(180deg,
    transparent 0%,
    rgba(20,184,166,0.4) 20%,
    rgba(251,191,36,0.3) 50%,
    rgba(20,184,166,0.4) 80%,
    transparent 100%);
  pointer-events: none;
}

/* 右侧扫描线效果 */
.form-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent 0px,
    transparent 2px,
    rgba(20,184,166,0.03) 2px,
    rgba(20,184,166,0.03) 4px
  );
  pointer-events: none;
}

.login-card {
  width: 100%;
  max-width: 360px;
  position: relative;
  background:
    linear-gradient(180deg, rgba(15,20,28,0.92) 0%, rgba(10,14,20,0.95) 100%);
  border-radius: 4px;
  padding: 40px 32px 32px;
  border: 1px solid rgba(20,184,166,0.35);
  box-shadow:
    0 0 40px rgba(20,184,166,0.08),
    0 0 0 1px rgba(0,0,0,0.4),
    inset 0 0 20px rgba(20,184,166,0.04);
  animation: boot-fade 0.7s ease-out 0.6s backwards;
}
.login-card::before {
  content: '';
  position: absolute;
  top: 0; left: 12px; right: 12px;
  height: 1px;
  background: linear-gradient(90deg, transparent, #14b8a6, transparent);
}
.login-card::after {
  content: '';
  position: absolute;
  bottom: 0; left: 12px; right: 12px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(251,191,36,0.4), transparent);
}

/* Logo */
.logo-section { text-align: center; margin-bottom: 24px; }
.logo-icon {
  width: 52px; height: 52px; margin: 0 auto 12px;
  filter: drop-shadow(0 0 15px rgba(20,184,166,0.5));
}
.logo-icon svg { width: 52px; height: 52px; }
.logo-title {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.1em;
  margin: 0 0 8px;
  display: inline-flex;
  justify-content: center;
  width: 100%;
}
.title-ch {
  display: inline-block;
  background: linear-gradient(120deg,
    #14b8a6 0%,
    #5eead4 35%,
    #fbbf24 55%,
    #5eead4 75%,
    #14b8a6 100%);
  background-size: 280% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation:
    title-in .6s cubic-bezier(.34, 1.56, .64, 1) backwards,
    title-shine 4s linear infinite;
  animation-delay:
    calc(var(--i, 0) * 0.06s),
    calc(var(--i, 0) * 0.1s);
}
.title-ch:hover {
  animation-play-state: paused;
  transform: scale(1.1);
  transition: transform .2s;
}

@keyframes title-in {
  0%   { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes title-shine {
  0%   { background-position: 280% 50%; }
  100% { background-position: -180% 50%; }
}
.logo-sub {
  font-size: 10px;
  color: #5eead4;
  letter-spacing: 3px;
  margin: 0;
  opacity: 0.7;
}

/* Tab */
.tab-switcher {
  display: flex;
  position: relative;
  background: rgba(20,184,166,0.1);
  border: 1px solid rgba(20,184,166,0.2);
  border-radius: 10px;
  padding: 4px;
  margin-bottom: 20px;
}
.tab-btn {
  flex: 1; padding: 10px;
  background: transparent; border: none;
  font-size: 13px; font-weight: 600; color: #5eead4;
  cursor: pointer; position: relative; z-index: 1;
  transition: color .25s; border-radius: 8px;
  opacity: 0.6;
}
.tab-btn.active { color: #fff; opacity: 1; }
.tab-indicator {
  position: absolute; top: 4px; bottom: 4px;
  width: calc(50% - 4px);
  background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%);
  border-radius: 8px;
  transition: left .35s cubic-bezier(.4,0,.2,1);
  box-shadow: 0 0 15px rgba(20,184,166,0.4);
}

/* Form */
.auth-form { display: flex; flex-direction: column; gap: 12px; }
.field-group {
  position: relative; display: flex; align-items: center;
  background: rgba(10,14,20,0.6);
  border: 1px solid rgba(20,184,166,0.25);
  border-radius: 10px;
  transition: border-color .2s, box-shadow .2s, background .2s;
}
.field-group:focus-within {
  border-color: #14b8a6;
  box-shadow: 0 0 0 3px rgba(20,184,166,.15), 0 0 15px rgba(20,184,166,0.2);
  background: rgba(13,17,23,0.8);
}
.field-icon {
  width: 40px;
  display: flex; align-items: center; justify-content: center;
  color: #5eead4;
  flex-shrink: 0;
  opacity: 0.5;
  transition: opacity .2s;
}
.field-group:focus-within .field-icon { opacity: 1; }
.field-icon svg { width: 16px; height: 16px; }

.field-group input {
  flex: 1; height: 44px; border: none; background: transparent;
  font-size: 14px; color: #e6edf3;
  padding: 0 12px 0 0; outline: none;
}
.field-group input::placeholder { color: #7d8590; }

.pwd-toggle {
  width: 40px; height: 44px;
  border: none; background: transparent;
  color: #5eead4; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: opacity .15s;
  opacity: 0.5;
}
.pwd-toggle:hover { opacity: 1; }
.pwd-toggle svg { width: 16px; height: 16px; }

/* Captcha */
.captcha-group { gap: 0; }
.captcha-input { width: 0; flex: 1; }
.captcha-img-btn {
  height: 44px; min-width: 100px;
  border: none; border-left: 1px solid rgba(20,184,166,0.25);
  background: rgba(10,14,20,0.4);
  border-radius: 0 8px 8px 0;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden; padding: 0 8px;
  transition: background .15s; flex-shrink: 0;
}
.captcha-img-btn:hover { background: rgba(20,184,166,0.1); }
.captcha-loading, .captcha-placeholder {
  font-size: 11px; color: #5eead4; white-space: nowrap; opacity: 0.7;
}

/* Submit */
.submit-btn {
  height: 44px;
  background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%);
  border: none; border-radius: 10px;
  color: white; font-size: 14px; font-weight: 600;
  cursor: pointer; letter-spacing: 0.15em;
  transition: all .2s;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  margin-top: 8px;
  box-shadow: 0 0 20px rgba(20,184,166,0.3);
  position: relative; overflow: hidden;
}
.submit-btn::before {
  content: ''; position: absolute; top: 0; left: -100%;
  width: 100%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.2), transparent);
  animation: btn-sweep 2s linear infinite;
}
.submit-btn:hover:not(:disabled) {
  box-shadow: 0 0 30px rgba(20,184,166,0.5), 0 0 50px rgba(20,184,166,0.2);
  transform: scale(1.02);
}
.submit-btn:active:not(:disabled) { transform: scale(0.98); }
.submit-btn:disabled { opacity: .5; cursor: not-allowed; }

@keyframes btn-sweep {
  to { left: 100%; }
}

.spinner {
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,.3);
  border-top-color: white; border-radius: 50%;
  animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Foot links */
.foot-links { display: flex; justify-content: space-between; margin-top: 6px; }
.foot-links a {
  font-size: 12px; color: #5eead4;
  text-decoration: none; transition: opacity .15s;
  font-weight: 500;
  opacity: 0.6;
}
.foot-links a:hover { opacity: 1; text-decoration: none; }

/* Toast */
.toast {
  position: fixed; top: 24px; left: 50%;
  transform: translateX(-50%);
  display: flex; align-items: center; gap: 8px;
  padding: 12px 22px; border-radius: 12px;
  font-size: 14px; font-weight: 500;
  z-index: 9999; max-width: 420px;
  box-shadow: 0 10px 30px rgba(0,0,0,.18);
}
.toast svg { width: 18px; height: 18px; flex-shrink: 0; }
.toast.error { background: linear-gradient(135deg,#ef4444,#dc2626); color: #fff; }
.toast.success { background: linear-gradient(135deg,#10b981,#059669); color: #fff; }

.toast-fade-enter-active, .toast-fade-leave-active { transition: all .3s ease; }
.toast-fade-enter-from, .toast-fade-leave-to {
  opacity: 0; transform: translateX(-50%) translateY(-12px);
}

/* Responsive */
@media (max-width: 1180px) {
  .mb-center { display: none; }
  .side-readout { display: none; }
}
@media (max-width: 960px) {
  .login-page { flex-direction: column; }
  .mission-bar { padding: 0 12px; font-size: 9.5px; }
  .corner-bracket { width: 16px; height: 16px; }
  .brand-panel { min-height: 380px; flex: none; padding-bottom: 60px; align-items: center; }
  .brand-copy { top: 18px; }
  .coord-strip { font-size: 8.5px; gap: 8px; }
  .fp-label { top: 48px; }
  .data-terminal { width: 100%; height: 240px; }
  .holo-core { width: 180px; height: 180px; }
  .holo-radar { width: 140px; height: 140px; }
  .orbit-1 { width: 200px; height: 200px; }
  .orbit-2 { width: 230px; height: 230px; }
  .orbit-3 { width: 260px; height: 260px; }
  .terminal-log { width: 85%; font-size: 10px; padding: 10px 12px; }
  .data-card { padding: 8px 10px; }
  .card-value { font-size: 14px; }
  .form-panel { width: 100%; min-height: auto; padding: 24px 16px 40px; }
}
@media (max-width: 480px) {
  .login-card { padding: 28px 20px; border-radius: 16px; }
  .brand-panel { min-height: 280px; }
  .data-terminal { height: 180px; }
  .holo-core { width: 140px; height: 140px; }
  .holo-radar { width: 100px; height: 100px; }
  .orbit-1, .orbit-2, .orbit-3 { display: none; }
  .data-card { display: none; }
  .terminal-log { padding: 8px 10px; font-size: 9px; width: 90%; }
  .brand-title { font-size: 20px; }
  .brand-sub { font-size: 10px; letter-spacing: .08em; }
}
</style>
