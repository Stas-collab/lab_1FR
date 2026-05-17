import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createAuthService } from '../../src/services/authService.js';

// Мокаємо argon2
vi.mock('argon2', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_password'),
    verify: vi.fn().mockResolvedValue(true),
  },
}));

describe('AuthService', () => {
  let mockUsersRepository;
  let mockRedis;
  let mockFastify;
  let mockReply;
  let service;

  beforeEach(() => {
    mockUsersRepository = {
      findByEmail: vi.fn(),
      create: vi.fn(),
      findById: vi.fn(),
    };

    mockRedis = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue('OK'),
      del: vi.fn().mockResolvedValue(1),
    };

    mockFastify = {
      jwt: {
        verify: vi.fn().mockReturnValue({ sub: 1 }),
      },
    };

    mockReply = {
      jwtSign: vi.fn().mockResolvedValue('mock_token'),
    };

    service = createAuthService({
      usersRepository: mockUsersRepository,
      redis: mockRedis,
      fastify: mockFastify,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      mockUsersRepository.findByEmail.mockResolvedValue(null);
      mockUsersRepository.create.mockResolvedValue({ id: 1, email: 'test@test.com' });

      const result = await service.register('test@test.com', 'password123');

      expect(result).toEqual({ id: 1, email: 'test@test.com' });
      expect(mockUsersRepository.findByEmail).toHaveBeenCalledWith('test@test.com');
      expect(mockUsersRepository.create).toHaveBeenCalled();
    });

    it('should throw 409 if email already exists', async () => {
      mockUsersRepository.findByEmail.mockResolvedValue({ id: 1, email: 'test@test.com' });

      await expect(service.register('test@test.com', 'password')).rejects.toMatchObject({
        statusCode: 409,
      });
    });
  });

  describe('login', () => {
    const user = { id: 1, email: 'test@test.com', password: 'hashed_password' };

    it('should login successfully and return tokens', async () => {
      mockUsersRepository.findByEmail.mockResolvedValue(user);

      const result = await service.login('test@test.com', 'password123', mockReply);

      expect(result.accessToken).toBe('mock_token');
      expect(result.refreshToken).toBe('mock_token');
      expect(result.user).toEqual({ id: 1, email: 'test@test.com' });
      expect(mockRedis.set).toHaveBeenCalled();
    });

    it('should throw 401 if user not found', async () => {
      mockUsersRepository.findByEmail.mockResolvedValue(null);

      await expect(service.login('noone@test.com', 'pass', mockReply)).rejects.toMatchObject({
        statusCode: 401,
      });
    });

    it('should throw 401 if password is wrong', async () => {
      mockUsersRepository.findByEmail.mockResolvedValue(user);
      const argon2 = await import('argon2');
      argon2.default.verify.mockResolvedValueOnce(false);

      await expect(service.login('test@test.com', 'wrong', mockReply)).rejects.toMatchObject({
        statusCode: 401,
      });
    });
  });

  describe('refresh', () => {
    it('should return new access token with valid refresh token', async () => {
      mockFastify.jwt.verify.mockReturnValue({ sub: 1 });
      mockRedis.get.mockResolvedValue('valid_refresh_token');

      const result = await service.refresh('valid_refresh_token', mockReply);

      expect(result).toBe('mock_token');
    });

    it('should throw 401 if refresh token is invalid', async () => {
      mockFastify.jwt.verify.mockImplementation(() => {
        throw new Error('invalid');
      });

      await expect(service.refresh('bad_token', mockReply)).rejects.toMatchObject({
        statusCode: 401,
      });
    });

    it('should throw 401 if refresh token is revoked', async () => {
      mockFastify.jwt.verify.mockReturnValue({ sub: 1 });
      mockRedis.get.mockResolvedValue('different_token');

      await expect(service.refresh('valid_refresh_token', mockReply)).rejects.toMatchObject({
        statusCode: 401,
      });
    });
  });

  describe('logout', () => {
    it('should add token to blacklist and delete refresh token', async () => {
      const exp = Math.floor(Date.now() / 1000) + 900;
      await service.logout(1, 'some-jti', exp, mockRedis);

      expect(mockRedis.set).toHaveBeenCalled();
      expect(mockRedis.del).toHaveBeenCalled();
    });

    it('should not add to blacklist if token already expired', async () => {
      const exp = Math.floor(Date.now() / 1000) - 100;
      await service.logout(1, 'some-jti', exp, mockRedis);

      expect(mockRedis.set).not.toHaveBeenCalled();
      expect(mockRedis.del).toHaveBeenCalled();
    });
  });
});
