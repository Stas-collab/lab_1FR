export async function getHealth(request, reply) {
  return reply.send({ status: 'ok' });
}

export async function getHealthDetails(request, reply) {
  return reply.send({
    pid: process.pid,
    nodeVersion: process.version,
    platform: process.platform,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
  });
}
