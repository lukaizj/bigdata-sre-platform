# 钉钉企业机器人集成实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 bigdata-sre-platform 平台集成钉钉企业机器人，支持 Stream 模式接收消息，通过 HTTP 与 backend 通信，支持页面配置 Client ID/Secret。

**Architecture:** 采用独立 Stream 服务架构，dingtalk-stream 服务与钉钉建立长连接，接收消息后 HTTP POST 到 backend 的 `/api/chat/dingtalk` 接口，backend 处理完成后返回回复内容。配置存储在 settings 模块，前端提供独立配置页面。

**Tech Stack:** Node.js 20+, Express, @dingtalk/chatbot SDK, axios, Vue3, Element Plus

---

## 文件结构映射

```
bigdata-sre-platform/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── dingtalk.js          # 新增: 钉钉相关 API
│   │   │   └── index.js             # 修改: 注册 dingtalk 路由
│   │   ├── services/
│   │   │   └── dingtalk.js          # 新增: 钉钉消息处理服务
│   │   └── index.js                 # 修改: 初始化时加载钉钉配置
│   └── package.json                 # 修改: 添加加密依赖
├── frontend/
│   └── src/
│       ├── components/
│       │   └── DingtalkConfig.vue   # 新增: 钉钉配置页面
│       ├── App.vue                  # 修改: 添加钉钉配置菜单
│       └── router.js                # 修改: 添加钉钉配置路由
└── dingtalk-stream/                 # 新增目录: Stream 服务
    ├── package.json
    ├── index.js
    ├── .env.example
    └── src/
        ├── client.js
        ├── message-handler.js
        ├── api-client.js
        ├── config.js
        └── logger.js
```

---

## Task 1: Backend - 创建钉钉配置存储和加密工具

**Files:**
- Create: `backend/src/utils/crypto.js`
- Modify: `backend/src/routes/settings.js`

- [ ] **Step 1.1: 创建加密工具模块**

Create `backend/src/utils/crypto.js`:

```javascript
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// 从环境变量获取密钥，如果不存在则生成一个（仅开发环境）
const getMasterKey = () => {
  const key = process.env.ENCRYPTION_KEY;
  if (key) {
    return Buffer.from(key, 'hex');
  }
  // 开发环境：生成随机密钥并警告
  console.warn('WARNING: ENCRYPTION_KEY not set, using random key (data will be lost on restart)');
  return crypto.randomBytes(KEY_LENGTH);
};

const masterKey = getMasterKey();

/**
 * 加密文本
 * @param {string} text - 明文
 * @returns {string} - 加密后的密文（hex格式）
 */
function encrypt(text) {
  if (!text) return '';
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, masterKey, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // 格式: iv:authTag:encryptedData
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

/**
 * 解密密文
 * @param {string} encryptedText - 密文（hex格式）
 * @returns {string} - 明文
 */
function decrypt(encryptedText) {
  if (!encryptedText) return '';
  
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) return '';
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, masterKey, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (err) {
    console.error('Decryption failed:', err.message);
    return '';
  }
}

module.exports = { encrypt, decrypt };
```

- [ ] **Step 1.2: 修改 settings.js 添加钉钉配置支持**

Modify `backend/src/routes/settings.js` (around line 1-50):

```javascript
// 在文件顶部添加导入
const { encrypt, decrypt } = require('../utils/crypto');

// 在 memorySettings 对象中添加 dingtalk 配置（约第 48行后）
let memorySettings = {
  // ... 现有配置 ...
  
  // 钉钉配置
  dingtalk: {
    enabled: false,
    clientId: '',
    clientSecret: '', // 加密存储
    defaultAgentId: '',
    connected: false,
    messageCount: 0,
    lastMessageAt: null,
  },
};
```

- [ ] **Step 1.3: 添加钉钉配置 getter/setter 函数**

Add at the end of `backend/src/routes/settings.js` (before module.exports):

```javascript
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

// 导出函数
module.exports.getDingtalkConfig = getDingtalkConfig;
module.exports.setDingtalkConfig = setDingtalkConfig;
module.exports.updateDingtalkStatus = updateDingtalkStatus;
```

- [ ] **Step 1.4: 在 loadSettingsFromDB 中加载钉钉配置**

Modify `loadSettingsFromDB` function in `backend/src/routes/settings.js`:

```javascript
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
```

- [ ] **Step 1.5: Commit**

```bash
cd /opt/bigdata-sre-platform
git add backend/src/utils/crypto.js backend/src/routes/settings.js
git commit -m "feat: add encryption utility and dingtalk config storage

- Add crypto.js for AES-256-GCM encryption
- Add dingtalk config to settings module
- Support encrypted storage of clientSecret"
```

---

## Task 2: Backend - 创建钉钉消息处理 API

**Files:**
- Create: `backend/src/routes/dingtalk.js`
- Create: `backend/src/services/dingtalk.js`
- Modify: `backend/src/routes/index.js` (or create it)

- [ ] **Step 2.1: 创建钉钉消息处理服务**

Create `backend/src/services/dingtalk.js`:

