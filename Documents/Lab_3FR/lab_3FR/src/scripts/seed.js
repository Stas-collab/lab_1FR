import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { tasks } from '../../db/schema.js';
import 'dotenv/config';

const TASKS = [
  { title: 'Learn Node.js', done: 0, priority: 'high', dueDate: '2025-06-01' },
  { title: 'Read Fastify docs', done: 0, priority: 'medium', dueDate: '2025-06-10' },
  { title: 'Write lab report', done: 1, priority: 'low', dueDate: '2025-05-30' },
];

const seed = async (force = false) => {
  const pool = mysql.createPool({
    // eslint-disable-next-line no-restricted-syntax
    host: process.env.MYSQL_HOST ?? '127.0.0.1',
    // eslint-disable-next-line no-restricted-syntax
    port: Number(process.env.MYSQL_PORT ?? 3306),
    // eslint-disable-next-line no-restricted-syntax
    user: process.env.MYSQL_USER ?? 'root',
    // eslint-disable-next-line no-restricted-syntax
    password: process.env.MYSQL_PASSWORD ?? '',
    // eslint-disable-next-line no-restricted-syntax
    database: process.env.MYSQL_DB ?? 'lab8',
  });

  const db = drizzle(pool, { mode: 'default' });

  const existing = await db.select().from(tasks);

  if (!force && existing.length > 0) {
    console.log(`DB already has ${existing.length} tasks. Use seed:force to reset.`);
    await pool.end();
    return;
  }

  if (force) {
    await db.delete(tasks);
    console.log('Cleared existing tasks.');
  }

  await db.insert(tasks).values(TASKS);
  console.log(`Seeded ${TASKS.length} tasks.`);
  await pool.end();
};

const force = process.argv.includes('--force');
seed(force);
