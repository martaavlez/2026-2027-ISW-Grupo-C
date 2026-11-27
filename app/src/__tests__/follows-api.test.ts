// HU-10 y HU-48 · Llamadas a la API para seguir.
import { followUser, getFollowing, unfollowUser } from '../services/follows-api';

const response = (status: number, body: unknown) =>
  ({ ok: status < 300, status, json: async () => body }) as Response;

test('test_followCalls_useTheTokenAndEncodedPaths', async () => {
  const fetchFn = jest.fn().mockResolvedValue(response(200, { following: true, followers: 1 }));
  await expect(followUser('bea', 'tok', fetchFn)).resolves.toEqual({
    ok: true,
    data: { following: true, followers: 1 },
  });
  await unfollowUser('../me', 'tok', fetchFn);
  await getFollowing('tok', 24, fetchFn);
  expect(fetchFn.mock.calls.map(([url, init]) => [init.method, url])).toEqual([
    ['PUT', 'http://localhost:3000/users/bea/follow'],
    ['DELETE', 'http://localhost:3000/users/..%2Fme/follow'],
    ['GET', 'http://localhost:3000/me/following?offset=24'],
  ]);
  expect(fetchFn.mock.calls[0][1].headers).toEqual({ Authorization: 'Bearer tok' });
});

test('test_followCalls_errors', async () => {
  const notFound = jest
    .fn()
    .mockResolvedValue(response(404, { error: 'Este perfil no está disponible.' }));
  await expect(followUser('x', 'tok', notFound)).resolves.toEqual({
    ok: false,
    error: 'Este perfil no está disponible.',
    needsLogin: false,
  });
  const expired = jest.fn().mockResolvedValue(response(401, { error: 'Inicia sesión' }));
  await expect(getFollowing('tok', 0, expired)).resolves.toMatchObject({ needsLogin: true });
  const offline = jest.fn().mockRejectedValue(new Error('offline'));
  await expect(unfollowUser('x', 'tok', offline)).resolves.toMatchObject({
    ok: false,
    needsLogin: false,
  });
});
