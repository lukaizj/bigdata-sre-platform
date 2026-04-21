<template>
  <div class="dashboard">
    <!-- 集群选择 -->
    <div class="cluster-selector card">
      <div class="selector-header">
        <h4>选择集群</h4>
      </div>
      <div class="cluster-tabs">
        <div
          v-for="cluster in clusters"
          :key="cluster.id"
          :class="['cluster-tab', { active: selectedClusterId === cluster.id }]"
          @click="selectCluster(cluster.id)"
        >
          <span class="cluster-icon">{{ cluster.icon || '🏢' }}</span>
          <span class="cluster-name">{{ cluster.name }}</span>
          <span class="cluster-env">{{ cluster.environment || '生产' }}</span>
        </div>
      </div>
    </div>

    <!-- 服务状态卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="8">
        <div class="stat-card card card-hdfs">
          <div class="card-accent-bar"></div>
          <div class="stat-head">
            <div class="stat-icon-wrap hdfs">
              <svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 3v18h18"></path>
                <path d="M18 17V9"></path>
                <path d="M13 17V5"></path>
                <path d="M8 17v-3"></path>
              </svg>
            </div>
            <h4>HDFS</h4>
            <span :class="['status-badge', hdfsStatus]">{{ hdfs?.status || '未知' }}</span>
          </div>
          <div v-if="hdfs" class="stat-body">
            <div class="stat-row">
              <span>存活节点</span>
              <b>{{ hdfs.liveNodes }}</b>
            </div>
            <div class="stat-row">
              <span>死亡节点</span>
              <b :class="{ danger: hdfs.deadNodes > 0 }">{{ hdfs.deadNodes }}</b>
            </div>
            <div class="stat-row">
              <span>存储使用</span>
              <b>{{ hdfs.used }} / {{ hdfs.total }}</b>
            </div>
            <div class="stat-row">
              <span>使用率</span>
              <el-progress :percentage="hdfs.percentUsed" :stroke-width="8" />
            </div>
          </div>
          <div v-else class="stat-loading">
            <span v-if="loading">加载中...</span>
            <span v-else>暂无数据</span>
          </div>
        </div>
      </el-col>

      <el-col :span="8">
        <div class="stat-card card card-yarn">
          <div class="card-accent-bar"></div>
          <div class="stat-head">
            <div class="stat-icon-wrap yarn">
              <svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="4" y="4" width="16" height="16" rx="2"></rect>
                <rect x="9" y="9" width="6" height="6"></rect>
              </svg>
            </div>
            <h4>YARN</h4>
            <span :class="['status-badge', yarnStatus]">{{ yarn?.status || '未知' }}</span>
          </div>
          <div v-if="yarn" class="stat-body">
            <div class="stat-row">
              <span>活跃节点</span>
              <b>{{ yarn.activeNodes }} / {{ yarn.totalNodes }}</b>
            </div>
            <div class="stat-row">
              <span>运行应用</span>
              <b class="accent">{{ yarn.runningApps }}</b>
            </div>
            <div class="stat-row">
              <span>可用内存</span>
              <b>{{ formatMB(yarn.availableMB) }} / {{ formatMB(yarn.totalMB) }}</b>
            </div>
            <div class="stat-row">
              <span>可用核数</span>
              <b>{{ yarn.availableVirtualCores }} / {{ yarn.totalVirtualCores }}</b>
            </div>
          </div>
          <div v-else class="stat-loading">
            <span v-if="loading">加载中...</span>
            <span v-else>暂无数据</span>
          </div>
        </div>
      </el-col>

      <el-col :span="8">
        <div class="stat-card card card-spark">
          <div class="card-accent-bar"></div>
          <div class="stat-head">
            <div class="stat-icon-wrap spark">
              <svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
            </div>
            <h4>Spark</h4>
            <span :class="['status-badge', sparkStatus]">{{ spark?.status || '未知' }}</span>
          </div>
          <div v-if="spark" class="stat-body">
            <div class="stat-row">
              <span>运行应用</span>
              <b class="accent">{{ spark.runningApps }}</b>
            </div>
            <div class="stat-row">
              <span>已完成应用</span>
              <b>{{ spark.completedApps }}</b>
            </div>
            <div class="stat-row">
              <span>最近应用</span>
              <b class="truncate">{{ spark.lastAppName || '-' }}</b>
            </div>
          </div>
          <div v-else class="stat-loading">
            <span v-if="loading">加载中...</span>
            <span v-else>暂无数据</span>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 快捷操作 -->
    <div class="quick-panel card">
      <div class="panel-head">
        <h4>快捷操作</h4>
        <el-button size="small" @click="refreshAll" :loading="loading">
          <svg class="btn-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l5.64 5.36A9 9 0 0 0 20.49 15"></path>
          </svg>
          刷新
        </el-button>
      </div>
      <div class="quick-btns">
        <button @click="queryService('hdfs')">
          <svg class="btn-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 3v18h18"></path>
            <path d="M18 17V9"></path>
            <path d="M13 17V5"></path>
            <path d="M8 17v-3"></path>
          </svg>
          HDFS 详情
        </button>
        <button @click="queryService('yarn')">
          <svg class="btn-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="4" y="4" width="16" height="16" rx="2"></rect>
            <rect x="9" y="9" width="6" height="6"></rect>
          </svg>
          YARN 详情
        </button>
        <button @click="queryService('spark')">
          <svg class="btn-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
          </svg>
          Spark 详情
        </button>
        <button class="primary" @click="queryService('health')">
          <svg class="btn-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
          </svg>
          全面检查
        </button>
      </div>
    </div>

    <!-- 详情对话框 -->
    <el-dialog v-model="showDialog" :title="dialogTitle" width="480px">
      <div class="dialog-content">
        <pre v-if="!dialogLoading">{{ dialogContent }}</pre>
        <div v-else class="dialog-loading">
          <el-icon class="is-loading"><i class="el-icon-loading"></i></el-icon>
          <span>{{ dialogContent }}</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="showDialog = false">关闭</el-button>
        <el-button type="primary" @click="refreshAll(); showDialog = false" v-if="!dialogLoading">
          刷新数据
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onActivated, defineOptions } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

