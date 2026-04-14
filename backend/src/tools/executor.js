/**
 * 工具执行器
 * 复用现有技能实现，适配 Function Calling 调用
 */

const axios = require('axios');
const config = require('../config');
const { TOOL_NAMES } = require('./definitions');

// 加载现有技能
const hdfsQuery = require('../../skills/hdfs-query/index');
const yarnQuery = require('../../skills/yarn-query/index');
const clusterHealth = require('../../skills/cluster-health/index');
const sparkQuery = require('../../skills/spark-query/index');
const ambariManage = require('../../skills/ambari-manage/index');

/**
 * 执行工具调用
 * @param {string} toolName - 工具名称
 * @param {object} args - 工具参数
 * @param {object} settings - 全局配置（包含集群信息）
 * @returns {object} - 执行结果 { data, summary, error }
 */
async function executeToolCall(toolName, args, settings) {
  const startTime = Date.now();
  let result;

  try {
    switch (toolName) {
      case 'query_hdfs_status':
        result = await executeHDFSQuery(args, settings);
        break;
      case 'query_yarn_status':
        result = await executeYARNQuery(args, settings);
        break;
      case 'query_spark_apps':
        result = await executeSparkQuery(args, settings);
        break;
      case 'check_cluster_health':
        result = await executeHealthCheck(args, settings);
        break;
      case 'get_cluster_list':
        result = await executeGetClusterList(args, settings);
        break;
      case 'ambari_service_action':
        result = await executeAmbariAction(args, settings);
        break;
      default:
        return { error: `未知的工具: ${toolName}` };
    }

    const duration = Date.now() - startTime;
    console.log(`[${toolName}] executed in ${duration}ms`);

    return result;
  } catch (err) {
    console.error(`[${toolName}] execution failed:`, err.message);
    return {
      error: `${TOOL_NAMES[toolName] || toolName} 执行失败: ${err.message}`,
      summary: '执行失败'
    };
  }
}

/**
 * 查找集群配置
 */
function findCluster(clusterId, settings) {
  const cluster = settings.clusters?.find(c => c.id === clusterId);
  if (!cluster) {
    return null;
  }
  return cluster;
}

/**
 * 执行 HDFS 查询
 */
async function executeHDFSQuery(args, settings) {
  const cluster = findCluster(args.cluster_id, settings);
  if (!cluster) {
    return {
      error: `未找到集群: ${args.cluster_id}`,
      summary: '集群未配置'
    };
  }

  const namenodeUrl = cluster.hadoop?.namenodeUrl;
  if (!namenodeUrl) {
    return {
      error: `集群 ${args.cluster_id} 未配置 NameNode URL`,
      summary: '配置缺失'
    };
  }

  const skillConfig = {
    endpoint: namenodeUrl,
    user: cluster.hadoop?.user || 'hadoop',
    timeout: 30000
  };

  // 根据 action 构建 message
  let message;
  switch (args.action) {
    case 'disk_usage':
      message = '查询磁盘使用情况';
      break;
    case 'health':
      message = '检查集群健康状态';
      break;
    case 'list_directory':
      message = `列出目录 ${args.path || '/'}`;
      break;
    default:
      message = '查询HDFS集群状态';
  }

  const result = await hdfsQuery.execute(message, skillConfig);

  if (result.error) {
    return { error: result.error, summary: '查询失败' };
  }

  // 生成摘要
  const summary = generateHDFSSummary(result.data, args.action);

  return { data: result.data, summary };
}

/**
 * 生成 HDFS 结果摘要
 */
