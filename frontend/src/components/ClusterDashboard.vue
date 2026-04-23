<template>
  <div class="bp-dashboard">
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
            <span>CLUSTER TELEMETRY</span>
          </span>

          <h1 class="bp-display-title">
            <span class="bp-t-main">集群</span>
            <span class="bp-t-accent">DASHBOARD</span>
            <span class="bp-t-mute">/ HDFS · YARN · SPARK</span>
          </h1>

          <div class="bp-dim">
            <span class="bp-dim-arrow">◂</span>
            <span class="bp-dim-line"></span>
            <span class="bp-dim-num">{{ String(clusters.length).padStart(2, '0') }} NODES</span>
            <span class="bp-dim-line"></span>
            <span class="bp-dim-arrow">▸</span>
          </div>

          <p class="bp-sub">大数据集群健康监控 — 实时抓取 HDFS 容量、YARN 队列占用、Spark 任务状态与节点存活。</p>

          <div class="bp-callouts">
            <span class="bp-callout"><em>A</em><span>HDFS · STORAGE</span></span>
            <span class="bp-callout is-amber"><em>B</em><span>YARN · QUEUE</span></span>
            <span class="bp-callout is-green"><em>C</em><span>SPARK · JOBS</span></span>
          </div>
        </div>

        <!-- Live stamp -->
        <div class="bp-stamp">
          <div class="bp-stamp-inner is-blue">
            <span class="bp-stamp-check">●</span>
            <div class="bp-stamp-text">
              <strong>LIVE</strong>
              <small>METRICS · {{ clockNow }}</small>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- ╭── Cluster Selector ──╮ -->
    <section class="bp-cluster-select">
      <div
        v-for="cluster in clusters"
        :key="cluster.id"
        :class="['bp-cluster-tab', { active: selectedClusterId === cluster.id }]"
        @click="selectCluster(cluster.id)"
      >
        <span class="bp-tab-icon">{{ cluster.icon || '◇' }}</span>
        <span class="bp-tab-name">{{ cluster.name }}</span>
        <span class="bp-tab-env">{{ cluster.environment || '生产' }}</span>
      </div>
    </section>

    <!-- ╭── Service Cards ──╮ -->
    <section class="bp-services">
      <!-- HDFS -->
      <div class="bp-svc-card bp-svc-hdfs">
        <span class="bp-card-tick-tl"></span>
        <span class="bp-card-tick-tr"></span>
        <span class="bp-card-tick-bl"></span>
        <span class="bp-card-tick-br"></span>

        <div class="bp-svc-head">
          <div class="bp-svc-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 3v18h18"/>
              <path d="M18 17V9"/>
              <path d="M13 17V5"/>
              <path d="M8 17v-3"/>
            </svg>
          </div>
          <h4 class="bp-svc-name">HDFS</h4>
          <span :class="['bp-status', hdfsStatus]">{{ hdfs?.status || '未知' }}</span>
        </div>

        <div v-if="hdfs" class="bp-svc-body">
          <div class="bp-row">
            <span class="bp-row-k">01 存活节点</span>
            <span class="bp-row-v">{{ hdfs.liveNodes }}</span>
          </div>
          <div class="bp-row">
            <span class="bp-row-k">02 死亡节点</span>
            <span :class="['bp-row-v', { danger: hdfs.deadNodes > 0 }]">{{ hdfs.deadNodes }}</span>
          </div>
          <div class="bp-row">
            <span class="bp-row-k">03 存储使用</span>
            <span class="bp-row-v">{{ hdfs.used }} / {{ hdfs.total }}</span>
          </div>
          <div class="bp-row">
            <span class="bp-row-k">04 使用率</span>
            <div class="bp-progress">
              <div class="bp-progress-bar" :style="{ width: hdfs.percentUsed + '%' }"></div>
              <span class="bp-progress-val">{{ hdfs.percentUsed }}%</span>
            </div>
          </div>
        </div>
        <div v-else class="bp-svc-empty">
          <span v-if="loading" class="bp-spinner"></span>
          <span>{{ loading ? '加载中...' : '暂无数据' }}</span>
        </div>
      </div>

      <!-- YARN -->
      <div class="bp-svc-card bp-svc-amber">
        <span class="bp-card-tick-tl"></span>
        <span class="bp-card-tick-tr"></span>
        <span class="bp-card-tick-bl"></span>
        <span class="bp-card-tick-br"></span>

        <div class="bp-svc-head">
          <div class="bp-svc-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="4" y="4" width="16" height="16" rx="2"/>
              <rect x="9" y="9" width="6" height="6"/>
            </svg>
          </div>
          <h4 class="bp-svc-name">YARN</h4>
          <span :class="['bp-status', yarnStatus]">{{ yarn?.status || '未知' }}</span>
        </div>

        <div v-if="yarn" class="bp-svc-body">
          <div class="bp-row">
            <span class="bp-row-k">01 活跃节点</span>
            <span class="bp-row-v">{{ yarn.activeNodes }} / {{ yarn.totalNodes }}</span>
          </div>
          <div class="bp-row">
            <span class="bp-row-k">02 运行应用</span>
            <span class="bp-row-v bp-accent">{{ yarn.runningApps }}</span>
          </div>
          <div class="bp-row">
            <span class="bp-row-k">03 可用内存</span>
            <span class="bp-row-v">{{ formatMB(yarn.availableMB) }} / {{ formatMB(yarn.totalMB) }}</span>
          </div>
          <div class="bp-row">
            <span class="bp-row-k">04 可用核数</span>
            <span class="bp-row-v">{{ yarn.availableVirtualCores }} / {{ yarn.totalVirtualCores }}</span>
          </div>
        </div>
        <div v-else class="bp-svc-empty">
          <span v-if="loading" class="bp-spinner"></span>
          <span>{{ loading ? '加载中...' : '暂无数据' }}</span>
        </div>
      </div>

      <!-- Spark -->
      <div class="bp-svc-card bp-svc-spark">
        <span class="bp-card-tick-tl"></span>
        <span class="bp-card-tick-tr"></span>
        <span class="bp-card-tick-bl"></span>
        <span class="bp-card-tick-br"></span>

        <div class="bp-svc-head">
          <div class="bp-svc-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </div>
          <h4 class="bp-svc-name">Spark</h4>
          <span :class="['bp-status', sparkStatus]">{{ spark?.status || '未知' }}</span>
        </div>

        <div v-if="spark" class="bp-svc-body">
          <div class="bp-row">
            <span class="bp-row-k">01 运行应用</span>
            <span class="bp-row-v bp-accent">{{ spark.runningApps }}</span>
          </div>
          <div class="bp-row">
            <span class="bp-row-k">02 已完成</span>
            <span class="bp-row-v">{{ spark.completedApps }}</span>
          </div>
          <div class="bp-row">
            <span class="bp-row-k">03 最近应用</span>
            <span class="bp-row-v truncate">{{ spark.lastAppName || '--' }}</span>
          </div>
        </div>
        <div v-else class="bp-svc-empty">
          <span v-if="loading" class="bp-spinner"></span>
          <span>{{ loading ? '加载中...' : '暂无数据' }}</span>
        </div>
      </div>
    </section>

    <!-- ╭── Quick Actions ──╮ -->
    <section class="bp-quick-panel">
      <div class="bp-quick-head">
        <span class="bp-quick-title">快捷操作</span>
        <button class="bp-btn" @click="refreshAll" :disabled="loading">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l5.64 5.36A9 9 0 0020.49 15"/>
          </svg>
          <span>{{ loading ? '刷新中...' : '刷新' }}</span>
        </button>
      </div>
      <div class="bp-quick-btns">
        <button class="bp-quick-btn bp-btn-hdfs" @click="queryService('hdfs')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 3v18h18"/>
            <path d="M18 17V9"/>
            <path d="M13 17V5"/>
            <path d="M8 17v-3"/>
          </svg>
          <span>HDFS 详情</span>
        </button>
        <button class="bp-quick-btn bp-btn-yarn" @click="queryService('yarn')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="4" y="4" width="16" height="16" rx="2"/>
            <rect x="9" y="9" width="6" height="6"/>
          </svg>
          <span>YARN 详情</span>
        </button>
        <button class="bp-quick-btn bp-btn-spark" @click="queryService('spark')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          <span>Spark 详情</span>
        </button>
        <button class="bp-quick-btn bp-btn-health" @click="queryService('health')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
          <span>全面检查</span>
        </button>
      </div>
    </section>

    <!-- ╭── Detail Dialog ──╮ -->
    <el-dialog v-model="showDialog" width="520px" class="bp-dialog">
      <template #header>
        <div class="bp-dialog-head">
          <span class="bp-dialog-k">DETAIL</span>
          <span class="bp-dialog-v">{{ dialogTitle }}</span>
        </div>
      </template>

      <div class="bp-dialog-body">
        <pre v-if="!dialogLoading" class="bp-dialog-pre">{{ dialogContent }}</pre>
        <div v-else class="bp-dialog-loading">
          <span class="bp-spinner"></span>
          <span>{{ dialogContent }}</span>
        </div>
      </div>

      <template #footer>
        <div class="bp-dialog-footer">
          <button class="bp-btn" @click="showDialog = false">关闭</button>
          <button v-if="!dialogLoading" class="bp-btn-primary" @click="refreshAll(); showDialog = false">
            <span>刷新数据</span>
            <span class="bp-btn-arrow">▸</span>
          </button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, defineOptions } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

