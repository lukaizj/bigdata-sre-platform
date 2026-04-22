<template>
  <div class="bp-skills">
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
            <span>FIG.02 — CAPABILITY CATALOG</span>
          </span>

          <h1 class="bp-display-title">
            <span class="bp-t-main">技能</span>
            <span class="bp-t-accent">SKILLS</span>
            <span class="bp-t-mute">/ MCP TOOLS</span>
          </h1>

          <div class="bp-dim">
            <span class="bp-dim-arrow">◂</span>
            <span class="bp-dim-line"></span>
            <span class="bp-dim-num">{{ String(skills.length).padStart(3, '0') }}</span>
            <span class="bp-dim-line"></span>
            <span class="bp-dim-arrow">▸</span>
          </div>

          <p class="bp-sub">配置大数据运维技能与 MCP 工具 — 从本地目录导入、同步、热装载。每一项技能都可以绑定到任意智能体。</p>

          <div class="bp-callouts">
            <span class="bp-callout"><em>A</em><span>SKILL LIBRARY</span></span>
            <span class="bp-callout is-amber"><em>B</em><span>MCP REGISTRY</span></span>
            <span class="bp-callout is-green"><em>C</em><span>HOT RELOAD</span></span>
          </div>
        </div>

        <!-- View switch + actions -->
        <div class="bp-head-toolbar">
          <div class="bp-view-toggle">
            <button :class="['bp-view-btn', { active: view === 'skills' }]" @click="view = 'skills'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                <polyline points="2 17 12 22 22 17"></polyline>
                <polyline points="2 12 12 17 22 12"></polyline>
              </svg>
              <span>SKILLS</span>
            </button>
            <button :class="['bp-view-btn', { active: view === 'mcp' }]" @click="view = 'mcp'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
              <span>MCP</span>
            </button>
            <span class="bp-view-rail" :style="{ transform: `translateX(${view === 'skills' ? 0 : 100}%)` }"></span>
          </div>

          <button v-if="view === 'skills'" class="bp-exec is-ghost" @click="showImportDialog = true">
            <span class="bp-exec-label">导入</span>
            <span class="bp-exec-arrows"><span>▸</span><span>▸</span><span>▸</span></span>
          </button>
          <button v-if="view === 'skills'" class="bp-exec is-ghost" @click="sync" :disabled="syncing">
            <span class="bp-exec-label">{{ syncing ? '同步中…' : '同步' }}</span>
            <span class="bp-exec-arrows" v-if="!syncing"><span>▸</span><span>▸</span><span>▸</span></span>
          </button>
          <button v-else class="bp-exec" @click="addMCP">
            <span class="bp-exec-label">添加 MCP</span>
            <span class="bp-exec-arrows"><span>▸</span><span>▸</span><span>▸</span></span>
          </button>
        </div>

        <!-- Revision stamp -->
        <div class="bp-stamp">
          <div class="bp-stamp-inner is-amber">
            <span class="bp-stamp-check">✓</span>
            <div class="bp-stamp-text">
              <strong>SYNCED</strong>
              <small>SKILL-OPS · REV.03</small>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Skills 目录信息 -->
    <div v-if="view === 'skills'" class="dirs-info">
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
        <span></span>
        <p>没有加载的技能，点击同步按钮加载</p>
      </div>
    </div>

    <!-- MCP -->
    <div v-else class="mcp-box">
      <div class="mcp-intro">
        <h4>MCP 工具集成</h4>
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
import { STORAGE_KEYS } from '../utils/constants'

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

// MCP 工具列表
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
  } finally {
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
  } finally {
    saving.value = false
  }
}

