// HU-24 · Llamadas a la API del perfil de otro usuario.
import { getUserFavorites, getUserProfile, getUserReviews } from '../services/api';

const response = (status: number, body: unknown) =>
  ({ ok: status < 300, status, json: async () => body }) as Response;

test('test_getUserProfile_encodesUsername_andSaysWhenUnavailable', async () => {
  const ok = jest.fn().mockResolvedValue(response(200, { user: { id: '4' } }));
  const missing = jest.fn().mockResolvedValue(response(404, { error: 'x' }));
  const offline = jest.fn().mockRejectedValue(new TypeError('x'));

  await expect(getUserProfile('nora.eco', 'tok', ok)).resolves.toMatchObject({ ok: true });
  expect(ok).toHaveBeenCalledWith('http://localhost:3000/users/nora.eco/profile', {
    headers: { Authorization: 'Bearer tok' },
  });
  await getUserProfile('a/../b', undefined, ok);
  expect(ok).toHaveBeenLastCalledWith('http://localhost:3000/users/a%2F..%2Fb/profile', {
    headers: {},
  });
  await expect(getUserProfile('x', undefined, missing)).resolves.toEqual({
    ok: false,
    error: 'Este perfil no está disponible.',
    notFound: true,
  });
  await expect(getUserProfile('x', undefined, offline)).resolves.toMatchObject({
    notFound: false,
  });
});

test('test_getUserReviewsAndFavorites_paths', async () => {
  const fetchFn = jest.fn().mockResolvedValue(response(200, { items: [] }));

  await getUserReviews('nora.eco', 10, undefined, fetchFn);
  await getUserFavorites('nora.eco', 'albums', 24, 'tok', fetchFn);

  expect(fetchFn.mock.calls.map(([url]) => url)).toEqual([
    'http://localhost:3000/users/nora.eco/reviews?offset=10',
    'http://localhost:3000/users/nora.eco/favorites?type=albums&offset=24',
  ]);
});
