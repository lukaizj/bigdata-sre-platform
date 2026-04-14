const Agent = require('../models/agent');
const { handleChat } = require('./chat');
const { getDingtalkConfig } = require('../routes/settings');

// 内存存储用户会话状态
const userSessions = new Map();

// 会话过期时间（30分钟）
const SESSION_EXPIRE_MS = 30 * 60 * 1000;

// 定期清理过期会话（每5分钟）
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [id, session] of userSessions.entries()) {
    if (now - session.lastActivityAt > SESSION_EXPIRE_MS) {
      userSessions.delete(id);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`Cleaned ${cleaned} expired dingtalk sessions`);
  }
}, 5 * 60 * 1000);

function getUserSession(userId, conversationId = null) {
  const now = Date.now();

  // 清理过期会话（仅在会话数较多时执行）
  if (userSessions.size > 1000) {
    for (const [id, session] of userSessions.entries()) {
      if (now - session.lastActivityAt > SESSION_EXPIRE_MS) {
        userSessions.delete(id);
      }
    }
  }

  let session = userSessions.get(userId);
  if (!session) {
    const config = getDingtalkConfig();
    // 根据 conversationId 选择智能体
    let initialAgentId = config.defaultAgentId;
    if (conversationId && config.agentMappings && config.agentMappings[conversationId]) {
      initialAgentId = config.agentMappings[conversationId];
    }

    session = {
      userId,
      currentAgentId: initialAgentId,
      conversationId,
      lastActivityAt: now,
      messageCount: 0,
    };
    userSessions.set(userId, session);
  } else {
    session.lastActivityAt = now;
    // 如果提供了 conversationId，更新会话的conversationId并检查映射
    if (conversationId) {
      session.conversationId = conversationId;
      const config = getDingtalkConfig();
      if (config.agentMappings && config.agentMappings[conversationId]) {
        session.currentAgentId = config.agentMappings[conversationId];
      }
    }
  }

  return session;
}

async function handleCommand(content, session, agents) {
  const trimmed = content.trim().toLowerCase();

  if (trimmed === '帮助' || trimmed === 'help') {
    return {
      isCommand: true,
      response: await getHelpMessage(session, agents),
    };
  }

  if (trimmed === '智能体列表' || trimmed === 'agents') {
    const list = agents.map((a, i) => `${i + 1}. ${a.name} - ${a.description || '无描述'}`).join('\n');
    return {
      isCommand: true,
      response: `🤖 可用智能体列表：\n\n${list}\n\n发送"切换智能体 [名称]"来切换`,
    };
  }

  const switchMatch = trimmed.match(/^切换智能体\s+(.+)$/);
  if (switchMatch) {
    const agentName = switchMatch[1].trim();
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

async function getHelpMessage(session, agents) {
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

async function processDingtalkMessage(message) {
  const { userId, userName, content, conversationId } = message;

  const session = getUserSession(userId, conversationId);
  session.messageCount++;

  // 预加载智能体列表，避免重复查询
  const agents = await Agent.getAll();

  const commandResult = await handleCommand(content, session, agents);
  if (commandResult) {
    return {
      success: true,
      response: commandResult.response,
      agentId: session.currentAgentId,
      isCommand: true,
    };
  }

  if (!session.currentAgentId) {
    return {
      success: false,
      response: '⚠️ 未配置默认智能体\n\n请先在平台配置默认智能体，或发送"智能体列表"选择智能体。',
      agentId: null,
    };
  }

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
    console.error('Dingtalk message processing failed:', {
      userId: session.userId,
      agentId: session.currentAgentId,
      contentLength: content?.length,
      error: err.message,
    });
    return {
      success: false,
      response: '❌ 处理失败：' + err.message,
      agentId: session.currentAgentId,
    };
  }
}

function getStats() {
  return {
    activeSessions: userSessions.size,
    totalMessages: Array.from(userSessions.values()).reduce((sum, s) => sum + s.messageCount, 0),
  };
}

// 重置会话（用于测试）
function resetSessions() {
  userSessions.clear();
}

module.exports = {
  processDingtalkMessage,
  getStats,
  getUserSession,
  resetSessions,
};