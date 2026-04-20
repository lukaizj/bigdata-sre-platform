# 登录页增强实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 增强登录页 - 6个卡通角色 + 云朵/星星装饰 + 鼠标交互

**Architecture:** 在现有 LoginPage.vue 基础上增加角色和装饰元素，使用 CSS 动画实现云朵星星，Lottie 动画文件存放 public/lottie/

**Tech Stack:** Vue 3, Lottie-web, CSS 动画

---

## 文件结构

| 文件 | 职责 |
|------|------|
| `frontend/src/components/LoginPage.vue` | 主组件 - 模板、样式、交互逻辑 |
| `frontend/public/lottie/char4.json` | 新角色 - 法师 🧙‍♂️ |
| `frontend/public/lottie/char5.json` | 新角色 - 科学家 👨‍🔬 |
| `frontend/public/lottie/char6.json` | 新角色 - 小精灵 🧚 |

---

### Task 1: 新增 3 个 Lottie 角色文件

**Files:**
- Create: `frontend/public/lottie/char4.json`
- Create: `frontend/public/lottie/char5.json`
- Create: `frontend/public/lottie/char6.json`

- [ ] **Step 1: 获取免费 Lottie 素材**

访问 https://lottiefiles.com/search?q=wizard 或类似搜索，获取3个免费可商用的角色动画：
- wizard / mage (法师)
- scientist / scientist character
- fairy /elf / creature

选择标准：
- 格式：JSON
- 风格：简洁卡通，与现有角色一致
- 尺寸范围：类似现有（160×200）
- 动作：轻微浮动/呼吸动画

**保存路径**：
```bash
/opt/bigdata-sre-platform/frontend/public/lottie/char4.json
/opt/bigdata-sre-platform/frontend/public/lottie/char5.json
/opt/bigdata-sre-platform/frontend/public/lottie/char6.json
```

- [ ] **Step 2: 验证 JSON 格式**

```bash
# 检查是有效 JSON
node -e "JSON.parse(require('fs').readFileSync('/opt/bigdata-sre-platform/frontend/public/lottie/char4.json'))"
```

预期：Parse succeeds，无输出

- [ ] **Step 3: 提交**

```bash
git add frontend/public/lottie/char4.json frontend/public/lottie/char5.json frontend/public/lottie/char6.json
git commit -m "feat: add 3 new lottie characters (wizard, scientist, fairy)"
```

---

### Task 2: 增强 LoginPage.vue 模板 - 新增角色和装饰

**Files:**
- Modify: `frontend/src/components/LoginPage.vue:1-30`

- [ ] **Step 1: 添加新增角色的模板**

在现有 `<div class="scene">` 内的 char-wrap 后添加：

```vue
<!-- 新增角色 (背景层) -->
<div class="char-wrap char4" ref="wrap4">
  <div ref="cont4" class="lottie-cont"></div>
</div>
<div class="char-wrap char5" ref="wrap5">
  <div ref="cont5" class="lottie-cont"></div>
</div>
<div class="char-wrap char6" ref="wrap6">
  <div ref="cont6" class="lottie-cont"></div>
</div>
```

- [ ] **Step 2: 添加装饰元素模板**

在 `<div class="orb orb-3">` 后添加：

```vue
<!-- 云朵 -->
<div class="cloud cloud-1"></div>
<div class="cloud cloud-2"></div>
<div class="cloud cloud-3"></div>

<!-- 星星 -->
<div class="star star-1"></div>
<div class="star star-2"></div>
<div class="star star-3"></div>
<div class="star star-4"></div>
<div class="star star-5"></div>
<div class="star star-6"></div>
<div class="star star-7"></div>
<div class="star star-8"></div>

<!-- 光点 -->
<div class="light-dot light-1"></div>
<div class="light-dot light-2"></div>
<div class="light-dot light-3"></div>
<div class="light-dot light-4"></div>
<div class="light-dot light-5"></div>
```

- [ ] **Step 3: 提交**

```bash
git add frontend/src/components/LoginPage.vue
git commit -f -m "feat: add 3 new lottie chars and decorations to login template"
```

---

### Task 3: 增强 LoginPage.vue script - 新角色初始化

**Files:**
- Modify: `frontend/src/components/LoginPage.vue:284-310`

- [ ] **Step 1: 添加新角色 Refs**

现有代码：
```javascript
const cont1 = ref(null)
const cont2 = ref(null)
const cont3 = ref(null)
const wrap1 = ref(null)
const wrap2 = ref(null)
const wrap3 = ref(null)
```

添加：
```javascript
const cont4 = ref(null)
const cont5 = ref(null)
const cont6 = ref(null)
const wrap4 = ref(null)
const wrap5 = ref(null)
const wrap6 = ref(null)
```

- [ ] **Step 2: 扩展 initLottie 函数**

现有：
```javascript
const chars = [
  { cont: cont1.value, path: '/lottie/char1.json' },
  { cont: cont2.value, path: '/lottie/char2.json' },
  { cont: cont3.value, path: '/lottie/char3.json' },
]
```

添加：
```javascript
{ cont: cont4.value, path: '/lottie/char4.json' },
{ cont: cont5.value, path: '/lottie/char5.json' },
{ cont: cont6.value, path: '/lottie/char6.json' },
```

- [ ] **Step 3: 扩展鼠标跟踪数组**

