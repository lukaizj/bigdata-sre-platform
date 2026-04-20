# Big Data SRE Platform

大数据智能运维平台 - 基于 AI 的智能运维助手

## 功能特性

### 核心功能

- **智能对话**: 通过自然语言与 AI 交互，查询集群状态、分析日志、排查问题
- **智能体管理**: 创建和管理多个运维智能体，配置专属技能
- **技能系统**: 模块化技能架构，支持灵活组合和链式执行
- **MCP 工具集成**: 直接调用 MCP 工具，绕过 AI 路由，响应更快
- **多集群管理**: 支持配置多套 Hadoop/Spark/YARN 集群，灵活切换
- **用户权限管理**: 支持管理员和普通用户角色，可配置模块访问权限

### UI 特性

**工业数据终端视觉（v4.2）** — 全站重构为 `NEXUS // SRE_COMMAND` 科幻指挥中台风格：

- **登录页 HUD**：顶部任务控制状态栏（UTC 实时时钟 / 构建号 / NOMINAL 状态徽章）、视口四角框选、CRT 扫描线与噪点层、左侧纵向实时指标读数（CPU / MEM / NET / DSK / JOB 每秒刷新）、底部地理坐标条、中央全息雷达 + 轨道环 + 悬浮数据卡
- **智能对话终端**：重做为仿 shell 会话——窗口栏带交通灯 + `nexus@sre:~/<agent>` 标题、ASCII 启动 banner、`user@nexus:~$` 提示符、`[智能体] :: 完成` 响应头、`[完成] / [失败] / [警告]` 执行日志、`[ 执行 ]` 按钮
- **快捷命令**：`$ status hdfs` 等类 shell 入口代替气泡按钮，语法高亮配色
- **中英混排字体栈**：JetBrains Mono + DM Sans，配 Sarasa Mono SC / PingFang SC 中文 fallback
- **双主题支持**：浅色模式（清爽白）与深色模式（深炭 + 青/琥珀），深色模式次级文字对比度达 WCAG AA
- **色彩系统**：青色 `#14b8a6` 为主、琥珀 `#fbbf24` 为次，LED 状态指示（方形 + 光晕），告别紫色与玻璃态
- **动效编排**：启动序列（角框 → 指标 → 终端 → 品牌文案逐级淡入）、雷达扫描、轨道旋转、脉冲光环
- **响应式设计**：1180/960/480 三档断点，窄屏自动收纳侧边读数和数据卡

## 内置技能

| 技能 | 功能 | 底层集成 |
|------|------|----------|
| `hdfs-query` | HDFS 操作/状态 | WebHDFS API |
| `yarn-query` | YARN 应用/资源 | YARN REST API |
| `spark-query` | Spark 应用分析 | Spark History API |
| `ambari-manage` | 服务启停/告警 | Ambari REST API |
| `cluster-health` | 综合健康检查 | 多源聚合 |
| `data-visualization` | ECharts 图表 | GLM-4 |

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                        前端 (Vue 3)                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ 智能对话 │ │集群仪表板│ │智能体管理│ │ 技能配置 │ ...       │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     后端 (Node.js/Express)                   │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ Auth API│ │ Chat API│ │Skills API│ │Settings │ ...       │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
└─────────────────────────────────────────────────────────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
    ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
    │  MySQL  │   │ GLM API │   │Hadoop   │   │ Spark   │
    │  数据库  │   │  AI模型 │   │ 集群API │   │ History │
    └─────────┘   └─────────┘   └─────────┘   └─────────┘
```

## 快速开始

### 环境要求

- Node.js 18+
- MySQL 5.7+
- GLM API Key（或其他兼容 OpenAI 接口的模型）

### 安装

```bash
# 后端
cd backend
npm install

# 前端
cd ../frontend
npm install
```

### 配置

编辑 `backend/.env`:

```env
SERVER_PORT=8080
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=bigdata_sre

# Hadoop
HADOOP_NAMENODE_URL=http://namenode:9870
HADOOP_YARN_URL=http://resourcemanager:8088

