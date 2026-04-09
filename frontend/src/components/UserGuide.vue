<template>
  <div class="guide-container">
    <!-- 欢迎区域 -->
    <div class="welcome-section glass-card fade-in-up">
      <div class="welcome-content">
        <div class="welcome-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M12 2v4m0 12v4M2 12h4m12 0h4"></path>
            <path d="M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"></path>
          </svg>
        </div>
        <div class="welcome-text">
          <h2>欢迎使用大数据运维平台</h2>
          <p>智能化的 Hadoop/Spark/YARN 集群运维助手，让大数据运维更简单高效</p>
        </div>
      </div>
    </div>

    <!-- 快速开始 -->
    <div class="section glass-card fade-in-up delay-1">
      <div class="section-header">
        <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
        <h3>快速开始</h3>
      </div>
      <div class="steps-grid">
        <div class="step-card">
          <div class="step-number">1</div>
          <h4>配置集群</h4>
          <p>在「集群配置」页面添加您的 Hadoop/Spark/YARN 集群地址</p>
          <el-button size="small" @click="$emit('navigate', 'config')">前往配置</el-button>
        </div>
        <div class="step-card">
          <div class="step-number">2</div>
          <h4>创建智能体</h4>
          <p>在「智能体管理」创建运维智能体并分配技能</p>
          <el-button size="small" @click="$emit('navigate', 'agents')">前往创建</el-button>
        </div>
        <div class="step-card">
          <div class="step-number">3</div>
          <h4>开始对话</h4>
          <p>选择智能体，通过自然语言查询集群状态</p>
          <el-button size="small" @click="$emit('navigate', 'chat')">开始对话</el-button>
        </div>
      </div>
    </div>

    <!-- 功能介绍 -->
    <div class="section glass-card fade-in-up delay-2">
      <div class="section-header">
        <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
          <polyline points="2 17 12 22 22 17"></polyline>
          <polyline points="2 12 12 17 22 12"></polyline>
        </svg>
        <h3>核心功能</h3>
      </div>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <h4>智能对话</h4>
          <p>通过自然语言与 AI 交互，查询集群状态、分析日志、排查问题</p>
          <div class="feature-examples">
            <span class="example-tag">"查一下 HDFS 磁盘使用情况"</span>
            <span class="example-tag">"列出失败的 YARN 应用"</span>
            <span class="example-tag">"Spark 任务为什么运行慢"</span>
          </div>
        </div>
        <div class="feature-card">
          <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="4"></rect>
              <circle cx="12" cy="10" r="3"></circle>
              <path d="M8 16c0-2 4-2 4-2s4 0 4 2"></path>
            </svg>
          </div>
          <h4>智能体管理</h4>
          <p>创建专属运维智能体，配置特定技能，实现专业化运维</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
          </div>
          <h4>Skills 模式</h4>
          <p>AI 智能路由，自动识别意图并调用相应技能</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
          </div>
          <h4>MCP 模式</h4>
          <p>直接调用 MCP 工具，绕过 AI 路由，响应更快</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2"></rect>
              <path d="M3 9h18M9 21V9"></path>
            </svg>
          </div>
          <h4>集群仪表板</h4>
          <p>可视化展示 HDFS/YARN/Spark 集群状态</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path>
            </svg>
          </div>
          <h4>多集群管理</h4>
          <p>支持配置多套集群，灵活切换管理</p>
        </div>
      </div>
    </div>

    <!-- 支持的查询 -->
    <div class="section glass-card fade-in-up delay-3">
      <div class="section-header">
        <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <h3>支持的查询类型</h3>
      </div>
      <div class="query-types">
        <div class="query-type">
          <div class="type-header">
            <svg class="type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 3v18h18"></path>
              <path d="M18 17V9"></path>
              <path d="M13 17V5"></path>
              <path d="M8 17v-3"></path>
            </svg>
            <span class="type-name">HDFS 查询</span>
          </div>
          <ul class="type-list">
            <li>集群状态与健康检查</li>
            <li>磁盘使用情况</li>
            <li>文件目录列表</li>
            <li>文件内容统计</li>
            <li>DataNode 状态</li>
          </ul>
        </div>
        <div class="query-type">
          <div class="type-header">
            <svg class="type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="4" y="4" width="16" height="16" rx="2"></rect>
              <rect x="9" y="9" width="6" height="6"></rect>
            </svg>
            <span class="type-name">YARN 查询</span>
          </div>
          <ul class="type-list">
            <li>集群资源使用情况</li>
            <li>运行中的应用列表</li>
            <li>应用详情与日志</li>
            <li>队列资源分配</li>
            <li>NodeManager 状态</li>
          </ul>
        </div>
        <div class="query-type">
          <div class="type-header">
            <svg class="type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
            <span class="type-name">Spark 查询</span>
          </div>
          <ul class="type-list">
            <li>应用列表与状态</li>
            <li>任务执行详情</li>
            <li>Executor 内存使用</li>
            <li>Stage/Task 进度</li>
            <li>SQL 执行计划</li>
          </ul>
        </div>
        <div class="query-type">
          <div class="type-header">
            <svg class="type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
            </svg>
            <span class="type-name">Ambari 管理</span>
          </div>
          <ul class="type-list">
            <li>服务状态查询</li>
            <li>服务启停操作</li>
            <li>配置参数查看</li>
            <li>告警信息列表</li>
            <li>主机状态监控</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 快捷指令 -->
    <div class="section glass-card fade-in-up delay-4">
      <div class="section-header">
        <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="2" y="4" width="20" height="16" rx="2"></rect>
          <path d="M6 8h.001M10 8h.001M14 8h.001M18 8h.001M8 12h.001M12 12h.001M16 12h.001"></path>
        </svg>
        <h3>快捷指令</h3>
      </div>
      <div class="shortcuts-table">
        <div class="shortcut-row header">
          <span class="shortcut-key">指令</span>
          <span class="shortcut-desc">说明</span>
        </div>
        <div class="shortcut-row">
          <span class="shortcut-key"><kbd>Ctrl + Enter</kbd></span>
          <span class="shortcut-desc">发送消息</span>
        </div>
        <div class="shortcut-row">
          <span class="shortcut-key"><kbd>Ctrl + K</kbd></span>
          <span class="shortcut-desc">聚焦搜索框（待实现）</span>
        </div>
        <div class="shortcut-row">
          <span class="shortcut-key"><kbd>Ctrl + /</kbd></span>
          <span class="shortcut-desc">打开使用说明</span>
        </div>
      </div>
    </div>

    <!-- FAQ -->
    <div class="section glass-card fade-in-up delay-5">
      <div class="section-header">
        <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <h3>常见问题</h3>
      </div>
      <div class="faq-list">
        <div class="faq-item" :class="{ expanded: expandedFaq === 1 }" @click="expandedFaq = expandedFaq === 1 ? 0 : 1">
          <div class="faq-question">
            <span>Skills 模式和 MCP 模式有什么区别？</span>
            <span class="faq-toggle">{{ expandedFaq === 1 ? '−' : '+' }}</span>
          </div>
          <div class="faq-answer" v-if="expandedFaq === 1">
            <p><strong>Skills 模式：</strong>通过 AI 理解自然语言，智能识别用户意图，自动选择合适的技能执行。适合模糊查询和复杂场景。</p>
            <p><strong>MCP 模式：</strong>直接调用 MCP 工具 API，不经过 AI 路由。响应更快，适合明确知道要查询什么的情况。</p>
          </div>
        </div>
        <div class="faq-item" :class="{ expanded: expandedFaq === 2 }" @click="expandedFaq = expandedFaq === 2 ? 0 : 2">
          <div class="faq-question">
            <span>如何配置多套集群？</span>
            <span class="faq-toggle">{{ expandedFaq === 2 ? '−' : '+' }}</span>
          </div>
          <div class="faq-answer" v-if="expandedFaq === 2">
            <p>在「集群配置」页面，点击「添加集群」按钮，填写集群名称和各服务地址即可。支持配置生产、测试、开发等多套环境。</p>
          </div>
        </div>
        <div class="faq-item" :class="{ expanded: expandedFaq === 3 }" @click="expandedFaq = expandedFaq === 3 ? 0 : 3">
          <div class="faq-question">
            <span>AI 模型如何配置？</span>
            <span class="faq-toggle">{{ expandedFaq === 3 ? '−' : '+' }}</span>
          </div>
          <div class="faq-answer" v-if="expandedFaq === 3">
            <p>在「集群配置」页面底部的「AI 模型配置」区域，点击「添加模型」按钮，配置模型名称、API 地址和 Key。平台支持多种兼容 OpenAI 接口的模型。</p>
          </div>
        </div>
        <div class="faq-item" :class="{ expanded: expandedFaq === 4 }" @click="expandedFaq = expandedFaq === 4 ? 0 : 4">
          <div class="faq-question">
            <span>数据安全如何保障？</span>
            <span class="faq-toggle">{{ expandedFaq === 4 ? '−' : '+' }}</span>
          </div>
          <div class="faq-answer" v-if="expandedFaq === 4">
            <p>平台采用本地部署，所有数据在您的内网环境中传输。API Key 等敏感信息加密存储，不会上传到外部服务器。</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 版本信息 -->
    <div class="version-info fade-in-up delay-5">
      <p>大数据运维 Agent v1.0.0</p>
      <p>Powered by AI</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['navigate'])