// 组件名称，用于 KeepAlive
defineOptions({ name: 'ClusterDashboard' })

// 对话框状态
const showDialog = ref(false)
const dialogTitle = ref('')
const dialogContent = ref('')
const dialogLoading = ref(false)

const clusters = ref([])
const selectedClusterId = ref('')
const loading = ref(false)
const hdfs = ref(null)
const yarn = ref(null)
const spark = ref(null)

const currentCluster = computed(() => {
  return clusters.value.find(c => c.id === selectedClusterId.value)
})

const hdfsStatus = computed(() => {
  if (!hdfs.value) return 'unknown'
  if (hdfs.value.deadNodes > 0) return 'warning'
  return 'healthy'
})

const yarnStatus = computed(() => {
  if (!yarn.value) return 'unknown'
  if (yarn.value.activeNodes < yarn.value.totalNodes) return 'warning'
  return 'healthy'
})

const sparkStatus = computed(() => {
  if (!spark.value) return 'unknown'
  return 'healthy'
})

const formatMB = m => !m ? '0' : m > 1024 ? `${(m/1024).toFixed(1)}G` : `${m}M`
const formatGB = b => !b ? '0' : (b / 1024 / 1024 / 1024).toFixed(2) + ' TB'

const loadClusters = async () => {
  try {
    const res = await axios.get('/api/settings')
    if (res.data.clusters && res.data.clusters.length > 0) {
      clusters.value = res.data.clusters
      selectedClusterId.value = res.data.clusters[0].id
    }
  } catch (e) {
    ElMessage.error('加载集群配置失败')
  }
}

