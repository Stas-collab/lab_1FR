import { tasksService } from '#services/tasksService.js';
import { buildImageUrl } from '#utils/fileUtils.js';
import { MESSAGES } from '#constants/messages.js';
import { stringify } from 'csv-stringify/sync';
import { parse } from 'csv-parse/sync';
import { createWriteStream } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import { fetchExternalDetails } from '#utils/externalFetch.js';

// ── Базові CRUD ───────────────────────────────────────────────────────────────

export async function getTasks(request, reply) {
  const tasks = await tasksService.findAll(request.query);
  return reply.send(tasks.map((t) => ({ ...t, image: buildImageUrl(request, t.image) })));
}

export async function createTask(request, reply) {
  const task = await tasksService.create(request.body);
  return reply.status(201).send({ ...task, image: buildImageUrl(request, task.image) });
}

export async function updateTask(request, reply) {
  const task = await tasksService.update(request.params.id, request.body);
  if (!task) throw reply.notFound(MESSAGES.TASK_NOT_FOUND);
  return reply.send({ ...task, image: buildImageUrl(request, task.image) });
}

export async function deleteTask(request, reply) {
  const removed = await tasksService.remove(request.params.id);
  if (!removed) throw reply.notFound(MESSAGES.TASK_NOT_FOUND);
  return reply.send({ message: 'Task deleted' });
}

// ── Export CSV ────────────────────────────────────────────────────────────────

export async function exportTasks(request, reply) {
  const tasks = await tasksService.findAll({});

  const rows = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    done: t.done,
    priority: t.priority,
    dueDate: t.dueDate,
    image: buildImageUrl(request, t.image) ?? '',
  }));

  const csv = stringify(rows, { header: true });

  reply
    .header('Content-Type', 'text/csv; charset=utf-8')
    .header('Content-Disposition', 'attachment; filename="tasks.csv"')
    .send(csv);
}

// ── Import CSV / JSON ─────────────────────────────────────────────────────────

// Схема для валідації одного запису при імпорті
const importItemSchema = {
  type: 'object',
  required: ['title', 'priority'],
  properties: {
    title: { type: 'string', minLength: 1 },
    priority: { type: 'string', enum: ['low', 'medium', 'high'] },
    done: { type: 'boolean' },
    dueDate: { type: 'string' },
  },
};

export async function importTasks(request, reply) {
  const data = await request.file();
  const buffer = await data.toBuffer();

  let records;

  if (data.mimetype === 'application/json' || data.filename?.endsWith('.json')) {
    try {
      records = JSON.parse(buffer.toString());
      if (!Array.isArray(records)) records = [records];
    } catch {
      throw reply.badRequest('Invalid JSON file');
    }
  } else if (data.mimetype === 'text/csv' || data.filename?.endsWith('.csv')) {
    try {
      records = parse(buffer, { columns: true, skip_empty_lines: true });
      // CSV повертає рядки — конвертуємо типи
      records = records.map((r) => ({
        ...r,
        done: r.done === 'true' || r.done === true,
      }));
    } catch {
      throw reply.badRequest('Invalid CSV file');
    }
  } else {
    throw reply.badRequest('Unsupported file format. Use JSON or CSV.');
  }

  const ajv = reply.request.server.ajv ?? request.server.ajv;

  let imported = 0;
  const rejected = [];

  for (let i = 0; i < records.length; i++) {
    const record = records[i];

    // Проста валідація без ajv (ajv недоступний напряму в Fastify без налаштування)
    const errors = validateImportRecord(record);
    if (errors) {
      rejected.push({ index: i + 1, reason: errors });
      continue;
    }

    await tasksService.create(record);
    imported++;
  }

  return reply.send({ imported, rejectedCount: rejected.length, rejected });
}

function validateImportRecord(record) {
  if (!record.title || typeof record.title !== 'string' || record.title.trim() === '') {
    return 'Missing or invalid field: title';
  }
  if (!['low', 'medium', 'high'].includes(record.priority)) {
    return 'Missing or invalid field: priority (must be low, medium or high)';
  }
  return null;
}

// ── Upload image ──────────────────────────────────────────────────────────────

export async function uploadImage(request, reply) {
  const id = request.params.id;

  const task = await tasksService.findById(id);
  if (!task) throw reply.notFound(MESSAGES.TASK_NOT_FOUND);

  const data = await request.file();

  if (!['image/jpeg', 'image/png'].includes(data.mimetype)) {
    throw reply.badRequest('Only image/jpeg and image/png are allowed');
  }

  const uploadDir = path.join(process.cwd(), 'uploads', String(id));
  await fs.mkdir(uploadDir, { recursive: true });

  const dest = path.join(uploadDir, 'image.jpg');
  const writable = createWriteStream(dest);

  await new Promise((resolve, reject) => {
    data.file.pipe(writable);
    writable.on('finish', resolve);
    writable.on('error', reject);
  });

  const relativePath = `/${id}/image.jpg`;
  const updated = await tasksService.update(id, { image: relativePath });

  return reply.send({ ...updated, image: buildImageUrl(request, updated.image) });
}

// ── GET /api/v1/tasks/:id/details ─────────────────────────────────────────
export async function getTaskDetails(request, reply) {
  const task = await tasksService.findById(request.params.id);
  if (!task) throw reply.notFound(MESSAGES.TASK_NOT_FOUND);

  const priority = await fetchExternalDetails(task.priority);

  return reply.send({ ...task, image: buildImageUrl(request, task.image), priority });
}
