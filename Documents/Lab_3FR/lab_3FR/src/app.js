const { createServer } = require('node:http');

const config = require('#config/config.js');
const { handleTaskRoutes } = require('#routes/tasksRoutes.js');

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const method = req.method;
  const pathname = url.pathname;

  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  // ── HEALTH ──────────────────────────────────────────────────────────
  if (method === 'GET' && pathname === '/health') {
    res.statusCode = 200;
    return res.end(
      JSON.stringify({
        pid: process.pid,
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      })
    );
  }

  // ── TASK ROUTES ─────────────────────────────────────────────────────
  if (handleTaskRoutes(req, res, method, pathname, url) !== false) return;

  // ── 404 ─────────────────────────────────────────────────────────────
  res.statusCode = 404;
  res.end(JSON.stringify({ error: 'Route not found' }));
});

// ── START ──────────────────────────────────────────────────────────────
server.listen(config.PORT, config.HOSTNAME, () => {
  console.log(`Server running at http://${config.HOSTNAME}:${config.PORT}`);
});

// ── GRACEFUL SHUTDOWN ──────────────────────────────────────────────────
function gracefulShutdown(signal) {
  console.log(`Received ${signal}. Shutting down gracefully...`);

  const timeout = setTimeout(() => {
    console.error('Force shutdown due to timeout');
    process.exit(1);
  }, 10000);

  server.close((err) => {
    clearTimeout(timeout);

    if (err) {
      console.error('Error during shutdown:', err);
      process.exit(1);
    }

    console.log('Server closed successfully');
    process.exit(0);
  });
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  gracefulShutdown('unhandledRejection');
});
