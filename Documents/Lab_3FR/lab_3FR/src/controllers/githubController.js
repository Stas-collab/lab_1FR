const GH_API = 'https://api.github.com';

const ghFetch = async (url, token) => {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'todo-lab6-app',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${url}`);
  return res.json();
};

const getAllContributors = async (owner, repo, token) => {
  const logins = new Set();
  let page = 1;

  while (true) {
    const data = await ghFetch(
      `${GH_API}/repos/${owner}/${repo}/contributors?per_page=100&page=${page}&anon=0`,
      token
    );
    if (!Array.isArray(data) || data.length === 0) break;
    data.forEach((c) => logins.add(c.login));
    if (data.length < 100) break;
    page++;
  }

  return logins;
};

export async function getSharedRepos(request, reply, token) {
  const repoPath = request.query.repo;
  if (!repoPath) {
    return reply.badRequest('Query parameter "repo" is required. Example: ?repo=fastify/fastify');
  }

  const [owner, repo] = repoPath.split('/');
  if (!owner || !repo) {
    return reply.badRequest('Invalid repo format. Use owner/repo');
  }

  const targetContribs = await getAllContributors(owner, repo, token);

  const reposList = await ghFetch(
    `${GH_API}/users/${owner}/repos?per_page=100&sort=updated`,
    token
  );
  const otherRepos = reposList.filter((r) => r.name !== repo && !r.fork);

  const results = [];
  for (const r of otherRepos) {
    try {
      const contribs = await getAllContributors(owner, r.name, token);
      const shared = [...targetContribs].filter((l) => contribs.has(l)).length;
      results.push({
        repo: `${owner}/${r.name}`,
        sharedContributors: shared,
        stars: r.stargazers_count,
      });
    } catch {
      // skip
    }
  }

  const top5 = results.sort((a, b) => b.sharedContributors - a.sharedContributors).slice(0, 5);
  return reply.send({ targetRepo: repoPath, results: top5 });
}
