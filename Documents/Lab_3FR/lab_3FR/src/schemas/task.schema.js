// Спільна форма об'єкта Task — додано dueDate та image
export const taskSchema = {
  $id: 'Task',
  type: 'object',
  properties: {
    id: { type: 'integer' },
    title: { type: 'string' },
    done: { type: 'boolean' },
    priority: { type: 'string', enum: ['low', 'medium', 'high'] },
    dueDate: { type: 'string' },
    image: { type: ['string', 'null'] },
  },
};

// GET /tasks
export const getTasksSchema = {
  tags: ['tasks-v1'],
  querystring: {
    type: 'object',
    properties: {
      priority: { type: 'string', enum: ['low', 'medium', 'high'] },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: 'array',
      items: { $ref: 'Task#' },
    },
  },
};

// POST /tasks
export const createTaskSchema = {
  tags: ['tasks-v1'],
  body: {
    type: 'object',
    required: ['title', 'priority'],
    properties: {
      title: { type: 'string', minLength: 1 },
      priority: { type: 'string', enum: ['low', 'medium', 'high'] },
      done: { type: 'boolean' },
      dueDate: { type: 'string' },
    },
    additionalProperties: false,
  },
  response: {
    201: { $ref: 'Task#' },
  },
};

// PATCH /tasks/:id
export const updateTaskSchema = {
  params: {
    type: 'object',
    properties: {
      id: { type: 'integer', minimum: 1 },
    },
    required: ['id'],
  },
  body: {
    type: 'object',
    properties: {
      title: { type: 'string', minLength: 1 },
      priority: { type: 'string', enum: ['low', 'medium', 'high'] },
      done: { type: 'boolean' },
      dueDate: { type: 'string' },
    },
    minProperties: 1,
    additionalProperties: false,
  },
  response: {
    200: { $ref: 'Task#' },
  },
};

// DELETE /tasks/:id
export const deleteTaskSchema = {
  params: {
    type: 'object',
    properties: {
      id: { type: 'integer', minimum: 1 },
    },
    required: ['id'],
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  },
};

// POST /tasks/:id/image
export const uploadImageSchema = {
  params: {
    type: 'object',
    properties: {
      id: { type: 'integer', minimum: 1 },
    },
    required: ['id'],
  },
  response: {
    200: { $ref: 'Task#' },
  },
};

// GET /tasks/export — без body schema (повертає CSV)
export const exportTasksSchema = {
  tags: ['tasks-v1'],
  querystring: {
    type: 'object',
    properties: {
      transform: { type: 'string', enum: ['true', 'false'] },
    },
    additionalProperties: false,
  },
};

// POST /tasks/import
export const importTasksSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        imported: { type: 'integer' },
        rejectedCount: { type: 'integer' },
        rejected: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              index: { type: 'integer' },
              reason: { type: 'string' },
            },
          },
        },
      },
    },
  },
};

// GET /api/v1/tasks/:id/details
export const getTaskDetailsSchema = {
  tags: ['tasks-v1'],
  params: {
    type: 'object',
    properties: { id: { type: 'integer', minimum: 1 } },
    required: ['id'],
  },
  response: {
    200: {
      type: 'object',
      additionalProperties: true,
      properties: {
        id: { type: 'integer' },
        title: { type: 'string' },
        done: { type: 'boolean' },
        dueDate: { type: 'string' },
        image: { type: ['string', 'null'] },
      },
    },
  },
};

// GET /api/v2/items (пагінація)
export const getTasksPaginatedSchema = {
  tags: ['tasks-v2'],
  querystring: {
    type: 'object',
    properties: {
      page: { type: 'integer', minimum: 1, default: 1 },
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: 'Task#' },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
      },
    },
  },
};

export const streamTasksSchema = {
  tags: ['tasks-v1'],
  response: {
    200: {
      type: 'string',
      description: 'NDJSON stream of tasks',
    },
  },
};
