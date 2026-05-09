export const REDIS_KEYS = {
  itemsPage: (page, limit) => `items:page:${page}:limit:${limit}`,
  itemsAll: () => 'items:*',
  externalPriority: () => 'external:priorities',
  refreshToken: (userId) => `refresh:${userId}`,
  blacklist: (jti) => `blacklist:${jti}`,
};
