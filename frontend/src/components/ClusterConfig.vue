<template>
  <div class="config-container">
    <div class="config-header">
      <h3>集群配置</h3>
      <p>配置多个大数据集群的连接地址和认证信息</p>
    </div>

    <!-- 集群列表 -->
    <div class="clusters-section card">
      <div class="section-header">
        <h4>
          集群列表
        </h4>
        <el-button type="primary" size="small" @click="addCluster">
          添加集群
        </el-button>
      </div>

      <div class="clusters-grid">
        <div
          v-for="(cluster, index) in clusters"
          :key="cluster.id"
          class="cluster-card card"
          :class="{ active: activeClusterId === cluster.id }"
          @click="selectCluster(cluster.id)"
        >
          <div class="cluster-header">
            <div class="cluster-icon">
              {{ cluster.icon || '🏢' }}
            </div>
            <div class="cluster-info">
              <h5>{{ cluster.name }}</h5>
              <span class="cluster-env">{{ cluster.environment || '生产环境' }}</span>
            </div>
            <div class="cluster-actions">
              <el-button size="small" text @click.stop="editClusterMeta(cluster)">
                编辑
              </el-button>
              <el-button size="small" text type="danger" @click.stop="removeCluster(cluster.id)">
                删除
              </el-button>
            </div>
          </div>
          <div class="cluster-services">
            <div class="service-badge" :class="{ active: cluster.hadoop?.namenodeUrl }">
              HDFS
            </div>
            <div class="service-badge" :class="{ active: cluster.hadoop?.yarnUrl }">
              YARN
            </div>
            <div class="service-badge" :class="{ active: cluster.ambari?.url }">
              Ambari
            </div>
          </div>
        </div>

        <!-- 添加集群卡片 -->
        <div class="cluster-card add-card" @click="addCluster">
          <div class="add-icon">+</div>
          <span>添加新集群</span>
        </div>
      </div>
    </div>

    <!-- 集群详情配置 -->
    <div v-if="currentCluster" class="cluster-detail card">
      <div class="detail-header">
        <div class="cluster-title">
          <span class="cluster-icon-lg">{{ currentCluster.icon || '🏢' }}</span>
          <div>
            <h4>{{ currentCluster.name }}</h4>
            <span class="cluster-desc">{{ currentCluster.description || '点击编辑集群信息' }}</span>
          </div>
        </div>
        <el-button size="small" @click="editClusterMeta(currentCluster)">
          编辑信息
        </el-button>
      </div>

      <el-tabs v-model="activeTab" class="config-tabs">
        <!-- Hadoop 配置 -->
        <el-tab-pane label="Hadoop" name="hadoop">
          <div class="config-section">
            <div class="section-title">
              <span>Hadoop 集群</span>
            </div>
            <el-form :model="currentCluster.hadoop" label-position="top" class="config-form">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="NameNode WebHDFS 地址">
                    <div class="input-with-link">
                      <el-input
                        v-model="currentCluster.hadoop.namenodeUrl"
                        placeholder="http://namenode:9870"
                        @change="saveClusters"
                      />
                      <el-button
                        v-if="currentCluster.hadoop.namenodeUrl"
                        class="link-btn"
                        @click="openUrl(currentCluster.hadoop.namenodeUrl)"
                        title="在新窗口打开"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                          <polyline points="15 3 21 3 21 9"></polyline>
                          <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                      </el-button>
                    </div>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="ResourceManager 地址">
                    <div class="input-with-link">
                      <el-input
                        v-model="currentCluster.hadoop.yarnUrl"
                        placeholder="http://resourcemanager:8088"
                        @change="saveClusters"
                      />
                      <el-button
                        v-if="currentCluster.hadoop.yarnUrl"
                        class="link-btn"
                        @click="openUrl(currentCluster.hadoop.yarnUrl)"
                        title="在新窗口打开"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                          <polyline points="15 3 21 3 21 9"></polyline>
                          <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                      </el-button>
                    </div>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="Hadoop 用户">
                    <el-input
                      v-model="currentCluster.hadoop.user"
                      placeholder="hadoop"
                      @change="saveClusters"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Kerberos 认证">
                    <el-switch
                      v-model="currentCluster.hadoop.kerberosEnabled"
                      @change="saveClusters"
                    />
                  </el-form-item>
                </el-col>
              </el-row>
              <div v-if="currentCluster.hadoop.kerberosEnabled" class="kerberos-config">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="Principal">
                      <el-input
                        v-model="currentCluster.hadoop.kerberosPrincipal"
                        placeholder="hadoop@REALM.COM"
                        @change="saveClusters"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="Keytab 路径">
                      <el-input
                        v-model="currentCluster.hadoop.kerberosKeytab"
                        placeholder="/path/to/keytab"
                        @change="saveClusters"
                      />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>
            </el-form>
          </div>
        </el-tab-pane>

        <!-- Ambari 配置 -->
        <el-tab-pane label="Ambari" name="ambari">
          <div class="config-section">
            <div class="section-title">
              <span>Ambari 管理</span>
            </div>
            <el-form :model="currentCluster.ambari" label-position="top" class="config-form">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="Ambari Server 地址">
                    <div class="input-with-link">
                      <el-input
                        v-model="currentCluster.ambari.url"
                        placeholder="http://ambari:8080"
                        @change="saveClusters"
                      />
                      <el-button
                        v-if="currentCluster.ambari.url"
                        class="link-btn"
                        @click="openUrl(currentCluster.ambari.url)"
                        title="在新窗口打开"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                          <polyline points="15 3 21 3 21 9"></polyline>
                          <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                      </el-button>
                    </div>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="集群名称">
                    <el-input
                      v-model="currentCluster.ambari.clusterName"
                      placeholder="my-cluster"
                      @change="saveClusters"
                    />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="用户名">
                    <el-input
                      v-model="currentCluster.ambari.username"
                      placeholder="admin"
                      @change="saveClusters"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="密码">
                    <el-input
                      v-model="currentCluster.ambari.password"
                      type="password"
                      placeholder="admin"
                      show-password
                      @change="saveClusters"
                    />
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </div>
        </el-tab-pane>
      </el-tabs>

      <!-- 连接测试 -->
      <div class="test-section">
        <el-button @click="testConnection('hdfs')" :loading="testingHdfs">
          测试 HDFS
        </el-button>
        <el-button @click="testConnection('yarn')" :loading="testingYarn">
          测试 YARN
        </el-button>
        <span v-if="testResult" :class="['test-result', testResult.success ? 'success' : 'error']">
          {{ testResult.message }}
        </span>
      </div>
    </div>

    <!-- 全局 Spark 配置 -->
    <div class="spark-section card">
      <div class="section-header">
        <h4>
          Spark History Server（全局）
        </h4>
        <el-button size="small" @click="testSparkConnection" :loading="testingSpark">
          测试连接
        </el-button>
      </div>
      <p class="section-desc">所有集群共用同一个 Spark History Server</p>
      <el-form label-position="top" class="config-form">
        <el-form-item label="Spark History Server 地址">
          <div class="input-with-link">
            <el-input
              v-model="globalSparkUrl"
              placeholder="http://spark-history:18080"
              @change="saveGlobalSettings"
            />
            <el-button
              v-if="globalSparkUrl"
              class="link-btn"
              @click="openUrl(globalSparkUrl)"
              title="在新窗口打开"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </el-button>
          </div>
        </el-form-item>
      </el-form>
    </div>

    <!-- AI 模型配置 -->
    <div class="models-section card">
      <div class="section-header">
        <h4>
          AI 模型配置
        </h4>
        <el-button type="primary" size="small" @click="addModel">
          添加模型
        </el-button>
      </div>

      <div class="models-grid">
        <div
          v-for="model in models"
          :key="model.id"
          class="model-card"
          :class="{ active: model.isDefault, disabled: !model.enabled }"
        >
          <div class="model-header">
            <div class="model-info">
              <h5>{{ model.name }}</h5>
              <span class="model-id">{{ model.model }}</span>
            </div>
            <div class="model-badges">
              <span v-if="model.isDefault" class="badge-default">默认</span>
              <span :class="['badge-status', model.enabled ? 'enabled' : 'disabled']">
                {{ model.enabled ? '启用' : '禁用' }}
              </span>
            </div>
          </div>
          <div class="model-details">
            <div class="detail-item">
              <span class="label">API 地址:</span>
              <span class="value">{{ model.apiUrl || '未配置' }}</span>
            </div>
          </div>
          <div class="model-actions">
            <el-button size="small" @click="editModel(model)">编辑</el-button>
            <el-button size="small" @click="testModelConnection(model)" :loading="model.testing">
              测试
            </el-button>
            <el-button v-if="!model.isDefault" size="small" type="primary" @click="setDefaultModel(model.id)">
              设为默认
            </el-button>
            <el-button size="small" type="danger" @click="removeModel(model.id)">删除</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 模型编辑弹窗 -->
    <el-dialog v-model="modelDialogVisible" :title="isEditModel ? '编辑模型' : '添加模型'" width="500px">
      <el-form :model="modelForm" label-position="top">
        <el-form-item label="模型名称">
          <el-input v-model="modelForm.name" placeholder="例如：GLM-5、DeepSeek 等" />
        </el-form-item>
        <el-form-item label="模型 ID">
          <el-input v-model="modelForm.model" placeholder="例如：glm-5、deepseek-chat" />
        </el-form-item>
        <el-form-item label="API 地址">
          <el-input v-model="modelForm.apiUrl" placeholder="例如：http://api.example.com/v1/chat/completions" />
        </el-form-item>
        <el-form-item label="API Key">
          <el-input v-model="modelForm.apiKey" type="password" show-password placeholder="API 密钥" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="启用">
              <el-switch v-model="modelForm.enabled" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设为默认">
              <el-switch v-model="modelForm.isDefault" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="modelDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveModel">保存</el-button>
      </template>
    </el-dialog>

    <!-- 集群信息编辑弹窗 -->
    <el-dialog v-model="clusterDialogVisible" title="编辑集群信息" width="450px">
      <el-form :model="clusterForm" label-position="top">
        <el-form-item label="集群名称">
          <el-input v-model="clusterForm.name" placeholder="例如：生产集群 A" />
        </el-form-item>
        <el-form-item label="集群标识">
          <el-input v-model="clusterForm.id" placeholder="例如：cluster-prod-a" :disabled="isEditMode" />
        </el-form-item>
        <el-form-item label="环境">
          <el-select v-model="clusterForm.environment" style="width: 100%">
            <el-option label="生产环境" value="production" />
            <el-option label="测试环境" value="staging" />
            <el-option label="开发环境" value="development" />
          </el-select>
        </el-form-item>
        <el-form-item label="图标">
          <div class="icon-selector">
            <span
              v-for="icon in clusterIcons"
              :key="icon"
              :class="['icon-option', { active: clusterForm.icon === icon }]"
              @click="clusterForm.icon = icon"
            >
              {{ icon }}
            </span>
          </div>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="clusterForm.description" type="textarea" :rows="2" placeholder="集群描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="clusterDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveClusterMeta">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const activeTab = ref('hadoop')
