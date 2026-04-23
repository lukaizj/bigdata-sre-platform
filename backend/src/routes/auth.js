const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../models');
const config = require('../config');
const svgCaptcha = require('svg-captcha');
const captchaStore = require('../captchaStore');
const crypto = require('crypto');
const ldapService = require('../services/ldap');

const router = express.Router();

// GET /api/auth/captcha - 获取图形验证码
router.get('/captcha', (req, res) => {
  try {
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
    const captchaId = crypto.randomUUID();
    captchaStore.set(captchaId, captcha.text);
    res.json({ captchaId, svg: captcha.data });
  } catch (err) {
    console.error('Generate captcha failed:', err);
    res.status(500).json({ error: '验证码生成失败' });
  }
});

const AUTH_SOURCE = { LOCAL: 'local', LDAP: 'ldap' };
const ROLE = { ADMIN: 'admin', USER: 'user' };
const MASKED_PASSWORD = '********';

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
        password VARCHAR(255) NULL,
        avatar VARCHAR(500),
        role ENUM('admin', 'user') DEFAULT 'user',
        permissions TEXT,
        auth_source ENUM('local', 'ldap') DEFAULT 'local',
        ldap_dn VARCHAR(500) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP NULL,
        INDEX idx_email (email),
        INDEX idx_auth_source (auth_source)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    const softAlter = async (sql) => {
      try { await query(sql); } catch (e) { /* 字段已存在 */ }
    };
    await softAlter('ALTER TABLE users ADD COLUMN permissions TEXT');
    await softAlter("ALTER TABLE users ADD COLUMN auth_source ENUM('local','ldap') DEFAULT 'local'");
    await softAlter('ALTER TABLE users ADD COLUMN ldap_dn VARCHAR(500) NULL');
    await softAlter('ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL');

    // 检查是否有管理员用户，没有则创建默认管理员
    const admins = await query('SELECT * FROM users WHERE role = ?', [ROLE.ADMIN]);
    if (admins.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await query(
        'INSERT INTO users (id, email, username, password, role) VALUES (?, ?, ?, ?, ?)',
        ['admin-default', 'admin@bigdata.local', 'Admin', hashedPassword, ROLE.ADMIN]
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
    const { email, username, password, captchaId, captchaCode } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ error: '请填写完整的注册信息' });
    }

    // 校验验证码
    const captchaResult = captchaStore.verify(captchaId, captchaCode);
    if (!captchaResult.valid) {
      const msg = captchaResult.reason === 'expired' ? '验证码已过期，请刷新' : '验证码错误';
      return res.status(400).json({ error: msg, refreshCaptcha: true });
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
      [userId, email, username, hashedPassword, ROLE.USER]
    );

    // 生成 token
    const token = jwt.sign({ userId, email, role: ROLE.USER }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    res.status(201).json({
      success: true,
      message: '注册成功',
      token,
      user: {
        id: userId,
        email,
        username,
        role: ROLE.USER,
        avatar: null,
      }
    });
  } catch (err) {
    console.error('Register failed:', err);
    res.status(500).json({ error: '注册失败，请稍后重试' });
  }
});

function issueToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    avatar: user.avatar,
    auth_source: user.auth_source || AUTH_SOURCE.LOCAL,
  };
}

function parsePermissions(user) {
  if (user.permissions) {
    try {
      user.permissions = JSON.parse(user.permissions);
    } catch (e) {
      user.permissions = null;
    }
  }
  return user;
}

function getBearerToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

function requireAuth(req, res, next) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: '未登录' });
    }
    req.authUser = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
}

