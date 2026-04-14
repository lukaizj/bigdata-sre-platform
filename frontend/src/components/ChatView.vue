<template>
  <div class="chat-container">
    <div class="agent-bar">
      <div class="select-group">
        <el-select v-model="selectedAgent" placeholder="选择智能体" class="agent-select" @change="onAgentChange">
          <el-option v-for="agent in agents" :key="agent.id" :label="agent.name" :value="agent.id">
            <span>{{ agent.name }}</span>
            <span style="color: var(--text-muted); font-size: 12px; margin-left: 8px">{{ agent.description }}</span>
          </el-option>
        </el-select>
        <el-select v-model="selectedModel" placeholder="选择模型" class="model-select">
          <el-option v-for="model in models" :key="model.id" :label="model.name" :value="model.id">
            <span>{{ model.name }}</span>
            <span v-if="model.isDefault" class="default-tag">默认</span>
          </el-option>
        </el-select>
      </div>
      <div class="tool-buttons">
        <el-button size="small" @click="showSkillSelector = true" :type="selectedSkills.length > 0 ? 'primary' : ''">
          <svg class="btn-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
            <polyline points="2 17 12 22 22 17"></polyline>
            <polyline points="2 12 12 17 22 12"></polyline>
          </svg>
          {{ selectedSkills.length > 0 ? `${selectedSkills.length}` : 'Skills' }}
        </el-button>
        <el-button size="small" @click="showMCPSelector = true" :type="selectedMCPs.length > 0 ? 'success' : ''">
          <svg class="btn-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </svg>
          {{ selectedMCPs.length > 0 ? `${selectedMCPs.length}` : 'MCP' }}
        </el-button>
        <el-button size="small" @click="clearChat" :disabled="messages.length === 0">
          <svg class="btn-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
          </svg>
          清空
        </el-button>
      </div>
    </div>

    <!-- 技能选择器 -->
    <el-drawer v-model="showSkillSelector" title="选择 Skills" size="400px" direction="rtl">
      <div class="tool-selector">
        <div class="selector-tip">
          <p>勾选要使用的技能，不选则自动识别</p>
        </div>
        <div class="tool-section">
          <h4>
            <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
            可用技能
          </h4>
          <div class="tool-list">
            <div
              v-for="skill in availableSkills"
              :key="skill.id"
              :class="['tool-item', { selected: selectedSkills.includes(skill.id) }]"
              @click="toggleSkill(skill.id)"
            >
              <div class="tool-check">
                <svg v-if="selectedSkills.includes(skill.id)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <div class="tool-info">
                <span class="tool-name">{{ skill.name }}</span>
                <span class="tool-desc">{{ skill.description }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="selector-actions">
          <el-button @click="selectedSkills = []">清空</el-button>
          <el-button type="primary" @click="showSkillSelector = false">确定</el-button>
        </div>
      </div>
    </el-drawer>

    <!-- MCP 选择器 -->
    <el-drawer v-model="showMCPSelector" title="选择 MCP 工具" size="400px" direction="rtl">
      <div class="tool-selector">
        <div class="selector-tip">
          <p>勾选要使用的 MCP 工具，不选则自动识别</p>
        </div>
        <div class="tool-section">
          <h4>
            <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
            可用 MCP 工具
          </h4>
          <div class="tool-list">
            <div
              v-for="mcp in availableMCPs"
              :key="mcp.id"
              :class="['tool-item', { selected: selectedMCPs.includes(mcp.id) }]"
              @click="toggleMCP(mcp.id)"
            >
              <div class="tool-check">
                <svg v-if="selectedMCPs.includes(mcp.id)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <div class="tool-info">
                <span class="tool-name">{{ mcp.name }}</span>
                <span class="tool-desc">{{ mcp.description }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="selector-actions">
          <el-button @click="selectedMCPs = []">清空</el-button>
          <el-button type="primary" @click="showMCPSelector = false">确定</el-button>
        </div>
      </div>
    </el-drawer>

    <div class="messages-box" ref="messagesRef">
      <div v-if="messages.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </div>
        <h3>开始对话</h3>
        <p>选择智能体后输入问题</p>
        <div class="quick-btns">
          <button @click="quickAsk('查一下 HDFS 集群状态')">
            <svg class="quick-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 3v18h18"></path>
              <path d="M18 17V9"></path>
              <path d="M13 17V5"></path>
              <path d="M8 17v-3"></path>
            </svg>
            HDFS 状态
          </button>
          <button @click="quickAsk('查一下 YARN 集群资源')">
            <svg class="quick-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="4" y="4" width="16" height="16" rx="2"></rect>
              <rect x="9" y="9" width="6" height="6"></rect>
            </svg>
            YARN 资源
          </button>
          <button @click="quickAsk('列出 Spark 应用')">
            <svg class="quick-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
            Spark 应用
          </button>
          <button @click="quickAsk('检查集群健康')">
            <svg class="quick-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
            </svg>
            健康检查
          </button>
        </div>
      </div>

      <div v-for="(msg, i) in messages" :key="i" :class="['msg', msg.role]">
        <div class="msg-avatar">
          <svg v-if="msg.role === 'user'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="4"></rect>
            <circle cx="12" cy="10" r="3"></circle>
            <path d="M8 16c0-2 4-2 4-2s4 0 4 2"></path>
          </svg>
        </div>
        <div class="msg-body">
          <!-- 执行过程 -->
          <div v-if="msg.steps && msg.steps.length > 0" class="process-steps">
            <div v-for="(step, idx) in msg.steps" :key="idx" :class="['process-step', step.status]">
              <div class="step-indicator">
                <svg v-if="step.status === 'success'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <svg v-else-if="step.status === 'error'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                <svg v-else-if="step.status === 'warning'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <path d="M12 9v4M12 17h.01"></path>
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                </svg>
                <span v-else class="spinner-small"></span>
              </div>
              <div class="step-content">
                <span class="step-name">{{ step.step }}</span>
                <span class="step-desc">{{ step.content }}</span>
              </div>
            </div>
          </div>
          <div :class="['msg-content', msg.role === 'user' ? 'bubble-user' : 'bubble-assistant']">
            <span v-html="formatMsg(msg.content)"></span>
          </div>
          <!-- 操作按钮 -->
          <div v-if="msg.role === 'assistant'" class="msg-actions">
            <button class="action-btn" @click="regenerate" title="重新生成">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 4v6h6"></path>
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
              </svg>
            </button>
            <button class="action-btn" @click="copyMessage(msg.content)" title="复制">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
          </div>
          <div v-if="msg.skills?.length" class="msg-skills">
            <span v-for="s in msg.skills" :key="s" class="tag-green">{{ s }}</span>
          </div>
        </div>
      </div>

      <div v-if="loading" class="msg assistant">
        <div class="msg-avatar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="4"></rect>
            <circle cx="12" cy="10" r="3"></circle>
            <path d="M8 16c0-2 4-2 4-2s4 0 4 2"></path>
          </svg>
        </div>
        <div class="msg-body">
          <div class="typing"><span></span><span></span><span></span></div>
        </div>
      </div>
    </div>

    <div class="input-box">
      <el-input
        v-model="inputMsg"
        type="textarea"
        :rows="2"
        placeholder="输入消息... (Enter 发送, Ctrl+Enter 换行)"
        @keydown.enter="handleKeydown"
        :disabled="!selectedAgent || loading"
      />
      <el-button type="primary" @click="send" :loading="loading" :disabled="!selectedAgent || !inputMsg.trim()">
        发送
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch, onActivated } from 'vue'
import axios from 'axios'

// 组件名称，用于 KeepAlive
defineOptions({ name: 'ChatView' })

const agents = ref([])
const selectedAgent = ref('')
const models = ref([])
const selectedModel = ref('')
const messages = ref([])
const inputMsg = ref('')
const loading = ref(false)
const messagesRef = ref(null)
const sessionId = ref(null)

const showSkillSelector = ref(false)
const availableSkills = ref([])
const selectedSkills = ref([])

const showMCPSelector = ref(false)
import { STORAGE_KEYS } from '../utils/constants'

const availableMCPs = ref([])
const selectedMCPs = ref([])

// 清除对话历史，开始新对话
const clearChat = () => {
  messages.value = []
  sessionId.value = null
}

const loadSavedSelections = () => {
  const savedSkills = localStorage.getItem(STORAGE_KEYS.CHAT_SELECTED_SKILLS)
  if (savedSkills) {
    try {
      selectedSkills.value = JSON.parse(savedSkills)
    } catch (e) {}
  }
  const savedAgent = localStorage.getItem(STORAGE_KEYS.CHAT_SELECTED_AGENT)
  if (savedAgent) {
    selectedAgent.value = savedAgent
  }
  const savedModel = localStorage.getItem(STORAGE_KEYS.CHAT_SELECTED_MODEL)
  if (savedModel) {
    selectedModel.value = savedModel
  }
}

const saveSelections = () => {
  localStorage.setItem(STORAGE_KEYS.CHAT_SELECTED_SKILLS, JSON.stringify(selectedSkills.value))
  localStorage.setItem(STORAGE_KEYS.CHAT_SELECTED_AGENT, selectedAgent.value)
  localStorage.setItem(STORAGE_KEYS.CHAT_SELECTED_MODEL, selectedModel.value)
}

// 监听变化自动保存
watch([selectedSkills, selectedAgent, selectedModel], () => {
  saveSelections()
}, { deep: true })

const fetchAgents = async () => {
  try {
    const res = await axios.get('/api/agents')
    agents.value = res.data
    // 如果没有保存的智能体，使用第一个
    if (!selectedAgent.value && res.data[0]) {
      selectedAgent.value = res.data[0].id
    }
    // 加载智能体对应的 skills
    const agent = agents.value.find(a => a.id === selectedAgent.value)
    if (agent && agent.skills?.length > 0) {
      // 如果本地存储有 skills，使用本地存储的；否则使用智能体默认的
      const savedSkills = localStorage.getItem(STORAGE_KEY_SKILLS)
      if (!savedSkills) {
        selectedSkills.value = [...agent.skills]
      }
    }
  } catch (e) {}
}

const fetchModels = async () => {
  try {
    const res = await axios.get('/api/settings')
    if (res.data.models && res.data.models.length > 0) {
      models.value = res.data.models.filter(m => m.enabled)
      // 如果没有保存的模型，使用默认模型
      if (!selectedModel.value) {
        const defaultModel = models.value.find(m => m.isDefault)
        selectedModel.value = defaultModel?.id || models.value[0]?.id
      }
    }
  } catch (e) {}
}

const fetchSkills = async () => {
  try {
    const res = await axios.get('/api/skills')
    availableSkills.value = res.data || []
  } catch (e) {}
}

const fetchMCPs = async () => {
  try {
    const res = await axios.get('/api/chat/mcp-tools')
    availableMCPs.value = res.data.tools || []
  } catch (e) {}
}

const onAgentChange = (agentId) => {
  const agent = agents.value.find(a => a.id === agentId)
  if (agent && agent.skills?.length > 0) {
    // 智能体切换时，使用智能体默认 skills
    selectedSkills.value = [...agent.skills]
  } else {
    selectedSkills.value = []
  }
  saveSelections()
}

const toggleSkill = (skillId) => {
  const index = selectedSkills.value.indexOf(skillId)
  if (index > -1) {
    selectedSkills.value.splice(index, 1)
  } else {
    selectedSkills.value.push(skillId)
  }
  saveSelections()
}

const toggleMCP = (mcpId) => {
  const index = selectedMCPs.value.indexOf(mcpId)
  if (index > -1) {
    selectedMCPs.value.splice(index, 1)
  } else {
    selectedMCPs.value.push(mcpId)
  }
}

const quickAsk = (t) => { inputMsg.value = t; send() }

// 处理键盘事件：Enter发送，Ctrl+Enter换行
const handleKeydown = (e) => {
  if (e.ctrlKey) {
    // Ctrl+Enter 换行
    const textarea = e.target
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    inputMsg.value = inputMsg.value.substring(0, start) + '\n' + inputMsg.value.substring(end)
    // 恢复光标位置
    nextTick(() => {
      textarea.selectionStart = textarea.selectionEnd = start + 1
    })
    e.preventDefault()
  } else {
    // Enter 发送
    e.preventDefault()
    send()
  }
}

// 重新生成最后一条消息
const regenerate = async () => {
  if (messages.value.length < 2 || loading.value) return
  // 找到最后一条用户消息
  const lastUserMsgIndex = messages.value.length - 2
  const lastUserMsg = messages.value[lastUserMsgIndex]
  if (lastUserMsg.role !== 'user') return

  // 移除最后一条助手消息
  messages.value.pop()

  // 重新发送
  const text = lastUserMsg.content
  loading.value = true

  try {
    if (selectedMCPs.value.length > 0) {
      const res = await axios.post('/api/chat/mcp', {
        agent_id: selectedAgent.value,
        message: text,
        mcp_ids: selectedMCPs.value
      })
      messages.value.push({
        role: 'assistant',
        content: res.data.response,
        skills: res.data.skills || [],
        steps: res.data.steps || []
      })
    } else {
      const res = await axios.post('/api/chat', {
        agent_id: selectedAgent.value,
        message: text,
        model_id: selectedModel.value,
        skill_ids: selectedSkills.value.length > 0 ? selectedSkills.value : undefined
      })
      messages.value.push({
        role: 'assistant',
        content: res.data.response,
        skills: res.data.skills || [],
        steps: res.data.steps || []
      })
    }
  } catch (e) {
    messages.value.push({ role: 'assistant', content: '错误: ' + (e.response?.data?.error || e.message) })
  } finally {
    loading.value = false
    nextTick(() => { if (messagesRef.value) messagesRef.value.scrollTop = messagesRef.value.scrollHeight })
  }
}

// 复制消息内容
const copyMessage = async (content) => {
  try {
    await navigator.clipboard.writeText(content)
    // 可以添加一个短暂的提示
  } catch (e) {
    console.error('Copy failed:', e)
  }
}

const send = async () => {
  if (!inputMsg.value.trim() || loading.value) return
  const text = inputMsg.value.trim()
  messages.value.push({ role: 'user', content: text })
  inputMsg.value = ''
  loading.value = true

  try {
    // 如果选择了 MCP，使用 MCP 模式
    if (selectedMCPs.value.length > 0) {
      const res = await axios.post('/api/chat/mcp', {
        agent_id: selectedAgent.value,
        message: text,
        mcp_ids: selectedMCPs.value
      })
      messages.value.push({
        role: 'assistant',
        content: res.data.response,
        skills: res.data.skills || [],
        steps: res.data.steps || []
      })
    } else {
      // 使用新的 AI 驱动对话模式
      const res = await axios.post('/api/chat', {
        session_id: sessionId.value,
        agent_id: selectedAgent.value,
        message: text,
        model_id: selectedModel.value
      })
      // 保存 session_id 用于后续对话
      sessionId.value = res.data.session_id
      messages.value.push({
        role: 'assistant',
        content: res.data.response,
        steps: res.data.steps || []
      })
    }
  } catch (e) {
    messages.value.push({ role: 'assistant', content: '错误: ' + (e.response?.data?.error || e.message) })
  } finally {
    loading.value = false
    nextTick(() => { if (messagesRef.value) messagesRef.value.scrollTop = messagesRef.value.scrollHeight })
  }
}

const formatMsg = (t) => t ? t.replace(/\n/g, '<br>') : ''

onMounted(async () => {
  loadSavedSelections()
  // 并行加载所有数据，提升初始化速度
  await Promise.all([
    fetchAgents(),
    fetchModels(),
    fetchSkills(),
    fetchMCPs()
  ])
})
</script>

<style scoped>
.chat-container { height: calc(100vh - 160px); display: flex; flex-direction: column; gap: 12px; }
.agent-bar { display: flex; justify-content: space-between; align-items: center; }
.select-group { display: flex; gap: 12px; align-items: center; }
.agent-select { width: 200px; }
.model-select { width: 140px; }
.tool-buttons { display: flex; gap: 8px; }
.default-tag { font-size: 10px; padding: 1px 6px; background: var(--gradient-primary); color: white; border-radius: 4px; margin-left: 8px; }
.messages-box { flex: 1; overflow-y: auto; background: var(--bg-card); border-radius: 14px; padding: 20px; border: var(--border-light); }
[data-theme="dark"] .messages-box { background: rgba(39, 39, 42, 0.5); }
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--text-muted); }
.empty-icon { width: 64px; height: 64px; margin-bottom: 16px; color: var(--text-muted); }
.empty-icon svg { width: 100%; height: 100%; }
.empty-state h3 { font-size: 18px; color: var(--text-primary); margin-bottom: 4px; }
.quick-btns { display: flex; gap: 10px; margin-top: 20px; flex-wrap: wrap; }
.quick-btns button { padding: 10px 16px; background: var(--bg-hover); border: var(--border-light); border-radius: 10px; cursor: pointer; font-size: 13px; color: var(--text-secondary); display: flex; align-items: center; gap: 8px; }
[data-theme="dark"] .quick-btns button { background: rgba(63, 63, 70, 0.4); }
.quick-btns button:nth-child(1) { border-left: 3px solid #f97316; }
.quick-btns button:nth-child(2) { border-left: 3px solid #8b5cf6; }
.quick-btns button:nth-child(3) { border-left: 3px solid #06b6d4; }
.quick-btns button:nth-child(4) { border-left: 3px solid #10b981; }
.quick-btns button:hover { border-color: var(--accent); color: var(--accent); background: rgba(99, 102, 241, 0.08); }
.quick-icon { width: 16px; height: 16px; flex-shrink: 0; }
.quick-btns button:nth-child(1) .quick-icon { color: #f97316; }
.quick-btns button:nth-child(2) .quick-icon { color: #8b5cf6; }
.quick-btns button:nth-child(3) .quick-icon { color: #06b6d4; }
.quick-btns button:nth-child(4) .quick-icon { color: #10b981; }
.msg { display: flex; gap: 12px; margin-bottom: 16px; }
.msg.user { flex-direction: row-reverse; }
.msg-avatar { width: 36px; height: 36px; background: var(--bg-hover); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
[data-theme="dark"] .msg-avatar { background: rgba(63, 63, 70, 0.5); }
.msg-avatar svg { width: 18px; height: 18px; color: var(--text-muted); }
.msg.user .msg-avatar { background: var(--gradient-primary); }
.msg.user .msg-avatar svg { color: white; }
.msg .msg-avatar svg { color: var(--accent); }
.msg-body { max-width: 70%; }
.msg.user .msg-body { display: flex; flex-direction: column; align-items: flex-end; }
.msg-content { padding: 12px 16px; line-height: 1.6; }
.msg-skills { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
.typing { display: flex; gap: 4px; padding: 8px 0; }
.typing span { width: 8px; height: 8px; background: var(--accent); border-radius: 50%; animation: t 1s infinite; }
.typing span:nth-child(2) { animation-delay: .2s; }
.typing span:nth-child(3) { animation-delay: .4s; }
@keyframes t { 0%,100% { opacity: .4; } 50% { opacity: 1; } }
.input-box { display: flex; gap: 12px; background: var(--bg-card); padding: 16px; border-radius: 14px; border: var(--border-light); }
[data-theme="dark"] .input-box { background: rgba(39, 39, 42, 0.6); }
.input-box .el-textarea { flex: 1; }
.input-box .el-button { align-self: flex-end; height: 42px; padding: 0 24px; }

/* 工具选择器 */
.tool-selector {
  padding: 0 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.selector-tip {
  padding: 12px 16px;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 10px;
  margin-bottom: 20px;
}

.selector-tip p {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}

.tool-section {
  flex: 1;
  overflow-y: auto;
}

.tool-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.section-icon { width: 18px; height: 18px; color: var(--accent); }
.btn-icon-svg { width: 14px; height: 14px; margin-right: 4px; }

.tool-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tool-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background: var(--bg-hover);
  border: 1px solid transparent;
  border-radius: 12px;
  cursor: pointer;
}

[data-theme="dark"] .tool-item {
  background: rgba(63, 63, 70, 0.4);
}

.tool-item:hover {
  border-color: var(--accent);
}

.tool-item.selected {
  background: rgba(99, 102, 241, 0.1);
  border-color: var(--accent);
}

[data-theme="dark"] .tool-item.selected {
  background: rgba(129, 140, 248, 0.2);
}

.tool-check {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-color);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

[data-theme="dark"] .tool-check {
  border-color: rgba(255, 255, 255, 0.2);
}

.tool-item.selected .tool-check {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
}

.tool-check svg {
  width: 12px;
  height: 12px;
}

.tool-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tool-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.tool-desc {
  font-size: 12px;
  color: var(--text-muted);
}

.selector-actions {
  padding: 16px 0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: var(--border-light);
  margin-top: 16px;
}

.tag-green {
  display: inline-block;
  padding: 2px 8px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.15));
  color: var(--success);
  border-radius: 4px;
  font-size: 11px;
}

/* 执行过程 */
.process-steps {
  background: rgba(99, 102, 241, 0.05);
  border: 1px solid rgba(99, 102, 241, 0.15);
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 12px;
}

.process-step {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(99, 102, 241, 0.1);
}

.process-step:last-child {
  border-bottom: none;
}

.step-indicator {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.process-step.success .step-indicator {
  background: rgba(16, 185, 129, 0.2);
  color: var(--success);
}

.process-step.error .step-indicator {
  background: rgba(239, 68, 68, 0.2);
  color: var(--danger);
}

.process-step.warning .step-indicator {
  background: rgba(245, 158, 11, 0.2);
  color: var(--warning);
}

.process-step.running .step-indicator {
  background: rgba(99, 102, 241, 0.2);
}

.step-indicator svg {
  width: 12px;
  height: 12px;
}

.spinner-small {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(99, 102, 241, 0.3);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.step-content {
  flex: 1;
  min-width: 0;
}

.step-name {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.step-desc {
  display: block;
  font-size: 12px;
  color: var(--text-muted);
}

/* 消息操作按钮 */
.msg-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.action-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: var(--bg-hover);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: var(--accent);
  color: white;
}

.action-btn svg {
  width: 14px;
  height: 14px;
  color: var(--text-muted);
}

.action-btn:hover svg {
  color: white;
}
</style>