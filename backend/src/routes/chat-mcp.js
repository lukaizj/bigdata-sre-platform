const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../models');
const Agent = require('../models/agent');
const Skill = require('../models/skill');
const { identifySkills, generateResponse } = require('../services/glm');
const { executeMCP, parseMCPIntent } = require('../services/mcp');
const { getClusterConfig, getModels, getSparkHistoryUrl } = require('./settings');
const { formatBytes } = require('../utils/format');
const config = require('../config');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// 技能目录列表
const SKILLS_DIRS = [
  '/root/.agents/skills',
  path.join(__dirname, '../../skills'),
];

// 内置 Node.js 执行器
const builtinExecutors = {
  'hdfs-query': require('../../skills/hdfs-query/index'),
  'yarn-query': require('../../skills/yarn-query/index'),
  'spark-query': require('../../skills/spark-query/index'),
  'ambari-manage': require('../../skills/ambari-manage/index'),
  'cluster-health': require('../../skills/cluster-health/index'),
  'data-visualization': require('../../skills/data-visualization/index'),
};

// 动态加载技能执行器
async function loadSkillExecutor(skillId) {
  // 1. 检查内置执行器
  if (builtinExecutors[skillId]) {
    return { type: 'node', executor: builtinExecutors[skillId] };
  }

  // 2. 查找技能目录
  for (const skillsDir of SKILLS_DIRS) {
    const skillDir = path.join(skillsDir, skillId);

    // 检查 Node.js 执行器
    const nodeExecutor = path.join(skillDir, 'index.js');
    if (fs.existsSync(nodeExecutor)) {
      try {
        const executor = require(nodeExecutor);
        // 如果有 execute 函数，使用 node 类型
        if (executor.execute) {
          return { type: 'node', executor, path: skillDir };
        }
        // 如果有 exec 属性（CLI 工具路径），使用 cli 类型
        if (executor.exec) {
          return { type: 'cli', execPath: executor.exec, path: skillDir };
        }
      } catch (e) {
        console.warn(`Failed to load Node executor for ${skillId}:`, e.message);
      }
    }

    // 检查 Python 脚本
    const scriptsDir = path.join(skillDir, 'scripts');
    if (fs.existsSync(scriptsDir)) {
      const scripts = fs.readdirSync(scriptsDir).filter(f => f.endsWith('.py'));
      if (scripts.length > 0) {
        return { type: 'python', path: skillDir, scripts };
      }
    }

    // 检查 Shell 脚本
    const binDir = path.join(skillDir, 'bin');
    if (fs.existsSync(binDir)) {
      const scripts = fs.readdirSync(binDir).filter(f => !f.startsWith('.'));
      if (scripts.length > 0) {
        return { type: 'shell', path: skillDir, scripts };
      }
    }
  }

  return null;
}

// 执行 Python 技能
async function executePythonSkill(skillDir, message, skillConfig) {
  const scriptsDir = path.join(skillDir, 'scripts');
  const mainScript = path.join(scriptsDir, 'ambari_api.py');

  // 读取技能目录下的 config.json
  const configPath = path.join(skillDir, 'config.json');
  let clusters = {};
  try {
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf-8');
      const configData = JSON.parse(configContent);
      clusters = configData.clusters || {};
    }
  } catch (e) {
    console.warn('Failed to read skill config.json:', e.message);
  }

  // 解析消息意图
  const intent = parseIntentFromMessage(message, clusters);

  // 获取配置名（如果没有指定，使用第一个配置）
  const configName = intent.config || Object.keys(clusters)[0] || 'default';

  try {
    let cmd = `python3 ${mainScript}`;

    // 如果需要集群名但没有指定，先获取集群列表
    let clusterName = intent.cluster;
    if ((intent.action === 'hosts' || intent.action === 'services' ||
         intent.action === 'components' || intent.action === 'start' ||
         intent.action === 'stop' || intent.action === 'restart' || intent.action === 'status')
        && !clusterName) {
      // 获取第一个集群名
      const listCmd = `python3 ${mainScript} clusters --config ${configName}`;
      const { stdout } = await execAsync(listCmd, { timeout: 10000, cwd: skillDir });
      const match = stdout.match(/-\s+(\S+)/);
      if (match) {
        clusterName = match[1];
      }
    }

    // 根据 intent 构建命令
    if (intent.action === 'hosts') {
      cmd += ` hosts --config ${configName} --cluster ${clusterName}`;
    } else if (intent.action === 'services' || intent.action === 'status') {
      cmd += ` services --config ${configName} --cluster ${clusterName}`;
    } else if (intent.action === 'start' || intent.action === 'stop' || intent.action === 'restart') {
      cmd += ` services --config ${configName} --cluster ${clusterName}`;
      if (intent.service) cmd += ` --service ${intent.service}`;
      cmd += ` --action ${intent.action.toUpperCase()}`;
    } else if (intent.action === 'components') {
      cmd += ` components --config ${configName} --cluster ${clusterName}`;
      if (intent.host) cmd += ` --host ${intent.host}`;
    } else {
      // 默认列出集群
      cmd += ` clusters --config ${configName}`;
    }

    console.log('Executing:', cmd);

    const { stdout, stderr } = await execAsync(cmd, {
      timeout: 30000,
      cwd: skillDir,
    });

    // 过滤掉 warning 信息
    const output = stdout.replace(/.*RequestsDependencyWarning.*\n/g, '')
                         .replace(/.*warnings\.warn.*\n/g, '');

    if (stderr && !output) {
      const cleanStderr = stderr.replace(/.*RequestsDependencyWarning.*\n/g, '')
                                .replace(/.*warnings\.warn.*\n/g, '');
      return { error: cleanStderr };
    }

    return { data: parseOutput(output) };
  } catch (e) {
    const cleanError = e.message.replace(/.*RequestsDependencyWarning.*\n/g, '')
                                .replace(/.*warnings\.warn.*\n/g, '');
    return { error: cleanError };
  }
}

