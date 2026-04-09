const { query, getPool } = require('../models');
const { v4: uuidv4 } = require('uuid');

class Agent {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.skills = data.skills || [];
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  static async getAll() {
    const rows = await query('SELECT * FROM agents ORDER BY created_at DESC');
    return rows.map(row => new Agent({
      ...row,
      skills: typeof row.skills === 'string' ? JSON.parse(row.skills) : (row.skills || []),
    }));
  }

  static async getById(id) {
    const rows = await query('SELECT * FROM agents WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    const row = rows[0];
    return new Agent({
      ...row,
      skills: typeof row.skills === 'string' ? JSON.parse(row.skills) : (row.skills || []),
    });
  }

  static async create(data) {
    const id = data.id || uuidv4();
    await query(
      'INSERT INTO agents (id, name, description, skills) VALUES (?, ?, ?, ?)',
      [id, data.name, data.description || '', JSON.stringify(data.skills || [])]
    );
    return this.getById(id);
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
    if (data.skills !== undefined) {
      updates.push('skills = ?');
      values.push(JSON.stringify(data.skills));
    }

    if (updates.length === 0) return this.getById(id);

    values.push(id);
    await query(`UPDATE agents SET ${updates.join(', ')} WHERE id = ?`, values);
    return this.getById(id);
  }

  static async delete(id) {
    await query('DELETE FROM agents WHERE id = ?', [id]);
    return true;
  }
}

module.exports = Agent;