const expandedFaq = ref(0)
</script>

<style scoped>
.guide-container {
  max-width: 1000px;
  padding-bottom: 40px;
}

/* 欢迎区域 */
.welcome-section {
  padding: 32px;
  margin-bottom: 24px;
}

.welcome-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.welcome-icon {
  width: 72px;
  height: 72px;
  background: var(--gradient-primary);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
}
.welcome-icon svg {
  width: 40px;
  height: 40px;
  color: white;
}

.welcome-text h2 {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.welcome-text p {
  font-size: 16px;
  color: var(--text-muted);
}

/* 区块 */
.section {
  padding: 28px;
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.section-icon {
  width: 28px;
  height: 28px;
  color: var(--accent);
}

.section-header h3 {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

/* 步骤 */
.steps-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.step-card {
  background: rgba(59, 130, 246, 0.05);
  border: 1px solid rgba(59, 130, 246, 0.15);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
}

.step-number {
  width: 40px;
  height: 40px;
  background: var(--gradient-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 18px;
  margin: 0 auto 16px;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.step-card h4 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.step-card p {
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 16px;
  line-height: 1.5;
}

/* 功能网格 */
.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.feature-card {
  background: var(--bg-hover);
  border: 1px solid rgba(99, 102, 241, 0.1);
  border-radius: 14px;
  padding: 20px;
  transition: all 0.2s ease;
}
.feature-card:hover {
  border-color: var(--accent);
  transform: translateY(-2px);
}

.feature-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}
.feature-icon svg {
  width: 24px;
  height: 24px;
}

/* 不同功能不同颜色 */
.feature-card:nth-child(1) .feature-icon { background: rgba(99, 102, 241, 0.15); }
.feature-card:nth-child(1) .feature-icon svg { color: var(--accent); }
.feature-card:nth-child(2) .feature-icon { background: rgba(139, 92, 246, 0.15); }
.feature-card:nth-child(2) .feature-icon svg { color: var(--purple); }
.feature-card:nth-child(3) .feature-icon { background: rgba(6, 182, 212, 0.15); }
.feature-card:nth-child(3) .feature-icon svg { color: var(--info); }
.feature-card:nth-child(4) .feature-icon { background: rgba(245, 158, 11, 0.15); }
.feature-card:nth-child(4) .feature-icon svg { color: var(--warning); }
.feature-card:nth-child(5) .feature-icon { background: rgba(16, 185, 129, 0.15); }
.feature-card:nth-child(5) .feature-icon svg { color: var(--success); }
.feature-card:nth-child(6) .feature-icon { background: rgba(239, 68, 68, 0.15); }
.feature-card:nth-child(6) .feature-icon svg { color: var(--danger); }

.feature-card h4 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.feature-card p {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.5;
}

.feature-examples {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}

.example-tag {
  font-size: 11px;
  padding: 4px 8px;
  background: rgba(59, 130, 246, 0.15);
  border-radius: 6px;
  color: var(--accent);
}

/* 查询类型 */
.query-types {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.query-type {
  background: var(--bg-hover);
  border: 1px solid rgba(99, 102, 241, 0.1);
  border-radius: 14px;
  padding: 20px;
  transition: all 0.2s ease;
}
.query-type:hover {
  border-color: var(--accent);
}

/* 不同查询类型不同边框颜色 */
.query-type:nth-child(1) { border-left: 3px solid #f97316; }
.query-type:nth-child(2) { border-left: 3px solid #8b5cf6; }
.query-type:nth-child(3) { border-left: 3px solid #06b6d4; }
.query-type:nth-child(4) { border-left: 3px solid #10b981; }

.type-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: var(--border-light);
}

.type-icon {
  width: 24px;
  height: 24px;
}
.query-type:nth-child(1) .type-icon { color: #f97316; }
.query-type:nth-child(2) .type-icon { color: #8b5cf6; }
.query-type:nth-child(3) .type-icon { color: #06b6d4; }
.query-type:nth-child(4) .type-icon { color: #10b981; }

.type-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.type-list {
  list-style: none;
  padding: 0;
}

.type-list li {
  padding: 6px 0;
  font-size: 14px;
  color: var(--text-secondary);
  position: relative;
  padding-left: 16px;
}

.type-list li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: var(--accent);
}

/* 快捷指令 */
.shortcuts-table {
  background: var(--bg-hover);
  border-radius: 12px;
  overflow: hidden;
}

.shortcut-row {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(59, 130, 246, 0.08);
}

.shortcut-row:last-child {
  border-bottom: none;
}

.shortcut-row.header {
  background: rgba(59, 130, 246, 0.05);
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 13px;
}

.shortcut-key {
  width: 160px;
  flex-shrink: 0;
}

.shortcut-key kbd {
  background: rgba(59, 130, 246, 0.15);
  padding: 4px 10px;
  border-radius: 6px;
  font-family: monospace;
  font-size: 13px;
  color: var(--accent);
}

.shortcut-desc {
  color: var(--text-secondary);
  font-size: 14px;
}

/* FAQ */
.faq-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.faq-item {
  background: var(--bg-hover);
  border: 1px solid rgba(59, 130, 246, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.faq-item:hover {
  border-color: rgba(34, 197, 94, 0.2);
}

.faq-item.expanded {
  border-color: rgba(59, 130, 246, 0.3);
  background: rgba(59, 130, 246, 0.05);
}

.faq-question {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  font-weight: 500;
  color: var(--text-primary);
}

.faq-toggle {
  width: 24px;
  height: 24px;
  background: rgba(59, 130, 246, 0.15);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: var(--accent);
}

.faq-answer {
  padding: 0 20px 20px;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.7;
}

.faq-answer p {
  margin-bottom: 8px;
}

.faq-answer p:last-child {
  margin-bottom: 0;
}

/* 版本信息 */
.version-info {
  text-align: center;
  padding: 24px;
  color: var(--text-muted);
  font-size: 13px;
}

.version-info p {
  margin-bottom: 4px;
}

/* 响应式 */
@media (max-width: 768px) {
  .steps-grid,
  .features-grid,
  .query-types {
    grid-template-columns: 1fr;
  }

  .welcome-content {
    flex-direction: column;
    text-align: center;
  }
}
</style>