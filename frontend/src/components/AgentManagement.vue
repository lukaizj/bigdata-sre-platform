<template>
  <div class="bp-agents">
    <!-- ╭── Page Header · LoginPage title block ──╮ -->
    <header class="bp-page-head">
      <!-- Margin ruler -->
      <aside class="bp-margin-ruler">
        <span class="bp-margin-tick" v-for="n in ['01','02','03','04','05']" :key="n">
          <em>{{ n }}</em><i></i>
        </span>
      </aside>

      <div class="bp-page-head-body">
        <div class="bp-title-block">
          <span class="bp-eyebrow">
            <i class="bp-eyebrow-bar"></i>
            <span>AGENT REGISTRY</span>
          </span>

          <h1 class="bp-display-title">
            <span class="bp-t-main">智能体</span>
            <span class="bp-t-accent">AGENTS</span>
            <span class="bp-t-mute">/ REGISTRY</span>
          </h1>

          <div class="bp-dim">
            <span class="bp-dim-arrow">◂</span>
            <span class="bp-dim-line"></span>
            <span class="bp-dim-num">{{ String(agents.length).padStart(3, '0') }}</span>
            <span class="bp-dim-line"></span>
            <span class="bp-dim-arrow">▸</span>
          </div>

          <p class="bp-sub">编排多个 AI 智能体 — 每一个绑定若干技能集，面向具体运维场景装配。</p>

          <div class="bp-callouts">
            <span class="bp-callout"><em>A</em><span>CREATE · EDIT · REMOVE</span></span>
            <span class="bp-callout is-amber"><em>B</em><span>SKILL BINDING</span></span>
            <span class="bp-callout is-green"><em>C</em><span>RUNTIME READY</span></span>
          </div>
        </div>

        <!-- Action button -->
        <button class="bp-exec bp-head-exec" @click="showCreate">
          <span class="bp-exec-label">创建智能体</span>
          <span class="bp-exec-arrows"><span>▸</span><span>▸</span><span>▸</span></span>
        </button>

        <!-- Revision stamp -->
        <div class="bp-stamp">
          <div class="bp-stamp-inner is-blue">
            <span class="bp-stamp-check">✓</span>
            <div class="bp-stamp-text">
              <strong>LIVE</strong>
              <small>AI-OPS · REV.07</small>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- ╭── Agent List ──╮ -->
    <section class="bp-list-section">
      <div class="bp-list-grid">
        <div
          v-for="(a, idx) in agents"
          :key="a.id"
          class="bp-agent-card"
        >
          <!-- Corner ticks -->
          <span class="bp-card-tick-tl"></span>
          <span class="bp-card-tick-tr"></span>
          <span class="bp-card-tick-bl"></span>
          <span class="bp-card-tick-br"></span>

          <!-- Card number -->
          <span class="bp-card-num">{{ String(idx + 1).padStart(2, '0') }}</span>

          <!-- Avatar -->
          <div class="bp-agent-avatar">
            <span>AI</span>
          </div>

          <!-- Info -->
          <div class="bp-agent-info">
            <h4 class="bp-agent-name">{{ a.name }}</h4>
            <p class="bp-agent-desc">{{ a.description || '暂无描述' }}</p>

            <!-- Skills tags -->
            <div class="bp-agent-skills">
              <span v-for="s in a.skills?.slice(0, 3)" :key="s" class="bp-tag">
                <span class="bp-tag-num">◆</span>
                <span>{{ s }}</span>
              </span>
              <span v-if="a.skills?.length > 3" class="bp-tag bp-tag-amber">
                <span>+{{ a.skills.length - 3 }}</span>
              </span>
            </div>
          </div>

          <!-- Actions -->
          <div class="bp-agent-acts">
            <button class="bp-btn" @click="edit(a)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              <span>编辑</span>
            </button>
            <button class="bp-btn bp-btn-danger" @click="del(a)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
              <span>删除</span>
            </button>
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="!agents.length" class="bp-empty-state">
          <span class="bp-empty-code">[ NO_AGENTS_FOUND ]</span>
          <span class="bp-empty-msg">还没有创建任何智能体</span>
          <button class="bp-btn-primary" @click="showCreate">
            <span>创建第一个</span>
            <span class="bp-btn-arrow">▸</span>
          </button>
        </div>
      </div>
    </section>

    <!-- ╭── Create/Edit Dialog ──╮ -->
    <el-dialog v-model="dialog" width="520px" class="bp-dialog">
      <template #header>
        <div class="bp-dialog-head">
          <span class="bp-dialog-k">{{ isEdit ? 'EDIT' : 'CREATE' }}</span>
          <span class="bp-dialog-v">{{ isEdit ? '编辑智能体' : '创建智能体' }}</span>
        </div>
      </template>

      <el-form :model="form" label-position="top" class="bp-form">
        <div class="bp-field">
          <label class="bp-label">
            <span class="bp-label-k">01</span>
            <span class="bp-label-v">名称 · NAME</span>
          </label>
          <div class="bp-input-wrap">
            <input v-model="form.name" type="text" placeholder="请输入智能体名称" class="bp-input" required />
          </div>
        </div>

        <div class="bp-field">
          <label class="bp-label">
            <span class="bp-label-k">02</span>
            <span class="bp-label-v">描述 · DESC</span>
          </label>
          <div class="bp-input-wrap bp-textarea-wrap">
            <textarea v-model="form.description" placeholder="请输入描述（可选）" rows="2" class="bp-input bp-textarea"></textarea>
          </div>
        </div>

        <div class="bp-field">
          <label class="bp-label">
            <span class="bp-label-k">03</span>
            <span class="bp-label-v">技能 · SKILLS</span>
          </label>
          <div class="bp-skills-select">
            <div
              v-for="s in allSkills"
              :key="s.id"
              :class="['bp-skill-item', { selected: form.skills.includes(s.id) }]"
              @click="toggleSkill(s.id)"
            >
              <span class="bp-skill-check">
                <svg v-if="form.skills.includes(s.id)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </span>
              <span class="bp-skill-name">{{ s.name }}</span>
            </div>
          </div>
        </div>
      </el-form>

      <template #footer>
        <div class="bp-dialog-footer">
          <button class="bp-btn" @click="dialog = false">取消</button>
          <button class="bp-btn-primary" @click="save" :disabled="saving">
            <span v-if="saving">保存中...</span>
            <span v-else>保存</span>
            <span v-if="!saving" class="bp-btn-arrow">▸</span>
          </button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const agents = ref([])