defineOptions({ name: 'ClusterDashboard' })

const clockNow = ref('')
const updateClock = () => {
  const d = new Date()
  clockNow.value = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}
updateClock()
let clockTimer = null

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

const currentCluster = computed(() => clusters.value.find(c => c.id === selectedClusterId.value))

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
}

const refreshAll = async () => {
  if (!currentCluster.value) return
  loading.value = true
  try {
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
      if (hdfs.value) results.push(`HDFS: ${hdfs.value.status === 'healthy' ? '✓ 正常' : '⚠ ' + hdfs.value.status}`)
      if (yarn.value) results.push(`YARN: ${yarn.value.status === 'healthy' ? '✓ 正常' : '⚠ ' + yarn.value.status}`)
      if (spark.value) results.push(`Spark: ${spark.value.status === 'healthy' ? '✓ 正常' : '⚠ ' + spark.value.status}`)
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
  clockTimer = setInterval(updateClock, 1000)
})

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer)
})
watch(selectedClusterId, () => refreshAll())
</script>

<style scoped>
.bp-dashboard {
  width: 100%;
  animation: bp-fade 0.4s ease-out;
}

/* page-head base inherited from global blueprint.css */

/* ╭── Cluster Selector ──╮ */
.bp-cluster-select {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.bp-cluster-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(14, 29, 49, 0.6);
  border: 1px solid rgba(92, 228, 255, 0.15);
  cursor: pointer;
  transition: all 0.2s ease;
}

