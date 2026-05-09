import Fastify from 'fastify';
import fastifyEnv from '@fastify/env';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import fastifyWebsocket from '@fastify/websocket';
import path from 'path';

import mysqlPlugin from '../db/mysql.js';
import drizzlePlugin from '../db/drizzle.js';
import redisPlugin from '../db/redis.js';
import { createTasksRepository } from '#repositories/tasksRepository.js';
import { createTasksService } from '#services/tasksService.js';
import { createTasksServiceV2 } from '#services/tasksServiceV2.js';
import { createExternalFetchService } from '#utils/externalFetch.js';

import { envSchema } from '#config/env.schema.js';
import { taskSchema } from '#schemas/task.schema.js';
import { errorHandler } from '#utils/errorHandler.js';
import tasksRoutesV1 from '#routes/tasksRoutes.js';
import healthRoutes from '#routes/healthRoutes.js';
import tasksRoutesV2 from '#routes/tasksRoutesV2.js';
import githubRoutesV1 from '#routes/githubRoutesV1.js';
import githubRoutesV2 from '#routes/githubRoutesV2.js';
import backupRoutes from '#routes/backupRoutes.js';

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
  await fastify.register(helmet, { global: true, contentSecurityPolicy: false });
  await fastify.register(cors, {
    origin: fastify.config.NODE_ENV === 'production' ? 'https://example.com' : '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  });
  await fastify.register(sensible);

  // ── MySQL + Drizzle ───────────────────────────────────────────────────────
  await fastify.register(mysqlPlugin);
  await fastify.register(drizzlePlugin);

  // ── Redis (ПЕРЕД rate-limit!) ─────────────────────────────────────────────
  await fastify.register(redisPlugin);

  // ── Dependency Injection ──────────────────────────────────────────────────
  const tasksRepository = createTasksRepository(fastify.drizzle);
  const tasksService = createTasksService(tasksRepository);
  const tasksServiceV2 = createTasksServiceV2({ tasksService, redis: fastify.redis });
  const externalFetchService = createExternalFetchService(fastify.redis);

  fastify.decorate('tasksService', tasksService);
  fastify.decorate('tasksServiceV2', tasksServiceV2);
  fastify.decorate('externalFetchService', externalFetchService);

  await fastify.register(fastifyWebsocket);
  await fastify.register(backupRoutes, { prefix: '/api/v1' });

  // ── Rate Limiting (з Redis store) ─────────────────────────────────────────
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    redis: fastify.redis,
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Try again in 1 minute.',
    }),
  });

  // ── Swagger ───────────────────────────────────────────────────────────────
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'Todo API',
        description: 'REST API for Todo tasks management (Lab 9 Redis)',
        version: '3.0.0',
      },
      tags: [
        { name: 'health', description: 'Health check endpoints' },
        { name: 'tasks-v1', description: 'Tasks API v1' },
        { name: 'tasks-v2', description: 'Tasks API v2 (with pagination + cache)' },
        { name: 'github', description: 'GitHub analytics' },
      ],
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list', deepLinking: false },
  });

  // ── Multipart & Static ────────────────────────────────────────────────────
  await fastify.register(fastifyMultipart, {
    limits: { fileSize: 5 * 1024 * 1024 },
  });

  await fastify.register(fastifyStatic, {
    root: path.join(process.cwd(), 'uploads'),
    prefix: '/uploads/',
  });

  fastify.addSchema(taskSchema);
  fastify.setErrorHandler(errorHandler);

  fastify.addHook('onRequest', async (request) => {
    request.log.info({ method: request.method, url: request.url }, 'Incoming request');
  });

  // ── Маршрути ──────────────────────────────────────────────────────────────
  await fastify.register(healthRoutes, { prefix: '/api/v1' });
  await fastify.register(tasksRoutesV1, { prefix: '/api/v1' });
  await fastify.register(tasksRoutesV2, { prefix: '/api/v2' });
  await fastify.register(githubRoutesV1, { prefix: '/api/v1' });
  await fastify.register(githubRoutesV2, { prefix: '/api/v2' });

  fastify.addHook('onClose', async (instance) => {
    instance.log.info('Server closed');
  });

  return fastify;
};