const allSkills = ref([])
const dialog = ref(false)
const isEdit = ref(false)
const saving = ref(false)
const editId = ref(null)
const form = ref({ name: '', description: '', skills: [] })

const load = async () => {
  try {
    const [a, s] = await Promise.all([axios.get('/api/agents'), axios.get('/api/skills')])
    agents.value = a.data
    allSkills.value = s.data
  } catch (e) { ElMessage.error('加载失败') }
}

const showCreate = () => {
  isEdit.value = false
  editId.value = null
  form.value = { name: '', description: '', skills: [] }
  dialog.value = true
}

const edit = (a) => {
  isEdit.value = true
  editId.value = a.id
  form.value = { name: a.name, description: a.description || '', skills: a.skills || [] }
  dialog.value = true
}

const toggleSkill = (id) => {
  const idx = form.value.skills.indexOf(id)
  if (idx > -1) form.value.skills.splice(idx, 1)
  else form.value.skills.push(id)
}

const save = async () => {
  if (!form.value.name) return ElMessage.warning('请输入名称')
  saving.value = true
  try {
    if (isEdit.value) await axios.put(`/api/agents/${editId.value}`, form.value)
    else await axios.post('/api/agents', form.value)
    ElMessage.success('保存成功')
    dialog.value = false
    load()
  } catch (e) { ElMessage.error('保存失败') }
  finally { saving.value = false }
}

const del = async (a) => {
  try {
    await ElMessageBox.confirm(`删除 "${a.name}"？`, '确认', { type: 'warning' })
    await axios.delete(`/api/agents/${a.id}`)
    ElMessage.success('已删除')
    load()
  } catch (e) {}
}

onMounted(() => load())
</script>

<style scoped>
.bp-agents {
  width: 100%;
  animation: bp-fade 0.4s ease-out;
}

/* ╭── Head-exec positioning ──╮ */
.bp-head-exec {
  margin-top: 18px;
}

.bp-btn-arrow {
  margin-left: 4px;
  opacity: 0.7;
}

/* ╭── Agent List Grid ──╮ */
.bp-list-section {
  padding: 4px;
}

.bp-list-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 16px;
}

