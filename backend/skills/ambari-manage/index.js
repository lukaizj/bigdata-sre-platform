const axios = require('axios');
const config = require('../../src/config');

/**
 * Ambari 管理技能
 */
async function execute(message, skillConfig, previousResult) {
  const ambariUrl = skillConfig.endpoint || config.ambari.url;
  const username = skillConfig.username || config.ambari.username;
  const password = skillConfig.password || config.ambari.password;
  const clusterName = skillConfig.clusterName || config.ambari.clusterName;
  const timeout = skillConfig.timeout || 60000;

  const intent = parseIntent(message);

  try {
    let result;

    switch (intent.action) {
      case 'service_status':
      case 'services':
        result = await getServices(ambariUrl, username, password, clusterName, timeout);
        break;
      case 'start_service':
        if (!intent.service) {
          return { error: '请指定要启动的服务名称', data: null };
        }
        result = await startService(ambariUrl, username, password, clusterName, intent.service, timeout);
        break;
      case 'stop_service':
        if (!intent.service) {
          return { error: '请指定要停止的服务名称', data: null };
        }
        result = await stopService(ambariUrl, username, password, clusterName, intent.service, timeout);
        break;
      case 'restart_service':
        if (!intent.service) {
          return { error: '请指定要重启的服务名称', data: null };
        }
        result = await restartService(ambariUrl, username, password, clusterName, intent.service, timeout);
        break;
      case 'alerts':
        result = await getAlerts(ambariUrl, username, password, clusterName, timeout);
        break;
      case 'hosts':
        result = await getHosts(ambariUrl, username, password, clusterName, timeout);
        break;
      default:
        result = await getServices(ambariUrl, username, password, clusterName, timeout);
    }

    return { data: result };
  } catch (err) {
    return { error: `Ambari 操作失败: ${err.message}`, data: null };
  }
}

function parseIntent(message) {
  const lower = message.toLowerCase();

  // 服务名提取
  const servicePatterns = ['hdfs', 'yarn', 'hbase', 'hive', 'spark', 'kafka', 'zookeeper', 'hadoop'];
  let service = null;
  for (const s of servicePatterns) {
    if (lower.includes(s)) {
      service = s.toUpperCase();
      if (s === 'hadoop') service = 'HDFS';
      break;
    }
  }

  if (lower.includes('启动') || lower.includes('start')) {
    return { action: 'start_service', service };
  }
  if (lower.includes('停止') || lower.includes('stop')) {
    return { action: 'stop_service', service };
  }
  if (lower.includes('重启') || lower.includes('restart')) {
    return { action: 'restart_service', service };
  }
  if (lower.includes('告警') || lower.includes('alert')) {
    return { action: 'alerts', service };
  }
  if (lower.includes('主机') || lower.includes('host') || lower.includes('节点')) {
    return { action: 'hosts', service };
  }

  return { action: 'service_status', service };
}

async function ambariRequest(method, url, auth, timeout, data = null) {
  const config = {
    method,
    url,
    auth,
    timeout,
    headers: {
      'X-Requested-By': 'ambari',
    },
  };
  if (data) {
    config.data = data;
  }
  const response = await axios(config);
  return response.data;
}

async function getServices(ambariUrl, username, password, clusterName, timeout) {
  const url = `${ambariUrl}/api/v1/clusters/${clusterName}/services?fields=ServiceInfo/state,ServiceInfo/service_name,ServiceInfo/display_name`;
  const data = await ambariRequest('GET', url, { username, password }, timeout);
  return data.items?.map(item => ({
    name: item.ServiceInfo.service_name,
    displayName: item.ServiceInfo.display_name,
    state: item.ServiceInfo.state,
  })) || [];
}

async function startService(ambariUrl, username, password, clusterName, serviceName, timeout) {
  const url = `${ambariUrl}/api/v1/clusters/${clusterName}/services/${serviceName}`;
  const data = await ambariRequest('PUT', url, { username, password }, timeout, {
    RequestInfo: { context: `Start ${serviceName}` },
    Body: { ServiceInfo: { state: 'STARTED' } },
  });
  return { message: `服务 ${serviceName} 启动请求已提交`, requestId: data.href };
}

async function stopService(ambariUrl, username, password, clusterName, serviceName, timeout) {
  const url = `${ambariUrl}/api/v1/clusters/${clusterName}/services/${serviceName}`;
  const data = await ambariRequest('PUT', url, { username, password }, timeout, {
    RequestInfo: { context: `Stop ${serviceName}` },
    Body: { ServiceInfo: { state: 'INSTALLED' } },
  });
  return { message: `服务 ${serviceName} 停止请求已提交`, requestId: data.href };
}

async function restartService(ambariUrl, username, password, clusterName, serviceName, timeout) {
  // 先停止再启动
  await stopService(ambariUrl, username, password, clusterName, serviceName, timeout);
  const result = await startService(ambariUrl, username, password, clusterName, serviceName, timeout);
  return { message: `服务 ${serviceName} 重启请求已提交`, ...result };
}

async function getAlerts(ambariUrl, username, password, clusterName, timeout) {
  const url = `${ambariUrl}/api/v1/clusters/${clusterName}/alerts?Alert/state=CRITICAL|WARNING`;
  const data = await ambariRequest('GET', url, { username, password }, timeout);
  return data.items?.map(item => ({
    name: item.Alert.name,
    state: item.Alert.state,
    service: item.Alert.service_name,
    message: item.Alert.text,
    timestamp: item.Alert.latest_timestamp,
  })) || [];
}

async function getHosts(ambariUrl, username, password, clusterName, timeout) {
  const url = `${ambariUrl}/api/v1/clusters/${clusterName}/hosts?fields=Hosts/host_name,Hosts/host_status,Hosts/ip`;
  const data = await ambariRequest('GET', url, { username, password }, timeout);
  return data.items?.map(item => ({
    hostname: item.Hosts.host_name,
    ip: item.Hosts.ip,
    status: item.Hosts.host_status,
  })) || [];
}

module.exports = {
  execute,
  parseIntent,
  getServices,
  startService,
  stopService,
  restartService,
  getAlerts,
  getHosts,
};