# DESIGN.md — Big Data SRE Platform

This document defines the complete visual design system for the Big Data SRE Platform (大数据运维智能平台). Any AI coding agent working on this project must follow these rules to produce a consistent UI.

---

## 1. Visual Theme & Atmosphere

**Identity**: Professional, technical, trustworthy — a monitoring dashboard for big data infrastructure, not a consumer app.

**Mood**: Calm authority. Clean surfaces with purposeful color accents. The interface should feel like a well-organized control room — information density is high but never chaotic.

**Dual-mode design**: Both light and dark themes are equally important, but each has its own personality.

**Light mode** (Enterprise Dashboard): Inspired by Datadog and New Relic. Pure white cards on gray canvas, solid lake blue accent, flat shadows, clear hierarchy. Clarity over polish.

**Dark mode** (Ops Terminal): Inspired by Grafana and Prometheus. Deep zinc backgrounds in 3-tier staircase, solid dark cards, brighter accent for contrast, monospace font for data. Density and readability over aesthetics.

**What this is NOT**: No gradients, no glass-morphism, no glow shadows, no entrance animations, no hover lifts, no emoji icons, no rainbow color coding. These are decorative patterns that belong to AI-generated UIs, not operational tools.

---

## 2. Three-Tier Background Staircase

The most important structural pattern. Every surface is assigned to one of 3 tiers, creating natural depth without shadows or glass effects.

### Light Mode

| Tier | Variable | Value | Role |
|------|----------|-------|------|
| **Canvas** (deepest) | `--bg-canvas` | `#f4f5f7` | Page grid area, the "floor" |
| **Primary** (mid) | `--bg-primary` | `#ffffff` | Sidebar, panels, cards, header — sits on canvas |
| **Secondary** (elevated) | `--bg-secondary` | `#ffffff` | Dropdowns, popovers, dialogs — floats above primary |
| **Hover** | `--bg-hover` | `#ebedf0` | Hover states, active nav items |
| **Active** | `--bg-active` | `#dde0e4` | Pressed/active button states |

### Dark Mode (Grafana-inspired)

| Tier | Variable | Value | Role |
|------|----------|-------|------|
| **Canvas** (deepest) | `--bg-canvas` | `#0b0c0e` | Page grid area, the "abyss" |
| **Primary** (mid) | `--bg-primary` | `#141517` | Sidebar, panels, cards — sits on canvas |
| **Secondary** (elevated) | `--bg-secondary` | `#1a1b1e` | Dropdowns, popovers, dialogs — floats above primary |
| **Hover** | `--bg-hover` | `#222326` | Hover states, active nav items |
| **Active** | `--bg-active` | `#2a2b2f` | Pressed/active button states |

**Key rule**: Each tier is ~6-8% brightness apart. This creates natural depth hierarchy without any decorative effects.

---

## 3. Three-Level Border Opacity System

Borders also follow a 3-level system, derived from the same base color at different opacities. This creates visual weight hierarchy for borders.

### Light Mode (base: rgba(26, 26, 46, …))

| Level | Variable | Value | Usage |
|-------|----------|-------|-------|
| **Weak** | `--border-weak-line` | `1px solid rgba(26,26,46,0.08)` | Inner dividers, subtle separation |
| **Medium** | `--border-medium-line` | `1px solid rgba(26,26,46,0.15)` | Card borders, visible separation |
| **Strong** | `--border-strong-line` | `1px solid rgba(26,26,46,0.25)` | Emphasis, focus rings, active borders |

Raw color values (for custom widths like `2px solid`):
- `--border-weak`: `rgba(26,26,46,0.08)`
- `--border-medium`: `rgba(26,26,46,0.15)`
- `--border-strong`: `rgba(26,26,46,0.25)`

### Dark Mode (base: rgba(230, 230, 240, …))

