<template>
  <div class="dingtalk-page">
    <div class="page-header fade-in-up">
      <h3>钉钉配置</h3>
      <p>配置钉钉机器人接入智能体对话</p>
    </div>

    <!-- 状态卡片 -->
    <div class="status-section glass-card fade-in-up delay-1">
      <div class="section-header">
        <h4>
          <span class="icon">📊</span>
          服务状态
        </h4>
        <el-button size="small" @click="refreshStatus" :loading="refreshing">
          刷新
        </el-button>
      </div>

      <div class="status-grid">
        <div class="status-card">
          <div class="status-icon">🔗</div>
          <div class="status-info">
            <h5>连接状态</h5>
            <span :class="['status-badge', connectionStatus]">
              {{ connectionStatus === 'connected' ? '已连接' : connectionStatus === 'disconnected' ? '未连接' : '未知' }}
            </span>
          </div>
        </div>

        <div class="status-card">
          <div class="status-icon">📨</div>
          <div class="status-info">
            <h5>消息统计</h5>
            <div class="message-stats">
              <span class="stat-item">接收: {{ messageStats.received || 0 }}</span>
              <span class="stat-item">发送: {{ messageStats.sent || 0 }}</span>
            </div>
          </div>
        </div>

        <div class="status-card">
          <div class="status-icon">🤖</div>
          <div class="status-info">
            <h5>当前智能体</h5>
            <span class="agent-name">{{ currentAgentName || '未配置' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 配置表单 -->
    <div class="config-section glass-card fade-in-up delay-2">
      <div class="section-header">
        <h4>
          <span class="icon">⚙️</span>
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

    <!-- 使用说明 -->
    <div class="guide-section glass-card fade-in-up delay-3">
      <div class="section-header">
        <h4>
          <span class="icon">📖</span>
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

defineOptions({ name: 'DingtalkConfig' })

const config = ref({
  clientId: '',
  clientSecret: '',
  defaultAgentId: '',
  enabled: false,
})

const agents = ref([])
const connectionStatus = ref('unknown')
const messageStats = ref({
  received: 0,
  sent: 0,
})
const currentAgentName = ref('')
const saving = ref(false)
const testing = ref(false)
const refreshing = ref(false)
const testResult = ref(null)

const loadConfig = async () => {
  try {
    const res = await axios.get('/api/dingtalk/config')
    if (res.data) {
      config.value.clientId = res.data.clientId || ''
      config.value.clientSecret = res.data.clientSecret || ''
      config.value.defaultAgentId = res.data.defaultAgentId || ''
      config.value.enabled = res.data.enabled || false
    }
  } catch (err) {
    console.log('加载配置失败:', err)
  }
}

const loadAgents = async () => {
  try {
    const res = await axios.get('/api/agents')
    agents.value = res.data || []
  } catch (err) {
    console.log('加载智能体失败:', err)
  }
}

const refreshStatus = async () => {
  refreshing.value = true
  try {
    const res = await axios.get('/api/dingtalk/status')
    if (res.data) {
      connectionStatus.value = res.data.connectionStatus || 'unknown'
      messageStats.value = res.data.messageStats || { received: 0, sent: 0 }
      currentAgentName.value = res.data.currentAgentName || ''
    }
  } catch (err) {
    console.log('刷新状态失败:', err)
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
    refreshStatus()
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

  testing.value = true
  testResult.value = null
  try {
    await axios.post('/api/dingtalk/test-connection', config.value)
    testResult.value = { success: true, message: '连接测试成功' }
    connectionStatus.value = 'connected'
  } catch (err) {
    testResult.value = { success: false, message: '连接失败: ' + (err.response?.data?.error || err.message) }
    connectionStatus.value = 'disconnected'
  } finally {
    testing.value = false
  }
}

onMounted(() => {
  loadConfig()
  loadAgents()
  refreshStatus()
})
</script>

<style scoped>
.dingtalk-page {
  width: 100%;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h3 {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.page-header p {
  color: var(--text-muted);
  font-size: 14px;
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
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.section-header .icon {
  font-size: 22px;
}

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
  border-radius: 14px;
  border: var(--border-light);
  transition: all 0.2s ease;
}

.status-card:hover {
  border-color: var(--accent);
}

.status-icon {
  width: 48px;
  height: 48px;
  background: rgba(99, 102, 241, 0.15);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
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
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}

.status-badge.connected {
  background: rgba(16, 185, 129, 0.15);
  color: var(--success);
}

.status-badge.disconnected {
  background: rgba(239, 68, 68, 0.15);
  color: var(--danger);
}

.status-badge.unknown {
  background: rgba(107, 114, 128, 0.15);
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
  border-top: var(--border-light);
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
  border-radius: 12px;
  border: var(--border-light);
}

.step-number {
  width: 36px;
  height: 36px;
  background: var(--gradient-primary);
  border-radius: 10px;
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
  background: rgba(99, 102, 241, 0.15);
  border-radius: 4px;
  font-family: monospace;
  font-size: 13px;
  color: var(--accent);
}
</style>