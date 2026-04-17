const express = require('express');
const axios = require('axios');
const { query } = require('../models');
const config = require('../config');
const { encrypt, decrypt } = require('../utils/crypto');
const { formatBytes } = require('../utils/format');

const router = express.Router();

// 内存存储模式下的集群配置
let memorySettings = {
  // 全局 Spark History Server 配置（所有集群共用）
  sparkHistoryUrl: config.spark.historyUrl || 'http://localhost:18080',
  clusters: [
    {
      id: 'cluster-default',
      name: '默认集群',
      icon: '🏢',
      environment: 'production',
      description: '',
      hadoop: {
        namenodeUrl: config.hadoop.namenodeUrl || 'http://localhost:9870',
        yarnUrl: config.hadoop.yarnUrl || 'http://localhost:8088',
        user: 'hadoop',
        kerberosEnabled: false,
        kerberosPrincipal: '',
        kerberosKeytab: '',
      },
      ambari: {
        url: config.ambari.url || 'http://localhost:8080',
        username: 'admin',
        password: '',
        clusterName: '',
      },
    },
  ],
  // 多模型配置
  models: [
    {
      id: 'model-default',
      name: 'GLM-5',
      enabled: true,
      apiUrl: config.glm.apiUrl || 'http://llmapi.ld-hadoop.com/v1/chat/completions',
      apiKey: config.glm.apiKey || '',
      model: 'glm-5',
      isDefault: true,
    },
  ],
  // 当前选中的模型
  activeModelId: 'model-default',
  // 钉钉配置
  dingtalk: {
    enabled: false,
    clientId: '',
    clientSecret: '', // 加密存储
    defaultAgentId: '',
    connected: false,
    messageCount: 0,
    lastMessageAt: null,
    agentMappings: {}, // 会话ID -> 智能体ID 映射
  },
};

// GET /api/settings - 获取所有设置
router.get('/', async (req, res) => {
  try {
    // 尝试从数据库读取
    try {
      const rows = await query('SELECT * FROM settings');
      const dbSettings = {};
      for (const row of rows) {
        try {
          dbSettings[row.key] = JSON.parse(row.value);
        } catch (e) {
          dbSettings[row.key] = row.value;
        }
      }

      // 如果数据库有集群配置，使用数据库的
      if (dbSettings.clusters && dbSettings.clusters.length > 0) {
        memorySettings.clusters = dbSettings.clusters;
      }
      if (dbSettings.models && dbSettings.models.length > 0) {
        memorySettings.models = dbSettings.models;
      }
      if (dbSettings.activeModelId) {
        memorySettings.activeModelId = dbSettings.activeModelId;
      }
      if (dbSettings.sparkHistoryUrl) {
        memorySettings.sparkHistoryUrl = dbSettings.sparkHistoryUrl;
      }
    } catch (dbErr) {
      // 数据库不可用，使用内存配置
      console.log('Using memory settings');
    }

    res.json(memorySettings);
  } catch (err) {
    console.error('Failed to get settings:', err);
    res.status(500).json({ error: '获取设置失败' });
  }
});

// PUT /api/settings - 更新设置
router.put('/', async (req, res) => {
  try {
    const { clusters, models, activeModelId, sparkHistoryUrl } = req.body;

    // 更新内存配置
    if (clusters) {
      memorySettings.clusters = clusters;
    }
    if (models) {
      memorySettings.models = models;
    }
    if (activeModelId) {
      memorySettings.activeModelId = activeModelId;
    }
    if (sparkHistoryUrl) {
      memorySettings.sparkHistoryUrl = sparkHistoryUrl;
    }

    // 尝试保存到数据库
    try {
      if (clusters) {
        await query(
          'INSERT INTO settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?',
          ['clusters', JSON.stringify(clusters), JSON.stringify(clusters)]
        );
      }
      if (models) {
        await query(
          'INSERT INTO settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?',
          ['models', JSON.stringify(models), JSON.stringify(models)]
        );
      }
      if (activeModelId) {
        await query(
          'INSERT INTO settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?',
          ['activeModelId', JSON.stringify(activeModelId), JSON.stringify(activeModelId)]
        );
      }
      if (sparkHistoryUrl) {
        await query(
          'INSERT INTO settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?',
          ['sparkHistoryUrl', JSON.stringify(sparkHistoryUrl), JSON.stringify(sparkHistoryUrl)]
        );
      }
    } catch (dbErr) {
      console.log('Database not available, using memory mode');
    }

    res.json({ success: true, message: '设置保存成功' });
  } catch (err) {
    console.error('Failed to save settings:', err);
    res.status(500).json({ error: '保存设置失败' });
  }
});