# Spark
SPARK_HISTORY_URL=http://spark-history:18080

# Ambari
AMBARI_URL=http://ambari:8080
AMBARI_USERNAME=admin
AMBARI_PASSWORD=admin

# AI 模型（支持多种）
GLM_ENABLED=true
GLM_API_KEY=your_glm_api_key
GLM_API_URL=http://api.example.com/v1/chat/completions
```

### 启动

```bash
# 后端
cd backend
npm start

# 前端（开发模式）
cd frontend
npm run dev

# 前端（生产构建）
cd frontend
npm run build
```

访问:
- 前端: http://localhost:5173
- 后端 API: http://localhost:8080/api

### 默认账号

- 管理员: `admin@bigdata.local` / `admin123`
- 可在用户管理页面创建其他用户

## API 接口

### 认证

```http
POST   /api/auth/login         # 登录
POST   /api/auth/register      # 注册
GET    /api/auth/me            # 获取当前用户信息
GET    /api/auth/users         # 获取用户列表（管理员）
PUT    /api/auth/users/:id     # 更新用户信息
```

### 智能体

```http
GET    /api/agents             # 获取所有智能体
POST   /api/agents             # 创建智能体
PUT    /api/agents/:id         # 更新智能体
DELETE /api/agents/:id         # 删除智能体
```

### 技能

```http
GET    /api/skills             # 获取所有技能
PUT    /api/skills/:id         # 更新技能配置
POST   /api/skills/sync        # 同步技能定义
GET    /api/skills/dirs        # 获取技能目录信息
```

### 对话

```http
POST   /api/chat               # 发送消息（Skills 模式）
POST   /api/chat/mcp           # 发送消息（MCP 模式）
GET    /api/chat/mcp-tools     # 获取可用 MCP 工具
```

### 集群配置

```http
GET    /api/settings           # 获取所有配置
PUT    /api/settings           # 更新集群配置
POST   /api/settings/model     # 添加 AI 模型
PUT    /api/settings/model/:id # 更新模型配置
DELETE /api/settings/model/:id # 删除模型
POST   /api/settings/test-connection  # 测试集群连接
POST   /api/settings/test-ai   # 测试 AI 模型连接
```

## 使用示例

### 创建智能体

```bash
curl -X POST http://localhost:8080/api/agents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Hadoop运维助手",
    "description": "Hadoop集群运维智能体",
    "skills": ["hdfs-query", "yarn-query", "cluster-health"]
  }'
```

### 发送消息

```bash
curl -X POST http://localhost:5173/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "agent_id": "<agent_id>",
    "message": "查一下 HDFS 磁盘使用情况并画成图"
  }'
```

### 支持的查询示例

| 查询类型 | 示例语句 |
|---------|---------|
| HDFS 状态 | "查一下 HDFS 集群状态"、"HDFS 磁盘使用情况" |
| YARN 资源 | "YARN 资源使用情况"、"列出运行中的应用" |
| Spark 应用 | "正在运行的 Spark 应用"、"Spark 任务为什么慢" |
| 集群健康 | "检查集群健康状态"、"全面健康检查" |
| 日志分析 | "分析这个应用的日志"、"查看错误日志" |

## 技术栈

**前端**:
- Vue 3 (Composition API)
- Element Plus UI 组件库
- ECharts 图表库
- Axios HTTP 客户端

**后端**:
- Node.js / Express
- MySQL 数据库
- JWT 认证
- MCP 协议支持

**AI**:
- GLM-4 / GLM-5 (智谱 AI)
- 支持多种兼容 OpenAI 接口的模型

## 项目结构

```
bigdata-sre-platform/
├── frontend/                # 前端项目
│   ├── src/
│   │   ├── components/      # Vue 组件
│   │   ├── styles/          # 样式文件
│   │   └── App.vue          # 主应用
│   └── package.json
├── backend/                 # 后端项目
│   ├── src/
│   │   ├── routes/          # API 路由
│   │   ├── skills/          # 技能定义
│   │   └── index.js         # 入口文件
│   └── package.json
└── README.md
```

## License

MIT