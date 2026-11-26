const request = require('supertest');

const { createApp } = require('../../src/app');
const { SuspendedAccountError, UnauthorizedError } = require('../../src/auth/auth-errors');

function appWith(loginService, authRateLimit = { windowMs: 60_000, limit: 100 }) {
  return createApp({
    db: { checkConnection: jest.fn() },
    services: { authService: {}, loginService },
    authRateLimit,
  });
}

test('test_postLogin_returns200WithSession', async () => {
  const login = jest.fn().mockResolvedValue({ token: 't', user: { id: '1' } });

  const response = await request(appWith({ login }))
    .post('/auth/login')
    .send({ login: 'lucia', password: 'secreta123' });

  expect(response.status).toBe(200);
  expect(response.body).toEqual({ token: 't', user: { id: '1' } });
  expect(login).toHaveBeenCalledWith({ login: 'lucia', password: 'secreta123' });
});

test('test_postLogin_wrongCredentials_returns401', async () => {
  const login = jest.fn().mockRejectedValue(new UnauthorizedError('Mal'));
  const response = await request(appWith({ login })).post('/auth/login').send({});
  expect(response.status).toBe(401);
  expect(response.body.error).toBe('Mal');
});

test('test_postLogin_suspended_returns403', async () => {
  const login = jest.fn().mockRejectedValue(new SuspendedAccountError('Spam'));
  const response = await request(appWith({ login })).post('/auth/login').send({});
  expect(response.status).toBe(403);
  expect(response.body.error).toBe('Tu cuenta está suspendida. Motivo: Spam');
});

test('test_postLogin_bruteForce_isLimitedTo429', async () => {
  const login = jest.fn().mockRejectedValue(new UnauthorizedError('Mal'));
  const app = appWith({ login }, { windowMs: 60_000, limit: 3 });

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await request(app).post('/auth/login').send({ login: 'lucia', password: 'x' });
  }
  const response = await request(app).post('/auth/login').send({ login: 'lucia', password: 'x' });

  expect(response.status).toBe(429);
  expect(login).toHaveBeenCalledTimes(3);
});

test('test_getMe_passesAuthorizationHeader', async () => {
  const currentUser = jest.fn().mockResolvedValue({ user: { id: '1' } });

  const response = await request(appWith({ currentUser }))
    .get('/auth/me')
    .set('Authorization', 'Bearer abc');

  expect(response.status).toBe(200);
  expect(currentUser).toHaveBeenCalledWith('Bearer abc');
});

test('test_getMe_isNotCountedInLoginAttempts', async () => {
  const currentUser = jest.fn().mockResolvedValue({ user: { id: '1' } });
  const app = appWith({ currentUser }, { windowMs: 60_000, limit: 1 });

  await request(app).get('/auth/me');
  const response = await request(app).get('/auth/me');

  expect(response.status).toBe(200);
});

test('test_getMe_invalid_returns401', async () => {
  const currentUser = jest.fn().mockRejectedValue(new UnauthorizedError('Caducada'));
  const response = await request(appWith({ currentUser })).get('/auth/me');
  expect(response.status).toBe(401);
});
