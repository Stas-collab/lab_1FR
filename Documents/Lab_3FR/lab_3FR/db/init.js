import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import 'dotenv/config';

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
  multipleStatements: true,
});

const sql = await fs.readFile(path.join(process.cwd(), 'db', 'schema.sql'), 'utf8');
await pool.query(sql);
console.log('Tables created.');

const hash = crypto.createHash('md5').update(sql).digest('hex');
await pool.execute('INSERT INTO migrations (hash) VALUES (?)', [hash]);
console.log('Migration hash saved.');

await pool.end();
