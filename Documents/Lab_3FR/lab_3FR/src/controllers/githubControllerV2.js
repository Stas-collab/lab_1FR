const GH_REST = 'https://api.github.com';
const GH_GRAPHQL = 'https://api.github.com/graphql';

const ghHeaders = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'todo-lab6-app',
};

// GraphQL запит — отримати перші 100 contributors + список repos організації
const buildQuery = (owner, repo) => `
  query {
    repository(owner: "${owner}", name: "${repo}") {
      mentionableUsers(first: 100) {
        nodes { login }
      }
    }
    repositoryOwner(login: "${owner}") {
      repositories(first: 30, orderBy: {field: UPDATED_AT, direction: DESC}) {
        nodes { name isFork stargazerCount }
      }
    }
  }
`;

const graphqlFetch = async (query, token) => {
  const res = await fetch(GH_GRAPHQL, {
    method: 'POST',
    headers: {
      ...ghHeaders,
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(`GitHub GraphQL error: ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data;
};

const restGetContributors = async (owner, repo) => {
  const logins = new Set();
  let page = 1;
  while (true) {
    const res = await fetch(
      `${GH_REST}/repos/${owner}/${repo}/contributors?per_page=100&page=${page}&anon=0`,
      { headers: ghHeaders }
    );
    if (!res.ok) break;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) break;
    data.forEach((c) => logins.add(c.login));
    if (data.length < 100) break;
    page++;
  }
  return logins;
};

export async function getSharedReposV2(request, reply, token) {
  const repoPath = request.query.repo;

  if (!repoPath) {
    return reply.badRequest('Query parameter "repo" is required');
  }

  const [owner, repo] = repoPath.split('/');

  const data = await graphqlFetch(buildQuery(owner, repo), token);

  const targetContribs = new Set(data.repository.mentionableUsers.nodes.map((n) => n.login));

  const otherRepos = data.repositoryOwner.repositories.nodes.filter(
    (r) => r.name !== repo && !r.isFork
  );

  // REST — contributors для кожного іншого репо (GraphQL rate limit суворіший)
  const results = [];
  for (const r of otherRepos) {
    try {
      const contribs = await restGetContributors(owner, r.name);
      const shared = [...targetContribs].filter((l) => contribs.has(l)).length;
      results.push({
        repo: `${owner}/${r.name}`,
        sharedContributors: shared,
        stars: r.stargazerCount,
      });
    } catch {
      // skip
    }
  }

  const top5 = results.sort((a, b) => b.sharedContributors - a.sharedContributors).slice(0, 5);

  return reply.send({ targetRepo: repoPath, results: top5, source: 'graphql+rest' });
}
