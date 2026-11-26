const { createCatalogService, safeImageUrl } = require('../../src/catalog/catalog-service');
const { NotFoundError, ValidationError } = require('../../src/errors');

const album = {
  id: '1',
  title: 'Disco',
  coverUrl: 'https://coverartarchive.org/release-group/x/front-250',
  genre: 'Pop',
  type: 'album',
  releaseYear: 2024,
  averageRating: 4.3,
};
const songs = [
  { id: '10', title: 'Una', trackNumber: 1, durationSeconds: 200, averageRating: null },
  { id: '11', title: 'Dos', trackNumber: 2, durationSeconds: 100, averageRating: 5 },
];
const song = {
  id: '10',
  title: 'Una',
  trackNumber: 1,
  durationSeconds: 200,
  genre: 'Pop',
  averageRating: 4,
  albumId: '1',
  albumTitle: 'Disco',
  albumCoverUrl: 'javascript:alert(1)',
  albumType: 'album',
  albumReleaseYear: 2024,
};

function serviceWith(overrides = {}) {
  const catalog = {
    findAlbum: jest.fn().mockResolvedValue(album),
    findAlbumArtists: jest.fn().mockResolvedValue([{ id: '3', name: 'Artista' }]),
    findAlbumSongs: jest.fn().mockResolvedValue(songs),
    findSong: jest.fn().mockResolvedValue(song),
    findSongArtists: jest.fn().mockResolvedValue([{ id: '3', name: 'Artista' }]),
    findRatingDistribution: jest.fn().mockResolvedValue({ 1: 0, 2: 0, 3: 1, 4: 1, 5: 1 }),
    findArtist: jest.fn().mockResolvedValue({
      id: '3',
      name: 'Artista',
      imageUrl: 'http://inseguro.test/foto.jpg',
      imageCredit: 'Crédito que no debe salir sin foto',
      genre: 'Pop',
      description: 'Banda de pruebas',
    }),
    findArtistAlbums: jest.fn().mockResolvedValue([{ ...album, coverUrl: 'javascript:x' }]),
    countArtistSongs: jest.fn().mockResolvedValue(12),
    ...overrides.catalog,
  };
  const reviews = {
    findVisible: jest.fn().mockResolvedValue({
      total: 1,
      items: [{ id: '5', rating: 5, body: 'Muy bueno', username: 'ana', photoUrl: 'data:x' }],
    }),
    ...overrides.reviews,
  };
  return { service: createCatalogService({ catalog, reviews }), catalog, reviews };
}

test('test_getAlbum_withExistingId_returnsInfoRatingSongsAndReviews', async () => {
  const { service, reviews } = serviceWith();

  const result = await service.getAlbum('1', '7');

  expect(result).toMatchObject({
    title: 'Disco',
    averageRating: 4.3,
    ratingsCount: 3,
    distribution: { 3: 1, 4: 1, 5: 1 },
    artists: [{ name: 'Artista' }],
    totalDurationSeconds: 300,
    reviews: { total: 1, offset: 0, pageSize: 10 },
  });
  expect(result.songs).toHaveLength(2);
  expect(reviews.findVisible).toHaveBeenCalledWith({
    kind: 'album',
    itemId: '1',
    viewerId: '7',
    limit: 10,
    offset: 0,
  });
});

test('test_getAlbum_withoutRatings_returnsNullAverage', async () => {
  const { service } = serviceWith({
    catalog: {
      findRatingDistribution: jest.fn().mockResolvedValue({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }),
    },
  });

  const result = await service.getAlbum('1', null);

  expect(result.averageRating).toBeNull();
  expect(result.ratingsCount).toBe(0);
});

test('test_getAlbum_withUnknownId_throwsNotFound', async () => {
  const { service } = serviceWith({ catalog: { findAlbum: jest.fn().mockResolvedValue(null) } });
  await expect(service.getAlbum('999', null)).rejects.toBeInstanceOf(NotFoundError);
});

test.each(['0', '-1', 'abc', '1.5', "1' OR '1'='1", '1;DROP TABLE albums', '9'.repeat(19), ''])(
  'test_getAlbum_withInvalidId_%p_throwsValidationWithoutQuerying',
  async (id) => {
    const { service, catalog } = serviceWith();
    await expect(service.getAlbum(id, null)).rejects.toBeInstanceOf(ValidationError);
    expect(catalog.findAlbum).not.toHaveBeenCalled();
  },
);

test('test_getSong_withExistingId_returnsSongWithAlbumAndUnsafeCoverRemoved', async () => {
  const { service } = serviceWith();

  const result = await service.getSong('10', null);

  expect(result).toMatchObject({
    title: 'Una',
    album: { id: '1', title: 'Disco', coverUrl: null },
    artists: [{ name: 'Artista' }],
    reviews: { total: 1 },
  });
  expect(result.reviews.items[0].photoUrl).toBeNull();
});

