import { getAlbum, getReviews, getSong } from '../services/api';

const response = (status: number, body: unknown) =>
  ({ ok: status < 300, status, json: async () => body }) as Response;

test('test_getAlbum_asVisitor_requestsWithoutToken', async () => {
  const fetchFn = jest.fn().mockResolvedValue(response(200, { id: '1' }));

  await expect(getAlbum('1', undefined, fetchFn)).resolves.toEqual({ ok: true, data: { id: '1' } });
  expect(fetchFn).toHaveBeenCalledWith('http://localhost:3000/albums/1', { headers: {} });
});

test('test_getSong_withSession_sendsBearerToken', async () => {
  const fetchFn = jest.fn().mockResolvedValue(response(200, { id: '2' }));

  await getSong('2', 'tok', fetchFn);

  expect(fetchFn).toHaveBeenCalledWith('http://localhost:3000/songs/2', {
    headers: { Authorization: 'Bearer tok' },
  });
});

test('test_getAlbum_encodesIdSoItCannotChangeThePath', async () => {
  const fetchFn = jest.fn().mockResolvedValue(response(400, {}));

  await getAlbum('1/../../auth/register?x=1', undefined, fetchFn);

  expect(fetchFn.mock.calls[0][0]).toBe(
    'http://localhost:3000/albums/1%2F..%2F..%2Fauth%2Fregister%3Fx%3D1',
  );
});

test('test_getAlbum_whenNotFound_returnsNotFoundMessage', async () => {
  const fetchFn = jest.fn().mockResolvedValue(response(404, { error: 'El álbum no existe' }));

  await expect(getAlbum('9', undefined, fetchFn)).resolves.toEqual({
    ok: false,
    notFound: true,
    error: 'Este álbum no existe o ya no está en el catálogo.',
  });
});

test('test_getSong_whenServerFails_returnsRetryableError', async () => {
  const fetchFn = jest.fn().mockResolvedValue(response(500, {}));

  const result = await getSong('9', undefined, fetchFn);

  expect(result).toMatchObject({ ok: false, notFound: false });
});

test('test_getAlbum_withoutConnection_returnsConnectionError', async () => {
  const fetchFn = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));

  const result = await getAlbum('1', undefined, fetchFn);

  expect(result).toMatchObject({ ok: false, notFound: false });
  expect(!result.ok && result.error).toMatch(/conectar con Hertz/);
});

test('test_getReviews_requestsNextPageWithOffset', async () => {
  const fetchFn = jest.fn().mockResolvedValue(response(200, { total: 12, items: [] }));

  await getReviews('song', '3', 10, undefined, fetchFn);

  expect(fetchFn.mock.calls[0][0]).toBe('http://localhost:3000/songs/3/reviews?offset=10');
});
