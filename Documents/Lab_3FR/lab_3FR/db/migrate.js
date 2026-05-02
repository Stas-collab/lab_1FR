import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

const SCHEMA_FILE = path.join(process.cwd(), 'db', 'schema.sql');

export const getSchemaHash = async () => {
  const sql = await fs.readFile(SCHEMA_FILE, 'utf8');
  return crypto.createHash('md5').update(sql).digest('hex');
};

export const checkMigration = async (fastify) => {
  const currentHash = await getSchemaHash();

  const [rows] = await fastify.mysql.execute(
    'SELECT hash FROM migrations ORDER BY id DESC LIMIT 1'
  );

  const savedHash = rows[0]?.hash ?? null;

  if (currentHash !== savedHash) {
    fastify.log.warn('DB schema changed. Run "npm run db:init" to apply changes.');
  }
};

export const saveMigrationHash = async (fastify) => {
  const hash = await getSchemaHash();
  await fastify.mysql.execute('INSERT INTO migrations (hash) VALUES (?)', [hash]);
};
