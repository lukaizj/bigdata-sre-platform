const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../models');
const config = require('../config');
const svgCaptcha = require('svg-captcha');
const captchaStore = require('../captchaStore');

const router = express.Router();

// GET /api/auth/captcha - 获取图形验证码
router.get('/captcha', (req, res) => {
  const captcha = svgCaptcha.create({
    size: 4,
    ignoreChars: '0o1iIlL',
    noise: 2,
    color: true,
    background: '#f4f7ff',
    width: 120,
    height: 40,
    fontSize: 40
  });
  const captchaId = require('crypto').randomUUID();
  captchaStore.set(captchaId, captcha.text);
  res.json({ captchaId, svg: captcha.data });
});

// JWT密钥必须从配置获取，启动时会验证
const JWT_SECRET = config.jwt?.secret;
if (!JWT_SECRET) {
  console.error('ERROR: JWT_SECRET is not configured. Please set jwt.secret in config.');
  process.exit(1);
}
const JWT_EXPIRES = '24h';

// 创建用户表
async function initUserTable() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(100) NOT NULL,
        password VARCHAR(255) NOT NULL,
        avatar VARCHAR(500),
        role ENUM('admin', 'user') DEFAULT 'user',
        permissions TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP NULL,
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 添加 permissions 字段（如果表已存在但没有该字段）
    try {
      await query('ALTER TABLE users ADD COLUMN permissions TEXT');
    } catch (e) {
      // 字段已存在，忽略错误
    }

    // 检查是否有管理员用户，没有则创建默认管理员
    const admins = await query('SELECT * FROM users WHERE role = ?', ['admin']);
    if (admins.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await query(
        'INSERT INTO users (id, email, username, password, role) VALUES (?, ?, ?, ?, ?)',
        ['admin-default', 'admin@bigdata.local', 'Admin', hashedPassword, 'admin']
      );
      console.log('Default admin user created: admin@bigdata.local / admin123');
    }
  } catch (err) {
    console.error('Failed to create users table:', err);
  }
}

// POST /api/auth/register - 用户注册
router.post('/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ error: '请填写完整的注册信息' });
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: '请输入有效的邮箱地址' });
    }

    // 验证密码强度
    if (password.length < 6) {
      return res.status(400).json({ error: '密码至少需要6个字符' });
    }

    // 检查邮箱是否已存在
    const existing = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: '该邮箱已被注册' });
    }

    // 创建用户
    const userId = `user-${Date.now()}`;
    const hashedPassword = await bcrypt.hash(password, 10);

    await query(
      'INSERT INTO users (id, email, username, password, role) VALUES (?, ?, ?, ?, ?)',
      [userId, email, username, hashedPassword, 'user']
    );

    // 生成 token
    const token = jwt.sign({ userId, email, role: 'user' }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    res.status(201).json({
      success: true,
      message: '注册成功',
      token,
      user: {
        id: userId,
        email,
        username,
        role: 'user',
        avatar: null,
      }
    });
  } catch (err) {
    console.error('Register failed:', err);
    res.status(500).json({ error: '注册失败，请稍后重试' });
  }
});

// POST /api/auth/login - 用户登录
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: '请输入邮箱和密码' });
    }

    // 查找用户
    const users = await query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    const user = users[0];

    // 验证密码
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    // 更新最后登录时间
    await query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    // 生成 token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.json({
      success: true,
      message: '登录成功',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        avatar: user.avatar,
      }
    });
  } catch (err) {
    console.error('Login failed:', err);
    res.status(500).json({ error: '登录失败，请稍后重试' });
  }
});

// GET /api/auth/me - 获取当前用户信息
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未登录' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);

    const users = await query('SELECT id, email, username, avatar, role, permissions, created_at, last_login FROM users WHERE id = ?', [decoded.userId]);
    if (users.length === 0) {
      return res.status(401).json({ error: '用户不存在' });
    }

    const user = users[0];
    // 解析 permissions
    if (user.permissions) {
      try {
        user.permissions = JSON.parse(user.permissions);
      } catch (e) {
        user.permissions = null;
      }
    }

    res.json({ user });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: '登录已过期，请重新登录' });
    }
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

