const {
  createProfileService,
  LOGIN_REQUIRED,
  REVIEWS_PAGE_SIZE,
} = require('../../src/profile/profile-service');
const { ValidationError } = require('../../src/errors');
const { UnauthorizedError } = require('../../src/auth/auth-errors');

const profile = {
  user: { id: '7', name: 'Lucía', username: 'lucia', bio: 'Hola', photoUrl: 'javascript:x' },
  counts: { reviews: 1, followers: 2, following: 3, friends: 1, favorites: 1, boards: 1 },
  reviews: [{ id: '1', rating: 4, body: 'Bien', coverUrl: 'data:x', kind: 'album' }],
  boards: [
    {
      id: '5',
      name: 'Domingos',
      privacy: 'public',
      itemsCount: 3,
      coverUrl: 'https://coverartarchive.org/b',
    },
    { id: '6', name: 'Vacío', privacy: 'private', itemsCount: 0, coverUrl: 'http://x.test/c.jpg' },
  ],
};

function serviceWith(found = profile) {
  const profiles = {
    findOwnProfile: jest.fn().mockResolvedValue(found),
    findReviews: jest
      .fn()
      .mockResolvedValue([{ id: '2', rating: 3, body: null, coverUrl: 'ftp://x', kind: 'song' }]),
  };
  const favorites = {
    findByUser: jest.fn().mockResolvedValue({
      songs: {
        total: 40,
        items: [{ id: '10', title: 'Una', coverUrl: 'https://coverartarchive.org/a', artists: [] }],
      },
      albums: { total: 0, items: [] },
      artists: { total: 1, items: [{ id: '3', name: 'Grupo', imageUrl: 'http://x.test/a.jpg' }] },
    }),
  };
  return { service: createProfileService({ profiles, favorites }), profiles, favorites };
}

test('test_PA_06_01_getOwnProfile_returnsInfoCountsAndTheThreeFolders', async () => {
  const { service, profiles, favorites } = serviceWith();

  const result = await service.getOwnProfile('7');

  expect(profiles.findOwnProfile).toHaveBeenCalledWith('7', { reviewsLimit: REVIEWS_PAGE_SIZE });
  expect(favorites.findByUser).toHaveBeenCalledWith('7', { limit: expect.any(Number) });
  expect(result.user).toEqual({
    id: '7',
    name: 'Lucía',
    username: 'lucia',
    bio: 'Hola',
    photoUrl: null,
  });
  expect(result.counts.followers).toBe(2);
  // Las reseñas y los favoritos llegan por páginas, con el total para el «Ver más».
  expect(result.reviews.total).toBe(1);
  expect(result.reviews.pageSize).toBe(REVIEWS_PAGE_SIZE);
  expect(result.reviews.items[0].coverUrl).toBeNull();
  expect(result.favorites.songs.total).toBe(40);
  expect(result.favorites.songs.items[0].coverUrl).toBe('https://coverartarchive.org/a');
  expect(result.favorites.artists.items[0].imageUrl).toBeNull();
  // Cada tablero con la carátula de su portada, solo si es segura.
  expect(result.boards.map((board) => board.coverUrl)).toEqual([
    'https://coverartarchive.org/b',
    null,
  ]);
});

test('test_getOwnProfile_asVisitor_isRejected', async () => {
  const { service, profiles } = serviceWith();
  await expect(service.getOwnProfile(null)).rejects.toThrow(new UnauthorizedError(LOGIN_REQUIRED));
  expect(profiles.findOwnProfile).not.toHaveBeenCalled();
});

test('test_getOwnProfile_ofDeletedAccount_isRejected', async () => {
  const { service } = serviceWith(null);
  await expect(service.getOwnProfile('7')).rejects.toBeInstanceOf(UnauthorizedError);
});

test('test_getOwnReviews_givesTheNextPage', async () => {
  const { service, profiles } = serviceWith();

  const result = await service.getOwnReviews('7', '10');

  expect(profiles.findReviews).toHaveBeenCalledWith('7', { limit: REVIEWS_PAGE_SIZE, offset: 10 });
  expect(result.offset).toBe(10);
  expect(result.items[0].coverUrl).toBeNull();
});

test('test_security_getOwnReviews_rejectsVisitorAndBadOffset', async () => {
  const { service, profiles } = serviceWith();
  await expect(service.getOwnReviews(null, '0')).rejects.toBeInstanceOf(UnauthorizedError);
  await expect(service.getOwnReviews('7', '-5')).rejects.toBeInstanceOf(ValidationError);
  await expect(service.getOwnReviews('7', "0' OR '1'='1")).rejects.toBeInstanceOf(ValidationError);
  expect(profiles.findReviews).not.toHaveBeenCalled();
});
