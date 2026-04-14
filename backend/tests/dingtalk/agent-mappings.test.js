const request = require('supertest');
const express = require('express');
const dingtalkRoutes = require('../../src/routes/dingtalk');
const Agent = require('../../src/models/agent');
const { getDingtalkConfig, setDingtalkConfig } = require('../../src/routes/settings');

// Mock dependencies
jest.mock('../../src/models/agent');
jest.mock('../../src/routes/settings');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/dingtalk', dingtalkRoutes);

describe('DingTalk Agent Mappings API', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    getDingtalkConfig.mockReturnValue({
      enabled: true,
      defaultAgentId: 'agent-1',
      agentMappings: {},
    });

    Agent.getAll.mockResolvedValue([
      { id: 'agent-1', name: '运维助手' },
      { id: 'agent-2', name: '数据分析' },
    ]);
  });

  describe('GET /api/dingtalk/agent-mappings', () => {
    it('should return empty mappings when no mappings configured', async () => {
      const res = await request(app)
        .get('/api/dingtalk/agent-mappings');

      expect(res.status).toBe(200);
      expect(res.body.mappings).toEqual([]);
      expect(res.body.defaultAgentId).toBe('agent-1');
      expect(res.body.availableAgents).toHaveLength(2);
    });

    it('should return configured mappings', async () => {
      getDingtalkConfig.mockReturnValue({
        defaultAgentId: 'agent-1',
        agentMappings: {
          'conv-1': 'agent-2',
          'conv-2': 'agent-1',
        },
      });

      const res = await request(app)
        .get('/api/dingtalk/agent-mappings');

      expect(res.status).toBe(200);
      expect(res.body.mappings).toHaveLength(2);
      expect(res.body.mappings[0]).toEqual({
        conversationId: 'conv-1',
        agentId: 'agent-2',
        agentName: '数据分析',
      });
      expect(res.body.mappings[1]).toEqual({
        conversationId: 'conv-2',
        agentId: 'agent-1',
        agentName: '运维助手',
      });
    });
  });

  describe('POST /api/dingtalk/agent-mappings', () => {
    it('should add new agent mapping', async () => {
      setDingtalkConfig.mockResolvedValue({
        agentMappings: {
          'conv-new': 'agent-2',
        },
      });

      const res = await request(app)
        .post('/api/dingtalk/agent-mappings')
        .send({
          conversationId: 'conv-new',
          agentId: 'agent-2',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.mapping).toEqual({
        conversationId: 'conv-new',
        agentId: 'agent-2',
        agentName: '数据分析',
      });
      expect(setDingtalkConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          agentMappings: expect.any(Object),
        })
      );
    });

    it('should return 400 when conversationId is missing', async () => {
      const res = await request(app)
        .post('/api/dingtalk/agent-mappings')
        .send({
          agentId: 'agent-2',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('required');
    });

    it('should return 400 when agentId is missing', async () => {
      const res = await request(app)
        .post('/api/dingtalk/agent-mappings')
        .send({
          conversationId: 'conv-new',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('required');
    });
  });

  describe('DELETE /api/dingtalk/agent-mappings/:conversationId', () => {
    it('should delete existing mapping', async () => {
      getDingtalkConfig.mockReturnValue({
        agentMappings: {
          'conv-1': 'agent-2',
          'conv-2': 'agent-1',
        },
      });

      setDingtalkConfig.mockResolvedValue({
        agentMappings: {
          'conv-2': 'agent-1',
        },
      });

      const res = await request(app)
        .delete('/api/dingtalk/agent-mappings/conv-1');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(setDingtalkConfig).toHaveBeenCalled();
    });

    it('should return 404 when mapping does not exist', async () => {
      getDingtalkConfig.mockReturnValue({
        agentMappings: {},
      });

      const res = await request(app)
        .delete('/api/dingtalk/agent-mappings/conv-nonexistent');

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });
  });
});