// POST /api/auth/login - 用户登录（支持 email 或 LDAP uid）
router.post('/login', async (req, res) => {
  try {
    const { email, password, captchaId, captchaCode } = req.body;
    const loginInput = (email || '').trim();

    if (!loginInput || !password) {
      return res.status(400).json({ error: '请输入账号和密码' });
    }

    const captchaResult = captchaStore.verify(captchaId, captchaCode);
    if (!captchaResult.valid) {
      const msg = captchaResult.reason === 'expired' ? '验证码已过期，请刷新' : '验证码错误';
      return res.status(400).json({ error: msg, refreshCaptcha: true });
    }

    const genericError = '账号或密码错误';

    // 1) 本地账号优先（按 email 精确匹配）
    const localRows = await query('SELECT * FROM users WHERE email = ?', [loginInput]);
    if (localRows.length > 0) {
      const user = localRows[0];

      if (user.auth_source === AUTH_SOURCE.LDAP) {
        const ldapUser = await ldapService.authenticate(loginInput, password);
        if (!ldapUser) return res.status(401).json({ error: genericError });
        await query('UPDATE users SET last_login = NOW(), ldap_dn = ? WHERE id = ?', [ldapUser.dn, user.id]);
        return res.json({ success: true, message: '登录成功', token: issueToken(user), user: publicUser(user) });
      }

      if (!user.password) return res.status(401).json({ error: genericError });
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return res.status(401).json({ error: genericError });

      await query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);
      return res.json({ success: true, message: '登录成功', token: issueToken(user), user: publicUser(user) });
    }

    // 2) 本地未命中：若 LDAP 启用则尝试 LDAP（输入当 uid 或 email 交给 LDAP 过滤器）
    const ldapUser = await ldapService.authenticate(loginInput, password);
    if (!ldapUser) return res.status(401).json({ error: genericError });

    // LDAP 返回的 email 若与某个本地账号撞车，沿用本地账号（避免 LDAP 接管管理员）
    const conflict = await query('SELECT * FROM users WHERE email = ?', [ldapUser.email]);
    if (conflict.length > 0 && conflict[0].auth_source === AUTH_SOURCE.LOCAL) {
      return res.status(401).json({ error: genericError });
    }

    let user;
    if (conflict.length > 0) {
      user = conflict[0];
      await query('UPDATE users SET username = ?, ldap_dn = ?, last_login = NOW() WHERE id = ?',
        [ldapUser.username, ldapUser.dn, user.id]);
      user.username = ldapUser.username;
      user.ldap_dn = ldapUser.dn;
    } else {
      const id = crypto.randomUUID();
      await query(
        'INSERT INTO users (id, email, username, password, role, auth_source, ldap_dn, last_login) VALUES (?, ?, ?, NULL, ?, ?, ?, NOW())',
        [id, ldapUser.email, ldapUser.username, 'user', AUTH_SOURCE.LDAP, ldapUser.dn]
      );
      user = {
        id,
        email: ldapUser.email,
        username: ldapUser.username,
        role: ROLE.USER,
        avatar: null,
        auth_source: AUTH_SOURCE.LDAP,
      };
    }

    return res.json({ success: true, message: '登录成功', token: issueToken(user), user: publicUser(user) });
  } catch (err) {
    console.error('Login failed:', err);
    res.status(500).json({ error: '登录失败，请稍后重试' });
  }
});

// GET /api/auth/me - 获取当前用户信息
router.get('/me', requireAuth, async (req, res) => {
  try {
    const users = await query('SELECT id, email, username, avatar, role, permissions, created_at, last_login FROM users WHERE id = ?', [req.authUser.userId]);
    if (users.length === 0) {
      return res.status(401).json({ error: '用户不存在' });
    }

    res.json({ user: parsePermissions(users[0]) });
  } catch (err) {
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

// PUT /api/auth/profile - 更新用户资料
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { username, avatar } = req.body;

    if (username) {
      await query('UPDATE users SET username = ? WHERE id = ?', [username, req.authUser.userId]);
    }
    if (avatar) {
      await query('UPDATE users SET avatar = ? WHERE id = ?', [avatar, req.authUser.userId]);
    }

    const users = await query('SELECT id, email, username, avatar, role FROM users WHERE id = ?', [req.authUser.userId]);
    res.json({ success: true, user: users[0] });
  } catch (err) {
    console.error('Update profile failed:', err);
    res.status(500).json({ error: '更新资料失败' });
  }
});