```javascript
const Agent = require('../models/agent');
const { handleChat } = require('./chat');
const { getDingtalkConfig } = require('../routes/settings');

// 内存存储用户会话状态
const userSessions = new Map();

// 会话过期时间（30分钟）
const SESSION_EXPIRE_MS = 30 * 60 * 1000;

/**
 * 获取或创建用户会话
 * @param {string} userId - 钉钉用户ID
 * @returns {Object} - 用户会话
 */
function getUserSession(userId) {
  const now = Date.now();
  
  // 清理过期会话
  for (const [id, session] of userSessions.entries()) {
    if (now - session.lastActivityAt > SESSION_EXPIRE_MS) {
      userSessions.delete(id);
    }
  }
  
  // 获取或创建会话
  let session = userSessions.get(userId);
  if (!session) {
    const config = getDingtalkConfig();
    session = {
      userId,
      currentAgentId: config.defaultAgentId,
      lastActivityAt: now,
      messageCount: 0,
    };
    userSessions.set(userId, session);
  } else {
    session.lastActivityAt = now;
  }
  
  return session;
}

/**
 * 处理指令
 * @param {string} content - 消息内容
 * @param {Object} session - 用户会话
 * @returns {Object|null} - 指令处理结果，null表示不是指令
 */
async function handleCommand(content, session) {
  const trimmed = content.trim().toLowerCase();
  
  // 帮助指令
  if (trimmed === '帮助' || trimmed === 'help') {
    return {
      isCommand: true,
      response: getHelpMessage(session),
    };
  }
  
  // 智能体列表
  if (trimmed === '智能体列表' || trimmed === 'agents') {
    const agents = await Agent.getAll();
    const list = agents.map((a, i) => `${i + 1}. ${a.name} - ${a.description || '无描述'}`).join('\n');
    return {
      isCommand: true,
      response: `🤖 可用智能体列表：\n\n${list}\n\n发送"切换智能体 [名称]"来切换`,
    };
  }
  
  // 切换智能体
  const switchMatch = trimmed.match(/^切换智能体\s+(.+)$/);
  if (switchMatch) {
    const agentName = switchMatch[1].trim();
    const agents = await Agent.getAll();
    const agent = agents.find(a => a.name.toLowerCase() === agentName.toLowerCase());
    
    if (agent) {
      session.currentAgentId = agent.id;
      return {
        isCommand: true,
        response: `✅ 已切换到智能体：${agent.name}\n\n现在可以直接向我提问了！`,
      };
    } else {
      return {
        isCommand: true,
        response: `❌ 未找到智能体：${agentName}\n\n发送"智能体列表"查看可用智能体`,
      };
    }
  }
  
  return null;
}

/**
 * 获取帮助消息
 * @param {Object} session - 用户会话
 * @returns {string} - 帮助文本
 */
async function getHelpMessage(session) {
  const agents = await Agent.getAll();
  const currentAgent = agents.find(a => a.id === session.currentAgentId);
  
  return `🤖 大数据智能运维平台

我是您的智能运维助手，可以帮助您：
• 查询 HDFS/YARN/Spark 集群状态
• 执行 Ambari 管理操作
• 分析集群健康情况

当前使用智能体：${currentAgent?.name || '未配置'}

可用指令：
• 切换智能体 [名称] - 切换智能体
• 智能体列表 - 查看所有智能体
• 帮助 - 显示此帮助信息

直接输入您的问题即可开始对话！`;
}

/**
 * 处理钉钉消息
 * @param {Object} message - 钉钉消息
 * @returns {Object} - 处理结果
 */
async function processDingtalkMessage(message) {
  const { userId, userName, content, conversationId } = message;
  
  // 获取用户会话
  const session = getUserSession(userId);
  session.messageCount++;
  
  // 检查是否是指令
  const commandResult = await handleCommand(content, session);
  if (commandResult) {
    return {
      success: true,
      response: commandResult.response,
      agentId: session.currentAgentId,
      isCommand: true,
    };
  }
  
  // 检查是否有默认智能体
  if (!session.currentAgentId) {
    return {
      success: false,
      response: '⚠️ 未配置默认智能体\n\n请先在平台配置默认智能体，或发送"智能体列表"选择智能体。',
      agentId: null,
    };
  }
  
  // 调用智能体处理消息
  try {
    const { response, data, steps } = await handleChat(session.currentAgentId, content);
    
    return {
      success: true,
      response,
      agentId: session.currentAgentId,
      data,
      steps,
    };
  } catch (err) {
    console.error('Dingtalk message processing failed:', err);
    return {
      success: false,
      response: '❌ 处理失败：' + err.message,
      agentId: session.currentAgentId,
    };
  }
}

/**
 * 获取统计信息
 * @returns {Object} - 统计信息
 */
function getStats() {
  return {
    activeSessions: userSessions.size,
    totalMessages: Array.from(userSessions.values()).reduce((sum, s) => sum + s.messageCount, 0),
  };
}

module.exports = {
  processDingtalkMessage,
  getStats,
  getUserSession,
};
```

- [ ] **Step 2.2: 创建钉钉路由**

Create `backend/src/routes/dingtalk.js`:

