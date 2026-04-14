const axios = require('axios');
const logger = require('./logger');

class ApiClient {
  constructor(backendUrl, apiKey) {
    this.backendUrl = backendUrl;
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: backendUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use(
      (config) => {
        if (this.apiKey) {
          config.headers.Authorization = `Bearer ${this.apiKey}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('API request failed:', {
          url: error.config?.url,
          status: error.response?.status,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Send message to backend for processing
   * Backend API expects: { userId, userName, content, conversationId }
   */
  async sendMessage(message) {
    try {
      logger.debug('Sending message to backend:', {
        conversationId: message.conversationId,
        senderId: message.senderId
      });

      // 转换为 backend API 期望的格式
      const payload = {
        userId: message.senderId,
        userName: message.senderNick,
        content: message.content?.text || '',
        conversationId: message.conversationId,
        messageType: message.msgtype
      };

      const response = await this.client.post('/api/dingtalk/chat', payload);

      logger.debug('Message processed by backend:', {
        success: response.data?.success
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to send message to backend:', error);
      throw error;
    }
  }

  /**
   * Update stream client status
   * Backend API expects: { connected, error }
   */
  async updateStatus(connected, error = null) {
    try {
      logger.debug('Updating status:', { connected, error });

      const response = await this.client.post('/api/dingtalk/update-status', {
        connected: connected,
        error: error
      });

      logger.debug('Status updated successfully');
      return response.data;
    } catch (error) {
      logger.error('Failed to update status:', error);
      // 不抛出错误，状态更新失败不应阻塞主流程
    }
  }

  /**
   * Get configuration from backend
   */
  async getConfig() {
    try {
      const response = await this.client.get('/api/dingtalk/config');
      return response.data;
    } catch (error) {
      logger.error('Failed to get config from backend:', error);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      logger.error('Health check failed:', error);
      throw error;
    }
  }
}

module.exports = ApiClient;