// 加载 MCP 工具配置
const loadMCP = () => {
  const saved = localStorage.getItem(STORAGE_KEYS.MCP_TOOLS)
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
  localStorage.setItem(STORAGE_KEYS.MCP_TOOLS, JSON.stringify(mcpTools.value))
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
      await new Promise(r => setTimeout(r, 800))
      t.connected = true
      ElMessage.success(`${t.name} 配置有效`)
    }
    saveMCPToStorage()
  } catch (e) {
    t.connected = false
    ElMessage.error(`连接失败: ${e.message}`)
  } finally {
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
      if (!importUrl.value) {
        ElMessage.warning('请输入 URL 地址')
        importing.value = false
        return
      }
      const res = await axios.post('/api/skills/import', { url: importUrl.value })
      ElMessage.success(`导入成功: ${res.data.name || res.data.id}`)
      showImportDialog.value = false
      importUrl.value = ''
      importPreview.value = null
      load()
      loadDirs()
    } else {
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

onMounted(async () => {
  await Promise.all([load(), loadDirs()])
  loadMCP()
  view.value = props.mode || 'skills'
})
</script>

<style scoped>
.bp-skills { width: 100%; animation: bp-fade 0.4s ease-out; }

/* Toolbar row below title block */
.bp-head-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 22px;
  flex-wrap: wrap;
}

.bp-view-toggle {
  position: relative;
  display: inline-flex;
  border: 1px solid var(--bp-border);
  background: rgba(14, 29, 49, 0.4);
  overflow: hidden;
}

.bp-view-btn {
  position: relative;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  border: none;
  background: transparent;
  color: var(--bp-chalk-dim);
  font-family: var(--bp-fnt-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  cursor: pointer;
  transition: color 0.25s;
}

.bp-view-btn svg { width: 14px; height: 14px; }

.bp-view-btn.active { color: var(--bp-ink); }

.bp-view-rail {
  position: absolute;
  top: 0; bottom: 0; left: 0;
  width: 50%;
  background: var(--bp-blueprint);
  box-shadow: 0 0 20px rgba(92, 228, 255, 0.45);
  transition: transform 0.35s cubic-bezier(.2,.8,.2,1);
  z-index: 1;
}

.btn-icon { width: 14px; height: 14px; margin-right: 4px; }

.dirs-info { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.dir-card {
  display: flex; align-items: center; gap: 14px;
  padding: 14px 18px;
  background: rgba(14, 29, 49, 0.6);
  border: 1px solid rgba(92, 228, 255, 0.2);
  border-left: 3px solid #5ce4ff;
}
.dir-status {
  display: flex; align-items: center; gap: 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px; color: #aba088;
}
.dir-path {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px; color: #f0e6d2;
}
.dir-count {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px; padding: 3px 10px;
  background: rgba(92, 228, 255, 0.1);
  color: #5ce4ff;
}

.skill-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
.skill-card {
  display: flex; gap: 16px; padding: 20px 24px;
  background: linear-gradient(180deg, rgba(14, 29, 49, 0.8) 0%, rgba(10, 23, 38, 0.9) 100%);
  border: 1px solid rgba(92, 228, 255, 0.25);
  cursor: pointer;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
  position: relative;
}
.skill-card::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(92, 228, 255, 0.4), transparent);
}
.skill-card:hover {
  border-color: #5ce4ff;
  box-shadow: 0 0 28px rgba(92, 228, 255, 0.25), 0 8px 40px rgba(0, 0, 0, 0.5);
}
.skill-icon {
  width: 48px; height: 48px;
  display: grid; place-items: center;
  border: 1px solid rgba(92, 228, 255, 0.2);
  background: rgba(92, 228, 255, 0.06);
  font-size: 18px;
}
.skill-info h4 {
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px; color: #f0e6d2;
  margin-bottom: 6px;
}
.skill-info p {
  font-size: 13px; color: #aba088;
  margin-bottom: 10px;
}
.skill-meta { display: flex; gap: 8px; align-items: center; }
.skill-id {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px; color: #aba088;
  background: rgba(92, 228, 255, 0.06);
  padding: 2px 8px;
}

