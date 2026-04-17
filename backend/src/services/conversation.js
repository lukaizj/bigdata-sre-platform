/**
 * 对话服务
 * 实现 AI 驱动的多轮对话，支持 Function Calling
 */

const axios = require('axios');
const config = require('../config');
const { TOOL_DEFINITIONS, TOOL_NAMES } = require('../tools/definitions');
const { executeToolCall } = require('../tools/executor');
const { getModels, getSparkHistoryUrl } = require('../routes/settings');

// 对话历史存储（内存 + 定期清理）
const conversations = new Map();
const SESSION_EXPIRE_MS = 30 * 60 * 1000;
const MAX_HISTORY_LENGTH = 20;
const MAX_TOOL_RESULT_LENGTH = 4000;

// 定期清理过期会话
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [id, session] of conversations.entries()) {
    if (session.lastActivity && now - session.lastActivity > SESSION_EXPIRE_MS) {
      conversations.delete(id);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`Cleaned ${cleaned} expired conversation sessions`);
  }
}, 5 * 60 * 1000);

/**
 * 获取对话历史
 */
function getHistory(sessionId) {
  if (!conversations.has(sessionId)) {
    conversations.set(sessionId, {
      messages: [],
      lastActivity: Date.now()
    });
  }
  const session = conversations.get(sessionId);
  session.lastActivity = Date.now();
  return session.messages;
}

/**
 * 清理历史，保持在限制范围内
 * 确保不会在 tool_calls/tool 序列中间截断
 */
function trimHistory(history) {
  if (history.length <= MAX_HISTORY_LENGTH) {
    return history;
  }
  // 单次遍历分离 system 和 conversation 消息
  const systemMessages = [];
  const conversationMessages = [];
  for (const msg of history) {
    if (msg.role === 'system') {
      systemMessages.push(msg);
    } else {
      conversationMessages.push(msg);
    }
  }
  let startIdx = conversationMessages.length - (MAX_HISTORY_LENGTH - systemMessages.length);
  if (startIdx < 0) startIdx = 0;

  // 确保不从 tool 消息或带 tool_calls 的 assistant 消息中间截断
  while (startIdx < conversationMessages.length) {
    const msg = conversationMessages[startIdx];
    if (msg.role === 'tool' || (msg.role === 'assistant' && msg.tool_calls)) {
      startIdx++;
    } else {
      break;
    }
  }

  return [...systemMessages, ...conversationMessages.slice(startIdx)];
}

/**
 * 调用 AI API（带工具支持）
 */
async function callAIWithTools(messages, tools, modelConfig) {
  const apiUrl = modelConfig.apiUrl || config.glm.apiUrl;
  const apiKey = modelConfig.apiKey || config.glm.apiKey;
  const modelName = modelConfig.model || config.glm.model;

  if (!apiKey) {
    throw new Error('AI API 未配置 API Key');
  }

  // 构建请求体
  const requestBody = {
    model: modelName,
    messages: messages.map(m => {
      // 处理 tool 角色的消息
      if (m.role === 'tool') {
        return {
          role: 'tool',
          tool_call_id: m.tool_call_id,
          content: m.content
        };
      }
      // 处理带 tool_calls 的 assistant 消息
      if (m.role === 'assistant' && m.tool_calls) {
        return {
          role: 'assistant',
          content: m.content || null,
          tool_calls: m.tool_calls
        };
      }
      return {
        role: m.role,
        content: m.content
      };
    }),
    tools: tools,
    tool_choice: 'auto'
  };

  const requestBodyStr = JSON.stringify(requestBody);
  console.log('[AI] Calling with tools:', JSON.stringify({
    model: modelName,
    messagesCount: messages.length,
    toolsCount: tools.length,
    requestBodySize: requestBodyStr.length
  }));

  let response;
  try {
    response = await axios.post(apiUrl, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      timeout: 60000
    });
  } catch (err) {
    // 记录 AI API 返回的详细错误信息
    if (err.response) {
      console.error('[AI] API error:', JSON.stringify({
        status: err.response.status,
        data: err.response.data,
        requestBodySize: requestBodyStr.length
      }));
    }
    throw err;
  }

  const choice = response.data.choices[0];

  console.log('[AI] Response:', JSON.stringify({
    finishReason: choice.finish_reason,
    hasToolCalls: !!choice.message.tool_calls,
    contentLength: choice.message.content?.length || 0
  }));

  return {
    content: choice.message.content || '',
    tool_calls: choice.message.tool_calls || null,
    finish_reason: choice.finish_reason
  };
}

