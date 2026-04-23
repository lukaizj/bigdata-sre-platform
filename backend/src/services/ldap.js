const { Client } = require('ldapts');
const { query } = require('../models');
const { encrypt, decrypt } = require('../utils/crypto');

const SETTINGS_KEY = 'ldap';
const MASKED_PASSWORD = '********';

const DEFAULT_CONFIG = {
  enabled: false,
  dialect: 'openldap',
  url: '',
  bindDN: '',
  bindPassword: '',
  searchBase: '',
  searchFilter: '(uid={{username}})',
  emailAttribute: 'mail',
  nameAttribute: 'cn',
  tlsEnabled: false,
};

const DIALECT_DEFAULTS = {
  openldap: { searchFilter: '(uid={{username}})', nameAttribute: 'cn', emailAttribute: 'mail' },
  ad: { searchFilter: '(sAMAccountName={{username}})', nameAttribute: 'displayName', emailAttribute: 'mail' },
};

let memoryConfig = { ...DEFAULT_CONFIG };
let configLoadedAt = 0;
const CONFIG_TTL_MS = 30_000;

async function loadConfig() {
  const now = Date.now();
  if (now - configLoadedAt < CONFIG_TTL_MS) return memoryConfig;
  try {
    const rows = await query('SELECT value FROM settings WHERE `key` = ?', [SETTINGS_KEY]);
    if (rows.length > 0) {
      const parsed = JSON.parse(rows[0].value);
      memoryConfig = { ...DEFAULT_CONFIG, ...parsed };
      configLoadedAt = now;
    }
  } catch (e) {
    // settings 表不存在或解析失败，沿用内存默认
  }
  return memoryConfig;
}

async function getLdapConfig({ includeSecret = false } = {}) {
  await loadConfig();
  const cfg = { ...memoryConfig };
  if (includeSecret) {
    cfg.bindPassword = cfg.bindPassword ? decrypt(cfg.bindPassword) : '';
  } else {
    cfg.bindPassword = cfg.bindPassword ? MASKED_PASSWORD : '';
  }
  return cfg;
}

async function setLdapConfig(partial) {
  const current = await getLdapConfig({ includeSecret: true });
  const next = { ...current, ...partial };

  if (partial.bindPassword === MASKED_PASSWORD || partial.bindPassword === undefined) {
    next.bindPassword = current.bindPassword;
  }
  next.bindPassword = next.bindPassword ? encrypt(next.bindPassword) : '';

  try {
    await query(
      'INSERT INTO settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?',
      [SETTINGS_KEY, JSON.stringify(next), JSON.stringify(next)]
    );
  } catch (e) {
    console.error('Save LDAP config failed:', e.message);
  }
  memoryConfig = next;
  const cfg = { ...next };
  cfg.bindPassword = cfg.bindPassword ? MASKED_PASSWORD : '';
  return cfg;
}

function applyDialectDefaults(cfg) {
  const d = DIALECT_DEFAULTS[cfg.dialect] || DIALECT_DEFAULTS.openldap;
  return {
    ...cfg,
    searchFilter: cfg.searchFilter || d.searchFilter,
    emailAttribute: cfg.emailAttribute || d.emailAttribute,
    nameAttribute: cfg.nameAttribute || d.nameAttribute,
  };
}

function buildFilter(template, username) {
  const escaped = String(username).replace(/[\\*()\0]/g, (c) => '\\' + c.charCodeAt(0).toString(16).padStart(2, '0'));
  return template.replace(/\{\{\s*username\s*\}\}/g, escaped);
}

function buildClient(cfg) {
  return new Client({
    url: cfg.url,
    timeout: 8000,
    connectTimeout: 8000,
    tlsOptions: cfg.tlsEnabled ? { rejectUnauthorized: false } : undefined,
  });
}

async function testConnection(rawCfg) {
  const cfg = applyDialectDefaults(rawCfg);
  if (!cfg.url) throw new Error('URL 不能为空');
  if (!cfg.bindDN) throw new Error('Bind DN 不能为空');
  if (!cfg.searchBase) throw new Error('Search Base 不能为空');

  const client = buildClient(cfg);
  try {
    await client.bind(cfg.bindDN, cfg.bindPassword);
    const { searchEntries } = await client.search(cfg.searchBase, {
      scope: 'sub',
      sizeLimit: 1,
    });
    return { success: true, entries: searchEntries.length, baseDN: cfg.searchBase };
  } finally {
    try { await client.unbind(); } catch (_) {}
  }
}

async function authenticate(username, password) {
  const cfg = applyDialectDefaults(await getLdapConfig({ includeSecret: true }));
  if (!cfg.enabled) return null;
  if (!username || !password) return null;
  if (!cfg.url || !cfg.bindDN || !cfg.searchBase) return null;

  const client = buildClient(cfg);
  try {
    await client.bind(cfg.bindDN, cfg.bindPassword);

    const filter = buildFilter(cfg.searchFilter, username);
    const { searchEntries } = await client.search(cfg.searchBase, {
      scope: 'sub',
      filter,
      attributes: [cfg.emailAttribute, cfg.nameAttribute, 'dn', 'uid', 'sAMAccountName'],
      sizeLimit: 1,
    });

    if (searchEntries.length === 0) return null;

    const entry = searchEntries[0];
    const userDN = entry.dn;

    try {
      await client.bind(userDN, password);
    } catch (e) {
      return null;
    } finally {
      try { await client.unbind(); } catch (_) {}
    }

    const rawEmail = entry[cfg.emailAttribute];
    const rawName = entry[cfg.nameAttribute];
    const email = Array.isArray(rawEmail) ? rawEmail[0] : rawEmail;
    const displayName = Array.isArray(rawName) ? rawName[0] : rawName;
    const uid = entry.uid || entry.sAMAccountName || username;

    return {
      dn: userDN,
      email: email || `${uid}@ldap.local`,
      username: displayName || uid || username,
      uid,
    };
  } catch (e) {
    console.error('LDAP authenticate failed:', e.message);
    try { await client.unbind(); } catch (_) {}
    return null;
  }
}

function getDialects() {
  return Object.keys(DIALECT_DEFAULTS);
}

module.exports = {
  getLdapConfig,
  setLdapConfig,
  testConnection,
  authenticate,
  getDialects,
};