// 执行 CLI 工具技能（如 spark-history-cli）
async function executeCliSkill(execPath, skillId, message, skillConfig) {
  try {
    // 构建 CLI 命令参数
    let cmdArgs = ['--json'];

    // 根据技能类型添加服务器地址
    if (skillId === 'spark-history-cli') {
      // 使用全局 Spark History URL
      const sparkUrl = getSparkHistoryUrl() || skillConfig?.endpoint || 'http://localhost:18080';
      console.log('Using Spark URL:', sparkUrl);
      cmdArgs.push('--server', sparkUrl);

      // 解析消息中的应用 ID
      const appIdMatch = message.match(/application[_\s]?\d+[_\s]?\d+/i);
      const appId = appIdMatch ? appIdMatch[0].replace(/[_\s]/g, '_') : null;

      // 根据消息内容确定命令
      const lower = message.toLowerCase();

      if (appId) {
        // 如果指定了应用 ID，查询该应用详情
        // 先获取应用基本信息
        const appCmd = `${execPath} --json --server ${sparkUrl} app ${appId}`;
        const { stdout: appStdout } = await execAsync(appCmd, { timeout: 30000 });
        const appData = JSON.parse(appStdout);

        // 如果请求详情或优化建议，获取更多数据
        if (lower.includes('优化') || lower.includes('建议') || lower.includes('详情') || lower.includes('详细')) {
          const jobsCmd = `${execPath} --json --server ${sparkUrl} -a ${appId} jobs`;
          const executorsCmd = `${execPath} --json --server ${sparkUrl} -a ${appId} executors`;
          const stagesCmd = `${execPath} --json --server ${sparkUrl} -a ${appId} stages`;

          const [jobsResult, executorsResult, stagesResult] = await Promise.allSettled([
            execAsync(jobsCmd, { timeout: 30000 }),
            execAsync(executorsCmd, { timeout: 30000 }),
            execAsync(stagesCmd, { timeout: 30000 }),
          ]);

          const fullData = {
            application: appData,
            jobs: jobsResult.status === 'fulfilled' ? JSON.parse(jobsResult.value.stdout) : [],
            executors: executorsResult.status === 'fulfilled' ? JSON.parse(executorsResult.value.stdout) : [],
            stages: stagesResult.status === 'fulfilled' ? JSON.parse(stagesResult.value.stdout) : [],
          };

          // 生成详细的分析报告
          const summary = generateSparkAnalysis(fullData, message);
          return { data: fullData, summary };
        }

        return { data: appData, summary: formatSparkData(appData, message) };
      } else if (lower.includes('应用') || lower.includes('app') || lower.includes('列出') || lower.includes('列表')) {
        cmdArgs.push('apps');
      } else if (lower.includes('job') || lower.includes('任务') || lower.includes('作业')) {
        cmdArgs.push('jobs');
      } else if (lower.includes('stage') || lower.includes('阶段')) {
        cmdArgs.push('stages');
      } else if (lower.includes('executor') || lower.includes('执行器')) {
        cmdArgs.push('executors', '--all');
      } else if (lower.includes('sql')) {
        cmdArgs.push('sql');
      } else if (lower.includes('env') || lower.includes('环境') || lower.includes('配置')) {
        cmdArgs.push('env');
      } else {
        // 默认列出应用
        cmdArgs.push('apps');
      }
    }

    console.log(`Executing CLI skill: ${execPath} ${cmdArgs.join(' ')}`);

    const cmd = `${execPath} ${cmdArgs.join(' ')}`;
    const { stdout, stderr } = await execAsync(cmd, {
      timeout: 30000,
      maxBuffer: 50 * 1024 * 1024, // 50MB
    });

    if (stderr && !stdout) {
      return { error: stderr };
    }

    try {
      const data = JSON.parse(stdout);
      // 限制返回数据量
      const limitedData = Array.isArray(data) ? data.slice(0, 20) : data;
      return { data: limitedData, summary: formatSparkData(limitedData, message) };
    } catch (parseErr) {
      // 如果不是 JSON，直接返回文本
      return { data: stdout, summary: stdout.slice(0, 500) };
    }
  } catch (e) {
    console.error(`CLI skill execution failed:`, e.message);
    return { error: `执行失败: ${e.message}` };
  }
}

