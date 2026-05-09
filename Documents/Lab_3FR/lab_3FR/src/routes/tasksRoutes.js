import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  exportTasks,
  importTasks,
  uploadImage,
  getTaskDetails,
  streamTasks,
} from '#controllers/tasksController.js';

import {
  getTasksSchema,
  createTaskSchema,
  updateTaskSchema,
  deleteTaskSchema,
  exportTasksSchema,
  importTasksSchema,
  uploadImageSchema,
  getTaskDetailsSchema,
  streamTasksSchema,
} from '#schemas/task.schema.js';

import { taskEvents } from '#events/taskEvents.js';

const requireAuth = async (request, reply) => {
  if (!request.session?.userId) {
    throw reply.unauthorized('Authentication required');
  }
};

export default async function tasksRoutes(fastify) {
  // Статичні маршрути — до /:id
  fastify.get('/tasks/export', { schema: exportTasksSchema }, exportTasks);
  fastify.get('/tasks/stream', { schema: streamTasksSchema }, streamTasks);
  fastify.get('/tasks/ws', { websocket: true }, (connection) => {
    import('#services/tasksService.js').then(({ tasksService }) => {
      tasksService.findAll({}).then((tasks) => {
        connection.socket.send(JSON.stringify({ event: 'init', data: tasks }));
      });
    });

    const onCreated = (data) => connection.socket.send(JSON.stringify({ event: 'created', data }));
    const onUpdated = (data) => connection.socket.send(JSON.stringify({ event: 'updated', data }));
    const onDeleted = (data) =>
      connection.socket.send(JSON.stringify({ event: 'deleted', id: data.id }));

    taskEvents.on('task:created', onCreated);
    taskEvents.on('task:updated', onUpdated);
    taskEvents.on('task:deleted', onDeleted);

    connection.socket.on('close', () => {
      taskEvents.off('task:created', onCreated);
      taskEvents.off('task:updated', onUpdated);
      taskEvents.off('task:deleted', onDeleted);
    });
  });

  // Публічні GET маршрути
  fastify.get('/tasks', { schema: getTasksSchema }, getTasks);
  fastify.get('/tasks/:id/details', { schema: getTaskDetailsSchema }, getTaskDetails);

  // Захищені маршрути (onRequest: requireAuth)
  fastify.post('/tasks', { schema: createTaskSchema, onRequest: [requireAuth] }, createTask);
  fastify.patch('/tasks/:id', { schema: updateTaskSchema, onRequest: [requireAuth] }, updateTask);
  fastify.delete('/tasks/:id', { schema: deleteTaskSchema, onRequest: [requireAuth] }, deleteTask);
  fastify.post(
    '/tasks/:id/image',
    { schema: uploadImageSchema, onRequest: [requireAuth] },
    uploadImage
  );
  fastify.post(
    '/tasks/import',
    { schema: importTasksSchema, onRequest: [requireAuth] },
    importTasks
  );
}