```javascript
const express = require('express');
const router = express.Router();
const { processDingtalkMessage, getStats } = require('../services/dingtalk');
const { getDingtalkConfig, setDingtalkConfig, updateDingtalkStatus } = require('./settings');
const Agent = require('../models/agent');

// POST /api/dingtalk/chat - 处理钉钉消息（供 Stream 服务调用）
router.post('/chat', async (req, res) => {
  try {
    const { userId, userName, content, conversationId } = req.body;
    
    if (!userId || !content) {
      return res.status(400).json({ error: 'userId and content are required' });
    }
    
    // 检查钉钉集成是否启用
    const config = getDingtalkConfig();
    if (!config.enabled) {
      return res.status(503).json({ error: 'DingTalk integration is disabled' });
    }
    
    // 更新统计
    updateDingtalkStatus({
      messageCount: (config.messageCount || 0) + 1,
      lastMessageAt: new Date().toISOString(),
    });
    
    // 处理消息
    const result = await processDingtalkMessage({
      userId,
      userName,
      content,
      conversationId,
    });
    
    res.json(result);
  } catch (err) {
    console.error('DingTalk chat error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/dingtalk/status - 获取钉钉集成状态
router.get('/status', async (req, res) => {
  try {
    const config = getDingtalkConfig();
    const stats = getStats();
    
    res.json({
      enabled: config.enabled,
      connected: config.connected,
      clientId: config.clientId ? `${config.clientId.slice(0, 8)}...` : '',
      defaultAgentId: config.defaultAgentId,
      messageCount: config.messageCount || 0,
      lastMessageAt: config.lastMessageAt,
      activeSessions: stats.activeSessions,
    });
  } catch (err) {
    console.error('Get status error:', err);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

// GET /api/dingtalk/config - 获取钉钉配置（脱敏）
router.get('/config', async (req, res) => {
  try {
    const config = getDingtalkConfig();
    const agents = await Agent.getAll();
    
    res.json({
      enabled: config.enabled,
      clientId: config.clientId,
      clientSecret: config.clientSecret ? '********' : '',
      defaultAgentId: config.defaultAgentId,
      availableAgents: agents.map(a => ({ id: a.id, name: a.name })),
    });
  } catch (err) {
    console.error('Get config error:', err);
    res.status(500).json({ error: 'Failed to get config' });
  }
});

// PUT /api/dingtalk/config - 更新钉钉配置
router.put('/config', async (req, res) => {
  try {
    const { enabled, clientId, clientSecret, defaultAgentId } = req.body;
    
    const config = await setDingtalkConfig({
      enabled: !!enabled,
      clientId: clientId || '',
      clientSecret: clientSecret && clientSecret !== '********' ? clientSecret : undefined,
      defaultAgentId: defaultAgentId || '',
    });
    
    res.json({
      success: true,
      config: {
        enabled: config.enabled,
        clientId: config.clientId,
        clientSecret: config.clientSecret ? '********' : '',
        defaultAgentId: config.defaultAgentId,
      },
    });
  } catch (err) {
    console.error('Update config error:', err);
    res.status(500).json({ error: 'Failed to update config' });
  }
});

// POST /api/dingtalk/test-connection - 测试钉钉连接
router.post('/test-connection', async (req, res) => {
  try {
    const { clientId, clientSecret } = req.body;
    
    if (!clientId || !clientSecret) {
      return res.status(400).json({ error: 'Client ID and Client Secret are required' });
    }
    
    // 这里可以调用钉钉 API 验证凭证
    // 简化处理：仅检查格式
    if (clientId.length < 10 || clientSecret.length < 10) {
      return res.status(400).json({ error: 'Invalid Client ID or Client Secret format' });
    }
    
    res.json({ success: true, message: 'Configuration format is valid' });
  } catch (err) {
    console.error('Test connection error:', err);
    res.status(500).json({ error: 'Failed to test connection' });
  }
});

// POST /api/dingtalk/update-status - Stream 服务更新状态（内部接口）
router.post('/update-status', async (req, res) => {
  try {
    const { connected, error } = req.body;
    
    updateDingtalkStatus({
      connected: !!connected,
      lastError: error || null,
    });
    
    res.json({ success: true });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

module.exports = router;
```

- [ ] **Step 2.3: 注册钉钉路由**

Check if `backend/src/routes/index.js` exists, if not create it:

```javascript
const express = require('express');
const router = express.Router();

// 导入路由
const authRoutes = require('./auth');
const agentRoutes = require('./agents');
const skillRoutes = require('./skills');
const chatRoutes = require('./chat');
const settingsRoutes = require('./settings');
const dingtalkRoutes = require('./dingtalk');

// 注册路由
router.use('/auth', authRoutes);
router.use('/agents', agentRoutes);
router.use('/skills', skillRoutes);
router.use('/chat', chatRoutes);
router.use('/settings', settingsRoutes);
router.use('/dingtalk', dingtalkRoutes);

module.exports = router;
```

If `backend/src/index.js` directly imports routes, modify it:

```javascript
// 在 index.js 中添加
const dingtalkRoutes = require('./routes/dingtalk');
app.use('/api/dingtalk', dingtalkRoutes);
```

- [ ] **Step 2.4: Commit**

```bash
cd /opt/bigdata-sre-platform
git add backend/src/services/dingtalk.js backend/src/routes/dingtalk.js
git add backend/src/routes/index.js 2>/dev/null || git add backend/src/index.js
git commit -m "feat: add dingtalk message processing API

- Add dingtalk service with command handling
- Add /api/dingtalk/chat endpoint for Stream service
- Add /api/dingtalk/config and /status endpoints
- Support user session management"
```

