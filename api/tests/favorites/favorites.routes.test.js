const request = require('supertest');

const { createApp } = require('../../src/app');

function appWith(favoriteService, resolveViewer = jest.fn().mockResolvedValue('7')) {
  return createApp({
    db: { checkConnection: jest.fn() },
    services: { authService: {}, catalogService: {}, favoriteService, resolveViewer },
    readRateLimit: { windowMs: 60_000, limit: 100 },
  });
}

test.each([
  ['put', '/songs/1/favorite', 'song', true],
  ['delete', '/songs/1/favorite', 'song', false],
  ['put', '/albums/1/favorite', 'album', true],
  ['delete', '/albums/1/favorite', 'album', false],
  ['put', '/artists/1/favorite', 'artist', true],
  ['delete', '/artists/1/favorite', 'artist', false],
])('test_%s_%s_callsServiceWithViewerFromToken', async (method, path, kind, favorite) => {
  const setFavorite = jest.fn().mockResolvedValue({ favorite });

  const response = await request(appWith({ setFavorite }))
    [method](path)
    .set('Authorization', 'Bearer t')
    .send({ userId: '1' });

  expect(response.status).toBe(200);
  expect(setFavorite).toHaveBeenCalledWith(kind, '1', '7', favorite);
});

test('test_getMyFavorites_usesViewer', async () => {
  const listMine = jest.fn().mockResolvedValue({ total: 0, items: [], offset: 24, pageSize: 24 });

  const response = await request(appWith({ listMine })).get(
    '/me/favorites?type=songs&offset=24&userId=1',
  );

  expect(response.status).toBe(200);
  expect(listMine).toHaveBeenCalledWith('7', 'songs', '24');
});
