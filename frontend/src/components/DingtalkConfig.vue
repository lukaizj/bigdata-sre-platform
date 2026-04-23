<template>
  <div class="bp-dingtalk">
    <!-- ╭── Page Header · LoginPage title block ──╮ -->
    <header class="bp-page-head">
      <aside class="bp-margin-ruler">
        <span class="bp-margin-tick" v-for="n in ['01','02','03','04','05']" :key="n">
          <em>{{ n }}</em><i></i>
        </span>
      </aside>

      <div class="bp-page-head-body">
        <div class="bp-title-block">
          <span class="bp-eyebrow">
            <i class="bp-eyebrow-bar"></i>
            <span>DINGTALK BRIDGE</span>
          </span>

          <h1 class="bp-display-title">
            <span class="bp-t-main">钉钉</span>
            <span class="bp-t-accent">BRIDGE</span>
            <span class="bp-t-mute">/ MESSAGE HUB</span>
          </h1>

          <div class="bp-dim">
            <span class="bp-dim-arrow">◂</span>
            <span class="bp-dim-line"></span>
            <span class="bp-dim-num">{{ statusLabel || 'STANDBY' }}</span>
            <span class="bp-dim-line"></span>
            <span class="bp-dim-arrow">▸</span>
          </div>

          <p class="bp-sub">配置钉钉机器人消息通道 — 将 AI 智能体响应桥接到企业群组，运维事件实时推送。</p>

          <div class="bp-callouts">
            <span class="bp-callout"><em>A</em><span>CONNECTION</span></span>
            <span class="bp-callout is-amber"><em>B</em><span>AGENT MAPPING</span></span>
            <span class="bp-callout is-green"><em>C</em><span>LIVE MESSAGES</span></span>
          </div>

          <!-- Handwritten annotation -->
          <div class="bp-note">
            <svg class="bp-note-arrow" viewBox="0 0 80 40" aria-hidden="true">
              <path d="M 2 38 Q 25 30, 40 18 T 76 4" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="2 3"/>
              <path d="M 72 2 L 76 4 L 74 8" fill="none" stroke="currentColor" stroke-width="1.2"/>
            </svg>
            <span class="bp-note-text">keep AppKey/Secret safe —</span>
          </div>
        </div>

        <!-- Revision stamp -->
        <div class="bp-stamp">
          <div class="bp-stamp-inner is-blue">
            <span class="bp-stamp-check">●</span>
            <div class="bp-stamp-text">
              <strong>{{ connectionStatus === 'connected' ? 'ONLINE' : 'OFFLINE' }}</strong>
              <small>BRIDGE · REV.02</small>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- ╭── Status Panel ──╮ -->
    <section class="bp-status-panel">
      <div class="bp-panel-head">
        <span class="bp-panel-title">服务状态</span>
        <button class="bp-btn" @click="refreshStatus" :disabled="refreshing">
          {{ refreshing ? '刷新中...' : '刷新' }}
        </button>
      </div>

      <div class="bp-status-grid">
        <div class="bp-stat-box">
          <span class="bp-stat-k">01 连接</span>
          <span :class="['bp-stat-v', connectionStatus]">{{ statusLabel }}</span>
        </div>
        <div class="bp-stat-box">
          <span class="bp-stat-k">02 消息</span>
          <span class="bp-stat-v">{{ messageCount }}</span>
        </div>
        <div class="bp-stat-box">
          <span class="bp-stat-k">03 智能体</span>
          <span class="bp-stat-v">{{ currentAgentName || '未配置' }}</span>
        </div>
      </div>
    </section>

    <!-- ╭── Config Panel ──╮ -->
    <section class="bp-config-panel">
      <div class="bp-panel-head">
        <span class="bp-panel-title">基础配置</span>
        <button class="bp-btn-primary" @click="saveConfig" :disabled="saving">
          <span>{{ saving ? '保存中...' : '保存配置' }}</span>
          <span class="bp-btn-arrow">▸</span>
        </button>
      </div>

      <div class="bp-form">
        <div class="bp-field">
          <label class="bp-label">
            <span class="bp-label-k">01</span>
            <span class="bp-label-v">Client ID · ID</span>
          </label>
          <div class="bp-input-wrap">
            <input v-model="config.clientId" type="text" placeholder="钉钉应用的 Client ID" class="bp-input" />
          </div>
        </div>

        <div class="bp-field">
          <label class="bp-label">
            <span class="bp-label-k">02</span>
            <span class="bp-label-v">Client Secret · SECRET</span>
          </label>
          <div class="bp-input-wrap">
            <input v-model="config.clientSecret" type="password" placeholder="钉钉应用的 Client Secret" class="bp-input" />
          </div>
        </div>

        <div class="bp-field">
          <label class="bp-label">
            <span class="bp-label-k">03</span>
            <span class="bp-label-v">默认智能体 · AGENT</span>
          </label>
          <el-select v-model="config.defaultAgentId" placeholder="选择默认智能体" style="width: 100%" class="bp-select">
            <el-option v-for="agent in agents" :key="agent.id" :label="agent.name" :value="agent.id" />
          </el-select>
        </div>

        <div class="bp-field">
          <label class="bp-label">
            <span class="bp-label-k">04</span>
            <span class="bp-label-v">启用状态 · ENABLED</span>
          </label>
          <div class="bp-switch-wrap">
            <el-switch v-model="config.enabled" />
            <span class="bp-switch-label">{{ config.enabled ? '已启用' : '已禁用' }}</span>
          </div>
        </div>

        <div class="bp-test-row">
          <button class="bp-btn" @click="testConnection" :disabled="testing">
            {{ testing ? '测试中...' : '测试连接' }}
          </button>
          <span v-if="testResult" :class="['bp-test-result', testResult.success ? 'success' : 'error']">
            {{ testResult.success ? '✓' : '✗' }} {{ testResult.message }}
          </span>
        </div>
      </div>
    </section>

    <!-- ╭── Agent Mapping Panel ──╮ -->
    <section class="bp-mapping-panel">
      <div class="bp-panel-head">
        <span class="bp-panel-title">智能体映射</span>
        <button class="bp-btn-primary" @click="showAddMappingDialog">
          <span>添加映射</span>
          <span class="bp-btn-arrow">▸</span>
        </button>
      </div>

      <p class="bp-mapping-desc">为不同的钉钉会话/群聊配置专属智能体，未配置的会话将使用默认智能体</p>

      <div v-if="mappings.length > 0" class="bp-mapping-list">
        <div v-for="mapping in mappings" :key="mapping.conversationId" class="bp-mapping-item">
          <span class="bp-card-tick-tl"></span>
          <span class="bp-card-tick-tr"></span>
          <span class="bp-card-tick-bl"></span>
          <span class="bp-card-tick-br"></span>

          <div class="bp-mapping-info">
            <div class="bp-mapping-row">
              <span class="bp-mapping-k">会话ID</span>
              <span class="bp-mapping-v">{{ mapping.conversationId }}</span>
            </div>
            <div class="bp-mapping-row">
              <span class="bp-mapping-k">智能体</span>
              <span class="bp-mapping-v">{{ mapping.agentName }}</span>
            </div>
          </div>
          <button class="bp-btn-danger" @click="deleteMapping(mapping.conversationId)">删除</button>
        </div>
      </div>
      <div v-else class="bp-empty">
        <span class="bp-empty-code">[ NO_MAPPING_FOUND ]</span>
        <span>暂无智能体映射</span>
      </div>
    </section>

    <!-- ╭── Guide Panel ──╮ -->
    <section class="bp-guide-panel">
      <div class="bp-panel-head">
        <span class="bp-panel-title">使用说明</span>
      </div>

      <div class="bp-guide-steps">
        <div class="bp-guide-step">
          <span class="bp-step-num">01</span>
          <div class="bp-step-content">
            <h5>创建钉钉机器人应用</h5>
            <p>在钉钉开放平台创建企业内部机器人应用，获取 Client ID 和 Client Secret</p>
          </div>
        </div>
        <div class="bp-guide-step">
          <span class="bp-step-num">02</span>
          <div class="bp-step-content">
            <h5>配置回调地址</h5>
            <p>在钉钉应用管理中设置回调地址：<code class="bp-code">/api/dingtalk/webhook</code></p>
          </div>
        </div>
        <div class="bp-guide-step">
          <span class="bp-step-num">03</span>
          <div class="bp-step-content">
            <h5>填写配置信息</h5>
            <p>将 Client ID 和 Client Secret 填入上方配置表单，选择默认智能体</p>
          </div>
        </div>
        <div class="bp-guide-step">
          <span class="bp-step-num">04</span>
          <div class="bp-step-content">
            <h5>开始对话</h5>
            <p>用户在钉钉群中 @机器人 发送消息：<code class="bp-code">@智能助手 你的问题</code></p>
          </div>
        </div>
      </div>
    </section>

    <!-- ╭── Add Mapping Dialog ──╮ -->
    <el-dialog v-model="addMappingDialogVisible" width="520px" class="bp-dialog">
      <template #header>
        <div class="bp-dialog-head">
          <span class="bp-dialog-k">CREATE</span>
          <span class="bp-dialog-v">添加智能体映射</span>
        </div>
      </template>

      <div class="bp-form">
        <div class="bp-field">
          <label class="bp-label">
            <span class="bp-label-k">01</span>
            <span class="bp-label-v">会话ID · CONVERSATION</span>
          </label>
          <div class="bp-input-wrap">
            <input v-model="newMapping.conversationId" type="text" placeholder="钉钉会话ID" class="bp-input" />
          </div>
          <span class="bp-field-hint">在钉钉群中 @机器人 发送消息后，系统会自动获取会话ID</span>
        </div>

        <div class="bp-field">
          <label class="bp-label">
            <span class="bp-label-k">02</span>
            <span class="bp-label-v">智能体 · AGENT</span>
          </label>
          <el-select v-model="newMapping.agentId" placeholder="选择智能体" style="width: 100%">
            <el-option v-for="agent in agents" :key="agent.id" :label="agent.name" :value="agent.id" />
          </el-select>
        </div>
      </div>

      <template #footer>
        <div class="bp-dialog-footer">
          <button class="bp-btn" @click="addMappingDialogVisible = false">取消</button>
          <button class="bp-btn-primary" @click="addMapping" :disabled="addingMapping">
            <span>{{ addingMapping ? '添加中...' : '确定' }}</span>
            <span class="bp-btn-arrow">▸</span>
          </button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

