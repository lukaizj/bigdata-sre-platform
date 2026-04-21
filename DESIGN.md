# DESIGN.md — Big Data SRE Platform

> 工业数据终端。不是 AI 玩具，是真正的指挥系统。

## 1. Visual Theme & Atmosphere

**Style**: NEXUS // SRE_COMMAND — Industrial Data Terminal  
**Keywords**: 工业终端、指挥中心、高密度数据、精密仪器、暗色优先、科技克制  
**Tone**: 冷静权威，信息密度高但不混乱，像一台运行中的控制台 — NOT 消费品、NOT AI 风、NOT 紫色渐变玻璃  
**Feel**: 坐在卫星控制室里，盯着全球节点状态图，一切都在掌控中  

**Interaction Tier**: L1 精致静态（登录页 L2）  
**Dependencies**: CSS only（登录页加 CSS keyframe 动画，无 JS 动画库）

**双模式定义**：
- **暗色模式（默认 / 主模式）**: 深炭色三层底，青色+琥珀色主色，等宽字体数据展示，LED 状态指示器
- **亮色模式（日间模式）**: 浅灰底 + 纯白卡片，同色系但调亮，同样工业感，绝不是普通企业白

---

## 2. Color Palette & Roles

```css
/* ===== 暗色模式（默认）===== */
[data-theme="dark"],
:root {
  /* 三层背景阶梯 */
  --bg-canvas:   #0a0e14;              /* 最深底，页面背景 */
  --bg-primary:  rgba(13,17,23,0.96);  /* 侧边栏、卡片 */
  --bg-secondary:rgba(22,27,34,0.97);  /* 下拉、弹层 */
  --bg-hover:    rgba(255,255,255,0.05);
  --bg-active:   rgba(255,255,255,0.09);
  --bg-solid:    #161b22;

  /* 主强调色 — 青/teal */
  --accent:          #14b8a6;
  --accent-light:    #5eead4;
  --accent-dark:     #0f766e;
  --accent-gradient: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%);
  --accent-glow:     rgba(20,184,166,0.25);
  --accent-rgb:      20,184,166;

  /* 次强调色 — 琥珀，用于告警/强调/装饰 */
  --accent2:          #f59e0b;
  --accent2-light:    #fbbf24;
  --accent2-dark:     #d97706;
  --accent2-gradient: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);
  --accent2-glow:     rgba(245,158,11,0.25);
  --accent2-rgb:      245,158,11;

  /* 语义色 */
  --success:  #4ade80;
  --warning:  #fbbf24;
  --danger:   #f87171;
  --info:     #22d3ee;
  --success-rgb: 74,222,128;
  --danger-rgb:  248,113,113;

  /* 文字三级 */
  --text-primary:   rgba(230,237,243,1.00);
  --text-secondary: rgba(230,237,243,0.78);
  --text-muted:     rgba(230,237,243,0.56);
  --text-disabled:  rgba(230,237,243,0.30);

  /* 边框系统 */
  --border-weak:        rgba(230,237,243,0.07);
  --border-medium:      rgba(230,237,243,0.12);
  --border-strong:      rgba(230,237,243,0.22);
  --border-accent:      rgba(20,184,166,0.40);
  --border-weak-line:   1px solid rgba(230,237,243,0.07);
  --border-medium-line: 1px solid rgba(230,237,243,0.12);
  --border-strong-line: 1px solid rgba(230,237,243,0.22);
  --border-accent-line: 1px solid rgba(20,184,166,0.40);

  /* LED 状态灯 */
  --led-green: #4ade80;
  --led-amber: #fbbf24;
  --led-red:   #f87171;
  --led-cyan:  #14b8a6;
  --led-green-glow: 0 0 7px rgba(74,222,128,0.7);
  --led-amber-glow: 0 0 7px rgba(251,191,36,0.7);
  --led-red-glow:   0 0 7px rgba(248,113,113,0.7);
  --led-cyan-glow:  0 0 7px rgba(20,184,166,0.7);

  /* 阴影 */
  --shadow-sm:   0 1px 2px rgba(0,0,0,0.35);
  --shadow-md:   0 3px 8px rgba(0,0,0,0.45);
  --shadow-lg:   0 8px 24px rgba(0,0,0,0.55);
  --shadow-glow: 0 0 20px rgba(var(--accent-rgb),0.2);

  /* 圆角 — 较方正 */
  --radius-xs: 2px;
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 10px;

  /* 字体 */
  --font-mono: 'JetBrains Mono', 'Sarasa Mono SC', 'Consolas', 'PingFang SC', monospace;
  --font-body: 'Outfit', -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif;

  /* 侧边栏（固定深色，不随主题变化） */
  --sidebar-bg:          linear-gradient(180deg, #0d1117 0%, #0a0e14 100%);
  --sidebar-text:        rgba(230,237,243,0.85);
  --sidebar-text-muted:  rgba(230,237,243,0.42);
  --sidebar-hover:       rgba(255,255,255,0.05);
  --sidebar-active:      rgba(20,184,166,0.12);
  --sidebar-border:      rgba(255,255,255,0.06);

  /* Tag 色对 */
  --tag-green-bg:  rgba(6,78,59,0.6);    --tag-green-text:  #6ee7b7;
  --tag-teal-bg:   rgba(19,78,74,0.6);   --tag-teal-text:   #5eead4;
  --tag-blue-bg:   rgba(30,58,95,0.6);   --tag-blue-text:   #93c5fd;
  --tag-amber-bg:  rgba(69,26,3,0.6);    --tag-amber-text:  #fbbf24;
  --tag-orange-bg: rgba(69,26,3,0.6);    --tag-orange-text: #fbbf24;
  --tag-red-bg:    rgba(69,10,10,0.6);   --tag-red-text:    #fca5a5;
  --tag-cyan-bg:   rgba(8,51,68,0.6);    --tag-cyan-text:   #67e8f9;
}

/* ===== 亮色模式（日间模式）===== */
[data-theme="light"] {
  --bg-canvas:   #e8eaed;
  --bg-primary:  rgba(255,255,255,0.92);
  --bg-secondary:rgba(248,250,252,0.97);
  --bg-hover:    rgba(0,0,0,0.04);
  --bg-active:   rgba(0,0,0,0.08);
  --bg-solid:    #ffffff;

  --accent:          #0d9488;
  --accent-light:    #14b8a6;
  --accent-dark:     #0f766e;
  --accent-gradient: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%);
  --accent-glow:     rgba(13,148,136,0.15);

  --accent2:       #d97706;
  --accent2-light: #f59e0b;
  --accent2-dark:  #b45309;
  --accent2-glow:  rgba(217,119,6,0.15);

  --success: #059669;
  --warning: #d97706;
  --danger:  #dc2626;
  --info:    #0891b2;

  --text-primary:   #0d1117;
  --text-secondary: #3d4450;
  --text-muted:     #6b7280;
  --text-disabled:  #9ca3af;

  --border-weak:        rgba(13,17,23,0.07);
  --border-medium:      rgba(13,17,23,0.12);
  --border-strong:      rgba(13,17,23,0.22);
  --border-accent:      rgba(13,148,136,0.40);
  --border-weak-line:   1px solid rgba(13,17,23,0.07);
  --border-medium-line: 1px solid rgba(13,17,23,0.12);
  --border-strong-line: 1px solid rgba(13,17,23,0.22);
  --border-accent-line: 1px solid rgba(13,148,136,0.40);

  --led-green: #059669;
  --led-amber: #d97706;
  --led-red:   #dc2626;
  --led-cyan:  #0d9488;
  --led-green-glow: 0 0 7px rgba(5,150,105,0.5);
  --led-amber-glow: 0 0 7px rgba(217,119,6,0.5);
  --led-red-glow:   0 0 7px rgba(220,38,38,0.5);
  --led-cyan-glow:  0 0 7px rgba(13,148,136,0.5);

  --shadow-sm: 0 1px 2px rgba(0,0,0,0.06);
  --shadow-md: 0 3px 8px rgba(0,0,0,0.08);
  --shadow-lg: 0 8px 24px rgba(0,0,0,0.12);

  --tag-green-bg:  #d1fae5;  --tag-green-text:  #065f46;
  --tag-teal-bg:   #ccfbf1;  --tag-teal-text:   #134e4a;
  --tag-blue-bg:   #dbeafe;  --tag-blue-text:   #1e40af;
  --tag-amber-bg:  #fef3c7;  --tag-amber-text:  #92400e;
  --tag-orange-bg: #fef3c7;  --tag-orange-text: #92400e;
  --tag-red-bg:    #fee2e2;  --tag-red-text:    #991b1b;
  --tag-cyan-bg:   #cffafe;  --tag-cyan-text:   #155e75;
}
```

