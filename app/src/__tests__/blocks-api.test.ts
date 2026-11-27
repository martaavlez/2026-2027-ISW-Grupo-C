// HU-35 y HU-56 · Llamadas a la API para bloquear.
import { blockUser, getBlocked, unblockUser } from '../services/blocks-api';

const response = (status: number, body: unknown) =>
  ({ ok: status < 300, status, json: async () => body }) as Response;

test('test_blockCalls_useTheTokenAndEncodedPaths', async () => {
  const fetchFn = jest.fn().mockResolvedValue(response(200, { blocked: true }));
  await expect(blockUser('bea', 'tok', fetchFn)).resolves.toEqual({
    ok: true,
    data: { blocked: true },
  });
  await unblockUser('a/b', 'tok', fetchFn);
  await getBlocked('tok', 0, fetchFn);
  expect(fetchFn.mock.calls.map(([url, init]) => [init.method, url])).toEqual([
    ['PUT', 'http://localhost:3000/users/bea/block'],
    ['DELETE', 'http://localhost:3000/users/a%2Fb/block'],
    ['GET', 'http://localhost:3000/me/blocks?offset=0'],
  ]);
  expect(fetchFn.mock.calls[0][1].headers).toEqual({ Authorization: 'Bearer tok' });
});

test('test_blockCalls_errors', async () => {
  const missing = jest
    .fn()
    .mockResolvedValue(response(404, { error: 'No tienes bloqueado a este usuario.' }));
  await expect(unblockUser('bea', 'tok', missing)).resolves.toEqual({
    ok: false,
    error: 'No tienes bloqueado a este usuario.',
    needsLogin: false,
  });
  const offline = jest.fn().mockRejectedValue(new Error('offline'));
  await expect(blockUser('bea', 'tok', offline)).resolves.toMatchObject({ ok: false });
});