test('test_getSong_withUnknownId_throwsNotFound', async () => {
  const { service } = serviceWith({ catalog: { findSong: jest.fn().mockResolvedValue(null) } });
  await expect(service.getSong('999', null)).rejects.toBeInstanceOf(NotFoundError);
});

test('test_getReviews_withOffset_returnsThatPage', async () => {
  const { service, reviews } = serviceWith();

  const page = await service.getReviews('song', '10', null, '20');

  expect(page.offset).toBe(20);
  expect(reviews.findVisible).toHaveBeenCalledWith(
    expect.objectContaining({ kind: 'song', offset: 20 }),
  );
});

test.each(['-1', 'x', '99999', '1e3', ['1', '2']])(
  'test_getReviews_withInvalidOffset_%p_throwsValidation',
  async (offset) => {
    const { service } = serviceWith();
    await expect(service.getReviews('album', '1', null, offset)).rejects.toBeInstanceOf(
      ValidationError,
    );
  },
);

test('test_getReviews_ofUnknownItem_throwsNotFound', async () => {
  const { service } = serviceWith({ catalog: { findAlbum: jest.fn().mockResolvedValue(null) } });
  await expect(service.getReviews('album', '5', null, undefined)).rejects.toBeInstanceOf(
    NotFoundError,
  );
});

test.each([
  ['https://coverartarchive.org/a.jpg', 'https://coverartarchive.org/a.jpg'],
  ['http://inseguro.test/a.jpg', null],
  ['javascript:alert(1)', null],
  ['data:image/png;base64,AAAA', null],
  ['no es una url', null],
  [null, null],
])('test_safeImageUrl_%p', (url, expected) => {
  expect(safeImageUrl(url)).toBe(expected);
});

test('test_PA_59_01_getArtist_returnsInfoAlbumsAndSafeImages', async () => {
  const { service } = serviceWith();

  const result = await service.getArtist('3');

  expect(result).toMatchObject({
    name: 'Artista',
    genre: 'Pop',
    description: 'Banda de pruebas',
    imageUrl: null,
    imageCredit: null,
    songsCount: 12,
    albums: [{ id: '1', title: 'Disco', coverUrl: null }],
  });
});

test('test_getArtist_withUnknownId_throwsNotFound', async () => {
  const { service } = serviceWith({ catalog: { findArtist: jest.fn().mockResolvedValue(null) } });
  await expect(service.getArtist('999')).rejects.toBeInstanceOf(NotFoundError);
});

test('test_getArtist_withInvalidId_throwsValidationWithoutQuerying', async () => {
  const { service, catalog } = serviceWith();
  await expect(service.getArtist("3' OR '1'='1")).rejects.toBeInstanceOf(ValidationError);
  expect(catalog.findArtist).not.toHaveBeenCalled();
});

test('test_getAlbumAndSong_includeViewerRating', async () => {
  const { service: base } = serviceWith();
  expect(await base.getAlbum('1', '7')).toMatchObject({
    myRating: null,
    myReview: null,
    defaultPrivacy: null,
  });

  const { createCatalogService: create } = require('../../src/catalog/catalog-service');
  const ratings = {
    findMine: jest.fn().mockResolvedValue({ rating: 4, body: 'Muy bueno', privacy: 'friends' }),
    findDefaultPrivacy: jest.fn().mockResolvedValue('private'),
  };
  const catalog = {
    findAlbum: jest.fn().mockResolvedValue(album),
    findAlbumArtists: jest.fn().mockResolvedValue([]),
    findAlbumSongs: jest.fn().mockResolvedValue([]),
    findSong: jest.fn().mockResolvedValue(song),
    findSongArtists: jest.fn().mockResolvedValue([]),
    findRatingDistribution: jest.fn().mockResolvedValue({ 1: 0, 2: 0, 3: 0, 4: 1, 5: 0 }),
  };
  const reviews = { findVisible: jest.fn().mockResolvedValue({ total: 0, items: [] }) };
  const service = create({ catalog, reviews, ratings });

  expect(await service.getAlbum('1', '7')).toMatchObject({
    myRating: 4,
    myReview: { body: 'Muy bueno', privacy: 'friends' },
    defaultPrivacy: 'private',
  });
  expect((await service.getSong('10', '7')).myRating).toBe(4);
  expect(ratings.findMine).toHaveBeenCalledWith('song', '10', '7');
});

test('test_getArtist_withSafePhoto_keepsCredit', async () => {
  const { service } = serviceWith({
    catalog: {
      findArtist: jest.fn().mockResolvedValue({
        id: '3',
        name: 'Artista',
        imageUrl: 'https://upload.wikimedia.org/a.jpg',
        imageCredit: 'Ana · CC BY',
      }),
    },
  });

  const result = await service.getArtist('3');

  expect(result).toMatchObject({
    imageUrl: 'https://upload.wikimedia.org/a.jpg',
    imageCredit: 'Ana · CC BY',
  });
});
