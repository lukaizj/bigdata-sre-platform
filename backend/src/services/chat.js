const Agent = require('../models/agent');
const Skill = require('../models/skill');
const { identifySkills, generateResponse } = require('./glm');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../models');
const path = require('path');
const fs = require('fs');

const MAX_AI_RECORDS = 50;
const MAX_DB_DATA_SIZE = 10000;

// 技能执行器映射 - 动态加载
const skillExecutors = {};

// 内置技能目录
const internalSkillsDir = path.join(__dirname, '../../skills');
const internalSkillNames = ['hdfs-query', 'yarn-query', 'spark-query', 'ambari-manage', 'cluster-health', 'data-visualization'];

for (const name of internalSkillNames) {
  try {
    skillExecutors[name] = require(path.join(internalSkillsDir, name));
  } catch (e) {
    console.warn(`Failed to load internal skill: ${name}`, e.message);
  }
}

// 外部技能目录 - /root/.agents/skills (只加载有 execute 函数的技能)
const externalSkillsDir = '/root/.agents/skills';
if (fs.existsSync(externalSkillsDir)) {
  const externalSkills = fs.readdirSync(externalSkillsDir).filter(f => {
    const skillPath = path.join(externalSkillsDir, f);
    return fs.statSync(skillPath).isDirectory() && fs.existsSync(path.join(skillPath, 'index.js'));
  });

  for (const name of externalSkills) {
    try {
      const skillModule = require(path.join(externalSkillsDir, name, 'index.js'));
      // 只加载有 execute 函数的技能，跳过 CLI 工具（exec 属性）
      if (skillModule.execute && typeof skillModule.execute === 'function') {
        skillExecutors[name] = skillModule;
        console.log(`Loaded external skill: ${name}`);
      } else if (skillModule.exec) {
        console.log(`Skipping CLI tool: ${name} (use HTTP API instead)`);
      }
    } catch (e) {
      console.warn(`Failed to load external skill: ${name}`, e.message);
    }
  }
}

// 获取集群配置
const { getClusterConfig, getSparkHistoryUrl, getAIConfig } = require('../routes/settings');

/**
 * 获取技能执行配置
 */
function getSkillConfig(skillId) {
  const config = {};

  // Spark 查询技能需要 Spark History Server URL
  if (skillId === 'spark-query') {
    const sparkUrl = getSparkHistoryUrl();
    console.log(`[Skill Config] spark-query endpoint: ${sparkUrl}`);
    config.endpoint = sparkUrl;
  }

  // HDFS/YARN 查询需要集群配置
  if (skillId === 'hdfs-query' || skillId === 'yarn-query') {
    const clusterConfig = getClusterConfig();
    if (clusterConfig?.hadoop) {
      config.namenodeUrl = clusterConfig.hadoop.namenodeUrl;
      config.yarnUrl = clusterConfig.hadoop.yarnUrl;
    }
  }

  return config;
}

/**
 * 处理对话消息
 * @param {string} agentId - 智能体 ID
 * @param {string} message - 用户消息
 * @returns {Promise<{response: string, data: any, process: Array}>}
 */
async function handleChat(agentId, message) {
  const executionSteps = [];

  // 获取智能体
  const agent = await Agent.getById(agentId);
  if (!agent) {
    return { response: '智能体不存在', data: null, steps: [] };
  }

  executionSteps.push({
    step: '思考',
    content: `正在分析您的问题...`,
    status: 'running'
  });

  // 获取智能体关联的技能
  const agentSkills = await Skill.getByIds(agent.skills);

  if (agentSkills.length === 0) {
    return {
      response: '该智能体没有配置任何技能，请先在智能体管理中为智能体配置技能。',
      data: null,
      steps: executionSteps
    };
  }

  executionSteps.push({
    step: '技能识别',
    content: `可用技能: ${agentSkills.map(s => s.name).join(', ')}`,
    status: 'success'
  });

  // 识别用户想要使用的技能
  const skillIds = await identifySkills(message, agentSkills);

  if (skillIds.length === 0) {
    executionSteps.push({
      step: '意图识别',
      content: '未能识别具体意图',
      status: 'warning'
    });
    return {
      response: `无法识别您的意图。请尝试更具体的描述，例如：\n• "查一下 HDFS 磁盘使用情况"\n• "YARN 集群资源状态"\n• "列出 Spark 应用"\n• "检查集群健康"`,
      data: null,
      steps: executionSteps
    };
  }

  const matchedSkills = skillIds.map(id => agentSkills.find(s => s.id === id)?.name || id).join(', ');
  executionSteps.push({
    step: '意图识别',
    content: `匹配到技能: ${matchedSkills}`,
    status: 'success'
  });

  // 按顺序执行技能
  let lastResult = null;
  let response = '';

  for (let i = 0; i < skillIds.length; i++) {
    const skillId = skillIds[i];
    const skill = agentSkills.find(s => s.id === skillId);
    const executor = skillExecutors[skillId];

    if (!executor) {
      console.warn(`Skill executor not found: ${skillId}`);
      executionSteps.push({
        step: `执行 ${skill?.name || skillId}`,
        content: '技能执行器未找到',
        status: 'error'
      });
      continue;
    }

    executionSteps.push({
      step: `执行 ${skill?.name || skillId}`,
      content: '正在执行...',
      status: 'running'
    });

    try {
      // 获取技能特定的配置
      const skillConfig = { ...skill?.config, ...getSkillConfig(skillId) };
      const result = await executor.execute(message, skillConfig, lastResult);

      if (result.error) {
        executionSteps[executionSteps.length - 1].status = 'error';
        executionSteps[executionSteps.length - 1].content = result.error;
        return { response: result.error, data: null, steps: executionSteps };
      }

      executionSteps[executionSteps.length - 1].status = 'success';
      executionSteps[executionSteps.length - 1].content = result.summary || '执行完成';

      // 如果是最后一个技能，生成最终回复
      if (i === skillIds.length - 1) {
        executionSteps.push({
          step: '生成回复',
          content: '正在整理结果...',
          status: 'running'
        });

        // 截断数据避免 AI API 超载
        let dataForAI = result.data;
        if (Array.isArray(dataForAI) && dataForAI.length > MAX_AI_RECORDS) {
          dataForAI = dataForAI.slice(0, MAX_AI_RECORDS);
        }

        response = await generateResponse(message, dataForAI, agentSkills);
        lastResult = result.data;

        executionSteps[executionSteps.length - 1].status = 'success';
        executionSteps[executionSteps.length - 1].content = '回复生成完成';
      } else {
        lastResult = result.data;
      }
    } catch (err) {
      console.error(`Skill execution failed: ${skillId}`, err);
      executionSteps[executionSteps.length - 1].status = 'error';
      executionSteps[executionSteps.length - 1].content = `执行失败: ${err.message}`;
      return { response: `技能执行失败: ${err.message}`, data: null, steps: executionSteps };
    }
  }

  // 保存对话记录 (限制数据大小避免数据库包过大)
  const conversationId = uuidv4();
  const dataStr = JSON.stringify(lastResult);
  const dataToSave = dataStr.length > MAX_DB_DATA_SIZE ? null : dataStr;
  await query(
    'INSERT INTO conversations (id, agent_id, message, response, data) VALUES (?, ?, ?, ?, ?)',
    [conversationId, agentId, message, response, dataToSave]
  );

  return { response, data: lastResult, steps: executionSteps };
}

module.exports = {
  handleChat,
};