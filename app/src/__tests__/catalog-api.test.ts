import {
  getMyProfile,
  getMyFavorites,
  getMyReviews,
  setFavorite,
  getAlbum,
  getArtist,
  getReviews,
  getSong,
  publishReview,
  rateItem,
  search,
} from '../services/api';

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

test('test_getArtist_asVisitorOrWithSession', async () => {
  const fetchFn = jest.fn().mockResolvedValue(response(200, { id: '3' }));

  await expect(getArtist('3', undefined, fetchFn)).resolves.toEqual({
    ok: true,
    data: { id: '3' },
  });
  expect(fetchFn).toHaveBeenCalledWith('http://localhost:3000/artists/3', { headers: {} });
  await getArtist('3', 'tok', fetchFn);
  expect(fetchFn).toHaveBeenLastCalledWith('http://localhost:3000/artists/3', {
    headers: { Authorization: 'Bearer tok' },
  });
});

test('test_getArtist_whenNotFound_returnsArtistMessage', async () => {
  const fetchFn = jest.fn().mockResolvedValue(response(404, {}));

  const result = await getArtist('9', undefined, fetchFn);

  expect(!result.ok && result.error).toBe('Este artista no existe o ya no está en el catálogo.');
});

test('test_search_encodesTermAndSendsToken', async () => {
  const fetchFn = jest.fn().mockResolvedValue(response(200, { query: 'a&b' }));

  await search('a&b=c #x', 'tok', fetchFn);

  expect(fetchFn).toHaveBeenCalledWith('http://localhost:3000/search?q=a%26b%3Dc%20%23x', {
    headers: { Authorization: 'Bearer tok' },
  });
});

test('test_search_with400_returnsServerMessage', async () => {
  const fetchFn = jest.fn().mockResolvedValue(response(400, { errors: { q: 'Muy corto.' } }));
  await expect(search('a', undefined, fetchFn)).resolves.toEqual({
    ok: false,
    error: 'Muy corto.',
  });
});

test('test_search_with500OrNoConnection_returnsError', async () => {
  const failing = jest.fn().mockResolvedValue(response(500, {}));
  const offline = jest.fn().mockRejectedValue(new TypeError('x'));

  expect((await search('luz', undefined, failing)).ok).toBe(false);
  const result = await search('luz', undefined, offline);
  expect(!result.ok && result.error).toMatch(/conectar con Hertz/);
});

test('test_rateItem_putsRatingWithToken', async () => {
  const data = { myRating: 4, averageRating: 4, ratingsCount: 1, distribution: {} };
  const fetchFn = jest.fn().mockResolvedValue(response(200, data));

  await expect(rateItem('song', '3', 4, 'tok', fetchFn)).resolves.toEqual({ ok: true, data });
  const [url, options] = fetchFn.mock.calls[0];
  expect(url).toBe('http://localhost:3000/songs/3/rating');
  expect(options.method).toBe('PUT');
  expect(options.headers.Authorization).toBe('Bearer tok');
  expect(JSON.parse(options.body)).toEqual({ rating: 4 });
});

test('test_rateItem_errors', async () => {
  const invalid = jest.fn().mockResolvedValue(response(400, { errors: { rating: 'Del 1 al 5.' } }));
  const visitor = jest.fn().mockResolvedValue(response(401, { error: 'Inicia sesión.' }));
  const offline = jest.fn().mockRejectedValue(new TypeError('x'));

  await expect(rateItem('album', '1', 9, 'tok', invalid)).resolves.toEqual({
    ok: false,
    error: 'Del 1 al 5.',
    needsLogin: false,
  });
  await expect(rateItem('album', '1', 3, undefined, visitor)).resolves.toEqual({
    ok: false,
    error: 'Inicia sesión.',
    needsLogin: true,
  });
  expect((await rateItem('album', '1', 3, 'tok', offline)).ok).toBe(false);
});

test('test_publishReview_putsFormWithToken', async () => {
  const fetchFn = jest.fn().mockResolvedValue(response(201, { myRating: 4 }));

  await expect(
    publishReview('album', '1', { rating: 4, body: 'Bien', privacy: 'public' }, 'tok', fetchFn),
  ).resolves.toEqual({ ok: true, data: { myRating: 4 } });
  const [url, options] = fetchFn.mock.calls[0];
  expect(url).toBe('http://localhost:3000/albums/1/review');
  expect(options.method).toBe('PUT');
  expect(JSON.parse(options.body)).toEqual({ rating: 4, body: 'Bien', privacy: 'public' });
});

