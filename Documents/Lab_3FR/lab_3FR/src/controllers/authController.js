export async function register(request, reply) {
  const { email, password } = request.body;
  try {
    const user = await request.server.authService.register(email, password);
    return reply.status(201).send(user);
  } catch (err) {
    if (err.statusCode === 409) throw reply.conflict(err.message);
    throw err;
  }
}

export async function login(request, reply) {
  const { email, password } = request.body;
  try {
    const { accessToken, refreshToken, user } = await request.server.authService.login(
      email,
      password,
      reply
    );

    reply.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: request.server.config.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/auth/refresh',
    });

    return reply.send({ accessToken, user });
  } catch (err) {
    if (err.statusCode === 401) throw reply.unauthorized(err.message);
    throw err;
  }
}

export async function refresh(request, reply) {
  const refreshToken = request.cookies?.refreshToken;
  if (!refreshToken) throw reply.unauthorized('No refresh token');

  try {
    const accessToken = await request.server.authService.refresh(refreshToken, reply);
    return reply.send({ accessToken });
  } catch (err) {
    if (err.statusCode === 401) throw reply.unauthorized(err.message);
    throw err;
  }
}

export async function logout(request, reply) {
  const { jti, sub, exp } = request.user;
  await request.server.authService.logout(sub, jti, exp, request.server.redis);
  reply.clearCookie('refreshToken', { path: '/auth/refresh' });
  return reply.code(204).send();
}