| Level | Variable | Value | Usage |
|-------|----------|-------|-------|
| **Weak** | `--border-weak-line` | `1px solid rgba(230,230,240,0.07)` | Inner dividers, subtle separation |
| **Medium** | `--border-medium-line` | `1px solid rgba(230,230,240,0.15)` | Card borders, visible separation |
| **Strong** | `--border-strong-line` | `1px solid rgba(230,230,240,0.25)` | Emphasis, focus rings |

---

## 4. Color Palette

### Accent & Functional Colors

| Role | Light Mode | Dark Mode | Variable |
|------|-----------|-----------|----------|
| **Accent** | `#0369a1` | `#38bdf8` | `--accent` |
| **Accent-light** | `#0284c7` | `#7dd3fc` | `--accent-light` |
| **Accent-dark** | `#075985` | `#0284c7` | `--accent-dark` |
| **Success** | `#059669` | `#4ade80` | `--success` |
| **Warning** | `#d97706` | `#fbbf24` | `--warning` |
| **Danger** | `#dc2626` | `#f87171` | `--danger` |
| **Info** | `#0891b2` | `#22d3ee` | `--info` |
| **Purple** | `#7c3aed` | `#a78bfa` | `--purple` |

### Text — 3 Opacity Levels (same base hue)

| Level | Light Mode | Dark Mode | Variable |
|-------|-----------|-----------|----------|
| **Primary** | `#1a1a2e` | `rgba(230,230,240,1)` | `--text-primary` |
| **Secondary** | `#4a4a68` | `rgba(230,230,240,0.65)` | `--text-secondary` |
| **Muted** | `#7a7a8e` | `rgba(230,230,240,0.38)` | `--text-muted` |

### Tag Colors — Solid Pairs (bg + text)

**Light Mode** (light bg + dark text):

| Tag | Background | Text | Variables |
|-----|-----------|------|-----------|
| Green | `#d1fae5` | `#065f46` | `--tag-green-bg` / `--tag-green-text` |
| Blue | `#dbeafe` | `#1e40af` | `--tag-blue-bg` / `--tag-blue-text` |
| Purple | `#ede9fe` | `#5b21b6` | `--tag-purple-bg` / `--tag-purple-text` |
| Cyan | `#cffafe` | `#155e75` | `--tag-cyan-bg` / `--tag-cyan-text` |
| Orange | `#fef3c7` | `#92400e` | `--tag-orange-bg` / `--tag-orange-text` |
| Red | `#fee2e2` | `#991b1b` | `--tag-red-bg` / `--tag-red-text` |

**Dark Mode** (dark bg + light text — inverted pairs):

| Tag | Background | Text |
|-----|-----------|------|
| Green | `#064e3b` | `#6ee7b7` |
| Blue | `#1e3a5f` | `#93c5fd` |
| Purple | `#2e1065` | `#c4b5fd` |
| Cyan | `#083344` | `#67e8f9` |
| Orange | `#451a03` | `#fbbf24` |
| Red | `#450a0a` | `#fca5a5` |

---

## 5. Typography Rules

**Font stack**: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

**Monospace font**: `'JetBrains Mono', monospace` — used for data numbers, stats, IDs, timestamps, and code blocks in dark mode.

**Anti-aliasing**: Always enable `-webkit-font-smoothing: antialiased`

| Context | Size | Weight | Color |
|---------|------|--------|-------|
| Page title (header h2) | 16px | 600 | `--text-primary` |
| Sidebar logo title | 14px | 600 | `--text-primary` |
| Nav group label | 11px | 500 | `--text-muted` (uppercase, 0.6px letter-spacing) |
| Nav item label | 13px | 500 | `--text-muted` (inactive), `--accent` (active) |
| Card heading (h4) | 14px | 600 | `--text-primary` |
| Body text | 14px–15px | 400 | `--text-primary` |
| Data values / stats | 14px–28px | 600–700 | `--text-primary`, use `--font-mono` in dark mode |
| Description / secondary | 13px | 400 | `--text-secondary` |
| Timestamp / muted | 12px | 400 | `--text-muted` |
| Tag / label | 12px | 500 | `--tag-*-text` (solid) |
| Button text | 14px | 600 (primary), 500 (default) | white (primary), `--text-secondary` (default) |