test('test_publishReview_errors', async () => {
  const invalid = jest.fn().mockResolvedValue(response(400, { errors: { body: 'Falta' } }));
  const visitor = jest.fn().mockResolvedValue(response(401, { error: 'Inicia sesión.' }));
  const offline = jest.fn().mockRejectedValue(new TypeError('x'));
  const form = { rating: 4, body: 'x', privacy: 'public' as const };

  await expect(publishReview('song', '1', form, 'tok', invalid)).resolves.toEqual({
    ok: false,
    errors: { body: 'Falta' },
    needsLogin: false,
  });
  await expect(publishReview('song', '1', form, undefined, visitor)).resolves.toEqual({
    ok: false,
    errors: { general: 'Inicia sesión.' },
    needsLogin: true,
  });
  expect((await publishReview('song', '1', form, 'tok', offline)).ok).toBe(false);
});

test('test_setFavorite_putsOrDeletesWithToken', async () => {
  const fetchFn = jest.fn().mockResolvedValue(response(200, { favorite: true }));

  await expect(setFavorite('song', '3', true, 'tok', fetchFn)).resolves.toEqual({ ok: true });
  await setFavorite('artist', '4', false, 'tok', fetchFn);

  expect(fetchFn).toHaveBeenNthCalledWith(1, 'http://localhost:3000/songs/3/favorite', {
    method: 'PUT',
    headers: { Authorization: 'Bearer tok' },
  });
  expect(fetchFn).toHaveBeenNthCalledWith(2, 'http://localhost:3000/artists/4/favorite', {
    method: 'DELETE',
    headers: { Authorization: 'Bearer tok' },
  });
});

test('test_setFavorite_errors', async () => {
  const visitor = jest.fn().mockResolvedValue(response(401, { error: 'Inicia sesión.' }));
  const offline = jest.fn().mockRejectedValue(new TypeError('x'));

  await expect(setFavorite('album', '1', true, undefined, visitor)).resolves.toEqual({
    ok: false,
    error: 'Inicia sesión.',
    needsLogin: true,
  });
  expect((await setFavorite('album', '1', true, 'tok', offline)).ok).toBe(false);
});

test('test_getMyFavorites_asksForOnePageOfASubcategory', async () => {
  const data = { offset: 6, pageSize: 24, items: [] };
  const ok = jest.fn().mockResolvedValue(response(200, data));
  const expired = jest.fn().mockResolvedValue(response(401, {}));
  const offline = jest.fn().mockRejectedValue(new TypeError('x'));

  await expect(getMyFavorites('tok', 'albums', 6, ok)).resolves.toEqual({ ok: true, data });
  expect(ok).toHaveBeenCalledWith('http://localhost:3000/me/favorites?type=albums&offset=6', {
    headers: { Authorization: 'Bearer tok' },
  });
  await expect(getMyFavorites('tok', 'songs', 0, expired)).resolves.toMatchObject({
    needsLogin: true,
  });
  await expect(getMyFavorites('tok', 'songs', 0, offline)).resolves.toMatchObject({
    needsLogin: false,
  });
});

test('test_getMyReviews_asksFromOffset', async () => {
  const ok = jest.fn().mockResolvedValue(response(200, { offset: 10, pageSize: 10, items: [] }));

  await expect(getMyReviews('tok', 10, ok)).resolves.toMatchObject({ ok: true });
  expect(ok).toHaveBeenCalledWith('http://localhost:3000/me/reviews?offset=10', {
    headers: { Authorization: 'Bearer tok' },
  });
});

test('test_getMyProfile', async () => {
  const ok = jest.fn().mockResolvedValue(response(200, { user: { id: '1' } }));
  const expired = jest.fn().mockResolvedValue(response(401, {}));
  const offline = jest.fn().mockRejectedValue(new TypeError('x'));

  await expect(getMyProfile('tok', ok)).resolves.toEqual({ ok: true, data: { user: { id: '1' } } });
  expect(ok).toHaveBeenCalledWith('http://localhost:3000/me/profile', {
    headers: { Authorization: 'Bearer tok' },
  });
  await expect(getMyProfile('tok', expired)).resolves.toMatchObject({ needsLogin: true });
  await expect(getMyProfile('tok', offline)).resolves.toMatchObject({ needsLogin: false });
});
