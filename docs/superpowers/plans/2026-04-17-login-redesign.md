# 登录页改版 + 图形验证码 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将登录页改版为左侧 Lottie 卡通动画 + 右侧白色登录卡片风格，后端添加 svg-captcha 图形验证码，登录/注册接口校验验证码。

**Architecture:** 后端新增独立的 captchaStore 模块（内存 Map + TTL），在 auth.js 中新增 captcha 路由并修改 login/register 接口。前端安装 lottie-web，public 目录存放 3 个角色 Lottie JSON，LoginPage.vue 完全重写：左侧监听 mousemove 实现 CSS 跟随效果，右侧新增验证码输入行。

**Tech Stack:** Vue 3, lottie-web, svg-captcha, Node.js/Express, Element Plus (仅弹窗)

---

## 文件结构

**新建：**
- `backend/src/captchaStore.js` — 验证码内存存储模块（set / verify）
- `frontend/public/lottie/char1.json` — 橙色卡通角色动画
- `frontend/public/lottie/char2.json` — 紫色卡通角色动画
- `frontend/public/lottie/char3.json` — 黄色卡通角色动画

**修改：**
- `backend/src/routes/auth.js` — 新增 GET /api/auth/captcha；login/register 加验证码校验
- `backend/package.json` — 新增 `svg-captcha`
- `frontend/src/components/LoginPage.vue` — 完整重写
- `frontend/package.json` — 新增 `lottie-web`

---

### Task 1: 后端 — 创建验证码存储模块并安装依赖

**Files:**
- Create: `backend/src/captchaStore.js`
- Modify: `backend/package.json`

- [ ] **Step 1: 安装 svg-captcha**

```bash
cd /opt/bigdata-sre-platform/backend && npm install svg-captcha
```

Expected: `added 1 package` 类似输出，无 error。

- [ ] **Step 2: 创建 captchaStore.js**

新建 `/opt/bigdata-sre-platform/backend/src/captchaStore.js`：

```js
'use strict';

// 内存验证码存储，key = captchaId，value = { answer, expireAt }
const store = new Map();
const TTL_MS = 5 * 60 * 1000; // 5 分钟

// 清理过期条目（防止内存泄漏）
function cleanup() {
  const now = Date.now();
  for (const [id, entry] of store) {
    if (now > entry.expireAt) store.delete(id);
  }
}
setInterval(cleanup, 60 * 1000); // 每分钟清理一次

/**
 * 存储验证码
 * @param {string} id
 * @param {string} answer  原始答案（大小写不敏感，统一转小写存储）
 */
function set(id, answer) {
  store.set(id, { answer: answer.toLowerCase(), expireAt: Date.now() + TTL_MS });
}

/**
 * 校验验证码（一次性，校验后删除）
 * @param {string} id
 * @param {string} code  用户输入
 * @returns {{ valid: boolean, reason?: 'expired'|'wrong'|'missing' }}
 */
function verify(id, code) {
  if (!id || !code) return { valid: false, reason: 'missing' };

  const entry = store.get(id);
  if (!entry) return { valid: false, reason: 'expired' };

  if (Date.now() > entry.expireAt) {
    store.delete(id);
    return { valid: false, reason: 'expired' };
  }

  store.delete(id); // 一次性，无论对错都删除
  if (entry.answer !== code.toLowerCase()) return { valid: false, reason: 'wrong' };
  return { valid: true };
}

module.exports = { set, verify };
```

- [ ] **Step 3: 写单元测试**

新建 `/opt/bigdata-sre-platform/backend/tests/captchaStore.test.js`：

