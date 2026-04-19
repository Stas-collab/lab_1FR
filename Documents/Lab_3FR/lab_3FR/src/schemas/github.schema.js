export const sharedReposSchema = {
  querystring: {
    type: 'object',
    required: ['repo'],
    properties: {
      repo: { type: 'string', description: 'Репозиторій у форматі owner/repo' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        targetRepo: { type: 'string' },
        source: { type: 'string' },
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              repo: { type: 'string' },
              sharedContributors: { type: 'integer' },
              stars: { type: 'integer' },
            },
          },
        },
      },
    },
  },
};