.bp-cluster-tab:hover {
  border-color: rgba(92, 228, 255, 0.3);
  background: rgba(92, 228, 255, 0.05);
}

.bp-cluster-tab.active {
  border-color: var(--bp-blueprint);
  background: rgba(92, 228, 255, 0.1);
}

.bp-tab-icon {
  font-size: 14px;
  color: var(--bp-blueprint);
}

.bp-tab-name {
  font-family: var(--bp-fnt-mono);
  font-size: 12px;
  font-weight: 600;
  color: var(--bp-chalk);
}

.bp-tab-env {
  font-family: var(--bp-fnt-mono);
  font-size: 10px;
  padding: 2px 6px;
  background: rgba(92, 228, 255, 0.1);
  color: var(--bp-chalk-dim);
}

/* ╭── Service Cards ──╮ */
.bp-services {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.bp-svc-card {
  position: relative;
  padding: 20px 24px;
  background: linear-gradient(180deg, rgba(14, 29, 49, 0.8) 0%, rgba(10, 23, 38, 0.9) 100%);
  border: 1px solid rgba(92, 228, 255, 0.25);
  display: flex;
  flex-direction: column;
  min-height: 200px;
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

.bp-svc-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(92, 228, 255, 0.4), transparent);
}

.bp-svc-card::after {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
}

