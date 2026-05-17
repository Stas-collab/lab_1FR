import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildApp } from '../../src/app.js';
import { users } from '../../db/schema.js';

describe('Auth API Integration', () => {
  let app;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await app.drizzle.delete(users);
    await app.redis.flushdb();
  });

  // ── POST /auth/register ──────────────────────────────────────────────────

  it('POST /auth/register — should register user and return 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'new@test.com', password: 'password123' },
    });

    expect(res.statusCode).toBe(201);
    expect(res.json()).toHaveProperty('id');
    expect(res.json()).toHaveProperty('email', 'new@test.com');
    expect(res.json()).not.toHaveProperty('password');
  });

  it('POST /auth/register — should return 409 if email exists', async () => {
    await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'dup@test.com', password: 'password123' },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'dup@test.com', password: 'password123' },
    });

    expect(res.statusCode).toBe(409);
  });

  it('POST /auth/register — should return 400 with invalid email', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'not-an-email', password: 'password123' },
    });

    expect(res.statusCode).toBe(400);
  });

  // ── POST /auth/login ─────────────────────────────────────────────────────

  it('POST /auth/login — should return accessToken', async () => {
    await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'login@test.com', password: 'password123' },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'login@test.com', password: 'password123' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveProperty('accessToken');
    expect(res.json().user.email).toBe('login@test.com');
  });

  it('POST /auth/login — should return 401 with wrong password', async () => {
    await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'wrong@test.com', password: 'password123' },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'wrong@test.com', password: 'wrongpassword' },
    });

    expect(res.statusCode).toBe(401);
  });

  it('POST /auth/login — should return 401 if user not found', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'nobody@test.com', password: 'password123' },
    });

    expect(res.statusCode).toBe(401);
  });

  // ── POST /auth/logout ────────────────────────────────────────────────────

  it('POST /auth/logout — should return 204', async () => {
    await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'logout@test.com', password: 'password123' },
    });
    const loginRes = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'logout@test.com', password: 'password123' },
    });
    const token = loginRes.json().accessToken;

    const res = await app.inject({
      method: 'POST',
      url: '/auth/logout',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(204);
  });

  it('POST /auth/logout — token should be blacklisted after logout', async () => {
    await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'bl@test.com', password: 'password123' },
    });
    const loginRes = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'bl@test.com', password: 'password123' },
    });
    const token = loginRes.json().accessToken;

    await app.inject({
      method: 'POST',
      url: '/auth/logout',
      headers: { authorization: `Bearer ${token}` },
    });

    // Використати старий токен → 401
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/tasks',
      headers: { authorization: `Bearer ${token}` },
      payload: { title: 'After logout', priority: 'low' },
    });

    expect(res.statusCode).toBe(401);
  });
});
