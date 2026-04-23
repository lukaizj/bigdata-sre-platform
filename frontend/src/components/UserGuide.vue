<template>
  <div class="bp-guide">
    <!-- ╭── Page Header · LoginPage title block ──╮ -->
    <header class="bp-page-head">
      <aside class="bp-margin-ruler">
        <span class="bp-margin-tick" v-for="n in ['00','01','02','03','04','05']" :key="n">
          <em>{{ n }}</em><i></i>
        </span>
      </aside>

      <div class="bp-page-head-body">
        <div class="bp-title-block">
          <span class="bp-eyebrow">
            <i class="bp-eyebrow-bar"></i>
            <span>OPERATOR MANUAL</span>
          </span>

          <h1 class="bp-display-title">
            <span class="bp-t-main">使用</span>
            <span class="bp-t-accent">GUIDE</span>
            <span class="bp-t-mute">/ GET STARTED</span>
          </h1>

          <div class="bp-dim">
            <span class="bp-dim-arrow">◂</span>
            <span class="bp-dim-line"></span>
            <span class="bp-dim-num">03 STEPS</span>
            <span class="bp-dim-line"></span>
            <span class="bp-dim-arrow">▸</span>
          </div>

          <p class="bp-sub">欢迎使用大数据运维平台 — 智能化的 Hadoop / Spark / YARN 集群运维助手。阅读以下三步快速上手。</p>

          <div class="bp-callouts">
            <span class="bp-callout"><em>A</em><span>QUICK START</span></span>
            <span class="bp-callout is-amber"><em>B</em><span>FEATURE MAP</span></span>
            <span class="bp-callout is-green"><em>C</em><span>FAQ</span></span>
          </div>

          <!-- Handwritten annotation -->
          <div class="bp-note">
            <svg class="bp-note-arrow" viewBox="0 0 80 40" aria-hidden="true">
              <path d="M 2 38 Q 25 30, 40 18 T 76 4" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="2 3"/>
              <path d="M 72 2 L 76 4 L 74 8" fill="none" stroke="currentColor" stroke-width="1.2"/>
            </svg>
            <span class="bp-note-text">read me first, then play —</span>
          </div>
        </div>

        <!-- Revision stamp -->
        <div class="bp-stamp">
          <div class="bp-stamp-inner">
            <span class="bp-stamp-check">✓</span>
            <div class="bp-stamp-text">
              <strong>APPROVED</strong>
              <small>DOC · v1.0</small>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- ╭── Quick Start ──╮ -->
    <section class="bp-section">
      <div class="bp-section-head">
        <div class="bp-section-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
        </div>
        <h3 class="bp-section-title">快速开始</h3>
      </div>

      <div class="bp-steps-grid">
        <div class="bp-step-card">
          <span class="bp-card-tick-tl"></span>
          <span class="bp-card-tick-tr"></span>
          <span class="bp-card-tick-bl"></span>
          <span class="bp-card-tick-br"></span>

          <span class="bp-step-num">01</span>
          <h4 class="bp-step-title">配置集群</h4>
          <p class="bp-step-desc">在「集群配置」页面添加您的 Hadoop/Spark/YARN 集群地址</p>
          <button class="bp-btn" @click="$emit('navigate', 'config')">前往配置</button>
        </div>
        <div class="bp-step-card">
          <span class="bp-card-tick-tl"></span>
          <span class="bp-card-tick-tr"></span>
          <span class="bp-card-tick-bl"></span>
          <span class="bp-card-tick-br"></span>

          <span class="bp-step-num">02</span>
          <h4 class="bp-step-title">创建智能体</h4>
          <p class="bp-step-desc">在「智能体管理」创建运维智能体并分配技能</p>
          <button class="bp-btn" @click="$emit('navigate', 'agents')">前往创建</button>
        </div>
        <div class="bp-step-card">
          <span class="bp-card-tick-tl"></span>
          <span class="bp-card-tick-tr"></span>
          <span class="bp-card-tick-bl"></span>
          <span class="bp-card-tick-br"></span>

          <span class="bp-step-num">03</span>
          <h4 class="bp-step-title">开始对话</h4>
          <p class="bp-step-desc">选择智能体，通过自然语言查询集群状态</p>
          <button class="bp-btn" @click="$emit('navigate', 'chat')">开始对话</button>
        </div>
      </div>
    </section>

    <!-- ╭── Features ──╮ -->
    <section class="bp-section">
      <div class="bp-section-head">
        <div class="bp-section-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 2 7 12 12 22 7 12 2"/>
            <polyline points="2 17 12 22 22 17"/>
            <polyline points="2 12 12 17 22 12"/>
          </svg>
        </div>
        <h3 class="bp-section-title">核心功能</h3>
      </div>

      <div class="bp-features-grid">
        <div class="bp-feature-card">
          <div class="bp-feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
          </div>
          <h4 class="bp-feature-title">智能对话</h4>
          <p class="bp-feature-desc">通过自然语言与 AI 交互，查询集群状态、分析日志、排查问题</p>
          <div class="bp-examples">
            <span class="bp-tag">"查一下 HDFS 磁盘使用情况"</span>
            <span class="bp-tag">"列出失败的 YARN 应用"</span>
            <span class="bp-tag">"Spark 任务为什么运行慢"</span>
          </div>
        </div>
        <div class="bp-feature-card">
          <div class="bp-feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="4"/>
              <circle cx="12" cy="10" r="3"/>
              <path d="M8 16c0-2 4-2 4-2s4 0 4 2"/>
            </svg>
          </div>
          <h4 class="bp-feature-title">智能体管理</h4>
          <p class="bp-feature-desc">创建专属运维智能体，配置特定技能，实现专业化运维</p>
        </div>
        <div class="bp-feature-card">
          <div class="bp-feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2"/>
              <polyline points="2 17 12 22 22 17"/>
              <polyline points="2 12 12 17 22 12"/>
            </svg>
          </div>
          <h4 class="bp-feature-title">Skills 模式</h4>
          <p class="bp-feature-desc">AI 智能路由，自动识别意图并调用相应技能</p>
        </div>
        <div class="bp-feature-card">
          <div class="bp-feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
            </svg>
          </div>
          <h4 class="bp-feature-title">MCP 模式</h4>
          <p class="bp-feature-desc">直接调用 MCP 工具，绕过 AI 路由，响应更快</p>
        </div>
        <div class="bp-feature-card">
          <div class="bp-feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 9h18M9 21V9"/>
            </svg>
          </div>
          <h4 class="bp-feature-title">集群仪表板</h4>
          <p class="bp-feature-desc">可视化展示 HDFS/YARN/Spark 集群状态</p>
        </div>
        <div class="bp-feature-card">
          <div class="bp-feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
          </div>
          <h4 class="bp-feature-title">多集群管理</h4>
          <p class="bp-feature-desc">支持配置多套集群，灵活切换管理</p>
        </div>
      </div>
    </section>

    <!-- ╭── Query Types ──╮ -->
    <section class="bp-section">
      <div class="bp-section-head">
        <div class="bp-section-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
        <h3 class="bp-section-title">支持的查询类型</h3>
      </div>

      <div class="bp-query-grid">
        <div class="bp-query-card bp-query-hdfs">
          <div class="bp-query-head">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 3v18h18"/>
              <path d="M18 17V9"/>
              <path d="M13 17V5"/>
              <path d="M8 17v-3"/>
            </svg>
            <span class="bp-query-name">HDFS 查询</span>
          </div>
          <ul class="bp-query-list">
            <li><span class="bp-list-k">01</span>集群状态与健康检查</li>
            <li><span class="bp-list-k">02</span>磁盘使用情况</li>
            <li><span class="bp-list-k">03</span>文件目录列表</li>
            <li><span class="bp-list-k">04</span>文件内容统计</li>
            <li><span class="bp-list-k">05</span>DataNode 状态</li>
          </ul>
        </div>
        <div class="bp-query-card bp-query-yarn">
          <div class="bp-query-head">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="4" y="4" width="16" height="16" rx="2"/>
              <rect x="9" y="9" width="6" height="6"/>
            </svg>
            <span class="bp-query-name">YARN 查询</span>
          </div>
          <ul class="bp-query-list">
            <li><span class="bp-list-k">01</span>集群资源使用情况</li>
            <li><span class="bp-list-k">02</span>运行中的应用列表</li>
            <li><span class="bp-list-k">03</span>应用详情与日志</li>
            <li><span class="bp-list-k">04</span>队列资源分配</li>
            <li><span class="bp-list-k">05</span>NodeManager 状态</li>
          </ul>
        </div>
        <div class="bp-query-card bp-query-spark">
          <div class="bp-query-head">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            <span class="bp-query-name">Spark 查询</span>
          </div>
          <ul class="bp-query-list">
            <li><span class="bp-list-k">01</span>应用列表与状态</li>
            <li><span class="bp-list-k">02</span>任务执行详情</li>
            <li><span class="bp-list-k">03</span>Executor 内存使用</li>
            <li><span class="bp-list-k">04</span>Stage/Task 进度</li>
            <li><span class="bp-list-k">05</span>SQL 执行计划</li>
          </ul>
        </div>
        <div class="bp-query-card bp-query-ambari">
          <div class="bp-query-head">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
            </svg>
            <span class="bp-query-name">Ambari 管理</span>
          </div>
          <ul class="bp-query-list">
            <li><span class="bp-list-k">01</span>服务状态查询</li>
            <li><span class="bp-list-k">02</span>服务启停操作</li>
            <li><span class="bp-list-k">03</span>配置参数查看</li>
            <li><span class="bp-list-k">04</span>告警信息列表</li>
            <li><span class="bp-list-k">05</span>主机状态监控</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- ╭── Shortcuts ──╮ -->
    <section class="bp-section">
      <div class="bp-section-head">
        <div class="bp-section-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <path d="M6 8h.001M10 8h.001M14 8h.001M18 8h.001M8 12h.001M12 12h.001M16 12h.001"/>
          </svg>
        </div>
        <h3 class="bp-section-title">快捷指令</h3>
      </div>

      <div class="bp-shortcuts-table">
        <div class="bp-shortcut-row bp-head">
          <span class="bp-shortcut-k">KEY</span>
          <span class="bp-shortcut-v">说明 · DESC</span>
        </div>
        <div class="bp-shortcut-row">
          <span class="bp-shortcut-k"><kbd>Ctrl + Enter</kbd></span>
          <span class="bp-shortcut-v">发送消息</span>
        </div>
        <div class="bp-shortcut-row">
          <span class="bp-shortcut-k"><kbd>Ctrl + K</kbd></span>
          <span class="bp-shortcut-v">聚焦搜索框（待实现）</span>
        </div>
        <div class="bp-shortcut-row">
          <span class="bp-shortcut-k"><kbd>Ctrl + /</kbd></span>
          <span class="bp-shortcut-v">打开使用说明</span>
        </div>
      </div>
    </section>

    <!-- ╭── FAQ ──╮ -->
    <section class="bp-section">
      <div class="bp-section-head">
        <div class="bp-section-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <h3 class="bp-section-title">常见问题</h3>
      </div>

      <div class="bp-faq-list">
        <div :class="['bp-faq-item', { expanded: expandedFaq === 1 }]" @click="expandedFaq = expandedFaq === 1 ? 0 : 1">
          <div class="bp-faq-q">
            <span>Skills 模式和 MCP 模式有什么区别？</span>
            <span class="bp-faq-toggle">{{ expandedFaq === 1 ? '−' : '+' }}</span>
          </div>
          <div class="bp-faq-a" v-if="expandedFaq === 1">
            <p><strong>Skills 模式：</strong>通过 AI 理解自然语言，智能识别用户意图，自动选择合适的技能执行。适合模糊查询和复杂场景。</p>
            <p><strong>MCP 模式：</strong>直接调用 MCP 工具 API，不经过 AI 路由。响应更快，适合明确知道要查询什么的情况。</p>
          </div>
        </div>
        <div :class="['bp-faq-item', { expanded: expandedFaq === 2 }]" @click="expandedFaq = expandedFaq === 2 ? 0 : 2">
          <div class="bp-faq-q">
            <span>如何配置多套集群？</span>
            <span class="bp-faq-toggle">{{ expandedFaq === 2 ? '−' : '+' }}</span>
          </div>
          <div class="bp-faq-a" v-if="expandedFaq === 2">
            <p>在「集群配置」页面，点击「添加集群」按钮，填写集群名称和各服务地址即可。支持配置生产、测试、开发等多套环境。</p>
          </div>
        </div>
        <div :class="['bp-faq-item', { expanded: expandedFaq === 3 }]" @click="expandedFaq = expandedFaq === 3 ? 0 : 3">
          <div class="bp-faq-q">
            <span>AI 模型如何配置？</span>
            <span class="bp-faq-toggle">{{ expandedFaq === 3 ? '−' : '+' }}</span>
          </div>
          <div class="bp-faq-a" v-if="expandedFaq === 3">
            <p>在「集群配置」页面底部的「AI 模型配置」区域，点击「添加模型」按钮，配置模型名称、API 地址和 Key。平台支持多种兼容 OpenAI 接口的模型。</p>
          </div>
        </div>
        <div :class="['bp-faq-item', { expanded: expandedFaq === 4 }]" @click="expandedFaq = expandedFaq === 4 ? 0 : 4">
          <div class="bp-faq-q">
            <span>数据安全如何保障？</span>
            <span class="bp-faq-toggle">{{ expandedFaq === 4 ? '−' : '+' }}</span>
          </div>
          <div class="bp-faq-a" v-if="expandedFaq === 4">
            <p>平台采用本地部署，所有数据在您的内网环境中传输。API Key 等敏感信息加密存储，不会上传到外部服务器。</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ╭── Version ──╮ -->
    <footer class="bp-version">
      <span class="bp-version-code">VERSION_1.0.0</span>
      <span class="bp-version-text">大数据运维 Agent · Powered by AI</span>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineEmits(['navigate'])
