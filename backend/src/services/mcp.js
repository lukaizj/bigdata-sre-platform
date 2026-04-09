const { spawn } = require('child_process');
const path = require('path');

// MCP 工具路径映射
const MCP_TOOLS = {
  'spark-history-cli': {
    command: 'spark-history-cli',
    args: ['--json'],
    cwd: null,
  },
  'hadoop-mcp': {
    command: 'python',
    args: ['-m', 'src.server'],
    cwd: '/opt/hadoop-mcp',
  },
  'ambari-mcp': {
    command: 'node',
    args: ['dist/index.js'],
    cwd: '/opt/ambari-mcp-server',
  },
};

/**
 * 通过 MCP 工具执行查询
 * @param {string} toolId - MCP 工具 ID
 * @param {string} action - 操作类型
 * @param {object} params - 参数
 * @returns {Promise<{data: any, error: string|null}>}
 */
async function executeMCP(toolId, action, params = {}) {
  const tool = MCP_TOOLS[toolId];

  if (!tool) {
    return { data: null, error: `未知的 MCP 工具: ${toolId}` };
  }

  // 对于 spark-history-cli，直接调用 CLI
  if (toolId === 'spark-history-cli') {
    return executeSparkCLI(action, params);
  }

  // 其他 MCP 工具暂返回提示
  return {
    data: null,
    error: `MCP 工具 ${toolId} 尚未集成，请使用 Skills 模式`,
  };
}

/**
 * 执行 Spark History CLI
 */
async function executeSparkCLI(action, params) {
  return new Promise((resolve) => {
    const args = ['--json'];

    switch (action) {
      case 'apps':
        args.push('apps');
        if (params.status) {
          args.push('--status', params.status);
        }
        if (params.limit) {
          args.push('--limit', String(params.limit));
        }
        break;
      case 'app':
        if (!params.appId) {
          resolve({ data: null, error: '需要提供 appId' });
          return;
        }
        args.push('app', params.appId);
        break;
      case 'jobs':
        if (!params.appId) {
          resolve({ data: null, error: '需要提供 appId' });
          return;
        }
        args.push('--app-id', params.appId, 'jobs');
        break;
      case 'stages':
        if (!params.appId) {
          resolve({ data: null, error: '需要提供 appId' });
          return;
        }
        args.push('--app-id', params.appId, 'stages');
        break;
      case 'executors':
        if (!params.appId) {
          resolve({ data: null, error: '需要提供 appId' });
          return;
        }
        args.push('--app-id', params.appId, 'executors', '--all');
        break;
      default:
        args.push('apps');
    }

    const child = spawn('spark-history-cli', args, {
      cwd: '/opt/spark-history-cli',
      env: {
        ...process.env,
        SPARK_HISTORY_SERVER: params.serverUrl || process.env.SPARK_HISTORY_SERVER || 'http://localhost:18080',
      },
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code !== 0) {
        resolve({ data: null, error: stderr || `命令执行失败，退出码: ${code}` });
        return;
      }

      try {
        const data = JSON.parse(stdout);
        resolve({ data, error: null });
      } catch (e) {
        resolve({ data: stdout, error: null });
      }
    });

    child.on('error', (err) => {
      resolve({ data: null, error: `执行失败: ${err.message}` });
    });
  });
}

/**
 * 解析 MCP 模式的意图
 */
function parseMCPIntent(message) {
  const lower = message.toLowerCase();

  // Spark 相关
  if (lower.includes('spark')) {
    if (lower.includes('应用') || lower.includes('app')) {
      return { tool: 'spark-history-cli', action: 'apps', params: {} };
    }
    if (lower.includes('job')) {
      return { tool: 'spark-history-cli', action: 'jobs', params: {} };
    }
    if (lower.includes('stage')) {
      return { tool: 'spark-history-cli', action: 'stages', params: {} };
    }
    if (lower.includes('executor')) {
      return { tool: 'spark-history-cli', action: 'executors', params: {} };
    }
    return { tool: 'spark-history-cli', action: 'apps', params: {} };
  }

  // Hadoop 相关
  if (lower.includes('hdfs') || lower.includes('hadoop')) {
    return { tool: 'hadoop-mcp', action: 'query', params: {} };
  }

  // Ambari 相关
  if (lower.includes('ambari') || lower.includes('服务')) {
    return { tool: 'ambari-mcp', action: 'status', params: {} };
  }

  return null;
}

module.exports = {
  executeMCP,
  executeSparkCLI,
  parseMCPIntent,
  MCP_TOOLS,
  getMCPTools: () => Object.keys(MCP_TOOLS).map(id => ({
    id,
    name: id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    type: 'mcp',
    description: getMCPDescription(id),
  })),
};

function getMCPDescription(id) {
  const descriptions = {
    'spark-history-cli': '查询 Spark History Server 应用、任务、执行器信息',
    'hadoop-mcp': '查询 HDFS、YARN 等 Hadoop 组件状态',
    'ambari-mcp': '通过 Ambari API 管理集群服务',
  };
  return descriptions[id] || 'MCP 工具';
}