const selectCluster = (id) => {
  selectedClusterId.value = id
  // watch 会自动触发 refreshAll，无需重复调用
}

const refreshAll = async () => {
  if (!currentCluster.value) return

  loading.value = true
  try {
    // 通过后端代理请求集群状态
    const res = await axios.get(`/api/settings/cluster/status?cluster_id=${selectedClusterId.value}`)
    if (res.data) {
      hdfs.value = res.data.hdfs
      yarn.value = res.data.yarn
      spark.value = res.data.spark
    }
  } catch (e) {
    ElMessage.error('刷新集群数据失败')
  } finally {
    loading.value = false
  }
}

const queryService = async (service) => {
  if (service === 'health') {
    dialogTitle.value = '全面检查'
    dialogLoading.value = true
    showDialog.value = true
    dialogContent.value = '正在执行健康检查...'
    
    try {
      await refreshAll()
      const results = []
      if (hdfs.value) {
        results.push(`HDFS: ${hdfs.value.status === 'healthy' ? '✓ 正常' : '⚠ ' + hdfs.value.status}`)
      }
      if (yarn.value) {
        results.push(`YARN: ${yarn.value.status === 'healthy' ? '✓ 正常' : '⚠ ' + yarn.value.status}`)
      }
      if (spark.value) {
        results.push(`Spark: ${spark.value.status === 'healthy' ? '✓ 正常' : '⚠ ' + spark.value.status}`)
      }
      dialogContent.value = results.length > 0 ? results.join('\n') : '未发现服务数据'
    } catch (e) {
      dialogContent.value = '健康检查执行失败: ' + (e.message || '未知错误')
    } finally {
      dialogLoading.value = false
    }
    return
  }
  
  const serviceData = { hdfs: hdfs.value, yarn: yarn.value, spark: spark.value }[service]
  
  if (!serviceData) {
    dialogTitle.value = service.toUpperCase() + ' 详情'
    dialogContent.value = '暂无数据，请先刷新'
    showDialog.value = true
    return
  }
  
  dialogTitle.value = service.toUpperCase() + ' 详情'
  const lines = []
  for (const [key, value] of Object.entries(serviceData)) {
    if (typeof value === 'object') continue
    lines.push(`${key}: ${value}`)
  }
  dialogContent.value = lines.join('\n')
  showDialog.value = true
}

onMounted(() => {
  loadClusters()
})

watch(selectedClusterId, () => {
  refreshAll()
})
</script>

<style scoped>
.dashboard { width: 100%; }

.cluster-selector {
  padding: 16px 20px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.selector-header {
  display: none;
}

.cluster-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.cluster-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--bg-solid);
  border: 1px solid var(--border-weak);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
}

.cluster-tab:hover {
  border-color: var(--accent);
  background: var(--bg-hover);
}

.cluster-tab.active {
  border-color: var(--accent);
  background: var(--accent);
  color: white;
}

.cluster-tab.active .cluster-env {
  background: rgba(255,255,255,0.2);
  color: white;
}

.cluster-icon {
  font-size: 16px;
}

.cluster-name {
  font-weight: 600;
  color: inherit;
}

.cluster-env {
  font-size: 10px;
  padding: 2px 6px;
  background: var(--tag-blue-bg);
  color: var(--tag-blue-text);
  border-radius: 10px;
}

/* ========== 统计卡片 ========== */
.stats-row {
  margin-bottom: 0;
}

.stat-card {
  padding: 16px;
  height: 100%;
  min-height: 200px;
  overflow: hidden;
  position: relative;
  transition: all 0.25s ease;
  display: flex;
  flex-direction: column;
}

.stat-card:hover {
  box-shadow: 0 0 24px var(--accent-glow);
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
}

