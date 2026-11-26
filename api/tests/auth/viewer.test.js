const jwt = require('jsonwebtoken');

const { createSessionToken, verifySessionToken } = require('../../src/auth/token');
const { createViewerResolver } = require('../../src/auth/viewer');

const secret = 'clave-de-pruebas-con-mas-de-32-caracteres';
const tokenFor = (id, options = {}) =>
  createSessionToken({ id, username: 'u', role: 'user' }, { secret, expiresIn: '1h', ...options });

function resolverWith(findActiveId = jest.fn().mockResolvedValue('7')) {
  return { resolve: createViewerResolver({ users: { findActiveId }, secret }), findActiveId };
}

test('test_verifySessionToken_withValidToken_returnsUserId', () => {
  expect(verifySessionToken(tokenFor(7), { secret })).toBe('7');
});

test('test_verifySessionToken_withWrongSecret_returnsNull', () => {
  expect(
    verifySessionToken(tokenFor(7), { secret: 'otra-clave-distinta-de-32-caracteres!!' }),
  ).toBeNull();
});

test('test_verifySessionToken_withExpiredToken_returnsNull', () => {
  const expired = jwt.sign({ sub: '7' }, secret, { algorithm: 'HS256', expiresIn: -10 });
  expect(verifySessionToken(expired, { secret })).toBeNull();
});

test('test_verifySessionToken_withUnsignedAlgNoneToken_returnsNull', () => {
  const unsigned = jwt.sign({ sub: '1' }, null, { algorithm: 'none' });
  expect(verifySessionToken(unsigned, { secret })).toBeNull();
});

test('test_verifySessionToken_withNonNumericSubject_returnsNull', () => {
  const token = jwt.sign({ sub: '1 OR 1=1' }, secret, { algorithm: 'HS256' });
  expect(verifySessionToken(token, { secret })).toBeNull();
});

test('test_resolveViewer_withValidBearer_returnsActiveUserId', async () => {
  const { resolve, findActiveId } = resolverWith();
  await expect(resolve(`Bearer ${tokenFor(7)}`)).resolves.toBe('7');
  expect(findActiveId).toHaveBeenCalledWith('7');
});

test('test_resolveViewer_withoutHeaderOrMalformed_returnsVisitorWithoutQuerying', async () => {
  const { resolve, findActiveId } = resolverWith();
  await expect(resolve(undefined)).resolves.toBeNull();
  await expect(resolve('Basic abc')).resolves.toBeNull();
  await expect(resolve('Bearer <script>')).resolves.toBeNull();
  expect(findActiveId).not.toHaveBeenCalled();
});

test('test_resolveViewer_withSuspendedOrDeletedUser_returnsVisitor', async () => {
  const { resolve } = resolverWith(jest.fn().mockResolvedValue(null));
  await expect(resolve(`Bearer ${tokenFor(7)}`)).resolves.toBeNull();
});
