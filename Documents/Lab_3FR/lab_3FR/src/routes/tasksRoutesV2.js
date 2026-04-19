import { getTasksPaginated } from '#controllers/tasksControllerV2.js';
import { getTasksPaginatedSchema } from '#schemas/task.schema.js';

export default async function tasksRoutesV2(fastify) {
  fastify.get('/items', { schema: getTasksPaginatedSchema }, getTasksPaginated);
}