// GET /api/settings/cluster/status - 获取集群状态（代理请求，解决跨域问题）
// 注意：这个路由必须在 /cluster/:id 之前，否则会被 :id 参数匹配
router.get('/cluster/status', async (req, res) => {
  const { cluster_id } = req.query;

  try {
    // 直接从数据库获取集群配置
    const rows = await query('SELECT value FROM settings WHERE `key` = ?', ['clusters']);

    let clusters = [];
    if (rows.length > 0) {
      clusters = typeof rows[0].value === 'string' ? JSON.parse(rows[0].value) : rows[0].value;
    }

    const cluster = clusters.find(c => c.id === cluster_id);

    if (!cluster) {
      return res.json({
        hdfs: null,
        yarn: null,
        spark: null,
        error: `集群 ${cluster_id} 不存在`,
        available: clusters.map(c => c.id)
      });
    }

    const result = {
      hdfs: null,
      yarn: null,
      spark: null
    };

    // 并行获取各服务状态
    const [hdfsData, yarnData, sparkData] = await Promise.allSettled([
      fetchHDFSStatus(cluster),
      fetchYARNStatus(cluster),
      fetchSparkStatus()
    ]);

    if (hdfsData.status === 'fulfilled') result.hdfs = hdfsData.value;
    if (yarnData.status === 'fulfilled') result.yarn = yarnData.value;
    if (sparkData.status === 'fulfilled') result.spark = sparkData.value;

    res.json(result);
  } catch (err) {
    console.error('获取集群状态失败:', err);
    res.status(500).json({ error: '获取集群状态失败' });
  }
});

// GET /api/settings/cluster/:id - 获取单个集群配置
router.get('/cluster/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const cluster = memorySettings.clusters.find(c => c.id === id);

    if (!cluster) {
      return res.status(404).json({ error: '集群不存在' });
    }

    res.json(cluster);
  } catch (err) {
    res.status(500).json({ error: '获取集群配置失败' });
  }
});

// POST /api/settings/cluster - 添加新集群
router.post('/cluster', async (req, res) => {
  try {
    const { id, name, icon, environment, description } = req.body;

    const newCluster = {
      id: id || `cluster-${Date.now()}`,
      name: name || '新集群',
      icon: icon || '🏢',
      environment: environment || 'production',
      description: description || '',
      hadoop: {
        namenodeUrl: '',
        yarnUrl: '',
        user: 'hadoop',
        kerberosEnabled: false,
      },
      spark: {
        historyUrl: '',
      },
      ambari: {
        url: '',
        username: 'admin',
        password: '',
        clusterName: '',
      },
    };

    memorySettings.clusters.push(newCluster);

    // 保存到数据库
    try {
      await query(
        'INSERT INTO settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?',
        ['clusters', JSON.stringify(memorySettings.clusters), JSON.stringify(memorySettings.clusters)]
      );
    } catch (dbErr) {}

    res.json(newCluster);
  } catch (err) {
    res.status(500).json({ error: '添加集群失败' });
  }
});

// DELETE /api/settings/cluster/:id - 删除集群
router.delete('/cluster/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const index = memorySettings.clusters.findIndex(c => c.id === id);

    if (index < 0) {
      return res.status(404).json({ error: '集群不存在' });
    }

    memorySettings.clusters.splice(index, 1);

    // 保存到数据库
    try {
      await query(
        'INSERT INTO settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?',
        ['clusters', JSON.stringify(memorySettings.clusters), JSON.stringify(memorySettings.clusters)]
      );
    } catch (dbErr) {}

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '删除集群失败' });
  }
});

