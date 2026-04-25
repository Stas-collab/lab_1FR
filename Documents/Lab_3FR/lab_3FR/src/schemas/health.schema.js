export const healthSchema = {
  tags: ['health'],
  response: {
    200: {
      type: 'object',
      properties: {
        status: { type: 'string' },
      },
    },
  },
};

export const healthDetailsSchema = {
  tags: ['health'],
  response: {
    200: {
      type: 'object',
      properties: {
        pid: { type: 'integer' },
        nodeVersion: { type: 'string' },
        platform: { type: 'string' },
        uptime: { type: 'number' },
        memoryUsage: {
          type: 'object',
          properties: {
            rss: { type: 'integer' },
            heapTotal: { type: 'integer' },
            heapUsed: { type: 'integer' },
            external: { type: 'integer' },
          },
        },
      },
    },
  },
};