**Color Rules:**
- 所有颜色通过 CSS 变量引用，**禁止硬编码 hex**（登录页的动画装饰性元素除外）
- 青色(`--accent`) 用于主要操作、活跃态、成功信号、链接
- 琥珀色(`--accent2`) 用于警告、次要强调、装饰性数据标注，**不用于按钮主操作**
- 同一视图内最多用一个强调色系
- 侧边栏固定深色，不随主题切换

---

## 3. Typography Rules

```css
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
```

| Role | Font | Size | Weight | Line Height | Letter Spacing |
|------|------|------|--------|-------------|----------------|
| 页面主标题 H1 | Outfit | 22–28px | 700 | 1.25 | -0.01em |
| 章节标题 H2 | Outfit | 18–20px | 700 | 1.3 | -0.01em |
| 卡片标题 H3/H4 | Outfit | 14–16px | 600 | 1.4 | 0 |
| 正文 Body | Outfit | 14px | 400 | 1.7 | 0 |
| 次要描述 | Outfit | 13px | 400 | 1.6 | 0 |
| 导航标签 | Outfit | 14px | 500 | 1 | 0 |
| 分组标签 | JetBrains Mono | 11px | 600 | 1 | 0.10em（大写） |
| 数据值/指标 | JetBrains Mono | 14–28px | 600–700 | 1.2 | 0 |
| 时间戳/ID | JetBrains Mono | 11–12px | 400 | 1 | 0.04em |
| 终端/代码 | JetBrains Mono | 13px | 400 | 1.7 | 0 |
| 按钮文字 | Outfit | 13–14px | 600 | 1 | 0.04em |

