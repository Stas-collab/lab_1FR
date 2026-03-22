import { getHealth, getHealthDetails } from '#controllers/healthController.js';
import { healthSchema, healthDetailsSchema } from '#schemas/health.schema.js';
import { MESSAGES } from '#constants/messages.js';

export default async function healthRoutes(fastify) {
  // Публічний
  fastify.get('/health', { schema: healthSchema }, getHealth);

  // Захищений — перевірка x-api-key через локальний onRequest хук
  fastify.get(
    '/health/details',
    {
      schema: healthDetailsSchema,
      onRequest: async (request, reply) => {
        if (request.headers['x-api-key'] !== fastify.config.ADMIN_API_KEY) {
          throw reply.unauthorized(MESSAGES.UNAUTHORIZED);
        }
      },
    },
    getHealthDetails
  );
}
