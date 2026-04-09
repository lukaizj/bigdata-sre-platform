<template>
  <div class="agent-page">
    <div class="page-header">
      <div>
        <h3>智能体管理</h3>
        <p>创建和配置 AI 智能体</p>
      </div>
      <el-button type="primary" @click="showCreate">✨ 创建智能体</el-button>
    </div>

    <div class="agent-list">
      <div v-for="a in agents" :key="a.id" class="agent-card">
        <div class="agent-avatar">🤖</div>
        <div class="agent-info">
          <h4>{{ a.name }}</h4>
          <p>{{ a.description || '暂无描述' }}</p>
          <div class="agent-skills">
            <span v-for="s in a.skills?.slice(0,3)" :key="s" class="tag-green">{{ s }}</span>
            <span v-if="a.skills?.length > 3" class="tag-teal">+{{ a.skills.length - 3 }}</span>
          </div>
        </div>
        <div class="agent-acts">
          <el-button size="small" @click="edit(a)">编辑</el-button>
          <el-button size="small" type="danger" @click="del(a)">删除</el-button>
        </div>
      </div>
      <div v-if="!agents.length" class="empty">
        <span>🤖</span>
        <p>还没有智能体</p>
      </div>
    </div>

    <el-dialog v-model="dialog" :title="isEdit ? '编辑' : '创建'" width="480px">
      <el-form :model="form" label-position="top">
        <el-form-item label="名称" required>
          <el-input v-model="form.name" placeholder="智能体名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="技能">
          <el-checkbox-group v-model="form.skills">
            <el-checkbox v-for="s in allSkills" :key="s.id" :label="s.id">{{ s.name }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog = false">取消</el-button>
        <el-button type="primary" @click="save" :loading="saving">保存</el-button>
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
.agent-page { width: 100%; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.page-header h3 { font-size: 22px; font-weight: 700; color: var(--text-primary); margin-bottom: 2px; }
.page-header p { font-size: 14px; color: var(--text-muted); }
.agent-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 16px; }
.agent-card { display: flex; gap: 16px; padding: 20px; background: var(--bg-card); border: var(--border-light); border-radius: 14px; transition: all 0.2s ease; }
.agent-card:hover { border-color: var(--accent); box-shadow: var(--shadow-glow); }
.agent-card:hover { border-color: var(--accent); }
.agent-avatar { width: 48px; height: 48px; background: var(--gradient-primary); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 24px; color: white; flex-shrink: 0; }
.agent-info { flex: 1; min-width: 0; }
.agent-info h4 { font-size: 16px; font-weight: 600; color: var(--text-primary); margin-bottom: 2px; }
.agent-info p { font-size: 13px; color: var(--text-muted); margin-bottom: 10px; }
.agent-skills { display: flex; gap: 6px; flex-wrap: wrap; }
.agent-acts { display: flex; flex-direction: column; gap: 6px; }
.empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px; background: var(--bg-card); border: var(--border-light); border-radius: 14px; color: var(--text-muted); }
.empty span { font-size: 40px; margin-bottom: 12px; opacity: .5; }
</style>