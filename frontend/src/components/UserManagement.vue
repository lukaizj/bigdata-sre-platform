<template>
  <div class="user-management">
    <!-- 普通用户：只显示个人信息卡片 -->
    <template v-if="!isAdmin">
      <div class="page-header">
        <h3>个人中心</h3>
        <p>管理您的账户信息</p>
      </div>

      <div class="profile-card glass-card">
        <div class="profile-header">
          <div class="profile-avatar">{{ currentUser?.username?.charAt(0)?.toUpperCase() || 'U' }}</div>
          <div class="profile-info">
            <h4>{{ currentUser?.username }}</h4>
            <span class="profile-email">{{ currentUser?.email }}</span>
          </div>
        </div>

        <div class="profile-details">
          <div class="detail-item">
            <span class="detail-label">角色</span>
            <span class="detail-value">{{ currentUser?.role === 'admin' ? '管理员' : '普通用户' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">注册时间</span>
            <span class="detail-value">{{ formatDate(currentUser?.created_at) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">最后登录</span>
            <span class="detail-value">{{ formatDate(currentUser?.last_login) || '从未登录' }}</span>
          </div>
        </div>

        <div class="profile-actions">
          <button class="btn-primary" @click="editProfile">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            编辑资料
          </button>
          <button class="btn-secondary" @click="changePassword">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            修改密码
          </button>
        </div>
      </div>
    </template>

    <!-- 管理员：显示完整的用户管理界面 -->
    <template v-else>
      <div class="page-header">
        <h3>用户管理</h3>
        <p>管理系统用户账号和权限</p>
      </div>

      <!-- 统计卡片 -->
      <div class="stats-row">
        <div class="stat-card glass-card stat-card-blue">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ users.length }}</span>
            <span class="stat-label">总用户数</span>
          </div>
        </div>
        <div class="stat-card glass-card stat-card-purple">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z"></path>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ adminCount }}</span>
            <span class="stat-label">管理员</span>
          </div>
        </div>
        <div class="stat-card glass-card stat-card-cyan">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ userCount }}</span>
            <span class="stat-label">普通用户</span>
          </div>
        </div>
      </div>

      <!-- 用户列表 -->
      <div class="user-list glass-card">
        <div class="list-header">
          <h4>用户列表</h4>
          <div class="search-box">
            <input
              v-model="searchQuery"
              placeholder="搜索用户名或邮箱..."
              type="text"
            />
          </div>
        </div>

        <div v-if="loading" class="loading-state">
          <span class="spinner"></span>
          <span>加载中...</span>
        </div>

        <div v-else-if="filteredUsers.length === 0" class="empty-state">
          <span>🔍</span>
          <p>没有找到匹配的用户</p>
        </div>

        <div v-else class="user-table">
          <div class="table-header">
            <div class="col-avatar">头像</div>
            <div class="col-name">用户名</div>
            <div class="col-email">邮箱</div>
            <div class="col-role">角色</div>
            <div class="col-date">注册时间</div>
            <div class="col-login">最后登录</div>
            <div class="col-actions">操作</div>
          </div>

          <div
            v-for="user in filteredUsers"
            :key="user.id"
            class="table-row"
            :class="{ 'is-current': user.id === currentUserId }"
          >
            <div class="col-avatar">
              <div class="avatar">{{ user.username?.charAt(0)?.toUpperCase() || 'U' }}</div>
            </div>
            <div class="col-name">
              <span class="username">{{ user.username }}</span>
              <span v-if="user.id === currentUserId" class="badge-you">当前用户</span>
            </div>
            <div class="col-email">{{ user.email }}</div>
            <div class="col-role">
              <span :class="['role-badge', user.role]">
                {{ user.role === 'admin' ? '👑 管理员' : '👤 普通用户' }}
              </span>
            </div>
            <div class="col-date">{{ formatDate(user.created_at) }}</div>
            <div class="col-login">{{ formatDate(user.last_login) || '从未登录' }}</div>
            <div class="col-actions">
              <button class="btn-icon" @click="editUser(user)" title="编辑">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button
                v-if="user.id !== currentUserId"
                class="btn-icon danger"
                @click="confirmDelete(user)"
                title="删除"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 编辑用户弹窗 -->
    <el-dialog v-model="editDialogVisible" title="编辑用户" width="520px">
      <el-form :model="editForm" label-position="top">
        <el-form-item label="用户名">
          <el-input v-model="editForm.username" placeholder="用户名" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="editForm.role" style="width: 100%" @change="onRoleChange">
            <el-option label="👑 管理员" value="admin" />
            <el-option label="👤 普通用户" value="user" />
          </el-select>
        </el-form-item>
        <el-form-item label="重置密码">
          <el-input
            v-model="editForm.password"
            type="password"
            placeholder="留空则不修改密码"
            show-password
          />
        </el-form-item>

        <!-- 权限配置（仅非管理员用户显示） -->
        <el-form-item v-if="editForm.role === 'user'" label="可访问的功能模块">
          <div class="permissions-grid">
            <el-checkbox
              v-for="module in availableModules"
              :key="module.key"
              v-model="editForm.permissions"
              :label="module.key"
            >
              {{ module.label }}
            </el-checkbox>
          </div>
          <div class="permissions-tip">
            未勾选的模块将对该用户隐藏
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveUser">保存</el-button>
      </template>
    </el-dialog>

    <!-- 删除确认弹窗 -->
    <el-dialog v-model="deleteDialogVisible" title="确认删除" width="400px">
      <p style="text-align: center; font-size: 15px;">
        确定要删除用户 <strong>{{ deleteUser?.username }}</strong> 吗？
      </p>
      <p style="text-align: center; color: var(--text-muted); font-size: 13px;">
        此操作不可恢复
      </p>
      <template #footer>
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="handleDelete">确认删除</el-button>
      </template>
    </el-dialog>

    <!-- 普通用户：修改密码弹窗 -->
    <el-dialog v-model="passwordDialogVisible" title="修改密码" width="400px">
      <el-form :model="passwordForm" label-position="top">
        <el-form-item label="当前密码">
          <el-input
            v-model="passwordForm.oldPassword"
            type="password"
            placeholder="请输入当前密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="请输入新密码（至少6位）"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认新密码">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="savePassword">确认修改</el-button>
      </template>
    </el-dialog>

    <!-- 普通用户：编辑资料弹窗 -->
    <el-dialog v-model="profileDialogVisible" title="编辑资料" width="400px">
      <el-form :model="profileForm" label-position="top">
        <el-form-item label="用户名">
          <el-input v-model="profileForm.username" placeholder="用户名" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="profileDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveProfile">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const loading = ref(false)
