const request = require('supertest');

const { createApp } = require('../../src/app');
const { ConflictError, ValidationError } = require('../../src/errors');

function appWith(register, authRateLimit = { windowMs: 60_000, limit: 100 }) {
  return createApp({
    db: { checkConnection: jest.fn() },
    services: { authService: { register } },
    authRateLimit,
  });
}

test('test_postRegister_withValidData_returns201WithSession', async () => {
  const register = jest.fn().mockResolvedValue({ token: 't', user: { id: 1 } });

  const response = await request(appWith(register))
    .post('/auth/register')
    .send({ username: 'lucia.m' });

  expect(response.status).toBe(201);
  expect(response.body).toEqual({ token: 't', user: { id: 1 } });
  expect(register).toHaveBeenCalledWith({ username: 'lucia.m' });
});

test('test_postRegister_withInvalidData_returns400WithFieldErrors', async () => {
  const error = new ValidationError({ password: 'Muy corta' });
  error.passwordRequirements = { minLength: false, letter: true, number: true };

  const response = await request(appWith(jest.fn().mockRejectedValue(error)))
    .post('/auth/register')
    .send({});

  expect(response.status).toBe(400);
  expect(response.body).toEqual({
    error: 'Los datos no son válidos',
    errors: { password: 'Muy corta' },
    passwordRequirements: { minLength: false, letter: true, number: true },
  });
});

test('test_postRegister_withTakenData_returns409', async () => {
  const error = new ConflictError({ email: 'Ya registrado' });

  const response = await request(appWith(jest.fn().mockRejectedValue(error)))
    .post('/auth/register')
    .send({});

  expect(response.status).toBe(409);
  expect(response.body.errors).toEqual({ email: 'Ya registrado' });
});

test('test_postRegister_whenSomethingUnexpectedFails_returns500WithoutDetails', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});

  const response = await request(appWith(jest.fn().mockRejectedValue(new Error('secreto'))))
    .post('/auth/register')
    .send({});

  expect(response.status).toBe(500);
  expect(response.body).toEqual({ error: 'Error interno del servidor' });
  console.error.mockRestore();
});

test('test_postRegister_withMalformedJson_returns400', async () => {
  const response = await request(appWith(jest.fn()))
    .post('/auth/register')
    .set('Content-Type', 'application/json')
    .send('{"name":');

  expect(response.status).toBe(400);
});

test('test_responses_always_includeSecurityHeadersAndHideTheFramework', async () => {
  const response = await request(appWith(jest.fn())).get('/health');

  expect(response.headers['x-content-type-options']).toBe('nosniff');
  expect(response.headers['strict-transport-security']).toBeDefined();
  expect(response.headers['x-powered-by']).toBeUndefined();
});

test('test_postRegister_withTooLargeBody_returns413', async () => {
  const register = jest.fn();

  const response = await request(appWith(register))
    .post('/auth/register')
    .send({ name: 'x'.repeat(20_000) });

  expect(response.status).toBe(413);
  expect(register).not.toHaveBeenCalled();
});

test('test_postRegister_withTooManyAttempts_returns429', async () => {
  const app = appWith(jest.fn().mockResolvedValue({}), { windowMs: 60_000, limit: 2 });

  await request(app).post('/auth/register').send({});
  await request(app).post('/auth/register').send({});
  const response = await request(app).post('/auth/register').send({});

  expect(response.status).toBe(429);
  expect(response.body.error).toMatch('Demasiados intentos');
});

test('test_unexpectedErrorWithStatus_doesNotLeakItsMessage', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  const error = Object.assign(new Error('detalle interno de la base de datos'), { status: 400 });

  const response = await request(appWith(jest.fn().mockRejectedValue(error)))
    .post('/auth/register')
    .send({});

  expect(response.status).toBe(500);
  expect(JSON.stringify(response.body)).not.toContain('detalle interno');
  console.error.mockRestore();
});
