import fs from 'fs/promises';
import path from 'path';

const ITEMS_DIR = path.join(process.cwd(), 'data', 'items');
const BACKUPS_DIR = path.join(process.cwd(), 'data', 'backups');
const MAX_BACKUPS = 5;

export const runBackup = async () => {
  // Якщо папка items порожня або не існує — бекап не потрібен
  const files = await fs.readdir(ITEMS_DIR).catch(() => []);
  if (!files.length) return;

  const timestamp = Date.now();
  const dest = path.join(BACKUPS_DIR, String(timestamp));

  await fs.mkdir(dest, { recursive: true });

  await Promise.all(
    files
      .filter((f) => f.endsWith('.json'))
      .map((f) => fs.copyFile(path.join(ITEMS_DIR, f), path.join(dest, f)))
  );

  // Видаляємо старіші бекапи — залишаємо тільки MAX_BACKUPS
  const allBackups = (await fs.readdir(BACKUPS_DIR)).sort();
  const toDelete = allBackups.slice(0, Math.max(0, allBackups.length - MAX_BACKUPS));

  await Promise.all(toDelete.map((d) => fs.rm(path.join(BACKUPS_DIR, d), { recursive: true })));
};
