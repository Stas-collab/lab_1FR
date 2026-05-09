import argon2 from 'argon2';
import { randomUUID } from 'crypto';
import { REDIS_KEYS } from '#constants/redisKeys.js';

const REFRESH_TTL_SEC = 7 * 24 * 60 * 60; // 7 днів

export const createAuthService = ({ usersRepository, redis, fastify }) => ({
  async register(email, password) {
    const existing = await usersRepository.findByEmail(email);
    if (existing) {
      throw { statusCode: 409, message: 'Email already in use' };
    }
    const hash = await argon2.hash(password);
    return usersRepository.create({ email, password: hash });
  },

  async login(email, password, reply) {
    const user = await usersRepository.findByEmail(email);
    if (!user) throw { statusCode: 401, message: 'Invalid credentials' };

    const isValid = await argon2.verify(user.password, password);
    if (!isValid) throw { statusCode: 401, message: 'Invalid credentials' };

    const jti = randomUUID();

    const accessToken = await reply.jwtSign(
      { sub: user.id, email: user.email, jti },
      { expiresIn: '15m' }
    );

    const refreshToken = await reply.jwtSign({ sub: user.id }, { expiresIn: '7d' });

    await redis.set(REDIS_KEYS.refreshToken(user.id), refreshToken, 'EX', REFRESH_TTL_SEC);

    return { accessToken, refreshToken, user: { id: user.id, email: user.email } };
  },

  async refresh(refreshToken, reply) {
    let payload;
    try {
      payload = fastify.jwt.verify(refreshToken);
    } catch {
      throw { statusCode: 401, message: 'Invalid refresh token' };
    }

    const stored = await redis.get(REDIS_KEYS.refreshToken(payload.sub));
    if (!stored || stored !== refreshToken) {
      throw { statusCode: 401, message: 'Refresh token revoked' };
    }

    const jti = randomUUID();
    const accessToken = await reply.jwtSign({ sub: payload.sub, jti }, { expiresIn: '15m' });

    return accessToken;
  },

  async logout(userId, jti, exp, redis) {
    const currentTime = Math.floor(Date.now() / 1000);
    if (jti && exp > currentTime) {
      const ttl = exp - currentTime;
      await redis.set(REDIS_KEYS.blacklist(jti), '1', 'EX', ttl);
    }
    await redis.del(REDIS_KEYS.refreshToken(userId));
  },
});
