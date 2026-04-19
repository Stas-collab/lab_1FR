import { tasksService } from '#services/tasksService.js';
import { buildImageUrl } from '#utils/fileUtils.js';

export async function getTasksPaginated(request, reply) {
  const page = Math.max(1, parseInt(request.query.page ?? '1', 10));
  const limit = Math.max(1, Math.min(100, parseInt(request.query.limit ?? '10', 10)));

  const all = await tasksService.findAll({});
  const total = all.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;
  const data = all
    .slice(start, start + limit)
    .map((t) => ({ ...t, image: buildImageUrl(request, t.image) }));

  return reply.send({
    data,
    meta: { total, page: safePage, limit, totalPages },
  });
}
