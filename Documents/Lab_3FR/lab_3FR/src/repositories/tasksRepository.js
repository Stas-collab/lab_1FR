import fs from 'fs/promises';
import path from 'path';

import { ItemModel } from '#models/item.model.js';
import { writeAtomic } from '#utils/fileUtils.js';

const DATA_DIR = path.join(process.cwd(), 'data', 'items');

export const tasksRepository = {
  async findAll() {
    const files = await fs.readdir(DATA_DIR).catch(() => []);
    const jsonFiles = files.filter((f) => f.endsWith('.json'));

    const tasks = await Promise.all(
      jsonFiles.map((f) => fs.readFile(path.join(DATA_DIR, f), 'utf8').then(JSON.parse))
    );

    return tasks.sort((a, b) => a.id - b.id);
  },

  async findById(id) {
    try {
      const raw = await fs.readFile(path.join(DATA_DIR, `${id}.json`), 'utf8');
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  async create(data) {
    const all = await this.findAll();
    const id = all.length ? Math.max(...all.map((t) => t.id)) + 1 : 1;

    const task = { ...ItemModel, ...data, id };
    await writeAtomic(path.join(DATA_DIR, `${id}.json`), task);
    return task;
  },

  async update(id, updates) {
    const task = await this.findById(id);
    if (!task) return null;

    delete updates.id;
    const updated = { ...task, ...updates };
    await writeAtomic(path.join(DATA_DIR, `${id}.json`), updated);
    return updated;
  },

  async remove(id) {
    try {
      await fs.unlink(path.join(DATA_DIR, `${id}.json`));
      return true;
    } catch {
      return false;
    }
  },
};
