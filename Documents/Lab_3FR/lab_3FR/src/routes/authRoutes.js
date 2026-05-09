import { register, login, refresh, logout } from '#controllers/authController.js';

const bodySchema = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 6 },
  },
  additionalProperties: false,
};

const userResponse = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    email: { type: 'string' },
  },
};

export default async function authRoutes(fastify) {
  fastify.post(
    '/register',
    {
      schema: {
        tags: ['auth'],
        body: bodySchema,
        response: { 201: userResponse },
      },
    },
    register
  );

  fastify.post(
    '/login',
    {
      schema: {
        tags: ['auth'],
        body: bodySchema,
        response: {
          200: {
            type: 'object',
            properties: {
              accessToken: { type: 'string' },
              user: userResponse,
            },
          },
        },
      },
    },
    login
  );

  fastify.post(
    '/refresh',
    {
      schema: {
        tags: ['auth'],
        response: {
          200: {
            type: 'object',
            properties: { accessToken: { type: 'string' } },
          },
        },
      },
    },
    refresh
  );

  fastify.post(
    '/logout',
    {
      schema: { tags: ['auth'] },
      onRequest: [
        async (request, reply) => {
          try {
            await request.jwtVerify();
          } catch {
            throw reply.unauthorized('Invalid token');
          }
        },
      ],
    },
    logout
  );
}
