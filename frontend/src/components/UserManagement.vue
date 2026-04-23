<template>
  <div class="bp-users">
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
            <span>{{ isAdmin ? 'ACCESS CONTROL' : 'PERSONAL PROFILE' }}</span>
          </span>

          <h1 class="bp-display-title">
            <span class="bp-t-main">{{ isAdmin ? '用户' : '个人' }}</span>
            <span class="bp-t-accent">{{ isAdmin ? 'USERS' : 'PROFILE' }}</span>
            <span class="bp-t-mute">{{ isAdmin ? '/ ADMIN' : '/ ACCOUNT' }}</span>
          </h1>

          <div class="bp-dim">
            <span class="bp-dim-arrow">◂</span>
            <span class="bp-dim-line"></span>
            <span class="bp-dim-num">{{ isAdmin ? String(users.length).padStart(3, '0') : 'SELF' }}</span>
            <span class="bp-dim-line"></span>
            <span class="bp-dim-arrow">▸</span>
          </div>

          <p class="bp-sub">{{ isAdmin ? '平台用户权限管理 — 分配角色、重置密码、审计登录记录。' : '查看并编辑个人账户信息 — 用户名、邮箱、登录密码。' }}</p>

          <div class="bp-callouts">
            <span class="bp-callout"><em>A</em><span>{{ isAdmin ? 'USER LIST' : 'PROFILE INFO' }}</span></span>
            <span class="bp-callout is-amber"><em>B</em><span>{{ isAdmin ? 'ROLE CONTROL' : 'CREDENTIALS' }}</span></span>
            <span class="bp-callout is-green"><em>C</em><span>{{ isAdmin ? 'AUDIT TRAIL' : 'LOGIN LOG' }}</span></span>
          </div>
        </div>

        <!-- Revision stamp -->
        <div class="bp-stamp">
          <div class="bp-stamp-inner">
            <span class="bp-stamp-check">✓</span>
            <div class="bp-stamp-text">
              <strong>{{ isAdmin ? 'AUDITED' : 'VERIFIED' }}</strong>
              <small>SEC · {{ stampCode }}</small>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- ╭── 普通用户：个人信息 ──╮ -->
    <section v-if="!isAdmin" class="bp-profile-section">
      <div class="bp-profile-card">
        <!-- Corner ticks -->
        <span class="bp-card-tick-tl"></span>
        <span class="bp-card-tick-tr"></span>
        <span class="bp-card-tick-bl"></span>
        <span class="bp-card-tick-br"></span>

        <div class="bp-profile-head">
          <div class="bp-profile-avatar">
            <span>{{ getAvatarChar(currentUser) }}</span>
          </div>
          <div class="bp-profile-info">
            <h4 class="bp-profile-name">{{ currentUser?.username }}</h4>
            <span class="bp-profile-email">{{ currentUser?.email }}</span>
          </div>
        </div>

        <div class="bp-profile-dets">
          <div class="bp-det-row">
            <span class="bp-det-k">01 角色</span>
            <span class="bp-det-v">{{ currentUser?.role === 'admin' ? '管理员' : '普通用户' }}</span>
          </div>
          <div class="bp-det-row">
            <span class="bp-det-k">02 注册</span>
            <span class="bp-det-v">{{ formatDate(currentUser?.created_at) }}</span>
          </div>
          <div class="bp-det-row">
            <span class="bp-det-k">03 登录</span>
            <span class="bp-det-v">{{ formatDate(currentUser?.last_login) || '从未登录' }}</span>
          </div>
        </div>

        <div class="bp-profile-acts">
          <button class="bp-btn-primary" @click="editProfile">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            <span>编辑资料</span>
          </button>
          <button class="bp-btn" @click="changePassword">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
            <span>修改密码</span>
          </button>
        </div>
      </div>
    </section>

    <!-- ╭── 管理员：用户管理 ──╮ -->
    <section v-else class="bp-admin-section">
      <!-- Stats -->
      <div class="bp-stats-row">
        <div class="bp-stat-card bp-stat-cyan">
          <span class="bp-stat-tick"></span>
          <div class="bp-stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87"/>
              <path d="M16 3.13a4 4 0 010 7.75"/>
            </svg>
          </div>
          <div class="bp-stat-val">{{ users.length }}</div>
          <div class="bp-stat-lbl">总用户数</div>
        </div>
        <div class="bp-stat-card bp-stat-amber">
          <span class="bp-stat-tick"></span>
          <div class="bp-stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z"/>
            </svg>
          </div>
          <div class="bp-stat-val">{{ adminCount }}</div>
          <div class="bp-stat-lbl">管理员</div>
        </div>
        <div class="bp-stat-card bp-stat-green">
          <span class="bp-stat-tick"></span>
          <div class="bp-stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div class="bp-stat-val">{{ userCount }}</div>
          <div class="bp-stat-lbl">普通用户</div>
        </div>
      </div>

      <div class="bp-list-panel bp-ldap-panel">
        <div class="bp-list-head">
          <div>
            <span class="bp-list-title">LDAP 配置</span>
            <p class="bp-ldap-sub">统一认证接入配置 — 管理员可测试目录连通性并保存登录参数。</p>
          </div>
          <div class="bp-ldap-actions bp-ldap-actions-head">
            <button class="bp-btn" @click="testLdapConnection" :disabled="ldapTesting || ldapLoading">
              <span>{{ ldapTesting ? '测试中...' : '测试连接' }}</span>
            </button>
            <button class="bp-btn-primary" @click="saveLdapConfig" :disabled="ldapSaving || ldapLoading">
              <span>{{ ldapSaving ? '保存中...' : '保存配置' }}</span>
              <span class="bp-btn-arrow">▸</span>
            </button>
          </div>
        </div>

        <div v-if="ldapLoading" class="bp-loading bp-ldap-loading">
          <span class="bp-spinner"></span>
          <span>加载 LDAP 配置中...</span>
        </div>

        <el-form v-else :model="ldapForm" label-position="top" class="bp-form">
          <div class="bp-ldap-grid bp-ldap-grid-top">
            <div class="bp-field">
              <label class="bp-label">
                <span class="bp-label-k">01</span>
                <span class="bp-label-v">启用 · ENABLE</span>
              </label>
              <div class="bp-ldap-switch-row">
                <el-switch v-model="ldapForm.enabled" />
                <span class="bp-ldap-switch-label">{{ ldapForm.enabled ? '已启用 LDAP 登录' : '未启用 LDAP 登录' }}</span>
              </div>
            </div>

            <div class="bp-field">
              <label class="bp-label">
                <span class="bp-label-k">02</span>
                <span class="bp-label-v">方言 · DIALECT</span>
              </label>
              <el-select v-model="ldapForm.dialect" style="width: 100%" class="bp-select">
                <el-option v-for="dialect in ldapDialects" :key="dialect" :label="dialect.toUpperCase()" :value="dialect" />
              </el-select>
            </div>
          </div>

          <div class="bp-ldap-grid">
            <div class="bp-field">
              <label class="bp-label">
                <span class="bp-label-k">03</span>
                <span class="bp-label-v">服务地址 · URL</span>
              </label>
              <div class="bp-input-wrap">
                <input v-model="ldapForm.url" type="text" placeholder="ldap://host:389 或 ldaps://host:636" class="bp-input" />
              </div>
            </div>

            <div class="bp-field">
              <label class="bp-label">
                <span class="bp-label-k">04</span>
                <span class="bp-label-v">绑定账号 · BIND DN</span>
              </label>
              <div class="bp-input-wrap">
                <input v-model="ldapForm.bindDN" type="text" placeholder="cn=admin,dc=example,dc=com" class="bp-input" />
              </div>
            </div>
          </div>

          <div class="bp-ldap-grid">
            <div class="bp-field">
              <label class="bp-label">
                <span class="bp-label-k">05</span>
                <span class="bp-label-v">绑定密码 · PASSWORD</span>
              </label>
              <div class="bp-input-wrap">
                <input v-model="ldapForm.bindPassword" type="password" placeholder="留空或保持脱敏值表示不修改" class="bp-input" />
              </div>
            </div>

            <div class="bp-field">
              <label class="bp-label">
                <span class="bp-label-k">06</span>
                <span class="bp-label-v">搜索基准 · BASE DN</span>
              </label>
              <div class="bp-input-wrap">
                <input v-model="ldapForm.searchBase" type="text" placeholder="ou=people,dc=example,dc=com" class="bp-input" />
              </div>
            </div>
          </div>

          <div class="bp-ldap-grid">
            <div class="bp-field">
              <label class="bp-label">
                <span class="bp-label-k">07</span>
                <span class="bp-label-v">搜索过滤器 · FILTER</span>
              </label>
              <div class="bp-input-wrap">
                <input v-model="ldapForm.searchFilter" type="text" placeholder="(uid={{username}})" class="bp-input" />
              </div>
            </div>

            <div class="bp-field">
              <label class="bp-label">
                <span class="bp-label-k">08</span>
                <span class="bp-label-v">TLS 校验 · TLS</span>
              </label>
              <div class="bp-ldap-switch-row">
                <el-switch v-model="ldapForm.tlsEnabled" />
                <span class="bp-ldap-switch-label">{{ ldapForm.tlsEnabled ? '启用 TLS 连接' : '普通 LDAP 连接' }}</span>
              </div>
            </div>
          </div>

          <div class="bp-ldap-grid">
            <div class="bp-field">
              <label class="bp-label">
                <span class="bp-label-k">09</span>
                <span class="bp-label-v">邮箱属性 · EMAIL</span>
              </label>
              <div class="bp-input-wrap">
                <input v-model="ldapForm.emailAttribute" type="text" placeholder="mail" class="bp-input" />
              </div>
            </div>

            <div class="bp-field">
              <label class="bp-label">
                <span class="bp-label-k">10</span>
                <span class="bp-label-v">姓名属性 · NAME</span>
              </label>
              <div class="bp-input-wrap">
                <input v-model="ldapForm.nameAttribute" type="text" placeholder="cn 或 displayName" class="bp-input" />
              </div>
            </div>
          </div>

          <div class="bp-ldap-actions">
            <button class="bp-btn" @click.prevent="testLdapConnection" :disabled="ldapTesting">
              <span>{{ ldapTesting ? '测试中...' : '测试连接' }}</span>
            </button>
            <button class="bp-btn-primary" @click.prevent="saveLdapConfig" :disabled="ldapSaving">
              <span>{{ ldapSaving ? '保存中...' : '保存配置' }}</span>
              <span class="bp-btn-arrow">▸</span>
            </button>
          </div>
        </el-form>
      </div>

      <!-- User List -->
      <div class="bp-list-panel">
        <div class="bp-list-head">
          <span class="bp-list-title">用户列表</span>
          <div class="bp-search-box">
            <input v-model="searchQuery" placeholder="搜索用户..." type="text" />
          </div>
        </div>

        <div v-if="loading" class="bp-loading">
          <span class="bp-spinner"></span>
          <span>加载中...</span>
        </div>

        <div v-else-if="filteredUsers.length === 0" class="bp-empty">
          <span class="bp-empty-code">[ NO_MATCH_FOUND ]</span>
          <span>没有找到匹配的用户</span>
        </div>

        <div v-else class="bp-table">
          <div class="bp-table-head">
            <span class="bp-col-avatar">AV</span>
            <span class="bp-col-name">用户名</span>
            <span class="bp-col-email">邮箱</span>
            <span class="bp-col-role">角色</span>
            <span class="bp-col-date">注册</span>
            <span class="bp-col-login">登录</span>
            <span class="bp-col-acts">操作</span>
          </div>

          <div
            v-for="u in filteredUsers"
            :key="u.id"
            class="bp-table-row"
            :class="{ 'bp-is-current': u.id === currentUserId }"
          >
            <div class="bp-col-avatar">
              <div class="bp-avatar">{{ getAvatarChar(u) }}</div>
            </div>
            <div class="bp-col-name">
              <span class="bp-name">{{ u.username }}</span>
              <span v-if="u.id === currentUserId" class="bp-tag bp-tag-cyan">当前用户</span>
            </div>
            <div class="bp-col-email bp-mono">{{ u.email }}</div>
            <div class="bp-col-role">
              <span :class="['bp-role', u.role]">
                {{ u.role === 'admin' ? '管理员' : '普通用户' }}
              </span>
            </div>
            <div class="bp-col-date bp-mono">{{ formatDate(u.created_at) }}</div>
            <div class="bp-col-login bp-mono">{{ formatDate(u.last_login) || '--' }}</div>
            <div class="bp-col-acts">
              <button class="bp-btn-icon" @click="editUser(u)" title="编辑">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button
                v-if="u.id !== currentUserId"
                class="bp-btn-icon bp-btn-danger"
                @click="confirmDelete(u)"
                title="删除"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ╭── 编辑用户弹窗 ──╮ -->
    <el-dialog v-model="editDialogVisible" width="520px" class="bp-dialog">
      <template #header>
        <div class="bp-dialog-head">
          <span class="bp-dialog-k">EDIT</span>
          <span class="bp-dialog-v">编辑用户</span>
        </div>
      </template>

      <el-form :model="editForm" label-position="top" class="bp-form">
        <div class="bp-field">
          <label class="bp-label">
            <span class="bp-label-k">01</span>
            <span class="bp-label-v">用户名 · USERNAME</span>
          </label>
          <div class="bp-input-wrap">
            <input v-model="editForm.username" type="text" placeholder="请输入用户名" class="bp-input" />
          </div>
        </div>

        <div class="bp-field">
          <label class="bp-label">
            <span class="bp-label-k">02</span>
            <span class="bp-label-v">角色 · ROLE</span>
          </label>
          <el-select v-model="editForm.role" style="width: 100%" @change="onRoleChange" class="bp-select">
            <el-option label="管理员" value="admin" />
            <el-option label="普通用户" value="user" />
          </el-select>
        </div>

        <div class="bp-field">
          <label class="bp-label">
            <span class="bp-label-k">03</span>
            <span class="bp-label-v">密码 · PASSWORD</span>
          </label>
          <div class="bp-input-wrap">
            <input v-model="editForm.password" type="password" placeholder="留空则不修改密码" class="bp-input" />
          </div>
        </div>

        <div v-if="editForm.role === 'user'" class="bp-field">
          <label class="bp-label">
            <span class="bp-label-k">04</span>
            <span class="bp-label-v">权限 · PERMISSIONS</span>
          </label>
          <div class="bp-perms-grid">
            <el-checkbox
              v-for="m in availableModules"
              :key="m.key"
              v-model="editForm.permissions"
              :label="m.key"
            >
              {{ m.label }}
            </el-checkbox>
          </div>
          <span class="bp-perms-tip">未勾选的模块将对该用户隐藏</span>
        </div>
      </el-form>

      <template #footer>
        <div class="bp-dialog-footer">
          <button class="bp-btn" @click="editDialogVisible = false">取消</button>
          <button class="bp-btn-primary" @click="saveUser">
            <span>保存</span>
            <span class="bp-btn-arrow">▸</span>
          </button>
        </div>
      </template>
    </el-dialog>

    <!-- ╭── 删除确认弹窗 ──╮ -->
    <el-dialog v-model="deleteDialogVisible" width="420px" class="bp-dialog">
      <template #header>
        <div class="bp-dialog-head">
          <span class="bp-dialog-k">DELETE</span>
          <span class="bp-dialog-v">确认删除</span>
        </div>
      </template>

      <div class="bp-confirm-body">
        <p class="bp-confirm-msg">确定要删除用户 <strong>{{ deleteUser?.username }}</strong> 吗？</p>
        <p class="bp-confirm-tip">此操作不可恢复</p>
      </div>

      <template #footer>
        <div class="bp-dialog-footer">
          <button class="bp-btn" @click="deleteDialogVisible = false">取消</button>
          <button class="bp-btn-danger" @click="handleDelete">
            <span>确认删除</span>
          </button>
        </div>
      </template>
    </el-dialog>

    <!-- ╭── 修改密码弹窗 ──╮ -->
    <el-dialog v-model="passwordDialogVisible" width="420px" class="bp-dialog">
      <template #header>
        <div class="bp-dialog-head">
          <span class="bp-dialog-k">PASSWORD</span>
          <span class="bp-dialog-v">修改密码</span>
        </div>
      </template>

      <el-form :model="passwordForm" label-position="top" class="bp-form">
        <div class="bp-field">
          <label class="bp-label">
            <span class="bp-label-k">01</span>
            <span class="bp-label-v">当前密码 · OLD</span>
          </label>
          <div class="bp-input-wrap">
            <input v-model="passwordForm.oldPassword" type="password" placeholder="请输入当前密码" class="bp-input" />
          </div>
        </div>

        <div class="bp-field">
          <label class="bp-label">
            <span class="bp-label-k">02</span>
            <span class="bp-label-v">新密码 · NEW</span>
          </label>
          <div class="bp-input-wrap">
            <input v-model="passwordForm.newPassword" type="password" placeholder="至少6位字符" class="bp-input" />
          </div>
        </div>

        <div class="bp-field">
          <label class="bp-label">
            <span class="bp-label-k">03</span>
            <span class="bp-label-v">确认密码 · CONFIRM</span>
          </label>
          <div class="bp-input-wrap">
            <input v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入新密码" class="bp-input" />
          </div>
        </div>
      </el-form>

      <template #footer>
        <div class="bp-dialog-footer">
          <button class="bp-btn" @click="passwordDialogVisible = false">取消</button>
          <button class="bp-btn-primary" @click="savePassword">
            <span>确认修改</span>
            <span class="bp-btn-arrow">▸</span>
          </button>
        </div>
      </template>
    </el-dialog>

    <!-- ╭── 编辑资料弹窗 ──╮ -->
    <el-dialog v-model="profileDialogVisible" width="420px" class="bp-dialog">
      <template #header>
        <div class="bp-dialog-head">
          <span class="bp-dialog-k">PROFILE</span>
          <span class="bp-dialog-v">编辑资料</span>
        </div>
      </template>

      <el-form :model="profileForm" label-position="top" class="bp-form">
        <div class="bp-field">
          <label class="bp-label">
            <span class="bp-label-k">01</span>
            <span class="bp-label-v">用户名 · USERNAME</span>
          </label>
          <div class="bp-input-wrap">
            <input v-model="profileForm.username" type="text" placeholder="请输入用户名" class="bp-input" />
          </div>
        </div>
      </el-form>

      <template #footer>
        <div class="bp-dialog-footer">
          <button class="bp-btn" @click="profileDialogVisible = false">取消</button>
          <button class="bp-btn-primary" @click="saveProfile">
            <span>保存</span>
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
import { getAvatarChar } from '../utils/avatar'
import { STORAGE_KEYS } from '../utils/constants'

