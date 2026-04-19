import fs from 'fs/promises';
import path from 'path';

const CACHE_FILE = path.join(process.cwd(), 'data', 'cache', 'reference.json');
const TTL_MS = 120_000; // 120 секунд
const EXT_URL = 'http://localhost:3001/priorities';

// ── Кеш ──────────────────────────────────────────────────────────────────────
const readCache = async () => {
  try {
    const raw = await fs.readFile(CACHE_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const writeCache = async (data) => {
  await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true });
  await fs.writeFile(CACHE_FILE, JSON.stringify({ ts: Date.now(), data }, null, 2), 'utf8');
};

// ── Fetch з timeout ───────────────────────────────────────────────────────────
const fetchWithTimeout = async (url, timeout = 5000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

// ── Retry з exponential backoff ───────────────────────────────────────────────
const fetchWithRetry = async (url, retries = 3) => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      if (attempt === retries - 1) throw error;
      const delay = 1000 * Math.pow(2, attempt); // 1с, 2с, 4с
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

// ── Публічний API ─────────────────────────────────────────────────────────────
/**
 * Повертає пріоритет за назвою (task.priority = 'high'/'medium'/'low').
 * При недоступності JSON Server — graceful degradation (null).
 */
export const fetchExternalDetails = async (priorityName) => {
  // 1. Перевірка кешу
  const cached = await readCache();
  if (cached && Date.now() - cached.ts < TTL_MS) {
    const found = cached.data?.find((p) => p.name === priorityName);
    return found ?? null;
  }

  // 2. Запит до зовнішнього сервісу
  try {
    const priorities = await fetchWithRetry(EXT_URL);
    await writeCache(priorities);
    return priorities.find((p) => p.name === priorityName) ?? null;
  } catch {
    // Graceful degradation — повертаємо null замість помилки
    return null;
  }
};
