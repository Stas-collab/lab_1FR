import { getTasks, createTask, updateTask, deleteTask } from '#controllers/tasksController.js';
import {
  getTasksSchema,
  createTaskSchema,
  updateTaskSchema,
  deleteTaskSchema,
} from '#schemas/task.schema.js';

export default async function tasksRoutes(fastify) {
  fastify.get('/tasks', { schema: getTasksSchema }, getTasks);
  fastify.post('/tasks', { schema: createTaskSchema }, createTask);
  fastify.patch('/tasks/:id', { schema: updateTaskSchema }, updateTask);
  fastify.delete('/tasks/:id', { schema: deleteTaskSchema }, deleteTask);
}
