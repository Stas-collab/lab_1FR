import fs from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import path from 'path';

const ITEMS_DIR = path.join(process.cwd(), 'data', 'items');
const BACKUPS_DIR = path.join(process.cwd(), 'data', 'backups');
const MAX_BACKUPS = 5;

export const runBackup = async () => {
  const files = await fs.readdir(ITEMS_DIR).catch(() => []);
  const jsonFiles = files.filter((f) => f.endsWith('.json'));
  if (!jsonFiles.length) return;

  await fs.mkdir(BACKUPS_DIR, { recursive: true });

  const timestamp = Date.now();
  const destPath = path.join(BACKUPS_DIR, `${timestamp}.gz`);

  // Об'єднуємо вміст усіх JSON файлів в один потік та стискаємо
  async function* readAllFiles() {
    for (const file of jsonFiles) {
      const filePath = path.join(ITEMS_DIR, file);
      yield `\n--- ${file} ---\n`;
      const readable = createReadStream(filePath, { encoding: 'utf8' });
      for await (const chunk of readable) {
        yield chunk;
      }
    }
  }

  await pipeline(Readable.from(readAllFiles()), createGzip(), createWriteStream(destPath));

  // Видаляємо старі бекапи — залишаємо тільки MAX_BACKUPS
  const allBackups = (await fs.readdir(BACKUPS_DIR)).filter((f) => f.endsWith('.gz')).sort();

  const toDelete = allBackups.slice(0, Math.max(0, allBackups.length - MAX_BACKUPS));
  await Promise.all(toDelete.map((f) => fs.unlink(path.join(BACKUPS_DIR, f))));
};