const loading = ref(false)
const users = ref([])
const searchQuery = ref('')
const currentUserId = ref('')
const currentUser = ref(null)
const isAdmin = ref(false)
const stampCode = `${new Date().getFullYear()}Q${Math.ceil((new Date().getMonth() + 1) / 3)}`

const availableModules = [
  { key: 'guide', label: '使用说明' },
  { key: 'chat', label: '智能对话' },
  { key: 'dashboard', label: '集群仪表板' },
  { key: 'agents', label: '智能体管理' },
  { key: 'skills', label: '技能配置' },
  { key: 'config', label: '集群配置' },
]

const ldapLoading = ref(false)
const ldapSaving = ref(false)
const ldapTesting = ref(false)
const ldapDialects = ref([])
const ldapForm = ref({
  enabled: false,
  dialect: 'openldap',
  url: '',
  bindDN: '',
  bindPassword: '',
  searchBase: '',
  searchFilter: '(uid={{username}})',
  emailAttribute: 'mail',
  nameAttribute: 'cn',
  tlsEnabled: false
})

const loadLdapConfig = async () => {
  if (!isAdmin.value) return
  ldapLoading.value = true
  try {
    const res = await axios.get('/api/auth/ldap/config')
    ldapForm.value = {
      ...ldapForm.value,
      ...(res.data.config || {})
    }
    ldapDialects.value = res.data.dialects || []
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '加载 LDAP 配置失败')
  } finally {
    ldapLoading.value = false
  }
}

