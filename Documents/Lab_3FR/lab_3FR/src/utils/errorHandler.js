export function errorHandler(error, request, reply) {
  request.log.error({ err: error, method: request.method, url: request.url }, 'Request error');

  const statusCode = error.statusCode ?? 500;

  reply.status(statusCode).send({
    statusCode,
    error: error.name ?? 'Error',
    message: error.message,
  });
}