```js
const captchaStore = require('../src/captchaStore');

describe('captchaStore', () => {
  test('verify returns valid for correct code', () => {
    captchaStore.set('id1', 'Ab3K');
    expect(captchaStore.verify('id1', 'ab3k')).toEqual({ valid: true });
  });

  test('verify returns wrong for incorrect code', () => {
    captchaStore.set('id2', 'Ab3K');
    expect(captchaStore.verify('id2', 'XXXX')).toEqual({ valid: false, reason: 'wrong' });
  });

  test('verify is one-time: second call returns expired', () => {
    captchaStore.set('id3', 'test');
    captchaStore.verify('id3', 'test');
    expect(captchaStore.verify('id3', 'test')).toEqual({ valid: false, reason: 'expired' });
  });

  test('verify returns expired for unknown id', () => {
    expect(captchaStore.verify('nonexistent', 'abc')).toEqual({ valid: false, reason: 'expired' });
  });

  test('verify returns missing when code is empty', () => {
    captchaStore.set('id4', 'abc');
    expect(captchaStore.verify('id4', '')).toEqual({ valid: false, reason: 'missing' });
  });
});
```

- [ ] **Step 4: 运行测试，确认全部通过**

```bash
cd /opt/bigdata-sre-platform/backend && npx jest tests/captchaStore.test.js --no-coverage
```

Expected: `5 passed`

- [ ] **Step 5: Commit**

```bash
cd /opt/bigdata-sre-platform
git add backend/src/captchaStore.js backend/tests/captchaStore.test.js backend/package.json backend/package-lock.json
git commit -m "feat(backend): add captchaStore module with svg-captcha dependency"
```

---

### Task 2: 后端 — 新增 GET /api/auth/captcha 接口

**Files:**
- Modify: `backend/src/routes/auth.js`

- [ ] **Step 1: 在 auth.js 顶部添加依赖引入**

在 `/opt/bigdata-sre-platform/backend/src/routes/auth.js` 的第 1 行现有 `require` 语句之后，紧接着添加（在 `const router = express.Router();` 之前）：

```js
const svgCaptcha = require('svg-captcha');
const captchaStore = require('../captchaStore');
```

即文件头部变为：
```js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../models');
const config = require('../config');
const svgCaptcha = require('svg-captcha');
const captchaStore = require('../captchaStore');

const router = express.Router();
```

- [ ] **Step 2: 在 router 定义之后、register 路由之前，添加 captcha 路由**

在 `const router = express.Router();` 这一行之后，立即插入：

```js
// GET /api/auth/captcha - 获取图形验证码
router.get('/captcha', (req, res) => {
  const captcha = svgCaptcha.create({
    size: 4,
    ignoreChars: '0o1iIlL',
    noise: 2,
    color: true,
    background: '#f4f7ff',
    width: 120,
    height: 40,
    fontSize: 40
  });
  const captchaId = require('crypto').randomUUID();
  captchaStore.set(captchaId, captcha.text);
  res.json({ captchaId, svg: captcha.data });
});
```

- [ ] **Step 3: 写接口测试**

新建 `/opt/bigdata-sre-platform/backend/tests/captchaRoute.test.js`：

```js
const request = require('supertest');
const express = require('express');

// Mock config before requiring auth router
jest.mock('../src/config', () => ({
  jwt: { secret: 'test-secret-for-jest' },
  server: { port: 3001 }
}));

// Mock database query
jest.mock('../src/models', () => ({
  query: jest.fn(),
  initDatabase: jest.fn().mockResolvedValue(true)
}));

const authRouter = require('../src/routes/auth');

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

describe('GET /api/auth/captcha', () => {
  test('returns captchaId and svg', async () => {
    const res = await request(app).get('/api/auth/captcha');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('captchaId');
    expect(res.body).toHaveProperty('svg');
    expect(res.body.svg).toContain('<svg');
    expect(typeof res.body.captchaId).toBe('string');
    expect(res.body.captchaId.length).toBeGreaterThan(8);
  });

  test('each call returns different captchaId', async () => {
    const [r1, r2] = await Promise.all([
      request(app).get('/api/auth/captcha'),
      request(app).get('/api/auth/captcha')
    ]);
    expect(r1.body.captchaId).not.toBe(r2.body.captchaId);
  });
});
```

- [ ] **Step 4: 运行测试**

```bash
cd /opt/bigdata-sre-platform/backend && npx jest tests/captchaRoute.test.js --no-coverage
```

Expected: `2 passed`

- [ ] **Step 5: Commit**

```bash
cd /opt/bigdata-sre-platform
git add backend/src/routes/auth.js backend/tests/captchaRoute.test.js
git commit -m "feat(backend): add GET /api/auth/captcha endpoint"
```

