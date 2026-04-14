const WebSocket = require('ws');
const axios = require('axios');
const crypto = require('crypto');
const logger = require('./logger');
const config = require('./config');
const MessageHandler = require('./message-handler');

/**
 * DingTalk Stream Mode Client
 *
 * Stream 模式流程：
 * 1. 使用 Client ID + Client Secret 获取 accessToken
 * 2. 使用 accessToken 注册 Stream 客户端获取 ticket
 * 3. 使用 ticket 建立 WebSocket 长连接
 * 4. 通过 WebSocket 接收消息，回复消息通过 HTTP API
 *
 * 参考：https://open.dingtalk.com/document/isv/stream-mode
 */
class DingTalkStreamClient {
  constructor() {
    this.ws = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
    this.messageHandler = null;
    this.accessToken = null;
    this.tokenExpireTime = null;
    this.subscriptions = new Map(); // 会话订阅映射
  }

  /**
   * Initialize the stream client
   */
  async init() {
    const cfg = config.get();
    this.messageHandler = new MessageHandler(cfg.backendUrl, cfg.apiKey);
    logger.info('DingTalk Stream Client initialized', {
      clientId: cfg.clientId ? `${cfg.clientId.slice(0, 8)}...` : 'not set'
    });
  }

  /**
   * Start the stream client
   */
  async start() {
    try {
      await this.init();
      await this.connect();
    } catch (error) {
      logger.error('Failed to start stream client:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Stop the stream client
   */
  async stop() {
    logger.info('Stopping DingTalk Stream Client...');

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client shutting down');
      this.ws = null;
    }

    this.connected = false;

    // 更新 backend 状态
    if (this.messageHandler) {
      try {
        await this.messageHandler.apiClient.updateStatus(false, 'Client stopped');
      } catch (error) {
        logger.error('Failed to update status:', error);
      }
    }

    logger.info('DingTalk Stream Client stopped');
  }

  /**
   * Get DingTalk accessToken using Client ID and Client Secret
   * API: POST https://api.dingtalk.com/v1.0/oauth2/accessToken
   */
  async getAccessToken(clientId, clientSecret) {
    try {
      // 如果有缓存的 token 且未过期，直接返回
      if (this.accessToken && this.tokenExpireTime && Date.now() < this.tokenExpireTime) {
        logger.debug('Using cached accessToken');
        return this.accessToken;
      }

      logger.info('Requesting new accessToken from DingTalk...');

      // 钉钉 OAuth2 API 使用 appKey/appSecret 参数名
      const response = await axios.post(
        'https://api.dingtalk.com/v1.0/oauth2/accessToken',
        {
          appKey: clientId,
          appSecret: clientSecret
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (response.data && response.data.accessToken) {
        this.accessToken = response.data.accessToken;
        // 设置过期时间（提前 5 分钟过期以避免边界问题）
        this.tokenExpireTime = Date.now() + (response.data.expireIn - 300) * 1000;

        logger.info('AccessToken obtained successfully', {
          expireIn: response.data.expireIn
        });

        return this.accessToken;
      } else {
        throw new Error('Invalid response from DingTalk API: missing accessToken');
      }

    } catch (error) {
      logger.error('Failed to get accessToken:', {
        error: error.message,
        response: error.response?.data
      });
      throw new Error(`Failed to get accessToken: ${error.message}`);
    }
  }

  /**
   * Register Stream client and get ticket for WebSocket connection
   * API: POST https://api.dingtalk.com/v1.0/gateway/connections/stream
   */
  async getStreamTicket(accessToken, clientId) {
    try {
      logger.info('Registering Stream client to get ticket...');

      const response = await axios.post(
        'https://api.dingtalk.com/v1.0/gateway/connections/stream',
        {
          clientId: clientId,
          type: 'CALLBACK'  // 使用回调模式，消息通过 WebSocket 接收
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-acs-dingtalk-access-token': accessToken
          },
          timeout: 10000
        }
      );

      if (response.data && response.data.ticket) {
        logger.info('Stream ticket obtained successfully', {
          endpoint: response.data.endpoint
        });

        return {
          ticket: response.data.ticket,
          endpoint: response.data.endpoint || 'wss://stream.dingtalk.com/stream'
        };
      } else {
        throw new Error('Invalid response from DingTalk API: missing ticket');
      }

    } catch (error) {
      logger.error('Failed to get stream ticket:', {
        error: error.message,
        response: error.response?.data
      });
      throw new Error(`Failed to get stream ticket: ${error.message}`);
    }
  }

  /**
   * Connect to DingTalk Stream endpoint
   */
  async connect() {
    try {
      const cfg = config.get();

      // Step 1: 获取 accessToken
      const accessToken = await this.getAccessToken(cfg.clientId, cfg.clientSecret);

      // Step 2: 获取 stream ticket
      const { ticket, endpoint } = await this.getStreamTicket(accessToken, cfg.clientId);

      // Step 3: 构建 WebSocket URL
      const wsUrl = `${endpoint}?ticket=${ticket}`;

      logger.info('Connecting to DingTalk Stream WebSocket...', {
        endpoint: endpoint
      });

      // Step 4: 建立 WebSocket 连接
      this.ws = new WebSocket(wsUrl, {
        headers: {
          'x-acs-dingtalk-access-token': accessToken
        }
      });

      // 设置 WebSocket 事件处理
      this.setupWebSocketHandlers();

    } catch (error) {
      logger.error('Failed to connect:', error);

      // 更新 backend 状态
      if (this.messageHandler) {
        try {
          await this.messageHandler.apiClient.updateStatus(false, error.message);
        } catch (err) {
          logger.error('Failed to update status:', err);
        }
      }

      this.scheduleReconnect();
    }
  }

  /**
   * Setup WebSocket event handlers
   */
  setupWebSocketHandlers() {
    // Connection opened
    this.ws.on('open', () => {
      this.onOpen();
    });

    // Message received
    this.ws.on('message', (data) => {
      this.onMessage(data);
    });

    // Connection closed
    this.ws.on('close', (code, reason) => {
      this.onClose(code, reason);
    });

    // Connection error
    this.ws.on('error', (error) => {
      this.onError(error);
    });

    // Ping/Pong handling
    this.ws.on('ping', () => {
      this.ws.pong();
    });
  }

  /**
   * Handle WebSocket open event
   */
  async onOpen() {
    logger.info('WebSocket connection opened successfully');
    this.connected = true;
    this.reconnectAttempts = 0;

    // Start heartbeat
    this.startHeartbeat();

    // 更新 backend 状态
    if (this.messageHandler) {
      try {
        await this.messageHandler.apiClient.updateStatus(true);
      } catch (error) {
        logger.error('Failed to update status:', error);
      }
    }
  }

  /**
   * Handle WebSocket message event
   * DingTalk Stream 消息格式参考：https://open.dingtalk.com/document/isv/stream-mode
   */
  async onMessage(data) {
    try {
      const rawData = data.toString();
      logger.debug('Received raw message:', { data: rawData.slice(0, 200) });

      // DingTalk Stream 消息是纯文本格式，需要解析
      // 格式：topic\nmessageId\ntimestamp\nheaders\nbody
      const message = this.parseDingTalkMessage(rawData);

      if (!message) {
        logger.warn('Failed to parse message, skipping');
        return;
      }

      logger.info('Parsed DingTalk message:', {
        topic: message.topic,
        messageId: message.messageId
      });

      // 处理不同类型的消息
      if (message.topic === 'robottalkv3.message') {
        // 机器人消息
        await this.handleRobotMessage(message);
      } else if (message.topic === 'system') {
        // 系统消息
        logger.info('System message received:', message.body);
      } else {
        logger.warn('Unknown message topic:', message.topic);
      }

    } catch (error) {
      logger.error('Failed to process message:', error);
    }
  }

  /**
   * Parse DingTalk Stream message format
   * Format: topic\nmessageId\nbornTimestamp\npersistentTimestamp\nheaders\nbody
   */
  parseDingTalkMessage(rawData) {
    try {
      const parts = rawData.split('\n');

      if (parts.length < 6) {
        logger.warn('Invalid message format, parts count:', parts.length);
        return null;
      }

      const topic = parts[0];
      const messageId = parts[1];
      const bornTimestamp = parseInt(parts[2]);
      const persistentTimestamp = parseInt(parts[3]);
      const headersJson = parts[4];
      const bodyJson = parts[5];

      // 解析 headers 和 body
      let headers = {};
      let body = {};

      try {
        headers = JSON.parse(headersJson);
      } catch (e) {
        logger.warn('Failed to parse headers:', headersJson);
      }

      try {
        body = JSON.parse(bodyJson);
      } catch (e) {
        logger.warn('Failed to parse body:', bodyJson);
      }

      return {
        topic,
        messageId,
        bornTimestamp,
        persistentTimestamp,
        headers,
        body
      };

    } catch (error) {
      logger.error('Failed to parse DingTalk message:', error);
      return null;
    }
  }

  /**
   * Handle robot message from DingTalk
   */
  async handleRobotMessage(message) {
    try {
      const body = message.body;

      logger.info('Processing robot message:', {
        conversationId: body.conversationId,
        senderNick: body.senderNick,
        msgtype: body.msgtype
      });

      // 调用 backend 处理消息
      const response = await this.messageHandler.handleMessage({
        msgtype: body.msgtype,
        conversationId: body.conversationId,
        senderId: body.senderId,
        senderCorpId: body.senderCorpId,
        senderNick: body.senderNick,
        senderDingtalkId: body.senderDingtalkId,
        createTime: body.createTime,
        text: body.text,
        content: this.messageHandler.extractMessageContent(body)
      });

      // 发送回复
      if (response && response.response) {
        await this.sendReply(message.messageId, body.conversationId, response.response);
      }

    } catch (error) {
      logger.error('Failed to handle robot message:', error);
    }
  }

  /**
   * Send reply message to DingTalk via HTTP API
   * API: POST https://api.dingtalk.com/v1.0/robot/oToMessages/batchSend
   */
  async sendReply(messageId, conversationId, content) {
    try {
      if (!this.accessToken) {
        await this.getAccessToken(config.get().clientId, config.get().clientSecret);
      }

      // 格式化回复消息
      const formattedReply = this.messageHandler.formatReply(content);

      logger.info('Sending reply to DingTalk...', {
        conversationId: conversationId,
        msgtype: formattedReply.msgtype
      });

      // 钉钉单聊消息发送 API
      const response = await axios.post(
        'https://api.dingtalk.com/v1.0/robot/oToMessages/batchSend',
        {
          robotCode: config.get().clientId,
          userIds: [conversationId.split(':')[1]], // 从 conversationId 解析 userId
          msgKey: 'sampleText',
          msgParam: JSON.stringify(formattedReply)
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-acs-dingtalk-access-token': this.accessToken
          },
          timeout: 10000
        }
      );

      if (response.data && response.data.success) {
        logger.info('Reply sent successfully');
      } else {
        logger.warn('Reply send result:', response.data);
      }

    } catch (error) {
      logger.error('Failed to send reply:', {
        error: error.message,
        response: error.response?.data
      });
    }
  }

  /**
   * Handle WebSocket close event
   */
  async onClose(code, reason) {
    logger.warn('WebSocket connection closed:', {
      code: code,
      reason: reason.toString()
    });

    this.connected = false;

    // Stop heartbeat
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    // 更新 backend 状态
    if (this.messageHandler) {
      try {
        await this.messageHandler.apiClient.updateStatus(false, `Connection closed: ${code}`);
      } catch (error) {
        logger.error('Failed to update status:', error);
      }
    }

    // Schedule reconnection
    this.scheduleReconnect();
  }

  /**
   * Handle WebSocket error event
   */
  async onError(error) {
    logger.error('WebSocket error:', error);

    // 更新 backend 状态
    if (this.messageHandler) {
      try {
        await this.messageHandler.apiClient.updateStatus(false, error.message);
      } catch (err) {
        logger.error('Failed to update status:', err);
      }
    }
  }

  /**
   * Start heartbeat to keep connection alive
   * DingTalk Stream 需要定期发送心跳保持连接
   */
  startHeartbeat() {
    const cfg = config.get();
    const interval = cfg.heartbeatInterval || 30000;

    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.connected) {
        logger.debug('Sending heartbeat');

        // DingTalk Stream 心跳是发送空消息
        this.ws.send('');
      }
    }, interval);

    logger.info('Heartbeat started', { interval: interval });
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  scheduleReconnect() {
    // 避免重复调度
    if (this.reconnectTimer) {
      return;
    }

    const cfg = config.get();
    const initialDelay = cfg.reconnectInitialDelay || 1000;
    const maxDelay = cfg.reconnectMaxDelay || 60000;

    // Calculate delay with exponential backoff
    const delay = Math.min(
      initialDelay * Math.pow(2, Math.min(this.reconnectAttempts, 10)),
      maxDelay
    );

    logger.info('Scheduling reconnection:', {
      attempt: this.reconnectAttempts + 1,
      delay: delay
    });

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;

      // 更新 backend 状态
      if (this.messageHandler) {
        try {
          await this.messageHandler.apiClient.updateStatus(false, `Reconnecting (attempt ${this.reconnectAttempts + 1})`);
        } catch (error) {
          logger.error('Failed to update status:', error);
        }
      }

      this.reconnectAttempts++;

      // 清除旧的 accessToken，强制重新获取
      this.accessToken = null;
      this.tokenExpireTime = null;

      await this.connect();
    }, delay);
  }
}

module.exports = DingTalkStreamClient;