import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  exportTasks,
  importTasks,
  uploadImage,
} from '#controllers/tasksController.js';

import {
  getTasksSchema,
  createTaskSchema,
  updateTaskSchema,
  deleteTaskSchema,
  exportTasksSchema,
  importTasksSchema,
  uploadImageSchema,
} from '#schemas/task.schema.js';

export default async function tasksRoutes(fastify) {
  // ВАЖЛИВО: /export має бути до /:id щоб не конфліктувати
  fastify.get('/tasks/export', { schema: exportTasksSchema }, exportTasks);
  fastify.post('/tasks/import', { schema: importTasksSchema }, importTasks);

  fastify.get('/tasks', { schema: getTasksSchema }, getTasks);
  fastify.post('/tasks', { schema: createTaskSchema }, createTask);
  fastify.patch('/tasks/:id', { schema: updateTaskSchema }, updateTask);
  fastify.delete('/tasks/:id', { schema: deleteTaskSchema }, deleteTask);

  fastify.post('/tasks/:id/image', { schema: uploadImageSchema }, uploadImage);
}