---

### Task 3: 后端 — login 和 register 接口加验证码校验

**Files:**
- Modify: `backend/src/routes/auth.js`

- [ ] **Step 1: 修改 POST /api/auth/login，在密码校验前加验证码校验**

找到 `router.post('/login', async (req, res) => {` 这段，修改为：

```js
// POST /api/auth/login - 用户登录
router.post('/login', async (req, res) => {
  try {
    const { email, password, captchaId, captchaCode } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: '请输入邮箱和密码' });
    }

    // 校验验证码
    const captchaResult = captchaStore.verify(captchaId, captchaCode);
    if (!captchaResult.valid) {
      const msg = captchaResult.reason === 'expired' ? '验证码已过期，请刷新' : '验证码错误';
      return res.status(400).json({ error: msg, refreshCaptcha: true });
    }

    // 查找用户
    const users = await query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    const user = users[0];

    // 验证密码
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    // 更新最后登录时间
    await query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    // 生成 token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.json({
      success: true,
      message: '登录成功',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        avatar: user.avatar,
      }
    });
  } catch (err) {
    console.error('Login failed:', err);
    res.status(500).json({ error: '登录失败，请稍后重试' });
  }
});
```

- [ ] **Step 2: 修改 POST /api/auth/register，同样加验证码校验**

找到 `router.post('/register', async (req, res) => {` 这段，修改为：

```js
// POST /api/auth/register - 用户注册
router.post('/register', async (req, res) => {
  try {
    const { email, username, password, captchaId, captchaCode } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ error: '请填写完整的注册信息' });
    }

    // 校验验证码
    const captchaResult = captchaStore.verify(captchaId, captchaCode);
    if (!captchaResult.valid) {
      const msg = captchaResult.reason === 'expired' ? '验证码已过期，请刷新' : '验证码错误';
      return res.status(400).json({ error: msg, refreshCaptcha: true });
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: '请输入有效的邮箱地址' });
    }

    // 验证密码强度
    if (password.length < 6) {
      return res.status(400).json({ error: '密码至少需要6个字符' });
    }

    // 检查邮箱是否已存在
    const existing = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: '该邮箱已被注册' });
    }

    // 创建用户
    const userId = `user-${Date.now()}`;
    const hashedPassword = await bcrypt.hash(password, 10);

    await query(
      'INSERT INTO users (id, email, username, password, role) VALUES (?, ?, ?, ?, ?)',
      [userId, email, username, hashedPassword, 'user']
    );

    // 生成 token
    const token = jwt.sign({ userId, email, role: 'user' }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    res.status(201).json({
      success: true,
      message: '注册成功',
      token,
      user: {
        id: userId,
        email,
        username,
        role: 'user',
        avatar: null,
      }
    });
  } catch (err) {
    console.error('Register failed:', err);
    res.status(500).json({ error: '注册失败，请稍后重试' });
  }
});
```

- [ ] **Step 3: 运行所有后端测试**

```bash
cd /opt/bigdata-sre-platform/backend && npx jest --no-coverage 2>&1 | tail -20
```

Expected: 所有之前通过的测试仍然通过，新加的也通过。若有旧测试因验证码失败，需在旧测试中 mock captchaStore（见下方说明）。

> **注意：** 如果 `tests/skills.test.js` 或其他旧测试直接测试 login/register 接口并失败（因为没传验证码），需在该测试文件顶部 mock captchaStore：
> ```js
> jest.mock('../src/captchaStore', () => ({
>   set: jest.fn(),
>   verify: jest.fn().mockReturnValue({ valid: true })
> }));
> ```

- [ ] **Step 4: Commit**

```bash
cd /opt/bigdata-sre-platform
git add backend/src/routes/auth.js
git commit -m "feat(backend): add captcha validation to login and register endpoints"
```

---

