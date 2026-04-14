/**
 * DingTalk Stream Service using official SDK
 * 使用钉钉官方 dingtalk-stream SDK 实现 Stream 模式
 */

const dotenv = require('dotenv');
const path = require('path');
const axios = require('axios');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const { DWClient } = require('dingtalk-stream');

// Robot message topic (from SDK constants)
const TOPIC_ROBOT = '/v1.0/im/bot/messages/get';

// Configuration
const CLIENT_ID = process.env.DINGTALK_CLIENT_ID;
const CLIENT_SECRET = process.env.DINGTALK_CLIENT_SECRET;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';

// Backend API client for message processing
async function sendMessageToBackend(message) {
  try {
    const payload = {
      userId: message.senderId || message.senderStaffId || 'unknown',
      userName: message.senderNick || 'Unknown',
      content: extractMessageContent(message),
      conversationId: message.conversationId,
      messageType: message.msgtype || 'text',
    };

    console.log('[Backend] Sending message:', JSON.stringify(payload));

    const response = await axios.post(`${BACKEND_URL}/api/dingtalk/chat`, payload, {
      timeout: 30000,
    });

    console.log('[Backend] Response:', JSON.stringify(response.data).slice(0, 200));
    return response.data;
  } catch (error) {
    console.error('[Backend] Failed to send message:', error.message);
    return null;
  }
}

// Extract message content from DingTalk message
function extractMessageContent(message) {
  if (!message) return '';

  try {
    // For text messages
    if (message.text) {
      return message.text.content || message.text || '';
    }

    // For other types
    return JSON.stringify(message);
  } catch (e) {
    return String(message);
  }
}

// Send reply to DingTalk via sessionWebhook (for single chat)
async function sendReplyToDingTalk(messageData, content) {
  try {
    if (!content) return;

    // DingTalk message length limit
    const maxLength = 2000;
    let replyContent = content;
    if (content.length > maxLength) {
      replyContent = content.substring(0, maxLength) + '\n...（消息已截断）';
    }

    // Use sessionWebhook for single chat reply
    const sessionWebhook = messageData.sessionWebhook;
    const senderStaffId = messageData.senderStaffId;

    if (sessionWebhook) {
      // Use session webhook to reply (most reliable for single chat)
      console.log('[DingTalk] Sending reply via sessionWebhook');

      const response = await axios.post(
        sessionWebhook,
        {
          msgtype: 'text',
          text: { content: replyContent },
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );

      console.log('[DingTalk] Reply result:', JSON.stringify(response.data));
    } else if (senderStaffId) {
      // Use batchSend API with senderStaffId
      console.log('[DingTalk] Sending reply via batchSend to staffId:', senderStaffId);

      const accessToken = await client.getAccessToken();

      const response = await axios.post(
        'https://api.dingtalk.com/v1.0/robot/oToMessages/batchSend',
        {
          robotCode: CLIENT_ID,
          userIds: [senderStaffId],
          msgKey: 'sampleText',
          msgParam: JSON.stringify({ content: replyContent }),
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-acs-dingtalk-access-token': accessToken,
          },
          timeout: 10000,
        }
      );

      console.log('[DingTalk] Reply result:', JSON.stringify(response.data));
    } else {
      console.warn('[DingTalk] No way to reply: missing sessionWebhook and senderStaffId');
    }
  } catch (error) {
    console.error('[DingTalk] Failed to send reply:', error.response?.data || error.message);
  }
}

// Main function
async function main() {
  console.log('========================================');
  console.log('DingTalk Stream Service (Official SDK)');
  console.log('Version: 2.0');
  console.log('========================================');

  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('Missing DINGTALK_CLIENT_ID or DINGTALK_CLIENT_SECRET');
    process.exit(1);
  }

  console.log('Client ID:', CLIENT_ID.slice(0, 8) + '...');
  console.log('Backend URL:', BACKEND_URL);

  // Create DWClient instance
  const client = new DWClient({
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    debug: true,
    keepAlive: true,
  });

  console.log('DWClient created');

  // Register callback listener for robot messages
  // This is the correct way to receive robot messages via Stream
  client.registerCallbackListener(TOPIC_ROBOT, async (message) => {
    console.log('[Robot] Received message:', JSON.stringify(message.headers));

    try {
      // Parse message data
      let data = message.data;
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch (e) {
          console.warn('[Robot] Failed to parse message data');
          return;
        }
      }

      console.log('[Robot] Message data:', JSON.stringify({
        conversationId: data.conversationId,
        senderNick: data.senderNick,
        senderId: data.senderId,
        msgtype: data.msgtype,
        text: data.text?.content?.slice(0, 50),
      }));

      // Send to backend for processing
      const result = await sendMessageToBackend(data);

      // Send reply if we got a response
      if (result && result.response) {
        await sendReplyToDingTalk(data, result.response);
      }
    } catch (error) {
      console.error('[Robot] Error processing message:', error);
    }
  });

  // Connect to DingTalk Stream
  try {
    console.log('[Stream] Connecting to DingTalk...');
    await client.connect();
    console.log('[Stream] Connected successfully!');
    console.log('[Stream] Waiting for robot messages...');
  } catch (error) {
    console.error('[Stream] Failed to connect:', error);
    process.exit(1);
  }

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down...');
    client.disconnect();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down...');
    client.disconnect();
    process.exit(0);
  });
}

// Start the service
main();