const saveLdapConfig = async () => {
  ldapSaving.value = true
  try {
    const res = await axios.put('/api/auth/ldap/config', ldapForm.value)
    ldapForm.value = {
      ...ldapForm.value,
      ...(res.data.config || {})
    }
    ElMessage.success('LDAP 配置已保存')
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '保存 LDAP 配置失败')
  } finally {
    ldapSaving.value = false
  }
}

const testLdapConnection = async () => {
  ldapTesting.value = true
  try {
    const res = await axios.post('/api/auth/ldap/test-connection', ldapForm.value)
    ElMessage.success(`连接成功 · base=${res.data.baseDN} · entries=${res.data.entries}`)
  } catch (err) {
    ElMessage.error(err.response?.data?.error || 'LDAP 连接失败')
  } finally {
    ldapTesting.value = false
  }
}

const deleteDialogVisible = ref(false)
const editForm = ref({
  id: '',
  username: '',
  role: 'user',
  password: '',
  permissions: []
})
const deleteUser = ref(null)

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
  const user = localStorage.getItem(STORAGE_KEYS.USER)
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
    currentUser.value.username = profileForm.value.username
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser.value))
    profileDialogVisible.value = false
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '更新失败')
  }
}

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
  loadLdapConfig()
})
</script>

<style scoped>
.bp-users {
  width: 100%;
  animation: bp-fade 0.4s ease-out;
}