.card-hdfs::before {
  background: linear-gradient(180deg, #0f766e, #14b8a6);
}

.card-yarn::before {
  background: linear-gradient(180deg, #b45309, #f59e0b);
}

.card-spark::before {
  background: linear-gradient(180deg, #d97706, #fbbf24);
}

.stat-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding-left: 8px;
}

.stat-head h4 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
}

.stat-icon-wrap {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon-wrap.hdfs {
  background: rgba(15, 118, 110, 0.15);
  color: #0f766e;
}
[data-theme="dark"] .stat-icon-wrap.hdfs {
  background: rgba(20, 184, 166, 0.2);
  color: #14b8a6;
}

.stat-icon-wrap.yarn {
  background: rgba(180, 83, 9, 0.15);
  color: #b45309;
}
[data-theme="dark"] .stat-icon-wrap.yarn {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.stat-icon-wrap.spark {
  background: rgba(217, 119, 6, 0.15);
  color: #d97706;
}
[data-theme="dark"] .stat-icon-wrap.spark {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}

.stat-icon {
  width: 20px;
  height: 20px;
}

.stat-head h4 {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  flex: 1;
}

.status-badge {
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 20px;
  font-weight: 600;
}

.status-badge.healthy {
  background: var(--tag-green-bg);
  color: var(--tag-green-text);
}

.status-badge.warning {
  background: var(--tag-orange-bg);
  color: var(--tag-orange-text);
}

.status-badge.unknown {
  background: var(--bg-hover);
  color: var(--text-muted);
}

.stat-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  padding: 6px 0;
  border-bottom: 1px dashed var(--border-weak);
}

.stat-row:last-child {
  border-bottom: none;
}

.stat-row span {
  color: var(--text-muted);
}

.stat-row b {
  color: var(--text-primary);
  font-weight: 600;
  font-family: var(--font-mono);
}

.stat-row b.danger {
  color: var(--danger);
}

.stat-row b.accent {
  color: var(--accent);
}

.stat-row b.truncate {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stat-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 120px;
  color: var(--text-muted);
  font-size: 14px;
  padding: 0 20px 20px;
}

.el-col {
  margin-bottom: 16px;
}

.quick-panel {
  padding: 16px 20px;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.panel-head h4 {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--accent);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.panel-head h4::before { content: '// '; opacity: 0.5; }

.quick-btns {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.quick-btns button {
  padding: 10px 16px;
  background: var(--bg-hover);
  border: 1px solid var(--border-weak);
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}
.quick-btns button:hover {
  border-color: var(--accent);
  background: var(--bg-hover);
  color: var(--text-primary);
}
.quick-btns button.primary {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
}
.quick-btns button.primary:hover {
  background: var(--accent-dark);
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.panel-head h4 {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.quick-btns {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.quick-btns button {
  padding: 12px 20px;
  background: var(--bg-hover);
  border: var(--border-medium-line);
  border-radius: var(--radius-sm);
  font-size: 14px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}
.quick-btns button:nth-child(1) { border-left: 3px solid #14b8a6; }
.quick-btns button:nth-child(2) { border-left: 3px solid #f59e0b; }
.quick-btns button:nth-child(3) { border-left: 3px solid #fbbf24; }
.quick-btns button:hover {
  border-color: var(--accent);
  color: var(--accent);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}
.quick-btns button.primary {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
}
.quick-btns button.primary:hover {
  background: var(--accent-dark);
  border-color: var(--accent-dark);
  color: white;
}
.btn-icon-sm { width: 16px; height: 16px; flex-shrink: 0; }

/* 响应式 */
@media (max-width: 768px) {
  .cluster-tabs {
    flex-direction: column;
  }

  .stat-card {
    min-height: auto;
  }
}

.dialog-content {
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.8;
  background: var(--bg-hover);
  padding: 16px;
  border-radius: 8px;
  max-height: 400px;
  overflow: auto;
}

.dialog-content pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.dialog-loading {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-muted);
}
</style>