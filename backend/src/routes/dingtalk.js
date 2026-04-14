const express = require('express');
const router = express.Router();
const { processDingtalkMessage, getStats } = require('../services/dingtalk');
const { getDingtalkConfig, setDingtalkConfig, updateDingtalkStatus } = require('./settings');
const Agent = require('../models/agent');

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

// POST /api/dingtalk/test-connection - 验证配置格式
router.post('/test-connection', async (req, res) => {
  try {
    const { clientId, clientSecret } = req.body;

    if (!clientId || !clientSecret) {
      return res.status(400).json({ error: 'Client ID and Client Secret are required' });
    }

    if (clientId.length < 10 || clientSecret.length < 10) {
      return res.status(400).json({ error: 'Invalid Client ID or Client Secret format' });
    }

    // 注意：这里仅验证格式，实际连接测试需要在 Stream 服务启动后进行
    res.json({ success: true, message: 'Configuration format is valid. Actual connection will be tested when Stream service starts.' });
  } catch (err) {
    console.error('Test connection error:', err);
    res.status(500).json({ error: 'Failed to test connection' });
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

module.exports = router;