export const envSchema = {
  type: 'object',
  required: ['PORT', 'APP_HOSTNAME', 'NODE_ENV', 'ADMIN_API_KEY'],
  properties: {
    MYSQL_HOST: {
      type: 'string',
      default: '127.0.0.1',
    },
    REDIS_HOST: {
      type: 'string',
      default: '127.0.0.1',
    },
    REDIS_PORT: {
      type: 'string',
      default: '6379',
    },
    MYSQL_PORT: {
      type: 'string',
      default: '3306',
    },
    MYSQL_USER: {
      type: 'string',
      default: 'root',
    },
    MYSQL_PASSWORD: {
      type: 'string',
      default: '',
    },
    MYSQL_DB: {
      type: 'string',
      default: 'lab8',
    },
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
