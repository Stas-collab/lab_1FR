import { buildImageUrl } from '#utils/fileUtils.js';

export async function getTasksPaginated(request, reply) {
  const page = Math.max(1, parseInt(request.query.page ?? '1', 10));
  const limit = Math.max(1, Math.min(100, parseInt(request.query.limit ?? '10', 10)));

  const all = await request.server.tasksService.findAll({});
  const total = all.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const safePage = Math.min(page, totalPages);
  const data = all
    .slice((safePage - 1) * limit, safePage * limit)
    .map((t) => ({ ...t, image: buildImageUrl(request, t.image) }));

  return reply.send({ data, meta: { total, page: safePage, limit, totalPages } });
}
