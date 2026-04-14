const request = require('supertest');
const express = require('express');

// Mock dependencies BEFORE importing routes
jest.mock('../../src/services/dingtalk', () => ({
  processDingtalkMessage: jest.fn(),
  getStats: jest.fn(),
}));

jest.mock('../../src/routes/settings', () => ({
  getDingtalkConfig: jest.fn(),
  setDingtalkConfig: jest.fn(),
  updateDingtalkStatus: jest.fn(),
}));

jest.mock('../../src/models/agent', () => ({
  getAll: jest.fn(),
}));

jest.mock('axios');

// Import AFTER mocking
const dingtalkRoutes = require('../../src/routes/dingtalk');
const { processDingtalkMessage, getStats } = require('../../src/services/dingtalk');
const { getDingtalkConfig, setDingtalkConfig, updateDingtalkStatus } = require('../../src/routes/settings');
const Agent = require('../../src/models/agent');
const axios = require('axios');

const app = express();
app.use(express.json());
app.use('/api/dingtalk', dingtalkRoutes);

describe('DingTalk Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    getDingtalkConfig.mockReturnValue({
      enabled: true,
      connected: true,
      clientId: 'test-client-id-12345678',
      clientSecret: 'test-secret',
      defaultAgentId: 'agent-1',
      messageCount: 0,
      lastMessageAt: null,
    });

    processDingtalkMessage.mockResolvedValue({
      success: true,
      response: 'AI回复内容',
      agentId: 'agent-1',
    });

    Agent.getAll.mockResolvedValue([
      { id: 'agent-1', name: '运维助手' },
      { id: 'agent-2', name: '数据分析' },
    ]);

    setDingtalkConfig.mockResolvedValue({
      enabled: true,
      clientId: 'test-client-id',
      clientSecret: '********',
      defaultAgentId: 'agent-1',
    });

    getStats.mockReturnValue({
      activeSessions: 5,
      totalMessages: 10,
    });

    updateDingtalkStatus.mockReturnValue(undefined);
  });

  describe('POST /api/dingtalk/chat', () => {
    it('should process valid message', async () => {
      const response = await request(app)
        .post('/api/dingtalk/chat')
        .send({
          userId: 'user-1',
          userName: 'Test User',
          content: '查询集群状态',
          conversationId: 'conv-123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.response).toBe('AI回复内容');

      expect(processDingtalkMessage).toHaveBeenCalledWith({
        userId: 'user-1',
        userName: 'Test User',
        content: '查询集群状态',
        conversationId: 'conv-123',
      });
    });

    it('should update message count and lastMessageAt', async () => {
      await request(app)
        .post('/api/dingtalk/chat')
        .send({
          userId: 'user-1',
          content: 'test',
        });

      expect(updateDingtalkStatus).toHaveBeenCalledWith({
        messageCount: 1,
        lastMessageAt: expect.any(String),
      });
    });

    it('should return 400 if userId is missing', async () => {
      const response = await request(app)
        .post('/api/dingtalk/chat')
        .send({
          content: 'test message',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('userId is required');
    });

    it('should return 400 if userId is not a string', async () => {
      const response = await request(app)
        .post('/api/dingtalk/chat')
        .send({
          userId: 123,
          content: 'test',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('userId is required');
    });

    it('should return 400 if content is missing', async () => {
      const response = await request(app)
        .post('/api/dingtalk/chat')
        .send({
          userId: 'user-1',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('content is required');
    });

    it('should return 400 if content exceeds max length', async () => {
      const response = await request(app)
        .post('/api/dingtalk/chat')
        .send({
          userId: 'user-1',
          content: 'a'.repeat(4001),
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('exceeds maximum length');
    });

    it('should return 503 if DingTalk is disabled', async () => {
      getDingtalkConfig.mockReturnValue({
        enabled: false,
      });

      const response = await request(app)
        .post('/api/dingtalk/chat')
        .send({
          userId: 'user-1',
          content: 'test',
        });

      expect(response.status).toBe(503);
      expect(response.body.error).toContain('disabled');
    });

    it('should handle internal errors', async () => {
      processDingtalkMessage.mockRejectedValue(new Error('Internal error'));

      const response = await request(app)
        .post('/api/dingtalk/chat')
        .send({
          userId: 'user-1',
          content: 'test',
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Internal server error');
    });
  });

  describe('GET /api/dingtalk/status', () => {
    it('should return status information', async () => {
      const response = await request(app)
        .get('/api/dingtalk/status');

      expect(response.status).toBe(200);
      expect(response.body.enabled).toBe(true);
      expect(response.body.connected).toBe(true);
      expect(response.body.clientId).toBe('test-cli...');
      expect(response.body.defaultAgentId).toBe('agent-1');
      expect(response.body.messageCount).toBe(0);
      expect(response.body.activeSessions).toBe(5);
    });

    it('should mask clientId', async () => {
      const response = await request(app)
        .get('/api/dingtalk/status');

      expect(response.body.clientId).toBe('test-cli...');
      expect(response.body.clientId.length).toBeLessThan(20);
    });

    it('should handle empty clientId', async () => {
      getDingtalkConfig.mockReturnValue({
        enabled: true,
        connected: false,
        clientId: '',
        defaultAgentId: '',
        messageCount: 0,
        lastMessageAt: null,
      });

      const response = await request(app)
        .get('/api/dingtalk/status');

      expect(response.status).toBe(200);
      expect(response.body.clientId).toBe('');
    });

    it('should handle errors', async () => {
      getDingtalkConfig.mockImplementation(() => {
        throw new Error('Config error');
      });

      const response = await request(app)
        .get('/api/dingtalk/status');

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Failed to get status');
    });
  });

  describe('GET /api/dingtalk/config', () => {
    it('should return config with masked secret', async () => {
      const response = await request(app)
        .get('/api/dingtalk/config');

      expect(response.status).toBe(200);
      expect(response.body.enabled).toBe(true);
      expect(response.body.clientId).toBe('test-client-id-12345678');
      expect(response.body.clientSecret).toBe('********');
      expect(response.body.availableAgents).toHaveLength(2);
      expect(response.body.availableAgents[0].id).toBe('agent-1');
    });

    it('should handle empty clientSecret', async () => {
      getDingtalkConfig.mockReturnValue({
        enabled: true,
        clientId: 'test-id',
        clientSecret: '',
        defaultAgentId: 'agent-1',
      });

      const response = await request(app)
        .get('/api/dingtalk/config');

      expect(response.status).toBe(200);
      expect(response.body.clientSecret).toBe('');
    });

    it('should handle errors', async () => {
      getDingtalkConfig.mockImplementation(() => {
        throw new Error('Config error');
      });

      const response = await request(app)
        .get('/api/dingtalk/config');

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Failed to get config');
    });
  });

  describe('PUT /api/dingtalk/config', () => {
    it('should update config', async () => {
      const response = await request(app)
        .put('/api/dingtalk/config')
        .send({
          enabled: true,
          clientId: 'new-client-id',
          clientSecret: 'new-secret',
          defaultAgentId: 'agent-2',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.config.clientSecret).toBe('********');

      expect(setDingtalkConfig).toHaveBeenCalledWith({
        enabled: true,
        clientId: 'new-client-id',
        clientSecret: 'new-secret',
        defaultAgentId: 'agent-2',
      });
    });

    it('should not update clientSecret if it is masked', async () => {
      const response = await request(app)
        .put('/api/dingtalk/config')
        .send({
          enabled: true,
          clientId: 'test-id',
          clientSecret: '********',
          defaultAgentId: 'agent-1',
        });

      expect(response.status).toBe(200);
      expect(setDingtalkConfig).toHaveBeenCalledWith({
        enabled: true,
        clientId: 'test-id',
        clientSecret: undefined,
        defaultAgentId: 'agent-1',
      });
    });

    it('should handle empty clientSecret', async () => {
      const response = await request(app)
        .put('/api/dingtalk/config')
        .send({
          enabled: false,
          clientId: '',
          clientSecret: '',
          defaultAgentId: '',
        });

      expect(response.status).toBe(200);
      expect(setDingtalkConfig).toHaveBeenCalledWith({
        enabled: false,
        clientId: '',
        clientSecret: undefined,
        defaultAgentId: '',
      });
    });

    it('should handle errors', async () => {
      setDingtalkConfig.mockRejectedValue(new Error('Update failed'));

      const response = await request(app)
        .put('/api/dingtalk/config')
        .send({
          enabled: true,
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Failed to update config');
    });
  });

  describe('POST /api/dingtalk/test-connection', () => {
    it('should test connection successfully', async () => {
      axios.post.mockResolvedValue({
        data: {
          accessToken: 'test-token',
          expireIn: 7200,
        },
      });

      const response = await request(app)
        .post('/api/dingtalk/test-connection')
        .send({
          clientId: 'test-client-id-123',
          clientSecret: 'test-client-secret-123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('连接测试成功');

      expect(axios.post).toHaveBeenCalledWith(
        'https://api.dingtalk.com/v1.0/oauth2/accessToken',
        {
          clientId: 'test-client-id-123',
          clientSecret: 'test-client-secret-123',
        },
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        })
      );
    });

    it('should return 400 if clientId is missing', async () => {
      const response = await request(app)
        .post('/api/dingtalk/test-connection')
        .send({
          clientSecret: 'test-secret',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Client ID and Client Secret are required');
    });

    it('should return 400 if credentials are too short', async () => {
      const response = await request(app)
        .post('/api/dingtalk/test-connection')
        .send({
          clientId: 'short',
          clientSecret: 'also-short',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid Client ID or Client Secret format');
    });

    it('should handle DingTalk API errors', async () => {
      axios.post.mockRejectedValue({
        response: {
          data: {
            message: 'Invalid credentials',
          },
        },
        message: 'Request failed',
      });

      const response = await request(app)
        .post('/api/dingtalk/test-connection')
        .send({
          clientId: 'test-client-id-123',
          clientSecret: 'test-client-secret-123',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('钉钉 API 验证失败');
      expect(response.body.error).toContain('Invalid credentials');
    });

    it('should handle unexpected API response', async () => {
      axios.post.mockResolvedValue({
        data: {},
      });

      const response = await request(app)
        .post('/api/dingtalk/test-connection')
        .send({
          clientId: 'test-client-id-123',
          clientSecret: 'test-client-secret-123',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('钉钉 API 返回异常响应');
    });
  });

  describe('GET /api/dingtalk/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/dingtalk/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.enabled).toBe(true);
      expect(response.body.hasConfig).toBe(true);
      expect(response.body.timestamp).toBeDefined();
    });

    it('should handle missing config', async () => {
      getDingtalkConfig.mockReturnValue({
        enabled: false,
        clientId: '',
        clientSecret: '',
      });

      const response = await request(app)
        .get('/api/dingtalk/health');

      expect(response.status).toBe(200);
      expect(response.body.hasConfig).toBe(false);
    });

    it('should handle errors', async () => {
      getDingtalkConfig.mockImplementation(() => {
        throw new Error('Health check error');
      });

      const response = await request(app)
        .get('/api/dingtalk/health');

      expect(response.status).toBe(500);
      expect(response.body.status).toBe('error');
    });
  });

  describe('POST /api/dingtalk/update-status', () => {
    it('should update connection status', async () => {
      const response = await request(app)
        .post('/api/dingtalk/update-status')
        .send({
          connected: true,
          error: null,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(updateDingtalkStatus).toHaveBeenCalledWith({
        connected: true,
        lastError: null,
      });
    });

    it('should handle error message', async () => {
      const response = await request(app)
        .post('/api/dingtalk/update-status')
        .send({
          connected: false,
          error: 'Connection timeout',
        });

      expect(response.status).toBe(200);
      expect(updateDingtalkStatus).toHaveBeenCalledWith({
        connected: false,
        lastError: 'Connection timeout',
      });
    });

    it('should handle missing error field', async () => {
      const response = await request(app)
        .post('/api/dingtalk/update-status')
        .send({
          connected: true,
        });

      expect(response.status).toBe(200);
      expect(updateDingtalkStatus).toHaveBeenCalledWith({
        connected: true,
        lastError: null,
      });
    });
  });
});