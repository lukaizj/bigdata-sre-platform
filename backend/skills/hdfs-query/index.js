const axios = require('axios');
const config = require('../../src/config');

/**
 * HDFS 查询技能
 */
async function execute(message, skillConfig, previousResult) {
  const namenodeUrl = skillConfig.endpoint || config.hadoop.namenodeUrl;
  const timeout = skillConfig.timeout || 30000;

  // 调试输出
  console.log('[hdfs-query] skillConfig:', JSON.stringify(skillConfig));
  console.log('[hdfs-query] namenodeUrl:', namenodeUrl);

  // 解析用户意图
  const intent = parseIntent(message);

  try {
    let result;

    switch (intent.action) {
      case 'list':
        result = await listDirectory(namenodeUrl, intent.path, timeout);
        break;
      case 'disk_usage':
      case 'storage':
        result = await getDiskUsage(namenodeUrl, timeout);
        break;
      case 'cluster_status':
      case 'health':
        result = await getClusterStatus(namenodeUrl, timeout);
        break;
      case 'content_summary':
        result = await getContentSummary(namenodeUrl, intent.path || '/', timeout);
        break;
      default:
        result = await getClusterStatus(namenodeUrl, timeout);
    }

    return { data: result };
  } catch (err) {
    return { error: `HDFS 查询失败: ${err.message}`, data: null };
  }
}

function parseIntent(message) {
  const lower = message.toLowerCase();

  // 路径提取
  const pathMatch = message.match(/\/[\w\/\-\.]+/);
  const path = pathMatch ? pathMatch[0] : '/';

  if (lower.includes('列表') || lower.includes('list') || lower.includes('文件')) {
    return { action: 'list', path };
  }
  if (lower.includes('磁盘') || lower.includes('disk') || lower.includes('存储') || lower.includes('容量')) {
    return { action: 'disk_usage', path };
  }
  if (lower.includes('状态') || lower.includes('status') || lower.includes('健康')) {
    return { action: 'cluster_status', path };
  }
  if (lower.includes('汇总') || lower.includes('summary') || lower.includes('统计')) {
    return { action: 'content_summary', path };
  }

  return { action: 'cluster_status', path };
}

async function listDirectory(namenodeUrl, path, timeout) {
  const url = `${namenodeUrl}/webhdfs/v1${path}?op=LISTSTATUS`;
  const response = await axios.get(url, { timeout });
  return response.data.DirectoryListing;
}

async function getDiskUsage(namenodeUrl, timeout) {
  const url = `${namenodeUrl}/jmx?qry=Hadoop:service=NameNode,name=NameNodeInfo`;
  const response = await axios.get(url, { timeout });
  const beans = response.data.beans;
  if (beans && beans.length > 0) {
    const info = beans[0];
    return {
      total: info.Total || info.ClusterId,
      used: info.Used,
      free: info.Free,
      percentUsed: info.PercentUsed,
      totalBlocks: info.TotalBlocks,
      totalFiles: info.TotalFiles,
      liveNodes: info.LiveNodes,
      deadNodes: info.DeadNodes,
    };
  }
  return response.data;
}

async function getClusterStatus(namenodeUrl, timeout) {
  const url = `${namenodeUrl}/jmx?qry=Hadoop:service=NameNode,name=FSNamesystemState`;
  const response = await axios.get(url, { timeout });
  const beans = response.data.beans;
  if (beans && beans.length > 0) {
    const state = beans[0];
    return {
      state: state.State,
      numLiveDataNodes: state.NumLiveDataNodes,
      numDeadDataNodes: state.NumDeadDataNodes,
      numStaleDataNodes: state.NumStaleDataNodes,
      volumeFailuresTotal: state.VolumeFailuresTotal,
      estimatedCapacityLostTotal: state.EstimatedCapacityLostTotal,
      blockPoolUsedSpace: state.BlockPoolUsedSpace,
      percentBlockPoolUsed: state.PercentBlockPoolUsed,
    };
  }
  return response.data;
}

async function getContentSummary(namenodeUrl, path, timeout) {
  const url = `${namenodeUrl}/webhdfs/v1${path}?op=GETCONTENTSUMMARY`;
  const response = await axios.get(url, { timeout });
  return response.data.ContentSummary;
}

module.exports = {
  execute,
  parseIntent,
  listDirectory,
  getDiskUsage,
  getClusterStatus,
  getContentSummary,
};