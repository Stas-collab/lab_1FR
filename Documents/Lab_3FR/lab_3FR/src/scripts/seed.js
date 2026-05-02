import mysql from 'mysql2/promise';
import 'dotenv/config';

const TASKS = [
  { title: 'Learn Node.js', done: false, priority: 'high', dueDate: '2025-06-01' },
  { title: 'Read Fastify docs', done: false, priority: 'medium', dueDate: '2025-06-10' },
  { title: 'Write lab report', done: true, priority: 'low', dueDate: '2025-05-30' },
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

  const [rows] = await pool.execute('SELECT COUNT(*) as count FROM tasks');
  const count = rows[0].count;

  if (!force && count > 0) {
    console.log(`DB already has ${count} tasks. Use seed:force to reset.`);
    await pool.end();
    return;
  }

  if (force) {
    await pool.execute('DELETE FROM tasks');
    await pool.execute('ALTER TABLE tasks AUTO_INCREMENT = 1');
    console.log('Cleared existing tasks.');
  }

  for (const task of TASKS) {
    await pool.execute('INSERT INTO tasks (title, done, priority, dueDate) VALUES (?, ?, ?, ?)', [
      task.title,
      task.done ? 1 : 0,
      task.priority,
      task.dueDate,
    ]);
  }

  console.log(`Seeded ${TASKS.length} tasks.`);
  await pool.end();
};

const force = process.argv.includes('--force');
seed(force);
