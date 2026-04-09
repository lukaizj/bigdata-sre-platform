const axios = require('axios');
const config = require('../config');

/**
 * 调用 AI API（支持模型选择）
 * @param {Array} messages - 消息列表 [{role: 'system'|'user'|'assistant', content: string}]
 * @returns {Promise<string>} - 模型回复
 */
async function callGLM(messages) {
  // 支持临时模型配置（通过环境变量传递）
  const apiUrl = process.env.TEMP_MODEL_API_URL || config.glm.apiUrl;
  const apiKey = process.env.TEMP_MODEL_API_KEY || config.glm.apiKey;
  const model = process.env.TEMP_MODEL_NAME || config.glm.model;

  // 清理临时环境变量
  delete process.env.TEMP_MODEL_API_URL;
  delete process.env.TEMP_MODEL_API_KEY;
  delete process.env.TEMP_MODEL_NAME;

  if (!apiKey) {
    throw new Error('AI API 未配置 API Key');
  }

  try {
    const response = await axios.post(
      apiUrl,
      {
        model: model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        timeout: 60000,
      }
    );

    return response.data.choices[0].message.content;
  } catch (err) {
    console.error('AI API call failed:', err.response?.data || err.message);
    throw new Error(`AI API 调用失败: ${err.response?.data?.error?.message || err.message}`);
  }
}

/**
 * 识别用户意图，匹配技能
 * @param {string} message - 用户消息
 * @param {Array} availableSkills - 可用技能列表
 * @returns {Promise<string[]>} - 匹配的技能 ID 列表
 */
async function identifySkills(message, availableSkills) {
  // 先尝试关键词匹配（快速且不依赖 API）
  const keywordMatches = matchSkillsByKeywords(message, availableSkills);
  if (keywordMatches.length > 0) {
    return keywordMatches;
  }

  // 如果关键词匹配失败，尝试 AI 识别
  const { getAIConfig } = require('../routes/settings');
  const aiConfig = getAIConfig();
  if (!aiConfig.enabled) {
    return [];
  }

  const skillDescriptions = availableSkills
    .map(s => `- ${s.name} (ID: ${s.id}): ${s.description}`)
    .join('\n');

  const systemPrompt = `你是一个智能助手，需要根据用户的请求识别他们想要使用哪些技能。

可用的技能列表：
${skillDescriptions}

请仔细分析用户的请求，判断用户想要使用哪些技能。用户可能需要：
1. 先查询数据（如 hdfs-query、yarn-query、spark-query）
2. 然后将结果可视化（data-visualization）

返回格式：
- 如果只需要一个技能，返回单个技能ID（例如：hdfs-query）
- 如果需要多个技能，用逗号分隔返回（例如：yarn-query,data-visualization）
- 如果无法确定，返回空字符串

只返回技能ID，不要返回其他内容。`;

  try {
    const reply = await callGLM([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message },
    ]);

    const skillIds = reply
      .split(',')
      .map(s => s.trim())
      .filter(s => s && availableSkills.some(skill => skill.id === s));

    // 去重
    return [...new Set(skillIds)];
  } catch (err) {
    console.error('Failed to identify skills:', err);
    return [];
  }
}

/**
 * 通过关键词匹配技能
 */
function matchSkillsByKeywords(message, availableSkills) {
  const lower = message.toLowerCase();
  const matches = [];

  // 关键词映射 - 更全面的关键词
  const keywordMap = {
    'hdfs-query': [
      'hdfs', 'namenode', 'datanode', 'hadoop存储', '文件系统', '块', '副本', '目录', 'dfs',
      '磁盘', '存储使用', '空间', 'hadoop状态', 'hadoop集群', 'hdfs状态', 'hdfs使用',
      'namenode状态', 'datanode状态', 'hdfs健康', 'hdfs容量', '存储容量'
    ],
    'yarn-query': [
      'yarn', 'resourcemanager', 'nodemanager', '容器', 'application', '队列', '资源', 'job',
      'yarn状态', 'yarn资源', 'yarn集群', '资源使用', '内存使用', 'cpu使用', '核数',
      '运行中的应用', 'yarn应用', '任务状态', 'nodemanager状态', '队列资源', '资源分配'
    ],
    'spark-query': [
      'spark', 'executor', 'driver', 'rdd', 'dataframe', 'dataset', 'sparksql',
      'spark应用', 'spark任务', 'spark job', 'spark状态', 'spark executor',
      'spark history', 'shs', 'application', 'spark应用详情', 'spark分析'
    ],
    'spark-history-cli': [
      'spark', 'shs', 'spark history', 'spark应用', 'spark任务', 'history server',
      'executor', 'driver', 'spark job', 'spark stage', 'spark详情', 'application_'
    ],
    'ambari-api': [
      'ambari', 'hdp', '服务启停', '服务状态', '组件', '主机状态', 'ambari服务',
      '集群服务', '服务管理', 'ambari主机', 'ambari状态'
    ],
    'ambari-manage': [
      'ambari', '集群管理', '服务管理', '启停服务', '重启服务', 'ambari操作'
    ],
    'cluster-health': [
      '健康', '健康检查', '集群状态', '集群检查', '整体状态', '全面检查',
      '集群健康', '检查集群', '状态检查', '诊断集群', '集群诊断'
    ],
    'data-visualization': [
      '图表', '可视化', '绘图', 'echarts', '展示', '画图', '生成图表', '数据图',
      '柱状图', '折线图', '饼图', '展示图'
    ],
    'hadoop-cluster-diagnose': [
      '诊断', '排查', '问题', '异常', '错误日志', '故障', '报错', '失败'
    ],
  };

  for (const skill of availableSkills) {
    const keywords = keywordMap[skill.id] || [];
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        matches.push(skill.id);
        break;
      }
    }
  }

  // 如果没有匹配，尝试使用一些通用规则
  if (matches.length === 0) {
    // "查一下"、"看一下"、"列出" 等通用查询词
    if (lower.includes('查') || lower.includes('看') || lower.includes('列出') || lower.includes('获取') || lower.includes('显示')) {
      // 根据上下文推断
      if (lower.includes('集群') && !lower.includes('spark') && !lower.includes('yarn') && !lower.includes('hdfs')) {
        // 通用的集群查询，返回健康检查
        const healthSkill = availableSkills.find(s => s.id === 'cluster-health');
        if (healthSkill) matches.push('cluster-health');
      }
    }
  }

  return [...new Set(matches)];
}

/**
 * 生成智能体回复
 * @param {string} message - 用户消息
 * @param {object} data - 技能执行结果
 * @param {Array} skills - 技能列表
 * @returns {Promise<string>} - 生成的回复
 */
async function generateResponse(message, data, skills) {
  if (!config.glm.enabled) {
    return JSON.stringify(data, null, 2);
  }

  const systemPrompt = `你是一个大数据运维助手，需要根据用户的问题和查询结果，给出专业、友好的回复。
回复要求：
1. 使用中文
2. 简洁明了
3. 如果是错误信息，给出可能的原因和解决建议
4. 如果是数据结果，用通俗语言解释数据的含义`;

  try {
    const reply = await callGLM([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `用户问题: ${message}\n\n查询结果: ${JSON.stringify(data, null, 2)}` },
    ]);
    return reply;
  } catch (err) {
    console.error('Failed to generate response:', err);
    return JSON.stringify(data, null, 2);
  }
}

module.exports = {
  callGLM,
  identifySkills,
  generateResponse,
};