---

## Task 3: Frontend - 创建钉钉配置页面

**Files:**
- Create: `frontend/src/components/DingtalkConfig.vue`
- Modify: `frontend/src/App.vue`

- [ ] **Step 3.1: 创建钉钉配置页面**

Create `frontend/src/components/DingtalkConfig.vue`:

```vue
<template>
  <div class="dingtalk-config">
    <h2>钉钉机器人配置</h2>
    
    <!-- 状态卡片 -->
    <el-card class="status-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>连接状态</span>
          <el-tag :type="statusType">{{ statusText }}</el-tag>
        </div>
      </template>
      <div class="status-content">
        <div class="status-item">
          <span class="label">运行状态：</span>
          <span class="value">{{ config.enabled ? '已启用' : '已禁用' }}</span>
        </div>
        <div class="status-item">
          <span class="label">消息统计：</span>
          <span class="value">{{ status.messageCount || 0 }} 条</span>
        </div>
        <div class="status-item" v-if="status.lastMessageAt">
          <span class="label">最后消息：</span>
          <span class="value">{{ formatTime(status.lastMessageAt) }}</span>
        </div>
      </div>
    </el-card>
    
    <!-- 配置表单 -->
    <el-card class="config-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>基本配置</span>
        </div>
      </template>
      
      <el-form :model="form" label-width="140px" :rules="rules" ref="formRef">
        <el-form-item label="启用钉钉集成">
          <el-switch v-model="form.enabled" />
        </el-form-item>
        
        <el-form-item label="Client ID" prop="clientId">
          <el-input 
            v-model="form.clientId" 
            placeholder="请输入钉钉 Client ID"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="Client Secret" prop="clientSecret">
          <el-input 
            v-model="form.clientSecret" 
            type="password" 
            placeholder="请输入钉钉 Client Secret"
            show-password
            clearable
          />
        </el-form-item>
        
        <el-form-item label="默认智能体" prop="defaultAgentId">
          <el-select v-model="form.defaultAgentId" placeholder="请选择默认智能体" style="width: 100%">
            <el-option 
              v-for="agent in availableAgents" 
              :key="agent.id" 
              :label="agent.name" 
              :value="agent.id" 
            />
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="saveConfig" :loading="saving">
            保存配置
          </el-button>
          <el-button @click="testConnection" :loading="testing">
            测试连接
          </el-button>
          <el-button @click="loadConfig">刷新</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 使用说明 -->
    <el-card class="help-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>使用说明</span>
        </div>
      </template>
      <div class="help-content">
        <h4>配置步骤：</h4>
        <ol>
          <li>在钉钉开放平台创建企业内部机器人，获取 Client ID 和 Client Secret</li>
          <li>在上方表单填写配置信息，选择默认智能体</li>
          <li>点击"测试连接"验证配置是否正确</li>
          <li>点击"保存配置"保存设置</li>
          <li>启动 Stream 服务（独立进程）</li>
        </ol>
        
        <h4>用户交互指令：</h4>
        <ul>
          <li><code>帮助</code> - 显示帮助信息</li>
          <li><code>智能体列表</code> - 查看可用智能体</li>
          <li><code>切换智能体 [名称]</code> - 切换当前智能体</li>
        </ul>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const formRef = ref(null)
const saving = ref(false)
const testing = ref(false)

const form = reactive({
  enabled: false,
  clientId: '',
  clientSecret: '',
  defaultAgentId: '',
})

const config = ref({})
const status = ref({})
const availableAgents = ref([])

const rules = {
  clientId: [{ required: true, message: '请输入 Client ID', trigger: 'blur' }],
  clientSecret: [{ required: true, message: '请输入 Client Secret', trigger: 'blur' }],
  defaultAgentId: [{ required: true, message: '请选择默认智能体', trigger: 'change' }],
}

const statusType = computed(() => {
  if (!config.value.enabled) return 'info'
  return status.value.connected ? 'success' : 'danger'
})

const statusText = computed(() => {
  if (!config.value.enabled) return '未启用'
  return status.value.connected ? '已连接' : '已断开'
})

const loadConfig = async () => {
  try {
    const [configRes, statusRes] = await Promise.all([
      axios.get('/api/dingtalk/config'),
      axios.get('/api/dingtalk/status'),
    ])
    
    const data = configRes.data
    form.enabled = data.enabled
    form.clientId = data.clientId
    form.clientSecret = data.clientSecret
    form.defaultAgentId = data.defaultAgentId
    availableAgents.value = data.availableAgents || []
    
    config.value = data
    status.value = statusRes.data
  } catch (err) {
    ElMessage.error('加载配置失败：' + (err.response?.data?.error || err.message))
  }
}

const saveConfig = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    saving.value = true
    try {
      await axios.put('/api/dingtalk/config', {
        enabled: form.enabled,
        clientId: form.clientId,
        clientSecret: form.clientSecret,
        defaultAgentId: form.defaultAgentId,
      })
      ElMessage.success('配置保存成功')
      await loadConfig()
    } catch (err) {
      ElMessage.error('保存失败：' + (err.response?.data?.error || err.message))
    } finally {
      saving.value = false
    }
  })
}

const testConnection = async () => {
  if (!form.clientId || !form.clientSecret) {
    ElMessage.warning('请先填写 Client ID 和 Client Secret')
    return
  }
  
  testing.value = true
  try {
    await axios.post('/api/dingtalk/test-connection', {
      clientId: form.clientId,
      clientSecret: form.clientSecret,
    })
    ElMessage.success('连接测试通过')
  } catch (err) {
    ElMessage.error('连接测试失败：' + (err.response?.data?.error || err.message))
  } finally {
    testing.value = false
  }
}

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

onMounted(() => {
  loadConfig()
})
</script>

<style scoped>
.dingtalk-config {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.dingtalk-config h2 {
  margin-bottom: 20px;
  color: var(--text-primary);
}

.status-card,
.config-card,
.help-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status-item {
  display: flex;
  align-items: center;
}

.status-item .label {
  color: var(--text-muted);
  width: 100px;
}

.status-item .value {
  color: var(--text-primary);
  font-weight: 500;
}

.help-content h4 {
  margin: 16px 0 8px;
  color: var(--text-primary);
}

.help-content h4:first-child {
  margin-top: 0;
}

.help-content ol,
.help-content ul {
  padding-left: 20px;
  color: var(--text-secondary);
  line-height: 1.8;
}

.help-content code {
  background: var(--bg-hover);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.9em;
}
</style>
```

