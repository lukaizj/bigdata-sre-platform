const axios = require('axios');
const config = require('../../src/config');

/**
 * 集群健康检查技能
 * 综合检查 HDFS/YARN/Spark 整体健康状态
 */
async function execute(message, skillConfig, previousResult) {
  const namenodeUrl = skillConfig.namenodeUrl || config.hadoop.namenodeUrl;
  const yarnUrl = skillConfig.yarnUrl || config.hadoop.yarnUrl;
  const sparkUrl = skillConfig.sparkUrl || config.spark.historyUrl;
  const timeout = skillConfig.timeout || 60000;

  const intent = parseIntent(message);

  try {
    const results = {};

    // 根据 intent 决定检查哪些组件
    if (intent.components.includes('hdfs') || intent.components.includes('all')) {
      results.hdfs = await checkHDFS(namenodeUrl, timeout);
    }

    if (intent.components.includes('yarn') || intent.components.includes('all')) {
      results.yarn = await checkYARN(yarnUrl, timeout);
    }

    if (intent.components.includes('spark') || intent.components.includes('all')) {
      results.spark = await checkSpark(sparkUrl, timeout);
    }

    // 汇总健康状态
    const healthSummary = {
      status: getOverallStatus(results),
      checks: results,
      timestamp: new Date().toISOString(),
    };

    return { data: healthSummary };
  } catch (err) {
    return { error: `集群健康检查失败: ${err.message}`, data: null };
  }
}

function parseIntent(message) {
  const lower = message.toLowerCase();

  const components = [];
  if (lower.includes('hdfs') || lower.includes('hadoop')) {
    components.push('hdfs');
  }
  if (lower.includes('yarn') || lower.includes('资源')) {
    components.push('yarn');
  }
  if (lower.includes('spark')) {
    components.push('spark');
  }

  if (components.length === 0 || lower.includes('全部') || lower.includes('整体') || lower.includes('综合')) {
    components.push('all');
  }

  return { components };
}

async function checkHDFS(namenodeUrl, timeout) {
  try {
    const [statusRes, infoRes] = await Promise.all([
      axios.get(`${namenodeUrl}/jmx?qry=Hadoop:service=NameNode,name=FSNamesystemState`, { timeout }),
      axios.get(`${namenodeUrl}/jmx?qry=Hadoop:service=NameNode,name=NameNodeInfo`, { timeout }),
    ]);

    const status = statusRes.data.beans?.[0] || {};
    const info = infoRes.data.beans?.[0] || {};

    return {
      status: status.State || 'UNKNOWN',
      healthy: status.NumDeadDataNodes === 0,
      liveNodes: status.NumLiveDataNodes || 0,
      deadNodes: status.NumDeadDataNodes || 0,
      totalBlocks: info.TotalBlocks || 0,
      totalFiles: info.TotalFiles || 0,
      percentUsed: info.PercentUsed || 0,
    };
  } catch (err) {
    return { status: 'ERROR', error: err.message, healthy: false };
  }
}

async function checkYARN(yarnUrl, timeout) {
  try {
    const [metricsRes, nodesRes] = await Promise.all([
      axios.get(`${yarnUrl}/ws/v1/cluster/metrics`, { timeout }),
      axios.get(`${yarnUrl}/ws/v1/cluster/nodes`, { timeout }),
    ]);

    const metrics = metricsRes.data.clusterMetrics || {};
    const nodes = nodesRes.data.nodes?.node || [];

    const lostNodes = nodes.filter(n => n.state === 'LOST' || n.state === 'UNHEALTHY').length;

    return {
      status: 'RUNNING',
      healthy: lostNodes === 0,
      totalNodes: metrics.totalNodes || nodes.length,
      activeNodes: metrics.activeNodes || 0,
      lostNodes,
      availableMB: metrics.availableMB || 0,
      totalMB: metrics.totalMB || 0,
      runningApps: metrics.appsRunning || 0,
    };
  } catch (err) {
    return { status: 'ERROR', error: err.message, healthy: false };
  }
}

async function checkSpark(sparkUrl, timeout) {
  try {
    const appsRes = await axios.get(`${sparkUrl}/api/v1/applications?status=running`, { timeout });
    const apps = appsRes.data || [];

    return {
      status: 'RUNNING',
      healthy: true,
      runningApps: apps.length,
      recentApps: apps.slice(0, 5).map(a => ({
        id: a.id,
        name: a.name,
        duration: a.attempts?.[0]?.duration || 0,
      })),
    };
  } catch (err) {
    return { status: 'ERROR', error: err.message, healthy: false };
  }
}

function getOverallStatus(results) {
  const checks = Object.values(results);
  const hasError = checks.some(c => c.status === 'ERROR');
  const hasUnhealthy = checks.some(c => !c.healthy);

  if (hasError) return 'CRITICAL';
  if (hasUnhealthy) return 'WARNING';
  return 'HEALTHY';
}

module.exports = {
  execute,
  parseIntent,
  checkHDFS,
  checkYARN,
  checkSpark,
};