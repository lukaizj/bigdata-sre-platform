const WebSocket = require('ws');
const crypto = require('crypto');
const logger = require('./logger');
const config = require('./config');
const MessageHandler = require('./message-handler');

class DingTalkStreamClient {
  constructor() {
    this.ws = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
    this.messageHandler = null;
  }

  /**
   * Initialize the stream client
   */
  async init() {
    const cfg = config.get();
    this.messageHandler = new MessageHandler(cfg.backendUrl, cfg.apiKey);
    logger.info('DingTalk Stream Client initialized');
  }

  /**
   * Start the stream client
   */
  async start() {
    await this.init();
    await this.connect();
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
      this.ws.close();
      this.ws = null;
    }

    this.connected = false;
    logger.info('DingTalk Stream Client stopped');
  }

  /**
   * Connect to DingTalk Stream endpoint
   */
  async connect() {
    try {
      const cfg = config.get();

      // Get DingTalk Stream endpoint URL
      const endpoint = await this.getStreamEndpoint(cfg.clientId, cfg.clientSecret);

      logger.info('Connecting to DingTalk Stream endpoint:', { endpoint });

      this.ws = new WebSocket(endpoint);

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

    } catch (error) {
      logger.error('Failed to connect:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Get DingTalk Stream endpoint URL
   * Reference: https://open.dingtalk.com/document/isv/stream-mode
   */
  async getStreamEndpoint(clientId, clientSecret) {
    try {
      // DingTalk Stream mode uses WebSocket endpoint
      // You need to get a ticket from DingTalk API first
      const ticket = await this.getTicket(clientId, clientSecret);

      // Construct WebSocket URL
      // Note: The actual endpoint URL may vary based on DingTalk's API version
      // This is a placeholder implementation
      const wsUrl = `wss://api.dingtalk.com/v1.0/gateway/connections/websocket?ticket=${ticket}`;

      return wsUrl;

    } catch (error) {
      logger.error('Failed to get stream endpoint:', error);
      throw error;
    }
  }

  /**
   * Get ticket for WebSocket connection
   * This is a placeholder implementation - you need to implement this based on
   * DingTalk's official API documentation
   */
  async getTicket(clientId, clientSecret) {
    // TODO: Implement ticket retrieval from DingTalk API
    // Reference: https://open.dingtalk.com/document/isv/stream-mode

    // For now, return a placeholder
    // In production, you would:
    // 1. Call DingTalk API to register your client
    // 2. Get a ticket or token for WebSocket connection
    // 3. Use the ticket in the WebSocket URL

    logger.warn('getTicket() not implemented - returning placeholder');
    return 'placeholder-ticket';
  }

  /**
   * Handle WebSocket open event
   */
  async onOpen() {
    logger.info('WebSocket connection opened');
    this.connected = true;
    this.reconnectAttempts = 0;

    // Start heartbeat
    this.startHeartbeat();

    // Update status
    if (this.messageHandler) {
      try {
        await this.messageHandler.apiClient.updateStatus('connected', {
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('Failed to update status:', error);
      }
    }
  }

  /**
   * Handle WebSocket message event
   */
  async onMessage(data) {
    try {
      const message = JSON.parse(data.toString());
      logger.debug('Received message:', message);

      // Handle different message types
      switch (message.type) {
        case 'message':
          // Handle chat message
          if (this.messageHandler) {
            await this.messageHandler.handleMessage(message.data);
          }
          break;

        case 'pong':
          // Heartbeat response
          logger.debug('Received pong');
          break;

        case 'system':
          // System message
          logger.info('System message:', message.data);
          break;

        default:
          logger.warn('Unknown message type:', message.type);
      }

    } catch (error) {
      logger.error('Failed to process message:', error);
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

    // Update status
    if (this.messageHandler) {
      try {
        await this.messageHandler.apiClient.updateStatus('disconnected', {
          code: code,
          reason: reason.toString(),
          timestamp: new Date().toISOString()
        });
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

    // Update status
    if (this.messageHandler) {
      try {
        await this.messageHandler.apiClient.updateStatus('error', {
          error: error.message,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        logger.error('Failed to update status:', err);
      }
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  startHeartbeat() {
    const cfg = config.get();
    const interval = cfg.heartbeatInterval || 30000;

    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.connected) {
        logger.debug('Sending heartbeat ping');
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, interval);

    logger.info('Heartbeat started', { interval: interval });
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  scheduleReconnect() {
    const cfg = config.get();
    const initialDelay = cfg.reconnectInitialDelay || 1000;
    const maxDelay = cfg.reconnectMaxDelay || 60000;

    // Calculate delay with exponential backoff
    const delay = Math.min(
      initialDelay * Math.pow(2, this.reconnectAttempts),
      maxDelay
    );

    logger.info('Scheduling reconnection:', {
      attempt: this.reconnectAttempts + 1,
      delay: delay
    });

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.messageHandler.apiClient.updateStatus('reconnecting', {
          attempt: this.reconnectAttempts + 1,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('Failed to update status:', error);
      }

      this.reconnectAttempts++;
      await this.connect();
    }, delay);
  }

  /**
   * Send message to DingTalk
   * @param {string} conversationId - Conversation ID
   * @param {Object} message - Message to send
   */
  async sendMessage(conversationId, message) {
    if (!this.ws || !this.connected) {
      throw new Error('WebSocket not connected');
    }

    try {
      const payload = {
        type: 'message',
        conversationId: conversationId,
        data: message
      };

      this.ws.send(JSON.stringify(payload));
      logger.debug('Message sent:', { conversationId: conversationId });

    } catch (error) {
      logger.error('Failed to send message:', error);
      throw error;
    }
  }
}

module.exports = DingTalkStreamClient;