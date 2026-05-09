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
    const user = await request.server.authService.login(email, password);
    request.session.userId = user.id;
    request.session.email = user.email;
    return reply.send({ success: true, user });
  } catch (err) {
    if (err.statusCode === 401) throw reply.unauthorized(err.message);
    throw err;
  }
}

export async function logout(request, reply) {
  await request.session.destroy();
  return reply.code(204).send();
}

export async function me(request, reply) {
  return reply.send({
    id: request.session.userId,
    email: request.session.email,
  });
}
