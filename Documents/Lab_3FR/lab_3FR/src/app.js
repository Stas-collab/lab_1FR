import Fastify from 'fastify';
import fastifyEnv from '@fastify/env';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';

import { envSchema } from '#config/env.schema.js';
import { taskSchema } from '#schemas/task.schema.js';
import { errorHandler } from '#utils/errorHandler.js';
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
          ? {
              target: 'pino-pretty',
              options: { colorize: true, translateTime: 'HH:MM:ss' },
            }
          : undefined,
    },
  });

  // 1. @fastify/env — fastify.config доступний для всіх наступних плагінів
  await fastify.register(fastifyEnv, {
    schema: envSchema,
    dotenv: true,
  });

  // 2. @fastify/helmet — захисні заголовки для всіх відповідей
  await fastify.register(helmet, { global: true });

  // 3. @fastify/cors — CORS заголовки для всіх відповідей
  await fastify.register(cors, {
    origin: fastify.config.NODE_ENV === 'production' ? 'https://example.com' : '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  });

  // 4. @fastify/sensible — reply.notFound(), reply.unauthorized() тощо
  await fastify.register(sensible);

  // 5. Спільна схема Task — реєструється до маршрутів щоб $ref: 'Task#' працював
  fastify.addSchema(taskSchema);

  // 6. setErrorHandler — реєструється до маршрутів щоб перехоплювати їх помилки
  fastify.setErrorHandler(errorHandler);

  // 7. Глобальний хук — виконується для кожного запиту (демонстрація global vs local hook)
  fastify.addHook('onRequest', async (request) => {
    request.log.info({ method: request.method, url: request.url }, 'Incoming request');
  });

  // 8. Маршрути — останніми, залежать від усіх попередніх компонентів
  await fastify.register(healthRoutes);
  await fastify.register(tasksRoutes);

  // onClose хук — виконується при fastify.close()
  fastify.addHook('onClose', async (instance) => {
    instance.log.info('Server closed — all connections terminated');
  });

  return fastify;
};