defineOptions({ name: 'DingtalkConfig' })

const CONNECTION_STATUS = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  UNKNOWN: 'unknown'
}

const statusLabels = {
  [CONNECTION_STATUS.CONNECTED]: '已连接',
  [CONNECTION_STATUS.DISCONNECTED]: '未连接',
  [CONNECTION_STATUS.UNKNOWN]: '未知'
}

const config = ref({
  clientId: '',
  clientSecret: '',
  defaultAgentId: '',
  enabled: false,
})

const agents = ref([])
const connectionStatus = ref(CONNECTION_STATUS.UNKNOWN)
const messageCount = ref(0)
const saving = ref(false)
const testing = ref(false)
const refreshing = ref(false)
const loading = ref(false)
const testResult = ref(null)
const mappings = ref([])
const addMappingDialogVisible = ref(false)
const addingMapping = ref(false)
const newMapping = ref({ conversationId: '', agentId: '' })

const currentAgentName = computed(() => {
  if (!config.value.defaultAgentId || agents.value.length === 0) return ''
  const agent = agents.value.find(a => a.id === config.value.defaultAgentId)
  return agent?.name || ''
})

const statusLabel = computed(() => statusLabels[connectionStatus.value])

const loadConfig = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/dingtalk/config')
    if (res.data) {
      config.value.clientId = res.data.clientId || ''
      config.value.clientSecret = res.data.clientSecret || ''
      config.value.defaultAgentId = res.data.defaultAgentId || ''
      config.value.enabled = res.data.enabled || false
    }
  } catch (err) {
    ElMessage.error('加载配置失败')
  } finally {
    loading.value = false
  }
}