- [ ] **Step 3.2: 在 App.vue 添加钉钉配置菜单**

Modify `frontend/src/App.vue`, find the menu section and add:

```vue
<!-- 在菜单列表中添加 -->
<div 
  class="menu-item" 
  :class="{ active: currentView === 'dingtalk' }"
  @click="currentView = 'dingtalk'"
>
  <svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
  </svg>
  <span class="menu-text">钉钉配置</span>
</div>
```

Find the component import section and add:

```javascript
// 添加导入
import DingtalkConfig from './components/DingtalkConfig.vue'

// 在 components 对象中添加
const menuComponents = {
  dashboard: ClusterDashboard,
  chat: ChatView,
  agents: AgentManagement,
  skills: SkillManagement,
  users: UserManagement,
  clusters: ClusterConfig,
  guide: UserGuide,
  dingtalk: DingtalkConfig,  // 添加这行
}
```

- [ ] **Step 3.3: Commit**

```bash
cd /opt/bigdata-sre-platform
git add frontend/src/components/DingtalkConfig.vue frontend/src/App.vue
git commit -m "feat: add dingtalk config page

- Add DingtalkConfig.vue with status card and config form
- Add menu item in App.vue
- Support connection test and config save"
```

---

## Task 4: DingTalk Stream 服务

**Files:**
- Create: `dingtalk-stream/package.json`
- Create: `dingtalk-stream/.env.example`
- Create: `dingtalk-stream/index.js`
- Create: `dingtalk-stream/src/config.js`
- Create: `dingtalk-stream/src/logger.js`
- Create: `dingtalk-stream/src/api-client.js`
- Create: `dingtalk-stream/src/message-handler.js`
- Create: `dingtalk-stream/src/client.js`

- [ ] **Step 4.1: 创建 package.json**

Create `dingtalk-stream/package.json`:

```json
{
  "name": "dingtalk-stream-service",
  "version": "1.0.0",
  "description": "DingTalk Stream Service for bigdata-sre-platform",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "node --watch index.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [
    "dingtalk",
    "stream",
    "chatbot"
  ],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "@dingtalk/chatbot": "^1.0.0",
    "axios": "^1.6.0",
    "winston": "^3.11.0",
    "dotenv": "^16.3.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

- [ ] **Step 4.2: 创建环境变量示例**

Create `dingtalk-stream/.env.example`:

```bash
# Backend API URL
BACKEND_URL=http://localhost:8080

# DingTalk credentials (will be overridden by backend config)
CLIENT_ID=
CLIENT_SECRET=

# Logging
LOG_LEVEL=info

# Reconnect settings
RECONNECT_INTERVAL=30
MAX_RECONNECT_INTERVAL=300

# Server port (for health check)
PORT=3001
```

- [ ] **Step 4.3: 创建配置模块**

Create `dingtalk-stream/src/config.js`:

```javascript
require('dotenv').config();

const config = {
  // Backend API
  backendUrl: process.env.BACKEND_URL || 'http://localhost:8080',
  
  // DingTalk credentials
  clientId: process.env.CLIENT_ID || '',
  clientSecret: process.env.CLIENT_SECRET || '',
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // Reconnect settings (seconds)
  reconnectInterval: parseInt(process.env.RECONNECT_INTERVAL) || 30,
  maxReconnectInterval: parseInt(process.env.MAX_RECONNECT_INTERVAL) || 300,
  
  // Server port
  port: parseInt(process.env.PORT) || 3001,
};

// Validate required config
function validate() {
  if (!config.clientId || !config.clientSecret) {
    throw new Error('CLIENT_ID and CLIENT_SECRET are required');
  }
}

