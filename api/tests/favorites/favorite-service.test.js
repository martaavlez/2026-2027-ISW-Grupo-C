const {
  createFavoriteService,
  previewFavorites,
  LOGIN_REQUIRED,
  PAGE_SIZE,
  PREVIEW_SIZE,
} = require('../../src/favorites/favorite-service');
const { UnauthorizedError } = require('../../src/auth/auth-errors');
const { NotFoundError, ValidationError } = require('../../src/errors');

function serviceWith(overrides = {}) {
  const favorites = {
    add: jest.fn().mockResolvedValue(true),
    remove: jest.fn().mockResolvedValue(true),
    findByUser: jest.fn().mockResolvedValue({
      songs: {
        total: 200,
        items: [{ id: '1', title: 'Una', coverUrl: 'javascript:x', artists: [] }],
      },
      albums: {
        total: 1,
        items: [
          { id: '2', title: 'Disco', coverUrl: 'https://coverartarchive.org/a', artists: [] },
        ],
      },
      artists: { total: 1, items: [{ id: '3', name: 'Grupo', imageUrl: 'http://x.test/a.jpg' }] },
    }),
    findPage: jest.fn().mockResolvedValue({
      total: 200,
      items: [{ id: '1', title: 'Una', coverUrl: 'javascript:x', artists: [] }],
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

test('test_previewFavorites_firstItemsOfEachSubcategory_withTotalsAndSafeImages', async () => {
  const { favorites } = serviceWith();

  const result = await previewFavorites(favorites, '7');

  expect(favorites.findByUser).toHaveBeenCalledWith('7', { limit: PREVIEW_SIZE });
  expect(result.songs.total).toBe(200);
  expect(result.songs.items[0].coverUrl).toBeNull();
  expect(result.albums.items[0].coverUrl).toBe('https://coverartarchive.org/a');
  expect(result.artists.items[0].imageUrl).toBeNull();
});

test('test_listMine_givesOnePageOfASubcategory', async () => {
  const { service, favorites } = serviceWith();

  const result = await service.listMine('7', 'songs', '24');

  expect(favorites.findPage).toHaveBeenCalledWith('7', 'song', { limit: PAGE_SIZE, offset: 24 });
  expect(result).toEqual({
    total: 200,
    offset: 24,
    pageSize: PAGE_SIZE,
    items: [expect.objectContaining({ id: '1', coverUrl: null })],
  });
});

test('test_listMine_withoutOffset_startsAtTheBeginning', async () => {
  const { service, favorites } = serviceWith();
  await service.listMine('7', 'artists');
  expect(favorites.findPage).toHaveBeenCalledWith('7', 'artist', { limit: PAGE_SIZE, offset: 0 });
});

test('test_security_listMine_rejectsUnknownTypeOrOffset', async () => {
  const { service, favorites } = serviceWith();
  await expect(service.listMine('7', 'users')).rejects.toBeInstanceOf(ValidationError);
  await expect(service.listMine('7', '__proto__')).rejects.toBeInstanceOf(ValidationError);
  await expect(service.listMine('7', 'songs', '-1')).rejects.toBeInstanceOf(ValidationError);
  await expect(service.listMine('7', 'songs', '1 OR 1=1')).rejects.toBeInstanceOf(ValidationError);
  await expect(service.listMine('7', 'songs', '999999')).rejects.toBeInstanceOf(ValidationError);
  expect(favorites.findPage).not.toHaveBeenCalled();
});

test('test_listMine_asVisitor_isRejected', async () => {
  const { service } = serviceWith();
  await expect(service.listMine(null, 'songs')).rejects.toBeInstanceOf(UnauthorizedError);
});