function generateHDFSSummary(data, action) {
  if (!data) return '无数据';

  if (action === 'disk_usage' || data.percentUsed !== undefined) {
    const percentUsed = data.percentUsed || 0;
    const total = data.total ? formatBytes(parseInt(data.total)) : '未知';
    const used = data.used ? formatBytes(parseInt(data.used)) : '未知';
    const free = data.free ? formatBytes(parseInt(data.free)) : '未知';

    return `**HDFS 存储使用情况**
- 总容量: ${total}
- 已使用: ${used} (${percentUsed.toFixed(1)}%)
- 剩余: ${free}
- 文件数: ${data.totalFiles || '未知'}
- 块数: ${data.totalBlocks || '未知'}`;
  }

  if (data.state) {
    const liveNodes = data.numLiveDataNodes || 0;
    const deadNodes = data.numDeadDataNodes || 0;
    const status = deadNodes === 0 ? '✅ 健康' : '⚠️ 有异常节点';

    return `**HDFS 集群状态**
- NameNode 状态: ${data.state}
- 存活的 DataNode: ${liveNodes}
- 死亡的 DataNode: ${deadNodes}
- 整体状态: ${status}`;
  }

  return '查询完成';
}

/**
 * 执行 YARN 查询
 */
async function executeYARNQuery(args, settings) {
  const cluster = findCluster(args.cluster_id, settings);
  if (!cluster) {
    return {
      error: `未找到集群: ${args.cluster_id}`,
      summary: '集群未配置'
    };
  }

  const yarnUrl = cluster.hadoop?.yarnUrl;
  if (!yarnUrl) {
    return {
      error: `集群 ${args.cluster_id} 未配置 YARN ResourceManager URL`,
      summary: '配置缺失'
    };
  }

  const skillConfig = {
    endpoint: yarnUrl,
    timeout: 30000
  };

  // 根据 action 构建 message
  let message;
  switch (args.action) {
    case 'apps':
      message = args.state ? `查询${args.state}状态的应用` : '查询应用列表';
      break;
    case 'nodes':
      message = '查询节点列表';
      break;
    case 'scheduler':
      message = '查询调度器和队列信息';
      break;
    default:
      message = '查询YARN集群资源指标';
  }

  const result = await yarnQuery.execute(message, skillConfig);

  if (result.error) {
    return { error: result.error, summary: '查询失败' };
  }

  const summary = generateYARNSummary(result.data, args.action);

  return { data: result.data, summary };
}

/**
 * 生成 YARN 结果摘要
 */
function generateYARNSummary(data, action) {
  if (!data) return '无数据';

  if (action === 'metrics' || data.clusterMetrics || data.availableMB !== undefined) {
    const metrics = data.clusterMetrics || data;
    const totalMB = metrics.totalMB || 0;
    const availableMB = metrics.availableMB || 0;
    const usedMB = totalMB - availableMB;
    const usedPercent = totalMB > 0 ? (usedMB / totalMB * 100).toFixed(1) : 0;

    return `**YARN 集群资源**
- 总内存: ${totalMB} MB (${formatBytes(totalMB * 1024 * 1024)})
- 已使用: ${usedMB} MB (${usedPercent}%)
- 可用内存: ${availableMB} MB
- 总节点数: ${metrics.totalNodes || 0}
- 活跃节点: ${metrics.activeNodes || 0}
- 运行应用: ${metrics.appsRunning || 0}`;
  }

  if (Array.isArray(data) && data[0]?.id) {
    // 应用列表
    const count = data.length;
    let summary = `**YARN 应用列表** (共 ${count} 个)\n`;
    for (const app of data.slice(0, 10)) {
      summary += `- ${app.name || app.id}: ${app.state}, ${app.finalStatus || 'N/A'}\n`;
    }
    return summary;
  }

  if (data.scheduler || data.fifoScheduler || data.capacityScheduler) {
    const scheduler = data.scheduler || data;
    return `**YARN 调度器信息**
- 类型: ${scheduler.schedulerInfo?.type || 'Unknown'}
- 已配置`;
  }

  return '查询完成';
}

/**
 * 执行 Spark 查询
 */