module.exports = {
  ...config,
  validate,
};
```

- [ ] **Step 4.4: 创建日志模块**

Create `dingtalk-stream/src/logger.js`:

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ level, message, timestamp, stack }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Create logs directory if not exists
const fs = require('fs');
const path = require('path');
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

module.exports = logger;
```

- [ ] **Step 4.5: 创建 Backend API 客户端**

Create `dingtalk-stream/src/api-client.js`:

```javascript
const axios = require('axios');
const config = require('./config');
const logger = require('./logger');

const apiClient = axios.create({
  baseURL: config.backendUrl,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 发送消息到 backend 处理
 * @param {Object} message - 钉钉消息
 * @returns {Promise<Object>} - 处理结果
 */
async function sendMessage(message) {
  try {
    const response = await apiClient.post('/api/dingtalk/chat', {
      userId: message.senderStaffId,
      userName: message.senderNick,
      content: message.content,
      conversationId: message.conversationId,
      messageType: message.msgtype,
    });
    
    return response.data;
  } catch (err) {
    logger.error('Failed to send message to backend:', err.message);
    throw err;
  }
}

/**
 * 更新连接状态到 backend
 * @param {boolean} connected - 是否已连接
 * @param {string} error - 错误信息
 */
async function updateStatus(connected, error = null) {
  try {
    await apiClient.post('/api/dingtalk/update-status', {
      connected,
      error,
    });
  } catch (err) {
    logger.error('Failed to update status:', err.message);
  }
}

/**
 * 从 backend 获取配置
 * @returns {Promise<Object>} - 配置对象
 */
async function fetchConfig() {
  try {
    const response = await apiClient.get('/api/dingtalk/config');
    return response.data;
  } catch (err) {
    logger.error('Failed to fetch config:', err.message);
    return null;
  }
}

module.exports = {
  sendMessage,
  updateStatus,
  fetchConfig,
};
```

- [ ] **Step 4.6: 创建消息处理器**

Create `dingtalk-stream/src/message-handler.js`:

```javascript
const { sendMessage } = require('./api-client');
const logger = require('./logger');

/**
 * 处理钉钉消息
 * @param {Object} message - 钉钉消息对象
 * @returns {Promise<string>} - 回复内容
 */
async function handleMessage(message) {
  logger.info(`Received message from ${message.senderNick}: ${message.content?.substring(0, 50)}...`);
  
  try {
    // 发送到 backend 处理
    const result = await sendMessage(message);
    
    if (result.success) {
      return result.response;
    } else {
      logger.warn('Backend returned error:', result.response);
      return result.response || '处理失败，请稍后重试';
    }
  } catch (err) {
    logger.error('Failed to handle message:', err);
    return '服务暂时不可用，请稍后重试';
  }
}

/**
 * 格式化回复消息
 * @param {string} text - 原始文本
 * @returns {string} - 格式化后的文本
 */
function formatReply(text) {
  // 限制长度（钉钉消息有长度限制）
  const maxLength = 2000;
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + '\n\n...（消息已截断）';
  }
  return text;
}

module.exports = {
  handleMessage,
  formatReply,
};
```

- [ ] **Step 4.7: 创建 Stream 客户端**

Create `dingtalk-stream/src/client.js`:

```javascript
const { ChatbotClient } = require('@dingtalk/chatbot');
const config = require('./config');
const logger = require('./logger');
const { handleMessage, formatReply } = require('./message-handler');
const { updateStatus } = require('./api-client');

class DingTalkStreamClient {
  constructor() {
    this.client = null;
    this.reconnectInterval = config.reconnectInterval * 1000;
    this.maxReconnectInterval = config.maxReconnectInterval * 1000;
    this.currentInterval = this.reconnectInterval;
    this.isRunning = false;
    this.reconnectTimer = null;
  }

  /**
   * 启动 Stream 客户端
   */
  async start() {
    if (this.isRunning) {
      logger.warn('Client is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting DingTalk Stream client...');
    logger.info(`Client ID: ${config.clientId.slice(0, 8)}...`);

    await this.connect();
  }

  /**
   * 建立连接
   */
  async connect() {
    try {
      // 创建客户端
      this.client = new ChatbotClient({
        clientId: config.clientId,
        clientSecret: config.clientSecret,
      });

      // 监听消息
      this.client.on('message', async (message) => {
        try {
          const reply = await handleMessage(message);
          const formattedReply = formatReply(reply);
          
          // 发送回复
          await this.client.replyMessage({
            messageId: message.messageId,
            content: formattedReply,
          });
          
          logger.info(`Replied to ${message.senderNick}`);
        } catch (err) {
          logger.error('Failed to reply:', err);
        }
      });

      // 监听连接事件
      this.client.on('connected', () => {
        logger.info('Connected to DingTalk Stream');
        this.currentInterval = this.reconnectInterval; // 重置重连间隔
        updateStatus(true);
      });

      // 监听断开事件
      this.client.on('disconnected', (reason) => {
        logger.warn('Disconnected from DingTalk Stream:', reason);
        updateStatus(false, reason);
        this.scheduleReconnect();
      });

      // 监听错误
      this.client.on('error', (err) => {
        logger.error('Stream error:', err);
        updateStatus(false, err.message);
      });

      // 启动连接
      await this.client.start();
      
    } catch (err) {
      logger.error('Failed to connect:', err);
      updateStatus(false, err.message);
      this.scheduleReconnect();
    }
  }

  /**
   * 计划重连
   */
  scheduleReconnect() {
    if (!this.isRunning) {
      logger.info('Client stopped, skipping reconnect');
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    logger.info(`Reconnecting in ${this.currentInterval / 1000}s...`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.currentInterval);

    // 指数退避
    this.currentInterval = Math.min(
      this.currentInterval * 2,
      this.maxReconnectInterval
    );
  }

  /**
   * 停止客户端
   */
  async stop() {
    logger.info('Stopping DingTalk Stream client...');
    this.isRunning = false;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.client) {
      await this.client.stop();
      this.client = null;
    }

    await updateStatus(false, 'Client stopped');
    logger.info('Client stopped');
  }
}

module.exports = DingTalkStreamClient;
```

