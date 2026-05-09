import { buildImageUrl } from '#utils/fileUtils.js';

export async function getTasksPaginated(request, reply) {
  const result = await request.server.tasksServiceV2.findAllPaginated(request.query);

  const data = result.data.map((t) => ({ ...t, image: buildImageUrl(request, t.image) }));

  return reply.send({ data, meta: result.meta });
}
