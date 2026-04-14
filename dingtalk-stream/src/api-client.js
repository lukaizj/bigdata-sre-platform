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
   * @param {Object} message - DingTalk message object
   */
  async sendMessage(message) {
    try {
      logger.debug('Sending message to backend:', { message });

      const response = await this.client.post('/api/dingtalk/chat', {
        message: message
      });

      logger.debug('Message sent to backend successfully:', {
        messageId: response.data?.data?.messageId
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to send message to backend:', error);
      throw error;
    }
  }

  /**
   * Update stream client status
   * @param {string} status - Status (connected, disconnected, reconnecting, error)
   * @param {Object} metadata - Additional metadata
   */
  async updateStatus(status, metadata = {}) {
    try {
      logger.debug('Updating status:', { status, metadata });

      const response = await this.client.post('/api/dingtalk/update-status', {
        status: status,
        metadata: metadata,
        timestamp: new Date().toISOString()
      });

      logger.debug('Status updated successfully');
      return response.data;
    } catch (error) {
      logger.error('Failed to update status:', error);
      throw error;
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