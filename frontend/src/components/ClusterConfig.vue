<template>
  <div class="bp-config">
    <!-- ╭── Page Header · LoginPage title block ──╮ -->
    <header class="bp-page-head">
      <aside class="bp-margin-ruler">
        <span class="bp-margin-tick" v-for="n in ['01','02','03','04','05','06']" :key="n">
          <em>{{ n }}</em><i></i>
        </span>
      </aside>

      <div class="bp-page-head-body">
        <div class="bp-title-block">
          <span class="bp-eyebrow">
            <i class="bp-eyebrow-bar"></i>
            <span>SYSTEM WIRING</span>
          </span>

          <h1 class="bp-display-title">
            <span class="bp-t-main">集群</span>
            <span class="bp-t-accent">CONFIG</span>
            <span class="bp-t-mute">/ HADOOP · AMBARI</span>
          </h1>

          <div class="bp-dim">
            <span class="bp-dim-arrow">◂</span>
            <span class="bp-dim-line"></span>
            <span class="bp-dim-num">{{ String(clusters.length).padStart(2, '0') }} UNITS</span>
            <span class="bp-dim-line"></span>
            <span class="bp-dim-arrow">▸</span>
          </div>

          <p class="bp-sub">配置 Hadoop / Ambari / Kerberos 接入点 — 每一个集群都是一张独立的接线图。填写 URL、端口、凭证即可联通。</p>

          <div class="bp-callouts">
            <span class="bp-callout"><em>A</em><span>HADOOP WIRING</span></span>
            <span class="bp-callout is-amber"><em>B</em><span>AMBARI API</span></span>
            <span class="bp-callout is-green"><em>C</em><span>AI MODELS</span></span>
          </div>
        </div>

        <!-- Revision stamp -->
        <div class="bp-stamp">
          <div class="bp-stamp-inner is-amber">
            <span class="bp-stamp-check">✓</span>
            <div class="bp-stamp-text">
              <strong>WIRED</strong>
              <small>INFRA · REV.12</small>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- ╭── Cluster List ──╮ -->
    <section class="bp-cluster-list">
      <div class="bp-panel-head">
        <span class="bp-panel-title">集群列表</span>
        <button class="bp-btn-primary" @click="addCluster">
          <span>添加集群</span>
          <span class="bp-btn-arrow">▸</span>
        </button>
      </div>

      <div class="bp-cluster-grid">
        <div
          v-for="(cluster, index) in clusters"
          :key="cluster.id"
          :class="['bp-cluster-card', { active: activeClusterId === cluster.id }]"
          @click="selectCluster(cluster.id)"
        >
          <span class="bp-card-num">{{ String(index + 1).padStart(2, '0') }}</span>
          <span class="bp-card-tick-tl"></span>
          <span class="bp-card-tick-tr"></span>
          <span class="bp-card-tick-bl"></span>
          <span class="bp-card-tick-br"></span>

          <div class="bp-cluster-icon">{{ cluster.icon || '◇' }}</div>
          <div class="bp-cluster-info">
            <h5 class="bp-cluster-name">{{ cluster.name }}</h5>
            <span class="bp-cluster-env">{{ cluster.environment || '生产环境' }}</span>
          </div>
          <div class="bp-cluster-services">
            <span :class="['bp-svc-dot', { active: cluster.hadoop?.namenodeUrl }]">HDFS</span>
            <span :class="['bp-svc-dot', { active: cluster.hadoop?.yarnUrl }]">YARN</span>
            <span :class="['bp-svc-dot', { active: cluster.ambari?.url }]">AMBR</span>
          </div>
          <div class="bp-cluster-acts">
            <button class="bp-btn-icon" @click.stop="editClusterMeta(cluster)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="bp-btn-icon bp-btn-danger" @click.stop="removeCluster(cluster.id)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Add Cluster Card -->
        <div class="bp-cluster-card bp-add-card" @click="addCluster">
          <span class="bp-add-icon">+</span>
          <span class="bp-add-text">添加新集群</span>
        </div>
      </div>
    </section>

    <!-- ╭── Cluster Detail ──╮ -->
    <section v-if="currentCluster" class="bp-detail-panel">
      <div class="bp-detail-head">
        <div class="bp-detail-title">
          <span class="bp-detail-icon">{{ currentCluster.icon || '◇' }}</span>
          <div>
            <h4 class="bp-detail-name">{{ currentCluster.name }}</h4>
            <span class="bp-detail-desc">{{ currentCluster.description || '点击编辑集群信息' }}</span>
          </div>
        </div>
        <button class="bp-btn" @click="editClusterMeta(currentCluster)">编辑信息</button>
      </div>

      <el-tabs v-model="activeTab" class="bp-tabs">
        <!-- Hadoop Tab -->
        <el-tab-pane label="Hadoop" name="hadoop">
          <div class="bp-config-section">
            <div class="bp-section-title">
              <span class="bp-title-k">01</span>
              <span class="bp-title-v">Hadoop 集群配置</span>
            </div>

            <div class="bp-form">
              <div class="bp-field-row">
                <div class="bp-field">
                  <label class="bp-label">
                    <span class="bp-label-k">01</span>
                    <span class="bp-label-v">NameNode · NN</span>
                  </label>
                  <div class="bp-input-wrap bp-input-link">
                    <input v-model="currentCluster.hadoop.namenodeUrl" type="text" placeholder="http://namenode:9870" class="bp-input" @change="saveClusters" />
                    <button v-if="currentCluster.hadoop.namenodeUrl" class="bp-link-btn" @click="openUrl(currentCluster.hadoop.namenodeUrl)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                        <polyline points="15 3 21 3 21 9"/>
                        <line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <div class="bp-field">
                  <label class="bp-label">
                    <span class="bp-label-k">02</span>
                    <span class="bp-label-v">ResourceManager · RM</span>
                  </label>
                  <div class="bp-input-wrap bp-input-link">
                    <input v-model="currentCluster.hadoop.yarnUrl" type="text" placeholder="http://resourcemanager:8088" class="bp-input" @change="saveClusters" />
                    <button v-if="currentCluster.hadoop.yarnUrl" class="bp-link-btn" @click="openUrl(currentCluster.hadoop.yarnUrl)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                        <polyline points="15 3 21 3 21 9"/>
                        <line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <div class="bp-field-row">
                <div class="bp-field">
                  <label class="bp-label">
                    <span class="bp-label-k">03</span>
                    <span class="bp-label-v">Hadoop 用户 · USER</span>
                  </label>
                  <div class="bp-input-wrap">
                    <input v-model="currentCluster.hadoop.user" type="text" placeholder="hadoop" class="bp-input" @change="saveClusters" />
                  </div>
                </div>
                <div class="bp-field">
                  <label class="bp-label">
                    <span class="bp-label-k">04</span>
                    <span class="bp-label-v">Kerberos · AUTH</span>
                  </label>
                  <div class="bp-switch-wrap">
                    <el-switch v-model="currentCluster.hadoop.kerberosEnabled" @change="saveClusters" />
                    <span class="bp-switch-label">{{ currentCluster.hadoop.kerberosEnabled ? '已启用' : '未启用' }}</span>
                  </div>
                </div>
              </div>
              <div v-if="currentCluster.hadoop.kerberosEnabled" class="bp-kerberos-box">
                <div class="bp-field-row">
                  <div class="bp-field">
                    <label class="bp-label">
                      <span class="bp-label-k">05</span>
                      <span class="bp-label-v">Principal · PRINC</span>
                    </label>
                    <div class="bp-input-wrap">
                      <input v-model="currentCluster.hadoop.kerberosPrincipal" type="text" placeholder="hadoop@REALM.COM" class="bp-input" @change="saveClusters" />
                    </div>
                  </div>
                  <div class="bp-field">
                    <label class="bp-label">
                      <span class="bp-label-k">06</span>
                      <span class="bp-label-v">Keytab · KEY</span>
                    </label>
                    <div class="bp-input-wrap">
                      <input v-model="currentCluster.hadoop.kerberosKeytab" type="text" placeholder="/path/to/keytab" class="bp-input" @change="saveClusters" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- Ambari Tab -->
        <el-tab-pane label="Ambari" name="ambari">
          <div class="bp-config-section">
            <div class="bp-section-title">
              <span class="bp-title-k">02</span>
              <span class="bp-title-v">Ambari 管理配置</span>
            </div>

            <div class="bp-form">
              <div class="bp-field-row">
                <div class="bp-field">
                  <label class="bp-label">
                    <span class="bp-label-k">01</span>
                    <span class="bp-label-v">Server 地址 · URL</span>
                  </label>
                  <div class="bp-input-wrap bp-input-link">
                    <input v-model="currentCluster.ambari.url" type="text" placeholder="http://ambari:8080" class="bp-input" @change="saveClusters" />
                    <button v-if="currentCluster.ambari.url" class="bp-link-btn" @click="openUrl(currentCluster.ambari.url)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                        <polyline points="15 3 21 3 21 9"/>
                        <line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <div class="bp-field">
                  <label class="bp-label">
                    <span class="bp-label-k">02</span>
                    <span class="bp-label-v">集群名称 · CLUSTER</span>
                  </label>
                  <div class="bp-input-wrap">
                    <input v-model="currentCluster.ambari.clusterName" type="text" placeholder="my-cluster" class="bp-input" @change="saveClusters" />
                  </div>
                </div>
              </div>
              <div class="bp-field-row">
                <div class="bp-field">
                  <label class="bp-label">
                    <span class="bp-label-k">03</span>
                    <span class="bp-label-v">用户名 · USER</span>
                  </label>
                  <div class="bp-input-wrap">
                    <input v-model="currentCluster.ambari.username" type="text" placeholder="admin" class="bp-input" @change="saveClusters" />
                  </div>
                </div>
                <div class="bp-field">
                  <label class="bp-label">
                    <span class="bp-label-k">04</span>
                    <span class="bp-label-v">密码 · PASS</span>
                  </label>
                  <div class="bp-input-wrap">
                    <input v-model="currentCluster.ambari.password" type="password" placeholder="admin" class="bp-input" @change="saveClusters" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>

      <!-- Test Section -->
      <div class="bp-test-section">
        <button class="bp-btn" @click="testConnection('hdfs')" :disabled="testingHdfs">
          {{ testingHdfs ? '测试中...' : '测试 HDFS' }}
        </button>
        <button class="bp-btn" @click="testConnection('yarn')" :disabled="testingYarn">
          {{ testingYarn ? '测试中...' : '测试 YARN' }}
        </button>
        <span v-if="testResult" :class="['bp-test-result', testResult.success ? 'success' : 'error']">
          {{ testResult.success ? '✓' : '✗' }} {{ testResult.message }}
        </span>
      </div>
    </section>

    <!-- ╭── Spark Section ──╮ -->
    <section class="bp-spark-panel">
      <div class="bp-panel-head">
        <span class="bp-panel-title">Spark History Server（全局）</span>
        <button class="bp-btn" @click="testSparkConnection" :disabled="testingSpark">
          {{ testingSpark ? '测试中...' : '测试连接' }}
        </button>
      </div>
      <p class="bp-panel-desc">所有集群共用同一个 Spark History Server</p>
      <div class="bp-field">
        <label class="bp-label">
          <span class="bp-label-k">01</span>
          <span class="bp-label-v">History Server · URL</span>
        </label>
        <div class="bp-input-wrap bp-input-link">
          <input v-model="globalSparkUrl" type="text" placeholder="http://spark-history:18080" class="bp-input" @change="saveGlobalSettings" />
          <button v-if="globalSparkUrl" class="bp-link-btn" @click="openUrl(globalSparkUrl)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </button>
        </div>
      </div>
    </section>

    <!-- ╭── AI Models Section ──╮ -->
    <section class="bp-models-panel">
      <div class="bp-panel-head">
        <span class="bp-panel-title">AI 模型配置</span>
        <button class="bp-btn-primary" @click="addModel">
          <span>添加模型</span>
          <span class="bp-btn-arrow">▸</span>
        </button>
      </div>

      <div class="bp-model-grid">
        <div
          v-for="model in models"
          :key="model.id"
          :class="['bp-model-card', { active: model.isDefault, disabled: !model.enabled }]"
        >
          <span class="bp-card-tick-tl"></span>
          <span class="bp-card-tick-tr"></span>
          <span class="bp-card-tick-bl"></span>
          <span class="bp-card-tick-br"></span>

          <div class="bp-model-head">
            <h5 class="bp-model-name">{{ model.name }}</h5>
            <span class="bp-model-id">{{ model.model }}</span>
          </div>
          <div class="bp-model-badges">
            <span v-if="model.isDefault" class="bp-badge bp-badge-default">默认</span>
            <span :class="['bp-badge', model.enabled ? 'bp-badge-on' : 'bp-badge-off']">
              {{ model.enabled ? '启用' : '禁用' }}
            </span>
          </div>
          <div class="bp-model-detail">
            <span class="bp-detail-k">API</span>
            <span class="bp-detail-v">{{ model.apiUrl || '未配置' }}</span>
          </div>
          <div class="bp-model-acts">
            <button class="bp-btn" @click="editModel(model)">编辑</button>
            <button class="bp-btn" @click="testModelConnection(model)" :disabled="model.testing">
              {{ model.testing ? '测试中...' : '测试' }}
            </button>
            <button v-if="!model.isDefault" class="bp-btn-primary" @click="setDefaultModel(model.id)">设为默认</button>
            <button class="bp-btn-danger" @click="removeModel(model.id)">删除</button>
          </div>
        </div>
      </div>
    </section>

    <!-- ╭── Model Dialog ──╮ -->
    <el-dialog v-model="modelDialogVisible" width="520px" class="bp-dialog">
      <template #header>
        <div class="bp-dialog-head">
          <span class="bp-dialog-k">{{ isEditModel ? 'EDIT' : 'CREATE' }}</span>
          <span class="bp-dialog-v">{{ isEditModel ? '编辑模型' : '添加模型' }}</span>
        </div>
      </template>

      <div class="bp-form">
        <div class="bp-field">
          <label class="bp-label">
            <span class="bp-label-k">01</span>
            <span class="bp-label-v">模型名称 · NAME</span>
          </label>
          <div class="bp-input-wrap">
            <input v-model="modelForm.name" type="text" placeholder="例如：GLM-5、DeepSeek" class="bp-input" />
          </div>
        </div>
        <div class="bp-field">
          <label class="bp-label">
            <span class="bp-label-k">02</span>
            <span class="bp-label-v">模型 ID · ID</span>
          </label>
          <div class="bp-input-wrap">
            <input v-model="modelForm.model" type="text" placeholder="例如：glm-5、deepseek-chat" class="bp-input" />
          </div>
        </div>
        <div class="bp-field">
          <label class="bp-label">
            <span class="bp-label-k">03</span>
            <span class="bp-label-v">API 地址 · URL</span>
          </label>
          <div class="bp-input-wrap">
            <input v-model="modelForm.apiUrl" type="text" placeholder="http://api.example.com/v1/chat/completions" class="bp-input" />
          </div>
        </div>
        <div class="bp-field">
          <label class="bp-label">
            <span class="bp-label-k">04</span>
            <span class="bp-label-v">API Key · KEY</span>
          </label>
          <div class="bp-input-wrap">
            <input v-model="modelForm.apiKey" type="password" placeholder="API 密钥" class="bp-input" />
          </div>
        </div>
        <div class="bp-field-row">
          <div class="bp-field">
            <label class="bp-label">
              <span class="bp-label-k">05</span>
              <span class="bp-label-v">启用 · ENABLE</span>
            </label>
            <div class="bp-switch-wrap">
              <el-switch v-model="modelForm.enabled" />
            </div>
          </div>
          <div class="bp-field">
            <label class="bp-label">
              <span class="bp-label-k">06</span>
              <span class="bp-label-v">默认 · DEFAULT</span>
            </label>
            <div class="bp-switch-wrap">
              <el-switch v-model="modelForm.isDefault" />
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="bp-dialog-footer">
          <button class="bp-btn" @click="modelDialogVisible = false">取消</button>
          <button class="bp-btn-primary" @click="saveModel">
            <span>保存</span>
            <span class="bp-btn-arrow">▸</span>
          </button>
        </div>
      </template>
    </el-dialog>

    <!-- ╭── Cluster Info Dialog ──╮ -->
    <el-dialog v-model="clusterDialogVisible" width="520px" class="bp-dialog">
      <template #header>
        <div class="bp-dialog-head">
          <span class="bp-dialog-k">{{ isEditMode ? 'EDIT' : 'CREATE' }}</span>
          <span class="bp-dialog-v">编辑集群信息</span>
        </div>
      </template>

      <div class="bp-form">
        <div class="bp-field">
          <label class="bp-label">
            <span class="bp-label-k">01</span>
            <span class="bp-label-v">集群名称 · NAME</span>
          </label>
          <div class="bp-input-wrap">
            <input v-model="clusterForm.name" type="text" placeholder="例如：生产集群 A" class="bp-input" />
          </div>
        </div>
        <div class="bp-field">
          <label class="bp-label">
            <span class="bp-label-k">02</span>
            <span class="bp-label-v">集群标识 · ID</span>
          </label>
          <div class="bp-input-wrap">
            <input v-model="clusterForm.id" type="text" placeholder="例如：cluster-prod-a" class="bp-input" :disabled="isEditMode" />
          </div>
        </div>
        <div class="bp-field">
          <label class="bp-label">
            <span class="bp-label-k">03</span>
            <span class="bp-label-v">环境 · ENV</span>
          </label>
          <el-select v-model="clusterForm.environment" style="width: 100%">
            <el-option label="生产环境" value="production" />
            <el-option label="测试环境" value="staging" />
            <el-option label="开发环境" value="development" />
          </el-select>
        </div>
        <div class="bp-field">
          <label class="bp-label">
            <span class="bp-label-k">04</span>
            <span class="bp-label-v">图标 · ICON</span>
          </label>
          <div class="bp-icon-select">
            <span v-for="icon in clusterIcons" :key="icon" :class="['bp-icon-item', { active: clusterForm.icon === icon }]" @click="clusterForm.icon = icon">{{ icon }}</span>
          </div>
        </div>
        <div class="bp-field">
          <label class="bp-label">
            <span class="bp-label-k">05</span>
            <span class="bp-label-v">描述 · DESC</span>
          </label>
          <div class="bp-input-wrap bp-textarea-wrap">
            <textarea v-model="clusterForm.description" placeholder="集群描述" rows="2" class="bp-input bp-textarea"></textarea>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="bp-dialog-footer">
          <button class="bp-btn" @click="clusterDialogVisible = false">取消</button>
          <button class="bp-btn-primary" @click="saveClusterMeta">
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
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const activeTab = ref('hadoop')
const activeClusterId = ref('')
const clusterDialogVisible = ref(false)
const isEditMode = ref(false)

