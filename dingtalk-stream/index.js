const dotenv = require('dotenv');
const path = require('path');
const http = require('http');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const logger = require('./src/logger');
const config = require('./src/config');
const DingTalkStreamClient = require('./src/client');

// 全局客户端实例
let client = null;
let healthServer = null;

/**
 * 创建健康检查 HTTP 服务器
 * 用于 Kubernetes/Docker 监控和状态查询
 */
function createHealthServer(port) {
  const server = http.createServer((req, res) => {
    if (req.url === '/health' || req.url === '/') {
      const healthStatus = {
        status: client && client.connected ? 'healthy' : 'unhealthy',
        service: 'dingtalk-stream',
        connected: client ? client.connected : false,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        reconnectAttempts: client ? client.reconnectAttempts : 0
      };

      const statusCode = healthStatus.status === 'healthy' ? 200 : 503;

      res.writeHead(statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(healthStatus, null, 2));

    } else if (req.url === '/metrics') {
      // 简单的指标输出（可用于 Prometheus）
      const metrics = {
        uptime_seconds: process.uptime(),
        connected: client ? client.connected : false,
        reconnect_attempts: client ? client.reconnectAttempts : 0,
        memory_usage_bytes: process.memoryUsage().heapUsed,
        timestamp: new Date().toISOString()
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(metrics, null, 2));

    } else if (req.url === '/ready') {
      // 就绪检查（Kubernetes Ready Probe）
      const ready = client && client.connected;

      res.writeHead(ready ? 200 : 503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ready }, null, 2));

    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }, null, 2));
    }
  });

  server.listen(port, () => {
    logger.info(`Health check server started on port ${port}`);
  });

  return server;
}

async function main() {
  logger.info('========================================');
  logger.info('DingTalk Stream Service');
  logger.info('Version: 1.0.0');
  logger.info('========================================');

  try {
    // Load configuration
    await config.load();
    const cfg = config.get();
    logger.info('Configuration loaded successfully', {
      clientId: cfg.clientId ? `${cfg.clientId.slice(0, 8)}...` : 'not set',
      backendUrl: cfg.backendUrl
    });

    // 验证配置
    const validation = config.validate();
    if (!validation.valid) {
      logger.error('Configuration validation failed:', validation.errors);
      process.exit(1);
    }

    // 启动健康检查服务器
    const healthPort = parseInt(process.env.HEALTH_PORT || '3001', 10);
    healthServer = createHealthServer(healthPort);

    // Create stream client
    client = new DingTalkStreamClient();

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down gracefully...');
      await shutdown();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down gracefully...');
      await shutdown();
      process.exit(0);
    });

    // Start the client
    await client.start();
    logger.info('DingTalk Stream Service started successfully');

  } catch (error) {
    logger.error('Failed to start DingTalk Stream Service:', error);

    // 尝试清理
    await shutdown();

    process.exit(1);
  }
}

/**
 * 优雅关闭
 */
async function shutdown() {
  logger.info('Shutting down...');

  // 停止 Stream 客户端
  if (client) {
    try {
      await client.stop();
      logger.info('Stream client stopped');
    } catch (error) {
      logger.error('Error stopping stream client:', error);
    }
  }

  // 关闭健康检查服务器
  if (healthServer) {
    healthServer.close();
    logger.info('Health server closed');
  }

  logger.info('Shutdown complete');
}

// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
  logger.error('Uncaught Exception:', {
    error: error.message,
    stack: error.stack
  });

  try {
    await shutdown();
  } catch (e) {
    logger.error('Error during shutdown:', e);
  }

  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  logger.error('Unhandled Rejection:', {
    promise: promise,
    reason: reason
  });

  // 不立即退出，允许服务继续运行
  // 如果是关键错误，可以在 shutdown 中处理
});

main();