.bp-svc-hdfs::after { background: var(--bp-blueprint); }
.bp-svc-amber::after { background: var(--bp-amber); }
.bp-svc-spark::after { background: linear-gradient(180deg, var(--bp-amber), #fbbf24); }

.bp-svc-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px dashed rgba(92, 228, 255, 0.15);
}

.bp-svc-icon {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(92, 228, 255, 0.15);
  background: rgba(92, 228, 255, 0.06);
}

.bp-svc-hdfs .bp-svc-icon { color: var(--bp-blueprint); border-color: rgba(92, 228, 255, 0.2); }
.bp-svc-amber .bp-svc-icon { color: var(--bp-amber); border-color: rgba(245, 166, 35, 0.2); background: rgba(245, 166, 35, 0.06); }
.bp-svc-spark .bp-svc-icon { color: #fbbf24; border-color: rgba(251, 191, 36, 0.2); background: rgba(251, 191, 36, 0.06); }

.bp-svc-icon svg {
  width: 18px;
  height: 18px;
}

.bp-svc-name {
  font-family: var(--bp-fnt-mono);
  font-size: 14px;
  font-weight: 700;
  color: var(--bp-chalk);
  letter-spacing: 0.06em;
}

.bp-status {
  font-family: var(--bp-fnt-mono);
  font-size: 10px;
  padding: 4px 8px;
  letter-spacing: 0.08em;
}

.bp-status.healthy {
  background: rgba(80, 200, 120, 0.15);
  color: var(--bp-green-check);
  border: 1px solid rgba(80, 200, 120, 0.3);
}

.bp-status.warning {
  background: rgba(245, 166, 35, 0.15);
  color: var(--bp-amber);
  border: 1px solid rgba(245, 166, 35, 0.3);
}

.bp-status.unknown {
  background: rgba(92, 228, 255, 0.06);
  color: var(--bp-chalk-dim);
  border: 1px solid rgba(92, 228, 255, 0.15);
}

.bp-svc-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.bp-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(92, 228, 255, 0.08);
}

.bp-row:last-child {
  border-bottom: none;
}

.bp-row-k {
  font-family: var(--bp-fnt-mono);
  font-size: 11px;
  color: var(--bp-chalk-dim);
  letter-spacing: 0.08em;
}

.bp-row-v {
  font-family: var(--bp-fnt-mono);
  font-size: 13px;
  color: var(--bp-chalk);
}

.bp-row-v.danger {
  color: var(--bp-red-stamp);
}

.bp-row-v.accent {
  color: var(--bp-amber);
}

.bp-row-v.truncate {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bp-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100px;
}

.bp-progress-bar {
  height: 8px;
  background: var(--bp-blueprint);
  min-width: 4px;
}

.bp-progress-val {
  font-family: var(--bp-fnt-mono);
  font-size: 11px;
  color: var(--bp-chalk);
}

.bp-svc-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex: 1;
  color: var(--bp-chalk-dim);
}

.bp-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(92, 228, 255, 0.2);
  border-top-color: var(--bp-blueprint);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* ╭── Quick Panel ──╮ */
.bp-quick-panel {
  padding: 20px 24px;
  background: rgba(14, 29, 49, 0.6);
  border: 1px solid rgba(92, 228, 255, 0.2);
}

.bp-quick-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px dashed rgba(92, 228, 255, 0.15);
}

.bp-quick-title {
  font-family: var(--bp-fnt-mono);
  font-size: 12px;
  color: var(--bp-blueprint);
  font-weight: 700;
  letter-spacing: 0.1em;
}

.bp-quick-btns {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.bp-quick-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(92, 228, 255, 0.05);
  border: 1px solid rgba(92, 228, 255, 0.15);
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: var(--bp-fnt-mono);
  font-size: 12px;
  color: var(--bp-chalk);
  letter-spacing: 0.06em;
}

.bp-quick-btn:hover {
  border-color: var(--bp-blueprint);
  background: rgba(92, 228, 255, 0.08);
  box-shadow: 0 0 12px rgba(92, 228, 255, 0.2);
}

.bp-quick-btn svg {
  width: 16px;
  height: 16px;
}

.bp-btn-hdfs { border-left: 3px solid var(--bp-blueprint); }
.bp-btn-yarn { border-left: 3px solid var(--bp-amber); }
.bp-btn-spark { border-left: 3px solid #fbbf24; }
.bp-btn-health {
  border-left: 3px solid var(--bp-green-check);
  background: rgba(80, 200, 120, 0.05);
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

.bp-dialog-body {
  padding: 16px;
  background: rgba(92, 228, 255, 0.05);
  border: 1px solid rgba(92, 228, 255, 0.15);
  max-height: 400px;
  overflow: auto;
}

.bp-dialog-pre {
  font-family: var(--bp-fnt-mono);
  font-size: 13px;
  color: var(--bp-chalk);
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
}

.bp-dialog-loading {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--bp-chalk-dim);
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

/* ╭── Animations ──╮ */
@keyframes bp-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes spin { to { transform: rotate(360deg); } }

/* ╭── Responsive ──╮ */
@media (max-width: 1024px) {
  .bp-services { grid-template-columns: 1fr; }
  .bp-svc-card { min-height: auto; }
}
</style>