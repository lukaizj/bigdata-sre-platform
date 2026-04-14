const logger = require('./logger');
const ApiClient = require('./api-client');

class MessageHandler {
  constructor(backendUrl, apiKey) {
    this.apiClient = new ApiClient(backendUrl, apiKey);
  }

  /**
   * Handle incoming DingTalk message
   * @param {Object} message - Raw message from DingTalk Stream
   */
  async handleMessage(message) {
    try {
      logger.info('Processing incoming message:', {
        msgType: message.msgtype,
        conversationId: message.conversationId,
        senderNick: message.senderNick,
        createTime: message.createTime
      });

      // Validate message
      if (!this.validateMessage(message)) {
        logger.warn('Invalid message received, skipping:', message);
        return null;
      }

      // Extract message type and content
      const messageType = message.msgtype;
      const messageContent = this.extractMessageContent(message);

      logger.debug('Extracted message content:', {
        type: messageType,
        content: messageContent
      });

      // Send to backend for processing
      const response = await this.apiClient.sendMessage({
        msgType: messageType,
        conversationId: message.conversationId,
        senderId: message.senderId,
        senderNick: message.senderNick,
        senderCorpId: message.senderCorpId,
        senderDingtalkId: message.senderDingtalkId,
        content: messageContent,
        createTime: message.createTime,
        raw: message
      });

      logger.info('Message processed successfully:', {
        conversationId: message.conversationId,
        response: response
      });

      return response;

    } catch (error) {
      logger.error('Failed to handle message:', error);
      throw error;
    }
  }

  /**
   * Validate incoming message
   * @param {Object} message - Message to validate
   */
  validateMessage(message) {
    // Check required fields
    if (!message.msgtype) {
      logger.warn('Message missing msgtype');
      return false;
    }

    if (!message.conversationId) {
      logger.warn('Message missing conversationId');
      return false;
    }

    if (!message.senderId) {
      logger.warn('Message missing senderId');
      return false;
    }

    // Check if message is too old (older than 5 minutes)
    const messageTime = new Date(message.createTime).getTime();
    const currentTime = Date.now();
    const ageInMs = currentTime - messageTime;
    const maxAge = 5 * 60 * 1000; // 5 minutes

    if (ageInMs > maxAge) {
      logger.warn('Message too old, skipping:', {
        age: ageInMs,
        maxAge: maxAge
      });
      return false;
    }

    return true;
  }

  /**
   * Extract message content based on message type
   * @param {Object} message - DingTalk message
   */
  extractMessageContent(message) {
    const messageType = message.msgtype;

    switch (messageType) {
      case 'text':
        return {
          text: message.text?.content || message.text?.textContent || ''
        };

      case 'picture':
        return {
          downloadCode: message.picture?.downloadCode,
          picURL: message.picture?.picURL
        };

      case 'richText':
        return {
          content: message.richText?.content || []
        };

      case 'audio':
        return {
          duration: message.audio?.duration,
          downloadCode: message.audio?.downloadCode
        };

      case 'file':
        return {
          fileName: message.file?.fileName,
          fileSize: message.file?.fileSize,
          downloadCode: message.file?.downloadCode,
          fileType: message.file?.fileType
        };

      case 'location':
        return {
          latitude: message.location?.latitude,
          longitude: message.location?.longitude,
          address: message.location?.address,
          title: message.location?.title
        };

      case 'link':
        return {
          title: message.link?.title,
          messageURL: message.link?.messageURL,
          picURL: message.link?.picURL
        };

      case 'markdown':
        return {
          title: message.markdown?.title,
          text: message.markdown?.text
        };

      case 'actionCard':
        return {
          title: message.actionCard?.title,
          text: message.actionCard?.text,
          btns: message.actionCard?.btns || []
        };

      default:
        logger.warn('Unknown message type:', messageType);
        return message[messageType] || {};
    }
  }

  /**
   * Handle message processing errors
   * @param {Error} error - Error that occurred
   * @param {Object} message - Original message
   */
  handleError(error, message) {
    logger.error('Message processing error:', {
      error: error.message,
      stack: error.stack,
      message: message
    });

    // In a production system, you might want to:
    // 1. Store failed messages for retry
    // 2. Send alert notifications
    // 3. Report metrics to monitoring system
  }

  /**
   * Format reply message for DingTalk
   * @param {string} text - Response text from backend
   * @returns {Object} - Formatted message for DingTalk API
   */
  formatReply(text) {
    // DingTalk message length limit
    const maxLength = 2000;

    if (!text) {
      return { msgtype: 'text', text: { content: '处理失败，请稍后重试' } };
    }

    // Truncate if too long
    let content = text;
    if (text.length > maxLength) {
      content = text.substring(0, maxLength) + '\n\n...（消息已截断）';
    }

    return {
      msgtype: 'text',
      text: {
        content: content
      }
    };
  }
}

module.exports = MessageHandler;