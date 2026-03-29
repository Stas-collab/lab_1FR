import Fastify from 'fastify';
import fastifyEnv from '@fastify/env';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'path';

import { envSchema } from '#config/env.schema.js';
import { taskSchema } from '#schemas/task.schema.js';
import { errorHandler } from '#utils/errorHandler.js';
import { runBackup } from '#utils/backup.js';
import { checkMigration } from '#migrations/migrate.js';
import tasksRoutes from '#routes/tasksRoutes.js';
import healthRoutes from '#routes/healthRoutes.js';

export const buildApp = async () => {
  const fastify = Fastify({
    logger: {
      // eslint-disable-next-line no-restricted-syntax
      level: process.env.NODE_ENV === 'production' ? 'error' : 'info',
      transport:
        // eslint-disable-next-line no-restricted-syntax
        process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } }
          : undefined,
    },
  });

  await fastify.register(fastifyEnv, { schema: envSchema, dotenv: true });
  await fastify.register(helmet, { global: true });
  await fastify.register(cors, {
    origin: fastify.config.NODE_ENV === 'production' ? 'https://example.com' : '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  });
  await fastify.register(sensible);

  // Multipart — для завантаження файлів (імпорт + зображення)
  await fastify.register(fastifyMultipart, {
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  });

  // Static — роздача зображень з uploads/
  await fastify.register(fastifyStatic, {
    root: path.join(process.cwd(), 'uploads'),
    prefix: '/uploads/',
  });

  fastify.addSchema(taskSchema);
  fastify.setErrorHandler(errorHandler);

  fastify.addHook('onRequest', async (request) => {
    request.log.info({ method: request.method, url: request.url }, 'Incoming request');
  });

  await fastify.register(healthRoutes);
  await fastify.register(tasksRoutes);

  fastify.addHook('onClose', async (instance) => {
    instance.log.info('Server closed — all connections terminated');
  });

  // Бекап та перевірка міграції при старті
  await runBackup();
  await checkMigration(fastify);

  return fastify;
};