// 格式化 Spark 数据
function formatSparkData(data, message) {
  if (!data) return '无数据';

  if (Array.isArray(data)) {
    if (data[0] && data[0].id) {
      const total = data.length;
      let summary = `找到 ${total} 个 Spark 应用，显示前 20 个:\n\n`;
      for (const app of data) {
        const attempt = app.attempts?.[0];
        const status = attempt?.completed ? '✅ 已完成' : '🔄 运行中';
        const duration = attempt?.duration ? Math.round(attempt.duration / 1000) + '秒' : '未知';
        summary += `**${app.name || app.id}**\n`;
        summary += `- ID: ${app.id}\n`;
        summary += `- 状态: ${status}\n`;
        summary += `- 耗时: ${duration}\n`;
        if (attempt?.startTime) {
          summary += `- 开始: ${new Date(attempt.startTime).toLocaleString('zh-CN')}\n`;
        }
        summary += '\n';
      }
      return summary;
    }
    return `找到 ${data.length} 条记录`;
  }

  if (data.id) {
    // 单个应用详情
    const attempt = data.attempts?.[0];
    const status = attempt?.completed ? '✅ 已完成' : '🔄 运行中';
    const duration = attempt?.duration ? Math.round(attempt.duration / 1000) + '秒' : '未知';
    return `**应用: ${data.name || data.id}**
- ID: ${data.id}
- 状态: ${status}
- 耗时: ${duration}
- 用户: ${attempt?.sparkUser || '未知'}
- Spark 版本: ${attempt?.appSparkVersion || '未知'}`;
  }

  return JSON.stringify(data, null, 2).slice(0, 1000);
}