const activeClusterId = ref('')
const clusterDialogVisible = ref(false)
const isEditMode = ref(false)

const clusterIcons = ['🏢', '🏭', '数据中心', '☁️', '🌐', '💻', '🖥️', '📡']

const clusterForm = ref({
  id: '',
  name: '',
  environment: 'production',
  icon: '🏢',
  description: '',
})

const createEmptyCluster = (id, name) => ({
  id,
  name,
  icon: '🏢',
  environment: 'production',
  description: '',
  hadoop: {
    namenodeUrl: '',
    yarnUrl: '',
    user: 'hadoop',
    kerberosEnabled: false,
    kerberosPrincipal: '',
    kerberosKeytab: '',
  },
  ambari: {
    url: '',
    username: 'admin',
    password: '',
    clusterName: '',
  },
})

const clusters = ref([
  createEmptyCluster('cluster-default', '默认集群'),
])

// 全局 Spark 配置
const globalSparkUrl = ref('')

// 多模型配置
const models = ref([
  {
    id: 'model-default',
    name: 'GLM-5',
    enabled: true,
    apiUrl: 'http://llmapi.ld-hadoop.com/v1/chat/completions',
    apiKey: '',
    model: 'glm-5',
    isDefault: true,
  },
])

const modelDialogVisible = ref(false)
const isEditModel = ref(false)
const modelForm = ref({
  id: '',
  name: '',
  model: '',
  apiUrl: '',
  apiKey: '',
  enabled: true,
  isDefault: false,
})