**Never**: Use font-weight below 400. Never use decorative or script fonts. Never use emoji as icon substitutes.

---

## 6. Component Stylings

### Sidebar

- Width: 260px (desktop), 60px (mobile)
- Background: `--bg-primary` (solid)
- Border-right: `--border-weak-line` (solid 1px)
- No backdrop-filter, no glass
- Logo section: icon (36x36, `--accent` bg, `--radius-sm` radius) + text
- Nav items organized into groups with `.nav-group-label` divs:
  - Workspace (智能对话, 集群仪表板)
  - Monitor (集群配置, 钉钉配置)
  - Admin (智能体管理, 技能配置, 用户管理)
- Nav items: 6px 12px padding, `--radius-sm`, `--text-muted` color, 2px left border (transparent)
- Nav hover: `--bg-hover` bg + `--text-primary` color
- Nav active: `--bg-hover` bg + `border-left: 2px solid var(--accent)` + `--accent` text
- Footer: static status dot (8px, `--success`, no animation) + "系统运行中"

### Header (Top bar)

- Height: 52px
- Background: `--bg-primary` (solid)
- Border-bottom: `--border-weak-line` (solid 1px)
- No backdrop-filter, no glass
- Theme toggle: `--radius-sm`, `--bg-hover` bg, active button gets `--accent` bg (solid)
- User avatar: 24x24, `--accent` bg, `--radius-sm`, white initial letter
- Dropdown: `--bg-secondary` bg, `--border-medium-line`, `--radius-md`, `--shadow-lg`

### Card (`.card`)

- Background: `--bg-primary` (solid)
- Border: `--border-weak-line` (solid 1px)
- Border-radius: `--radius-md` (6px)
- No box-shadow — Grafana-style: border only, no shadow
- No backdrop-filter, no glass, no glow, no hover lift

### Dashboard Panel (`.card--panel`)

- Background: `--bg-primary` (solid)
- Border: `--border-medium-line` (solid 1px, slightly stronger than card)
- Border-radius: `--radius-md` (6px)
- No box-shadow

### Stat Card (Dashboard)

- Uses `.card--panel` base
- Stat header: icon (18x18) + h4 + status badge
- Stat row: label + bold value, use `--font-mono` for numbers in dark mode
- Progress bar: `--accent` fill, `--bg-hover` track

### Chat View

- Messages box: `--bg-primary` bg, `--border-medium-line`, `--radius-md`
- User bubble: `--accent` bg (solid), white text, `6px 6px 2px 6px` radius
- Assistant bubble: `--bg-primary` bg, `--border-medium-line`, `6px 6px 6px 2px` radius
- Process steps: `--bg-hover` bg, `--border-weak-line` border
- Step indicators: `--tag-*-bg` solid backgrounds
- Quick buttons: uniform `border-left: 3px solid var(--accent)`, no rainbow colors
- Input box: `--bg-primary` bg, `--border-medium-line`, `--radius-md`

### Login Page

- Full-screen centered card
- Background: `--bg-secondary` (solid, no gradient)
- Card: `--bg-primary` bg, `--border-medium-line`, `--radius-lg` (8px), no blur
- Logo: SVG with `currentColor` fill, no gradient
- Tab indicator: `--accent` bg (solid), `--radius-sm`
- Submit button: `--accent` bg (solid), hover → `--accent-dark`

### Buttons

- Primary (`btn-primary` / `el-button--primary`): `--accent` bg (solid), white text, `--radius-sm`, hover → `--accent-dark` bg. No gradient, no brightness filter, no lift, no glow.
- Default (`el-button--default`): `--bg-primary` bg, `--border-medium` border, `--text-secondary` text, `--radius-sm`, hover → accent border + accent text.

