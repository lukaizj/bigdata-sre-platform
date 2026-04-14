# DingTalk Stream Service

DingTalk Stream 模式服务，用于与钉钉建立长连接，实时接收和处理消息。

## 功能特性

- WebSocket 长连接
- 断线自动重连（指数退避）
- 消息类型支持（文本、图片、文件、音频、位置、链接、Markdown、ActionCard）
- 后端 API 集成
- 日志记录（控制台 + 文件）
- 优雅关闭

## 目录结构

```
dingtalk-stream/
├── index.js                 # 入口文件
├── src/
│   ├── client.js           # Stream 客户端
│   ├── message-handler.js  # 消息处理器
│   ├── api-client.js       # Backend HTTP 客户端
│   ├── config.js           # 配置管理
│   └── logger.js           # 日志模块
├── package.json
├── .env.example
└── README.md
```

## 安装

```bash
cd dingtalk-stream
npm install
```

## 配置

复制 `.env.example` 为 `.env` 并填写配置：

```bash
cp .env.example .env
```

### 环境变量

| 变量 | 说明 | 必填 |
|------|------|------|
| `BACKEND_URL` | Backend API 地址 | 是 |
| `BACKEND_API_KEY` | Backend API 密钥 | 否 |
| `DINGTALK_CLIENT_ID` | 钉钉 Client ID | 是 |
| `DINGTALK_CLIENT_SECRET` | 钉钉 Client Secret | 是 |
| `RECONNECT_INITIAL_DELAY` | 重连初始延迟（毫秒） | 否（默认：1000） |
| `RECONNECT_MAX_DELAY` | 重连最大延迟（毫秒） | 否（默认：60000） |
| `HEARTBEAT_INTERVAL` | 心跳间隔（毫秒） | 否（默认：30000） |
| `LOG_LEVEL` | 日志级别 | 否（默认：info） |

## 运行

### 开发环境

```bash
npm run dev
```

### 生产环境

```bash
npm start
```

## 架构

### 消息流程

1. DingTalk Stream 通过 WebSocket 推送消息
2. `client.js` 接收消息并解析
3. `message-handler.js` 验证和处理消息
4. `api-client.js` 将消息发送到 backend `/api/dingtalk/chat`
5. Backend 处理消息并返回响应

### 重连机制

- 使用指数退避算法
- 初始延迟：1 秒
- 最大延迟：60 秒
- 延迟公式：`min(initialDelay * 2^attempts, maxDelay)`

### 心跳机制

- 定期发送 ping 消息
- 默认间隔：30 秒
- 保持连接活跃

## Backend API 接口

### POST /api/dingtalk/chat

发送消息到 backend 处理

**请求体：**
```json
{
  "msgType": "text",
  "conversationId": "xxx",
  "senderId": "xxx",
  "senderNick": "用户昵称",
  "content": {
    "text": "消息内容"
  },
  "createTime": "2024-01-01T00:00:00Z"
}
```

### POST /api/dingtalk/update-status

更新 Stream 客户端状态

**请求体：**
```json
{
  "status": "connected",
  "metadata": {
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

### GET /api/dingtalk/config

获取配置（优先于环境变量）

**响应：**
```json
{
  "success": true,
  "data": {
    "clientId": "xxx",
    "clientSecret": "xxx"
  }
}
```

## 日志

日志文件存储在 `logs/` 目录：

- `combined.log` - 所有日志
- `error.log` - 错误日志
- `exceptions.log` - 未捕获异常

## 注意事项

### 钉钉 Stream 模式

目前 `client.js` 中的 `getTicket()` 和 `getStreamEndpoint()` 方法需要根据钉钉官方 API 文档实现：

- 获取 ticket/token
- 构建 WebSocket 连接 URL
- 处理认证流程

参考文档：https://open.dingtalk.com/document/isv/stream-mode

### 消息格式

支持的消息类型：

- `text` - 文本消息
- `picture` - 图片消息
- `audio` - 音频消息
- `file` - 文件消息
- `location` - 位置消息
- `link` - 链接消息
- `richText` - 富文本消息
- `markdown` - Markdown 消息
- `actionCard` - ActionCard 消息

## 故障排查

### 连接失败

1. 检查网络连接
2. 验证 Client ID 和 Client Secret
3. 检查 backend API 是否可访问
4. 查看日志文件

### 消息处理失败

1. 检查消息格式
2. 验证 backend API 响应
3. 查看 `message-handler.js` 日志

## License

ISC