const testingHdfs = ref(false)
const testingYarn = ref(false)
const testingSpark = ref(false)
const testResult = ref(null)

const currentCluster = computed(() => {
  return clusters.value.find(c => c.id === activeClusterId.value) || null
})

const selectCluster = (id) => {
  activeClusterId.value = id
}

const addCluster = () => {
  isEditMode.value = false
  clusterForm.value = {
    id: `cluster-${Date.now()}`,
    name: '新集群',
    environment: 'production',
    icon: '🏢',
    description: '',
  }
  clusterDialogVisible.value = true
}

const editClusterMeta = (cluster) => {
  isEditMode.value = true
  clusterForm.value = { ...cluster }
  clusterDialogVisible.value = true
}

const saveClusterMeta = () => {
  if (!clusterForm.value.name) {
    ElMessage.warning('请输入集群名称')
    return
  }

  if (isEditMode.value) {
    const index = clusters.value.findIndex(c => c.id === clusterForm.value.id)
    if (index >= 0) {
      clusters.value[index] = { ...clusters.value[index], ...clusterForm.value }
    }
  } else {
    const newCluster = createEmptyCluster(clusterForm.value.id, clusterForm.value.name)
    newCluster.icon = clusterForm.value.icon
    newCluster.environment = clusterForm.value.environment
    newCluster.description = clusterForm.value.description
    clusters.value.push(newCluster)
    activeClusterId.value = newCluster.id
  }

  saveClusters()
  clusterDialogVisible.value = false
  ElMessage.success('保存成功')
}

