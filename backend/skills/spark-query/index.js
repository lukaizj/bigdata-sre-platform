const axios = require('axios');
const config = require('../../src/config');

/**
 * Spark 查询技能
 */
async function execute(message, skillConfig, previousResult) {
  const sparkUrl = skillConfig.endpoint || config.spark.historyUrl;
  // timeout 应该至少 5000ms，如果传入值太小则使用默认值
  let timeout = parseInt(skillConfig.timeout) || 10000;
  if (timeout < 1000) timeout = 10000;  // 小于 1 秒则用默认值

  console.log(`[Spark] Using URL: ${sparkUrl}, timeout: ${timeout}ms`);

  const intent = parseIntent(message);

  try {
    let result;

    switch (intent.action) {
      case 'apps':
        result = await listApplications(sparkUrl, intent.status, timeout);
        break;
      case 'app_detail':
        if (!intent.appId) {
          return { error: '请提供应用 ID', data: null };
        }
        result = await getApplicationDetail(sparkUrl, intent.appId, timeout);
        break;
      case 'jobs':
        if (!intent.appId) {
          return { error: '请提供应用 ID', data: null };
        }
        result = await listJobs(sparkUrl, intent.appId, timeout);
        break;
      case 'stages':
        if (!intent.appId) {
          return { error: '请提供应用 ID', data: null };
        }
        result = await listStages(sparkUrl, intent.appId, timeout);
        break;
      case 'executors':
        if (!intent.appId) {
          return { error: '请提供应用 ID', data: null };
        }
        result = await listExecutors(sparkUrl, intent.appId, timeout);
        break;
      default:
        result = await listApplications(sparkUrl, null, timeout);
    }

    return { data: result };
  } catch (err) {
    return { error: `Spark 查询失败: ${err.message}`, data: null };
  }
}

function parseIntent(message) {
  const lower = message.toLowerCase();

  // 应用 ID 提取
  const appIdMatch = message.match(/app[-_\d\w]+/i);
  const appId = appIdMatch ? appIdMatch[0] : null;

  let status = null;
  if (lower.includes('completed') || lower.includes('完成')) {
    status = 'completed';
  } else if (lower.includes('running') || lower.includes('运行')) {
    status = 'running';
  }

  if (lower.includes('job')) {
    return { action: 'jobs', appId, status };
  }
  if (lower.includes('stage')) {
    return { action: 'stages', appId, status };
  }
  if (lower.includes('executor') || lower.includes('执行器')) {
    return { action: 'executors', appId, status };
  }
  if (lower.includes('详情') || lower.includes('detail') || lower.includes('详细')) {
    return { action: 'app_detail', appId, status };
  }

  return { action: 'apps', appId, status };
}

async function listApplications(sparkUrl, status, timeout) {
  let url = `${sparkUrl}/api/v1/applications`;
  if (status) {
    url += `?status=${status}`;
  }
  console.log(`[Spark] Fetching applications from: ${url}`);
  const response = await axios.get(url, { timeout, headers: { 'Accept': 'application/json' } });
  console.log(`[Spark] Received ${response.data?.length || 0} applications`);
  return response.data;
}

async function getApplicationDetail(sparkUrl, appId, timeout) {
  const url = `${sparkUrl}/api/v1/applications/${appId}`;
  const response = await axios.get(url, { timeout });
  return response.data;
}

async function listJobs(sparkUrl, appId, timeout) {
  const url = `${sparkUrl}/api/v1/applications/${appId}/jobs`;
  const response = await axios.get(url, { timeout });
  return response.data;
}

async function listStages(sparkUrl, appId, timeout) {
  const url = `${sparkUrl}/api/v1/applications/${appId}/stages`;
  const response = await axios.get(url, { timeout });
  return response.data;
}

async function listExecutors(sparkUrl, appId, timeout) {
  const url = `${sparkUrl}/api/v1/applications/${appId}/executors`;
  const response = await axios.get(url, { timeout });
  return response.data;
}

module.exports = {
  execute,
  parseIntent,
  listApplications,
  getApplicationDetail,
  listJobs,
  listStages,
  listExecutors,
};