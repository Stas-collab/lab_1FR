import argon2 from 'argon2';

export const createAuthService = ({ usersRepository }) => ({
  async register(email, password) {
    const existing = await usersRepository.findByEmail(email);
    if (existing) {
      throw { statusCode: 409, message: 'Email already in use' };
    }

    const hash = await argon2.hash(password);
    const user = await usersRepository.create({ email, password: hash });
    return user;
  },

  async login(email, password) {
    const user = await usersRepository.findByEmail(email);
    if (!user) {
      throw { statusCode: 401, message: 'Invalid credentials' };
    }

    const isValid = await argon2.verify(user.password, password);
    if (!isValid) {
      throw { statusCode: 401, message: 'Invalid credentials' };
    }

    return { id: user.id, email: user.email };
  },
});