### Task 4: 前端 — 安装 lottie-web，生成 Lottie JSON 角色文件

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/public/lottie/char1.json`
- Create: `frontend/public/lottie/char2.json`
- Create: `frontend/public/lottie/char3.json`

- [ ] **Step 1: 安装 lottie-web**

```bash
cd /opt/bigdata-sre-platform/frontend && npm install lottie-web
```

Expected: 无 error，`package.json` dependencies 中出现 `"lottie-web"`。

- [ ] **Step 2: 创建 Lottie JSON 生成脚本**

新建 `/opt/bigdata-sre-platform/frontend/scripts/gen-lottie.js`：

```js
#!/usr/bin/env node
/**
 * 生成 3 个卡通角色的 Lottie JSON 动画文件
 * 每个角色：圆润矩形身体 + 白色眼睛 + 小脚 + 上下漂浮动画（72帧@24fps=3秒循环）
 */
const fs = require('fs');
const path = require('path');

function makeCharacter({ name, bodyColor, footColor, scaleY = 1 }) {
  const bodyH = Math.round(130 * scaleY);
  const bodyY = 90 + (bodyH - 130) / 2;
  const eyeY = -Math.round(bodyH * 0.12);
  const footY = bodyY + bodyH / 2 + 8;

  const bobUp = [80, bodyY - 10, 0];
  const bobMid = [80, bodyY, 0];
  const footUp = [80, footY - 6, 0];
  const footMid = [80, footY, 0];

  const easing = { x: [0.42, 0.58], y: [0, 1] };

  function posKeyframes(mid, up) {
    return {
      a: 1,
      k: [
        { i: { x: easing.x[0], y: easing.y[0] }, o: { x: easing.x[1], y: easing.y[1] }, t: 0, s: mid },
        { i: { x: easing.x[0], y: easing.y[0] }, o: { x: easing.x[1], y: easing.y[1] }, t: 36, s: up },
        { t: 72, s: mid }
      ]
    };
  }

  function shapeLayer(nm, ind, pos, shapes) {
    return {
      ddd: 0, ind, ty: 4, nm,
      ks: {
        o: { a: 0, k: 100 }, r: { a: 0, k: 0 },
        p: pos,
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] }
      },
      ao: 0, shapes, ip: 0, op: 72, st: 0, bm: 0
    };
  }

  function fill(c) {
    return { ty: 'fl', c: { a: 0, k: c }, o: { a: 0, k: 100 }, r: 1, nm: 'fill' };
  }

  function tr() {
    return { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } };
  }

  const hexToLottie = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return [r, g, b, 1];
  };

  const bodyLayer = shapeLayer('body', 1, posKeyframes(bobMid, bobUp), [
    {
      ty: 'gr', nm: 'body-shape', it: [
        { ty: 'rc', d: 1, s: { a: 0, k: [110, bodyH] }, p: { a: 0, k: [0, 0] }, r: { a: 0, k: 52 }, nm: 'rect' },
        fill(hexToLottie(bodyColor)),
        tr()
      ]
    },
    // left eye white
    {
      ty: 'gr', nm: 'leye', it: [
        { ty: 'el', d: 1, s: { a: 0, k: [18, 18] }, p: { a: 0, k: [-18, eyeY] }, nm: 'e' },
        fill([1, 1, 1, 1]), tr()
      ]
    },
    // left pupil
    {
      ty: 'gr', nm: 'lpupil', it: [
        { ty: 'el', d: 1, s: { a: 0, k: [9, 9] }, p: { a: 0, k: [-18, eyeY] }, nm: 'p' },
        fill([0.1, 0.1, 0.1, 1]), tr()
      ]
    },
    // right eye white
    {
      ty: 'gr', nm: 'reye', it: [
        { ty: 'el', d: 1, s: { a: 0, k: [18, 18] }, p: { a: 0, k: [18, eyeY] }, nm: 'e' },
        fill([1, 1, 1, 1]), tr()
      ]
    },
    // right pupil
    {
      ty: 'gr', nm: 'rpupil', it: [
        { ty: 'el', d: 1, s: { a: 0, k: [9, 9] }, p: { a: 0, k: [18, eyeY] }, nm: 'p' },
        fill([0.1, 0.1, 0.1, 1]), tr()
      ]
    }
  ]);

  const feetLayer = shapeLayer('feet', 2, posKeyframes(footMid, footUp), [
    {
      ty: 'gr', nm: 'lfoot', it: [
        { ty: 'rc', d: 1, s: { a: 0, k: [24, 14] }, p: { a: 0, k: [-20, 0] }, r: { a: 0, k: 7 }, nm: 'f' },
        fill(hexToLottie(footColor)), tr()
      ]
    },
    {
      ty: 'gr', nm: 'rfoot', it: [
        { ty: 'rc', d: 1, s: { a: 0, k: [24, 14] }, p: { a: 0, k: [20, 0] }, r: { a: 0, k: 7 }, nm: 'f' },
        fill(hexToLottie(footColor)), tr()
      ]
    }
  ]);

  return {
    v: '5.7.4', fr: 24, ip: 0, op: 72, w: 160, h: 200,
    nm: name, ddd: 0, assets: [],
    layers: [bodyLayer, feetLayer]
  };
}

