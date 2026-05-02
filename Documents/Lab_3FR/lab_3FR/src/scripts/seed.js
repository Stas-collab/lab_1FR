import mongoose from 'mongoose';
import { Task } from '../../db/models/task.model.js';
import 'dotenv/config';

// eslint-disable-next-line no-restricted-syntax
const MONGO_URL = process.env.MONGO_URL ?? 'mongodb://127.0.0.1:27017';
// eslint-disable-next-line no-restricted-syntax
const MONGO_DB_NAME = process.env.MONGO_DB_NAME ?? 'lab8';

const TASKS = [
  { title: 'Learn Node.js', done: false, priority: 'high', dueDate: '2025-06-01' },
  { title: 'Read Fastify docs', done: false, priority: 'medium', dueDate: '2025-06-10' },
  { title: 'Write lab report', done: true, priority: 'low', dueDate: '2025-05-30' },
];

const seed = async (force = false) => {
  await mongoose.connect(MONGO_URL, { dbName: MONGO_DB_NAME });

  const count = await Task.countDocuments();

  if (!force && count > 0) {
    console.log(`DB already has ${count} tasks. Use seed:force to reset.`);
    await mongoose.disconnect();
    return;
  }

  if (force) {
    await Task.deleteMany({});
    console.log('Cleared existing tasks.');
  }

  await Task.insertMany(TASKS);
  console.log(`Seeded ${TASKS.length} tasks.`);
  await mongoose.disconnect();
};

const force = process.argv.includes('--force');
seed(force);
