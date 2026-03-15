require('dotenv').config();

const Ajv = require('ajv');

const ajv = new Ajv();

const envSchema = {
  type: 'object',
  properties: {
    PORT: { type: 'string', pattern: '^[0-9]+$' },
    APP_HOSTNAME: { type: 'string', minLength: 1 },
    NODE_ENV: { type: 'string', enum: ['development', 'production'] },
  },
  required: ['PORT', 'APP_HOSTNAME', 'NODE_ENV'],
};

function validateEnv() {
  const valid = ajv.validate(envSchema, process.env);

  if (!valid) {
    console.error('ENV validation failed:', ajv.errorsText());
    process.exit(1);
  }

  return {
    PORT: Number(process.env.PORT),
    HOSTNAME: process.env.APP_HOSTNAME,
    NODE_ENV: process.env.NODE_ENV,
  };
}

module.exports = validateEnv();