// PUT /api/auth/password - 修改密码
router.put('/password', requireAuth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: '请填写旧密码和新密码' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: '新密码至少需要6个字符' });
    }

    // 验证旧密码
    const users = await query('SELECT password FROM users WHERE id = ?', [req.authUser.userId]);
    const isValid = await bcrypt.compare(oldPassword, users[0].password);
    if (!isValid) {
      return res.status(400).json({ error: '旧密码错误' });
    }

    // 更新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.authUser.userId]);

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
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: '未登录' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const users = await query('SELECT role FROM users WHERE id = ?', [decoded.userId]);
    if (users.length === 0 || users[0].role !== ROLE.ADMIN) {
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
      'SELECT id, email, username, avatar, role, permissions, auth_source, ldap_dn, created_at, last_login FROM users ORDER BY created_at DESC'
    );
    const parsedUsers = users.map(parsePermissions);
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
    if (id === req.adminUser.userId && role && role !== ROLE.ADMIN) {
      return res.status(400).json({ error: '不能取消自己的管理员权限' });
    }

    if (username) {
      await query('UPDATE users SET username = ? WHERE id = ?', [username, id]);
    }
    if (role && [ROLE.ADMIN, ROLE.USER].includes(role)) {
      await query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    }
    if (password && password.length >= 6) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await query('UPDATE users SET password = ? WHERE id = ? AND auth_source = ?', [hashedPassword, id, AUTH_SOURCE.LOCAL]);
      if (result.affectedRows === 0) {
        const targetRows = await query('SELECT auth_source FROM users WHERE id = ?', [id]);
        if (targetRows.length > 0 && targetRows[0].auth_source === AUTH_SOURCE.LDAP) {
          return res.status(400).json({ error: 'LDAP 用户的密码由目录服务器管理，不能在此重置' });
        }
      }
    }
    // 更新权限配置（仅对非管理员用户）
    if (permissions !== undefined) {
      await query('UPDATE users SET permissions = ? WHERE id = ?', [
        permissions ? JSON.stringify(permissions) : null,
        id
      ]);
    }

    const users = await query('SELECT id, email, username, avatar, role, permissions, created_at, last_login FROM users WHERE id = ?', [id]);
    res.json({ success: true, user: parsePermissions(users[0]) });
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
    const [admins, targetUser] = await Promise.all([
      query('SELECT id FROM users WHERE role = ?', [ROLE.ADMIN]),
      query('SELECT role FROM users WHERE id = ?', [id])
    ]);

    if (targetUser.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    if (targetUser[0].role === ROLE.ADMIN && admins.length <= 1) {
      return res.status(400).json({ error: '不能删除最后一个管理员' });
    }

    await query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ success: true, message: '用户已删除' });
  } catch (err) {
    console.error('Delete user failed:', err);
    res.status(500).json({ error: '删除用户失败' });
  }
});

// ========== LDAP 集成（管理员）==========

// GET /api/auth/ldap/config - 读取 LDAP 配置（密码脱敏）
router.get('/ldap/config', requireAdmin, async (req, res) => {
  try {
    const cfg = await ldapService.getLdapConfig();
    res.json({ config: cfg, dialects: ldapService.getDialects() });
  } catch (err) {
    console.error('Get LDAP config failed:', err);
    res.status(500).json({ error: '读取 LDAP 配置失败' });
  }
});

// PUT /api/auth/ldap/config - 保存 LDAP 配置
router.put('/ldap/config', requireAdmin, async (req, res) => {
  try {
    const cfg = await ldapService.setLdapConfig(req.body || {});
    res.json({ success: true, config: cfg });
  } catch (err) {
    console.error('Save LDAP config failed:', err);
    res.status(500).json({ error: '保存 LDAP 配置失败' });
  }
});

// POST /api/auth/ldap/test-connection - 用当前请求体里的配置测试连通性
router.post('/ldap/test-connection', requireAdmin, async (req, res) => {
  try {
    const body = req.body || {};
    let cfg = { ...body };
    if (!body.bindPassword || body.bindPassword === MASKED_PASSWORD) {
      const saved = await ldapService.getLdapConfig({ includeSecret: true });
      cfg.bindPassword = saved.bindPassword;
    }
    const result = await ldapService.testConnection(cfg);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message || '连接失败' });
  }
});

module.exports = router;
module.exports.initUserTable = initUserTable;