const loadAgents = async () => {
  try {
    const res = await axios.get('/api/agents')
    agents.value = res.data || []
  } catch (err) {
    ElMessage.error('加载智能体列表失败')
  }
}

const refreshStatus = async () => {
  refreshing.value = true
  try {
    const res = await axios.get('/api/dingtalk/status')
    if (res.data) {
      connectionStatus.value = res.data.connected ? CONNECTION_STATUS.CONNECTED : CONNECTION_STATUS.DISCONNECTED
      messageCount.value = res.data.messageCount || 0
    }
  } catch (err) {
    ElMessage.error('刷新状态失败')
  } finally {
    refreshing.value = false
  }
}

const saveConfig = async () => {
  if (!config.value.clientId || !config.value.clientSecret) {
    ElMessage.warning('请填写 Client ID 和 Client Secret')
    return
  }
  saving.value = true
  try {
    await axios.put('/api/dingtalk/config', config.value)
    ElMessage.success('配置保存成功')
  } catch (err) {
    ElMessage.error('保存失败: ' + (err.response?.data?.error || err.message))
  } finally {
    saving.value = false
  }
}

const testConnection = async () => {
  if (!config.value.clientId || !config.value.clientSecret) {
    ElMessage.warning('请先填写配置信息')
    return
  }
  if (config.value.clientSecret === '********') {
    ElMessage.warning('请重新输入真实 Client Secret')
    return
  }
  testing.value = true
  testResult.value = null
  try {
    await axios.post('/api/dingtalk/test-connection', {
      clientId: config.value.clientId,
      clientSecret: config.value.clientSecret
    })
    testResult.value = { success: true, message: '连接测试成功' }
    connectionStatus.value = CONNECTION_STATUS.CONNECTED
  } catch (err) {
    testResult.value = { success: false, message: '连接失败: ' + (err.response?.data?.error || err.message) }
    connectionStatus.value = CONNECTION_STATUS.DISCONNECTED
  } finally {
    testing.value = false
  }
}