const expandedFaq = ref(0)
</script>

<style scoped>
.bp-guide {
  width: 100%;
  max-width: 1000px;
  animation: bp-fade 0.4s ease-out;
}

/* page-head base inherited from global blueprint.css */

.bp-card-tick-tl, .bp-card-tick-tr, .bp-card-tick-bl, .bp-card-tick-br {
  position: absolute;
  width: 8px;
  height: 8px;
  border: 1px solid rgba(92, 228, 255, 0.3);
  pointer-events: none;
}

.bp-card-tick-tl { top: -1px; left: -1px; border-right: none; border-bottom: none; }
.bp-card-tick-tr { top: -1px; right: -1px; border-left: none; border-bottom: none; }
.bp-card-tick-bl { bottom: -1px; left: -1px; border-right: none; border-top: none; }
.bp-card-tick-br { bottom: -1px; right: -1px; border-left: none; border-top: none; }

/* ╭── Section ──╮ */
.bp-section {
  padding: 24px;
  background: rgba(14, 29, 49, 0.6);
  border: 1px solid rgba(92, 228, 255, 0.2);
  margin-bottom: 20px;
}

.bp-section-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px dashed rgba(92, 228, 255, 0.15);
}

.bp-section-icon {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(92, 228, 255, 0.15);
  background: rgba(92, 228, 255, 0.06);
  color: var(--bp-blueprint);
}