/* ╭── Page Header ──╮ */
/* page-head base styles inherited from global blueprint.css */

/* ╭── Profile Card (普通用户) ──╮ */
.bp-profile-section {
  padding: 4px;
}

.bp-profile-card {
  position: relative;
  max-width: 520px;
  padding: 32px;
  background: linear-gradient(180deg, rgba(14, 29, 49, 0.8) 0%, rgba(10, 23, 38, 0.9) 100%);
  border: 1px solid rgba(92, 228, 255, 0.25);
}

.bp-card-tick-tl, .bp-card-tick-tr, .bp-card-tick-bl, .bp-card-tick-br {
  position: absolute;
  width: 8px;
  height: 8px;
  border: 1px solid rgba(92, 228, 255, 0.3);
}

.bp-card-tick-tl { top: -1px; left: -1px; border-right: none; border-bottom: none; }
.bp-card-tick-tr { top: -1px; right: -1px; border-left: none; border-bottom: none; }
.bp-card-tick-bl { bottom: -1px; left: -1px; border-right: none; border-top: none; }
.bp-card-tick-br { bottom: -1px; right: -1px; border-left: none; border-top: none; }

.bp-profile-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(92, 228, 255, 0.4), transparent);
}

.bp-profile-head {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px dashed rgba(92, 228, 255, 0.15);
}

