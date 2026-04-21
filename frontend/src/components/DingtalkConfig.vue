<template>
  <div class="dingtalk-page">
    <div class="page-header">
      <h3>钉钉配置</h3>
      <p>配置钉钉机器人接入智能体对话</p>
    </div>

    <!-- 状态卡片 -->
    <div class="status-section card">
      <div class="section-header">
        <h4>
          服务状态
        </h4>
        <el-button size="small" @click="refreshStatus" :loading="refreshing">
          刷新
        </el-button>
      </div>

      <div class="status-grid">
        <div class="status-card">
          <div class="status-info">
            <h5>连接状态</h5>
            <span :class="['status-badge', connectionStatus]">
              {{ statusLabel }}
            </span>
          </div>
        </div>

        <div class="status-card">
          <div class="status-info">
            <h5>消息统计</h5>
            <div class="message-stats">
              <span class="stat-item">消息数: {{ messageCount }}</span>
            </div>
          </div>
        </div>

        <div class="status-card">
          <div class="status-info">
            <h5>当前智能体</h5>
            <span class="agent-name">{{ currentAgentName || '未配置' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 配置表单 -->
    <div class="config-section card">
      <div class="section-header">
        <h4>
          基础配置
        </h4>
        <el-button type="primary" size="small" @click="saveConfig" :loading="saving">
          保存配置
        </el-button>
      </div>

      <el-form :model="config" label-position="top" class="config-form">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Client ID" required>
              <el-input
                v-model="config.clientId"
                placeholder="钉钉应用的 Client ID"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Client Secret" required>
              <el-input
                v-model="config.clientSecret"
                type="password"
                show-password
                placeholder="钉钉应用的 Client Secret"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="默认智能体">
              <el-select v-model="config.defaultAgentId" placeholder="选择默认智能体" style="width: 100%">
                <el-option
                  v-for="agent in agents"
                  :key="agent.id"
                  :label="agent.name"
                  :value="agent.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="启用状态">
              <el-switch v-model="config.enabled" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <div class="test-section">
        <el-button @click="testConnection" :loading="testing">
          测试连接
        </el-button>
        <span v-if="testResult" :class="['test-result', testResult.success ? 'success' : 'error']">
          {{ testResult.message }}
        </span>
      </div>
    </div>

    <!-- 智能体映射配置 -->
    <div class="mapping-section card">
      <div class="section-header">
        <h4>
          智能体映射
        </h4>
        <el-button type="primary" size="small" @click="showAddMappingDialog">
          添加映射
        </el-button>
      </div>

      <div class="mapping-description">
        为不同的钉钉会话/群聊配置专属智能体，未配置的会话将使用默认智能体
      </div>

      <div v-if="mappings.length > 0" class="mapping-list">
        <div v-for="mapping in mappings" :key="mapping.conversationId" class="mapping-item">
          <div class="mapping-info">
            <div class="mapping-id">
              <span class="label">会话ID:</span>
              <span class="value">{{ mapping.conversationId }}</span>
            </div>
            <div class="mapping-agent">
              <span class="label">智能体:</span>
              <span class="value">{{ mapping.agentName }}</span>
            </div>
          </div>
          <el-button
            type="danger"
            size="small"
            text
            @click="deleteMapping(mapping.conversationId)"
          >
            删除
          </el-button>
        </div>
      </div>
      <div v-else class="empty-mapping">
        <p>暂无智能体映射，点击"添加映射"按钮创建</p>
      </div>
    </div>

    <!-- 使用说明 -->
    <div class="guide-section card">
      <div class="section-header">
        <h4>
          使用说明
        </h4>
      </div>

      <div class="guide-content">
        <div class="guide-step">
          <div class="step-number">1</div>
          <div class="step-content">
            <h5>创建钉钉机器人应用</h5>
            <p>在钉钉开放平台创建企业内部机器人应用，获取 Client ID 和 Client Secret</p>
          </div>
        </div>

        <div class="guide-step">
          <div class="step-number">2</div>
          <div class="step-content">
            <h5>配置回调地址</h5>
            <p>在钉钉应用管理中设置回调地址：<code>/api/dingtalk/webhook</code></p>
          </div>
        </div>

        <div class="guide-step">
          <div class="step-number">3</div>
          <div class="step-content">
            <h5>填写配置信息</h5>
            <p>将 Client ID 和 Client Secret 填入上方配置表单，选择默认智能体</p>
          </div>
        </div>

        <div class="guide-step">
          <div class="step-number">4</div>
          <div class="step-content">
            <h5>开始对话</h5>
            <p>用户在钉钉群中 @机器人 发送消息：<code>@智能助手 你的问题</code></p>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加映射对话框 -->
    <el-dialog
      v-model="addMappingDialogVisible"
      title="添加智能体映射"
      width="500px"
    >
      <el-form :model="newMapping" label-position="top">
        <el-form-item label="会话ID" required>
          <el-input
            v-model="newMapping.conversationId"
            placeholder="钉钉会话ID (如: conversation_xxx)"
          />
          <div class="form-hint">
            在钉钉群中 @机器人 发送消息后，系统会自动获取会话ID
          </div>
        </el-form-item>
        <el-form-item label="智能体" required>
          <el-select v-model="newMapping.agentId" placeholder="选择智能体" style="width: 100%">
            <el-option
              v-for="agent in agents"
              :key="agent.id"
              :label="agent.name"
              :value="agent.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addMappingDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="addMapping" :loading="addingMapping">
          确定
        </el-button>
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
const newMapping = ref({
  conversationId: '',
  agentId: '',
})

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
    ElMessage.error('加载配置失败，请刷新页面重试')
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
    ElMessage.warning('Client Secret 显示为遮蔽值，请重新输入真实值后测试')
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
  newMapping.value = {
    conversationId: '',
    agentId: '',
  }
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
    ElMessage.error('删除映射失败: ' + (err.response?.data?.error || err.message))
  }
}

