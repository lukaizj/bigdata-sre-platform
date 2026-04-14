const express = require('express');
const cors = require('cors');
const config = require('./config');
const { initDatabase } = require('./models');
const Skill = require('./models/skill');
const path = require('path');

// Routes
const agentsRouter = require('./routes/agents');
const skillsRouter = require('./routes/skills');
const chatRouter = require('./routes/chat-mcp');
const settingsRouter = require('./routes/settings');
const authRouter = require('./routes/auth');
const dingtalkRoutes = require('./routes/dingtalk');
const { loadSettingsFromDB } = require('./routes/settings');
const { initUserTable } = require('./routes/auth');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/agents', agentsRouter);
app.use('/api/skills', skillsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/dingtalk', dingtalkRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || '服务器内部错误' });
});

// Initialize and start server
async function start() {
  try {
    // Initialize database
    await initDatabase();

    // Initialize user table
    await initUserTable();

    // Sync skills from files
    const skillsDir = path.join(__dirname, '../skills');
    await Skill.syncToDatabase(skillsDir);

    // Load settings from database
    await loadSettingsFromDB();

    // Start server
    app.listen(config.server.port, () => {
      console.log(`Big Data SRE Platform running on port ${config.server.port}`);
      console.log(`API: http://localhost:${config.server.port}/api`);
      console.log(`Health: http://localhost:${config.server.port}/api/health`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();