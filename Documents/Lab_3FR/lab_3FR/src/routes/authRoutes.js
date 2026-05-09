import { register, login, logout, me } from '#controllers/authController.js';

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
              success: { type: 'boolean' },
              user: userResponse,
            },
          },
        },
      },
    },
    login
  );

  fastify.post(
    '/logout',
    {
      schema: { tags: ['auth'] },
      onRequest: [
        async (request, reply) => {
          if (!request.session.userId) throw reply.unauthorized('Not logged in');
        },
      ],
    },
    logout
  );

  fastify.get(
    '/me',
    {
      schema: {
        tags: ['auth'],
        response: { 200: userResponse },
      },
      onRequest: [
        async (request, reply) => {
          if (!request.session.userId) throw reply.unauthorized('Not logged in');
        },
      ],
    },
    me
  );
}
