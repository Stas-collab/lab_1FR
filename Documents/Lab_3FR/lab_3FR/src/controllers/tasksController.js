import { tasksService } from '#services/tasksService.js';
import { MESSAGES } from '#constants/messages.js';

export async function getTasks(request, reply) {
  const tasks = tasksService.findAll(request.query);
  return reply.send(tasks);
}

export async function createTask(request, reply) {
  const task = tasksService.create(request.body);
  return reply.status(201).send(task);
}

export async function updateTask(request, reply) {
  const task = tasksService.update(request.params.id, request.body);
  if (!task) throw reply.notFound(MESSAGES.TASK_NOT_FOUND);
  return reply.send(task);
}

export async function deleteTask(request, reply) {
  const removed = tasksService.remove(request.params.id);
  if (!removed) throw reply.notFound(MESSAGES.TASK_NOT_FOUND);
  return reply.send({ message: 'Task deleted' });
}
