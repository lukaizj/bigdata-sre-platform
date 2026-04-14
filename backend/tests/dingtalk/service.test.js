const { processDingtalkMessage, getStats, getUserSession, resetSessions } = require('../../src/services/dingtalk');
const Agent = require('../../src/models/agent');
const { handleChat } = require('../../src/services/chat');
const { getDingtalkConfig } = require('../../src/routes/settings');

// Mock dependencies
jest.mock('../../src/models/agent');
jest.mock('../../src/services/chat');
jest.mock('../../src/routes/settings');

describe('DingTalk Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset sessions before each test
    resetSessions();

    // Default mock implementations
    getDingtalkConfig.mockReturnValue({
      enabled: true,
      clientId: 'test-client-id',
      clientSecret: 'test-secret',
      defaultAgentId: 'agent-1',
      connected: true,
      agentMappings: {},
    });

    Agent.getAll.mockResolvedValue([
      { id: 'agent-1', name: '运维助手', description: '帮助运维' },
      { id: 'agent-2', name: '数据分析', description: '数据分析助手' },
    ]);
  });

  describe('getUserSession', () => {
    it('should create a new session for new user', () => {
      const session = getUserSession('user-1');

      expect(session).toBeDefined();
      expect(session.userId).toBe('user-1');
      expect(session.currentAgentId).toBe('agent-1');
      expect(session.messageCount).toBe(0);
      expect(session.lastActivityAt).toBeDefined();
    });

    it('should return existing session and update lastActivityAt', () => {
      const session1 = getUserSession('user-1');
      const firstActivity = session1.lastActivityAt;

      // Wait a bit and get session again
      const start = Date.now();
      while (Date.now() - start < 10) {}

      const session2 = getUserSession('user-1');

      expect(session2.userId).toBe('user-1');
      expect(session2.lastActivityAt).toBeGreaterThanOrEqual(firstActivity);
    });

    it('should use default agent from config', () => {
      getDingtalkConfig.mockReturnValue({
        defaultAgentId: 'agent-2',
      });

      const session = getUserSession('new-user');
      expect(session.currentAgentId).toBe('agent-2');
    });

    it('should handle multiple users', () => {
      const session1 = getUserSession('user-1');
      const session2 = getUserSession('user-2');

      expect(session1.userId).toBe('user-1');
      expect(session2.userId).toBe('user-2');
    });

    it('should use mapped agent when conversationId has mapping', () => {
      getDingtalkConfig.mockReturnValue({
        defaultAgentId: 'agent-1',
        agentMappings: {
          'conv-special': 'agent-2',
        },
      });

      const session = getUserSession('user-new', 'conv-special');
      expect(session.currentAgentId).toBe('agent-2');
      expect(session.conversationId).toBe('conv-special');
    });

    it('should fallback to default agent when conversationId has no mapping', () => {
      getDingtalkConfig.mockReturnValue({
        defaultAgentId: 'agent-1',
        agentMappings: {
          'conv-special': 'agent-2',
        },
      });

      const session = getUserSession('user-new', 'conv-other');
      expect(session.currentAgentId).toBe('agent-1');
    });

    it('should update agent when conversationId mapping changes', () => {
      getDingtalkConfig.mockReturnValue({
        defaultAgentId: 'agent-1',
        agentMappings: {
          'conv-123': 'agent-2',
        },
      });

      // First create session without conversationId
      const session1 = getUserSession('user-update');
      expect(session1.currentAgentId).toBe('agent-1');

      // Then get session with conversationId that has mapping
      const session2 = getUserSession('user-update', 'conv-123');
      expect(session2.currentAgentId).toBe('agent-2');
      expect(session2.conversationId).toBe('conv-123');
    });
  });

  describe('handleCommand (via processDingtalkMessage)', () => {
    it('should handle "帮助" command', async () => {
      const result = await processDingtalkMessage({
        userId: 'user-1',
        userName: 'Test User',
        content: '帮助',
      });

      expect(result.success).toBe(true);
      expect(result.isCommand).toBe(true);
      expect(result.response).toContain('大数据智能运维平台');
      expect(result.response).toContain('切换智能体');
    });

    it('should handle "help" command', async () => {
      const result = await processDingtalkMessage({
        userId: 'user-2',
        userName: 'Test User',
        content: 'help',
      });

      expect(result.success).toBe(true);
      expect(result.isCommand).toBe(true);
      expect(result.response).toContain('大数据智能运维平台');
    });

    it('should handle "智能体列表" command', async () => {
      const result = await processDingtalkMessage({
        userId: 'user-1',
        userName: 'Test User',
        content: '智能体列表',
      });

      expect(result.success).toBe(true);
      expect(result.isCommand).toBe(true);
      expect(result.response).toContain('可用智能体列表');
      expect(result.response).toContain('运维助手');
      expect(result.response).toContain('数据分析');
    });

    it('should handle "agents" command', async () => {
      const result = await processDingtalkMessage({
        userId: 'user-1',
        userName: 'Test User',
        content: 'agents',
      });

      expect(result.success).toBe(true);
      expect(result.isCommand).toBe(true);
      expect(result.response).toContain('可用智能体列表');
    });

    it('should handle "切换智能体" command with valid agent', async () => {
      const result = await processDingtalkMessage({
        userId: 'user-1',
        userName: 'Test User',
        content: '切换智能体 数据分析',
      });

      expect(result.success).toBe(true);
      expect(result.isCommand).toBe(true);
      expect(result.response).toContain('已切换到智能体：数据分析');
    });

    it('should handle "切换智能体" command with invalid agent', async () => {
      const result = await processDingtalkMessage({
        userId: 'user-1',
        userName: 'Test User',
        content: '切换智能体 不存在的智能体',
      });

      expect(result.success).toBe(true);
      expect(result.isCommand).toBe(true);
      expect(result.response).toContain('未找到智能体');
      expect(result.response).toContain('智能体列表');
    });

    it('should handle case-insensitive agent switching', async () => {
      const result = await processDingtalkMessage({
        userId: 'user-1',
        userName: 'Test User',
        content: '切换智能体 运维助手',
      });

      expect(result.success).toBe(true);
      expect(result.response).toContain('已切换到智能体：运维助手');
    });
  });

  describe('processDingtalkMessage', () => {
    it('should process normal message with chat handler', async () => {
      handleChat.mockResolvedValue({
        response: '这是AI的回复',
        data: { some: 'data' },
        steps: [{ step: 1 }],
      });

      const result = await processDingtalkMessage({
        userId: 'user-1',
        userName: 'Test User',
        content: '查询集群状态',
      });

      expect(result.success).toBe(true);
      expect(result.response).toBe('这是AI的回复');
      expect(result.agentId).toBe('agent-1');
      expect(result.data).toEqual({ some: 'data' });
      expect(result.steps).toBeDefined();

      expect(handleChat).toHaveBeenCalledWith('agent-1', '查询集群状态');
    });

    it('should handle missing agentId', async () => {
      getDingtalkConfig.mockReturnValue({
        enabled: true,
        defaultAgentId: '',
      });

      const result = await processDingtalkMessage({
        userId: 'user-1',
        userName: 'Test User',
        content: '查询集群状态',
      });

      expect(result.success).toBe(false);
      expect(result.response).toContain('未配置默认智能体');
      expect(result.agentId).toBeNull();
    });

    it('should handle chat handler errors', async () => {
      handleChat.mockRejectedValue(new Error('Chat failed'));

      const result = await processDingtalkMessage({
        userId: 'user-1',
        userName: 'Test User',
        content: '查询集群状态',
      });

      expect(result.success).toBe(false);
      expect(result.response).toContain('处理失败：Chat failed');
      expect(result.agentId).toBe('agent-1');
    });

    it('should increment message count in session', async () => {
      handleChat.mockResolvedValue({ response: 'ok' });

      const userId = 'user-msg-count';
      const session1 = getUserSession(userId);
      const initialCount = session1.messageCount;

      await processDingtalkMessage({
        userId,
        userName: 'Test',
        content: '消息1',
      });

      const session2 = getUserSession(userId);
      expect(session2.messageCount).toBe(initialCount + 1);
    });

    it('should use switched agent for subsequent messages', async () => {
      handleChat.mockResolvedValue({ response: 'ok' });

      // First switch agent
      await processDingtalkMessage({
        userId: 'user-switch',
        userName: 'Test',
        content: '切换智能体 数据分析',
      });

      // Then send normal message
      await processDingtalkMessage({
        userId: 'user-switch',
        userName: 'Test',
        content: '查询数据',
      });

      expect(handleChat).toHaveBeenCalledWith('agent-2', '查询数据');
    });

    it('should handle conversationId parameter', async () => {
      handleChat.mockResolvedValue({ response: 'ok' });

      await processDingtalkMessage({
        userId: 'user-conv',
        userName: 'Test',
        content: 'test',
        conversationId: 'conv-123',
      });

      expect(handleChat).toHaveBeenCalled();
    });

    it('should use mapped agent for conversationId', async () => {
      getDingtalkConfig.mockReturnValue({
        defaultAgentId: 'agent-1',
        agentMappings: {
          'conv-456': 'agent-2',
        },
      });

      handleChat.mockResolvedValue({ response: 'ok' });

      const result = await processDingtalkMessage({
        userId: 'user-mapping',
        userName: 'Test',
        content: '查询数据',
        conversationId: 'conv-456',
      });

      expect(result.success).toBe(true);
      expect(result.agentId).toBe('agent-2');
      expect(handleChat).toHaveBeenCalledWith('agent-2', '查询数据');
    });
  });

  describe('getStats', () => {
    it('should return statistics', () => {
      // Create some sessions
      getUserSession('stats-user-1');
      getUserSession('stats-user-2');

      const stats = getStats();

      expect(stats).toHaveProperty('activeSessions');
      expect(stats).toHaveProperty('totalMessages');
      expect(stats.activeSessions).toBeGreaterThanOrEqual(2);
      expect(typeof stats.totalMessages).toBe('number');
    });

    it('should count total messages across sessions', async () => {
      handleChat.mockResolvedValue({ response: 'ok' });

      await processDingtalkMessage({
        userId: 'msg-user-1',
        userName: 'Test',
        content: 'test',
      });

      await processDingtalkMessage({
        userId: 'msg-user-2',
        userName: 'Test',
        content: 'test',
      });

      const stats = getStats();
      expect(stats.totalMessages).toBeGreaterThanOrEqual(2);
    });
  });
});