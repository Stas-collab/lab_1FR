import { REDIS_KEYS } from '#constants/redisKeys.js';

export const createTasksServiceV2 = ({ tasksService, redis }) => ({
  async findAllPaginated(query) {
    const page = Math.max(1, parseInt(query.page ?? '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(query.limit ?? '10', 10)));

    const cacheKey = REDIS_KEYS.itemsPage(page, limit);

    // 1. Перевірка кешу
    const cached = await redis.get(cacheKey);
    if (cached !== null) {
      return JSON.parse(cached);
    }

    // 2. Отримати з БД
    const all = await tasksService.findAll({});
    const total = all.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const safePage = Math.min(page, totalPages);
    const data = all.slice((safePage - 1) * limit, safePage * limit);

    const result = { data, meta: { total, page: safePage, limit, totalPages } };

    // 3. Зберегти в кеш на 24 години
    await redis.set(cacheKey, JSON.stringify(result), 'EX', 86400);

    return result;
  },

  async invalidateCache() {
    // Знайти всі ключі пагінації і видалити
    const keys = await redis.keys('items:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  },
});
