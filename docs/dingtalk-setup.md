# DingTalk Integration Setup Guide

This guide explains how to configure and deploy the DingTalk Stream service for real-time messaging integration with the Big Data SRE Platform.

## Prerequisites

- Node.js 16+ installed
- MySQL 5.7+ database configured
- DingTalk developer account with admin access
- Network connectivity to DingTalk API servers
- Platform backend service running

## DingTalk Open Platform Configuration

### Step 1: Create or Use Existing Application

1. Log in to [DingTalk Open Platform](https://open.dingtalk.com/)
2. Navigate to **Application Development** > **H5 Microapplications** or **Enterprise Internal Applications**
3. Create a new application or select an existing one

### Step 2: Configure Application Permissions

Required permissions:
- `Contact.User.Read` - Read user basic information
- `Message.Robot.Send` - Send robot messages
- `Chat.Bot.Read` - Read chat bot information
- `Chat.Bot.Write` - Write chat bot messages

### Step 3: Get Application Credentials

1. In the application details page, locate:
   - **AppKey** (Client ID)
   - **AppSecret** (Client Secret)
2. Record these credentials securely
3. Enable **Stream Mode** in the application settings

### Step 4: Configure Event Subscriptions (Optional)

For additional event handling:
1. Navigate to **Event Subscriptions**
2. Subscribe to relevant events:
   - `chat_add_user` - User added to chat
   - `chat_remove_user` - User removed from chat
   - `user_modify_org` - User information modified

## Platform Configuration

### Step 1: Environment Setup

1. Copy the example environment file:
   ```bash
   cd /opt/bigdata-sre-platform/backend
   cp .env.example .env
   ```

2. Generate an encryption key:
   ```bash
   openssl rand -hex 16
   ```

3. Edit `.env` and set the encryption key:
   ```bash
   ENCRYPTION_KEY=<generated-key-here>
   ```

### Step 2: Database Initialization

The backend service will automatically create the required tables on startup. Ensure the database is configured:

```bash
# In backend/.env
DB_HOST=localhost
DB_PORT=3306
DB_USER=sre_user
DB_PASSWORD=your-password
DB_NAME=bigdata_sre
```

### Step 3: Configure DingTalk Credentials

You can configure DingTalk credentials through the API or directly in the database.

**Option A: Via API (Recommended)**

```bash
# Get authentication token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.token')

# Configure DingTalk settings
curl -X POST http://localhost:8080/api/settings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "dingtalk_client_id",
    "value": "your-app-key"
  }'

curl -X POST http://localhost:8080/api/settings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "dingtalk_client_secret",
    "value": "your-app-secret"
  }'
```

**Option B: Via Database**

```sql
INSERT INTO settings (key, value, encrypted, description, created_at, updated_at)
VALUES
('dingtalk_client_id', 'your-app-key', false, 'DingTalk AppKey', NOW(), NOW()),
('dingtalk_client_secret', 'your-app-secret', true, 'DingTalk AppSecret (encrypted)', NOW(), NOW());
```

## Stream Service Deployment

### Step 1: Install Dependencies

```bash
cd /opt/bigdata-sre-platform/dingtalk-stream
npm install
```

### Step 2: Start Backend Service

Ensure the backend API is running:

```bash
cd /opt/bigdata-sre-platform/backend
npm start
# or use PM2 for production
pm2 start src/index.js --name bigdata-sre-backend
```

### Step 3: Start Stream Service

**Development Mode:**

```bash
./start-dingtalk-stream.sh
```

**Production Mode with PM2:**

```bash
pm2 start dingtalk-stream/index.js --name dingtalk-stream
pm2 save
```

### Step 4: Verify Connection

1. Check service logs:
   ```bash
   tail -f dingtalk-stream/logs/stream.log
   ```

2. Look for successful connection:
   ```
   [INFO] Successfully connected to DingTalk Stream
   [INFO] Access token obtained, expires in 7200 seconds
   ```

3. Test by sending a message to the bot in DingTalk

## Architecture Overview

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│  DingTalk   │◄───────►│  Stream Service  │◄───────►│   Backend   │
│   Server    │  Stream │  (dingtalk-stream)│   HTTP  │    API     │
└─────────────┘         └──────────────────┘         └─────────────┘
                                                              │
                                                              ▼
                                                        ┌──────────┐
                                                        │  MySQL   │
                                                        │   DB     │
                                                        └──────────┘
```

**Flow:**
1. Stream service connects to DingTalk using Client ID/Secret
2. DingTalk pushes messages via persistent connection
3. Stream service processes messages and calls backend API
4. Backend API handles business logic and database operations
5. Responses sent back through Stream service to DingTalk

## Troubleshooting

### Connection Issues

**Problem: Stream service cannot connect to DingTalk**

Check:
1. Network connectivity to `api.dingtalk.com`
2. Correct Client ID and Client Secret
3. Valid access token (check expiration)
4. Stream mode enabled in DingTalk application settings

```bash
# Test connectivity
curl -I https://api.dingtalk.com/v1.0/oauth2/accessToken

# Check token
curl -X POST https://api.dingtalk.com/v1.0/oauth2/accessToken \
  -H "Content-Type: application/json" \
  -d '{"appKey":"your-key","appSecret":"your-secret"}'
```

### Authentication Errors

**Problem: Invalid access token**

Causes:
- Expired token (tokens expire in 2 hours)
- Invalid credentials
- Clock skew on server

Solution:
1. Check system time is accurate
2. Verify credentials are correct
3. Check logs for token refresh errors

### Message Processing Errors

**Problem: Messages not being processed**

Check:
1. Backend service is running
2. `BACKEND_URL` is correct
3. `BACKEND_API_KEY` matches `JWT_SECRET`
4. Backend API logs for errors

```bash
# Test backend connectivity
curl http://localhost:8080/api/health

# Check backend logs
tail -f backend/logs/*.log
```

### Encryption Errors

**Problem: Failed to decrypt/encrypt credentials**

Causes:
- Missing `ENCRYPTION_KEY` in `.env`
- Key changed after credentials were encrypted
- Key is not 32 characters

Solution:
1. Verify `ENCRYPTION_KEY` is set
2. Re-save credentials through API if key changed
3. Generate new key: `openssl rand -hex 16`

## Production Deployment Recommendations

### 1. Use Process Manager

```bash
# Install PM2
npm install -g pm2

# Start services
pm2 start backend/src/index.js --name bigdata-sre-backend
pm2 start dingtalk-stream/index.js --name dingtalk-stream

# Save and configure startup
pm2 save
pm2 startup
```

### 2. Configure Log Rotation

Create `/etc/logrotate.d/bigdata-sre`:

```
/opt/bigdata-sre-platform/backend/logs/*.log
/opt/bigdata-sre-platform/dingtalk-stream/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0644 node node
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 3. Set Up Monitoring

- Monitor PM2 process status
- Check log files for errors
- Monitor memory usage
- Set up alerts for connection failures

### 4. Security Considerations

- Keep `.env` files secure (chmod 600)
- Use strong encryption key
- Rotate credentials periodically
- Restrict database access
- Use HTTPS in production
- Enable DingTalk IP whitelist if applicable

### 5. High Availability

For production deployments:

1. **Load Balancer**: Use Nginx/HAProxy for backend API
2. **Database**: Configure MySQL replication/cluster
3. **Process Monitoring**: Use PM2 clustering mode
4. **Backup**: Regular database backups
5. **Failover**: Multiple stream service instances with different robot credentials

### 6. Environment Variables Checklist

Ensure all required variables are set:

**Backend `.env`:**
- ✅ `SERVER_PORT`
- ✅ `JWT_SECRET`
- ✅ `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- ✅ `ENCRYPTION_KEY` (32 characters)
- ✅ `GLM_API_KEY` (if using AI features)

**Stream Service (inherits from backend):**
- ✅ `DINGTALK_CLIENT_ID` (via API or database)
- ✅ `DINGTALK_CLIENT_SECRET` (via API or database)
- ✅ `BACKEND_URL`
- ✅ `BACKEND_API_KEY`
- ✅ `LOG_LEVEL`

## Support

For issues or questions:
1. Check logs in `dingtalk-stream/logs/`
2. Review DingTalk Open Platform documentation
3. Contact platform administrators
4. Check GitHub issues for known problems

## Related Documentation

- [DingTalk Stream Mode Documentation](https://open.dingtalk.com/document/orgapp/the-streaming-mode-is-connected-to-the-robot)
- [DingTalk API Reference](https://open.dingtalk.com/document/orgapp/overview-of-group-robot)
- Backend API documentation at `/api/docs` (when running)