const removeCluster = async (id) => {
  if (clusters.value.length <= 1) {
    ElMessage.warning('至少保留一个集群配置')
    return
  }

  try {
    await ElMessageBox.confirm('确定删除该集群配置吗？', '确认删除', { type: 'warning' })
    const index = clusters.value.findIndex(c => c.id === id)
    if (index >= 0) {
      clusters.value.splice(index, 1)
      if (activeClusterId.value === id) {
        activeClusterId.value = clusters.value[0]?.id || ''
      }
      saveClusters()
      ElMessage.success('删除成功')
    }
  } catch (e) {}
}

const saveClusters = async () => {
  try {
    await axios.put('/api/settings', {
      clusters: clusters.value,
    })
  } catch (err) {
    ElMessage.error('保存集群配置失败')
  }
}

const saveGlobalSettings = async () => {
  try {
    await axios.put('/api/settings', {
      sparkHistoryUrl: globalSparkUrl.value,
    })
  } catch (err) {
    ElMessage.error('保存全局设置失败')
  }
}

const loadClusters = async () => {
  try {
    const response = await axios.get('/api/settings')
    if (response.data) {
      if (response.data.clusters && response.data.clusters.length > 0) {
        clusters.value = response.data.clusters
        activeClusterId.value = clusters.value[0]?.id
      }
      if (response.data.models && response.data.models.length > 0) {
        models.value = response.data.models
      }
      if (response.data.sparkHistoryUrl) {
        globalSparkUrl.value = response.data.sparkHistoryUrl
      }
    }
  } catch (err) {
    console.log('使用默认配置')
  }
}

const testSparkConnection = async () => {
  if (!globalSparkUrl.value) {
    ElMessage.warning('请先配置 Spark History Server 地址')
    return
  }
  testingSpark.value = true
  try {
    // 通过后端代理测试，避免 CORS 问题
    await axios.post('/api/settings/test-connection', {
      type: 'spark',
      url: globalSparkUrl.value
    }, { timeout: 10000 })
    ElMessage.success('Spark History Server 连接成功')
  } catch (err) {
    ElMessage.error(`连接失败: ${err.response?.data?.error || err.message}`)
  } finally {
    testingSpark.value = false
  }
}

