// Спільна форма об'єкта Task — реєструється через fastify.addSchema()
export const taskSchema = {
  $id: 'Task',
  type: 'object',
  properties: {
    id: { type: 'integer' },
    title: { type: 'string' },
    done: { type: 'boolean' },
    priority: { type: 'string', enum: ['low', 'medium', 'high'] },
  },
};

// GET /tasks
export const getTasksSchema = {
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
  body: {
    type: 'object',
    required: ['title', 'priority'],
    properties: {
      title: { type: 'string', minLength: 1 },
      priority: { type: 'string', enum: ['low', 'medium', 'high'] },
      done: { type: 'boolean' },
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