async function executeSparkQuery(args, settings) {
  // 使用集群的 Spark History URL 或全局配置
  let sparkUrl;
  if (args.cluster_id === 'default') {
    sparkUrl = settings.sparkHistoryUrl || config.spark?.historyUrl;
  } else {
    const cluster = findCluster(args.cluster_id, settings);
    if (cluster) {
      sparkUrl = cluster.spark?.historyUrl || settings.sparkHistoryUrl;
    } else {
      sparkUrl = settings.sparkHistoryUrl;
    }
  }

  if (!sparkUrl) {
    return {
      error: '未找到 Spark History Server URL',
      summary: '配置缺失'
    };
  }

  const skillConfig = {
    endpoint: sparkUrl,
    timeout: 30000
  };

  // 根据 action 构建 message
  let message;
  if (args.app_id) {
    switch (args.action) {
      case 'jobs':
        message = `查询应用 ${args.app_id} 的 Job 信息`;
        break;
      case 'executors':
        message = `查询应用 ${args.app_id} 的 Executor 信息`;
        break;
      case 'stages':
        message = `查询应用 ${args.app_id} 的 Stage 信息`;
        break;
      default:
        message = `查询应用 ${args.app_id} 详情`;
    }
  } else {
    switch (args.action) {
      case 'list':
        message = args.status ? `列出${args.status}状态的Spark应用` : '列出Spark应用';
        break;
      default:
        message = '列出Spark应用';
    }
  }

  const result = await sparkQuery.execute(message, skillConfig);

  if (result.error) {
    return { error: result.error, summary: '查询失败' };
  }

  const summary = generateSparkSummary(result.data, args.action, args.app_id);

  return { data: result.data, summary };
}

/**
 * 生成 Spark 结果摘要
 */
function generateSparkSummary(data, action, appId) {
  if (!data) return '无数据';

  if (Array.isArray(data) && data[0]?.id && !appId) {
    // 应用列表
    const count = data.length;
    let summary = `**Spark 应用列表** (共 ${count} 个)\n\n`;
    for (const app of data.slice(0, 15)) {
      const attempt = app.attempts?.[0];
      const status = attempt?.completed ? '✅ 已完成' : '🔄 运行中';
      const duration = attempt?.duration ? Math.round(attempt.duration / 1000) + '秒' : '未知';
      summary += `**${app.name || app.id}**\n`;
      summary += `- ID: ${app.id}\n`;
      summary += `- 状态: ${status}\n`;
      summary += `- 耗时: ${duration}\n\n`;
    }
    return summary;
  }

  if (data.id || appId) {
    // 单个应用详情
    const app = data;
    const attempt = app.attempts?.[0];
    const status = attempt?.completed ? '✅ 已完成' : '🔄 运行中';
    const duration = attempt?.duration ? Math.round(attempt.duration / 1000) + '秒' : '未知';

    return `**Spark 应用详情**
- ID: ${app.id || appId}
- 名称: ${app.name || 'Unknown'}
- 状态: ${status}
- 耗时: ${duration}
- 用户: ${attempt?.sparkUser || 'Unknown'}
- Spark 版本: ${attempt?.appSparkVersion || 'Unknown'}`;
  }

  return '查询完成';
}

/**
 * 执行集群健康检查
 */
async function executeHealthCheck(args, settings) {
  const cluster = findCluster(args.cluster_id, settings);
  if (!cluster) {
    return {
      error: `未找到集群: ${args.cluster_id}`,
      summary: '集群未配置'
    };
  }

  const skillConfig = {
    namenodeUrl: cluster.hadoop?.namenodeUrl,
    yarnUrl: cluster.hadoop?.yarnUrl,
    sparkUrl: cluster.spark?.historyUrl || settings.sparkHistoryUrl,
    timeout: 60000
  };

  // 构建 message
  const components = args.components || ['all'];
  let message;
  if (components.includes('all')) {
    message = '全面检查集群健康状态';
  } else {
    message = `检查 ${components.join('、')} 健康状态`;
  }

  const result = await clusterHealth.execute(message, skillConfig);

  if (result.error) {
    return { error: result.error, summary: '检查失败' };
  }

  const summary = generateHealthSummary(result.data);

  return { data: result.data, summary };
}

