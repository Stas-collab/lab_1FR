import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTasksServiceV2 } from '../../src/services/tasksServiceV2.js';

describe('TasksServiceV2', () => {
  let mockTasksService;
  let mockRedis;
  let service;

  const tasks = [
    { id: 1, title: 'Task 1', priority: 'high', done: false },
    { id: 2, title: 'Task 2', priority: 'medium', done: true },
    { id: 3, title: 'Task 3', priority: 'low', done: false },
  ];

  beforeEach(() => {
    mockTasksService = {
      findAll: vi.fn().mockResolvedValue(tasks),
    };
    mockRedis = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue('OK'),
      keys: vi.fn().mockResolvedValue([]),
      del: vi.fn().mockResolvedValue(1),
    };
    service = createTasksServiceV2({ tasksService: mockTasksService, redis: mockRedis });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('findAllPaginated', () => {
    it('should return data from DB and cache it when cache is empty', async () => {
      const result = await service.findAllPaginated({ page: '1', limit: '2' });

      expect(mockRedis.get).toHaveBeenCalledTimes(1);
      expect(mockTasksService.findAll).toHaveBeenCalledTimes(1);
      expect(mockRedis.set).toHaveBeenCalledTimes(1);
      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(3);
      expect(result.meta.totalPages).toBe(2);
    });

    it('should return data from cache when available', async () => {
      const cached = { data: tasks, meta: { total: 3, page: 1, limit: 10, totalPages: 1 } };
      mockRedis.get.mockResolvedValue(JSON.stringify(cached));

      const result = await service.findAllPaginated({ page: '1', limit: '10' });

      expect(mockRedis.get).toHaveBeenCalledTimes(1);
      expect(mockTasksService.findAll).not.toHaveBeenCalled();
      expect(result).toEqual(cached);
    });

    it('should use default page and limit when not provided', async () => {
      const result = await service.findAllPaginated({});

      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });

    it('should clamp limit to maximum 100', async () => {
      const result = await service.findAllPaginated({ page: '1', limit: '999' });

      expect(result.meta.limit).toBe(100);
    });
  });

  describe('invalidateCache', () => {
    it('should delete cache keys when they exist', async () => {
      mockRedis.keys.mockResolvedValue(['items:page:1:limit:10', 'items:page:2:limit:10']);

      await service.invalidateCache();

      expect(mockRedis.del).toHaveBeenCalledTimes(1);
    });

    it('should not call del when no cache keys exist', async () => {
      mockRedis.keys.mockResolvedValue([]);

      await service.invalidateCache();

      expect(mockRedis.del).not.toHaveBeenCalled();
    });
  });
});