.bp-profile-avatar {
  width: 72px;
  height: 72px;
  display: grid;
  place-items: center;
  border: 1px solid var(--bp-blueprint);
  background: var(--bp-blueprint);
  color: var(--bp-ink);
  font-family: var(--bp-fnt-display);
  font-size: 28px;
  font-weight: 900;
}

.bp-profile-info { flex: 1; }

.bp-profile-name {
  font-family: var(--bp-fnt-mono);
  font-size: 18px;
  font-weight: 700;
  color: var(--bp-chalk);
  margin-bottom: 6px;
  letter-spacing: 0.04em;
}

.bp-profile-email {
  font-family: var(--bp-fnt-mono);
  font-size: 13px;
  color: var(--bp-chalk-dim);
  opacity: 0.7;
}

.bp-profile-dets {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 24px;
}

.bp-det-row {
  display: flex;
  justify-content: space-between;
  padding: 14px 18px;
  background: rgba(92, 228, 255, 0.05);
  border: 1px solid rgba(92, 228, 255, 0.1);
}

.bp-det-k {
  font-family: var(--bp-fnt-mono);
  font-size: 11px;
  color: var(--bp-chalk-dim);
  letter-spacing: 0.1em;
}

.bp-det-v {
  font-family: 'Hanken Grotesk', 'PingFang SC', sans-serif;
  font-size: 14px;
  color: var(--bp-chalk);
}

