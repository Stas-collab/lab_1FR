const EXT_URL = 'http://localhost:3001/priorities';
const TTL_SEC = 120;

const fetchWithTimeout = async (url, timeout = 5000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

const fetchWithRetry = async (url, retries = 3) => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      if (attempt === retries - 1) throw error;
      const delay = 1000 * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

export const createExternalFetchService = (redis) => ({
  async fetchPriorities(priorityName) {
    const cacheKey = 'external:priorities';

    const cached = await redis.get(cacheKey);
    if (cached !== null) {
      const priorities = JSON.parse(cached);
      return priorities.find((p) => p.name === priorityName) ?? null;
    }

    try {
      const priorities = await fetchWithRetry(EXT_URL);
      await redis.set(cacheKey, JSON.stringify(priorities), 'EX', TTL_SEC);
      return priorities.find((p) => p.name === priorityName) ?? null;
    } catch {
      return null;
    }
  },
});
