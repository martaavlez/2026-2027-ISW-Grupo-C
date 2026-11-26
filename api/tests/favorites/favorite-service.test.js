const { createFavoriteService, LOGIN_REQUIRED } = require('../../src/favorites/favorite-service');
const { UnauthorizedError } = require('../../src/auth/auth-errors');
const { NotFoundError, ValidationError } = require('../../src/errors');

function serviceWith(overrides = {}) {
  const favorites = {
    add: jest.fn().mockResolvedValue(true),
    remove: jest.fn().mockResolvedValue(true),
    findByUser: jest.fn().mockResolvedValue({
      songs: [{ id: '1', title: 'Una', coverUrl: 'javascript:x', artists: [] }],
      albums: [{ id: '2', title: 'Disco', coverUrl: 'https://coverartarchive.org/a', artists: [] }],
      artists: [{ id: '3', name: 'Grupo', imageUrl: 'http://x.test/a.jpg' }],
    }),
    ...overrides,
  };
  return { service: createFavoriteService({ favorites }), favorites };
}

test('test_PA_07_01_setFavorite_addsIt', async () => {
  const { service, favorites } = serviceWith();
  await expect(service.setFavorite('song', '10', '7', true)).resolves.toEqual({ favorite: true });
  expect(favorites.add).toHaveBeenCalledWith('song', '10', '7');
});

test('test_PA_46_01_setFavorite_false_removesIt', async () => {
  const { service, favorites } = serviceWith();
  await expect(service.setFavorite('album', '2', '7', false)).resolves.toEqual({ favorite: false });
  expect(favorites.remove).toHaveBeenCalledWith('album', '2', '7');
});

test('test_setFavorite_asVisitor_asksToLogIn', async () => {
  const { service, favorites } = serviceWith();
  await expect(service.setFavorite('artist', '3', null, true)).rejects.toThrow(
    new UnauthorizedError(LOGIN_REQUIRED),
  );
  expect(favorites.add).not.toHaveBeenCalled();
});

test('test_setFavorite_invalidOrUnknownItem', async () => {
  const { service } = serviceWith({ add: jest.fn().mockResolvedValue(false) });
  await expect(service.setFavorite('song', "1' OR 1=1", '7', true)).rejects.toBeInstanceOf(
    ValidationError,
  );
  await expect(service.setFavorite('song', '999', '7', true)).rejects.toBeInstanceOf(NotFoundError);
});

test('test_listMine_groupsBySubcategoryWithSafeImages', async () => {
  const { service } = serviceWith();

  const result = await service.listMine('7');

  expect(result.songs[0].coverUrl).toBeNull();
  expect(result.albums[0].coverUrl).toBe('https://coverartarchive.org/a');
  expect(result.artists[0].imageUrl).toBeNull();
});

test('test_listMine_asVisitor_isRejected', async () => {
  const { service } = serviceWith();
  await expect(service.listMine(null)).rejects.toBeInstanceOf(UnauthorizedError);
});
