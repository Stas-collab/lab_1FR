import { getSharedReposV2 } from '#controllers/githubControllerV2.js';
import { sharedReposSchema } from '#schemas/github.schema.js';

export default async function githubRoutesV2(fastify) {
  fastify.get('/github/shared-repos', { schema: sharedReposSchema }, (request, reply) =>
    getSharedReposV2(request, reply, fastify.config.GITHUB_TOKEN)
  );
}
