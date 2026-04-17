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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onActivated, defineOptions } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

// 组件名称，用于 KeepAlive
defineOptions({ name: 'ClusterDashboard' })

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

const queryService = (service) => {
  // 发送事件让父组件处理
  console.log('Query service:', service, 'Cluster:', selectedClusterId.value)
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

/* 集群选择器 */
.cluster-selector {
  padding: 20px;
  margin-bottom: 20px;
}

.selector-header h4 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.cluster-tabs {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.cluster-tab {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  background: var(--bg-hover);
  border: var(--border-medium-line);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
}

.cluster-tab:hover {
  border-color: var(--accent);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.cluster-tab.active {
  border-color: var(--accent);
  background: var(--accent-glow);
  box-shadow: var(--shadow-glow);
}

.cluster-icon {
  font-size: 20px;
}

.cluster-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.cluster-env {
  font-size: 11px;
  padding: 2px 8px;
  background: var(--tag-blue-bg);
  color: var(--tag-blue-text);
  border-radius: var(--radius-sm);
}

/* ========== 统计卡片 ========== */
.stats-row {
  margin-bottom: 0;
}

.stat-card {
  padding: 0;
  height: 100%;
  min-height: 240px;
  overflow: hidden;
  position: relative;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* Colored top accent bar */
.card-accent-bar {
  height: 3px;
  width: 100%;
}

.card-hdfs .card-accent-bar {
  background: linear-gradient(90deg, #0369a1 0%, #0ea5e9 100%);
}

.card-yarn .card-accent-bar {
  background: linear-gradient(90deg, #7c3aed 0%, #a78bfa 100%);
}

.card-spark .card-accent-bar {
  background: linear-gradient(90deg, #d97706 0%, #fbbf24 100%);
}

.stat-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding: 16px 20px 12px;
  border-bottom: var(--border-weak-line);
}

/* Icon wrapper with colored background */
.stat-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon-wrap.hdfs {
  background: rgba(3, 105, 161, 0.1);
  color: #0369a1;
}
[data-theme="dark"] .stat-icon-wrap.hdfs {
  background: rgba(56, 189, 248, 0.1);
  color: #38bdf8;
}

.stat-icon-wrap.yarn {
  background: rgba(124, 58, 237, 0.1);
  color: #7c3aed;
}
[data-theme="dark"] .stat-icon-wrap.yarn {
  background: rgba(167, 139, 250, 0.1);
  color: #a78bfa;
}

.stat-icon-wrap.spark {
  background: rgba(217, 119, 6, 0.1);
  color: #d97706;
}
[data-theme="dark"] .stat-icon-wrap.spark {
  background: rgba(251, 191, 36, 0.1);
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
  gap: 12px;
  padding: 0 20px 20px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.stat-row span {
  color: var(--text-muted);
}

.stat-row b {
  color: var(--text-primary);
  font-weight: 600;
  font-family: var(--font-mono);
  font-size: 13px;
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

/* ========== 快捷操作 ========== */
.quick-panel {
  padding: 20px;
  margin-top: 4px;
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
.quick-btns button:nth-child(1) { border-left: 3px solid #0ea5e9; }
.quick-btns button:nth-child(2) { border-left: 3px solid #a78bfa; }
.quick-btns button:nth-child(3) { border-left: 3px solid #fbbf24; }
.quick-btns button:hover {
  border-color: var(--accent);
  color: var(--accent);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}
.quick-btns button.primary {
  background: var(--accent-gradient);
  border: none;
  border-left: none;
  color: white;
  box-shadow: 0 2px 8px var(--accent-glow);
}
.quick-btns button.primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px var(--accent-glow);
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
</style>