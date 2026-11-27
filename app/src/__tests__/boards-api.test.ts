// HU-09, HU-25, HU-49, HU-26, HU-50 y HU-34 · Llamadas a la API de tableros.
import {
  addToBoard,
  createBoard,
  deleteBoard,
  getBoard,
  getMyBoardsFor,
  removeFromBoard,
  updateBoard,
} from '../services/boards-api';

const response = (status: number, body: unknown) =>
  ({ ok: status < 300, status, json: async () => body }) as Response;
const ok = (body: unknown = {}) => jest.fn().mockResolvedValue(response(200, body));

test('test_createBoard_postsJsonWithToken_withoutOwner', async () => {
  const fetchFn = jest.fn().mockResolvedValue(response(201, { id: '9' }));

  await expect(createBoard('tok', { name: 'Noche', description: '' }, fetchFn)).resolves.toEqual({
    ok: true,
    data: { id: '9' },
  });
  const [url, options] = fetchFn.mock.calls[0];
  expect(url).toBe('http://localhost:3000/boards');
  expect(options.method).toBe('POST');
  expect(options.headers).toEqual({
    'Content-Type': 'application/json',
    Authorization: 'Bearer tok',
  });
  expect(JSON.parse(options.body)).toEqual({ name: 'Noche', description: '' });
});

test('test_boardCalls_useTheRightMethodAndEncodedPaths', async () => {
  const calls: [string, string][] = [];
  const fetchFn = jest.fn(async (url: string, options: RequestInit) => {
    calls.push([String(options.method), url.replace('http://localhost:3000', '')]);
    return response(200, {});
  }) as unknown as typeof fetch;

  await getBoard('5', undefined, fetchFn);
  await updateBoard('tok', '5', { privacy: 'private' }, fetchFn);
  await deleteBoard('tok', '5', fetchFn);
  await addToBoard('tok', '5', { kind: 'song', id: '3' }, fetchFn);
  await removeFromBoard('tok', '5', '8', fetchFn);
  await getMyBoardsFor('tok', { kind: 'album', id: '3' }, fetchFn);
  await getBoard('../me/profile', undefined, fetchFn);

  expect(calls).toEqual([
    ['GET', '/boards/5'],
    ['PATCH', '/boards/5'],
    ['DELETE', '/boards/5'],
    ['POST', '/boards/5/items'],
    ['DELETE', '/boards/5/items/8'],
    ['GET', '/me/boards?kind=album&id=3'],
    ['GET', '/boards/..%2Fme%2Fprofile'],
  ]);
});

test('test_getBoard_visitorSendsNoToken', async () => {
  const fetchFn = ok({ id: '5' });
  await getBoard('5', undefined, fetchFn);
  expect(fetchFn.mock.calls[0][1].headers).toEqual({});
});

test('test_boardCalls_errors', async () => {
  const duplicate = jest
    .fn()
    .mockResolvedValue(response(409, { error: 'x', errors: { item: 'Ya está en este tablero.' } }));
  await expect(addToBoard('tok', '5', { kind: 'song', id: '3' }, duplicate)).resolves.toEqual({
    ok: false,
    errors: { item: 'Ya está en este tablero.' },
    needsLogin: false,
    notFound: false,
  });
  const missing = jest
    .fn()
    .mockResolvedValue(response(404, { error: 'Este tablero no está disponible.' }));
  await expect(getBoard('5', 'tok', missing)).resolves.toMatchObject({
    ok: false,
    notFound: true,
    errors: { form: 'Este tablero no está disponible.' },
  });
  const expired = jest.fn().mockResolvedValue(response(401, { error: 'Inicia sesión' }));
  await expect(deleteBoard('tok', '5', expired)).resolves.toMatchObject({ needsLogin: true });
  const offline = jest.fn().mockRejectedValue(new Error('offline'));
  await expect(createBoard('tok', { name: 'x', description: '' }, offline)).resolves.toMatchObject({
    ok: false,
    errors: { form: expect.stringContaining('No se ha podido conectar') },
  });
});
