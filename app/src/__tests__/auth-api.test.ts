import { checkSession, loginUser } from '../services/auth-api';

const response = (status: number, body: unknown) =>
  ({ ok: status < 300, status, json: async () => body }) as Response;

test('test_loginUser_ok_returnsSession', async () => {
  const session = { token: 't', user: { id: 1 } };
  const fetchFn = jest.fn().mockResolvedValue(response(200, session));

  await expect(loginUser({ login: 'lucia', password: 'x' }, fetchFn)).resolves.toEqual({
    ok: true,
    session,
  });
  const [url, options] = fetchFn.mock.calls[0];
  expect(url).toBe('http://localhost:3000/auth/login');
  expect(options.method).toBe('POST');
  expect(JSON.parse(options.body)).toEqual({ login: 'lucia', password: 'x' });
});

test('test_loginUser_400_returnsFieldErrors', async () => {
  const fetchFn = jest.fn().mockResolvedValue(response(400, { errors: { login: 'Falta' } }));
  await expect(loginUser({ login: '', password: '' }, fetchFn)).resolves.toEqual({
    ok: false,
    errors: { login: 'Falta' },
  });
});

test('test_loginUser_401And403_returnGeneralMessage', async () => {
  const wrong = jest.fn().mockResolvedValue(response(401, { error: 'Mal' }));
  const suspended = jest.fn().mockResolvedValue(response(403, { error: 'Suspendida' }));

  await expect(loginUser({ login: 'a', password: 'b' }, wrong)).resolves.toEqual({
    ok: false,
    errors: { general: 'Mal' },
    suspended: false,
  });
  await expect(loginUser({ login: 'a', password: 'b' }, suspended)).resolves.toMatchObject({
    suspended: true,
    errors: { general: 'Suspendida' },
  });
});

test('test_loginUser_tooManyAttempts_showsServerMessage', async () => {
  const fetchFn = jest.fn().mockResolvedValue(response(429, { error: 'Demasiados intentos.' }));
  const result = await loginUser({ login: 'a', password: 'b' }, fetchFn);
  expect(!result.ok && result.errors.general).toBe('Demasiados intentos.');
});

test('test_loginUser_offline_returnsConnectionError', async () => {
  const fetchFn = jest.fn().mockRejectedValue(new TypeError('x'));
  const result = await loginUser({ login: 'a', password: 'b' }, fetchFn);
  expect(!result.ok && result.errors.general).toMatch(/conectar con Hertz/);
});

test.each([
  [200, { user: { id: 1 } }, { status: 'valid', user: { id: 1 } }],
  [401, {}, { status: 'invalid' }],
  [403, { error: 'Suspendida' }, { status: 'suspended', message: 'Suspendida' }],
  [500, {}, { status: 'offline' }],
])('test_checkSession_%p', async (status, body, expected) => {
  const fetchFn = jest.fn().mockResolvedValue(response(status as number, body));

  await expect(checkSession('tok', fetchFn)).resolves.toEqual(expected);
  expect(fetchFn).toHaveBeenCalledWith('http://localhost:3000/auth/me', {
    headers: { Authorization: 'Bearer tok' },
  });
});

test('test_checkSession_offline_keepsSession', async () => {
  const fetchFn = jest.fn().mockRejectedValue(new TypeError('x'));
  await expect(checkSession('tok', fetchFn)).resolves.toEqual({ status: 'offline' });
});
