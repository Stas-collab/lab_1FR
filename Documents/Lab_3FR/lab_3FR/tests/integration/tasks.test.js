import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildApp } from '../../src/app.js';
import { tasks, users } from '../../db/schema.js';

describe('Tasks API Integration', () => {
  let app;
  let authToken;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    await app.drizzle.delete(tasks);
    await app.drizzle.delete(users);
    await app.redis.flushdb();

    await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'tasks_test@test.com', password: 'password123' },
    });

    const loginRes = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'tasks_test@test.com', password: 'password123' },
    });

    authToken = loginRes.json().accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await app.drizzle.delete(tasks);
    await app.redis.flushdb();
  });

  // ── GET /api/v1/tasks ────────────────────────────────────────────────────

  it('GET /api/v1/tasks — should return empty array', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/tasks' });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });

  it('GET /api/v1/tasks — should return tasks', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/v1/tasks',
      headers: { authorization: `Bearer ${authToken}` },
      payload: { title: 'Test Task', priority: 'high' },
    });

    const res = await app.inject({ method: 'GET', url: '/api/v1/tasks' });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveLength(1);
  });

  it('GET /api/v1/tasks?priority=high — should filter tasks', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/v1/tasks',
      headers: { authorization: `Bearer ${authToken}` },
      payload: { title: 'High Task', priority: 'high' },
    });
    await app.inject({
      method: 'POST',
      url: '/api/v1/tasks',
      headers: { authorization: `Bearer ${authToken}` },
      payload: { title: 'Low Task', priority: 'low' },
    });

    const res = await app.inject({ method: 'GET', url: '/api/v1/tasks?priority=high' });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveLength(1);
    expect(res.json()[0].priority).toBe('high');
  });

  // ── POST /api/v1/tasks ───────────────────────────────────────────────────

  it('POST /api/v1/tasks — should return 401 without token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/tasks',
      payload: { title: 'Task', priority: 'high' },
    });

    expect(res.statusCode).toBe(401);
  });

  it('POST /api/v1/tasks — should create task with valid token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/tasks',
      headers: { authorization: `Bearer ${authToken}` },
      payload: { title: 'New Task', priority: 'medium', dueDate: '2025-12-01' },
    });

    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({ title: 'New Task', priority: 'medium' });
    expect(res.json()).toHaveProperty('id');
  });

  it('POST /api/v1/tasks — should return 400 with missing fields', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/tasks',
      headers: { authorization: `Bearer ${authToken}` },
      payload: { title: 'No Priority' },
    });

    expect(res.statusCode).toBe(400);
  });

  // ── PATCH /api/v1/tasks/:id ──────────────────────────────────────────────

  it('PATCH /api/v1/tasks/:id — should return 401 without token', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/tasks/1',
      payload: { done: true },
    });

    expect(res.statusCode).toBe(401);
  });

  it('PATCH /api/v1/tasks/:id — should update task', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/tasks',
      headers: { authorization: `Bearer ${authToken}` },
      payload: { title: 'Task', priority: 'low' },
    });

    const id = created.json().id;
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/tasks/${id}`,
      headers: { authorization: `Bearer ${authToken}` },
      payload: { done: true },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().done).toBe(true);
  });

  it('PATCH /api/v1/tasks/:id — should return 404 when task not found', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/tasks/99999',
      headers: { authorization: `Bearer ${authToken}` },
      payload: { done: true },
    });

    expect(res.statusCode).toBe(404);
  });

  // ── DELETE /api/v1/tasks/:id ─────────────────────────────────────────────

  it('DELETE /api/v1/tasks/:id — should return 401 without token', async () => {
    const res = await app.inject({ method: 'DELETE', url: '/api/v1/tasks/1' });

    expect(res.statusCode).toBe(401);
  });

  it('DELETE /api/v1/tasks/:id — should delete task', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/tasks',
      headers: { authorization: `Bearer ${authToken}` },
      payload: { title: 'To Delete', priority: 'low' },
    });

    const id = created.json().id;
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/tasks/${id}`,
      headers: { authorization: `Bearer ${authToken}` },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().message).toBe('Task deleted');
  });

  // ── GET /api/v2/items (пагінація) ────────────────────────────────────────

  it('GET /api/v2/items — should return paginated data', async () => {
    for (let i = 0; i < 3; i++) {
      await app.inject({
        method: 'POST',
        url: '/api/v1/tasks',
        headers: { authorization: `Bearer ${authToken}` },
        payload: { title: `Task ${i}`, priority: 'low' },
      });
    }

    const res = await app.inject({ method: 'GET', url: '/api/v2/items?page=1&limit=2' });

    expect(res.statusCode).toBe(200);
    expect(res.json().data).toHaveLength(2);
    expect(res.json().meta.total).toBe(3);
    expect(res.json().meta.totalPages).toBe(2);
  });
});