const clusterIcons = ['◇', '◆', '◈', '⬡', '⬢', '▢', '▣', '▤']

const clusterForm = ref({
  id: '',
  name: '',
  environment: 'production',
  icon: '◇',
  description: '',
})

const createEmptyCluster = (id, name) => ({
  id,
  name,
  icon: '◇',
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

const clusters = ref([createEmptyCluster('cluster-default', '默认集群')])
const globalSparkUrl = ref('')
const models = ref([
  {
    id: 'model-default',
    name: 'GLM-5',
    enabled: true,
    apiUrl: 'http://llmapi.ld-hadoop.com/v1/chat/completions',
    apiKey: '',
    model: 'glm-5',
    isDefault: true,
    testing: false,
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

const currentCluster = computed(() => clusters.value.find(c => c.id === activeClusterId.value) || null)

const selectCluster = (id) => { activeClusterId.value = id }

const addCluster = () => {
  isEditMode.value = false
  clusterForm.value = {
    id: `cluster-${Date.now()}`,
    name: '新集群',
    environment: 'production',
    icon: '◇',
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
    await axios.put('/api/settings', { clusters: clusters.value })
  } catch (err) {
    ElMessage.error('保存集群配置失败')
  }
}

const saveGlobalSettings = async () => {
  try {
    await axios.put('/api/settings', { sparkHistoryUrl: globalSparkUrl.value })
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
        models.value = response.data.models.map(m => ({ ...m, testing: false }))
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
    await axios.post('/api/settings/test-connection', { type: 'spark', url: globalSparkUrl.value }, { timeout: 10000 })
    ElMessage.success('Spark History Server 连接成功')
  } catch (err) {
    ElMessage.error(`连接失败: ${err.response?.data?.error || err.message}`)
  } finally {
    testingSpark.value = false
  }
}

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
    const url = type === 'hdfs' ? currentCluster.value.hadoop.namenodeUrl : currentCluster.value.hadoop.yarnUrl
    if (!url) {
      ElMessage.warning('请先配置地址')
      return
    }
    await axios.get(`${url}/jmx`, { timeout: 5000 })
    testResult.value = { success: true, message: `${type.toUpperCase()} 连接成功` }
  } catch (err) {
    testResult.value = { success: false, message: `连接失败: ${err.message}` }
  } finally {
    loadingRef.value = false
  }
}

const openUrl = (url) => {
  if (url) window.open(url, '_blank')
}

onMounted(() => loadClusters())
</script>

<style scoped>
.bp-config {
  width: 100%;
  animation: bp-fade 0.4s ease-out;
}

/* page-head base inherited from global blueprint.css */

/* ╭── Panels ──╮ */
.bp-cluster-list, .bp-detail-panel, .bp-spark-panel, .bp-models-panel {
  padding: 24px;
  background: rgba(14, 29, 49, 0.6);
  border: 1px solid rgba(92, 228, 255, 0.2);
  margin-bottom: 20px;
}

.bp-panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px dashed rgba(92, 228, 255, 0.15);
}

.bp-panel-title {
  font-family: var(--bp-fnt-mono);
  font-size: 12px;
  color: var(--bp-blueprint);
  font-weight: 700;
  letter-spacing: 0.1em;
}

.bp-panel-desc {
  font-family: 'Hanken Grotesk', 'PingFang SC', sans-serif;
  font-size: 13px;
  color: var(--bp-chalk-dim);
  margin-bottom: 16px;
}

/* ╭── Cluster Grid ──╮ */
.bp-cluster-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.bp-cluster-card {
  position: relative;
  padding: 20px;
  background: rgba(92, 228, 255, 0.05);
  border: 1px solid rgba(92, 228, 255, 0.15);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bp-card-num {
  position: absolute;
  top: 8px;
  right: 8px;
  font-family: var(--bp-fnt-mono);
  font-size: 10px;
  color: var(--bp-chalk-dim);
  opacity: 0.5;
}

.bp-card-tick-tl, .bp-card-tick-tr, .bp-card-tick-bl, .bp-card-tick-br {
  position: absolute;
  width: 6px;
  height: 6px;
  border: 1px solid rgba(92, 228, 255, 0.3);
}

.bp-card-tick-tl { top: -1px; left: -1px; border-right: none; border-bottom: none; }
.bp-card-tick-tr { top: -1px; right: -1px; border-left: none; border-bottom: none; }
.bp-card-tick-bl { bottom: -1px; left: -1px; border-right: none; border-top: none; }
.bp-card-tick-br { bottom: -1px; right: -1px; border-left: none; border-top: none; }

.bp-cluster-card:hover {
  border-color: rgba(92, 228, 255, 0.3);
  background: rgba(92, 228, 255, 0.08);
}

.bp-cluster-card.active {
  border-color: var(--bp-blueprint);
  background: rgba(92, 228, 255, 0.1);
}

.bp-cluster-icon {
  font-size: 24px;
  color: var(--bp-blueprint);
}

.bp-cluster-info { flex: 1; }

.bp-cluster-name {
  font-family: var(--bp-fnt-mono);
  font-size: 14px;
  font-weight: 700;
  color: var(--bp-chalk);
  margin-bottom: 4px;
}

.bp-cluster-env {
  font-family: var(--bp-fnt-mono);
  font-size: 11px;
  padding: 2px 8px;
  background: rgba(92, 228, 255, 0.1);
  color: var(--bp-chalk-dim);
}

.bp-cluster-services {
  display: flex;
  gap: 6px;
}

.bp-svc-dot {
  font-family: var(--bp-fnt-mono);
  font-size: 10px;
  padding: 2px 6px;
  background: rgba(92, 228, 255, 0.06);
  color: var(--bp-chalk-dim);
}

.bp-svc-dot.active {
  background: rgba(92, 228, 255, 0.12);
  color: var(--bp-blueprint);
}

.bp-cluster-acts {
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.bp-cluster-card:hover .bp-cluster-acts { opacity: 1; }

.bp-btn-icon {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  background: transparent;
  border: 1px solid rgba(92, 228, 255, 0.15);
  cursor: pointer;
  color: var(--bp-chalk-dim);
  transition: all 0.2s ease;
}

.bp-btn-icon:hover {
  border-color: var(--bp-blueprint);
  color: var(--bp-blueprint);
}

.bp-btn-icon.bp-btn-danger:hover {
  border-color: var(--bp-red-stamp);
  color: var(--bp-red-stamp);
}

.bp-btn-icon svg { width: 14px; height: 14px; }

.bp-add-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  border: 1px dashed rgba(92, 228, 255, 0.2);
  background: transparent;
}

.bp-add-icon {
  font-size: 24px;
  color: var(--bp-chalk-dim);
}

.bp-add-text {
  font-family: var(--bp-fnt-mono);
  font-size: 12px;
  color: var(--bp-chalk-dim);
}

/* ╭── Detail Panel ──╮ */
.bp-detail-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px dashed rgba(92, 228, 255, 0.15);
}

.bp-detail-title {
  display: flex;
  align-items: center;
  gap: 16px;
}

.bp-detail-icon {
  font-size: 28px;
  color: var(--bp-blueprint);
}

.bp-detail-name {
  font-family: var(--bp-fnt-mono);
  font-size: 16px;
  font-weight: 700;
  color: var(--bp-chalk);
  margin-bottom: 4px;
}

.bp-detail-desc {
  font-family: 'Hanken Grotesk', 'PingFang SC', sans-serif;
  font-size: 13px;
  color: var(--bp-chalk-dim);
}

.bp-tabs {
  margin-bottom: 16px;
}

.bp-config-section {
  padding: 16px 0;
}

.bp-section-title {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 16px;
}

.bp-title-k {
  font-family: var(--bp-fnt-mono);
  font-size: 10px;
  color: var(--bp-amber);
}

.bp-title-v {
  font-family: var(--bp-fnt-mono);
  font-size: 13px;
  color: var(--bp-chalk);
  letter-spacing: 0.06em;
}

/* ╭── Form ──╮ */
.bp-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bp-field-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
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

.bp-input::placeholder { color: var(--bp-chalk-dim); opacity: 0.5; }

.bp-input-link {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bp-link-btn {
  padding: 6px;
  background: transparent;
  border: 1px solid rgba(92, 228, 255, 0.15);
  cursor: pointer;
  color: var(--bp-chalk-dim);
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.bp-link-btn:hover {
  border-color: var(--bp-blueprint);
  color: var(--bp-blueprint);
}

.bp-link-btn svg { width: 14px; height: 14px; }

.bp-switch-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bp-switch-label {
  font-family: var(--bp-fnt-mono);
  font-size: 12px;
  color: var(--bp-chalk-dim);
}

.bp-kerberos-box {
  padding: 16px;
  background: rgba(92, 228, 255, 0.05);
  border: 1px solid rgba(92, 228, 255, 0.1);
  margin-top: 8px;
}

.bp-textarea-wrap { padding: 8px 4px; }
.bp-textarea { min-height: 60px; resize: vertical; }

/* ╭── Test Section ──╮ */
.bp-test-section {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px dashed rgba(92, 228, 255, 0.15);
}

.bp-test-result {
  font-family: var(--bp-fnt-mono);
  font-size: 13px;
}

.bp-test-result.success { color: var(--bp-green-check); }
.bp-test-result.error { color: var(--bp-red-stamp); }

/* ╭── Model Grid ──╮ */
.bp-model-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.bp-model-card {
  position: relative;
  padding: 20px;
  background: rgba(92, 228, 255, 0.05);
  border: 1px solid rgba(92, 228, 255, 0.15);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bp-model-card.active {
  border-color: var(--bp-blueprint);
  background: rgba(92, 228, 255, 0.1);
}

.bp-model-card.disabled { opacity: 0.6; }

.bp-model-head { flex: 1; }

.bp-model-name {
  font-family: var(--bp-fnt-mono);
  font-size: 14px;
  font-weight: 700;
  color: var(--bp-chalk);
  margin-bottom: 4px;
}

.bp-model-id {
  font-family: var(--bp-fnt-mono);
  font-size: 11px;
  color: var(--bp-chalk-dim);
}

.bp-model-badges {
  display: flex;
  gap: 6px;
}

.bp-badge {
  font-family: var(--bp-fnt-mono);
  font-size: 10px;
  padding: 2px 8px;
}

.bp-badge-default {
  background: var(--bp-blueprint);
  color: var(--bp-ink);
}

.bp-badge-on {
  background: rgba(80, 200, 120, 0.15);
  color: var(--bp-green-check);
  border: 1px solid rgba(80, 200, 120, 0.3);
}

.bp-badge-off {
  background: rgba(255, 74, 60, 0.15);
  color: var(--bp-red-stamp);
  border: 1px solid rgba(255, 74, 60, 0.3);
}

.bp-model-detail {
  display: flex;
  gap: 8px;
  font-size: 12px;
}

.bp-detail-k {
  font-family: var(--bp-fnt-mono);
  color: var(--bp-chalk-dim);
}

.bp-detail-v {
  font-family: var(--bp-fnt-mono);
  color: var(--bp-chalk);
  word-break: break-all;
}

.bp-model-acts {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* ╭── Icon Select ──╮ */
.bp-icon-select {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.bp-icon-item {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  background: rgba(92, 228, 255, 0.05);
  border: 1px solid rgba(92, 228, 255, 0.15);
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.bp-icon-item:hover {
  border-color: var(--bp-blueprint);
}

.bp-icon-item.active {
  border-color: var(--bp-blueprint);
  background: rgba(92, 228, 255, 0.12);
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

/* ╭── Animations ──╮ */
@keyframes bp-fade { from { opacity: 0; } to { opacity: 1; } }

/* ╭── Responsive ──╮ */
@media (max-width: 768px) {
  .bp-field-row { grid-template-columns: 1fr; }
  .bp-cluster-grid { grid-template-columns: 1fr; }
  .bp-model-grid { grid-template-columns: 1fr; }
}
</style>