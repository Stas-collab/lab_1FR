import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  exportTasks,
  importTasks,
  uploadImage,
  getTaskDetails,
  streamTasks, // ← НОВИЙ
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
  streamTasksSchema, // ← НОВИЙ
} from '#schemas/task.schema.js';

import { taskEvents } from '#events/taskEvents.js';

export default async function tasksRoutes(fastify) {
  // ВАЖЛИВО: /export та /stream мають бути до /:id
  fastify.get('/tasks/export', { schema: exportTasksSchema }, exportTasks);
  fastify.get('/tasks/stream', { schema: streamTasksSchema }, streamTasks);
  fastify.post('/tasks/import', { schema: importTasksSchema }, importTasks);

  fastify.get('/tasks', { schema: getTasksSchema }, getTasks);
  fastify.post('/tasks', { schema: createTaskSchema }, createTask);
  fastify.patch('/tasks/:id', { schema: updateTaskSchema }, updateTask);
  fastify.delete('/tasks/:id', { schema: deleteTaskSchema }, deleteTask);

  fastify.post('/tasks/:id/image', { schema: uploadImageSchema }, uploadImage);
  fastify.get('/tasks/:id/details', { schema: getTaskDetailsSchema }, getTaskDetails);

  // ── WebSocket ────────────────────────────────────────────────────────────
  fastify.get('/tasks/ws', { websocket: true }, (connection) => {
    // При підключенні — надіслати поточний список
    import('#services/tasksService.js').then(({ tasksService }) => {
      tasksService.findAll({}).then((tasks) => {
        connection.socket.send(JSON.stringify({ event: 'init', data: tasks }));
      });
    });

    // Слухаємо події від REST контролерів
    const onCreated = (data) => connection.socket.send(JSON.stringify({ event: 'created', data }));
    const onUpdated = (data) => connection.socket.send(JSON.stringify({ event: 'updated', data }));
    const onDeleted = (data) =>
      connection.socket.send(JSON.stringify({ event: 'deleted', id: data.id }));

    taskEvents.on('task:created', onCreated);
    taskEvents.on('task:updated', onUpdated);
    taskEvents.on('task:deleted', onDeleted);

    // При відключенні — відписуємось щоб не було витоків пам'яті
    connection.socket.on('close', () => {
      taskEvents.off('task:created', onCreated);
      taskEvents.off('task:updated', onUpdated);
      taskEvents.off('task:deleted', onDeleted);
    });
  });
}
