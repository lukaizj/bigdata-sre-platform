# 登录页增强设计 - 6角色 + 完整装饰

**日期**：2026-04-17  
**状态**：已审批，待实现

---

## 目标

在现有登录页基础上增加：
- 6个卡通角色（原3个 + 新增3个）
- 完整背景装饰（云朵、星星、光点）
- 鼠标交互增强（角色跟随鼠标）

---

## 改动范围

| 文件 | 改动 |
|------|------|
| `frontend/src/components/LoginPage.vue` | 增强左侧面板：新增角色 + 装饰元素 |
| `frontend/public/lottie/` | 新增3个 Lottie JSON 文件 |
| `frontend/src/styles/theme.css` | 如需新增动画类 |

**不改动**：右侧登录卡片、后端验证码逻辑

---

## 前端设计

### 整体布局

```
┌───────────────────────────────────────────────────────┬──────────────────────┐
│          左侧动画面板 (flex:1)                     │   右侧登录卡片 (420px)│
│    深蓝渐变背景 + 6卡通角色 + 装饰                   │   白色背景 + 表单    │
│         🧑🤖🧙‍♂️👩‍💻                              │                      │
│         ✨ ☁️⭐💫        👨‍🔬🧚                       │                      │
└───────────────────────────────────────────────────────┴──────────────────────┘
```

### 左侧动画面板

#### 背景
- **渐变**：`linear-gradient(135deg, #0d1b4b 0%, #1a2f7a 100%)`（保持不变）
- **网格纹理**：保留现有 `::before` 伪元素

#### 卡通角色（6个）

**现有3个**：
- `char1.json`：橙色机器人（80×100px）
- `char2.json`：紫色机器人（70×90px）
- `char3.json`：蓝色机器人（75×95px）

**新增3个**（从 LottieFiles 获取免费素材）：
- 角色类型建议：法师 🧙‍♂️、科学家 👨‍🔬、小精灵 🧚
- 尺寸：60-80px 高度
- 位置：背景层，略小

**布局**：
- 前景层（3个）：char1, char2, char3，较大
- 背景层（3个）：新增角色，较小，半透明

#### 装饰元素

**云朵** ☁️：
- 数量：3个
- 实现：CSS 绘制（圆角矩形组合）
- 位置：顶部随机分布
- 动画：上下缓慢浮动（3-5s 周期）

**星星** ✨：
- 数量：8-12个
- 实现：SVG 或 CSS
- 位置：随机分布
- 动画：闪烁（opacity 变化）

**光点** 💫：
- 数量：5-8个
- 实现：径向渐变 div
- 位置：随机
- 动画：缓慢漂移

#### 鼠标交互

保留现有逻辑，增强：
```javascript
// 现有逻辑已实现角色跟随
// 新增：背景装饰的轻微视差
wraps.forEach((wRef, i) => {
  const f = factors[i]
  wRef.value.style.transform = `translate(${nx * 28 * f}px, ${ny * 20 * f}px)`
})
```

---

## 技术实现

### 1. Lottie 角色获取

来源：https://lottiefiles.com（免费 CC 素材）
- 搜索关键词：wizard, scientist, fairy, elf
- 筛选：免费、可商用
- 格式：JSON (Lottie)

### 2. CSS 动画

```css
/* 云朵浮动 */
@keyframes cloud-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}

/* 星星闪烁 */
@keyframes star-twinkle {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

/* 光点漂移 */
@keyframes light-drift {
  0% { transform: translate(0, 0); }
  25% { transform: translate(10px, -10px); }
  50% { transform: translate(0, -20px); }
  75% { transform: translate(-10px, -10px); }
  100% { transform: translate(0, 0); }
}
```

### 3. 性能

- 使用 `requestAnimationFrame`（已有）
- 装饰动画使用 `will-change: transform`
- 延迟加载非前景角色

---

## 错误处理

| 场景 | 处理 |
|------|------|
| 新 Lottie 加载失败 | 降级到5个角色 |
| 所有 Lottie 失败 | 保留 orbs + 装饰，仅角色降级 |
| 装饰影响性能 | 减少装饰数量 |

---

## 验收标准

1. 左侧面板显示 6 个卡通角色
2. 云朵、星星、光点装饰正常显示
3. 鼠标移动时角色跟随移动
4. 装饰动画流畅运行
5. 右侧登录功能正常
6. 移动端响应式正常

---

## 不在范围内

- 角色语音/动画交互
- 粒子系统
- 3D 效果