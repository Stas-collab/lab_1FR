export const createTasksService = (repository) => ({
  async findAll(query) {
    const tasks = await repository.findAll();
    if (query?.priority) {
      return tasks.filter((t) => t.priority === query.priority);
    }
    return tasks;
  },

  async findById(id) {
    return repository.findById(id);
  },

  async create(data) {
    return repository.create(data);
  },

  async update(id, data) {
    return repository.update(id, data);
  },

  async remove(id) {
    return repository.remove(id);
  },
});