### Tags / Badges

- All tags use solid background + solid text pairs (`--tag-*-bg` / `--tag-*-text`)
- Dark mode uses inverted pairs (dark bg + light text)
- Border-radius: `--radius-sm`
- Font: 12px, 500 weight
- No gradient tags, no rgba tinted backgrounds

---

## 7. Layout Principles

**Overall structure**: Sidebar (260px) + Header (52px) + Main content area. Full viewport height, no page scrolling.

**Sidebar**: Fixed left, vertical flex column — logo → grouped nav menu (flex-grow) → footer.

**Main area**: Vertical flex — header → scrollable content (24px padding on `--bg-canvas`).

**Grid**: Dashboard uses `el-row` / `el-col` with 16px gutter. 3-column layout.

**Card spacing**: 16px gaps between grid items, 8px between list items.

**Alignment**: Content always left-aligned. Center alignment only for login and empty states.

---

## 8. Shadows

### Light Mode

| Level | Variable | Value | Usage |
|-------|----------|-------|-------|
| Small | `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.06)` | Cards, buttons, tags |
| Medium | `--shadow-md` | `0 2px 8px rgba(0,0,0,0.08)` | Dropdowns |
| Large | `--shadow-lg` | `0 8px 24px rgba(0,0,0,0.12)` | Dialogs, poppers |

### Dark Mode

| Level | Variable | Value | Usage |
|-------|----------|-------|-------|
| Small | `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.4)` | Cards, buttons |
| Medium | `--shadow-md` | `0 2px 8px rgba(0,0,0,0.5)` | Dropdowns |
| Large | `--shadow-lg` | `0 8px 24px rgba(0,0,0,0.6)` | Dialogs |

**No glow shadows.** Shadows are flat gray — functional depth only.

**No glass effects.** No `backdrop-filter`, no translucent backgrounds. All surfaces use solid backgrounds and solid borders.

---

## 9. Radius Scale

| Level | Variable | Value | Usage |
|-------|----------|-------|-------|
| Small | `--radius-sm` | `4px` | Buttons, inputs, tags, avatars |
| Medium | `--radius-md` | `6px` | Cards, nav items, tool items, tables |
| Large | `--radius-lg` | `8px` | Dialogs, login card |

Never hardcode border-radius px values. Always use these variables.

---

## 10. Elevation Hierarchy

1. **Canvas** (`--bg-canvas`) — page background, the "floor"
2. **Primary** (`--bg-primary`) — sidebar, header, cards — sits on canvas
3. **Secondary** (`--bg-secondary`) — dropdowns, popovers, dialogs — floats above primary
4. **Hover/Active** (`--bg-hover`/`--bg-active`) — interactive states on any surface

Each tier is separated by ~6-8% brightness. No shadows needed for depth — the background staircase does it.

---

## 11. Do's and Don'ts

### Do

- Always use CSS variables from `theme.css` — never hardcode colors
- Use the 3-tier background staircase: canvas → primary → secondary for depth
- Use the 3-level border opacity system: weak → medium → strong for visual weight
- Use `.card` class for content panels (border only, no shadow — Grafana-style)
- Use `.card--panel` for dashboard panels (slightly stronger border)
- Use solid `--accent` for active states, primary buttons, avatars — no gradient
- Use `--tag-*-bg` / `--tag-*-text` solid pairs for tags and badges — no rgba tinted backgrounds
- Use `--radius-sm/md/lg` variables — never hardcode px
- Use `--font-mono` (JetBrains Mono) for data numbers and stats in dark mode
- Use `.nav-group-label` for grouping sidebar navigation items
- Use static colored dots for status indicators — no pulse animation
- Use `--bg-hover` for hover backgrounds — no accent-tinted rgba
- Use Element Plus components with our CSS overrides
- Ensure both light and dark mode variants for every new color/style

### Don't

