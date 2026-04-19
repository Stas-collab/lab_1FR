export const envSchema = {
  type: 'object',
  required: ['PORT', 'APP_HOSTNAME', 'NODE_ENV', 'ADMIN_API_KEY'],
  properties: {
    GITHUB_TOKEN: {
      type: 'string',
      default: '',
    },
    PORT: {
      type: 'string',
      default: '3000',
    },
    APP_HOSTNAME: {
      type: 'string',
      default: '0.0.0.0',
    },
    NODE_ENV: {
      type: 'string',
      default: 'development',
    },
    ADMIN_API_KEY: {
      type: 'string',
      default: 'secret-admin-key',
    },
  },
};