// 生成 Spark 应用分析报告
function generateSparkAnalysis(data, message) {
  const { application, jobs, executors, stages } = data;
  const attempt = application?.attempts?.[0];

  // 解析时间
  const startTime = attempt?.startTimeEpoch ? new Date(attempt.startTimeEpoch) :
                    attempt?.startTime ? new Date(attempt.startTime.replace('GMT', 'Z')) : null;
  const endTime = attempt?.endTimeEpoch ? new Date(attempt.endTimeEpoch) :
                  attempt?.endTime ? new Date(attempt.endTime.replace('GMT', 'Z')) : null;

  let report = `## Spark 应用详情分析\n\n`;
  report += `### 基本信息\n`;
  report += `- **应用ID**: ${application?.id}\n`;
  report += `- **应用名称**: ${application?.name}\n`;
  report += `- **状态**: ${attempt?.completed ? '✅ 已完成' : '🔄 运行中'}\n`;
  report += `- **执行用户**: ${attempt?.sparkUser || '未知'}\n`;
  report += `- **Spark版本**: ${attempt?.appSparkVersion || '未知'}\n`;
  report += `- **运行时长**: ${attempt?.duration ? Math.round(attempt.duration / 1000) + ' 秒' : '未知'}\n`;
  report += `- **开始时间**: ${startTime ? startTime.toLocaleString('zh-CN') : '未知'}\n`;
  report += `- **结束时间**: ${endTime ? endTime.toLocaleString('zh-CN') : '未知'}\n\n`;

  // Jobs 分析
  if (jobs && jobs.length > 0) {
    const completedJobs = jobs.filter(j => j.status === 'SUCCEEDED').length;
    const failedJobs = jobs.filter(j => j.status === 'FAILED').length;
    const runningJobs = jobs.filter(j => j.status === 'RUNNING').length;

    report += `### Jobs 概览\n`;
    report += `- **总Job数**: ${jobs.length}\n`;
    report += `- **成功**: ${completedJobs} 个\n`;
    report += `- **失败**: ${failedJobs} 个\n`;
    report += `- **运行中**: ${runningJobs} 个\n\n`;

    // Job 详情
    report += `#### Job 详情\n`;
    for (const job of jobs.slice(0, 10)) {
      report += `- Job ${job.jobId}: ${job.status}, ${job.numTasks} 任务, ${job.numStages} 阶段\n`;
    }
    report += '\n';
  }

  // Executors 分析
  if (executors && executors.length > 0) {
    const activeExecutors = executors.filter(e => e.isActive);
    const totalCores = activeExecutors.reduce((sum, e) => sum + (e.totalCores || 0), 0);
    const totalMemory = activeExecutors.reduce((sum, e) => sum + (e.memoryUsed || 0), 0);
    const totalInputBytes = executors.reduce((sum, e) => sum + (e.totalInputBytes || 0), 0);
    const totalShuffleRead = executors.reduce((sum, e) => sum + (e.totalShuffleRead || 0), 0);
    const totalShuffleWrite = executors.reduce((sum, e) => sum + (e.totalShuffleWrite || 0), 0);

    report += `### Executors 概览\n`;
    report += `- **活跃Executor数**: ${activeExecutors.length}\n`;
    report += `- **总核数**: ${totalCores}\n`;
    report += `- **已用内存**: ${formatBytes(totalMemory)}\n`;
    report += `- **输入数据量**: ${formatBytes(totalInputBytes)}\n`;
    report += `- **Shuffle读取**: ${formatBytes(totalShuffleRead)}\n`;
    report += `- **Shuffle写入**: ${formatBytes(totalShuffleWrite)}\n\n`;
  }

  // Stages 分析
  if (stages && stages.length > 0) {
    const failedStages = stages.filter(s => s.status === 'FAILED').length;
    const avgTaskTime = stages.reduce((sum, s) => sum + (s.executorRunTime || 0), 0) / stages.length;

    report += `### Stages 概览\n`;
    report += `- **总Stage数**: ${stages.length}\n`;
    report += `- **失败Stage数**: ${failedStages}\n`;
    report += `- **平均执行时间**: ${Math.round(avgTaskTime / 1000)} 秒\n\n`;

    // 找出耗时最长的 Stage
    const longestStages = [...stages].sort((a, b) => (b.executorRunTime || 0) - (a.executorRunTime || 0)).slice(0, 5);
    report += `#### 耗时最长的 Stage\n`;
    for (const stage of longestStages) {
      report += `- Stage ${stage.stageId}: ${Math.round((stage.executorRunTime || 0) / 1000)}秒, ${stage.numTasks} 任务, ${stage.status}\n`;
    }
    report += '\n';
  }

  // 优化建议
  report += `### 优化建议\n`;

  const suggestions = [];

  // 检查运行时间
  if (attempt?.duration && attempt.duration > 600000) { // 超过10分钟
    suggestions.push('- ⏱️ **运行时间较长**: 应用运行超过10分钟，建议检查是否有数据倾斜或资源不足问题');
  }

  // 检查失败Job
  if (jobs && jobs.filter(j => j.status === 'FAILED').length > 0) {
    suggestions.push('- ❌ **存在失败Job**: 有Job执行失败，请检查日志排查原因');
  }

  // 检查Shuffle数据量
  if (executors && executors.length > 0) {
    const totalShuffleRead = executors.reduce((sum, e) => sum + (e.totalShuffleRead || 0), 0);
    const totalShuffleWrite = executors.reduce((sum, e) => sum + (e.totalShuffleWrite || 0), 0);
    const shuffleRatio = totalShuffleRead + totalShuffleWrite;

    if (shuffleRatio > 1024 * 1024 * 1024 * 10) { // 超过10GB
      suggestions.push('- 🔄 **Shuffle数据量大**: Shuffle读写超过10GB，建议优化join/repartition操作或增加shuffle分区数');
    }
  }

  // 检查Executor数量
  if (executors && executors.filter(e => e.isActive).length < 3) {
    suggestions.push('- 📊 **Executor数量较少**: 活跃Executor较少，建议增加并行度以提升性能');
  }

  // 检查失败Stage
  if (stages && stages.filter(s => s.status === 'FAILED').length > 0) {
    suggestions.push('- ⚠️ **存在失败Stage**: 有Stage执行失败，建议检查失败原因并重试');
  }

  // 检查数据倾斜
  if (stages && stages.length > 0) {
    for (const stage of stages) {
      if (stage.maxTaskTime && stage.avgTaskTime && stage.maxTaskTime > stage.avgTaskTime * 3) {
        suggestions.push('- 📉 **可能存在数据倾斜**: 部分Stage中任务执行时间差异较大，建议检查分区键和数据分布');
        break;
      }
    }
  }

  if (suggestions.length === 0) {
    suggestions.push('- ✅ 应用执行正常，暂无明显优化建议');
  }

  report += suggestions.join('\n');

  return report;
}

