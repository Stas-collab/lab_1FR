import fs from 'fs/promises';
import { createReadStream } from 'fs';
import path from 'path';
import { MESSAGES } from '#constants/messages.js';

const BACKUPS_DIR = path.join(process.cwd(), 'data', 'backups');

export default async function backupRoutes(fastify) {
  fastify.get(
    '/backups/:timestamp',
    {
      onRequest: async (request, reply) => {
        if (request.headers['x-api-key'] !== fastify.config.ADMIN_API_KEY) {
          throw reply.unauthorized(MESSAGES.UNAUTHORIZED);
        }
      },
      schema: {
        tags: ['backups'],
        params: {
          type: 'object',
          properties: { timestamp: { type: 'string' } },
          required: ['timestamp'],
        },
        security: [{ apiKey: [] }],
      },
    },
    async (request, reply) => {
      const { timestamp } = request.params;
      const filePath = path.join(BACKUPS_DIR, `${timestamp}.gz`);

      try {
        await fs.access(filePath);
      } catch {
        throw reply.notFound(`Backup ${timestamp} not found`);
      }

      reply
        .header('Content-Type', 'application/gzip')
        .header('Content-Disposition', `attachment; filename="${timestamp}.gz"`);

      return reply.send(createReadStream(filePath));
    }
  );
}
