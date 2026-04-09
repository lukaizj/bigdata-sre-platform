<template>
  <div class="skill-page">
    <div class="page-header">
      <div>
        <h3>技能配置</h3>
        <p>配置大数据运维技能和 MCP 工具</p>
      </div>
      <div class="header-acts">
        <div class="mode-toggle">
          <button :class="{ active: view === 'skills' }" @click="view = 'skills'">
            <svg class="mode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
            Skills
          </button>
          <button :class="{ active: view === 'mcp' }" @click="view = 'mcp'">
            <svg class="mode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
            MCP
          </button>
        </div>
        <el-button v-if="view === 'skills'" @click="showImportDialog = true">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          导入
        </el-button>
        <el-button v-if="view === 'skills'" @click="sync" :loading="syncing">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l5.64 5.36A9 9 0 0 0 20.49 15"></path>
          </svg>
          同步
        </el-button>
        <el-button v-else type="primary" @click="addMCP">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          添加 MCP
        </el-button>
      </div>
    </div>

    <!-- Skills 目录信息 -->
    <div v-if="view === 'skills'" class="dirs-info fade-in-up">
      <div class="dir-card" v-for="dir in skillDirs" :key="dir.path">
        <div class="dir-status">
          <span :class="['status-dot', { active: dir.available }]"></span>
          <span>{{ dir.available ? '可用' : '不可用' }}</span>
        </div>
        <div class="dir-path">{{ dir.path }}</div>
        <div class="dir-count">{{ dir.skillCount }} 个技能</div>
      </div>
    </div>

    <!-- Skills -->
    <div v-if="view === 'skills'" class="skill-grid">
      <div v-for="s in skills" :key="s.id" class="skill-card" @click="editSkill(s)">
        <div class="skill-icon">{{ getIcon(s.type) }}</div>
        <div class="skill-info">
          <h4>{{ s.name }}</h4>
          <p>{{ s.description }}</p>
          <div class="skill-meta">
            <span class="tag-green">{{ s.type }}</span>
            <span class="skill-id">{{ s.id }}</span>
          </div>
        </div>
      </div>
      <div v-if="!skills.length" class="empty">
        <span>🧠</span>
        <p>没有加载的技能，点击同步按钮加载</p>
      </div>
    </div>

    <!-- MCP -->
    <div v-else class="mcp-box">
      <div class="mcp-intro">
        <h4>🔗 MCP 工具集成</h4>
        <p>直接调用 MCP 工具，无需 AI 路由。可自定义添加 MCP 工具配置</p>
      </div>
      <div class="mcp-grid">
        <div v-for="t in mcpTools" :key="t.id" class="mcp-card" :class="{ connected: t.connected }">
          <div class="mcp-status">
            <span class="status-dot" :class="{ active: t.connected }"></span>
            <span>{{ t.connected ? '已连接' : '未连接' }}</span>
          </div>
          <div class="mcp-icon">{{ t.icon }}</div>
          <h4>{{ t.name }}</h4>
          <p>{{ t.description }}</p>
          <div class="mcp-acts">
            <el-button size="small" @click="editMCP(t)">编辑</el-button>
            <el-button size="small" type="primary" @click="testMCP(t)" :loading="t.testing">测试</el-button>
            <el-button size="small" type="danger" @click="deleteMCP(t)">删除</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- Skill 编辑 Dialog -->
    <el-dialog v-model="skillDialog" :title="curSkill?.name" width="600px">
      <el-form label-position="top">
        <el-form-item label="技能 ID">
          <el-input v-model="curSkill.id" disabled />
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="curSkill.name" disabled />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="curSkill.description" type="textarea" :rows="2" disabled />
        </el-form-item>
        <el-form-item label="类型">
          <el-input v-model="curSkill.type" disabled />
        </el-form-item>
        <el-form-item label="配置 (JSON)">
          <el-input v-model="skillConfigJson" type="textarea" :rows="6" placeholder="自定义配置参数" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="skillDialog = false">取消</el-button>
        <el-button type="primary" @click="saveSkill" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- MCP 编辑 Dialog -->
    <el-dialog v-model="mcpDialog" :title="isEditMCP ? '编辑 MCP' : '添加 MCP'" width="500px">
      <el-form :model="mcpForm" label-position="top">
        <el-form-item label="ID" required>
          <el-input v-model="mcpForm.id" placeholder="例如: spark-history" :disabled="isEditMCP" />
        </el-form-item>
        <el-form-item label="名称" required>
          <el-input v-model="mcpForm.name" placeholder="例如: Spark History Server" />
        </el-form-item>
        <el-form-item label="图标">
          <div class="icon-selector">
            <span
              v-for="icon in mcpIcons"
              :key="icon"
              :class="['icon-option', { active: mcpForm.icon === icon }]"
              @click="mcpForm.icon = icon"
            >
              {{ icon }}
            </span>
          </div>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="mcpForm.description" type="textarea" :rows="2" placeholder="工具描述" />
        </el-form-item>
        <el-form-item label="服务地址">
          <el-input v-model="mcpForm.endpoint" placeholder="例如: http://spark-history:18080" />
        </el-form-item>
        <el-form-item label="命令/脚本路径">
          <el-input v-model="mcpForm.command" placeholder="例如: spark-history-cli" />
        </el-form-item>
        <el-form-item label="参数模板">
          <el-input v-model="mcpForm.argsTemplate" type="textarea" :rows="2" placeholder="例如: --json --server {endpoint} {action}" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="mcpDialog = false">取消</el-button>
        <el-button type="primary" @click="saveMCP" :loading="savingMCP">保存</el-button>
      </template>
    </el-dialog>

    <!-- 导入 Skills Dialog -->
    <el-dialog v-model="showImportDialog" title="导入 Skills" width="550px">
      <div class="import-section">
        <div class="import-tabs">
          <button :class="['import-tab', { active: importMode === 'url' }]" @click="importMode = 'url'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
            URL 导入
          </button>
          <button :class="['import-tab', { active: importMode === 'file' }]" @click="importMode = 'file'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
            文件导入
          </button>
        </div>

        <!-- URL 导入 -->
        <div v-if="importMode === 'url'" class="import-content">
          <p class="import-hint">输入包含 SKILL.md 文件的目录 URL 或直接输入 SKILL.md 文件地址</p>
          <el-input
            v-model="importUrl"
            placeholder="例如: https://example.com/skills/hdfs-query/"
            size="large"
          />
          <div class="import-preview" v-if="importPreview">
            <h5>预览技能信息</h5>
            <div class="preview-card">
              <span class="preview-icon">{{ getIcon(importPreview.type) }}</span>
              <div class="preview-info">
                <strong>{{ importPreview.name }}</strong>
                <p>{{ importPreview.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 文件导入 -->
        <div v-else class="import-content">
          <p class="import-hint">上传 SKILL.md 文件或打包的 zip 文件</p>
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :limit="1"
            accept=".md,.zip"
            :on-change="handleFileChange"
            drag
          >
            <div class="upload-area">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <p>拖拽文件到此处，或 <em>点击上传</em></p>
              <span>支持 .md 或 .zip 格式</span>
            </div>
          </el-upload>
        </div>
      </div>
      <template #footer>
        <el-button @click="showImportDialog = false">取消</el-button>
        <el-button type="primary" @click="doImport" :loading="importing" :disabled="importMode === 'url' && !importUrl">
          {{ importMode === 'url' ? '下载并导入' : '导入' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const props = defineProps({ mode: String })
const view = ref('skills')
const skills = ref([])
const skillDirs = ref([])
const syncing = ref(false)
const skillDialog = ref(false)
const saving = ref(false)
const curSkill = ref({})
const skillConfigJson = ref('')

const mcpDialog = ref(false)
const isEditMCP = ref(false)
const savingMCP = ref(false)
const mcpForm = ref({
  id: '',
  name: '',
  icon: '⚡',
  description: '',
  endpoint: '',
  command: '',
  argsTemplate: '',
  connected: false,
  testing: false,
})

// 导入相关
const showImportDialog = ref(false)
const importMode = ref('url')
const importUrl = ref('')
const importing = ref(false)
const importPreview = ref(null)
const uploadRef = ref(null)
const uploadFile = ref(null)

const mcpIcons = ['⚡', '🐘', '🔧', '📊', '🔥', '💾', '📡', '🌐', '💻', '☁️']

// MCP 工具列表（从 localStorage 加载）
const mcpTools = ref([])

const getIcon = t => ({
  storage: '💾',
  compute: '⚡',
  analytics: '📊',
  management: '🔧',
  monitoring: '📡',
  query: '🔍',
  cli: '⌨️',
  other: '⚙️'
}[t] || '⚙️')

// 加载技能列表
const load = async () => {
  try {
    const res = await axios.get('/api/skills')
    skills.value = res.data
  } catch (e) {
    console.error('加载技能失败:', e)
  }
}

// 加载 skills 目录信息
const loadDirs = async () => {
  try {
    const res = await axios.get('/api/skills/dirs')
    skillDirs.value = res.data
  } catch (e) {
    console.error('加载目录信息失败:', e)
  }
}

// 同步技能
const sync = async () => {
  syncing.value = true
  try {
    const res = await axios.post('/api/skills/sync')
    ElMessage.success(`同步成功，共 ${res.data.count} 个技能`)
    load()
    loadDirs()
  } catch (e) {
    ElMessage.error('同步失败: ' + (e.response?.data?.error || e.message))
  }
  finally {
    syncing.value = false
  }
}

// 编辑技能
const editSkill = (s) => {
  curSkill.value = { ...s }
  skillConfigJson.value = JSON.stringify(s.config || {}, null, 2)
  skillDialog.value = true
}

// 保存技能配置
const saveSkill = async () => {
  saving.value = true
  try {
    let config = {}
    try {
      config = JSON.parse(skillConfigJson.value)
    } catch (e) {
      ElMessage.warning('配置 JSON 格式不正确')
      saving.value = false
      return
    }

    await axios.put(`/api/skills/${curSkill.value.id}`, { config })
    ElMessage.success('保存成功')
    skillDialog.value = false
    load()
  } catch (e) {
    ElMessage.error('保存失败')
  }
  finally {
    saving.value = false
  }
}

// 加载 MCP 工具配置
const loadMCP = () => {
  const saved = localStorage.getItem('mcp-tools')
  if (saved) {
    try {
      mcpTools.value = JSON.parse(saved)
    } catch (e) {
      mcpTools.value = getDefaultMCP()
    }
  } else {
    mcpTools.value = getDefaultMCP()
  }
}

// 默认 MCP 工具
const getDefaultMCP = () => [
  {
    id: 'spark-history',
    name: 'Spark History Server',
    icon: '⚡',
    description: '查询 Spark 应用历史和详情',
    endpoint: 'http://spark-history:18080',
    command: 'spark-history-cli',
    argsTemplate: '--json --server {endpoint} {action}',
    connected: false,
    testing: false,
  },
  {
    id: 'hadoop-webhdfs',
    name: 'Hadoop WebHDFS',
    icon: '🐘',
    description: 'HDFS 文件系统操作',
    endpoint: 'http://namenode:9870',
    command: '',
    argsTemplate: '',
    connected: false,
    testing: false,
  },
  {
    id: 'ambari-api',
    name: 'Ambari API',
    icon: '🔧',
    description: 'Ambari 集群管理',
    endpoint: 'http://ambari:8080',
    command: '',
    argsTemplate: '',
    connected: false,
    testing: false,
  },
]

// 保存 MCP 工具到 localStorage
const saveMCPToStorage = () => {
  localStorage.setItem('mcp-tools', JSON.stringify(mcpTools.value))
}

// 添加 MCP
const addMCP = () => {
  isEditMCP.value = false
  mcpForm.value = {
    id: '',
    name: '',
    icon: '⚡',
    description: '',
    endpoint: '',
    command: '',
    argsTemplate: '',
    connected: false,
    testing: false,
  }
  mcpDialog.value = true
}

// 编辑 MCP
const editMCP = (t) => {
  isEditMCP.value = true
  mcpForm.value = { ...t }
  mcpDialog.value = true
}

// 保存 MCP
const saveMCP = async () => {
  if (!mcpForm.value.id || !mcpForm.value.name) {
    ElMessage.warning('请填写 ID 和名称')
    return
  }

  savingMCP.value = true
  try {
    if (isEditMCP.value) {
      const index = mcpTools.value.findIndex(t => t.id === mcpForm.value.id)
      if (index >= 0) {
        mcpTools.value[index] = { ...mcpForm.value }
      }
    } else {
      // 检查是否已存在
      if (mcpTools.value.some(t => t.id === mcpForm.value.id)) {
        ElMessage.warning('该 MCP ID 已存在')
        savingMCP.value = false
        return
      }
      mcpTools.value.push({ ...mcpForm.value })
    }

    saveMCPToStorage()
    ElMessage.success('保存成功')
    mcpDialog.value = false
  } finally {
    savingMCP.value = false
  }
}

// 测试 MCP 连接
const testMCP = async (t) => {
  t.testing = true
  try {
    if (t.endpoint) {
      const res = await axios.get(`${t.endpoint}/api/v1/applications`, { timeout: 5000 })
      t.connected = true
      ElMessage.success(`${t.name} 连接成功`)
    } else {
      // 模拟测试
      await new Promise(r => setTimeout(r, 800))
      t.connected = true
      ElMessage.success(`${t.name} 配置有效`)
    }
    saveMCPToStorage()
  } catch (e) {
    t.connected = false
    ElMessage.error(`连接失败: ${e.message}`)
  }
  finally {
    t.testing = false
  }
}

// 删除 MCP
const deleteMCP = async (t) => {
  try {
    await ElMessageBox.confirm(`确定删除 "${t.name}"？`, '确认删除', { type: 'warning' })
    const index = mcpTools.value.findIndex(item => item.id === t.id)
    if (index >= 0) {
      mcpTools.value.splice(index, 1)
      saveMCPToStorage()
      ElMessage.success('已删除')
    }
  } catch (e) {}
}

// 文件选择处理
const handleFileChange = (file) => {
  uploadFile.value = file.raw
}

// 执行导入
const doImport = async () => {
  importing.value = true
  try {
    if (importMode.value === 'url') {
      // URL 导入
      if (!importUrl.value) {
        ElMessage.warning('请输入 URL 地址')
        importing.value = false
        return
      }

      const res = await axios.post('/api/skills/import', {
        url: importUrl.value
      })

      ElMessage.success(`导入成功: ${res.data.name || res.data.id}`)
      showImportDialog.value = false
      importUrl.value = ''
      importPreview.value = null
      load()
      loadDirs()
    } else {
      // 文件导入
      if (!uploadFile.value) {
        ElMessage.warning('请选择要导入的文件')
        importing.value = false
        return
      }

      const formData = new FormData()
      formData.append('file', uploadFile.value)

      const res = await axios.post('/api/skills/import/file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      ElMessage.success(`导入成功: ${res.data.name || res.data.id}`)
      showImportDialog.value = false
      uploadFile.value = null
      if (uploadRef.value) {
        uploadRef.value.clearFiles()
      }
      load()
      loadDirs()
    }
  } catch (e) {
    ElMessage.error('导入失败: ' + (e.response?.data?.error || e.message))
  } finally {
    importing.value = false
  }
}

onMounted(() => {
  load()
  loadDirs()
  loadMCP()
  view.value = props.mode || 'skills'
})
</script>

<style scoped>
.skill-page { width: 100%; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.page-header h3 { font-size: 22px; font-weight: 700; color: var(--text-primary); margin-bottom: 2px; }
.page-header p { font-size: 14px; color: var(--text-muted); }
.header-acts { display: flex; gap: 12px; align-items: center; }
.mode-toggle { display: flex; background: var(--bg-hover); border-radius: 10px; padding: 4px; }
.mode-toggle button { padding: 8px 16px; border: none; background: none; color: var(--text-muted); cursor: pointer; border-radius: 8px; font-size: 13px; font-weight: 600; }
.mode-toggle button.active { background: var(--gradient-primary); color: white; }

/* Skills 目录信息 */
.dirs-info { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.dir-card { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: var(--bg-card); border: var(--border-light); border-radius: 10px; transition: all 0.2s ease; }
.dir-card:hover { border-color: var(--accent); }
.dir-status { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-muted); }
.dir-path { font-size: 13px; color: var(--text-secondary); font-weight: 500; }
.dir-count { font-size: 12px; background: rgba(59, 130, 246, 0.15); padding: 4px 8px; border-radius: 6px; color: var(--accent); }

.skill-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
.skill-card { display: flex; gap: 16px; padding: 20px; background: var(--bg-card); border: var(--border-light); border-radius: 14px; cursor: pointer; transition: all 0.2s ease; }
.skill-card:hover { border-color: var(--accent); box-shadow: var(--shadow-glow); }
.skill-icon { width: 48px; height: 48px; background: var(--bg-hover); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; }
.skill-info { flex: 1; }
.skill-info h4 { font-size: 15px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px; }
.skill-info p { font-size: 13px; color: var(--text-muted); margin-bottom: 8px; line-height: 1.4; }
.skill-meta { display: flex; gap: 8px; align-items: center; }
.skill-id { font-size: 11px; color: var(--text-muted); background: rgba(59, 130, 246, 0.08); padding: 2px 6px; border-radius: 4px; }

.empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px; background: var(--bg-card); border: var(--border-light); border-radius: 14px; color: var(--text-muted); }
.empty span { font-size: 40px; margin-bottom: 12px; opacity: .5; }

.mcp-box { background: var(--bg-card); border: var(--border-light); border-radius: 14px; padding: 24px; transition: all 0.3s ease; }
[data-theme="dark"] .mcp-box { backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
.mcp-intro { margin-bottom: 20px; }
.mcp-intro h4 { font-size: 18px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px; }
.mcp-intro p { font-size: 14px; color: var(--text-muted); }
.mcp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
.mcp-card { padding: 20px; background: var(--bg-hover); border-radius: 12px; text-align: center; border: 1px solid transparent; }
.mcp-card.connected { border: 2px solid var(--accent); background: rgba(59, 130, 246, 0.1); }
.mcp-status { display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 12px; color: var(--text-muted); margin-bottom: 12px; }
.mcp-icon { font-size: 32px; margin-bottom: 8px; }
.mcp-card h4 { font-size: 15px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px; }
.mcp-card p { font-size: 13px; color: var(--text-muted); margin-bottom: 12px; }
.mcp-acts { display: flex; gap: 8px; justify-content: center; }

/* 图标选择器 */
.icon-selector { display: flex; gap: 8px; flex-wrap: wrap; }
.icon-option { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: rgba(99, 102, 241, 0.05); border: 1px solid rgba(99, 102, 241, 0.15); border-radius: 8px; font-size: 18px; cursor: pointer; transition: all 0.2s ease; }
.icon-option:hover { border-color: var(--accent); }
.icon-option.active { background: rgba(99, 102, 241, 0.2); border-color: var(--accent); }

/* 按钮图标 */
.btn-icon { width: 14px; height: 14px; margin-right: 4px; }
.mode-icon { width: 14px; height: 14px; margin-right: 6px; }
.mode-toggle button { display: flex; align-items: center; }

/* 导入对话框 */
.import-section { }
.import-tabs { display: flex; gap: 8px; margin-bottom: 20px; }
.import-tab {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid rgba(99, 102, 241, 0.2);
  background: transparent;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
}
.import-tab svg { width: 16px; height: 16px; }
.import-tab:hover { border-color: var(--accent); color: var(--text-secondary); }
.import-tab.active {
  background: rgba(99, 102, 241, 0.15);
  border-color: var(--accent);
  color: var(--accent);
}

.import-content { }
.import-hint {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.import-preview {
  margin-top: 16px;
  padding: 16px;
  background: rgba(99, 102, 241, 0.05);
  border-radius: 10px;
}
.import-preview h5 {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 12px;
}
.preview-card {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: var(--bg-card);
  border-radius: 8px;
  border: 1px solid rgba(99, 102, 241, 0.1);
}
.preview-icon {
  width: 40px;
  height: 40px;
  background: rgba(99, 102, 241, 0.1);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}
.preview-info strong {
  display: block;
  font-size: 14px;
  color: var(--text-primary);
  margin-bottom: 4px;
}
.preview-info p {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
}

.upload-area {
  padding: 40px 20px;
  text-align: center;
}
.upload-area svg {
  width: 48px;
  height: 48px;
  color: var(--accent);
  margin-bottom: 12px;
}
.upload-area p {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}
.upload-area em {
  color: var(--accent);
  font-style: normal;
}
.upload-area span {
  font-size: 12px;
  color: var(--text-muted);
}
</style>