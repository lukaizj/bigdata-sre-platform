const express = require('express');
const { handleChat } = require('../services/chat');

const router = express.Router();

// POST /api/chat - 发送消息给智能体
router.post('/', async (req, res) => {
  try {
    const { agent_id, message } = req.body;

    if (!agent_id || !message) {
      return res.status(400).json({ error: 'agent_id 和 message 不能为空' });
    }

    const { response, data, steps } = await handleChat(agent_id, message);

    res.json({
      agent_id,
      response,
      data,
      steps: steps || [],
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('Chat failed:', err);
    res.status(500).json({ error: '对话处理失败: ' + err.message });
  }
});

module.exports = router;