// POST /api/settings/test-ai - 测试 AI 连接
router.post('/test-ai', async (req, res) => {
  try {
    const { apiUrl, apiKey, model } = req.body;

    const response = await axios.post(
      apiUrl,
      {
        model: model || 'glm-5',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        timeout: 30000,
      }
    );

    res.json({ success: true, message: 'AI 连接成功' });
  } catch (err) {
    console.error('AI test failed:', err.message);
    res.status(400).json({ error: err.response?.data?.error?.message || err.message });
  }
});

// ========== 模型管理 API ==========

// POST /api/settings/model - 添加新模型
router.post('/model', async (req, res) => {
  try {
    const { id, name, apiUrl, apiKey, model, isDefault } = req.body;

    const newModel = {
      id: id || `model-${Date.now()}`,
      name: name || '新模型',
      enabled: true,
      apiUrl: apiUrl || '',
      apiKey: apiKey || '',
      model: model || '',
      isDefault: isDefault || false,
    };

    // 如果设为默认，取消其他模型的默认状态
    if (newModel.isDefault) {
      memorySettings.models.forEach(m => m.isDefault = false);
    }

    memorySettings.models.push(newModel);

    // 保存到数据库
    try {
      await query(
        'INSERT INTO settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?',
        ['models', JSON.stringify(memorySettings.models), JSON.stringify(memorySettings.models)]
      );
    } catch (dbErr) {}

    res.json(newModel);
  } catch (err) {
    res.status(500).json({ error: '添加模型失败' });
  }
});

// PUT /api/settings/model/:id - 更新模型
router.put('/model/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, apiUrl, apiKey, model, enabled, isDefault } = req.body;

    const modelIndex = memorySettings.models.findIndex(m => m.id === id);
    if (modelIndex < 0) {
      return res.status(404).json({ error: '模型不存在' });
    }

    // 如果设为默认，取消其他模型的默认状态
    if (isDefault) {
      memorySettings.models.forEach(m => m.isDefault = false);
    }

    memorySettings.models[modelIndex] = {
      ...memorySettings.models[modelIndex],
      name: name || memorySettings.models[modelIndex].name,
      apiUrl: apiUrl !== undefined ? apiUrl : memorySettings.models[modelIndex].apiUrl,
      apiKey: apiKey !== undefined ? apiKey : memorySettings.models[modelIndex].apiKey,
      model: model || memorySettings.models[modelIndex].model,
      enabled: enabled !== undefined ? enabled : memorySettings.models[modelIndex].enabled,
      isDefault: isDefault !== undefined ? isDefault : memorySettings.models[modelIndex].isDefault,
    };

    // 保存到数据库
    try {
      await query(
        'INSERT INTO settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?',
        ['models', JSON.stringify(memorySettings.models), JSON.stringify(memorySettings.models)]
      );
    } catch (dbErr) {}

    res.json(memorySettings.models[modelIndex]);
  } catch (err) {
    res.status(500).json({ error: '更新模型失败' });
  }
});

// DELETE /api/settings/model/:id - 删除模型
router.delete('/model/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (memorySettings.models.length <= 1) {
      return res.status(400).json({ error: '至少保留一个模型配置' });
    }

    const index = memorySettings.models.findIndex(m => m.id === id);
    if (index < 0) {
      return res.status(404).json({ error: '模型不存在' });
    }

    const wasDefault = memorySettings.models[index].isDefault;
    memorySettings.models.splice(index, 1);

    // 如果删除的是默认模型，将第一个设为默认
    if (wasDefault && memorySettings.models.length > 0) {
      memorySettings.models[0].isDefault = true;
    }

    // 更新 activeModelId
    if (memorySettings.activeModelId === id) {
      memorySettings.activeModelId = memorySettings.models[0]?.id;
    }

    // 保存到数据库
    try {
      await query(
        'INSERT INTO settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?',
        ['models', JSON.stringify(memorySettings.models), JSON.stringify(memorySettings.models)]
      );
    } catch (dbErr) {}

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '删除模型失败' });
  }
});

