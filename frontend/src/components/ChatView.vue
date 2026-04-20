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

    <div class="term-wrap">
      <div class="term-head">
        <span class="th-dot r"></span>
        <span class="th-dot y"></span>
        <span class="th-dot g"></span>
        <span class="th-title">nexus@sre:~/{{ selectedAgent || 'shell' }}</span>
        <span class="th-meta">终端 · {{ messages.length }} 条对话 · {{ sessionId ? '会话:' + String(sessionId).slice(-6) : '新会话' }}</span>
      </div>

      <div class="messages-box" ref="messagesRef">
        <div v-if="messages.length === 0" class="term-welcome">
          <pre class="welcome-banner">  _   _ _______  ___   _ ___
 | \ | | ____\ \/ / | | / __|
 | .\| | _|  |    /| | | \__ \
 |_|\_|_____|/_/\_\|___\|___/   SRE 终端 · v4.2.1</pre>
          <div class="welcome-line"><span class="wl-dim">[启动]</span> 已连接 cluster-01 · 就绪</div>
          <div class="welcome-line"><span class="wl-dim">[提示]</span> 输入你的问题，或从下方选择快捷命令</div>
          <div class="welcome-line"><span class="wl-dim">[文档]</span> Enter 执行 · Ctrl+Enter 换行</div>

          <div class="quick-cmds">
            <button @click="quickAsk('查一下 HDFS 集群状态')" class="qc hdfs">
              <span class="qc-prompt">$</span><span class="qc-name">status</span><span class="qc-arg">hdfs</span>
              <span class="qc-desc">· 集群状态</span>
            </button>
            <button @click="quickAsk('查一下 YARN 集群资源')" class="qc yarn">
              <span class="qc-prompt">$</span><span class="qc-name">top</span><span class="qc-arg">yarn</span>
              <span class="qc-desc">· 资源用量</span>
            </button>
            <button @click="quickAsk('列出 Spark 应用')" class="qc spark">
              <span class="qc-prompt">$</span><span class="qc-name">ps</span><span class="qc-arg">spark -a</span>
              <span class="qc-desc">· 运行中应用</span>
            </button>
            <button @click="quickAsk('检查集群健康')" class="qc health">
              <span class="qc-prompt">$</span><span class="qc-name">check</span><span class="qc-arg">--health</span>
              <span class="qc-desc">· 全面体检</span>
            </button>
          </div>
        </div>

        <div v-for="(msg, i) in messages" :key="i" :class="['tline', msg.role]">
          <!-- 用户消息 -->
          <template v-if="msg.role === 'user'">
            <div class="prompt-line">
              <span class="pl-user">user@nexus</span><span class="pl-colon">:</span><span class="pl-path">~</span><span class="pl-dollar">$</span>
              <span class="pl-text" v-html="formatMsg(msg.content)"></span>
            </div>
          </template>

          <!-- 助手消息 -->
          <template v-else>
            <div class="agent-line">
              <span class="al-rail"></span>
              <div class="al-body">
                <div class="al-head">
                  <span class="al-tag">[智能体]</span>
                  <span class="al-sep">::</span>
                  <span class="al-status">完成</span>
                  <span class="al-actions">
                    <button class="tic-btn" @click="regenerate" title="重新生成">↻</button>
                    <button class="tic-btn" @click="copyMessage(msg.content)" title="复制">⧉</button>
                  </span>
                </div>

                <!-- 执行过程 -->
                <div v-if="msg.steps && msg.steps.length > 0" class="exec-log">
                  <div v-for="(step, idx) in msg.steps" :key="idx" :class="['exec-row', step.status]">
                    <span class="ex-tag">
                      <template v-if="step.status === 'success'">[完成]</template>
                      <template v-else-if="step.status === 'error'">[失败]</template>
                      <template v-else-if="step.status === 'warning'">[警告]</template>
                      <template v-else>[执行]</template>
                    </span>
                    <span class="ex-name">{{ step.step }}</span>
                    <span class="ex-arrow">→</span>
                    <span class="ex-desc">{{ step.content }}</span>
                  </div>
                </div>

                <div class="al-content">
                  <span v-html="formatMsg(msg.content)"></span>
                </div>

                <div v-if="msg.skills?.length" class="al-skills">
                  <span v-for="s in msg.skills" :key="s" class="sk-chip">#{{ s }}</span>
                </div>
              </div>
            </div>
          </template>
        </div>

        <div v-if="loading" class="tline assistant">
          <div class="agent-line">
            <span class="al-rail rail-active"></span>
            <div class="al-body">
              <div class="al-head">
                <span class="al-tag">[智能体]</span>
                <span class="al-sep">::</span>
                <span class="al-status working">思考中</span>
              </div>
              <div class="term-typing"><span>▊</span><span>▋</span><span>▌</span><span>▍</span></div>
            </div>
          </div>
        </div>
      </div>

      <div class="term-input">
        <span class="ti-prompt">
          <span class="tp-user">user@nexus</span><span class="tp-colon">:</span><span class="tp-path">~</span><span class="tp-dollar">$</span>
        </span>
        <textarea
          v-model="inputMsg"
          class="ti-textarea"
          rows="1"
          :placeholder="selectedAgent ? '输入你的问题，按 Enter 执行' : '请先选择智能体'"
          @keydown.enter="handleKeydown"
          :disabled="!selectedAgent || loading"
        ></textarea>
        <button class="ti-run" @click="send" :disabled="!selectedAgent || !inputMsg.trim() || loading">
          <span v-if="loading" class="ti-spin"></span>
          <span v-else>[ 执行 ]</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch, onActivated } from 'vue'