.bp-profile-acts {
  display: flex;
  gap: 12px;
}

/* ╭── Admin Stats ──╮ */
.bp-stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.bp-stat-card {
  position: relative;
  padding: 20px 24px;
  background: rgba(14, 29, 49, 0.6);
  border: 1px solid rgba(92, 228, 255, 0.2);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.bp-stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(92, 228, 255, 0.3), transparent);
}

.bp-stat-tick {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 6px;
  height: 6px;
  border: 1px solid currentColor;
  opacity: 0.4;
}

.bp-stat-cyan .bp-stat-tick { color: var(--bp-blueprint); }
.bp-stat-amber .bp-stat-tick { color: var(--bp-amber); }
.bp-stat-green .bp-stat-tick { color: var(--bp-green-check); }

.bp-stat-icon {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(92, 228, 255, 0.15);
  background: rgba(92, 228, 255, 0.06);
}

.bp-stat-icon svg {
  width: 20px;
  height: 20px;
}

.bp-stat-cyan .bp-stat-icon svg { color: var(--bp-blueprint); }
.bp-stat-amber .bp-stat-icon svg { color: var(--bp-amber); }
.bp-stat-green .bp-stat-icon svg { color: var(--bp-green-check); }

.bp-stat-val {
  font-family: var(--bp-fnt-display);
  font-size: 32px;
  font-weight: 900;
  color: var(--bp-chalk);
}