// 模型管理
const addModel = () => {
  isEditModel.value = false
  modelForm.value = {
    id: `model-${Date.now()}`,
    name: '',
    model: '',
    apiUrl: '',
    apiKey: '',
    enabled: true,
    isDefault: false,
  }
  modelDialogVisible.value = true
}

const editModel = (model) => {
  isEditModel.value = true
  modelForm.value = { ...model }
  modelDialogVisible.value = true
}

const saveModel = async () => {
  if (!modelForm.value.name || !modelForm.value.model) {
    ElMessage.warning('请填写模型名称和模型 ID')
    return
  }

  try {
    if (isEditModel.value) {
      await axios.put(`/api/settings/model/${modelForm.value.id}`, modelForm.value)
    } else {
      await axios.post('/api/settings/model', modelForm.value)
    }
    await loadClusters()
    modelDialogVisible.value = false
    ElMessage.success('保存成功')
  } catch (err) {
    ElMessage.error('保存失败: ' + (err.response?.data?.error || err.message))
  }
}

const removeModel = async (id) => {
  if (models.value.length <= 1) {
    ElMessage.warning('至少保留一个模型配置')
    return
  }

  try {
    await ElMessageBox.confirm('确定删除该模型配置吗？', '确认删除', { type: 'warning' })
    await axios.delete(`/api/settings/model/${id}`)
    await loadClusters()
    ElMessage.success('删除成功')
  } catch (e) {}
}

const setDefaultModel = async (id) => {
  try {
    await axios.post(`/api/settings/model/${id}/set-default`)
    await loadClusters()
    ElMessage.success('已设为默认模型')
  } catch (err) {
    ElMessage.error('设置失败')
  }
}

const testModelConnection = async (model) => {
  model.testing = true
  try {
    await axios.post('/api/settings/test-ai', {
      apiUrl: model.apiUrl,
      apiKey: model.apiKey,
      model: model.model,
    })
    ElMessage.success(`${model.name} 连接成功`)
  } catch (err) {
    ElMessage.error(`连接失败: ${err.response?.data?.error || err.message}`)
  } finally {
    model.testing = false
  }
}

const testConnection = async (type) => {
  if (!currentCluster.value) return

  const loadingRef = type === 'hdfs' ? testingHdfs : testingYarn
  loadingRef.value = true
  testResult.value = null

  try {
    const url = type === 'hdfs'
      ? currentCluster.value.hadoop.namenodeUrl
      : currentCluster.value.hadoop.yarnUrl

    if (!url) {
      ElMessage.warning('请先配置地址')
      return
    }

    // 简单的连接测试
    await axios.get(`${url}/jmx`, { timeout: 5000 })
    testResult.value = { success: true, message: `${type.toUpperCase()} 连接成功` }
  } catch (err) {
    testResult.value = { success: false, message: `连接失败: ${err.message}` }
  } finally {
    loadingRef.value = false
  }
}

const openUrl = (url) => {
  if (url) {
    window.open(url, '_blank')
  }
}

onMounted(() => {
  loadClusters()
})
</script>

<style scoped>
.config-container {
  width: 100%;
}

.config-header {
  margin-bottom: 24px;
}

.config-header h3 {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.config-header p {
  color: var(--text-muted);
  font-size: 14px;
}

/* 集群列表区域 */
.clusters-section {
  padding: 24px;
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h4 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

/* 集群网格 */
.clusters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.cluster-card {
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: var(--border-medium-line);
}

.cluster-card:hover {
  border-color: var(--accent);
}

.cluster-card.active {
  border-color: var(--accent);
  background: var(--bg-hover);
}

.cluster-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.cluster-icon {
  width: 44px;
  height: 44px;
  background: var(--bg-hover);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}

.cluster-info {
  flex: 1;
}

.cluster-info h5 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.cluster-env {
  font-size: 12px;
  color: var(--text-muted);
  padding: 2px 8px;
  background: var(--bg-hover);
  border-radius: var(--radius-sm);
}

.cluster-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.cluster-card:hover .cluster-actions {
  opacity: 1;
}

.cluster-services {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.service-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: var(--bg-hover);
  border: var(--border-medium-line);
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--text-muted);
}

.service-badge.active {
  background: var(--tag-blue-bg);
  border-color: var(--accent);
  color: var(--tag-blue-text);
}

/* 添加集群卡片 */
.add-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 140px;
  border: 2px dashed rgba(34, 197, 94, 0.2);
  background: transparent;
}