**Typography Rules:**
- 工业终端数据（节点数、百分比、时间戳）全部用 `var(--font-mono)`
- 导航分组标签（工作区/监控/管理）用 `var(--font-mono)` 小大写
- 正文中文行高 ≥ 1.7，`letter-spacing: 0.02em`
- **NEVER use**: Inter、Roboto、Arial、系统默认 sans-serif 作为主字体

**Text Decoration（标题渐变规则）：**
- 登录页品牌大标题：`background-clip: text` 青→琥珀渐变 ✅（装饰性场景）
- 主应用页面标题：纯色 `--text-primary`，无渐变 ❌
- 数据卡片值：`--accent` 或 `--accent2`，无渐变

---

## 4. Component Stylings

### Sidebar
```css
.sidebar {
  width: 240px;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--sidebar-border);
  /* 固定深色，不跟主题变化 */
}
/* 顶部环境光 */
.sidebar::before {
  content: '';
  position: absolute;
  top: -40%; left: -20%;
  width: 140%; height: 60%;
  background: radial-gradient(ellipse, rgba(var(--accent-rgb),0.10) 0%, transparent 70%);
  pointer-events: none;
}
/* Logo 区 */
.logo-section {
  padding: 20px 16px 16px;
  display: flex; align-items: center; gap: 12px;
  border-bottom: 1px solid var(--sidebar-border);
}
.logo-icon {
  width: 36px; height: 36px;
  background: var(--accent-gradient);
  border-radius: var(--radius-sm);   /* 方正，4px */
  box-shadow: 0 2px 8px rgba(var(--accent-rgb),0.3);
}
/* 导航分组标签 — JetBrains Mono */
.nav-group-label {
  font-family: var(--font-mono);
  font-size: 10px; font-weight: 600;
  letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--sidebar-text-muted);
  padding: 18px 12px 6px;
}
/* 导航项 */
.nav-item {
  padding: 8px 12px;
  border-radius: var(--radius-xs);  /* 2px，更方正 */
  color: var(--sidebar-text-muted);
  transition: background 0.15s, color 0.15s;
  position: relative; overflow: hidden;
}
.nav-item::before {           /* 左侧激活轨道 */
  content: '';
  position: absolute; left: 0; top: 50%;
  transform: translateY(-50%) scaleY(0);
  width: 2px; height: 60%;
  background: var(--accent);
  box-shadow: var(--led-cyan-glow);
  border-radius: 0 1px 1px 0;
  transition: transform 0.2s;
}
.nav-item:hover { background: var(--sidebar-hover); color: var(--sidebar-text); }
.nav-item:hover::before { transform: translateY(-50%) scaleY(0.5); }
.nav-item.active { background: var(--sidebar-active); color: white; }
.nav-item.active::before { transform: translateY(-50%) scaleY(1); }
/* 底部状态 LED */
.status-dot {
  width: 6px; height: 6px;
  background: var(--led-green);
  box-shadow: var(--led-green-glow);
  border-radius: 1px;          /* 方形 LED，非圆点 */
  animation: led-pulse 2.5s ease-in-out infinite;
}
@keyframes led-pulse {
  0%,100% { opacity: 0.7; }
  50% { opacity: 1; }
}
```

