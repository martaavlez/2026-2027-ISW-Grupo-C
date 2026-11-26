const request = require('supertest');

const { createApp } = require('../../src/app');
const { NotFoundError, ValidationError } = require('../../src/errors');

function appWith(catalogService, { resolveViewer, readRateLimit } = {}) {
  return createApp({
    db: { checkConnection: jest.fn() },
    services: { authService: {}, catalogService, resolveViewer },
    readRateLimit: readRateLimit ?? { windowMs: 60_000, limit: 100 },
  });
}

test('test_getAlbum_asVisitor_returns200AndPassesNullViewer', async () => {
  const getAlbum = jest.fn().mockResolvedValue({ id: '1', title: 'Disco' });

  const response = await request(appWith({ getAlbum })).get('/albums/1');

  expect(response.status).toBe(200);
  expect(response.body).toEqual({ id: '1', title: 'Disco' });
  expect(getAlbum).toHaveBeenCalledWith('1', null);
});

test('test_getAlbum_withSession_passesViewerFromToken', async () => {
  const getAlbum = jest.fn().mockResolvedValue({});
  const resolveViewer = jest.fn().mockResolvedValue('7');

  await request(appWith({ getAlbum }, { resolveViewer }))
    .get('/albums/1')
    .set('Authorization', 'Bearer abc');

  expect(resolveViewer).toHaveBeenCalledWith('Bearer abc');
  expect(getAlbum).toHaveBeenCalledWith('1', '7');
});

test('test_getSong_returns200', async () => {
  const getSong = jest.fn().mockResolvedValue({ id: '10' });
  const response = await request(appWith({ getSong })).get('/songs/10');
  expect(response.status).toBe(200);
  expect(getSong).toHaveBeenCalledWith('10', null);
});

test('test_getReviews_passesKindAndOffset', async () => {
  const getReviews = jest.fn().mockResolvedValue({ total: 0, items: [] });

  await request(appWith({ getReviews })).get('/albums/1/reviews?offset=10');
  await request(appWith({ getReviews })).get('/songs/2/reviews');

  expect(getReviews).toHaveBeenNthCalledWith(1, 'album', '1', null, '10');
  expect(getReviews).toHaveBeenNthCalledWith(2, 'song', '2', null, undefined);
});

test('test_getAlbum_withInvalidId_returns400', async () => {
  const getAlbum = jest.fn().mockRejectedValue(new ValidationError({ id: 'No válido' }));
  const response = await request(appWith({ getAlbum })).get('/albums/abc');
  expect(response.status).toBe(400);
  expect(response.body.errors).toEqual({ id: 'No válido' });
});

test('test_getAlbum_unknown_returns404', async () => {
  const getAlbum = jest.fn().mockRejectedValue(new NotFoundError('El álbum no existe'));
  const response = await request(appWith({ getAlbum })).get('/albums/999');
  expect(response.status).toBe(404);
  expect(response.body.error).toBe('El álbum no existe');
});

test('test_getAlbum_withUnexpectedError_returns500WithoutDetails', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  const getAlbum = jest.fn().mockRejectedValue(new Error('relation "albums" does not exist'));

  const response = await request(appWith({ getAlbum })).get('/albums/1');

  expect(response.status).toBe(500);
  expect(JSON.stringify(response.body)).not.toContain('relation');
  console.error.mockRestore();
});

test('test_getAlbum_overReadRateLimit_returns429', async () => {
  const getAlbum = jest.fn().mockResolvedValue({});
  const app = appWith({ getAlbum }, { readRateLimit: { windowMs: 60_000, limit: 2 } });

  await request(app).get('/albums/1');
  await request(app).get('/albums/1');
  const response = await request(app).get('/albums/1');

  expect(response.status).toBe(429);
});

test('test_getArtist_returns200', async () => {
  const getArtist = jest.fn().mockResolvedValue({ id: '3', name: 'Artista' });

  const response = await request(appWith({ getArtist })).get('/artists/3');

  expect(response.status).toBe(200);
  expect(getArtist).toHaveBeenCalledWith('3', null);
});

test('test_getArtist_overReadRateLimit_returns429', async () => {
  const getArtist = jest.fn().mockResolvedValue({});
  const app = appWith({ getArtist }, { readRateLimit: { windowMs: 60_000, limit: 1 } });

  await request(app).get('/artists/3');
  const response = await request(app).get('/artists/3');

  expect(response.status).toBe(429);
});