/**
 * 加载设置
 */
async function loadSettings() {
  try {
    const { query } = require('../models');
    const rows = await query('SELECT * FROM settings');
    const settings = {};
    for (const row of rows) {
      try {
        settings[row.key] = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
      } catch (e) {
        settings[row.key] = row.value;
      }
    }
    return settings;
  } catch (err) {
    // 如果数据库不可用，使用默认配置
    return {
      clusters: [],
      sparkHistoryUrl: config.spark?.historyUrl
    };
  }
}

/**
 * 处理用户消息（核心函数）
 */
async function processMessage(sessionId, userMessage, agentId, modelId) {
  const steps = [];

  // 1. 获取历史
  const history = getHistory(sessionId);

  // 2. 加载设置（集群配置等）
  const settings = await loadSettings();

  // 3. 获取模型配置
  const models = getModels();
  let modelConfig = models.find(m => m.id === modelId) || models.find(m => m.isDefault) || {
    apiUrl: config.glm.apiUrl,
    apiKey: config.glm.apiKey,
    model: config.glm.model
  };

  // 4. 添加系统提示
  if (history.length === 0 || !history.some(m => m.role === 'system')) {
    const systemPrompt = buildSystemPrompt(settings);
    history.push({ role: 'system', content: systemPrompt });
  }

  // 5. 添加用户消息
  history.push({ role: 'user', content: userMessage });

  // 6. 调用 AI（带工具）
  steps.push({
    step: 'AI分析',
    content: '正在分析您的请求...',
    status: 'running'
  });

  let aiResponse;
  try {
    aiResponse = await callAIWithTools(trimHistory(history), TOOL_DEFINITIONS, modelConfig);
  } catch (err) {
    steps[0].status = 'error';
    steps[0].content = `AI调用失败: ${err.message}`;
    return {
      response: `AI 调用失败: ${err.message}`,
      steps,
      error: err.message
    };
  }

  steps[0].status = 'success';
  steps[0].content = aiResponse.tool_calls
    ? `识别到需要使用工具`
    : 'AI 直接回复';

  // 7. 处理 tool_calls 循环
  const maxToolIterations = 5; // 最多迭代5次工具调用
  let iteration = 0;

  while (aiResponse.tool_calls && iteration < maxToolIterations) {
    iteration++;

    // 记录 AI 的 tool_calls 消息
    history.push({
      role: 'assistant',
      content: aiResponse.content || '',
      tool_calls: aiResponse.tool_calls
    });

    // 执行每个工具调用
    for (const toolCall of aiResponse.tool_calls) {
      const toolName = toolCall.function.name;
      const toolArgs = JSON.parse(toolCall.function.arguments);

      steps.push({
        step: TOOL_NAMES[toolName] || toolName,
        content: `正在执行...`,
        status: 'running'
      });

      console.log(`[Tool] ${toolName} with args:`, JSON.stringify(toolArgs));

      // 执行工具
      const toolResult = await executeToolCall(toolName, toolArgs, settings);

      // 更新步骤状态
      const stepIndex = steps.length - 1;
      if (toolResult.error) {
        steps[stepIndex].status = 'error';
        steps[stepIndex].content = toolResult.error;
      } else {
        steps[stepIndex].status = 'success';
        steps[stepIndex].content = toolResult.summary || '执行完成';
      }

      // 添加工具结果到历史（截断过大的内容避免超出 AI token 限制）
      const originalStr = JSON.stringify(toolResult);
      let toolContent = originalStr;
      if (originalStr.length > MAX_TOOL_RESULT_LENGTH) {
        // 构建截断对象，只 stringify 一次
        const truncated = {
          summary: toolResult.summary || '执行完成',
          _truncated: true,
          _originalSize: originalStr.length
        };
        // 如果有 data 且大小可控，尝试保留
        if (toolResult.data !== undefined) {
          truncated.data = toolResult.data;
        }
        const truncatedStr = JSON.stringify(truncated);
        // 如果带 data 还是太大，去掉 data 只保留 summary
        toolContent = truncatedStr.length <= MAX_TOOL_RESULT_LENGTH
          ? truncatedStr
          : JSON.stringify({
              summary: toolResult.summary || '执行完成',
              _truncated: true,
              _originalSize: originalStr.length
            });
      }
      history.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: toolContent
      });
    }

    // 再次调用 AI，让它处理工具结果
    steps.push({
      step: 'AI处理结果',
      content: '正在综合分析工具返回结果...',
      status: 'running'
    });

    try {
      aiResponse = await callAIWithTools(trimHistory(history), TOOL_DEFINITIONS, modelConfig);
      steps[steps.length - 1].status = 'success';
      steps[steps.length - 1].content = aiResponse.tool_calls
        ? '需要继续调用工具'
        : '生成最终回复';
    } catch (err) {
      steps[steps.length - 1].status = 'error';
      steps[steps.length - 1].content = `AI调用失败: ${err.message}`;
      return {
        response: `处理工具结果时 AI 调用失败: ${err.message}`,
        steps,
        error: err.message
      };
    }
  }

  if (iteration >= maxToolIterations && aiResponse.tool_calls) {
    steps.push({
      step: '警告',
      content: '达到最大工具调用次数限制',
      status: 'warning'
    });
  }

  // 8. 保存最终回复到历史
  history.push({ role: 'assistant', content: aiResponse.content });

  // 9. 返回结果
  return {
    response: aiResponse.content,
    steps,
    toolCallsUsed: iteration > 0
  };
}