// POST /api/settings/model/:id/set-default - 设置默认模型
router.post('/model/:id/set-default', async (req, res) => {
  try {
    const { id } = req.params;

    const modelIndex = memorySettings.models.findIndex(m => m.id === id);
    if (modelIndex < 0) {
      return res.status(404).json({ error: '模型不存在' });
    }

    // 取消其他模型的默认状态
    memorySettings.models.forEach(m => m.isDefault = false);
    memorySettings.models[modelIndex].isDefault = true;
    memorySettings.activeModelId = id;

    // 保存到数据库
    try {
      await query(
        'INSERT INTO settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?',
        ['models', JSON.stringify(memorySettings.models), JSON.stringify(memorySettings.models)]
      );
      await query(
        'INSERT INTO settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?',
        ['activeModelId', JSON.stringify(id), JSON.stringify(id)]
      );
    } catch (dbErr) {}

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '设置默认模型失败' });
  }
});

// POST /api/settings/test-connection - 测试集群连接
router.post('/test-connection', async (req, res) => {
  try {
    const { type, url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL 不能为空' });
    }

    // 根据类型选择不同的测试端点
    let testUrl = url;
    if (type === 'spark') {
      testUrl = `${url}/api/v1/applications`;
    } else {
      testUrl = `${url}/jmx`;
    }

    const response = await axios.get(testUrl, { timeout: 5000 });

    res.json({ success: true, message: `${type} 连接成功` });
  } catch (err) {
    res.status(400).json({ error: `连接失败: ${err.message}` });
  }
});

// 获取 HDFS 状态
async function fetchHDFSStatus(cluster) {
  if (!cluster?.hadoop?.namenodeUrl) return null;

  try {
    const res = await axios.get(`${cluster.hadoop.namenodeUrl}/jmx`, { timeout: 5000 });
    const beans = res.data.beans || [];

    const nameNodeInfo = beans.find(b => b.name === 'Hadoop:service=NameNode,name=NameNodeInfo');

    if (nameNodeInfo) {
      const total = nameNodeInfo.Total || nameNodeInfo.TotalCapacity || 0;
      const used = nameNodeInfo.Used || nameNodeInfo.TotalUsed || 0;
      const percent = total > 0 ? Math.round((used / total) * 100) : 0;

      return {
        status: nameNodeInfo.State || 'ACTIVE',
        liveNodes: nameNodeInfo.LiveNodes ? Object.keys(JSON.parse(nameNodeInfo.LiveNodes)).length : 0,
        deadNodes: nameNodeInfo.DeadNodes ? Object.keys(JSON.parse(nameNodeInfo.DeadNodes)).length : 0,
        total: formatBytes(total),
        used: formatBytes(used),
        percentUsed: percent
      };
    }
    return null;
  } catch (e) {
    console.error('HDFS 查询失败:', e.message);
    return null;
  }
}

// 获取 YARN 状态
async function fetchYARNStatus(cluster) {
  if (!cluster?.hadoop?.yarnUrl) return null;

  try {
    const res = await axios.get(`${cluster.hadoop.yarnUrl}/ws/v1/cluster/metrics`, { timeout: 5000 });
    const metrics = res.data.clusterMetrics;

    if (metrics) {
      return {
        status: 'RUNNING',
        activeNodes: metrics.activeNodes || 0,
        totalNodes: metrics.totalNodes || 0,
        runningApps: metrics.appsRunning || 0,
        availableMB: metrics.availableMB || 0,
        totalMB: metrics.totalMB || 0,
        availableVirtualCores: metrics.availableVirtualCores || 0,
        totalVirtualCores: metrics.totalVirtualCores || 0
      };
    }
    return null;
  } catch (e) {
    console.error('YARN 查询失败:', e.message);
    return null;
  }
}

// 获取 Spark 状态（使用全局配置）
async function fetchSparkStatus() {
  const historyUrl = memorySettings.sparkHistoryUrl;
  if (!historyUrl) return null;

  try {
    const res = await axios.get(`${historyUrl}/api/v1/applications?limit=100`, { timeout: 5000 });
    const apps = res.data || [];

    const runningApps = apps.filter(a => !a.attempts?.[0]?.completed);

    return {
      status: 'RUNNING',
      runningApps: runningApps.length,
      completedApps: apps.filter(a => a.attempts?.[0]?.completed).length,
      lastAppName: apps[0]?.name || null
    };
  } catch (e) {
    console.error('Spark 查询失败:', e.message);
    return null;
  }
}