const loadAgentMappings = async () => {
  try {
    const res = await axios.get('/api/dingtalk/agent-mappings')
    mappings.value = res.data.mappings || []
  } catch (err) {
    ElMessage.error('加载智能体映射失败')
  }
}

const showAddMappingDialog = () => {
  newMapping.value = { conversationId: '', agentId: '' }
  addMappingDialogVisible.value = true
}

const addMapping = async () => {
  if (!newMapping.value.conversationId || !newMapping.value.agentId) {
    ElMessage.warning('请填写会话ID和选择智能体')
    return
  }
  addingMapping.value = true
  try {
    const res = await axios.post('/api/dingtalk/agent-mappings', newMapping.value)
    mappings.value.push(res.data.mapping)
    addMappingDialogVisible.value = false
    ElMessage.success('映射添加成功')
  } catch (err) {
    ElMessage.error('添加映射失败: ' + (err.response?.data?.error || err.message))
  } finally {
    addingMapping.value = false
  }
}

const deleteMapping = async (conversationId) => {
  try {
    await axios.delete(`/api/dingtalk/agent-mappings/${conversationId}`)
    mappings.value = mappings.value.filter(m => m.conversationId !== conversationId)
    ElMessage.success('映射删除成功')
  } catch (err) {
    ElMessage.error('删除映射失败')
  }
}

onMounted(async () => {
  await Promise.all([loadConfig(), loadAgents(), refreshStatus(), loadAgentMappings()])
})
</script>

<style scoped>
.bp-dingtalk {
  width: 100%;
  animation: bp-fade 0.4s ease-out;
}

/* page-head base inherited from global blueprint.css */

/* ╭── Panels ──╮ */
.bp-status-panel, .bp-config-panel, .bp-mapping-panel, .bp-guide-panel {
  padding: 24px;
  background: rgba(14, 29, 49, 0.6);
  border: 1px solid rgba(92, 228, 255, 0.2);
  margin-bottom: 20px;
}

.bp-panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px dashed rgba(92, 228, 255, 0.15);
}

.bp-panel-title {
  font-family: var(--bp-fnt-mono);
  font-size: 12px;
  color: var(--bp-blueprint);
  font-weight: 700;
  letter-spacing: 0.1em;
}

/* ╭── Status Grid ──╮ */
.bp-status-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.bp-stat-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 20px;
  background: rgba(92, 228, 255, 0.05);
  border: 1px solid rgba(92, 228, 255, 0.1);
}

.bp-stat-k {
  font-family: var(--bp-fnt-mono);
  font-size: 11px;
  color: var(--bp-chalk-dim);
  letter-spacing: 0.1em;
}

.bp-stat-v {
  font-family: var(--bp-fnt-mono);
  font-size: 14px;
  color: var(--bp-chalk);
}

.bp-stat-v.connected { color: var(--bp-green-check); }
.bp-stat-v.disconnected { color: var(--bp-red-stamp); }
.bp-stat-v.unknown { color: var(--bp-chalk-dim); }

/* ╭── Form ──╮ */
.bp-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.bp-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bp-label {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.bp-label-k {
  font-family: var(--bp-fnt-mono);
  font-size: 10px;
  color: var(--bp-amber);
  letter-spacing: 0.1em;
}

.bp-label-v {
  font-family: var(--bp-fnt-mono);
  font-size: 12px;
  color: var(--bp-chalk);
  letter-spacing: 0.06em;
}

.bp-input-wrap {
  padding: 8px 4px;
  border: 1px solid rgba(92, 228, 255, 0.15);
  background: rgba(92, 228, 255, 0.05);
  transition: all 0.2s ease;
}

.bp-input-wrap:focus-within {
  border-color: var(--bp-blueprint);
  background: rgba(92, 228, 255, 0.08);
  box-shadow: 0 0 12px rgba(92, 228, 255, 0.2);
}

.bp-input {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  font-family: var(--bp-fnt-mono);
  font-size: 13px;
  color: var(--bp-chalk);
}

.bp-input::placeholder {
  color: var(--bp-chalk-dim);
  opacity: 0.5;
}

.bp-switch-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bp-switch-label {
  font-family: var(--bp-fnt-mono);
  font-size: 12px;
  color: var(--bp-chalk-dim);
}

.bp-field-hint {
  font-family: var(--bp-fnt-mono);
  font-size: 11px;
  color: var(--bp-chalk-dim);
  opacity: 0.6;
}

.bp-test-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px dashed rgba(92, 228, 255, 0.15);
}

