import { getSharedRepos } from '#controllers/githubController.js';
import { sharedReposSchema } from '#schemas/github.schema.js';

export default async function githubRoutesV1(fastify) {
  fastify.get('/github/shared-repos', { schema: sharedReposSchema }, (request, reply) =>
    getSharedRepos(request, reply, fastify.config.GITHUB_TOKEN)
  );
}
