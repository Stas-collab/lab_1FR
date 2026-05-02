export const createTasksRepository = (db) => ({
  async findAll() {
    const [rows] = await db.execute('SELECT * FROM tasks ORDER BY id ASC');
    return rows.map(toDTO);
  },

  async findById(id) {
    const [rows] = await db.execute('SELECT * FROM tasks WHERE id = ?', [id]);
    return rows[0] ? toDTO(rows[0]) : null;
  },

  async create(data) {
    const { title, done = false, priority, dueDate = '', image = null } = data;
    const [result] = await db.execute(
      'INSERT INTO tasks (title, done, priority, dueDate, image) VALUES (?, ?, ?, ?, ?)',
      [title, done ? 1 : 0, priority, dueDate, image]
    );
    return this.findById(result.insertId);
  },

  async update(id, updates) {
    const task = await this.findById(id);
    if (!task) return null;

    delete updates.id;
    const merged = { ...task, ...updates };

    await db.execute(
      'UPDATE tasks SET title=?, done=?, priority=?, dueDate=?, image=? WHERE id=?',
      [merged.title, merged.done ? 1 : 0, merged.priority, merged.dueDate ?? '', merged.image, id]
    );
    return this.findById(id);
  },

  async remove(id) {
    const [result] = await db.execute('DELETE FROM tasks WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },
});

const toDTO = (row) => ({
  id: row.id,
  title: row.title,
  done: row.done === 1 || row.done === true,
  priority: row.priority,
  dueDate: row.dueDate ?? '',
  image: row.image ?? null,
});