.bp-section-icon svg {
  width: 18px;
  height: 18px;
}

.bp-section-title {
  font-family: var(--bp-fnt-mono);
  font-size: 14px;
  font-weight: 700;
  color: var(--bp-chalk);
  letter-spacing: 0.06em;
}

/* ╭── Steps Grid ──╮ */
.bp-steps-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.bp-step-card {
  position: relative;
  padding: 24px;
  background: rgba(14, 29, 49, 0.45);
  border: 1px solid rgba(92, 228, 255, 0.15);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.bp-step-num {
  font-family: var(--bp-fnt-mono);
  font-size: 28px;
  font-weight: 900;
  color: var(--bp-blueprint);
  opacity: 0.3;
}

.bp-step-title {
  font-family: var(--bp-fnt-mono);
  font-size: 14px;
  font-weight: 700;
  color: var(--bp-chalk);
}

.bp-step-desc {
  font-family: 'Hanken Grotesk', 'PingFang SC', sans-serif;
  font-size: 13px;
  color: var(--bp-chalk-dim);
  text-align: center;
  line-height: 1.5;
}

/* ╭── Features Grid ──╮ */
.bp-features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.bp-feature-card {
  padding: 20px;
  background: rgba(14, 29, 49, 0.45);
  border: 1px solid rgba(92, 228, 255, 0.15);
}

.bp-feature-icon {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(92, 228, 255, 0.15);
  background: rgba(92, 228, 255, 0.06);
  color: var(--bp-blueprint);
  margin-bottom: 12px;
}

.bp-feature-icon svg {
  width: 24px;
  height: 24px;
}

.bp-feature-title {
  font-family: var(--bp-fnt-mono);
  font-size: 14px;
  font-weight: 700;
  color: var(--bp-chalk);
  margin-bottom: 8px;
}

.bp-feature-desc {
  font-family: 'Hanken Grotesk', 'PingFang SC', sans-serif;
  font-size: 13px;
  color: var(--bp-chalk-dim);
  line-height: 1.5;
}

.bp-examples {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}

.bp-tag {
  font-family: var(--bp-fnt-mono);
  font-size: 11px;
  padding: 4px 8px;
  background: rgba(92, 228, 255, 0.1);
  border: 1px solid rgba(92, 228, 255, 0.15);
  color: var(--bp-chalk-dim);
}

/* ╭── Query Grid ──╮ */
.bp-query-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.bp-query-card {
  padding: 20px;
  background: rgba(14, 29, 49, 0.45);
  border: 1px solid rgba(92, 228, 255, 0.15);
  border-left: 3px solid var(--bp-blueprint);
}

.bp-query-hdfs { border-left-color: var(--bp-blueprint); }
.bp-query-yarn { border-left-color: var(--bp-amber); }
.bp-query-spark { border-left-color: #fbbf24; }
.bp-query-ambari { border-left-color: var(--bp-green-check); }

.bp-query-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px dashed rgba(92, 228, 255, 0.15);
}

.bp-query-head svg {
  width: 20px;
  height: 20px;
  color: inherit;
}

.bp-query-hdfs .bp-query-head svg { color: var(--bp-blueprint); }
.bp-query-yarn .bp-query-head svg { color: var(--bp-amber); }
.bp-query-spark .bp-query-head svg { color: #fbbf24; }
.bp-query-ambari .bp-query-head svg { color: var(--bp-green-check); }

.bp-query-name {
  font-family: var(--bp-fnt-mono);
  font-size: 14px;
  font-weight: 700;
  color: var(--bp-chalk);
}

.bp-query-list {
  list-style: none;
  padding: 0;
}

.bp-query-list li {
  display: flex;
  gap: 8px;
  padding: 6px 0;
  font-family: 'Hanken Grotesk', 'PingFang SC', sans-serif;
  font-size: 13px;
  color: var(--bp-chalk);
}

.bp-list-k {
  font-family: var(--bp-fnt-mono);
  font-size: 10px;
  color: var(--bp-amber);
  opacity: 0.6;
}

/* ╭── Shortcuts Table ──╮ */
.bp-shortcuts-table {
  border: 1px solid rgba(92, 228, 255, 0.15);
}

.bp-shortcut-row {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(92, 228, 255, 0.08);
}

.bp-shortcut-row:last-child { border-bottom: none; }

.bp-shortcut-row.bp-head {
  background: rgba(92, 228, 255, 0.06);
  font-family: var(--bp-fnt-mono);
  font-size: 10px;
  color: var(--bp-chalk-dim);
  letter-spacing: 0.1em;
}

.bp-shortcut-k {
  width: 160px;
  flex-shrink: 0;
}

.bp-shortcut-k kbd {
  padding: 4px 10px;
  background: rgba(92, 228, 255, 0.1);
  border: 1px solid rgba(92, 228, 255, 0.2);
  font-family: var(--bp-fnt-mono);
  font-size: 12px;
  color: var(--bp-chalk);
}

.bp-shortcut-v {
  font-family: 'Hanken Grotesk', 'PingFang SC', sans-serif;
  font-size: 13px;
  color: var(--bp-chalk);
}

/* ╭── FAQ ──╮ */
.bp-faq-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bp-faq-item {
  padding: 16px 20px;
  background: rgba(14, 29, 49, 0.45);
  border: 1px solid rgba(92, 228, 255, 0.15);
  cursor: pointer;
}

.bp-faq-item.expanded {
  border-color: var(--bp-blueprint);
  background: rgba(92, 228, 255, 0.1);
}

.bp-faq-q {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: var(--bp-fnt-mono);
  font-size: 13px;
  color: var(--bp-chalk);
}

.bp-faq-toggle {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  background: rgba(92, 228, 255, 0.1);
  border: 1px solid rgba(92, 228, 255, 0.2);
  font-size: 18px;
  color: var(--bp-blueprint);
}

.bp-faq-a {
  padding-top: 16px;
  font-family: 'Hanken Grotesk', 'PingFang SC', sans-serif;
  font-size: 13px;
  color: var(--bp-chalk-dim);
  line-height: 1.7;
}

.bp-faq-a p { margin-bottom: 8px; }
.bp-faq-a p:last-child { margin-bottom: 0; }
.bp-faq-a strong { color: var(--bp-blueprint); }

/* ╭── Version ──╮ */
.bp-version {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 24px;
  background: rgba(14, 29, 49, 0.4);
  border: 1px solid rgba(92, 228, 255, 0.1);
}

.bp-version-code {
  font-family: var(--bp-fnt-mono);
  font-size: 11px;
  color: var(--bp-blueprint);
  letter-spacing: 0.14em;
  opacity: 0.6;
}

.bp-version-text {
  font-family: 'Hanken Grotesk', 'PingFang SC', sans-serif;
  font-size: 13px;
  color: var(--bp-chalk-dim);
}

/* ╭── Animations ──╮ */
@keyframes bp-fade { from { opacity: 0; } to { opacity: 1; } }

/* ╭── Responsive ──╮ */
@media (max-width: 768px) {
  .bp-steps-grid, .bp-features-grid, .bp-query-grid { grid-template-columns: 1fr; }
}
</style>