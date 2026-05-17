import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTasksService } from '../../src/services/tasksService.js';

describe('TasksService', () => {
  let mockRepository;
  let service;

  beforeEach(() => {
    mockRepository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    };
    service = createTasksService(mockRepository);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all tasks without filter', async () => {
      const tasks = [
        { id: 1, title: 'Task 1', priority: 'high' },
        { id: 2, title: 'Task 2', priority: 'low' },
      ];
      mockRepository.findAll.mockResolvedValue(tasks);

      const result = await service.findAll({});

      expect(result).toHaveLength(2);
      expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should filter tasks by priority', async () => {
      const tasks = [
        { id: 1, title: 'Task 1', priority: 'high' },
        { id: 2, title: 'Task 2', priority: 'low' },
      ];
      mockRepository.findAll.mockResolvedValue(tasks);

      const result = await service.findAll({ priority: 'high' });

      expect(result).toHaveLength(1);
      expect(result[0].priority).toBe('high');
    });

    it('should return empty array when no tasks match filter', async () => {
      mockRepository.findAll.mockResolvedValue([{ id: 1, title: 'Task 1', priority: 'high' }]);

      const result = await service.findAll({ priority: 'low' });

      expect(result).toHaveLength(0);
    });
  });

  describe('findById', () => {
    it('should return task by id', async () => {
      const task = { id: 1, title: 'Task 1', priority: 'high' };
      mockRepository.findById.mockResolvedValue(task);

      const result = await service.findById(1);

      expect(result).toEqual(task);
      expect(mockRepository.findById).toHaveBeenCalledWith(1);
    });

    it('should return null when task not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await service.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a task', async () => {
      const data = { title: 'New Task', priority: 'medium' };
      const created = { id: 1, ...data };
      mockRepository.create.mockResolvedValue(created);

      const result = await service.create(data);

      expect(result).toEqual(created);
      expect(mockRepository.create).toHaveBeenCalledWith(data);
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      const updated = { id: 1, title: 'Updated', priority: 'high' };
      mockRepository.update.mockResolvedValue(updated);

      const result = await service.update(1, { title: 'Updated' });

      expect(result).toEqual(updated);
    });

    it('should return null when task not found', async () => {
      mockRepository.update.mockResolvedValue(null);

      const result = await service.update(999, { title: 'X' });

      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('should remove a task and return true', async () => {
      mockRepository.remove.mockResolvedValue(true);

      const result = await service.remove(1);

      expect(result).toBe(true);
    });

    it('should return false when task not found', async () => {
      mockRepository.remove.mockResolvedValue(false);

      const result = await service.remove(999);

      expect(result).toBe(false);
    });
  });
});
