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

// Message deduplication cache (track processed messages)
const processedMessages = new Map();
const MESSAGE_CACHE_TTL = 60 * 1000; // 60 seconds

// Clean up expired messages periodically
setInterval(() => {
  const now = Date.now();
  for (const [msgId, timestamp] of processedMessages.entries()) {
    if (now - timestamp > MESSAGE_CACHE_TTL) {
      processedMessages.delete(msgId);
    }
  }
}, 30 * 1000);

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
      timeout: 90000, // 增加 timeout，支持 GLM-5 reasoning
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
// Supports multi-message splitting for long content
async function sendReplyToDingTalk(messageData, content) {
  try {
    if (!content) return;

    const sessionWebhook = messageData.sessionWebhook;
    const senderStaffId = messageData.senderStaffId;

    // DingTalk message length limit per message
    const maxLength = 2000;

    // Split content into multiple messages if needed
    const messages = [];
    if (content.length <= maxLength) {
      messages.push(content);
    } else {
      // Split into chunks, trying to break at natural boundaries
      let remaining = content;
      let partNum = 1;
      const totalParts = Math.ceil(content.length / maxLength);

      while (remaining.length > 0) {
        let chunk;
        if (remaining.length <= maxLength) {
          chunk = remaining;
          remaining = '';
        } else {
          // Try to break at newline or space
          let breakPoint = maxLength;
          const lastNewline = remaining.lastIndexOf('\n', maxLength);
          const lastSpace = remaining.lastIndexOf(' ', maxLength);

          if (lastNewline > maxLength * 0.5) {
            breakPoint = lastNewline + 1;
          } else if (lastSpace > maxLength * 0.5) {
            breakPoint = lastSpace + 1;
          }

          chunk = remaining.substring(0, breakPoint);
          remaining = remaining.substring(breakPoint);
        }

        // Add part number indicator for multi-part messages
        if (totalParts > 1) {
          messages.push(`【第${partNum}/${totalParts}部分】\n${chunk}`);
        } else {
          messages.push(chunk);
        }
        partNum++;
      }
    }

    console.log(`[DingTalk] Sending ${messages.length} message(s), total length: ${content.length}`);

    // Send each message
    for (let i = 0; i < messages.length; i++) {
      const msgContent = messages[i];

      if (sessionWebhook) {
        console.log(`[DingTalk] Sending message ${i + 1}/${messages.length} via sessionWebhook`);

        const response = await axios.post(
          sessionWebhook,
          {
            msgtype: 'text',
            text: { content: msgContent },
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000,
          }
        );

        console.log('[DingTalk] Reply result:', JSON.stringify(response.data));

        // Small delay between messages to avoid rate limiting
        if (i < messages.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } else if (senderStaffId) {
        console.log(`[DingTalk] Sending message ${i + 1}/${messages.length} via batchSend`);

        const accessToken = await client.getAccessToken();

        const response = await axios.post(
          'https://api.dingtalk.com/v1.0/robot/oToMessages/batchSend',
          {
            robotCode: CLIENT_ID,
            userIds: [senderStaffId],
            msgKey: 'sampleText',
            msgParam: JSON.stringify({ content: msgContent }),
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

        if (i < messages.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } else {
        console.warn('[DingTalk] No way to reply: missing sessionWebhook and senderStaffId');
        break;
      }
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
      // Parse message data first to get msgId
      let data = message.data;
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch (e) {
          console.warn('[Robot] Failed to parse message data');
          return;
        }
      }

      // Check for duplicate messages using msgId (钉钉重试时 messageId 会变，但 msgId 不变)
      const msgId = data.msgId;
      if (msgId) {
        if (processedMessages.has(msgId)) {
          console.log('[Robot] Duplicate message detected (msgId), skipping:', msgId);
          return; // 直接返回，不触发任何后续处理
        }
        processedMessages.set(msgId, Date.now());
      }

      console.log('[Robot] Message data:', JSON.stringify({
        msgId: data.msgId,
        conversationId: data.conversationId,
        senderNick: data.senderNick,
        senderId: data.senderId,
        msgtype: data.msgtype,
        text: data.text?.content?.slice(0, 50),
      }));

      // 先发送"正在处理"回复，避免钉钉超时重试
      await sendReplyToDingTalk(data, '⏳ 正在查询，请稍候...');

      // 同步等待处理完成，发送最终结果
      try {
        const result = await sendMessageToBackend(data);
        if (result && result.response) {
          console.log('[Backend] Got response, length:', result.response.length);
          await sendReplyToDingTalk(data, result.response);
        }
      } catch (err) {
        console.error('[Robot] Backend error:', err);
        await sendReplyToDingTalk(data, '❌ 处理失败：' + err.message);
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