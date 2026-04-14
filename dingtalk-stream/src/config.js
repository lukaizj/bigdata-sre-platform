const axios = require('axios');
const logger = require('./logger');

class Config {
  constructor() {
    this.config = {};
    this.loaded = false;
  }

  /**
   * Load configuration from backend API or environment variables
   */
  async load() {
    if (this.loaded) {
      return this.config;
    }

    // First, try to fetch from backend API
    try {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
      const apiKey = process.env.BACKEND_API_KEY;

      if (apiKey) {
        logger.info('Fetching configuration from backend API...');
        const response = await axios.get(`${backendUrl}/api/dingtalk/config`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        });

        if (response.data && response.data.success) {
          this.config = {
            clientId: response.data.data.clientId || process.env.DINGTALK_CLIENT_ID,
            clientSecret: response.data.data.clientSecret || process.env.DINGTALK_CLIENT_SECRET,
            backendUrl: backendUrl,
            apiKey: apiKey,
            reconnectInitialDelay: parseInt(process.env.RECONNECT_INITIAL_DELAY) || 1000,
            reconnectMaxDelay: parseInt(process.env.RECONNECT_MAX_DELAY) || 60000,
            heartbeatInterval: parseInt(process.env.HEARTBEAT_INTERVAL) || 30000
          };
          logger.info('Configuration loaded from backend API');
        } else {
          throw new Error('Invalid response from backend API');
        }
      } else {
        // Fallback to environment variables
        logger.info('Loading configuration from environment variables...');
        this.config = {
          clientId: process.env.DINGTALK_CLIENT_ID,
          clientSecret: process.env.DINGTALK_CLIENT_SECRET,
          backendUrl: backendUrl,
          apiKey: process.env.BACKEND_API_KEY,
          reconnectInitialDelay: parseInt(process.env.RECONNECT_INITIAL_DELAY) || 1000,
          reconnectMaxDelay: parseInt(process.env.RECONNECT_MAX_DELAY) || 60000,
          heartbeatInterval: parseInt(process.env.HEARTBEAT_INTERVAL) || 30000
        };
      }

      // Validate required configuration
      if (!this.config.clientId || !this.config.clientSecret) {
        throw new Error('Missing required configuration: DINGTALK_CLIENT_ID and DINGTALK_CLIENT_SECRET');
      }

      this.loaded = true;
      return this.config;

    } catch (error) {
      logger.warn('Failed to load config from backend API, falling back to environment variables:', error.message);

      // Fallback to environment variables
      this.config = {
        clientId: process.env.DINGTALK_CLIENT_ID,
        clientSecret: process.env.DINGTALK_CLIENT_SECRET,
        backendUrl: process.env.BACKEND_URL || 'http://localhost:8000',
        apiKey: process.env.BACKEND_API_KEY,
        reconnectInitialDelay: parseInt(process.env.RECONNECT_INITIAL_DELAY) || 1000,
        reconnectMaxDelay: parseInt(process.env.RECONNECT_MAX_DELAY) || 60000,
        heartbeatInterval: parseInt(process.env.HEARTBEAT_INTERVAL) || 30000
      };

      if (!this.config.clientId || !this.config.clientSecret) {
        throw new Error('Missing required configuration: DINGTALK_CLIENT_ID and DINGTALK_CLIENT_SECRET');
      }

      this.loaded = true;
      return this.config;
    }
  }

  /**
   * Get current configuration
   */
  get() {
    if (!this.loaded) {
      throw new Error('Configuration not loaded. Call load() first.');
    }
    return this.config;
  }

  /**
   * Reload configuration
   */
  async reload() {
    this.loaded = false;
    return await this.load();
  }

  /**
   * Validate configuration
   * @returns {Object} - Validation result { valid: boolean, errors: string[] }
   */
  validate() {
    const errors = [];

    if (!this.config.clientId) {
      errors.push('Missing DINGTALK_CLIENT_ID');
    }

    if (!this.config.clientSecret) {
      errors.push('Missing DINGTALK_CLIENT_SECRET');
    }

    if (!this.config.backendUrl) {
      errors.push('Missing BACKEND_URL');
    }

    if (this.config.clientId && this.config.clientId.length < 10) {
      errors.push('DINGTALK_CLIENT_ID appears to be invalid (too short)');
    }

    if (this.config.clientSecret && this.config.clientSecret.length < 10) {
      errors.push('DINGTALK_CLIENT_SECRET appears to be invalid (too short)');
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }
}

module.exports = new Config();