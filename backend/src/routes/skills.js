const express = require('express');
const Skill = require('../models/skill');
const path = require('path');
const fs = require('fs').promises;
const axios = require('axios');
const multer = require('multer');
const AdmZip = require('adm-zip');

// 配置文件上传
const upload = multer({ dest: '/tmp/skill-uploads/' });

const router = express.Router();

// 可配置的 skills 目录（支持多个路径）
const SKILLS_DIRS = [
  '/root/.agents/skills',
  path.join(__dirname, '../../skills'),
];

// GET /api/skills - 获取所有技能
router.get('/', async (req, res) => {
  try {
    const skills = await Skill.getAll();
    res.json(skills);
  } catch (err) {
    console.error('Failed to get skills:', err);
    res.status(500).json({ error: '获取技能列表失败' });
  }
});

// GET /api/skills/:id - 获取单个技能
router.get('/:id', async (req, res) => {
  try {
    const skill = await Skill.getById(req.params.id);
    if (!skill) {
      return res.status(404).json({ error: '技能不存在' });
    }
    res.json(skill);
  } catch (err) {
    console.error('Failed to get skill:', err);
    res.status(500).json({ error: '获取技能失败' });
  }
});

// PUT /api/skills/:id - 更新技能配置
router.put('/:id', async (req, res) => {
  try {
    const skill = await Skill.update(req.params.id, req.body);
    if (!skill) {
      return res.status(404).json({ error: '技能不存在' });
    }
    res.json(skill);
  } catch (err) {
    console.error('Failed to update skill:', err);
    res.status(500).json({ error: '更新技能失败' });
  }
});

// POST /api/skills/sync - 从所有配置目录同步技能定义
router.post('/sync', async (req, res) => {
  try {
    let allSkills = [];

    for (const skillsDir of SKILLS_DIRS) {
      try {
        const stats = await fs.stat(skillsDir);
        if (stats.isDirectory()) {
          const skills = await Skill.syncToDatabase(skillsDir);
          allSkills = allSkills.concat(skills);
          console.log(`Loaded ${skills.length} skills from ${skillsDir}`);
        }
      } catch (dirErr) {
        console.log(`Skills directory not found: ${skillsDir}`);
      }
    }

    // 去重（以 id 为唯一标识）
    const uniqueSkills = [...new Map(allSkills.map(s => [s.id, s])).values()];

    res.json({ message: '技能同步成功', count: uniqueSkills.length, skills: uniqueSkills });
  } catch (err) {
    console.error('Failed to sync skills:', err);
    res.status(500).json({ error: '同步技能失败' });
  }
});

// GET /api/skills/dirs - 获取可用的 skills 目录列表
router.get('/dirs', async (req, res) => {
  try {
    const dirs = [];
    for (const dir of SKILLS_DIRS) {
      try {
        const stats = await fs.stat(dir);
        if (stats.isDirectory()) {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          const skillCount = entries.filter(e => e.isDirectory()).length;
          dirs.push({ path: dir, available: true, skillCount });
        }
      } catch (e) {
        dirs.push({ path: dir, available: false, skillCount: 0 });
      }
    }
    res.json(dirs);
  } catch (err) {
    res.status(500).json({ error: '获取目录列表失败' });
  }
});

// GET /api/skills/raw/:id - 获取技能原始内容
router.get('/raw/:id', async (req, res) => {
  try {
    const { id } = req.params;

    for (const skillsDir of SKILLS_DIRS) {
      const skillFile = path.join(skillsDir, id, 'SKILL.md');
      try {
        const content = await fs.readFile(skillFile, 'utf-8');
        return res.json({ id, content, path: skillFile });
      } catch (e) {
        // 继续尝试下一个目录
      }
    }

    res.status(404).json({ error: '技能文件不存在' });
  } catch (err) {
    res.status(500).json({ error: '获取技能内容失败' });
  }
});

