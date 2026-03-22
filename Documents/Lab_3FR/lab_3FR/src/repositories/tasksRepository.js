import { TASKS } from '#data/tasks.js';

export const tasksRepository = {
  findAll() {
    return [...TASKS];
  },

  findAllByPriority(priority) {
    return TASKS.filter((t) => t.priority === priority);
  },

  findById(id) {
    return TASKS.find((t) => t.id === id) ?? null;
  },

  create(data) {
    const newTask = {
      id: TASKS.length ? TASKS[TASKS.length - 1].id + 1 : 1,
      title: data.title,
      done: Boolean(data.done),
      priority: data.priority,
    };
    TASKS.push(newTask);
    return newTask;
  },

  update(id, updates) {
    const task = TASKS.find((t) => t.id === id);
    if (!task) return null;
    delete updates.id;
    Object.assign(task, updates);
    return task;
  },

  remove(id) {
    const idx = TASKS.findIndex((t) => t.id === id);
    if (idx === -1) return false;
    TASKS.splice(idx, 1);
    return true;
  },
};
