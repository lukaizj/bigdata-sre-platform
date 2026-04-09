const mysql = require('mysql2/promise');
const config = require('../config');

let pool = null;
let useMemoryMode = false;

// 内存存储（用于无数据库场景）
const memoryStore = {
  agents: new Map(),
  skills: new Map(),
  settings: new Map(),
  conversations: [],
};

async function getPool() {
  if (!pool && !useMemoryMode) {
    try {
      pool = mysql.createPool({
        host: config.database.host,
        port: config.database.port,
        user: config.database.user,
        password: config.database.password,
        database: config.database.database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 5000,
      });
      // 测试连接
      await pool.execute('SELECT 1');
    } catch (err) {
      console.warn('Database connection failed, using memory mode:', err.message);
      useMemoryMode = true;
    }
  }
  return pool;
}

async function query(sql, params) {
  if (useMemoryMode) {
    // 内存模式下的简单查询模拟
    return memoryQuery(sql, params);
  }
  const p = await getPool();
  const [rows] = await p.execute(sql, params);
  return rows;
}

// 内存查询模拟
function memoryQuery(sql, params) {
  const sqlLower = sql.toLowerCase();

  if (sqlLower.startsWith('select * from agents')) {
    return Array.from(memoryStore.agents.values());
  }
  if (sqlLower.startsWith('select * from skills')) {
    return Array.from(memoryStore.skills.values());
  }
  if (sqlLower.startsWith('select * from agents where')) {
    const id = params[0];
    const agent = memoryStore.agents.get(id);
    return agent ? [agent] : [];
  }
  if (sqlLower.startsWith('select * from skills where')) {
    const id = params[0];
    const skill = memoryStore.skills.get(id);
    return skill ? [skill] : [];
  }
  if (sqlLower.startsWith('insert into agents')) {
    const [id, name, description, skills] = params;
    memoryStore.agents.set(id, { id, name, description, skills: JSON.parse(skills), created_at: new Date() });
    return [];
  }
  if (sqlLower.startsWith('insert into skills')) {
    const [id, name, description, type, skillConfig] = params;
    memoryStore.skills.set(id, { id, name, description, type, config: JSON.parse(skillConfig), created_at: new Date() });
    return [];
  }
  if (sqlLower.startsWith('update agents')) {
    // 简化处理
    return [];
  }
  if (sqlLower.startsWith('update skills')) {
    return [];
  }
  if (sqlLower.startsWith('delete from agents')) {
    memoryStore.agents.delete(params[0]);
    return [];
  }
  if (sqlLower.startsWith('insert into conversations')) {
    memoryStore.conversations.push({
      id: params[0],
      agent_id: params[1],
      message: params[2],
      response: params[3],
      data: params[4],
      created_at: new Date(),
    });
    return [];
  }

  return [];
}

async function initDatabase() {
  try {
    const p = await getPool();

    if (useMemoryMode) {
      console.log('Running in memory mode (no database)');
      return;
    }

    // 创建 agents 表
    await p.execute(`
      CREATE TABLE IF NOT EXISTS agents (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        skills JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // 创建 skills 表
    await p.execute(`
      CREATE TABLE IF NOT EXISTS skills (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(64),
        config JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // 创建 settings 表
    await p.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        \`key\` VARCHAR(255) PRIMARY KEY,
        value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // 创建 conversations 表
    await p.execute(`
      CREATE TABLE IF NOT EXISTS conversations (
        id VARCHAR(64) PRIMARY KEY,
        agent_id VARCHAR(64),
        message TEXT,
        response TEXT,
        data JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database initialized');
  } catch (err) {
    console.warn('Database init failed, using memory mode:', err.message);
    useMemoryMode = true;
  }
}

module.exports = {
  getPool,
  query,
  initDatabase,
  isMemoryMode: () => useMemoryMode,
};