const outDir = path.join(__dirname, '../public/lottie');
fs.mkdirSync(outDir, { recursive: true });

const chars = [
  { file: 'char1.json', name: 'blob-orange', bodyColor: '#FF6B47', footColor: '#E85A38', scaleY: 0.92 },
  { file: 'char2.json', name: 'blob-purple', bodyColor: '#7C3AED', footColor: '#6027C8', scaleY: 1.25 },
  { file: 'char3.json', name: 'blob-yellow', bodyColor: '#EAB308', footColor: '#CA9A06', scaleY: 1.05 },
];

for (const { file, ...opts } of chars) {
  const json = makeCharacter(opts);
  fs.writeFileSync(path.join(outDir, file), JSON.stringify(json));
  console.log(`Generated ${file}`);
}
console.log('Done.');
```

- [ ] **Step 3: 运行脚本生成 JSON 文件**

```bash
cd /opt/bigdata-sre-platform/frontend && node scripts/gen-lottie.js
```

Expected:
```
Generated char1.json
Generated char2.json
Generated char3.json
Done.
```

验证文件存在：
```bash
ls -la /opt/bigdata-sre-platform/frontend/public/lottie/
```

Expected: 3 个 `.json` 文件，各 > 2KB。

- [ ] **Step 4: Commit**

```bash
cd /opt/bigdata-sre-platform
git add frontend/package.json frontend/package-lock.json \
        frontend/public/lottie/ frontend/scripts/gen-lottie.js
