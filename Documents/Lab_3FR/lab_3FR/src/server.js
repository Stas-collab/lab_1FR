import { buildApp } from './app.js';

const start = async () => {
  const fastify = await buildApp();

  // ── GRACEFUL SHUTDOWN ────────────────────────────────────────────────────
  const gracefulShutdown = async (signal) => {
    fastify.log.info(`Received signal: ${signal}. Shutting down gracefully...`);

    const forceExit = setTimeout(() => {
      fastify.log.error('Force shutdown due to timeout');
      process.exit(1);
    }, 10000).unref();

    try {
      await fastify.close(); // запускає onClose хуки та закриває HTTP-сервер
      clearTimeout(forceExit);
      process.exit(0);
    } catch (err) {
      fastify.log.error({ err }, 'Error during shutdown');
      process.exit(1);
    }
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  // ── ГЛОБАЛЬНІ ОБРОБНИКИ NODE.JS ──────────────────────────────────────────
  //
  // setErrorHandler    — помилки ВСЕРЕДИНІ обробки HTTP-запиту (Fastify lifecycle)
  // uncaughtException  — синхронні виключення ПОЗА межами будь-яких запитів
  //                      (таймери, фонові задачі, помилки ініціалізації)
  // unhandledRejection — відхилені Promise без .catch() ПОЗА межами Fastify
  //
  // Всі три механізми діють на різних рівнях і доповнюють один одного.

  process.on('uncaughtException', (err) => {
    fastify.log.fatal({ err }, 'Uncaught Exception — shutting down');
    gracefulShutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason) => {
    fastify.log.fatal({ reason }, 'Unhandled Rejection — shutting down');
    gracefulShutdown('unhandledRejection');
  });

  // ── START ────────────────────────────────────────────────────────────────
  await fastify.listen({
    port: Number(fastify.config.PORT),
    host: fastify.config.APP_HOSTNAME,
  });
};

start();