### Card
```css
.card {
  background: var(--bg-primary);
  border: var(--border-medium-line);
  border-radius: var(--radius-sm);  /* 4px，工业感 */
  padding: 20px;
}
/* 带左侧强调条的卡片 */
.card-accent {
  border-left: 2px solid var(--accent);
}
.card-accent-amber {
  border-left: 2px solid var(--accent2);
}
/* hover */
.card-hover:hover {
  border-color: var(--border-accent);
  box-shadow: 0 0 0 1px rgba(var(--accent-rgb),0.15);
  transition: border-color 0.2s, box-shadow 0.2s;
}
```

### Buttons
```css
/* Primary */
.btn-primary {
  background: var(--accent-gradient);
  border: none;
  color: white;
  border-radius: var(--radius-xs);  /* 2px */
  padding: 8px 18px;
  font-family: var(--font-body);
  font-size: 13px; font-weight: 600;
  letter-spacing: 0.04em;
  cursor: pointer;
  position: relative; overflow: hidden;
  transition: box-shadow 0.2s;
  box-shadow: 0 0 14px rgba(var(--accent-rgb),0.25);
}
.btn-primary::before {   /* 扫光 */
  content: '';
  position: absolute; top: 0; left: -100%;
  width: 100%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
  animation: btn-sweep 2.5s linear infinite;
}
@keyframes btn-sweep { to { left: 100%; } }
.btn-primary:hover { box-shadow: 0 0 22px rgba(var(--accent-rgb),0.45); }
.btn-primary:active { transform: scale(0.98); }
.btn-primary:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

/* Default */
.btn-default {
  background: transparent;
  border: var(--border-medium-line);
  color: var(--text-secondary);
  border-radius: var(--radius-xs);
  padding: 7px 16px;
  font-size: 13px; font-weight: 500;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.btn-default:hover { border-color: var(--accent); color: var(--accent); }
.btn-default:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.btn-default:disabled { opacity: 0.4; cursor: not-allowed; }

/* Danger */
.btn-danger {
  background: transparent;
  border: 1px solid rgba(var(--danger-rgb),0.4);
  color: var(--danger);
  border-radius: var(--radius-xs);
  padding: 7px 16px;
  font-size: 13px; font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-danger:hover { background: rgba(var(--danger-rgb),0.1); }
```

### Navigation Header
```css
.top-header {
  height: 54px;
  background: var(--bg-primary);
  border-bottom: var(--border-weak-line);
  display: flex; align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}
/* 页面标题 */
.header-title {
  font-family: var(--font-mono);
  font-size: 13px; font-weight: 600;
  letter-spacing: 0.10em; text-transform: uppercase;
  color: var(--text-secondary);
}
.header-title::before {
  content: '// ';
  color: var(--accent);
  opacity: 0.7;
}
/* 主题切换 */
.theme-btn.active {
  background: var(--accent-gradient);
  box-shadow: 0 0 10px rgba(var(--accent-rgb),0.3);
}
/* 用户下拉 */
.user-dropdown {
  background: var(--bg-secondary);
  border: var(--border-medium-line);  /* 修正：用 medium 不用已删除的 border-light */
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-lg);
}
```

### Tags / Badges
```css
.tag {
  display: inline-flex; align-items: center;
  padding: 2px 8px;
  font-family: var(--font-mono);
  font-size: 10.5px; font-weight: 500;
  letter-spacing: 0.06em;
  border-radius: var(--radius-xs);
}
.tag-green  { background: var(--tag-green-bg);  color: var(--tag-green-text); }
.tag-teal   { background: var(--tag-teal-bg);   color: var(--tag-teal-text); }
.tag-amber  { background: var(--tag-amber-bg);  color: var(--tag-amber-text); }
.tag-red    { background: var(--tag-red-bg);    color: var(--tag-red-text); }
.tag-cyan   { background: var(--tag-cyan-bg);   color: var(--tag-cyan-text); }
```

### Terminal Block（ChatView 专属）
```css
.term-wrap {
  background: #0a0e14;               /* 终端固定深色，不跟主题 */
  border: var(--border-accent-line);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
}
/* 亮色模式下终端微调（不变色，只调整边框和光晕） */
[data-theme="light"] .term-wrap {
  border-color: rgba(13,148,136,0.35);
  box-shadow: 0 0 30px rgba(13,148,136,0.06);
}
```