// 导出获取集群配置的函数供其他模块使用
async function getClusterConfig(clusterId) {
  // 尝试从数据库加载配置
  try {
    const rows = await query('SELECT * FROM settings');
    for (const row of rows) {
      try {
        if (row.key === 'clusters') {
          const dbClusters = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
          if (dbClusters && dbClusters.length > 0) {
            // 更新内存配置
            memorySettings.clusters = dbClusters;
            break;
          }
        }
      } catch (e) {}
    }
  } catch (e) {
    // 数据库不可用，使用内存配置
  }

  if (!clusterId) {
    return memorySettings.clusters[0]; // 返回第一个集群
  }
  return memorySettings.clusters.find(c => c.id === clusterId);
}

function getAIConfig() {
  // 返回当前活动模型或默认模型的配置
  const activeModel = memorySettings.models.find(m =>
    m.id === memorySettings.activeModelId || m.isDefault
  ) || memorySettings.models[0];

  return {
    enabled: activeModel?.enabled ?? true,
    apiUrl: activeModel?.apiUrl || '',
    apiKey: activeModel?.apiKey || '',
    model: activeModel?.model || 'glm-5',
  };
}

function getModels() {
  return memorySettings.models;
}

function getActiveModelId() {
  return memorySettings.activeModelId;
}

function getSparkHistoryUrl() {
  return memorySettings.sparkHistoryUrl;
}

// 异步加载配置到内存
async function loadSettingsFromDB() {
  try {
    const rows = await query('SELECT * FROM settings');
    for (const row of rows) {
      try {
        const value = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
        if (row.key === 'sparkHistoryUrl') {
          memorySettings.sparkHistoryUrl = value;
        } else if (row.key === 'clusters' && value && value.length > 0) {
          memorySettings.clusters = value;
        } else if (row.key === 'models' && value && value.length > 0) {
          memorySettings.models = value;
        } else if (row.key === 'activeModelId') {
          memorySettings.activeModelId = value;
        } else if (row.key === 'dingtalk') {
          memorySettings.dingtalk = { ...memorySettings.dingtalk, ...value };
        }
      } catch (e) {}
    }
    console.log('Settings loaded from database');
  } catch (e) {
    console.log('Using default memory settings');
  }
}

// 获取钉钉配置（解密敏感字段）
function getDingtalkConfig() {
  return {
    ...memorySettings.dingtalk,
    clientSecret: memorySettings.dingtalk.clientSecret
      ? decrypt(memorySettings.dingtalk.clientSecret)
      : '',
  };
}

// 设置钉钉配置（加密敏感字段）
async function setDingtalkConfig(config) {
  memorySettings.dingtalk = {
    ...memorySettings.dingtalk,
    ...config,
    clientSecret: config.clientSecret ? encrypt(config.clientSecret) : memorySettings.dingtalk.clientSecret,
  };

  // 保存到数据库
  try {
    await query(
      'INSERT INTO settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?',
      ['dingtalk', JSON.stringify(memorySettings.dingtalk), JSON.stringify(memorySettings.dingtalk)]
    );
  } catch (dbErr) {
    console.log('Database not available, using memory mode');
  }

  return memorySettings.dingtalk;
}

// 更新钉钉运行时状态
function updateDingtalkStatus(status) {
  memorySettings.dingtalk = {
    ...memorySettings.dingtalk,
    ...status,
  };
}

module.exports = router;
module.exports.getClusterConfig = getClusterConfig;
module.exports.getAIConfig = getAIConfig;
module.exports.getModels = getModels;
module.exports.getSparkHistoryUrl = getSparkHistoryUrl;
module.exports.loadSettingsFromDB = loadSettingsFromDB;
module.exports.getActiveModelId = getActiveModelId;
module.exports.getDingtalkConfig = getDingtalkConfig;
module.exports.setDingtalkConfig = setDingtalkConfig;
module.exports.updateDingtalkStatus = updateDingtalkStatus;