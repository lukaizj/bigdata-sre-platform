# Docker 部署指南

## 快速启动

### 1. 准备环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件，设置必要的配置项：
- 数据库密码
- JWT 密钥
- 钉钉应用凭证

### 2. 构建并启动服务

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 3. 访问服务

- 前端: http://localhost
- 后端 API: http://localhost:8080/api
- 钉钉 Stream: http://localhost:3001

## 服务说明

### Backend (端口 8080)
- Node.js 20 Alpine
- Express API 服务
- 自动健康检查: `/api/health`

### Frontend (端口 80)
- Vue 3 + Vite 构建
- Nginx 服务
- 自动代理 API 请求到 backend

### DingTalk Stream (端口 3001)
- 钉钉消息流服务
- WebSocket 连接管理
- 自动健康检查: `/health`

### MySQL (端口 3306)
- MySQL 8.0
- 持久化数据存储
- 自动初始化数据库

## 常用命令

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 停止并删除数据卷
docker-compose down -v

# 重建服务
docker-compose up -d --build

# 查看日志
docker-compose logs -f [service-name]

# 进入容器
docker-compose exec [service-name] sh

# 查看容器状态
docker-compose ps
```

## 生产环境建议

1. **安全配置**
   - 修改默认密码
   - 使用强密码
   - 配置 HTTPS
   - 限制端口暴露

2. **性能优化**
   - 调整容器资源限制
   - 配置日志轮转
   - 启用压缩
   - 使用 CDN

3. **高可用**
   - 使用 Docker Swarm 或 Kubernetes
   - 配置负载均衡
   - 数据库主从复制
   - 定期备份数据

4. **监控**
   - 配置日志收集
   - 监控容器资源
   - 健康检查告警
   - 性能指标监控

## 故障排查

### 查看日志
```bash
# 查看所有服务日志
docker-compose logs

# 查看特定服务日志
docker-compose logs backend
docker-compose logs frontend
docker-compose logs dingtalk-stream
```

### 重启服务
```bash
# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart backend
```

### 进入容器调试
```bash
# 进入 backend 容器
docker-compose exec backend sh

# 进入数据库容器
docker-compose exec db mysql -u root -p
```

## 环境变量说明

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| DB_HOST | 数据库主机 | db |
| DB_PORT | 数据库端口 | 3306 |
| DB_USER | 数据库用户 | root |
| DB_PASSWORD | 数据库密码 | password |
| DB_NAME | 数据库名称 | bigdata_sre |
| JWT_SECRET | JWT 密钥 | your-secret-key-change-in-production |
| BACKEND_URL | 后端服务地址 | http://backend:8080 |
| DINGTALK_APP_KEY | 钉钉应用 Key | - |
| DINGTALK_APP_SECRET | 钉钉应用 Secret | - |
| NODE_ENV | Node 环境 | production |