/* ╭── Agent Card ──╮ */
.bp-agent-card {
  position: relative;
  display: flex;
  gap: 16px;
  padding: 20px 24px;
  background: linear-gradient(180deg, rgba(14, 29, 49, 0.8) 0%, rgba(10, 23, 38, 0.9) 100%);
  border: 1px solid rgba(92, 228, 255, 0.25);
  transition: all 0.3s ease;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
}

.bp-agent-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(92, 228, 255, 0.4), transparent);
}

.bp-agent-card:hover {
  border-color: var(--bp-blueprint);
  box-shadow: 0 0 28px rgba(92, 228, 255, 0.25), 0 8px 40px rgba(0, 0, 0, 0.5);
}

.bp-card-num {
  position: absolute;
  top: 8px;
  right: 12px;
  font-family: var(--bp-fnt-mono);
  font-size: 10px;
  color: var(--bp-chalk-dim);
  letter-spacing: 0.1em;
  opacity: 0.5;
}

/* Avatar */
.bp-agent-avatar {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border: 1px solid var(--bp-blueprint);
  background: rgba(92, 228, 255, 0.1);
  color: var(--bp-blueprint);
  font-family: var(--bp-fnt-mono);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  flex-shrink: 0;
}

/* Info */
.bp-agent-info {
  flex: 1;
  min-width: 0;
}

.bp-agent-name {
  font-family: var(--bp-fnt-mono);
  font-size: 15px;
  font-weight: 700;
  color: var(--bp-chalk);
  margin-bottom: 6px;
  letter-spacing: 0.04em;
}

.bp-agent-desc {
  font-family: 'Hanken Grotesk', 'PingFang SC', sans-serif;
  font-size: 13px;
  color: var(--bp-chalk-dim);
  margin-bottom: 12px;
  line-height: 1.4;
}

.bp-agent-skills {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

/* Actions */
.bp-agent-acts {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-self: center;
}

.bp-agent-acts .bp-btn {
  padding: 6px 12px;
  font-size: 11px;
}

.bp-agent-acts .bp-btn svg {
  width: 14px;
  height: 14px;
}

/* ╭── Empty State ──╮ */
.bp-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 60px 40px;
  background: rgba(14, 29, 49, 0.5);
  border: 1px dashed rgba(92, 228, 255, 0.2);
}

.bp-empty-code {
  font-family: var(--bp-fnt-mono);
  font-size: 11px;
  color: var(--bp-blueprint);
  letter-spacing: 0.14em;
  opacity: 0.6;
}

.bp-empty-msg {
  font-family: 'Hanken Grotesk', 'PingFang SC', sans-serif;
  font-size: 14px;
  color: var(--bp-chalk-dim);
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

.bp-textarea-wrap {
  padding: 8px 4px;
}

.bp-textarea {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  resize: vertical;
  font-family: var(--bp-fnt-mono);
  font-size: 13px;
  color: var(--bp-chalk);
  line-height: 1.6;
  min-height: 60px;
}

.bp-textarea::placeholder {
  color: var(--bp-chalk-dim);
  opacity: 0.5;
}

/* ╭── Skills Select ──╮ */
.bp-skills-select {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.bp-skill-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: rgba(92, 228, 255, 0.05);
  border: 1px solid rgba(92, 228, 255, 0.15);
  cursor: pointer;
  transition: all 0.2s;
}

.bp-skill-item:hover {
  border-color: rgba(92, 228, 255, 0.3);
}

.bp-skill-item.selected {
  background: rgba(92, 228, 255, 0.12);
  border-color: var(--bp-blueprint);
}

.bp-skill-check {
  width: 16px;
  height: 16px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(92, 228, 255, 0.3);
}

.bp-skill-item.selected .bp-skill-check {
  background: var(--bp-blueprint);
  border-color: var(--bp-blueprint);
}

.bp-skill-check svg {
  width: 10px;
  height: 10px;
  color: var(--bp-ink);
}

.bp-skill-name {
  font-family: 'Hanken Grotesk', 'PingFang SC', sans-serif;
  font-size: 13px;
  color: var(--bp-chalk);
}

/* ╭── Animations ──╮ */
@keyframes bp-fade { from { opacity: 0; } to { opacity: 1; } }

/* ╭── Responsive ──╮ */
@media (max-width: 768px) {
  .bp-list-grid { grid-template-columns: 1fr; }
  .bp-agent-card { padding: 16px; gap: 12px; }
  .bp-agent-avatar { width: 40px; height: 40px; }
  .bp-agent-acts { flex-direction: row; }
}
</style>