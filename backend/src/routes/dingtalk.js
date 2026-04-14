const express = require('express');
const axios = require('axios');
const router = express.Router();
const { processDingtalkMessage, getStats } = require('../services/dingtalk');
const { getDingtalkConfig, setDingtalkConfig, updateDingtalkStatus } = require('./settings');
const Agent = require('../models/agent');

// 导出 setDingtalkConfig 供其他模块使用
module.exports.setDingtalkConfig = setDingtalkConfig;

// POST /api/dingtalk/chat - 处理钉钉消息（内部接口，供 Stream 服务调用）
router.post('/chat', async (req, res) => {
  try {
    const { userId, userName, content, conversationId } = req.body;

    // 验证输入
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'userId is required and must be a string' });
    }
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'content is required and must be a string' });
    }
    if (content.length > 4000) {
      return res.status(400).json({ error: 'content exceeds maximum length of 4000 characters' });
    }

    const config = getDingtalkConfig();
    if (!config.enabled) {
      return res.status(503).json({ error: 'DingTalk integration is disabled' });
    }

    updateDingtalkStatus({
      messageCount: (config.messageCount || 0) + 1,
      lastMessageAt: new Date().toISOString(),
    });

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

// GET /api/dingtalk/status
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

// GET /api/dingtalk/config
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

// PUT /api/dingtalk/config
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

// POST /api/dingtalk/test-connection - 实际调用钉钉 API 验证配置
router.post('/test-connection', async (req, res) => {
  try {
    const { clientId, clientSecret } = req.body;

    if (!clientId || !clientSecret) {
      return res.status(400).json({ error: 'Client ID and Client Secret are required' });
    }

    if (clientId.length < 10 || clientSecret.length < 10) {
      return res.status(400).json({ error: 'Invalid Client ID or Client Secret format' });
    }

    // 实际调用钉钉 API 验证配置
    try {
      const tokenResponse = await axios.post(
        'https://api.dingtalk.com/v1.0/oauth2/accessToken',
        {
          clientId: clientId,
          clientSecret: clientSecret
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        }
      );

      if (tokenResponse.data && tokenResponse.data.accessToken) {
        res.json({
          success: true,
          message: '连接测试成功，凭证有效',
          expireIn: tokenResponse.data.expireIn
        });
      } else {
        res.status(400).json({
          error: '钉钉 API 返回异常响应',
          details: tokenResponse.data
        });
      }
    } catch (dingtalkErr) {
      const errorMsg = dingtalkErr.response?.data?.message || dingtalkErr.message;
      res.status(400).json({
        error: `钉钉 API 验证失败: ${errorMsg}`,
        details: dingtalkErr.response?.data
      });
    }
  } catch (err) {
    console.error('Test connection error:', err);
    res.status(500).json({ error: 'Failed to test connection' });
  }
});

// GET /api/dingtalk/health - 健康检查（供 Stream 服务调用）
router.get('/health', async (req, res) => {
  try {
    const config = getDingtalkConfig();
    res.json({
      status: 'ok',
      enabled: config.enabled,
      hasConfig: !!config.clientId && !!config.clientSecret,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// POST /api/dingtalk/update-status
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

// GET /api/dingtalk/agent-mappings - 获取智能体映射列表
router.get('/agent-mappings', async (req, res) => {
  try {
    const config = getDingtalkConfig();
    const agents = await Agent.getAll();

    const mappings = Object.entries(config.agentMappings || {}).map(([conversationId, agentId]) => {
      const agent = agents.find(a => a.id === agentId);
      return {
        conversationId,
        agentId,
        agentName: agent?.name || '未知智能体',
      };
    });

    res.json({
      mappings,
      defaultAgentId: config.defaultAgentId,
      availableAgents: agents.map(a => ({ id: a.id, name: a.name })),
    });
  } catch (err) {
    console.error('Get agent mappings error:', err);
    res.status(500).json({ error: 'Failed to get agent mappings' });
  }
});

// POST /api/dingtalk/agent-mappings - 添加智能体映射
router.post('/agent-mappings', async (req, res) => {
  try {
    const { conversationId, agentId } = req.body;

    if (!conversationId || !agentId) {
      return res.status(400).json({ error: 'conversationId and agentId are required' });
    }

    const config = getDingtalkConfig();
    const agentMappings = config.agentMappings || {};
    agentMappings[conversationId] = agentId;

    await setDingtalkConfig({ ...config, agentMappings });

    const agents = await Agent.getAll();
    const agent = agents.find(a => a.id === agentId);

    res.json({
      success: true,
      mapping: {
        conversationId,
        agentId,
        agentName: agent?.name || '未知智能体',
      },
    });
  } catch (err) {
    console.error('Add agent mapping error:', err);
    res.status(500).json({ error: 'Failed to add agent mapping' });
  }
});

// DELETE /api/dingtalk/agent-mappings/:conversationId - 删除智能体映射
router.delete('/agent-mappings/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;

    const config = getDingtalkConfig();
    const agentMappings = config.agentMappings || {};

    if (!agentMappings[conversationId]) {
      return res.status(404).json({ error: 'Mapping not found' });
    }

    delete agentMappings[conversationId];
    await setDingtalkConfig({ ...config, agentMappings });

    res.json({ success: true });
  } catch (err) {
    console.error('Delete agent mapping error:', err);
    res.status(500).json({ error: 'Failed to delete agent mapping' });
  }
});

module.exports = router;