.add-card:hover {
  border-color: var(--accent);
  background: var(--bg-hover);
}

.add-icon {
  font-size: 28px;
  margin-bottom: 8px;
  color: var(--text-muted);
}

.add-card span {
  color: var(--text-muted);
  font-size: 14px;
}

/* 集群详情 */
.cluster-detail {
  padding: 24px;
  margin-bottom: 20px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: var(--border-weak-line);
}

.cluster-title {
  display: flex;
  align-items: center;
  gap: 16px;
}

.cluster-icon-lg {
  width: 56px;
  height: 56px;
  background: var(--accent);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: white;
}

.cluster-title h4 {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.cluster-desc {
  font-size: 14px;
  color: var(--text-muted);
}

.config-tabs {
  margin-bottom: 20px;
}

.config-section {
  padding: 8px 0;
}

.section-title {
  margin-bottom: 20px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}
.section-title::before {
  content: '// ';
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--accent);
  opacity: 0.7;
}

.config-form {
  max-width: 800px;
}

.input-with-link {
  display: flex;
  gap: 8px;
  align-items: center;
}

.input-with-link .el-input {
  flex: 1;
}

.link-btn {
  padding: 8px 12px;
  border: var(--border-medium-line);
  background: var(--bg-hover);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.link-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--bg-hover);
}

.link-btn svg {
  width: 16px;
  height: 16px;
}

.kerberos-config {
  padding: 16px;
  background: var(--bg-hover);
  border: var(--border-weak-line);
  border-radius: var(--radius-md);
  margin-top: 16px;
}

.test-section {
  display: flex;
  gap: 12px;
  align-items: center;
  padding-top: 20px;
  border-top: var(--border-weak-line);
}

.test-result {
  font-size: 14px;
}

.test-result.success {
  color: var(--success);
}

.test-result.error {
  color: var(--danger);
}

/* 全局 Spark 配置区域 */
.spark-section {
  padding: 24px;
  margin-bottom: 20px;
}

.spark-section .section-desc {
  color: var(--text-muted);
  font-size: 13px;
  margin-bottom: 16px;
}

/* AI 配置区域 */
.ai-section {
  padding: 24px;
}

/* 模型配置区域 */
.models-section {
  padding: 24px;
  margin-top: 20px;
}

.models-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.model-card {
  padding: 20px;
  background: var(--bg-hover);
  border: var(--border-medium-line);
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}

.model-card.active {
  border-color: var(--accent);
  background: var(--bg-hover);
}

.model-card.disabled {
  opacity: 0.6;
}

.model-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.model-info h5 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.model-id {
  font-size: 12px;
  color: var(--text-muted);
  font-family: monospace;
}

.model-badges {
  display: flex;
  gap: 6px;
}

.badge-default {
  font-size: 11px;
  padding: 2px 8px;
  background: var(--accent);
  color: white;
  border-radius: var(--radius-sm);
}

.badge-status {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
}

.badge-status.enabled {
  background: var(--tag-green-bg);
  color: var(--tag-green-text);
}

.badge-status.disabled {
  background: var(--tag-red-bg);
  color: var(--tag-red-text);
}

.model-details {
  margin-bottom: 12px;
}

.detail-item {
  display: flex;
  gap: 8px;
  font-size: 13px;
}

.detail-item .label {
  color: var(--text-muted);
}

.detail-item .value {
  color: var(--text-secondary);
  word-break: break-all;
}

.model-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* 图标选择器 */
.icon-selector {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.icon-option {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-hover);
  border: var(--border-medium-line);
  border-radius: var(--radius-sm);
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.icon-option:hover {
  border-color: var(--accent);
}

.icon-option.active {
  background: var(--tag-blue-bg);
  border-color: var(--accent);
}
</style>