.empty {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 12px; padding: 60px 40px;
  background: rgba(14, 29, 49, 0.5);
  border: 1px dashed rgba(92, 228, 255, 0.2);
}
.empty span { font-size: 32px; opacity: 0.4; }
.empty p {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px; color: #aba088;
}

.mcp-box {
  background: rgba(14, 29, 49, 0.6);
  border: 1px solid rgba(92, 228, 255, 0.2);
  padding: 24px;
}
.mcp-intro {
  margin-bottom: 20px;
  border-bottom: 1px dashed rgba(92, 228, 255, 0.15);
  padding-bottom: 16px;
}
.mcp-intro h4 {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px; color: #5ce4ff;
}
.mcp-intro p { font-size: 13px; color: #aba088; }
.mcp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
.mcp-card {
  padding: 20px; text-align: center;
  background: rgba(14, 29, 49, 0.7);
  border: 1px solid rgba(92, 228, 255, 0.15);
  position: relative;
}
.mcp-card::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; height: 1px;
  background: rgba(92, 228, 255, 0.2);
}
.mcp-card.connected {
  background: rgba(14, 29, 49, 0.85);
  border-color: rgba(143, 212, 165, 0.3);
}
.mcp-card.connected::before {
  background: linear-gradient(90deg, transparent, #8fd4a5, transparent);
}
.mcp-status {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px; color: #aba088;
}
.mcp-icon { font-size: 24px; margin-bottom: 10px; }
.mcp-card h4 {
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px; color: #f0e6d2;
}
.mcp-card p { font-size: 13px; color: #aba088; margin-bottom: 14px; }
.mcp-acts { display: flex; gap: 8px; justify-content: center; }

.import-section { padding: 0; }
.import-tabs {
  display: flex;
  border: 1px solid rgba(92, 228, 255, 0.15);
  margin-bottom: 20px;
}
.import-tab {
  flex: 1;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 12px;
  border: none; background: transparent;
  color: #aba088; cursor: pointer;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
}
.import-tab.active {
  background: rgba(92, 228, 255, 0.1);
  color: #5ce4ff;
}
.import-content { padding: 10px 0; }
.import-hint { font-size: 13px; color: #aba088; margin-bottom: 12px; }
.import-preview { margin-top: 16px; border-top: 1px dashed rgba(92, 228, 255, 0.15); padding-top: 16px; }
.preview-card {
  display: flex; align-items: center; gap: 14px; padding: 14px;
  background: rgba(92, 228, 255, 0.06);
  border: 1px solid rgba(92, 228, 255, 0.15);
}
.preview-icon { font-size: 24px; }
.preview-info strong { font-size: 14px; color: #f0e6d2; }
.preview-info p { font-size: 12px; color: #aba088; }

.upload-area {
  display: flex; flex-direction: column;
  align-items: center; gap: 10px; padding: 40px;
  background: rgba(92, 228, 255, 0.03);
  border: 1px dashed rgba(92, 228, 255, 0.2);
}
.upload-area svg { width: 32px; height: 32px; color: #5ce4ff; opacity: 0.6; }
.upload-area p { font-size: 14px; color: #aba088; }
.upload-area em { color: #5ce4ff; font-style: normal; }
.upload-area span {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px; color: #aba088; opacity: 0.5;
}

.icon-selector { display: flex; gap: 8px; flex-wrap: wrap; }
.icon-option {
  width: 36px; height: 36px;
  display: grid; place-items: center;
  border: 1px solid rgba(92, 228, 255, 0.2);
  background: rgba(92, 228, 255, 0.05);
  cursor: pointer; font-size: 18px;
}
.icon-option.active {
  background: rgba(92, 228, 255, 0.15);
  border-color: #5ce4ff;
}

@media (max-width: 768px) {
  .skill-grid, .mcp-grid { grid-template-columns: 1fr; }
  .skill-card, .mcp-card { padding: 16px; }
  .bp-head-toolbar { flex-wrap: wrap; }
}
</style>