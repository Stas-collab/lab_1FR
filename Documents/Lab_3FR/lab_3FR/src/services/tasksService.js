import { tasksRepository } from '#repositories/tasksRepository.js';

export const tasksService = {
  findAll(query) {
    if (query?.priority) {
      return tasksRepository.findAllByPriority(query.priority);
    }
    return tasksRepository.findAll();
  },

  findById(id) {
    return tasksRepository.findById(id);
  },

  create(data) {
    return tasksRepository.create(data);
  },

  update(id, data) {
    return tasksRepository.update(id, data);
  },

  remove(id) {
    return tasksRepository.remove(id);
  },
};