const users = ref([])
const searchQuery = ref('')
const currentUserId = ref('')
const currentUser = ref(null)
const isAdmin = ref(false)

// 可配置的功能模块（不含用户管理，因为普通用户只能管理自己）
const availableModules = [
  { key: 'guide', label: '使用说明' },
  { key: 'chat', label: '智能对话' },
  { key: 'dashboard', label: '集群仪表板' },
  { key: 'agents', label: '智能体管理' },
  { key: 'skills', label: '技能配置' },
  { key: 'config', label: '集群配置' },
]

const editDialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const editForm = ref({
  id: '',
  username: '',
  role: 'user',
  password: '',
  permissions: []
})
const deleteUser = ref(null)

// 普通用户的弹窗和表单
const passwordDialogVisible = ref(false)
const profileDialogVisible = ref(false)
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const profileForm = ref({
  username: ''
})

const adminCount = computed(() => users.value.filter(u => u.role === 'admin').length)
const userCount = computed(() => users.value.filter(u => u.role === 'user').length)

const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value
  const query = searchQuery.value.toLowerCase()
  return users.value.filter(u =>
    u.username?.toLowerCase().includes(query) ||
    u.email?.toLowerCase().includes(query)
  )
})

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN') + ' ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const loadUsers = async () => {
  // 只有管理员才加载用户列表
  if (!isAdmin.value) return

  loading.value = true
  try {
    const res = await axios.get('/api/auth/users')
    users.value = res.data.users || []
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '加载用户列表失败')
  } finally {
    loading.value = false
  }
}

