const { query, isMemoryMode } = require('../models');
const fs = require('fs').promises;
const path = require('path');
const yaml = require('yaml');

class Skill {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.type = data.type;
    this.config = data.config || {};
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  static async getAll() {
    const rows = await query('SELECT * FROM skills ORDER BY created_at DESC');
    return rows.map(row => new Skill({
      ...row,
      config: typeof row.config === 'string' ? JSON.parse(row.config) : (row.config || {}),
    }));
  }

  static async getById(id) {
    const rows = await query('SELECT * FROM skills WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    const row = rows[0];
    return new Skill({
      ...row,
      config: typeof row.config === 'string' ? JSON.parse(row.config) : (row.config || {}),
    });
  }

  static async update(id, data) {
    const updates = [];
    const values = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }
    if (data.type !== undefined) {
      updates.push('type = ?');
      values.push(data.type);
    }
    if (data.config !== undefined) {
      updates.push('config = ?');
      values.push(JSON.stringify(data.config));
    }

    if (updates.length === 0) return this.getById(id);

    values.push(id);
    await query(`UPDATE skills SET ${updates.join(', ')} WHERE id = ?`, values);
    return this.getById(id);
  }

  // 从 SKILL.md 文件加载技能定义
  static async loadFromFiles(skillsDir) {
    const skills = [];

    try {
      const entries = await fs.readdir(skillsDir, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const skillDir = path.join(skillsDir, entry.name);
        const skillFile = path.join(skillDir, 'SKILL.md');

        try {
          const content = await fs.readFile(skillFile, 'utf-8');
          const parsed = parseSkillMD(content);
          if (parsed) {
            skills.push({
              id: entry.name,
              ...parsed,
            });
          }
        } catch (err) {
          console.warn(`Failed to load skill ${entry.name}:`, err.message);
        }
      }
    } catch (err) {
      console.warn('Failed to read skills directory:', err.message);
    }

    return skills;
  }

  // 同步文件定义到数据库
  static async syncToDatabase(skillsDir) {
    const fileSkills = await this.loadFromFiles(skillsDir);
    const dbSkills = await this.getAll();
    const dbMap = new Map(dbSkills.map(s => [s.id, s]));

    for (const fileSkill of fileSkills) {
      if (dbMap.has(fileSkill.id)) {
        // 更新已有技能（保留用户配置的 config）
        const existing = dbMap.get(fileSkill.id);
        await this.update(fileSkill.id, {
          name: fileSkill.name,
          description: fileSkill.description,
          type: fileSkill.type,
          // 合并 config：文件中的作为默认值
          config: { ...fileSkill.config, ...existing.config },
        });
      } else {
        // 创建新技能
        await query(
          'INSERT INTO skills (id, name, description, type, config) VALUES (?, ?, ?, ?, ?)',
          [fileSkill.id, fileSkill.name, fileSkill.description, fileSkill.type, JSON.stringify(fileSkill.config)]
        );
      }
    }

    return this.getAll();
  }
}

// 解析 SKILL.md 文件
function parseSkillMD(content) {
  if (!content.startsWith('---')) {
    return null;
  }

  const lines = content.split('\n');
  let endIdx = -1;

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      endIdx = i;
      break;
    }
  }

  if (endIdx === -1) return null;

  const frontMatter = lines.slice(1, endIdx).join('\n');

  try {
    const metadata = yaml.parse(frontMatter);
    const { name, description, type, ...config } = metadata;

    return {
      name: name || '',
      description: description || '',
      type: type || 'other',
      config,
    };
  } catch (err) {
    console.warn('Failed to parse YAML front matter:', err.message);
    return null;
  }
}

module.exports = Skill;