// PUT /api/auth/profile - 更新用户资料
router.put('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未登录' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);

    const { username, avatar } = req.body;

    if (username) {
      await query('UPDATE users SET username = ? WHERE id = ?', [username, decoded.userId]);
    }
    if (avatar) {
      await query('UPDATE users SET avatar = ? WHERE id = ?', [avatar, decoded.userId]);
    }

    const users = await query('SELECT id, email, username, avatar, role FROM users WHERE id = ?', [decoded.userId]);
    res.json({ success: true, user: users[0] });
  } catch (err) {
    console.error('Update profile failed:', err);
    res.status(500).json({ error: '更新资料失败' });
  }
});

// PUT /api/auth/password - 修改密码
router.put('/password', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未登录' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: '请填写旧密码和新密码' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: '新密码至少需要6个字符' });
    }

    // 验证旧密码
    const users = await query('SELECT password FROM users WHERE id = ?', [decoded.userId]);
    const isValid = await bcrypt.compare(oldPassword, users[0].password);
    if (!isValid) {
      return res.status(400).json({ error: '旧密码错误' });
    }

    // 更新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, decoded.userId]);

    res.json({ success: true, message: '密码修改成功' });
  } catch (err) {
    console.error('Change password failed:', err);
    res.status(500).json({ error: '修改密码失败' });
  }
});

// ========== 管理员接口 ==========

// 验证管理员权限的中间件
async function requireAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未登录' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);

    const users = await query('SELECT role FROM users WHERE id = ?', [decoded.userId]);
    if (users.length === 0 || users[0].role !== 'admin') {
      return res.status(403).json({ error: '需要管理员权限' });
    }

    req.adminUser = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: '登录已过期' });
  }
}

// GET /api/auth/users - 获取所有用户列表（管理员）
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const users = await query(
      'SELECT id, email, username, avatar, role, permissions, created_at, last_login FROM users ORDER BY created_at DESC'
    );
    // 解析 permissions
    const parsedUsers = users.map(user => {
      if (user.permissions) {
        try {
          user.permissions = JSON.parse(user.permissions);
        } catch (e) {
          user.permissions = null;
        }
      }
      return user;
    });
    res.json({ users: parsedUsers });
  } catch (err) {
    console.error('Get users failed:', err);
    res.status(500).json({ error: '获取用户列表失败' });
  }
});

// PUT /api/auth/users/:id - 更新用户信息（管理员）
router.put('/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, role, password, permissions } = req.body;

    // 不能修改自己的角色
    if (id === req.adminUser.userId && role && role !== 'admin') {
      return res.status(400).json({ error: '不能取消自己的管理员权限' });
    }

    if (username) {
      await query('UPDATE users SET username = ? WHERE id = ?', [username, id]);
    }
    if (role && ['admin', 'user'].includes(role)) {
      await query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    }
    if (password && password.length >= 6) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
    }
    // 更新权限配置（仅对非管理员用户）
    if (permissions !== undefined) {
      await query('UPDATE users SET permissions = ? WHERE id = ?', [
        permissions ? JSON.stringify(permissions) : null,
        id
      ]);
    }

    const users = await query('SELECT id, email, username, avatar, role, permissions, created_at, last_login FROM users WHERE id = ?', [id]);
    const user = users[0];
    if (user.permissions) {
      try {
        user.permissions = JSON.parse(user.permissions);
      } catch (e) {
        user.permissions = null;
      }
    }
    res.json({ success: true, user });
  } catch (err) {
    console.error('Update user failed:', err);
    res.status(500).json({ error: '更新用户失败' });
  }
});

// DELETE /api/auth/users/:id - 删除用户（管理员）
router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // 不能删除自己
    if (id === req.adminUser.userId) {
      return res.status(400).json({ error: '不能删除自己的账号' });
    }

    // 检查是否是最后一个管理员
    const admins = await query('SELECT id FROM users WHERE role = ?', ['admin']);
    const targetUser = await query('SELECT role FROM users WHERE id = ?', [id]);

    if (targetUser.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    if (targetUser[0].role === 'admin' && admins.length <= 1) {
      return res.status(400).json({ error: '不能删除最后一个管理员' });
    }

    await query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ success: true, message: '用户已删除' });
  } catch (err) {
    console.error('Delete user failed:', err);
    res.status(500).json({ error: '删除用户失败' });
  }
});

module.exports = router;
module.exports.initUserTable = initUserTable;