const loadCurrentUser = () => {
  const user = localStorage.getItem('user')
  if (user) {
    try {
      const userData = JSON.parse(user)
      currentUserId.value = userData.id
      currentUser.value = userData
      isAdmin.value = userData.role === 'admin'
    } catch (e) {}
  }
}

const editUser = (user) => {
  editForm.value = {
    id: user.id,
    username: user.username,
    role: user.role,
    password: '',
    permissions: user.permissions || []
  }
  editDialogVisible.value = true
}

const onRoleChange = (role) => {
  // 切换到管理员时清空权限配置
  if (role === 'admin') {
    editForm.value.permissions = []
  }
}

const saveUser = async () => {
  try {
    const data = {
      username: editForm.value.username,
      role: editForm.value.role
    }
    if (editForm.value.password) {
      data.password = editForm.value.password
    }
    // 非管理员用户才保存权限配置
    if (editForm.value.role === 'user') {
      data.permissions = editForm.value.permissions
    }

    await axios.put(`/api/auth/users/${editForm.value.id}`, data)
    ElMessage.success('保存成功')
    editDialogVisible.value = false
    loadUsers()
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '保存失败')
  }
}

const confirmDelete = (user) => {
  deleteUser.value = user
  deleteDialogVisible.value = true
}

const handleDelete = async () => {
  try {
    await axios.delete(`/api/auth/users/${deleteUser.value.id}`)
    ElMessage.success('用户已删除')
    deleteDialogVisible.value = false
    loadUsers()
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '删除失败')
  }
}

// 普通用户：编辑资料
const editProfile = () => {
  profileForm.value = {
    username: currentUser.value?.username || ''
  }
  profileDialogVisible.value = true
}

const saveProfile = async () => {
  try {
    await axios.put('/api/auth/profile', {
      username: profileForm.value.username
    })
    ElMessage.success('资料已更新')

    // 更新本地存储
    currentUser.value.username = profileForm.value.username
    localStorage.setItem('user', JSON.stringify(currentUser.value))

    profileDialogVisible.value = false
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '更新失败')
  }
}

// 普通用户：修改密码
const changePassword = () => {
  passwordForm.value = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  }
  passwordDialogVisible.value = true
}

const savePassword = async () => {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    ElMessage.error('两次输入的新密码不一致')
    return
  }

  if (passwordForm.value.newPassword.length < 6) {
    ElMessage.error('新密码至少需要6个字符')
    return
  }

  try {
    await axios.put('/api/auth/password', {
      oldPassword: passwordForm.value.oldPassword,
      newPassword: passwordForm.value.newPassword
    })
    ElMessage.success('密码修改成功')
    passwordDialogVisible.value = false
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '修改密码失败')
  }
}

onMounted(() => {
  loadCurrentUser()
  loadUsers()
})
</script>