.bp-test-result {
  font-family: var(--bp-fnt-mono);
  font-size: 13px;
}

.bp-test-result.success { color: var(--bp-green-check); }
.bp-test-result.error { color: var(--bp-red-stamp); }

/* ╭── Mapping ──╮ */
.bp-mapping-desc {
  font-family: 'Hanken Grotesk', 'PingFang SC', sans-serif;
  font-size: 13px;
  color: var(--bp-chalk-dim);
  padding: 12px 16px;
  background: rgba(92, 228, 255, 0.05);
  border-left: 3px solid var(--bp-blueprint);
  margin-bottom: 16px;
}

.bp-mapping-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bp-mapping-item {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: rgba(92, 228, 255, 0.05);
  border: 1px solid rgba(92, 228, 255, 0.15);
}

.bp-card-tick-tl, .bp-card-tick-tr, .bp-card-tick-bl, .bp-card-tick-br {
  position: absolute;
  width: 6px;
  height: 6px;
  border: 1px solid rgba(92, 228, 255, 0.3);
}

.bp-card-tick-tl { top: -1px; left: -1px; border-right: none; border-bottom: none; }
.bp-card-tick-tr { top: -1px; right: -1px; border-left: none; border-bottom: none; }
.bp-card-tick-bl { bottom: -1px; left: -1px; border-right: none; border-top: none; }
.bp-card-tick-br { bottom: -1px; right: -1px; border-left: none; border-top: none; }

.bp-mapping-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bp-mapping-row {
  display: flex;
  gap: 8px;
}

.bp-mapping-k {
  font-family: var(--bp-fnt-mono);
  font-size: 11px;
  color: var(--bp-chalk-dim);
  min-width: 60px;
}

.bp-mapping-v {
  font-family: var(--bp-fnt-mono);
  font-size: 13px;
  color: var(--bp-chalk);
}

.bp-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px;
  color: var(--bp-chalk-dim);
}

.bp-empty-code {
  font-family: var(--bp-fnt-mono);
  font-size: 11px;
  color: var(--bp-blueprint);
  letter-spacing: 0.14em;
  opacity: 0.6;
}

/* ╭── Guide ──╮ */
.bp-guide-steps {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bp-guide-step {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: rgba(92, 228, 255, 0.05);
  border: 1px solid rgba(92, 228, 255, 0.1);
}

.bp-step-num {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  background: var(--bp-blueprint);
  color: var(--bp-ink);
  font-family: var(--bp-fnt-mono);
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.bp-step-content h5 {
  font-family: var(--bp-fnt-mono);
  font-size: 14px;
  font-weight: 700;
  color: var(--bp-chalk);
  margin-bottom: 6px;
}

.bp-step-content p {
  font-family: 'Hanken Grotesk', 'PingFang SC', sans-serif;
  font-size: 13px;
  color: var(--bp-chalk-dim);
  line-height: 1.6;
}

.bp-code {
  padding: 2px 6px;
  background: rgba(92, 228, 255, 0.1);
  border: 1px solid rgba(92, 228, 255, 0.2);
  font-family: var(--bp-fnt-mono);
  font-size: 12px;
  color: var(--bp-blueprint);
}

/* ╭── Dialog ──╮ */
.bp-dialog-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding-bottom: 12px;
  border-bottom: 1px dashed rgba(92, 228, 255, 0.2);
}

.bp-dialog-k {
  font-family: var(--bp-fnt-mono);
  font-size: 10px;
  color: var(--bp-chalk-dim);
  letter-spacing: 0.2em;
}

.bp-dialog-v {
  font-family: var(--bp-fnt-mono);
  font-size: 13px;
  color: var(--bp-blueprint);
  font-weight: 700;
  letter-spacing: 0.08em;
}

.bp-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px dashed rgba(92, 228, 255, 0.2);
}

.bp-btn-arrow {
  margin-left: 4px;
  opacity: 0.7;
}

/* ╭── Animations ──╮ */
@keyframes bp-fade { from { opacity: 0; } to { opacity: 1; } }

/* ╭── Responsive ──╮ */
@media (max-width: 768px) {
  .bp-status-grid { grid-template-columns: 1fr; }
}
</style>