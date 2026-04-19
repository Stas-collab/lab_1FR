import path from 'path';
import { writeAtomic } from '#utils/fileUtils.js';

const DATA_DIR = path.join(process.cwd(), 'data', 'items');

const TASKS = [
  {
    id: 1,
    title: 'wgfwgwd',
    done: false,
    priority: 'high',
    dueDate: '2025-06-01',
    image: null,
  },
  {
    id: 2,
    title: 'Read Fastify docs',
    done: false,
    priority: 'medium',
    dueDate: '2025-06-10',
    image: null,
  },
  {
    id: 3,
    title: 'Write lab report',
    done: true,
    priority: 'low',
    dueDate: '2025-05-30',
    image: null,
  },
];

for (const task of TASKS) {
  await writeAtomic(path.join(DATA_DIR, `${task.id}.json`), task);
  console.log(`Seeded task ${task.id}: ${task.title}`);
}

console.log(`Seed complete — wrote ${TASKS.length} tasks.`);
