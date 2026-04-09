const express = require('express');
const Agent = require('../models/agent');

const router = express.Router();

// GET /api/agents - 获取所有智能体
router.get('/', async (req, res) => {
  try {
    const agents = await Agent.getAll();
    res.json(agents);
  } catch (err) {
    console.error('Failed to get agents:', err);
    res.status(500).json({ error: '获取智能体列表失败' });
  }
});

// GET /api/agents/:id - 获取单个智能体
router.get('/:id', async (req, res) => {
  try {
    const agent = await Agent.getById(req.params.id);
    if (!agent) {
      return res.status(404).json({ error: '智能体不存在' });
    }
    res.json(agent);
  } catch (err) {
    console.error('Failed to get agent:', err);
    res.status(500).json({ error: '获取智能体失败' });
  }
});

// POST /api/agents - 创建智能体
router.post('/', async (req, res) => {
  try {
    if (!req.body.name) {
      return res.status(400).json({ error: '名称不能为空' });
    }
    const agent = await Agent.create(req.body);
    res.status(201).json(agent);
  } catch (err) {
    console.error('Failed to create agent:', err);
    res.status(500).json({ error: '创建智能体失败' });
  }
});

// PUT /api/agents/:id - 更新智能体
router.put('/:id', async (req, res) => {
  try {
    const agent = await Agent.update(req.params.id, req.body);
    if (!agent) {
      return res.status(404).json({ error: '智能体不存在' });
    }
    res.json(agent);
  } catch (err) {
    console.error('Failed to update agent:', err);
    res.status(500).json({ error: '更新智能体失败' });
  }
});

// DELETE /api/agents/:id - 删除智能体
router.delete('/:id', async (req, res) => {
  try {
    await Agent.delete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to delete agent:', err);
    res.status(500).json({ error: '删除智能体失败' });
  }
});

module.exports = router;