现有：
```javascript
const wraps = [wrap1, wrap2, wrap3]
const factors = [1.0, 0.65, 1.3]
```

添加：
```javascript
const wraps = [wrap1, wrap2, wrap3, wrap4, wrap5, wrap6]
const factors = [1.0, 0.65, 1.3, 0.4, 0.35, 0.45]
```

- [ ] **Step 4: 提交**

```bash
git add frontend/src/components/LoginPage.vue
git commit -m "feat: init all 6 lottie chars and mouse tracking"
```

---

### Task 4: 添加 CSS 装饰样式

**Files:**
- Modify: `frontend/src/components/LoginPage.vue:420-451`

- [ ] **Step 1: 添加云朵样式**

```css
/* 云朵 */
.cloud {
  position: absolute;
  width: 80px;
  height: 28px;
  background: rgba(255,255,255,0.15);
  border-radius: 20px;
  pointer-events: none;
}
.cloud::before, .cloud::after {
  content: '';
  position: absolute;
  background: inherit;
  border-radius: 50%;
}
.cloud::before { width: 35px; height: 35px; top: -18px; left: 12px; }
.cloud::after { width: 25px; height: 25px; top: -12px; left: 40px; }

.cloud-1 { top: 15%; left: 10%; animation: cloud-float 4s ease-in-out infinite; }
.cloud-2 { top: 25%; right: 15%; animation: cloud-float 5s ease-in-out infinite 1s; }
.cloud-3 { bottom: 30%; left: 30%; animation: cloud-float 6s ease-in-out infinite 2s; }

@keyframes cloud-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}
```

- [ ] **Step 2: 添加星星样式**

```css
/* 星星 */
.star {
  position: absolute;
  width: 4px;
  height: 4px;
  background: white;
  border-radius: 50%;
  pointer-events: none;
  box-shadow: 0 0 6px 2px rgba(255,255,255,0.6);
}

.star-1 { top: 20%; left: 20%; animation: star-twinkle 2s infinite; }
.star-2 { top: 35%; left: 60%; animation: star-twinkle 2.5s infinite 0.3s; }
.star-3 { top: 50%; left: 30%; animation: star-twinkle 3s infinite 0.6s; }
.star-4 { top: 15%; left: 70%; animation: star-twinkle 2.2s infinite 0.9s; }
.star-5 { top: 60%; left: 75%; animation: star-twinkle 2.8s infinite 1.2s; }
.star-6 { top: 45%; left: 50%; animation: star-twinkle 3.2s infinite 0.4s; }
.star-7 { top: 70%; left: 25%; animation: star-twinkle 2.6s infinite 1.5s; }
.star-8 { top: 30%; left: 45%; animation: star-twinkle 2.4s infinite 0.8s; }

@keyframes star-twinkle {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.5); }
}
```

- [ ] **Step 3: 添加光点样式**

```css
/* 光点 */
.light-dot {
  position: absolute;
  width: 8px;
  height: 8px;
  background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
}

.light-1 { top: 25%; left: 35%; animation: light-drift 8s infinite; }
.light-2 { top: 45%; left: 55%; animation: light-drift 10s infinite 2s; }
.light-3 { top: 65%; left: 40%; animation: light-drift 9s infinite 4s; }
.light-4 { top: 35%; left: 65%; animation: light-drift 11s infinite 1s; }
.light-5 { top: 55%; left: 25%; animation: light-drift 7s infinite 3s; }

@keyframes light-drift {
  0% { transform: translate(0, 0); opacity: 0.5; }
  25% { transform: translate(15px, -10px); opacity: 0.8; }
  50% { transform: translate(5px, -25px); opacity: 0.4; }
  75% { transform: translate(-10px, -10px); opacity: 0.7; }
  100% { transform: translate(0, 0); opacity: 0.5; }
}
```

- [ ] **Step 4: 调整新角色的位置和大小**

添加背景层样式：
```css
/* 背景层角色 - 较小半透明 */
.char4, .char5, .char6 { opacity: 0.6; transform: scale(0.75); }

.char4 { margin-bottom: 40px; margin-left: 20px; }
.char5 { margin-bottom: 50px; }
.char6 { margin-right: 30px; margin-bottom: 30px; }
```

- [ ] **Step 5: 提交**

```css
git add frontend/src/components/LoginPage.vue
git commit -m "feat: add cloud, star, light-dot CSS decorations"
```

---

### Task 5: 构建验证

- [ ] **Step 1: 构建前端**

```bash
cd /opt/bigdata-sre-platform/frontend && npm run build 2>&1
```

预期：Build success，无 error

- [ ] **Step 2: 检查打包结果**

```bash
ls -la /opt/bigdata-sre-platform/frontend/dist/
```

预期：dist 目录包含新文件

- [ ] **Step 3: 提交**

```bash
git add frontend/dist/
git commit -m "chore: build for login enhancement"
```

---

## 执行方式

**"Plan complete. Two execution options:**

**1. Subagent-Driven (recommended)** - 我分发子任务代理并行执行
**2. Inline Execution** - 我在这个会话中逐步执行

**选择哪个？**

---

## 验收检查

完成后请验证：
- [ ] 左侧面板显示 6 个卡通角色
- [ ] 云朵、星星、光点装饰正常显示
- [ ] 鼠标移动时角色跟随移动
- [ ] 装饰动画流畅
- [ ] 右侧登录功能正常