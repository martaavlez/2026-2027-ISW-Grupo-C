const jwt = require('jsonwebtoken');

const { createAuthService } = require('../../src/auth/auth-service');
const { verifyPassword } = require('../../src/auth/password');
const { ConflictError, ValidationError } = require('../../src/errors');

const tokenOptions = { secret: 'secreto-de-prueba', expiresIn: '24h' };
const form = {
  name: 'Lucía Moreno',
  username: 'lucia.m',
  email: 'Lucia@Correo.es',
  password: 'secreta123',
  acceptedTerms: true,
};

function fakeUsers({ taken = { username: false, email: false }, createError } = {}) {
  return {
    findTakenFields: jest.fn().mockResolvedValue(taken),
    createWithDefaultPrivacy: jest.fn(async (data) => {
      if (createError) throw createError;
      return { id: 7, name: data.name, username: data.username, email: data.email, role: 'user' };
    }),
  };
}

test('test_register_withValidData_createsUserWithHashedPasswordAndReturnsSession', async () => {
  const users = fakeUsers();
  const service = createAuthService({ users, tokenOptions });

  const session = await service.register(form);

  const saved = users.createWithDefaultPrivacy.mock.calls[0][0];
  expect(saved.email).toBe('lucia@correo.es');
  expect(saved.passwordHash).not.toContain('secreta123');
  await expect(verifyPassword('secreta123', saved.passwordHash)).resolves.toBe(true);
  expect(session.user).toMatchObject({ id: 7, username: 'lucia.m' });
  const payload = jwt.verify(session.token, tokenOptions.secret);
  expect(payload).toMatchObject({ sub: '7', username: 'lucia.m', role: 'user' });
  expect(payload.exp - payload.iat).toBe(24 * 60 * 60);
});

test('test_register_withInsecurePassword_throwsValidationErrorWithRequirements', async () => {
  const users = fakeUsers();
  const service = createAuthService({ users, tokenOptions });

  const error = await service.register({ ...form, password: 'corta' }).catch((e) => e);

  expect(error).toBeInstanceOf(ValidationError);
  expect(error.errors.password).toBeDefined();
  expect(error.passwordRequirements).toEqual({ minLength: false, letter: true, number: false });
  expect(users.createWithDefaultPrivacy).not.toHaveBeenCalled();
});

test('test_register_withTakenUsernameAndEmail_throwsConflictForBoth', async () => {
  const users = fakeUsers({ taken: { username: true, email: true } });
  const service = createAuthService({ users, tokenOptions });

  const error = await service.register(form).catch((e) => e);

  expect(error).toBeInstanceOf(ConflictError);
  expect(error.errors).toEqual({
    username: 'Este nombre de usuario ya está en uso. Prueba con otro.',
    email: 'Este correo ya está registrado. ¿Quieres iniciar sesión?',
  });
  expect(users.createWithDefaultPrivacy).not.toHaveBeenCalled();
});

test('test_register_whenDatabaseDetectsDuplicateEmail_throwsConflict', async () => {
  const duplicate = Object.assign(new Error('duplicate'), {
    code: '23505',
    constraint: 'users_email_key',
  });
  const service = createAuthService({ users: fakeUsers({ createError: duplicate }), tokenOptions });

  const error = await service.register(form).catch((e) => e);

  expect(error).toBeInstanceOf(ConflictError);
  expect(Object.keys(error.errors)).toEqual(['email']);
});

test('test_register_whenDatabaseDetectsDuplicateUsername_throwsConflict', async () => {
  const duplicate = Object.assign(new Error('duplicate'), { code: '23505' });
  const service = createAuthService({ users: fakeUsers({ createError: duplicate }), tokenOptions });

  const error = await service.register(form).catch((e) => e);

  expect(Object.keys(error.errors)).toEqual(['username']);
});

test('test_register_whenDatabaseFails_rethrowsTheError', async () => {
  const service = createAuthService({
    users: fakeUsers({ createError: new Error('connection lost') }),
    tokenOptions,
  });

  await expect(service.register(form)).rejects.toThrow('connection lost');
});