onMounted(async () => {
  await Promise.all([loadConfig(), loadAgents(), refreshStatus(), loadAgentMappings()])
})
</script>

<style scoped>
.dingtalk-page {
  width: 100%;
}

.page-header {
  margin-bottom: 28px;
  padding-bottom: 16px;
  border-bottom: var(--border-weak-line);
}

.page-header h3 {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--accent);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 6px;
}

.page-header h3::before { content: '// '; opacity: 0.5; }

.page-header p {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
  letter-spacing: 0.04em;
}

/* 状态区域 */
.status-section {
  padding: 24px;
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h4 {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--text-secondary);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.section-header h4::before { content: '── '; color: var(--accent); opacity: 0.5; }

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.status-card {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: var(--bg-hover);
  border: var(--border-medium-line);
  border-left: 3px solid var(--accent);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  transition: all 0.2s ease;
}

.status-card:hover {
  box-shadow: -2px 0 10px var(--accent-glow);
}

.status-info {
  flex: 1;
}

.status-info h5 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 500;
}

.status-badge.connected {
  background: var(--tag-green-bg);
  color: var(--tag-green-text);
}

.status-badge.disconnected {
  background: var(--tag-red-bg);
  color: var(--tag-red-text);
}

.status-badge.unknown {
  background: var(--bg-hover);
  color: var(--text-muted);
}

.message-stats {
  display: flex;
  gap: 12px;
}

.stat-item {
  font-size: 13px;
  color: var(--text-secondary);
}

.agent-name {
  font-size: 13px;
  color: var(--text-secondary);
}

/* 配置区域 */
.config-section {
  padding: 24px;
  margin-bottom: 20px;
}

.config-form {
  max-width: 800px;
}

.test-section {
  display: flex;
  gap: 12px;
  align-items: center;
  padding-top: 20px;
  border-top: var(--border-weak-line);
}

.test-result {
  font-size: 14px;
}

.test-result.success {
  color: var(--success);
}

.test-result.error {
  color: var(--danger);
}

/* 智能体映射区域 */
.mapping-section {
  padding: 24px;
  margin-bottom: 20px;
}

.mapping-description {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 20px;
  padding: 12px 16px;
  background: var(--bg-hover);
  border-radius: var(--radius-lg);
  border-left: 3px solid var(--accent);
}

.mapping-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mapping-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: var(--bg-hover);
  border-radius: var(--radius-md);
  border: var(--border-medium-line);
  transition: all 0.2s ease;
}

.mapping-item:hover {
  border-color: var(--accent);
}

.mapping-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mapping-id,
.mapping-agent {
  display: flex;
  gap: 8px;
  font-size: 14px;
}

.mapping-id .label,
.mapping-agent .label {
  color: var(--text-muted);
  min-width: 60px;
}

.mapping-id .value,
.mapping-agent .value {
  color: var(--text-primary);
  font-family: monospace;
}

.empty-mapping {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-mapping p {
  font-size: 14px;
}

.form-hint {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
}

/* 使用说明区域 */
.guide-section {
  padding: 24px;
}

.guide-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.guide-step {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: var(--bg-hover);
  border-radius: var(--radius-md);
  border: var(--border-medium-line);
}

.step-number {
  width: 36px;
  height: 36px;
  background: var(--accent);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 16px;
  flex-shrink: 0;
}

.step-content h5 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.step-content p {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.step-content code {
  padding: 2px 6px;
  background: var(--tag-blue-bg);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--tag-blue-text);
}
</style>