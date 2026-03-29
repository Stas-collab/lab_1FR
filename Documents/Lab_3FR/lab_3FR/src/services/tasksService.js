import { tasksRepository } from '#repositories/tasksRepository.js';

export const tasksService = {
  async findAll(query) {
    const tasks = await tasksRepository.findAll();
    if (query?.priority) {
      return tasks.filter((t) => t.priority === query.priority);
    }
    return tasks;
  },

  async findById(id) {
    return tasksRepository.findById(Number(id));
  },

  async create(data) {
    return tasksRepository.create(data);
  },

  async update(id, data) {
    return tasksRepository.update(Number(id), data);
  },

  async remove(id) {
    return tasksRepository.remove(Number(id));
  },
};
