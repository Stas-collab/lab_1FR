import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

import { ItemModel } from '#models/item.model.js';
import { writeAtomic } from '#utils/fileUtils.js';

const DATA_DIR = path.join(process.cwd(), 'data', 'items');
const VERSION_FILE = path.join(process.cwd(), 'data', 'version.json');

export const getModelHash = () =>
  crypto.createHash('md5').update(JSON.stringify(ItemModel)).digest('hex');

/**
 * Викликається при старті сервера.
 * Якщо хеш змінився — виводить warn і нічого не робить.
 * Сама міграція запускається через: npm run migrate
 */
export const checkMigration = async (fastify) => {
  const currentHash = getModelHash();
  let savedHash = null;

  try {
    const raw = await fs.readFile(VERSION_FILE, 'utf8');
    savedHash = JSON.parse(raw).hash;
  } catch {
    // version.json ще не існує — перший запуск
  }

  if (currentHash !== savedHash) {
    fastify.log.warn('Data schema changed. Run "npm run migrate" to update existing files.');
  }
};

// ── CLI entry point (npm run migrate) ────────────────────────────────────────
const runMigration = async () => {
  const currentHash = getModelHash();

  let savedHash = null;
  try {
    const raw = await fs.readFile(VERSION_FILE, 'utf8');
    savedHash = JSON.parse(raw).hash;
  } catch {
    // файл відсутній
  }

  if (currentHash === savedHash) {
    console.log('Migration not needed — schema is up to date.');
    process.exit(0);
  }

  const files = await fs.readdir(DATA_DIR).catch(() => []);
  const jsonFiles = files.filter((f) => f.endsWith('.json'));

  for (const file of jsonFiles) {
    const fp = path.join(DATA_DIR, file);
    const data = JSON.parse(await fs.readFile(fp, 'utf8'));
    // Додаємо відсутні поля з дефолтними значеннями, не чіпаємо наявні
    const merged = { ...ItemModel, ...data };
    await writeAtomic(fp, merged);
  }

  await writeAtomic(VERSION_FILE, { hash: currentHash });
  console.log(`Migration complete. Updated ${jsonFiles.length} file(s).`);
};

if (process.argv[1]?.includes('migrate.js')) {
  runMigration();
}
