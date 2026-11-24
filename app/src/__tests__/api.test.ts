import { registerUser, RegistrationForm } from '../services/api';

const form: RegistrationForm = {
  name: 'Lucía Moreno',
  username: 'lucia.m',
  email: 'lucia@correo.es',
  password: 'secreta123',
  acceptedTerms: true,
};

const response = (status: number, body: unknown) =>
  ({ ok: status < 300, status, json: async () => body }) as Response;

test('test_registerUser_whenAccountIsCreated_returnsSession', async () => {
  const session = { token: 't', user: { id: 1, name: 'Lucía', username: 'lucia.m' } };
  const fetchFn = jest.fn().mockResolvedValue(response(201, session));

  await expect(registerUser(form, fetchFn)).resolves.toEqual({ ok: true, session });
  const [url, options] = fetchFn.mock.calls[0];
  expect(url).toBe('http://localhost:3000/auth/register');
  expect(options.method).toBe('POST');
  expect(JSON.parse(options.body)).toEqual(form);
});

test('test_registerUser_whenUsernameIsTaken_returnsFieldErrors', async () => {
  const fetchFn = jest
    .fn()
    .mockResolvedValue(response(409, { errors: { username: 'Ya está en uso' } }));

  await expect(registerUser(form, fetchFn)).resolves.toEqual({
    ok: false,
    errors: { username: 'Ya está en uso' },
    passwordRequirements: undefined,
  });
});

test('test_registerUser_whenServerFailsWithoutDetails_returnsGeneralError', async () => {
  const fetchFn = jest.fn().mockResolvedValue(response(500, { error: 'Error interno' }));

  const result = await registerUser(form, fetchFn);

  expect(result.ok).toBe(false);
  expect(!result.ok && result.errors.general).toMatch('No se ha podido conectar');
});

test('test_registerUser_whenNetworkFails_returnsGeneralError', async () => {
  const fetchFn = jest.fn().mockRejectedValue(new Error('network'));

  const result = await registerUser(form, fetchFn);

  expect(!result.ok && result.errors.general).toMatch('No se ha podido conectar');
});
