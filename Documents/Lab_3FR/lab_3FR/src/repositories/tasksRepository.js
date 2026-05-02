import { eq } from 'drizzle-orm';
import { tasks } from '../../db/schema.js';

export const createTasksRepository = (db) => ({
  async findAll() {
    const rows = await db.select().from(tasks).orderBy(tasks.id);
    return rows.map(toDTO);
  },

  async findById(id) {
    const rows = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, Number(id)));
    return rows[0] ? toDTO(rows[0]) : null;
  },

  async create(data) {
    const { title, done = false, priority, dueDate = '', image = null } = data;
    const result = await db.insert(tasks).values({
      title,
      done: done ? 1 : 0,
      priority,
      dueDate,
      image,
    });
    return this.findById(result[0].insertId);
  },

  async update(id, updates) {
    const task = await this.findById(id);
    if (!task) return null;

    delete updates.id;
    const merged = { ...task, ...updates };

    await db
      .update(tasks)
      .set({
        title: merged.title,
        done: merged.done ? 1 : 0,
        priority: merged.priority,
        dueDate: merged.dueDate ?? '',
        image: merged.image,
      })
      .where(eq(tasks.id, Number(id)));

    return this.findById(id);
  },

  async remove(id) {
    const result = await db.delete(tasks).where(eq(tasks.id, Number(id)));
    return result[0].affectedRows > 0;
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