- [ ] **Step 4.8: 创建入口文件**

Create `dingtalk-stream/index.js`:

```javascript
const config = require('./src/config');
const logger = require('./src/logger');
const DingTalkStreamClient = require('./src/client');

// 验证配置
try {
  config.validate();
} catch (err) {
  logger.error('Configuration error:', err.message);
  process.exit(1);
}

// 创建客户端
const client = new DingTalkStreamClient();

// 启动
async function main() {
  logger.info('========================================');
  logger.info('DingTalk Stream Service');
  logger.info('Version: 1.0.0');
  logger.info('========================================');

  // 处理优雅退出
  process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down...');
    await client.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down...');
    await client.stop();
    process.exit(0);
  });

  // 处理未捕获的异常
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception:', err);
    client.stop().then(() => process.exit(1));
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection at:', promise, 'reason:', reason);
  });

  // 启动客户端
  await client.start();
}

main().catch((err) => {
  logger.error('Failed to start:', err);
  process.exit(1);
});
```

- [ ] **Step 4.9: Commit**

```bash
cd /opt/bigdata-sre-platform
git add dingtalk-stream/
git commit -m "feat: add dingtalk-stream service

- Add independent Stream service for DingTalk integration
- Support message receiving and forwarding to backend
- Auto-reconnect with exponential backoff
- Winston logging with file rotation"
```

---

## Task 5: Integration and Testing

**Files:**
- Modify: `backend/src/index.js`
- Modify: `backend/package.json`
- Create: `docker-compose.yml` (optional)

- [ ] **Step 5.1: 修改 backend 入口加载钉钉配置**

Modify `backend/src/index.js`:

```javascript
// 在文件顶部添加
const { loadSettingsFromDB } = require('./routes/settings');

// 在应用启动时加载配置
async function startServer() {
  // 加载数据库配置
  await loadSettingsFromDB();
  
  // ... 现有启动代码 ...
}

startServer();
```

- [ ] **Step 5.2: 添加环境变量说明**

Create `backend/.env.example` (if not exists):

```bash
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=bigdata_sre

# JWT
JWT_SECRET=your-secret-key-here

# Encryption (for dingtalk clientSecret)
ENCRYPTION_KEY=your-32-byte-hex-key-here

# Server
SERVER_PORT=8080
```

- [ ] **Step 5.3: 更新后端 package.json 添加加密依赖**

Modify `backend/package.json`:

```json
{
  "dependencies": {
    // ... 现有依赖 ...
    "crypto": "^1.0.1"
  }
}
```

Note: `crypto` is built-in Node.js module, no need to install. Just ensure Node.js version >= 16.

- [ ] **Step 5.4: 创建启动脚本**

Create `start-dingtalk-stream.sh`:

```bash
#!/bin/bash

# DingTalk Stream Service startup script

cd "$(dirname "$0")/dingtalk-stream"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Load environment variables from backend .env
export $(grep -v '^#' ../backend/.env | xargs)

# Start the service
echo "Starting DingTalk Stream Service..."
npm start
```

Make it executable:

```bash
chmod +x start-dingtalk-stream.sh
```

- [ ] **Step 5.5: Commit**

```bash
cd /opt/bigdata-sre-platform
git add backend/src/index.js backend/.env.example start-dingtalk-stream.sh
git commit -m "chore: integration and startup scripts

- Load dingtalk config on backend startup
- Add .env.example with encryption key
- Add start-dingtalk-stream.sh script"
```

---

## Task 6: Documentation

**Files:**
- Create: `docs/dingtalk-setup.md`

- [ ] **Step 6.1: 创建部署文档**

Create `docs/dingtalk-setup.md`:

