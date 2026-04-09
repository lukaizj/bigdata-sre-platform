const Agent = require('../models/agent');
const Skill = require('../models/skill');
const { identifySkills, generateResponse } = require('./glm');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../models');
const path = require('path');
const fs = require('fs');
const { execSync, spawn } = require('child_process');

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

// 外部技能目录 - /root/.agents/skills
const externalSkillsDir = '/root/.agents/skills';
if (fs.existsSync(externalSkillsDir)) {
  const externalSkills = fs.readdirSync(externalSkillsDir).filter(f => {
    const skillPath = path.join(externalSkillsDir, f);
    return fs.statSync(skillPath).isDirectory() && fs.existsSync(path.join(skillPath, 'index.js'));
  });

  for (const name of externalSkills) {
    try {
      const skillModule = require(path.join(externalSkillsDir, name, 'index.js'));
      if (skillModule.exec) {
        // CLI 工具类型技能 - 创建执行器包装
        skillExecutors[name] = {
          execute: async (message, config, previousResult) => {
            return await executeCliSkill(name, skillModule.exec, message, config);
          }
        };
      } else if (skillModule.execute) {
        // 已有 execute 函数
        skillExecutors[name] = skillModule;
      } else {
        console.warn(`Skill ${name} has no exec or execute method`);
      }
      console.log(`Loaded external skill: ${name}`);
    } catch (e) {
      console.warn(`Failed to load external skill: ${name}`, e.message);
    }
  }
}

// 获取集群配置
const { getClusterConfig } = require('../routes/settings');

// CLI 技能执行器
async function executeCliSkill(skillId, execPath, message, config) {
  try {
    // 获取集群配置中的 Spark 地址
    const clusterConfig = getClusterConfig();
    const sparkUrl = clusterConfig?.spark?.historyUrl || 'http://localhost:18080';

    // 根据消息内容确定命令
    let cmdArgs = ['--json', '--server', sparkUrl];

    if (message.includes('应用') || message.includes('app') || message.includes('列出')) {
      cmdArgs.push('apps');
    } else if (message.includes('job') || message.includes('任务')) {
      cmdArgs.push('jobs');
    } else if (message.includes('stage')) {
      cmdArgs.push('stages');
    } else if (message.includes('executor') || message.includes('执行器')) {
      cmdArgs.push('executors', '--all');
    } else if (message.includes('sql')) {
      cmdArgs.push('sql');
    } else {
      // 默认列出应用
      cmdArgs.push('apps');
    }

    console.log(`Executing CLI skill: ${execPath} ${cmdArgs.join(' ')}`);

    // 执行命令
    const result = execSync(`${execPath} ${cmdArgs.join(' ')}`, {
      encoding: 'utf-8',
      timeout: 30000,
      maxBuffer: 10 * 1024 * 1024
    });

    const data = JSON.parse(result);

    return {
      data: data,
      summary: formatSparkData(data, message)
    };
  } catch (e) {
    console.error(`CLI skill execution failed:`, e.message);
    return { error: `执行失败: ${e.message}`, data: null };
  }
}

// 格式化 Spark 数据
function formatSparkData(data, message) {
  if (!data) return '无数据';

  if (Array.isArray(data)) {
    // 应用列表
    if (data[0] && data[0].id) {
      const apps = data.slice(0, 10); // 显示前10个
      let summary = `找到 ${data.length} 个 Spark 应用:\n`;
      for (const app of apps) {
        summary += `- ${app.name || app.id}: ${app.status || 'unknown'} (尝试次数: ${app.attempts?.length || 1})\n`;
      }
      return summary;
    }
    return `找到 ${data.length} 条记录`;
  }

  return JSON.stringify(data, null, 2).slice(0, 500);
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
  const allSkills = await Skill.getAll();
  const agentSkills = allSkills.filter(s => agent.skills.includes(s.id));

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
      const result = await executor.execute(message, skill?.config || {}, lastResult);

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

        response = await generateResponse(message, result.data, agentSkills);
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

  // 保存对话记录
  const conversationId = uuidv4();
  await query(
    'INSERT INTO conversations (id, agent_id, message, response, data) VALUES (?, ?, ?, ?, ?)',
    [conversationId, agentId, message, response, JSON.stringify(lastResult)]
  );

  return { response, data: lastResult, steps: executionSteps };
}

module.exports = {
  handleChat,
};