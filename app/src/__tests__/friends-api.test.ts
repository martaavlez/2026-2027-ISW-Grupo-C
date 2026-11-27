// HU-41, HU-58 y HU-42 · Llamadas a la API de amistades.
import {
  cancelFriendRequest,
  getFriendRequests,
  getFriends,
  removeFriend,
  respondFriendRequest,
  sendFriendRequest,
} from '../services/api';

const response = (status: number, body: unknown) =>
  ({ ok: status < 300, status, json: async () => body }) as Response;

test('test_friendCalls_methodsAndPaths', async () => {
  const fetchFn = jest
    .fn()
    .mockResolvedValue(response(200, { friendship: 'sent', requestId: '5', items: [] }));

  await sendFriendRequest('nora.eco', 'tok', fetchFn);
  await cancelFriendRequest('nora.eco', 'tok', fetchFn);
  await respondFriendRequest('5', true, 'tok', fetchFn);
  await respondFriendRequest('6', false, 'tok', fetchFn);
  await removeFriend('nora.eco', 'tok', fetchFn);
  await getFriendRequests('tok', fetchFn);
  await getFriends('tok', 24, fetchFn);

  expect(fetchFn.mock.calls.map(([url, options]) => `${options.method ?? 'GET'} ${url}`)).toEqual([
    'PUT http://localhost:3000/users/nora.eco/friend-request',
    'DELETE http://localhost:3000/users/nora.eco/friend-request',
    'POST http://localhost:3000/me/friend-requests/5/accept',
    'POST http://localhost:3000/me/friend-requests/6/reject',
    'DELETE http://localhost:3000/users/nora.eco/friendship',
    'GET http://localhost:3000/me/friend-requests',
    'GET http://localhost:3000/me/friends?offset=24',
  ]);
});

test('test_friendCalls_errors', async () => {
  const conflict = jest
    .fn()
    .mockResolvedValue(response(409, { errors: { friendship: 'Ya sois amigos.' } }));
  const expired = jest.fn().mockResolvedValue(response(401, { error: 'x' }));
  const offline = jest.fn().mockRejectedValue(new TypeError('x'));

  await expect(sendFriendRequest('nora', 'tok', conflict)).resolves.toEqual({
    ok: false,
    error: 'Ya sois amigos.',
    needsLogin: false,
  });
  await expect(removeFriend('nora', 'tok', expired)).resolves.toMatchObject({ needsLogin: true });
  await expect(getFriends('tok', 0, offline)).resolves.toMatchObject({ ok: false });
});
