# 钉钉企业机器人集成设计方案

**日期**: 2025-04-13  
**状态**: 已确认，待实现  
**作者**: Claude Code

---

## 1. 概述

### 1.1 目标
为 bigdata-sre-platform 平台集成钉钉企业机器人，支持用户在钉钉端通过 @机器人 或私聊方式发起智能对话，平台处理后返回结果。

### 1.2 核心特性
- **Stream 模式**: 与钉钉建立长连接，实时接收消息
- **混合交互**: 默认智能体自动回复，支持指令切换
- **独立服务**: Stream 服务独立部署，通过 HTTP 与 backend 通信
- **页面配置**: 支持在平台页面配置钉钉 Client ID/Secret

---

## 2. 架构设计

### 2.1 系统架构

```
┌─────────────┐     Stream模式      ┌──────────────────┐     HTTP POST      ┌─────────────┐
│   钉钉用户   │ ◄─────────────────► │  dingtalk-stream │ ─────────────────► │   backend   │
│  (@机器人)   │   长连接(有状态)     │    (独立服务)     │  /api/chat/dingtalk│  (Express)  │
└─────────────┘                     └──────────────────┘                    └─────────────┘
                                           │                                       │
                                           │ 启动时读取                            │ 读取/写入
                                           ▼                                       ▼
                                    ┌──────────────┐                        ┌──────────────┐
                                    │  settings    │                        │  settings    │
                                    │ (Client ID等) │                        │ (智能体配置)  │
                                    └──────────────┘                        └──────────────┘
```

### 2.2 组件职责

| 组件 | 职责 |
|------|------|
| dingtalk-stream | 与钉钉建立 Stream 连接，接收消息，HTTP 转发到 backend，返回回复给用户 |
| backend | 提供 `/api/chat/dingtalk` API，处理钉钉消息，调用智能体生成回复 |
| frontend | 提供"钉钉配置"页面，管理配置、查看连接状态 |

---

## 3. 数据模型

### 3.1 钉钉配置 (settings 表)

```javascript
{
  dingtalk: {
    enabled: boolean,           // 是否启用钉钉集成
    clientId: string,           // 钉钉 Client ID
    clientSecret: string,       // 钉钉 Client Secret（加密存储）
    defaultAgentId: string,     // 默认智能体ID
    connected: boolean,         // 连接状态（运行时更新）
    messageCount: number,       // 今日消息计数（运行时更新）
    lastMessageAt: Date,        // 最后消息时间
    reconnectInterval: number   // 重连间隔（秒，默认30）
  }
}
```

### 3.2 钉钉会话 (可选，用于上下文)

```javascript
{
  dingtalkConversations: [{
    id: string,                 // 会话ID（钉钉用户ID）
    userId: string,             // 钉钉用户ID
    userName: string,           // 用户名称
    currentAgentId: string,     // 当前使用的智能体ID
    lastMessageAt: Date,        // 最后消息时间
    messageCount: number        // 消息计数
  }]
}
```

---

## 4. API 设计

### 4.1 Backend API

#### POST /api/chat/dingtalk
处理钉钉消息，返回回复。

**请求体**:
```json
{
  "userId": "dingtalk_user_123",
  "userName": "张三",
  "content": "查询HDFS状态",
  "conversationId": "conv_xxx",
  "messageType": "text"
}
```

**响应**:
```json
{
  "success": true,
  "response": "HDFS 集群状态：总容量 100TB，已使用 45%，活跃节点 8 个...",
  "agentId": "agent_xxx",
  "agentName": "集群监控助手"
}
```

#### GET /api/dingtalk/status
获取钉钉 Stream 连接状态。

**响应**:
```json
{
  "enabled": true,
  "connected": true,
  "startedAt": "2025-04-13T08:00:00Z",
  "messageCount": 128,
  "lastMessageAt": "2025-04-13T10:30:00Z"
}
```

#### POST /api/dingtalk/test-connection
测试钉钉连接配置。

**请求体**:
```json
{
  "clientId": "xxx",
  "clientSecret": "xxx"
}
```

### 4.2 Stream 服务内部 API

Stream 服务暴露简单的 HTTP 接口供 backend 调用（可选，用于主动推送）。

#### POST /internal/send-message
主动发送消息到钉钉用户。

---

## 5. 交互设计

### 5.1 消息处理流程

```
用户 @机器人 "查询HDFS状态"
    │
    ▼
钉钉 ──► Stream 服务 ──► HTTP POST /api/chat/dingtalk
    │                         │
    │                         ▼
    │              Backend 处理流程：
    │              1. 根据 userId 查找/创建会话
    │              2. 获取默认智能体（或会话当前智能体）
    │              3. 调用 handleChat(agentId, content)
    │              4. 返回回复内容
    │                         │
    │                         ▼
    │              回复："HDFS 集群状态：..."
    │                         │
    ▼                         │
钉钉 ◄── Stream 服务 ◄────────┘
```

### 5.2 指令系统

| 指令 | 示例 | 功能 |
|------|------|------|
| 默认对话 | "查询HDFS状态" | 使用默认智能体直接回复 |
| 切换智能体 | "切换智能体 集群监控助手" | 切换当前会话使用的智能体 |
| 智能体列表 | "智能体列表" | 显示可用智能体列表 |
| 帮助 | "帮助" / "help" | 显示支持的指令 |

### 5.3 首次交互示例

**用户**: @机器人 帮助