/**
 * 构建系统提示
 */
function buildSystemPrompt(settings) {
  const clusterInfo = (settings.clusters || []).map(c => {
    return `- ${c.name} (${c.id}): ${c.environment}环境`;
  }).join('\n');

  return `你是一个大数据运维助手，帮助用户管理 HDFS、YARN、Spark 等大数据组件。

## 可用集群
${clusterInfo || '暂无集群配置'}

## 你的能力
1. 查询 HDFS 集群状态（NameNode状态、DataNode数量、存储使用）
2. 查询 YARN 资源状态（集群指标、应用列表、节点状态、队列信息）
3. 查询 Spark 应用（应用列表、详情、Job/Stage/Executor信息）
4. 集群健康检查（综合检查多个组件）
5. Ambari 服务管理（启停服务、查看状态）

## 使用工具的规则
1. 当用户提到集群名称时，使用对应的 cluster_id（如"测试集群"对应"test-cluster")
2. 如果用户没有指定集群，优先使用 test-cluster（测试集群）或询问用户
3. 工具调用后，根据返回结果给出清晰、专业的分析
4. 如果发现问题，提供可能的原因和建议

## 回复风格
- 使用中文
- 简洁明了，重点突出
- 发现异常时给出警示和建议
- 使用适当的格式（列表、表格等）展示数据`;
}

/**
 * 清除对话历史
 */
function clearHistory(sessionId) {
  if (conversations.has(sessionId)) {
    conversations.delete(sessionId);
    return true;
  }
  return false;
}

/**
 * 获取会话统计
 */
function getStats() {
  return {
    activeSessions: conversations.size,
    totalMessages: Array.from(conversations.values())
      .reduce((sum, s) => sum + s.messages.length, 0)
  };
}

module.exports = {
  processMessage,
  getHistory,
  clearHistory,
  getStats,
  callAIWithTools
};