// 执行 Shell 技能
async function executeShellSkill(skillDir, message, skillConfig) {
  const binDir = path.join(skillDir, 'bin');
  const intent = parseIntentFromMessage(message);

  try {
    // 查找匹配的脚本
    const scripts = fs.readdirSync(binDir).filter(f => !f.startsWith('.'));
    const script = scripts[0]; // 使用第一个脚本

    if (!script) {
      return { error: 'No executable script found' };
    }

    const scriptPath = path.join(binDir, script);
    const cmd = `${scriptPath} ${intent.args || ''}`;

    const { stdout, stderr } = await execAsync(cmd, {
      timeout: 30000,
      cwd: skillDir,
      env: { ...process.env, ...skillConfig },
    });

    return { data: parseOutput(stdout || stderr) };
  } catch (e) {
    return { error: e.message };
  }
}

// 从消息解析意图
function parseIntentFromMessage(message, clusters = {}) {
  const lower = message.toLowerCase();
  const intent = { action: 'clusters', args: '' };

  // 检测操作类型
  if (lower.includes('主机') || lower.includes('host')) {
    intent.action = 'hosts';
  } else if (lower.includes('启动') || lower.includes('start')) {
    intent.action = 'start';
  } else if (lower.includes('停止') || lower.includes('stop')) {
    intent.action = 'stop';
  } else if (lower.includes('重启') || lower.includes('restart')) {
    intent.action = 'restart';
  } else if (lower.includes('组件') || lower.includes('component')) {
    intent.action = 'components';
  } else if (lower.includes('状态') || lower.includes('status')) {
    intent.action = 'status';
  } else if (lower.includes('服务') || lower.includes('service')) {
    intent.action = 'services';
  }

  // 提取配置名（集群配置名，如 test, cold, offline 等）
  const configNames = Object.keys(clusters);
  for (const name of configNames) {
    // 匹配 "name集群" 或 "name 集群" 或单独的 "name"
    const patterns = [
      new RegExp(`\\b${name}\\s*集群\\b`),
      new RegExp(`\\b${name}\\b`)
    ];
    for (const pattern of patterns) {
      if (pattern.test(lower)) {
        intent.config = name;
        break;
      }
    }
    if (intent.config) break;
  }

  // 提取集群名（Ambari 里的集群名，如 qcc）
  // 格式: "集群:xxx" 或 "cluster:xxx"
  const clusterMatch = lower.match(/集群\s*[:：]\s*(\S+)/) ||
                       lower.match(/cluster\s*[:：]\s*(\S+)/i);
  if (clusterMatch) {
    intent.cluster = clusterMatch[1];
  }

  // 提取服务名
  const services = ['hdfs', 'yarn', 'spark', 'hive', 'hbase', 'kafka', 'zookeeper', 'flink', 'tez', 'oozie', 'ambari', 'ranger', 'atlas'];
  for (const svc of services) {
    if (lower.includes(svc)) {
      intent.service = svc.toUpperCase();
      break;
    }
  }

  // 提取主机名
  const hostMatch = lower.match(/主机\s*[:：]\s*(\S+)/) ||
                    lower.match(/host\s*[:：]\s*(\S+)/i);
  if (hostMatch) {
    intent.host = hostMatch[1];
  }

  return intent;
}

// 解析命令输出
function parseOutput(output) {
  try {
    return JSON.parse(output);
  } catch (e) {
    return { raw: output };
  }
}

const router = express.Router();

const { processMessage, getStats: getConversationStats } = require('../services/conversation');

// POST /api/chat - AI 驱动的多轮对话模式
router.post('/', async (req, res) => {
  try {
    const { session_id, agent_id, message, model_id } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'message 不能为空' });
    }

    // 如果没有 session_id，创建新的
    const sessionId = session_id || uuidv4();

    // 使用新的对话服务
    const { response, steps, error } = await processMessage(sessionId, message, agent_id, model_id);

    res.json({
      session_id: sessionId,
      agent_id,
      response,
      steps: steps || [],
      model_id,
      timestamp: new Date(),
      error: error || null
    });
  } catch (err) {
    console.error('Chat failed:', err);
    res.status(500).json({ error: '对话处理失败: ' + err.message });
  }
});