// POST /api/skills/import - 从URL导入技能
router.post('/import', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: '请提供URL地址' });
    }

    // 确定要下载的URL
    let skillUrl = url;
    // 如果是目录URL，尝试访问SKILL.md
    if (!url.endsWith('.md')) {
      skillUrl = url.endsWith('/') ? `${url}SKILL.md` : `${url}/SKILL.md`;
    }

    // 下载文件
    const response = await axios.get(skillUrl, { timeout: 30000 });
    const content = response.data;

    // 解析SKILL.md内容
    const parsed = parseSkillMd(content);
    if (!parsed.id) {
      return res.status(400).json({ error: '无法解析技能ID，请检查SKILL.md格式' });
    }

    // 保存到第一个可用的skills目录
    const targetDir = SKILLS_DIRS[0];
    const skillDir = path.join(targetDir, parsed.id);
    const skillFile = path.join(skillDir, 'SKILL.md');

    // 创建目录
    await fs.mkdir(skillDir, { recursive: true });

    // 保存文件
    await fs.writeFile(skillFile, content, 'utf-8');

    // 同步到数据库
    await Skill.syncToDatabase(targetDir);

    res.json({
      success: true,
      id: parsed.id,
      name: parsed.name,
      description: parsed.description,
      path: skillFile
    });
  } catch (err) {
    console.error('Failed to import skill:', err);
    if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
      return res.status(400).json({ error: '无法访问指定的URL地址' });
    }
    res.status(500).json({ error: err.response?.data?.error || err.message || '导入失败' });
  }
});

// POST /api/skills/import/file - 从文件导入技能
router.post('/import/file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传文件' });
    }

    const filePath = req.file.path;
    const originalName = req.file.originalname;

    let content;
    let skillId = null;

    if (originalName.endsWith('.md')) {
      // 直接是SKILL.md文件
      content = await fs.readFile(filePath, 'utf-8');
    } else if (originalName.endsWith('.zip')) {
      // 解压zip文件
      const zip = new AdmZip(filePath);
      const zipEntries = zip.getEntries();

      // 查找SKILL.md文件
      const skillEntry = zipEntries.find(e => e.entryName.endsWith('SKILL.md'));
      if (!skillEntry) {
        await fs.unlink(filePath);
        return res.status(400).json({ error: 'ZIP文件中未找到SKILL.md' });
      }

      content = skillEntry.getData().toString('utf8');

      // 提取skill id（从路径中）
      const pathMatch = skillEntry.entryName.match(/\/?([^\/]+)\/SKILL\.md$/);
      if (pathMatch) {
        skillId = pathMatch[1];
      }

      // 解压到目标目录
      const targetDir = SKILLS_DIRS[0];
      zip.extractAllTo(targetDir, true);
    } else {
      await fs.unlink(filePath);
      return res.status(400).json({ error: '不支持的文件格式，请上传 .md 或 .zip 文件' });
    }

    // 解析内容
    const parsed = parseSkillMd(content);
    if (!parsed.id && !skillId) {
      await fs.unlink(filePath);
      return res.status(400).json({ error: '无法解析技能ID，请检查SKILL.md格式' });
    }

    // 使用解析的ID或从路径提取的ID
    const finalId = parsed.id || skillId;

    // 如果是单个md文件，保存到目录
    if (originalName.endsWith('.md')) {
      const targetDir = SKILLS_DIRS[0];
      const skillDir = path.join(targetDir, finalId);
      const skillFile = path.join(skillDir, 'SKILL.md');

      await fs.mkdir(skillDir, { recursive: true });
      await fs.writeFile(skillFile, content, 'utf-8');
    }

    // 同步到数据库
    await Skill.syncToDatabase(SKILLS_DIRS[0]);

    // 清理临时文件
    await fs.unlink(filePath);

    res.json({
      success: true,
      id: finalId,
      name: parsed.name,
      description: parsed.description
    });
  } catch (err) {
    console.error('Failed to import skill from file:', err);
    if (req.file) {
      try { await fs.unlink(req.file.path); } catch (e) {}
    }
    res.status(500).json({ error: err.message || '导入失败' });
  }
});

// 解析SKILL.md内容
function parseSkillMd(content) {
  const result = {};

  // 解析front matter
  const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (frontMatterMatch) {
    const frontMatter = frontMatterMatch[1];
    const lines = frontMatter.split('\n');

    for (const line of lines) {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        result[match[1]] = match[2].trim();
      }
    }
  }

  // 如果没有front matter，尝试从内容中提取
  if (!result.id) {
    const idMatch = content.match(/id:\s*['"]?([\w-]+)['"]?/i);
    if (idMatch) result.id = idMatch[1];
  }
  if (!result.name) {
    const nameMatch = content.match(/name:\s*['"]?(.+)['"]?/i);
    if (nameMatch) result.name = nameMatch[1].trim();
  }
  if (!result.description) {
    const descMatch = content.match(/description:\s*['"]?(.+)['"]?/i);
    if (descMatch) result.description = descMatch[1].trim();
  }

  return result;
}

module.exports = router;