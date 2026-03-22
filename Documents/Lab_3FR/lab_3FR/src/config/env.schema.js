export const envSchema = {
  type: 'object',
  properties: {
    PORT: { type: 'string', pattern: '^[0-9]+$' },
    APP_HOSTNAME: { type: 'string', minLength: 1 },
    NODE_ENV: { type: 'string', enum: ['development', 'production'] },
    ADMIN_API_KEY: { type: 'string', minLength: 1 },
  },
  required: ['PORT', 'APP_HOSTNAME', 'NODE_ENV', 'ADMIN_API_KEY'],
};