import { ElMessage } from 'element-plus'
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
      const savedSkills = localStorage.getItem(STORAGE_KEYS.CHAT_SELECTED_SKILLS)
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
    ElMessage.error('复制失败')
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

const formatMsg = (t) => {
  if (!t) return ''
  return t
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
}

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
.default-tag { font-size: 10px; padding: 1px 6px; background: var(--accent-gradient); color: white; border-radius: 10px; margin-left: 8px; }
.btn-icon-svg { width: 14px; height: 14px; margin-right: 4px; }

/* ── Terminal wrapper ─────────────────────────────────── */
.term-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #0a0e14;
  border: 1px solid rgba(20,184,166,0.28);
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 0 30px rgba(20,184,166,0.05), inset 0 0 20px rgba(0,0,0,0.3);
  font-family: 'JetBrains Mono', 'Sarasa Mono SC', 'Consolas', 'PingFang SC', 'Microsoft YaHei', monospace;
  position: relative;
}
.term-wrap::before {
  content: '';
  position: absolute; inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(0deg,
    transparent 0, transparent 2px,
    rgba(20,184,166,0.02) 2px, rgba(20,184,166,0.02) 3px);
  z-index: 1;
}

.term-head {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 14px;
  background: linear-gradient(180deg, #0d1117 0%, #0a0e14 100%);
  border-bottom: 1px solid rgba(20,184,166,0.2);
  font-size: 11px;
  color: #7d8590;
  letter-spacing: 0.08em;
  z-index: 2; position: relative;
}
.th-dot { width: 10px; height: 10px; border-radius: 50%; }
.th-dot.r { background: #ef4444; box-shadow: 0 0 6px rgba(239,68,68,0.6); }
.th-dot.y { background: #fbbf24; box-shadow: 0 0 6px rgba(251,191,36,0.6); }
.th-dot.g { background: #10b981; box-shadow: 0 0 6px rgba(16,185,129,0.6); }
.th-title { margin-left: 8px; color: #5eead4; font-weight: 600; }
.th-meta { margin-left: auto; color: #8b949e; font-size: 10px; }

.messages-box {
  flex: 1;
  overflow-y: auto;
  padding: 18px 22px;
  z-index: 2;
  position: relative;
  font-size: 13.5px;
  line-height: 1.75;
  color: #c9d1d9;
  scrollbar-width: thin;
  scrollbar-color: rgba(20,184,166,0.3) transparent;
}
.messages-box::-webkit-scrollbar { width: 6px; }
.messages-box::-webkit-scrollbar-thumb { background: rgba(20,184,166,0.3); border-radius: 3px; }

/* ── Welcome banner ────────────────────────────────────── */
.term-welcome {
  padding: 6px 0;
  animation: fade-in 0.5s ease-out;
}
.welcome-banner {
  color: #14b8a6;
  font-size: 12px;
  line-height: 1.3;
  margin: 0 0 14px;
  text-shadow: 0 0 12px rgba(20,184,166,0.35);
  white-space: pre;
  font-family: 'JetBrains Mono', 'Sarasa Mono SC', 'PingFang SC', 'Microsoft YaHei', monospace;
}
.welcome-line {
  color: #c9d1d9;
  font-size: 12.5px;
  margin-bottom: 4px;
  letter-spacing: 0.02em;
}
.wl-dim { color: #5eead4; opacity: 0.7; margin-right: 8px; font-weight: 600; }

.quick-cmds {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 6px;
  margin-top: 16px;
  max-width: 720px;
}
.qc {
  display: flex; align-items: baseline; gap: 8px;
  padding: 9px 12px;
  background: rgba(13,17,23,0.6);
  border: 1px solid rgba(20,184,166,0.12);
  border-left: 2px solid;
  border-radius: 2px;
  cursor: pointer;
  font-family: 'JetBrains Mono', 'Sarasa Mono SC', 'PingFang SC', 'Microsoft YaHei', monospace;
  font-size: 12.5px;
  color: #8b949e;
  transition: all 0.15s ease;
  text-align: left;
}
.qc:hover {
  background: rgba(20,184,166,0.06);
  border-color: rgba(20,184,166,0.4);
  transform: translateX(3px);
}
.qc-prompt { color: #14b8a6; font-weight: 700; }
.qc-name { color: #fbbf24; font-weight: 600; }
.qc-arg { color: #5eead4; }
.qc-desc { color: #8b949e; margin-left: auto; font-size: 11px; font-style: italic; }
.qc.hdfs   { border-left-color: #14b8a6; }
.qc.yarn   { border-left-color: #f59e0b; }
.qc.spark  { border-left-color: #fbbf24; }
.qc.health { border-left-color: #10b981; }

@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }

/* ── Terminal lines ────────────────────────────────────── */
.tline {
  margin-bottom: 14px;
  animation: line-in 0.25s ease-out;
}
@keyframes line-in {
  from { opacity: 0; transform: translateX(-4px); }
  to   { opacity: 1; transform: translateX(0); }
}

/* User prompt line */
.prompt-line {
  font-family: 'JetBrains Mono', 'Sarasa Mono SC', 'PingFang SC', 'Microsoft YaHei', monospace;
  font-size: 13.5px;
  line-height: 1.6;
  word-break: break-word;
  padding: 4px 0;
}
.pl-user   { color: #5eead4; font-weight: 600; }
.pl-colon  { color: #9ca3af; }
.pl-path   { color: #14b8a6; }
.pl-dollar { color: #fbbf24; font-weight: 700; margin: 0 10px 0 2px; }
.pl-text   { color: #e6edf3; }

/* Agent response */
.agent-line {
  display: flex;
  gap: 14px;
  padding: 6px 0 8px;
}
.al-rail {
  width: 2px;
  flex-shrink: 0;
  background: linear-gradient(180deg, #14b8a6 0%, rgba(20,184,166,0.3) 100%);
  border-radius: 1px;
  align-self: stretch;
}
.rail-active {
  background: linear-gradient(180deg, #fbbf24 0%, #14b8a6 100%);
  box-shadow: 0 0 8px rgba(251,191,36,0.5);
  animation: rail-pulse 1.2s ease-in-out infinite;
}
@keyframes rail-pulse {
  0%,100% { opacity: 0.6; }
  50%     { opacity: 1; }
}
.al-body { flex: 1; min-width: 0; }

.al-head {
  display: flex; align-items: center; gap: 8px;
  font-family: 'JetBrains Mono', 'Sarasa Mono SC', 'PingFang SC', 'Microsoft YaHei', monospace;
  font-size: 11px;
  color: #9ca3af;
  margin-bottom: 6px;
  letter-spacing: 0.08em;
}
.al-tag { color: #14b8a6; font-weight: 700; }
.al-sep { color: #8b949e; }
.al-status { color: #10b981; }
.al-status.working { color: #fbbf24; animation: pulse-soft 1s infinite; }
@keyframes pulse-soft { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
.al-actions { margin-left: auto; display: flex; gap: 4px; }
.tic-btn {
  width: 22px; height: 20px;
  border: 1px solid rgba(20,184,166,0.25);
  background: transparent;
  color: #5eead4;
  cursor: pointer;
  border-radius: 2px;
  font-size: 12px;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
  padding: 0;
}
.tic-btn:hover {
  background: rgba(20,184,166,0.12);
  border-color: #14b8a6;
  color: #fbbf24;
}

.al-content {
  color: #c9d1d9;
  font-family: 'DM Sans', -apple-system, sans-serif;
  font-size: 14px;
  line-height: 1.75;
  padding: 2px 0 4px;
}
.al-content :deep(code) {
  font-family: 'JetBrains Mono', 'Sarasa Mono SC', 'PingFang SC', 'Microsoft YaHei', monospace;
  background: rgba(20,184,166,0.1);
  padding: 1px 6px;
  border-radius: 2px;
  font-size: 12.5px;
  color: #5eead4;
}

.al-skills { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
.sk-chip {
  font-family: 'JetBrains Mono', 'Sarasa Mono SC', 'PingFang SC', 'Microsoft YaHei', monospace;
  font-size: 10.5px;
  color: #5eead4;
  background: rgba(20,184,166,0.08);
  border: 1px solid rgba(20,184,166,0.25);
  padding: 1px 7px;
  border-radius: 2px;
  letter-spacing: 0.04em;
}

/* ── Exec log ──────────────────────────────────────────── */
.exec-log {
  background: rgba(10,14,20,0.6);
  border: 1px dashed rgba(20,184,166,0.2);
  border-radius: 2px;
  padding: 8px 12px;
  margin-bottom: 10px;
  font-family: 'JetBrains Mono', 'Sarasa Mono SC', 'PingFang SC', 'Microsoft YaHei', monospace;
  font-size: 11.5px;
  line-height: 1.9;
}
.exec-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  color: #8b949e;
}
.ex-tag {
  font-weight: 700;
  flex-shrink: 0;
  font-size: 10.5px;
  letter-spacing: 0.04em;
}
.exec-row.success .ex-tag { color: #10b981; }
.exec-row.error   .ex-tag { color: #ef4444; }
.exec-row.warning .ex-tag { color: #fbbf24; }
.exec-row.running .ex-tag { color: #14b8a6; animation: pulse-soft 1s infinite; }
.ex-name { color: #e6edf3; font-weight: 600; flex-shrink: 0; }
.ex-arrow { color: #8b949e; }
.ex-desc { color: #8b949e; overflow: hidden; text-overflow: ellipsis; }

/* ── Typing indicator ──────────────────────────────────── */
.term-typing {
  display: flex; gap: 2px;
  font-family: 'JetBrains Mono', 'Sarasa Mono SC', 'PingFang SC', 'Microsoft YaHei', monospace;
  color: #14b8a6;
  font-size: 14px;
  padding: 2px 0;
}
.term-typing span {
  animation: type-block 0.9s ease-in-out infinite;
}
.term-typing span:nth-child(2) { animation-delay: 0.1s; }
.term-typing span:nth-child(3) { animation-delay: 0.2s; }
.term-typing span:nth-child(4) { animation-delay: 0.3s; }
@keyframes type-block {
  0%,100% { opacity: 0.2; transform: translateY(0); }
  50%     { opacity: 1;   transform: translateY(-2px); }
}

/* ── Input bar ─────────────────────────────────────────── */
.term-input {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  background: #0d1117;
  border-top: 1px solid rgba(20,184,166,0.25);
  font-family: 'JetBrains Mono', 'Sarasa Mono SC', 'PingFang SC', 'Microsoft YaHei', monospace;
  z-index: 2; position: relative;
}
.term-input::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(20,184,166,0.6), transparent);
}
.ti-prompt {
  font-size: 13px;
  white-space: nowrap;
  padding: 6px 0;
  flex-shrink: 0;
}
.tp-user   { color: #5eead4; font-weight: 600; }
.tp-colon  { color: #9ca3af; }
.tp-path   { color: #14b8a6; }
.tp-dollar { color: #fbbf24; font-weight: 700; margin: 0 6px 0 2px; }

.ti-textarea {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  font-family: 'JetBrains Mono', 'Sarasa Mono SC', 'PingFang SC', 'Microsoft YaHei', monospace;
  font-size: 13px;
  color: #e6edf3;
  line-height: 1.6;
  padding: 6px 0;
  min-height: 28px;
  max-height: 140px;
  caret-color: #14b8a6;
}
.ti-textarea::placeholder { color: #8b949e; font-style: italic; }
.ti-textarea:disabled { opacity: 0.5; cursor: not-allowed; }

.ti-run {
  padding: 6px 14px;
  background: transparent;
  border: 1px solid #14b8a6;
  color: #5eead4;
  font-family: 'JetBrains Mono', 'Sarasa Mono SC', 'PingFang SC', 'Microsoft YaHei', monospace;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
  align-self: flex-start;
  min-width: 72px;
  display: flex; align-items: center; justify-content: center;
}
.ti-run:hover:not(:disabled) {
  background: rgba(20,184,166,0.12);
  box-shadow: 0 0 12px rgba(20,184,166,0.4);
  color: #fbbf24;
  border-color: #fbbf24;
}
.ti-run:disabled { opacity: 0.35; cursor: not-allowed; }
.ti-spin {
  width: 12px; height: 12px;
  border: 2px solid rgba(94,234,212,0.3);
  border-top-color: #14b8a6;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* 工具选择器 */
.tool-selector {
  padding: 0 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.selector-tip {
  padding: 12px 16px;
  background: var(--bg-hover);
  border-radius: var(--radius-sm);
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
  border-radius: var(--radius-md);
  cursor: pointer;
}

[data-theme="dark"] .tool-item {
  background: var(--bg-hover);
}

.tool-item:hover {
  border-color: var(--accent);
}

.tool-item.selected {
  background: var(--tag-blue-bg);
  border-color: var(--accent);
}

[data-theme="dark"] .tool-item.selected {
  background: var(--tag-blue-bg);
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
  border-color: var(--border-color);
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
  border-top: var(--border-weak-line);
  margin-top: 16px;
}

.tag-green {
  display: inline-block;
  padding: 2px 8px;
  background: var(--tag-green-bg);
  color: var(--tag-green-text);
  border-radius: var(--radius-sm);
  font-size: 11px;
}

</style>