/**
 * 生成健康检查摘要
 */
function generateHealthSummary(data) {
  if (!data) return '无数据';

  const statusEmoji = {
    HEALTHY: '✅',
    WARNING: '⚠️',
    CRITICAL: '❌'
  };

  let summary = `**集群健康状态**: ${statusEmoji[data.status] || ''} ${data.status}\n\n`;

  for (const [component, result] of Object.entries(data.checks || {})) {
    const emoji = result.healthy ? '✅' : '❌';
    summary += `**${component.toUpperCase()}**\n`;
    summary += `- 状态: ${emoji} ${result.status}\n`;

    if (result.error) {
      summary += `- 错误: ${result.error}\n`;
    } else {
      if (result.liveNodes !== undefined) summary += `- 存活节点: ${result.liveNodes}\n`;
      if (result.activeNodes !== undefined) summary += `- 活跃节点: ${result.activeNodes}\n`;
      if (result.runningApps !== undefined) summary += `- 运行应用: ${result.runningApps}\n`;
    }
    summary += '\n';
  }

  return summary;
}

/**
 * 获取集群列表
 */
async function executeGetClusterList(args, settings) {
  const clusters = settings.clusters || [];

  let summary = '**可用集群列表**\n\n';
  for (const cluster of clusters) {
    const envEmoji = {
      production: '🏭',
      test: '🧪',
      development: '🔧'
    };
    summary += `**${cluster.name}** (${cluster.id})\n`;
    summary += `- 环境: ${envEmoji[cluster.environment] || ''} ${cluster.environment}\n`;
    summary += `- HDFS: ${cluster.hadoop?.namenodeUrl ? '✅ 已配置' : '❌ 未配置'}\n`;
    summary += `- YARN: ${cluster.hadoop?.yarnUrl ? '✅ 已配置' : '❌ 未配置'}\n`;
    summary += `- Spark: ${cluster.spark?.historyUrl ? '✅ 已配置' : '❌ 未配置'}\n`;
    summary += '\n';
  }

  return { data: clusters, summary };
}

/**
 * Ambari 服务操作
 */
async function executeAmbariAction(args, settings) {
  const cluster = findCluster(args.cluster_id, settings);
  if (!cluster) {
    return {
      error: `未找到集群: ${args.cluster_id}`,
      summary: '集群未配置'
    };
  }

  const ambariUrl = cluster.ambari?.url;
  const ambariUser = cluster.ambari?.username;
  const ambariPassword = cluster.ambari?.password;
  const clusterName = cluster.ambari?.clusterName;

  if (!ambariUrl) {
    return {
      error: `集群 ${args.cluster_id} 未配置 Ambari URL`,
      summary: '配置缺失'
    };
  }

  const skillConfig = {
    endpoint: ambariUrl,
    username: ambariUser || 'admin',
    password: ambariPassword || 'admin',
    clusterName: clusterName,
    timeout: 30000
  };

  let message;
  if (args.action === 'status') {
    message = args.service ? `查看${args.service}服务状态` : '查看集群服务状态';
  } else {
    message = args.service
      ? `${args.action} ${args.service} 服务`
      : `${args.action} 所有服务`;
  }

  const result = await ambariManage.execute(message, skillConfig);

  if (result.error) {
    return { error: result.error, summary: '操作失败' };
  }

  const summary = `**Ambari 服务操作**
- 集群: ${args.cluster_id}
- 操作: ${args.action}
- ${args.service ? `服务: ${args.service}` : ''}
- 结果: 执行完成`;

  return { data: result.data, summary };
}

/**
 * 格式化字节大小
 */
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + units[i];
}

module.exports = {
  executeToolCall,
  TOOL_NAMES
};