.bp-stat-lbl {
  font-family: var(--bp-fnt-mono);
  font-size: 11px;
  color: var(--bp-chalk-dim);
  letter-spacing: 0.12em;
}

/* ╭── User List Panel ──╮ */
.bp-list-panel {
  padding: 24px;
  background: rgba(14, 29, 49, 0.6);
  border: 1px solid rgba(92, 228, 255, 0.2);
}

.bp-list-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px dashed rgba(92, 228, 255, 0.15);
}

.bp-list-title {
  font-family: var(--bp-fnt-mono);
  font-size: 12px;
  color: var(--bp-blueprint);
  font-weight: 700;
  letter-spacing: 0.1em;
}

.bp-search-box input {
  padding: 10px 16px;
  border: 1px solid rgba(92, 228, 255, 0.15);
  background: rgba(92, 228, 255, 0.05);
  color: var(--bp-chalk);
  font-family: var(--bp-fnt-mono);
  font-size: 13px;
  width: 240px;
  transition: all 0.2s ease;
}

.bp-search-box input:focus {
  outline: none;
  border-color: var(--bp-blueprint);
  background: rgba(92, 228, 255, 0.08);
  box-shadow: 0 0 12px rgba(92, 228, 255, 0.2);
}

.bp-search-box input::placeholder {
  color: var(--bp-chalk-dim);
  opacity: 0.5;
}

/* ╭── Table ──╮ */
.bp-table {
  border: 1px solid rgba(92, 228, 255, 0.15);
}

.bp-table-head {
  display: grid;
  grid-template-columns: 60px 1.2fr 1.5fr 100px 120px 120px 80px;
  gap: 12px;
  padding: 14px 20px;
  background: rgba(92, 228, 255, 0.06);
  font-family: var(--bp-fnt-mono);
  font-size: 10px;
  font-weight: 600;
  color: var(--bp-chalk-dim);
  letter-spacing: 0.08em;
  border-bottom: 1px solid rgba(92, 228, 255, 0.15);
}

.bp-table-row {
  display: grid;
  grid-template-columns: 60px 1.2fr 1.5fr 100px 120px 120px 80px;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid rgba(92, 228, 255, 0.08);
  align-items: center;
  font-family: 'Hanken Grotesk', 'PingFang SC', sans-serif;
  font-size: 14px;
  transition: background 0.2s ease;
}

.bp-table-row:hover {
  background: rgba(92, 228, 255, 0.05);
}

.bp-is-current {
  background: rgba(92, 228, 255, 0.08);
}

.bp-avatar {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  background: var(--bp-blueprint);
  color: var(--bp-ink);
  font-weight: 700;
  font-size: 14px;
}

.bp-name {
  font-weight: 600;
  color: var(--bp-chalk);
}

.bp-mono {
  font-family: var(--bp-fnt-mono);
  font-size: 12px;
  color: var(--bp-chalk-dim);
}

.bp-role {
  display: inline-block;
  padding: 4px 10px;
  font-family: var(--bp-fnt-mono);
  font-size: 11px;
  letter-spacing: 0.06em;
}

.bp-role.admin {
  background: rgba(245, 166, 35, 0.15);
  color: var(--bp-amber);
}

.bp-role.user {
  background: rgba(92, 228, 255, 0.06);
  color: var(--bp-chalk-dim);
}