**机器人回复**:
```
🤖 大数据智能运维平台

我是您的智能运维助手，可以帮助您：
• 查询 HDFS/YARN/Spark 集群状态
• 执行 Ambari 管理操作
• 分析集群健康情况

当前使用智能体：集群监控助手

可用指令：
• 切换智能体 [名称] - 切换智能体
• 智能体列表 - 查看所有智能体
• 帮助 - 显示此帮助信息

直接输入您的问题即可开始对话！
```

---

## 6. 前端设计

### 6.1 页面结构

**独立菜单"钉钉配置"**（图标：💬）

```
钉钉配置
├── 基本配置
│   ├── Client ID [输入框]
│   ├── Client Secret [密码输入框，显示/隐藏]
│   ├── 默认智能体 [下拉选择]
│   └── 启用钉钉集成 [开关]
├── 连接控制
│   ├── 连接状态 [标签：已连接/已断开]
│   ├── 启动/停止 Stream 按钮
│   └── 测试连接按钮
└── 统计信息
    ├── 运行时长
    ├── 今日消息数
    └── 最后消息时间
```

### 6.2 组件设计

- `DingtalkConfig.vue` - 主配置页面
- `DingtalkStatusCard.vue` - 状态卡片组件
- `DingtalkStats.vue` - 统计信息组件

---

## 7. Stream 服务设计

### 7.1 技术栈
- Node.js 20+
- `@dingtalk/chatbot` - 钉钉官方 SDK
- `axios` - HTTP 请求
- `winston` - 日志

### 7.2 核心模块

```
dingtalk-stream/
├── package.json
├── index.js              # 入口
├── src/
│   ├── client.js         # Stream 客户端
│   ├── message-handler.js # 消息处理器
│   ├── api-client.js     # Backend HTTP 客户端
│   ├── config.js         # 配置管理
│   └── logger.js         # 日志
└── .env.example
```

### 7.3 启动流程

```javascript
1. 读取环境变量 / 从 backend 获取配置
2. 验证 Client ID / Secret
3. 建立 Stream 连接
4. 监听消息事件
5. 心跳保活
6. 断线自动重连
```

### 7.4 消息处理流程

```javascript
// 收到钉钉消息
async function onMessage(message) {
  // 1. 解析消息
  const { senderStaffId, content, conversationId } = message;
  
  // 2. 调用 backend API
  const response = await apiClient.sendMessage({
    userId: senderStaffId,
    content: content.text,
    conversationId
  });
  
  // 3. 发送回复到钉钉
  await dingtalkClient.sendMessage({
    userId: senderStaffId,
    content: response.data.response
  });
}
```

---

## 8. 安全设计

### 8.1 配置安全
- Client Secret 加密存储（AES-256）
- 配置页面敏感字段脱敏显示
- 配置文件权限控制（600）

### 8.2 通信安全
- Stream 连接使用 TLS 加密
- Backend API 使用 HTTPS
- 可选：API 签名验证

### 8.3 访问控制
- 配置页面仅管理员可访问
- Stream 服务内部 API 限制 IP 访问

---

## 9. 错误处理

### 9.1 连接错误
- 连接断开：自动重连，指数退避（30s → 60s → 120s，最大 300s）
- 认证失败：停止重连，记录错误日志，通知管理员
- Backend 不可用：返回友好提示给用户

### 9.2 消息处理错误
- 智能体不存在：提示用户选择有效智能体
- 技能执行失败：返回错误信息，记录日志
- 超时：返回"处理超时，请稍后重试"

---

## 10. 部署方案

### 10.1 目录结构

```
bigdata-sre-platform/
├── backend/              # Express backend
├── frontend/             # Vue3 frontend
├── dingtalk-stream/      # Stream 服务（新增）
│   ├── package.json
│   ├── index.js
│   └── src/
└── docker-compose.yml    # 可选：统一编排
```

### 10.2 启动方式

```bash
# Backend
cd backend && npm start

# Stream 服务（独立进程）
cd dingtalk-stream && npm start

# 或使用 PM2
pm2 start backend/src/index.js --name backend
pm2 start dingtalk-stream/index.js --name dingtalk-stream
```

### 10.3 环境变量

```bash
# dingtalk-stream/.env
BACKEND_URL=http://localhost:8080
CLIENT_ID=xxx
CLIENT_SECRET=xxx
LOG_LEVEL=info
RECONNECT_INTERVAL=30
```

---

## 11. 测试策略

### 11.1 单元测试
- Stream 客户端连接/重连逻辑
- 消息解析和格式化
- 指令识别

### 11.2 集成测试
- 端到端消息流转
- Backend API 响应
- 配置保存/读取

### 11.3 手动测试
- 钉钉群聊 @机器人
- 钉钉私聊机器人
- 指令交互
- 连接断开/重连

---

## 12. 后续扩展

### 12.1 可能的增强
- 支持 Markdown/富文本回复
- 图片/文件消息处理
- 群聊上下文共享
- 多机器人支持
- 消息限流/防刷

### 12.2 其他 IM 集成
- 企业微信
- 飞书
- Slack

---

## 13. 参考文档

- [钉钉开放平台 - Stream 模式](https://open.dingtalk.com/document/isv/stream-mode)
- [钉钉机器人开发文档](https://open.dingtalk.com/document/isv/robot-overview)
- [@dingtalk/chatbot SDK](https://www.npmjs.com/package/@dingtalk/chatbot)

---

## 14. 变更记录

| 日期 | 版本 | 变更 |
|------|------|------|
| 2025-04-13 | 1.0 | 初始设计 |
