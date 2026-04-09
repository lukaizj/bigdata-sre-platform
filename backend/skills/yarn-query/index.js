const axios = require('axios');
const config = require('../../src/config');

/**
 * YARN 查询技能
 */
async function execute(message, skillConfig, previousResult) {
  const yarnUrl = skillConfig.endpoint || config.hadoop.yarnUrl;
  const timeout = skillConfig.timeout || 30000;

  // 调试输出
  console.log('[yarn-query] skillConfig:', JSON.stringify(skillConfig));
  console.log('[yarn-query] yarnUrl:', yarnUrl);

  const intent = parseIntent(message);

  try {
    let result;

    switch (intent.action) {
      case 'apps':
        result = await listApplications(yarnUrl, intent.state, timeout);
        break;
      case 'cluster_metrics':
      case 'resources':
        result = await getClusterMetrics(yarnUrl, timeout);
        break;
      case 'nodes':
        result = await listNodes(yarnUrl, intent.state, timeout);
        break;
      case 'scheduler':
      case 'queue':
        result = await getSchedulerInfo(yarnUrl, timeout);
        break;
      default:
        result = await getClusterMetrics(yarnUrl, timeout);
    }

    return { data: result };
  } catch (err) {
    return { error: `YARN 查询失败: ${err.message}`, data: null };
  }
}

function parseIntent(message) {
  const lower = message.toLowerCase();

  let state = null;
  if (lower.includes('running') || lower.includes('运行')) {
    state = 'RUNNING';
  } else if (lower.includes('finished') || lower.includes('完成')) {
    state = 'FINISHED';
  } else if (lower.includes('failed') || lower.includes('失败')) {
    state = 'FAILED';
  }

  if (lower.includes('应用') || lower.includes('application') || lower.includes('job')) {
    return { action: 'apps', state };
  }
  if (lower.includes('节点') || lower.includes('node') || lower.includes('nodemanager')) {
    return { action: 'nodes', state };
  }
  if (lower.includes('调度') || lower.includes('scheduler') || lower.includes('队列') || lower.includes('queue')) {
    return { action: 'scheduler', state };
  }
  if (lower.includes('资源') || lower.includes('resource') || lower.includes('指标') || lower.includes('metric')) {
    return { action: 'cluster_metrics', state };
  }

  return { action: 'cluster_metrics', state };
}

async function listApplications(yarnUrl, state, timeout) {
  let url = `${yarnUrl}/ws/v1/cluster/apps`;
  if (state) {
    url += `?state=${state}`;
  }
  const response = await axios.get(url, { timeout });
  return response.data.apps?.app || [];
}

async function getClusterMetrics(yarnUrl, timeout) {
  const url = `${yarnUrl}/ws/v1/cluster/metrics`;
  const response = await axios.get(url, { timeout });
  return response.data.clusterMetrics;
}

async function listNodes(yarnUrl, state, timeout) {
  let url = `${yarnUrl}/ws/v1/cluster/nodes`;
  if (state) {
    url += `?state=${state}`;
  }
  const response = await axios.get(url, { timeout });
  return response.data.nodes?.node || [];
}

async function getSchedulerInfo(yarnUrl, timeout) {
  const url = `${yarnUrl}/ws/v1/cluster/scheduler`;
  const response = await axios.get(url, { timeout });
  return response.data.scheduler;
}

module.exports = {
  execute,
  parseIntent,
  listApplications,
  getClusterMetrics,
  listNodes,
  getSchedulerInfo,
};