.bp-col-acts {
  display: flex;
  gap: 8px;
}

.bp-btn-icon {
  width: 32px;
  height: 32px;
  border: 1px solid rgba(92, 228, 255, 0.15);
  background: transparent;
  cursor: pointer;
  display: grid;
  place-items: center;
  color: var(--bp-chalk-dim);
  transition: all 0.2s ease;
}

.bp-btn-icon:hover {
  background: rgba(92, 228, 255, 0.08);
  color: var(--bp-blueprint);
  border-color: var(--bp-blueprint);
}

.bp-btn-icon.bp-btn-danger:hover {
  background: rgba(255, 74, 60, 0.1);
  color: var(--bp-red-stamp);
  border-color: var(--bp-red-stamp);
}

.bp-btn-icon svg {
  width: 16px;
  height: 16px;
}

/* ╭── Loading & Empty ──╮ */
.bp-loading, .bp-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 60px;
  color: var(--bp-chalk-dim);
}

.bp-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(92, 228, 255, 0.2);
  border-top-color: var(--bp-blueprint);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.bp-empty-code {
  font-family: var(--bp-fnt-mono);
  font-size: 11px;
  color: var(--bp-blueprint);
  letter-spacing: 0.14em;
  opacity: 0.6;
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

/* ╭── Confirm Dialog ──╮ */
.bp-confirm-body {
  text-align: center;
  padding: 20px 0;
}

.bp-confirm-msg {
  font-size: 15px;
  color: var(--bp-chalk);
  margin-bottom: 8px;
}

.bp-confirm-msg strong {
  color: var(--bp-blueprint);
}

.bp-confirm-tip {
  font-family: var(--bp-fnt-mono);
  font-size: 12px;
  color: var(--bp-chalk-dim);
  opacity: 0.6;
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

/* ╭── Permissions ──╮ */
.bp-perms-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 12px;
  background: rgba(92, 228, 255, 0.05);
}

.bp-perms-grid :deep(.el-checkbox) {
  margin-right: 0;
  padding: 8px 12px;
  background: rgba(14, 29, 49, 0.6);
  transition: all 0.2s ease;
}

.bp-perms-grid :deep(.el-checkbox:hover) {
  background: rgba(92, 228, 255, 0.08);
}

.bp-perms-grid :deep(.el-checkbox.is-checked) {
  background: rgba(92, 228, 255, 0.12);
}

.bp-perms-tip {
  font-family: var(--bp-fnt-mono);
  font-size: 11px;
  color: var(--bp-chalk-dim);
  margin-top: 8px;
  opacity: 0.6;
}

/* ╭── Animations ──╮ */
@keyframes bp-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes spin { to { transform: rotate(360deg); } }

/* ╭── Responsive ──╮ */
@media (max-width: 1024px) {
  .bp-stats-row { grid-template-columns: 1fr; }
  .bp-table-head, .bp-table-row {
    grid-template-columns: 60px 1fr 100px 80px;
  }
  .bp-col-email, .bp-col-date, .bp-col-login { display: none; }
  .bp-perms-grid { grid-template-columns: repeat(2, 1fr); }
}


.bp-ldap-panel {
  margin-bottom: 20px;
}

.bp-ldap-sub {
  margin-top: 8px;
  font-family: var(--bp-fnt-mono);
  font-size: 11px;
  color: var(--bp-chalk-dim);
  letter-spacing: 0.04em;
}

.bp-ldap-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.bp-ldap-grid-top {
  align-items: end;
}

.bp-ldap-switch-row {
  min-height: 46px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 4px;
  border-bottom: 1px solid rgba(92, 228, 255, 0.15);
}

.bp-ldap-switch-label {
  font-family: var(--bp-fnt-mono);
  font-size: 12px;
  color: var(--bp-chalk-dim);
}

.bp-ldap-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.bp-ldap-actions-head {
  align-items: center;
}

.bp-ldap-loading {
  padding: 32px;
}

@media (max-width: 1024px) {
  .bp-ldap-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .bp-profile-acts { flex-direction: column; }
  .bp-search-box input { width: 100%; }
  .bp-list-panel { padding: 16px; }
  .bp-ldap-actions,
  .bp-ldap-actions-head {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>