// POST /api/chat/skills - 旧版 Skills 模式（保留兼容）
router.post('/skills', async (req, res) => {
  try {
    const { agent_id, message, model_id, skill_ids } = req.body;

    if (!agent_id || !message) {
      return res.status(400).json({ error: 'agent_id 和 message 不能为空' });
    }

    // 如果指定了模型ID，临时设置使用该模型
    if (model_id) {
      const models = getModels();
      const selectedModel = models.find(m => m.id === model_id);
      if (selectedModel) {
        process.env.TEMP_MODEL_API_URL = selectedModel.apiUrl;
        process.env.TEMP_MODEL_API_KEY = selectedModel.apiKey;
        process.env.TEMP_MODEL_NAME = selectedModel.model;
      }
    }

    const { response, data, skills: usedSkills, steps } = await handleSkillsChat(agent_id, message, skill_ids);

    res.json({
      agent_id,
      response,
      data,
      skills: usedSkills,
      steps: steps || [],
      model_id,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('Skills Chat failed:', err);
    res.status(500).json({ error: '对话处理失败: ' + err.message });
  }
});

// GET /api/chat/stats - 获取对话统计
router.get('/stats', (req, res) => {
  const stats = getConversationStats();
  res.json(stats);
});

// DELETE /api/chat/session/:session_id - 清除对话历史
router.delete('/session/:session_id', (req, res) => {
  const { session_id } = req.params;
  const { clearHistory } = require('../services/conversation');
  const cleared = clearHistory(session_id);
  res.json({ success: cleared, session_id });
});

// GET /api/chat/mcp-tools - 获取可用的 MCP 工具列表
router.get('/mcp-tools', async (req, res) => {
  try {
    const { getMCPTools } = require('../services/mcp');
    const tools = getMCPTools();
    res.json({ tools });
  } catch (err) {
    res.status(500).json({ error: '获取 MCP 工具列表失败' });
  }
});

// POST /api/chat/mcp - MCP 模式
router.post('/mcp', async (req, res) => {
  try {
    const { agent_id, message, mcp_ids } = req.body;

    if (!agent_id || !message) {
      return res.status(400).json({ error: 'agent_id 和 message 不能为空' });
    }

    const { response, data, skills: usedSkills, steps } = await handleMCPChat(agent_id, message, mcp_ids);

    res.json({
      agent_id,
      response,
      data,
      skills: usedSkills,
      steps: steps || [],
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('MCP Chat failed:', err);
    res.status(500).json({ error: 'MCP 对话处理失败: ' + err.message });
  }
});

// Skills 模式处理
async function handleSkillsChat(agentId, message, preferredSkillIds) {
  const executionSteps = [];

  const agent = await Agent.getById(agentId);
  if (!agent) {
    return { response: '智能体不存在', data: null, skills: [], steps: [] };
  }

  executionSteps.push({
    step: '思考',
    content: '正在分析您的问题...',
    status: 'running'
  });

  const agentSkills = await Skill.getByIds(agent.skills);

  if (agentSkills.length === 0) {
    return {
      response: '该智能体没有配置任何技能，请先在智能体管理中配置技能。',
      data: null,
      skills: [],
      steps: executionSteps
    };
  }

  executionSteps.push({
    step: '技能识别',
    content: `可用技能: ${agentSkills.map(s => s.name).join(', ')}`,
    status: 'success'
  });

  // 如果用户指定了技能，直接使用；否则自动识别
  let skillIds;
  if (preferredSkillIds && preferredSkillIds.length > 0) {
    // 过滤出智能体实际拥有的技能
    skillIds = preferredSkillIds.filter(id => agentSkills.some(s => s.id === id));
    if (skillIds.length === 0) {
      return {
        response: '选择的技能不在该智能体的技能列表中。',
        data: null,
        skills: [],
        steps: executionSteps
      };
    }
  } else {
    skillIds = await identifySkills(message, agentSkills);
  }

  if (skillIds.length === 0) {
    executionSteps.push({
      step: '意图识别',
      content: '未能识别具体意图',
      status: 'warning'
    });
    return {
      response: `无法识别您的意图。请尝试更具体的描述，例如：\n• "查一下 HDFS 磁盘使用情况"\n• "YARN 集群资源状态"\n• "列出 Spark 应用"\n• "检查集群健康"`,
      data: null,
      skills: [],
      steps: executionSteps
    };
  }

  const matchedSkills = skillIds.map(id => agentSkills.find(s => s.id === id)?.name || id).join(', ');
  executionSteps.push({
    step: '意图识别',
    content: `匹配到技能: ${matchedSkills}`,
    status: 'success'
  });

  // 加载集群配置
  const settings = await loadSettings();
  const clusterConfig = settings.clusters?.[0] || {};

  let lastResult = null;
  let response = '';
  const usedSkills = [];

  for (let i = 0; i < skillIds.length; i++) {
    const skillId = skillIds[i];
    const skill = agentSkills.find(s => s.id === skillId);

    executionSteps.push({
      step: `执行 ${skill?.name || skillId}`,
      content: '正在执行...',
      status: 'running'
    });

    // 动态加载技能执行器
    const executorInfo = await loadSkillExecutor(skillId);

    if (!executorInfo) {
      console.warn(`Skill executor not found: ${skillId}`);
      executionSteps[executionSteps.length - 1].status = 'warning';
      executionSteps[executionSteps.length - 1].content = '技能执行器未找到，跳过';
      continue;
    }

    usedSkills.push(skillId);

    try {
      // 加载配置，合并集群配置
      let skillConfig = await loadSkillConfig(skillId, skill?.config || {});

      // 根据技能类型注入集群配置（强制使用页面配置的地址）
      if (skillId === 'hdfs-query') {
        if (!skillConfig.endpoint || skillConfig.endpoint.includes('${')) {
          skillConfig.endpoint = clusterConfig.hadoop?.namenodeUrl;
        }
        skillConfig.user = clusterConfig.hadoop?.user || skillConfig.user || 'hadoop';
      } else if (skillId === 'yarn-query') {
        if (!skillConfig.endpoint || skillConfig.endpoint.includes('${')) {
          skillConfig.endpoint = clusterConfig.hadoop?.yarnUrl;
        }
      } else if (skillId === 'spark-query') {
        if (!skillConfig.endpoint || skillConfig.endpoint.includes('${')) {
          skillConfig.endpoint = clusterConfig.spark?.historyUrl;
        }
      } else if (skillId === 'ambari-manage' || skillId === 'ambari-api') {
        if (!skillConfig.endpoint || skillConfig.endpoint.includes('${')) {
          skillConfig.endpoint = clusterConfig.ambari?.url;
        }
        skillConfig.username = clusterConfig.ambari?.username || skillConfig.username;
        skillConfig.password = clusterConfig.ambari?.password || skillConfig.password;
        skillConfig.clusterName = clusterConfig.ambari?.clusterName || skillConfig.clusterName;
      }

      let result;

      if (executorInfo.type === 'node') {
        result = await executorInfo.executor.execute(message, skillConfig, lastResult);
      } else if (executorInfo.type === 'cli') {
        result = await executeCliSkill(executorInfo.execPath, skillId, message, skillConfig);
      } else if (executorInfo.type === 'python') {
        result = await executePythonSkill(executorInfo.path, message, skillConfig);
      } else if (executorInfo.type === 'shell') {
        result = await executeShellSkill(executorInfo.path, message, skillConfig);
      }

      if (result.error) {
        executionSteps[executionSteps.length - 1].status = 'error';
        executionSteps[executionSteps.length - 1].content = result.error;
        return { response: result.error, data: null, skills: usedSkills, steps: executionSteps };
      }

      executionSteps[executionSteps.length - 1].status = 'success';
      executionSteps[executionSteps.length - 1].content = result.summary || '执行完成';

      if (i === skillIds.length - 1) {
        executionSteps.push({
          step: '生成回复',
          content: '正在整理结果...',
          status: 'running'
        });

        // 如果技能已经生成了摘要，直接使用
        if (result.summary) {
          response = result.summary;
        } else {
          // 否则调用 AI 生成响应
          try {
            response = await generateResponse(message, result.data, agentSkills);
          } catch (aiErr) {
            console.warn('AI generation failed, returning raw data:', aiErr.message);
            response = typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2);
          }
        }
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
      return { response: `技能执行失败: ${err.message}`, data: null, skills: usedSkills, steps: executionSteps };
    }
  }

  // 保存对话记录
  await saveConversation(agentId, message, response, lastResult);

  return { response, data: lastResult, skills: usedSkills, steps: executionSteps };
}

// MCP 模式处理
async function handleMCPChat(agentId, message, preferredMcpIds) {
  const executionSteps = [];

  const agent = await Agent.getById(agentId);
  if (!agent) {
    return { response: '智能体不存在', data: null, skills: [], steps: [] };
  }

  executionSteps.push({
    step: '思考',
    content: '正在分析您的问题...',
    status: 'running'
  });

  // 如果指定了 MCP 工具，直接使用；否则解析意图
  let intent;
  if (preferredMcpIds && preferredMcpIds.length > 0) {
    // 使用第一个指定的 MCP 工具
    const toolId = preferredMcpIds[0];
    const lower = message.toLowerCase();

    // 根据工具类型确定 action
    let action = 'apps';
    if (toolId === 'spark-history-cli') {
      if (lower.includes('job')) action = 'jobs';
      else if (lower.includes('stage')) action = 'stages';
      else if (lower.includes('executor')) action = 'executors';
      else if (lower.includes('app') && lower.match(/application[_\s]?\d+/)) action = 'app';
    }

    intent = { tool: toolId, action, params: {} };
    executionSteps.push({
      step: '工具识别',
      content: `使用 MCP 工具: ${toolId}`,
      status: 'success'
    });
  } else {
    intent = parseMCPIntent(message);
    if (intent) {
      executionSteps.push({
        step: '工具识别',
        content: `识别到 MCP 工具: ${intent.tool}`,
        status: 'success'
      });
    }
  }

  if (!intent) {
    executionSteps.push({
      step: '意图识别',
      content: '未能识别具体意图',
      status: 'warning'
    });
    return {
      response: '无法识别要使用的 MCP 工具。请明确指定，例如：查询 Spark 应用列表',
      data: null,
      skills: [],
      steps: executionSteps
    };
  }

  // 加载工具配置
  const settings = await loadSettings();
  const params = { ...intent.params };

  // 添加服务器地址
  if (intent.tool === 'spark-history-cli') {
    params.serverUrl = settings.sparkHistoryUrl || getSparkHistoryUrl() || config.spark.historyUrl;
  }

  const usedSkills = [`mcp:${intent.tool}`];

  executionSteps.push({
    step: `执行 ${intent.tool}`,
    content: '正在执行...',
    status: 'running'
  });

  try {
    const { data, error } = await executeMCP(intent.tool, intent.action, params);

    if (error) {
      executionSteps[executionSteps.length - 1].status = 'error';
      executionSteps[executionSteps.length - 1].content = error;
      return { response: error, data: null, skills: usedSkills, steps: executionSteps };
    }

    // 格式化数据
    const summary = formatSparkData(data, message);
    executionSteps[executionSteps.length - 1].status = 'success';
    executionSteps[executionSteps.length - 1].content = summary || '执行完成';

    executionSteps.push({
      step: '生成回复',
      content: '正在整理结果...',
      status: 'running'
    });

    // 生成响应
    let response;
    try {
      response = await generateResponse(message, data, []);
    } catch (aiErr) {
      // AI 调用失败时，返回原始数据
      console.warn('AI generation failed, returning raw data:', aiErr.message);
      response = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    }

    executionSteps[executionSteps.length - 1].status = 'success';
    executionSteps[executionSteps.length - 1].content = '回复生成完成';

    // 保存对话记录
    await saveConversation(agentId, message, response, data);

    return { response, data, skills: usedSkills, steps: executionSteps };
  } catch (err) {
    console.error('MCP execution failed:', err);
    executionSteps[executionSteps.length - 1].status = 'error';
    executionSteps[executionSteps.length - 1].content = `执行失败: ${err.message}`;
    return { response: `MCP 执行失败: ${err.message}`, data: null, skills: usedSkills, steps: executionSteps };
  }
}

// 加载技能配置
async function loadSkillConfig(skillId, defaultConfig) {
  try {
    const rows = await query('SELECT value FROM settings WHERE `key` = ?', [skillId]);
    if (rows.length > 0) {
      const savedConfig = typeof rows[0].value === 'string' ? JSON.parse(rows[0].value) : rows[0].value;
      return { ...defaultConfig, ...savedConfig };
    }
  } catch (err) {
    console.warn('Failed to load skill config:', err.message);
  }
  return defaultConfig;
}

// 加载全局设置
async function loadSettings() {
  try {
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
    return {};
  }
}

// 保存对话记录
async function saveConversation(agentId, message, response, data) {
  try {
    const conversationId = uuidv4();
    await query(
      'INSERT INTO conversations (id, agent_id, message, response, data) VALUES (?, ?, ?, ?, ?)',
      [conversationId, agentId, message, response, JSON.stringify(data)]
    );
  } catch (err) {
    console.warn('Failed to save conversation:', err.message);
  }
}

module.exports = router;