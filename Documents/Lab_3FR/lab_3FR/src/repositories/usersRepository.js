import { eq } from 'drizzle-orm';
import { users } from '../../db/schema.js';

export const createUsersRepository = (db) => ({
  async findByEmail(email) {
    const rows = await db.select().from(users).where(eq(users.email, email));
    return rows[0] ?? null;
  },

  async create(data) {
    const result = await db.insert(users).values(data);
    const id = result[0].insertId;
    const rows = await db
      .select({
        id: users.id,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, id));
    return rows[0] ?? null;
  },
});