<style scoped>
.user-management {
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

/* 统计卡片 */
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.stat-icon svg {
  width: 24px;
  height: 24px;
}
.stat-card-blue .stat-icon {
  background: rgba(99, 102, 241, 0.15);
}
.stat-card-blue .stat-icon svg {
  color: var(--accent);
}
.stat-card-purple .stat-icon {
  background: rgba(139, 92, 246, 0.15);
}
.stat-card-purple .stat-icon svg {
  color: var(--purple);
}
.stat-card-cyan .stat-icon {
  background: rgba(6, 182, 212, 0.15);
}
.stat-card-cyan .stat-icon svg {
  color: var(--info);
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-label {
  font-size: 13px;
  color: var(--text-muted);
}

/* 用户列表 */
.user-list {
  padding: 24px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.list-header h4 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.search-box input {
  padding: 10px 16px;
  border: var(--border-light);
  border-radius: 10px;
  background: var(--bg-hover);
  color: var(--text-primary);
  font-size: 14px;
  width: 240px;
  transition: all 0.2s ease;
}

.search-box input:focus {
  outline: none;
  border-color: var(--accent);
  background: var(--bg-card);
}

/* 表格 */
.user-table {
  border: var(--border-light);
  border-radius: 12px;
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 60px 1fr 1.5fr 120px 120px 120px 100px;
  gap: 16px;
  padding: 14px 20px;
  background: var(--bg-hover);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
}

.table-row {
  display: grid;
  grid-template-columns: 60px 1fr 1.5fr 120px 120px 120px 100px;
  gap: 16px;
  padding: 16px 20px;
  border-top: var(--border-light);
  align-items: center;
  font-size: 14px;
  transition: background 0.2s ease;
}

.table-row:hover {
  background: var(--bg-hover);
}

.table-row.is-current {
  background: rgba(59, 130, 246, 0.08);
}

.avatar {
  width: 40px;
  height: 40px;
  background: var(--gradient-primary);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 16px;
}

.username {
  font-weight: 600;
  color: var(--text-primary);
}

.badge-you {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 8px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.15));
  border-radius: 4px;
  font-size: 11px;
  color: var(--accent);
}

.col-email {
  color: var(--text-secondary);
}

.role-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
}

.role-badge.admin {
  background: rgba(245, 158, 11, 0.15);
  color: var(--warning);
}

.role-badge.user {
  background: rgba(100, 116, 139, 0.15);
  color: var(--text-muted);
}

.col-date, .col-login {
  color: var(--text-muted);
  font-size: 13px;
}

.col-actions {
  display: flex;
  gap: 8px;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border: none;
  background: var(--bg-hover);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  transition: all 0.2s ease;
}

.btn-icon:hover {
  background: rgba(59, 130, 246, 0.15);
  color: var(--accent);
}

.btn-icon.danger:hover {
  background: rgba(239, 68, 68, 0.15);
  color: var(--danger);
}

.btn-icon svg {
  width: 16px;
  height: 16px;
}

/* 加载和空状态 */
.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: var(--text-muted);
  gap: 12px;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--border-light);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state span {
  font-size: 40px;
}

/* 权限配置 */
.permissions-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 12px;
  background: var(--bg-hover);
  border-radius: 10px;
  margin-top: 8px;
}

.permissions-grid :deep(.el-checkbox) {
  margin-right: 0;
  padding: 8px 12px;
  background: var(--bg-card);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.permissions-grid :deep(.el-checkbox:hover) {
  background: var(--bg-hover);
}

.permissions-grid :deep(.el-checkbox.is-checked) {
  background: rgba(59, 130, 246, 0.1);
}

.permissions-tip {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 8px;
}

/* 普通用户：个人中心样式 */
.profile-card {
  max-width: 500px;
  padding: 32px;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: var(--border-light);
}

.profile-avatar {
  width: 72px;
  height: 72px;
  background: var(--gradient-primary);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 28px;
}

.profile-info h4 {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.profile-email {
  font-size: 14px;
  color: var(--text-muted);
}

.profile-details {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--bg-hover);
  border-radius: 10px;
}

.detail-label {
  font-size: 14px;
  color: var(--text-muted);
}

.detail-value {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.profile-actions {
  display: flex;
  gap: 12px;
}

.btn-primary,
.btn-secondary {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 20px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: var(--gradient-primary);
  border: none;
  color: white;
}

.btn-primary:hover {
  filter: brightness(1.1);
}

.btn-secondary {
  background: var(--bg-hover);
  border: var(--border-light);
  color: var(--text-secondary);
}

.btn-secondary:hover {
  background: var(--bg-card);
  color: var(--text-primary);
}

.btn-primary svg,
.btn-secondary svg {
  width: 18px;
  height: 18px;
}

/* 响应式 */
@media (max-width: 1024px) {
  .stats-row {
    grid-template-columns: 1fr;
  }

  .table-header, .table-row {
    grid-template-columns: 60px 1fr 120px 80px;
  }

  .col-email, .col-date, .col-login {
    display: none;
  }

  .permissions-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .profile-actions {
    flex-direction: column;
  }
}
</style>