### LED Status Indicator
```css
.led {
  display: inline-block;
  width: 6px; height: 6px;
  border-radius: 1px;  /* 方形 */
}
.led-green { background: var(--led-green); box-shadow: var(--led-green-glow); }
.led-amber { background: var(--led-amber); box-shadow: var(--led-amber-glow); }
.led-red   { background: var(--led-red);   box-shadow: var(--led-red-glow); }
.led-cyan  { background: var(--led-cyan);  box-shadow: var(--led-cyan-glow); }
/* 脉冲变体 */
.led-pulse { animation: led-pulse 2.5s ease-in-out infinite; }
```

---

## 5. Layout Principles

**整体结构**: 侧边栏(240px 固定) + 竖向 flex（顶栏 54px + 可滚动内容区）

**内容区**:
- Max width: 不限制（仪表板类页面铺满，表单类页面 max-width: 720px）
- Padding: `24px`（桌面），`16px`（移动）

**间距梯度**:
- `4px` 紧密元素内间距
- `8px` 行内元素间距
- `12px` 标签、图标与文字
- `16px` 卡片 gap、网格 gutter
- `24px` 页面 padding、section 分隔
- `32px` 区块大间距

**网格**:
```css
/* 仪表板三列 */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
/* 卡片内容两列 */
.card-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
```

---

## 6. Depth & Elevation

| 层级 | 处理方式 | 使用场景 |
|------|---------|---------|
| Canvas | `--bg-canvas` 无阴影 | 页面背景 |
| Surface | `--bg-primary` + `--border-weak-line` | 卡片、侧边栏 |
| Elevated | `--bg-secondary` + `--shadow-md` | 下拉菜单、Popover |
| Overlay | `--bg-solid` + `--shadow-lg` | Modal、Drawer |
| Terminal | `#0a0e14` 固定（不随主题）+ `--border-accent-line` | ChatView 终端块 |
| Login HUD | 多层叠加（背景 + 装饰层 + 内容层） | 登录页品牌面板 |

**Elevation 规则**：工业风不依赖大阴影，靠边框颜色深度和背景层次区分深浅。

---

## 7. Animation & Interaction

**Motion Philosophy**: 有目的的动效——状态切换用过渡，装饰性动效仅限登录页，主应用保持静止权威感

**Tier**: L1（主应用），L2（登录页）

### 基础 Hover & Focus
```css
/* 所有可交互元素的基础过渡 */
* { transition-property: color, background-color, border-color, box-shadow, opacity, transform; transition-duration: 0.15s; }

/* 焦点环 */
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
```

### 页面切换动画（主应用）
```css
/* 主内容区路由切换 */
.page-enter-active { animation: page-in 0.22s ease-out; }
.page-leave-active { animation: page-out 0.15s ease-in; }

@keyframes page-in {
  from { opacity: 0; transform: translateX(8px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes page-out {
  from { opacity: 1; }
  to   { opacity: 0; }
}
```

### 入场动画（卡片/列表）
```css
.fade-in {
  animation: fade-in 0.3s ease-out backwards;
}
@keyframes fade-in {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
/* 错开延迟 */
.fade-in:nth-child(1) { animation-delay: 0.05s; }
.fade-in:nth-child(2) { animation-delay: 0.10s; }
.fade-in:nth-child(3) { animation-delay: 0.15s; }
```

### 登录页专属动效（L2）
```css
/* 引导：boot-fade 启动序列 */
@keyframes boot-fade {
  from { opacity: 0; filter: blur(2px); }
  to   { opacity: 1; filter: blur(0); }
}
/* 雷达旋转 */
@keyframes radar-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
/* CRT 水平扫描线 */
@keyframes crt-sweep {
  0%   { top: -3px; opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 1; }
  100% { top: 100%; opacity: 0; }
}
/* 轨道旋转 */
@keyframes orbit-rotate {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
```

**登录页动画负载控制**（性能红线）：
- 脉冲光环 ≤ 2 个（不是 3 个）
- 星点 ≤ 12 个
- 同时运行的 CSS animation 不超过 15 个
- 轨道环 2 个即可，不需要 3 个

### 减少动效降级
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 8. Do's and Don'ts