- NEVER use `--gradient-primary` or any gradient on UI elements — it doesn't exist
- NEVER use `backdrop-filter: blur()` or glass-morphism effects
- NEVER use hover-lift transforms (`translateY`) on any element
- NEVER use glow shadows (`--shadow-glow` or colored box-shadow glow) — they don't exist
- NEVER use rgba-tinted backgrounds (the 12% opacity pattern) for tags/badges — use solid pairs
- NEVER use entrance animations (`fade-in-up`, `delay-*`) — content just appears
- NEVER use emoji as icon substitutes — use inline SVGs or text labels
- NEVER use rainbow nth-child color coding — use uniform `--accent`
- NEVER use `filter: brightness()` on hover effects
- NEVER use `--bg-glass`, `--border-glass`, `--bg-card`, `--border-light` — they don't exist anymore
- NEVER hardcode border-radius values — use `--radius-sm/md/lg` variables
- NEVER add new theme colors without both light and dark mode variants
- NEVER use box-shadow on cards — use border only (Grafana-style)

---

## 12. Responsive Behavior

| Breakpoint | Width | Changes |
|------------|-------|---------|
| Desktop | >768px | Full layout: 260px sidebar, 24px content padding |
| Mobile | ≤768px | Collapsed sidebar (60px, icons only), no logo text, no nav labels, 16px padding |

---

## 13. Agent Prompt Guide

When generating UI code for this project, follow these directives:

1. **Read `theme.css` first**. All colors, shadows, borders, and radius values come from CSS variables. Never hardcode any of these.

2. **Use `data-theme="dark"` attribute** for dark mode. All dark overrides use this selector.

3. **Use the 3-tier background staircase**. Every surface belongs to a tier:
   - `--bg-canvas`: page background (deepest)
   - `--bg-primary`: sidebar, panels, cards (mid)
   - `--bg-secondary`: dropdowns, popovers, dialogs (elevated)

4. **Use the 3-level border opacity system**. Every border belongs to a level:
   - `--border-weak-line`: subtle inner dividers
   - `--border-medium-line`: card borders, visible separation
   - `--border-strong-line`: emphasis, focus rings

5. **Use Element Plus components** with our CSS overrides in `theme.css`. Don't recreate with raw HTML.

6. **Use `.card` class** for content panels: border only, no shadow (Grafana-style). Use `.card--panel` for dashboard panels with slightly stronger border.

7. **Use solid `--accent` color** for active states, primary buttons, avatars. No gradients. Hover on primary buttons uses `--accent-dark`.

8. **Spacing**: 8px tight gaps, 12px medium, 16px card gaps, 24px page padding.

9. **Radius scale**: `--radius-sm` (4px) for buttons/inputs/tags, `--radius-md` (6px) for cards/nav, `--radius-lg` (8px) for dialogs. Never hardcode px values.

10. **No animations**: Content appears immediately. No `fade-in-up`, no `delay-*`, no `pulse`, no bounce. Static status dots only.

11. **SVG icons**: Inline SVGs with `viewBox="0 0 24 24"`, `stroke="currentColor"`, `stroke-width="2"`. All icons use `color: var(--accent)` uniformly — no rainbow per-item coloring.

12. **Chinese text**: UI labels are Chinese. English for subtitles, technical terms, code.

13. **Nav group labels**: Use `.nav-group-label` class (11px, uppercase, 0.6px letter-spacing) to organize sidebar navigation into logical groups.

14. **Data values**: Use `.data-value` class or `--font-mono` for numbers, stats, IDs in dark mode.

15. **New components**: Wrap in container, use `card` for panels, solid backgrounds from the 3-tier system, solid borders from the 3-level opacity system. Both light and dark mode must work via CSS variables.

16. **Never skip dark mode**. Every new style must have `[data-theme="dark"]` values. Use solid `--bg-primary`/`--bg-secondary`/`--bg-hover` — never translucent rgba or glass effects.