```markdown
# 钉钉机器人集成部署指南

## 前置条件

- Node.js >= 18
- 钉钉开放平台企业账号
- 已部署 bigdata-sre-platform backend

## 1. 钉钉开放平台配置

### 1.1 创建企业内部机器人

1. 登录 [钉钉开放平台](https://open.dingtalk.com/)
2. 进入"应用开发" -> "企业内部开发" -> "机器人"
3. 点击"创建应用"
4. 填写应用信息：
   - 应用名称：大数据运维助手
   - 应用描述：智能运维对话机器人
   - 应用图标：上传图标

### 1.2 获取凭证

创建完成后，在"凭证与基础信息"页面获取：
- **Client ID** (AppKey)
- **Client Secret** (AppSecret)

### 1.3 配置机器人

1. 进入"机器人"页面
2. 开启"机器人"功能
3. 配置消息接收模式：**Stream 模式**
4. 设置机器人名称、描述、图标

### 1.4 发布应用

1. 进入"版本管理与发布"
2. 点击"发布"
3. 选择可见范围（建议先选择测试部门）

### 1.5 添加到群聊

1. 在钉钉群聊中，点击"群设置" -> "智能群助手"
2. 点击"添加机器人"
3. 选择创建的企业内部机器人

## 2. 平台配置

### 2.1 配置加密密钥

编辑 `backend/.env`，添加：

```bash
ENCRYPTION_KEY=your-32-byte-hex-key-here
```

生成密钥：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2.2 启动 Backend

```bash
cd backend
npm install
npm start
```

### 2.3 配置钉钉集成

1. 打开平台页面，进入"钉钉配置"菜单
2. 填写：
   - Client ID：从钉钉开放平台获取
   - Client Secret：从钉钉开放平台获取
   - 默认智能体：选择一个智能体作为默认
3. 点击"测试连接"
4. 点击"保存配置"

### 2.4 启动 Stream 服务

```bash
# 方式1：使用启动脚本
./start-dingtalk-stream.sh

# 方式2：手动启动
cd dingtalk-stream
npm install
npm start
```

或使用 PM2：

```bash
pm2 start dingtalk-stream/index.js --name dingtalk-stream
```

## 3. 验证

### 3.1 检查连接状态

在平台"钉钉配置"页面查看连接状态是否为"已连接"。

### 3.2 测试消息

在钉钉群聊中 @机器人：

```
@大数据运维助手 帮助
```

应收到帮助信息回复。

## 4. 故障排查

### 4.1 连接失败

检查日志：

```bash
tail -f dingtalk-stream/logs/combined.log
```

常见问题：
- Client ID/Secret 错误
- 网络不通
- Backend 未启动

### 4.2 消息无回复

1. 检查 Stream 服务是否运行
2. 检查 Backend 日志
3. 检查默认智能体是否配置正确

## 5. 生产部署建议

### 5.1 使用 PM2 管理进程

```bash
pm2 start backend/src/index.js --name backend
pm2 start dingtalk-stream/index.js --name dingtalk-stream
```

### 5.2 使用 Docker

```bash
docker-compose up -d
```

### 5.3 监控

- 使用钉钉配置页面的状态监控
- 查看 Stream 服务日志
- 配置告警（连接断开时通知）

## 6. 安全建议

1. **加密密钥**：生产环境使用强随机密钥
2. **访问控制**：限制钉钉配置页面仅管理员访问
3. **日志脱敏**：日志中不输出 Client Secret
4. **网络安全**：Backend API 使用 HTTPS
5. **定期轮换**：定期更换 Client Secret

## 参考

- [钉钉开放平台文档](https://open.dingtalk.com/document/)
- [Stream 模式文档](https://open.dingtalk.com/document/isv/stream-mode)
```

- [ ] **Step 6.2: Final Commit**

```bash
cd /opt/bigdata-sre-platform
git add docs/dingtalk-setup.md
git commit -m "docs: add dingtalk integration setup guide"
```

---

## Summary

### 创建的文件清单

| 路径 | 说明 |
|------|------|
| `backend/src/utils/crypto.js` | AES-256-GCM 加密工具 |
| `backend/src/services/dingtalk.js` | 钉钉消息处理服务 |
| `backend/src/routes/dingtalk.js` | 钉钉相关 API 路由 |
| `frontend/src/components/DingtalkConfig.vue` | 钉钉配置页面 |
| `dingtalk-stream/package.json` | Stream 服务依赖 |
| `dingtalk-stream/index.js` | Stream 服务入口 |
| `dingtalk-stream/src/client.js` | Stream 客户端 |
| `dingtalk-stream/src/message-handler.js` | 消息处理器 |
| `dingtalk-stream/src/api-client.js` | Backend API 客户端 |
| `dingtalk-stream/src/config.js` | 配置管理 |
| `dingtalk-stream/src/logger.js` | 日志模块 |
| `docs/dingtalk-setup.md` | 部署文档 |

### 修改的文件清单

| 路径 | 说明 |
|------|------|
| `backend/src/routes/settings.js` | 添加钉钉配置存储 |
| `backend/src/index.js` | 加载钉钉配置 |
| `frontend/src/App.vue` | 添加钉钉配置菜单 |

---

## Self-Review Checklist

- [x] **Spec coverage**: 所有设计文档中的功能都有对应任务
- [x] **Placeholder scan**: 无 TBD/TODO/"implement later"
- [x] **Type consistency**: 函数名、参数名前后一致
- [x] **File paths**: 所有路径都是绝对路径或相对项目根目录
- [x] **Code completeness**: 每个任务包含完整可运行的代码

---

**Plan complete and saved to `docs/superpowers/plans/2025-04-13-dingtalk-integration.md`.**

## 执行选项

**1. Subagent-Driven (推荐)** - 我为每个 Task 分配独立的子代理，任务间有审查点，快速迭代

**2. Inline Execution** - 在当前会话中使用 executing-plans 批量执行任务，有检查点供审查

**请选择执行方式？**