### Do
- **用 CSS 变量**：所有颜色、圆角、阴影通过变量引用，装饰性动画颜色除外
- **用 `--border-medium-line`**（不是已删除的 `--border-light`）作为通用卡片/弹层边框
- **用方形 LED**（`border-radius: 1px`）替代圆形状态点，体现工业感
- **用 `var(--font-mono)` 展示数据**：节点数、百分比、时间戳、ID、指标值
- **用 `var(--font-mono)` 写导航分组标签**（大写 + letter-spacing: 0.14em）
- **侧边栏激活项**用左侧 2px 竖条 + `var(--led-cyan-glow)` 代替背景块
- **卡片圆角 `--radius-xs`（2px）或 `--radius-sm`（4px）**，保持工业方正感
- **终端 ChatView 固定深色底** `#0a0e14`，不随主题变化（终端天然是黑的）
- **页面切换**用轻量 CSS transition（translateX(8px) + opacity），不用跳变
- **Header 页面标题**用 `// PAGE_TITLE` 格式加前缀，体现终端美学

### Don't
- ❌ **禁止硬编码颜色**（`#7c3aed`、`#a78bfa` 等紫色已删除；主应用区域禁止直接写 hex）
- ❌ **禁止 `backdrop-filter: blur()`** — 玻璃态已全部清除，不可引入
- ❌ **禁止 `--border-light`** — 该变量不存在，用 `--border-weak-line` 或 `--border-medium-line`
- ❌ **禁止 `--border-glass`、`--bg-glass`、`--bg-card`** — 已删除变量
- ❌ **禁止在主应用卡片上加 `glow` 阴影** — glow 效果只属于登录页和 LED 指示器
- ❌ **禁止 `translateY` hover 上浮** — 主应用页面卡片不做悬浮动效
- ❌ **禁止随机/假数据指标** 出现在生产 UI 上（LoginPage 的 side-readout 使用随机值是设计特例，仅限登录页装饰）
- ❌ **禁止 Emoji 图标** — 用内联 SVG
- ❌ **禁止 rainbow 配色**（nth-child 彩虹色）— 用统一的 `--accent`
- ❌ **登录页之外禁止 CRT/雷达/脉冲光环等装饰动效**
- ❌ **禁止 Inter/Roboto/Arial 作主字体**

---

## 9. Responsive Behavior

**Breakpoints:**

| 断点 | 宽度 | 关键变化 |
|------|------|---------|
| Desktop | > 1180px | 完整布局，侧边栏读数可见 |
| Laptop | 960–1180px | 侧边栏收纳装饰性元素 |
| Tablet | 768–960px | 侧边栏折叠为图标模式(60px) |
| Mobile | < 768px | 侧边栏图标模式，内容 16px padding |
| Small | < 480px | 登录页单列堆叠，轨道环隐藏 |

**Touch Targets**: 最小 44×44px

**折叠策略**:
- 侧边栏: 768px 以下折叠为 60px 图标条，标签隐藏
- 登录页: 960px 以下左右分栏变上下堆叠，品牌区 min-height: 340px
- ChatView: 480px 以下，prompt 前缀缩写，`[ 执行 ]` 按钮宽度固定 56px

```css
@media (max-width: 768px) {
  .sidebar { width: 60px !important; }
  .logo-text, .nav-label, .nav-group-label { display: none; }
  .nav-item { justify-content: center; padding: 10px; }
  .main-content { padding: 16px; }
}
@media (max-width: 960px) {
  .login-page { flex-direction: column; }
  .brand-panel { min-height: 340px; }
  .form-panel { width: 100%; }
}
@media (max-width: 480px) {
  .data-orbit { display: none; }
  .data-card  { display: none; }
  .side-readout { display: none; }
}
```

---

## 10. Agent Prompt Guide（AI 编码约束）

1. **读 `theme.css` 和本文件**再写代码，所有 token 来源于此
2. **终端块**（ChatView、code block）固定 `background: #0a0e14`，不随主题变化
3. **侧边栏**固定深色，不写 `[data-theme="light"]` 的侧边栏覆盖
4. **圆角**：主应用卡片用 `--radius-xs`(2px) 或 `--radius-sm`(4px)；弹层用 `--radius-md`(6px)
5. **数据值**用 `font-family: var(--font-mono)`；UI 文字用 `var(--font-body)`
6. **状态点**用方形 LED（`border-radius: 1px`）+ `--led-*-glow`
7. **边框**统一用 `--border-*-line` 变量；禁止 `--border-light`
8. **页面切换**加 Vue `<Transition name="page">` + 对应 CSS
9. **新组件**必须提供 dark + light 两个模式样式
10. **Header 页面标题**格式：`// TITLE` 使用 `var(--font-mono)` + `--text-secondary`
