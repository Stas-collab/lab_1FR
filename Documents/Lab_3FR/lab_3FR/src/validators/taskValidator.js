const Ajv = require('ajv');

const ajv = new Ajv();

const postBodySchema = {
  type: 'object',
  properties: {
    title: { type: 'string', minLength: 1 },
    priority: { type: 'string', enum: ['low', 'medium', 'high'] },
    done: { type: 'boolean' },
  },
  required: ['title', 'priority'],
  additionalProperties: false,
};

const patchBodySchema = {
  type: 'object',
  properties: {
    title: { type: 'string', minLength: 1 },
    priority: { type: 'string', enum: ['low', 'medium', 'high'] },
    done: { type: 'boolean' },
  },
  minProperties: 1,
  additionalProperties: false,
};

const querySchema = {
  type: 'object',
  properties: {
    priority: { type: 'string', enum: ['low', 'medium', 'high'] },
  },
  additionalProperties: false,
};

const paramsIdSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', pattern: '^[0-9]+$' },
  },
  required: ['id'],
};

const validatePost = ajv.compile(postBodySchema);
const validatePatch = ajv.compile(patchBodySchema);
const validateQuery = ajv.compile(querySchema);
const validateParams = ajv.compile(paramsIdSchema);

module.exports = { validatePost, validatePatch, validateQuery, validateParams };