git commit -m "feat(frontend): install lottie-web, generate 3 blob character animations"
```

---

### Task 5: 前端 — 重写 LoginPage.vue

**Files:**
- Modify: `frontend/src/components/LoginPage.vue`

- [ ] **Step 1: 完整替换 LoginPage.vue**

将 `/opt/bigdata-sre-platform/frontend/src/components/LoginPage.vue` 全部内容替换为：

```vue
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
              <!-- 机器人头部 -->
              <rect x="14" y="18" width="36" height="28" rx="10" fill="url(#rg)"/>
              <rect x="22" y="26" width="8" height="8" rx="4" fill="white" opacity="0.9"/>
              <rect x="34" y="26" width="8" height="8" rx="4" fill="white" opacity="0.9"/>
              <rect x="26" y="36" width="12" height="4" rx="2" fill="white" opacity="0.7"/>
              <!-- 天线 -->
              <rect x="31" y="10" width="2" height="8" rx="1" fill="url(#rg)"/>
              <circle cx="32" cy="9" r="3" fill="#a78bfa"/>
              <!-- 颈部 -->
              <rect x="29" y="46" width="6" height="6" rx="2" fill="url(#rg)"/>
              <!-- 耳朵 -->
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
          <!-- 验证码 -->
          <div class="field-group captcha-group">
            <span class="field-icon">
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clip-rule="evenodd"/></svg>
            </span>
            <input v-model="loginForm.captchaCode" type="text" placeholder="验证码" required maxlength="6" class="captcha-input"/>
            <button type="button" class="captcha-img-btn" @click="loadCaptcha" :title="'点击刷新验证码'">
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
            <button type="button" class="captcha-img-btn" @click="loadCaptcha" :title="'点击刷新验证码'">
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
  // Only react when mouse is in the left panel
  if (e.clientX > rect.right) return
  const nx = (e.clientX - rect.left) / rect.width - 0.5  // -0.5 → +0.5
  const ny = (e.clientY - rect.top) / rect.height - 0.5
  wraps.forEach((wRef, i) => {
    if (!wRef.value) return
    const f = factors[i]
    wRef.value.style.transform = `translate(${nx * 28 * f}px, ${ny * 20 * f}px)`
  })
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(async () => {
  // Check saved auth
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
```

- [ ] **Step 2: 启动前端开发服务器，验证页面**

```bash
cd /opt/bigdata-sre-platform/frontend && npm run dev -- --port 5173 &
sleep 3
curl -s http://localhost:5173 | grep -c 'div' || echo "server running"
```

在浏览器访问 `http://localhost:5173`，确认：
- 左侧深蓝背景，3 个卡通角色在动
- 鼠标移动时角色跟随移动
- 右侧白色卡片，机器人 Logo，登录/注册 tab
- 验证码图片显示（自动加载）
- 登录/注册表单字段正常

- [ ] **Step 3: 停止开发服务器并 Commit**

```bash
kill %1 2>/dev/null || true
cd /opt/bigdata-sre-platform
git add frontend/src/components/LoginPage.vue
git commit -m "feat(frontend): redesign LoginPage with Lottie characters and captcha field"
```

---

### Task 6: 集成测试 — 端到端验证登录流程

**Files:**
- No file changes; manual verification only

- [ ] **Step 1: 启动后端服务**

```bash
cd /opt/bigdata-sre-platform/backend && node src/index.js &
sleep 3
curl -s http://localhost:3000/api/health
```

Expected: `{"status":"ok","timestamp":"..."}` 类似输出。

- [ ] **Step 2: 获取验证码**

```bash
CAPTCHA=$(curl -s http://localhost:3000/api/auth/captcha)
echo $CAPTCHA | grep -o '"captchaId":"[^"]*"'
echo $CAPTCHA | grep -c '<svg'
```

Expected: 看到 captchaId 和 1（svg 存在）。

- [ ] **Step 3: 用错误验证码测试登录被拒绝**

```bash
CAPTCHA_ID=$(echo $CAPTCHA | sed 's/.*"captchaId":"\([^"]*\)".*/\1/')
curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"admin@bigdata.local\",\"password\":\"admin123\",\"captchaId\":\"$CAPTCHA_ID\",\"captchaCode\":\"XXXX\"}"
```

Expected: `{"error":"验证码错误"}`

- [ ] **Step 4: 重新获取验证码，通过 svgCaptcha 得到明文答案来测试正常登录**

> 由于验证码答案无法从前端读取，此步骤通过临时日志来验证。  
> 在 `backend/src/routes/auth.js` 的 captcha 路由中，临时加一行：
> ```js
> console.log('[TEST] captcha answer:', captcha.text)
> ```
> 然后重启后端、获取新验证码，用日志中的答案登录，确认登录成功。  
> 测试完成后删除该 console.log 行。

- [ ] **Step 5: 清理并 Commit**

```bash
# 确保删除了临时 console.log
cd /opt/bigdata-sre-platform
git add -p backend/src/routes/auth.js  # 确认只保留正式代码
git commit -m "test: verify captcha login flow end-to-end"
```

---

## 自检 — Spec 覆盖确认

| 需求 | 覆盖任务 |
|------|---------|
| 左侧深蓝背景 + Lottie 卡通角色 | Task 4, Task 5 |
| 鼠标移动时角色跟随 | Task 5 (handleMouseMove) |
| 右侧白色卡片 + 机器人 Logo | Task 5 |
| 登录/注册 Tab 保留 | Task 5 |
| 验证码字段（输入框 + 图片） | Task 5 |
| GET /api/auth/captcha 接口 | Task 2 |
| 验证码内存存储 + TTL | Task 1 |
| login/register 接口校验验证码 | Task 3 |
| 验证码过期/错误自动刷新 | Task 5 (refreshCaptcha) |
| 移动端响应式 | Task 5 (@media) |
