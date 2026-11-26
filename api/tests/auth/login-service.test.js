const { hashPassword } = require('../../src/auth/password');
const {
  createLoginService,
  WRONG_CREDENTIALS,
  INVALID_SESSION,
} = require('../../src/auth/login-service');
const { createSessionToken } = require('../../src/auth/token');
const { SuspendedAccountError, UnauthorizedError } = require('../../src/auth/auth-errors');
const { ValidationError } = require('../../src/errors');

const tokenOptions = { secret: 'clave-de-pruebas-con-mas-de-32-caracteres', expiresIn: '1h' };
let passwordHash;

beforeAll(async () => {
  passwordHash = await hashPassword('secreta123');
});

function userRow(overrides = {}) {
  return {
    id: '7',
    name: 'Lucía',
    username: 'lucia.m',
    email: 'lucia@correo.es',
    role: 'user',
    status: 'active',
    suspensionReason: null,
    passwordHash,
    ...overrides,
  };
}

function serviceWith(user) {
  const credentials = {
    findForLogin: jest.fn().mockResolvedValue(user),
    findById: jest.fn().mockResolvedValue(user),
  };
  return { service: createLoginService({ credentials, tokenOptions }), credentials };
}

test('test_PA_02_01_login_withRightPassword_returnsSessionWithoutHash', async () => {
  const { service, credentials } = serviceWith(userRow());

  const session = await service.login({ login: '  lucia.m ', password: 'secreta123' });

  expect(credentials.findForLogin).toHaveBeenCalledWith('lucia.m');
  expect(session.user).toEqual({
    id: '7',
    name: 'Lucía',
    username: 'lucia.m',
    email: 'lucia@correo.es',
    role: 'user',
  });
  expect(session.token).toEqual(expect.any(String));
  expect(JSON.stringify(session)).not.toContain('$2');
});

test('test_PA_02_02_login_withWrongPassword_throwsGenericMessage', async () => {
  const { service } = serviceWith(userRow());
  await expect(service.login({ login: 'lucia.m', password: 'otra1234' })).rejects.toMatchObject({
    status: 401,
    message: WRONG_CREDENTIALS,
  });
});

test('test_PA_02_02_login_withUnknownUser_throwsSameMessageAfterComparing', async () => {
  const { service } = serviceWith(null);
  const started = Date.now();

  await expect(service.login({ login: 'nadie', password: 'secreta123' })).rejects.toMatchObject({
    status: 401,
    message: WRONG_CREDENTIALS,
  });
  // Aunque no exista, se ha comparado con bcrypt (coste 12): tarda lo mismo que uno real.
  expect(Date.now() - started).toBeGreaterThan(50);
});

test('test_login_withPasswordLongerThan72Bytes_isRejected', async () => {
  const { service } = serviceWith(userRow());
  await expect(
    service.login({ login: 'lucia.m', password: `secreta123${'x'.repeat(70)}` }),
  ).rejects.toBeInstanceOf(UnauthorizedError);
});

test('test_PA_02_03_login_suspendedWithRightPassword_explainsSuspension', async () => {
  const { service } = serviceWith(userRow({ status: 'suspended', suspensionReason: 'Spam' }));

  await expect(service.login({ login: 'lucia.m', password: 'secreta123' })).rejects.toMatchObject({
    status: 403,
    message: 'Tu cuenta está suspendida. Motivo: Spam',
  });
});

test('test_PA_02_03_login_suspendedWithWrongPassword_doesNotRevealSuspension', async () => {
  const { service } = serviceWith(userRow({ status: 'suspended', suspensionReason: 'Spam' }));
  await expect(service.login({ login: 'lucia.m', password: 'mala1234' })).rejects.toMatchObject({
    status: 401,
  });
});

test.each([
  [{}, ['login', 'password']],
  [{ login: '   ', password: 'x' }, ['login']],
  [{ login: 'lucia', password: '' }, ['password']],
  [{ login: ['a'], password: { $ne: null } }, ['login', 'password']],
])('test_login_withMissingOrWrongTypes_%p_throwsValidation', async (body, fields) => {
  const { service, credentials } = serviceWith(userRow());

  const error = await service.login(body).catch((caught) => caught);

  expect(error).toBeInstanceOf(ValidationError);
  expect(Object.keys(error.errors).sort()).toEqual(fields);
  expect(credentials.findForLogin).not.toHaveBeenCalled();
});

test('test_PA_02_04_currentUser_withValidToken_returnsUser', async () => {
  const { service } = serviceWith(userRow());
  const token = createSessionToken(userRow(), tokenOptions);

  await expect(service.currentUser(`Bearer ${token}`)).resolves.toEqual({
    user: expect.objectContaining({ username: 'lucia.m' }),
  });
});

test.each([
  ['sin cabecera', undefined],
  ['sin Bearer', 'abc'],
  ['token manipulado', 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.firmafalsa'],
])('test_PA_02_04_currentUser_%s_throwsUnauthorized', async (_case, header) => {
  const { service } = serviceWith(userRow());
  await expect(service.currentUser(header)).rejects.toMatchObject({
    status: 401,
    message: INVALID_SESSION,
  });
});

test('test_PA_02_04_currentUser_withExpiredToken_throwsUnauthorized', async () => {
  const { service } = serviceWith(userRow());
  const expired = createSessionToken(userRow(), { ...tokenOptions, expiresIn: -10 });
  await expect(service.currentUser(`Bearer ${expired}`)).rejects.toBeInstanceOf(UnauthorizedError);
});

test('test_currentUser_ofDeletedUser_throwsUnauthorized', async () => {
  const { service } = serviceWith(null);
  const token = createSessionToken(userRow(), tokenOptions);
  await expect(service.currentUser(`Bearer ${token}`)).rejects.toBeInstanceOf(UnauthorizedError);
});

test('test_currentUser_ofSuspendedUser_throwsSuspended', async () => {
  const { service } = serviceWith(userRow({ status: 'suspended', suspensionReason: 'Spam' }));
  const token = createSessionToken(userRow(), tokenOptions);
  await expect(service.currentUser(`Bearer ${token}`)).rejects.toBeInstanceOf(
    SuspendedAccountError,
  );
});
