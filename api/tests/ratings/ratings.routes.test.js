const request = require('supertest');

const { createApp } = require('../../src/app');
const { UnauthorizedError } = require('../../src/auth/auth-errors');
const { ValidationError } = require('../../src/errors');

function appWith(ratingService, resolveViewer) {
  return createApp({
    db: { checkConnection: jest.fn() },
    services: { authService: {}, catalogService: {}, ratingService, resolveViewer },
    readRateLimit: { windowMs: 60_000, limit: 100 },
  });
}

test('test_putAlbumRating_passesViewerFromTokenAndBody', async () => {
  const rate = jest.fn().mockResolvedValue({ myRating: 4 });
  const resolveViewer = jest.fn().mockResolvedValue('7');

  const response = await request(appWith({ rate }, resolveViewer))
    .put('/albums/1/rating')
    .set('Authorization', 'Bearer t')
    .send({ rating: 4, userId: '1' });

  expect(response.status).toBe(200);
  expect(rate).toHaveBeenCalledWith('album', '1', '7', { rating: 4, userId: '1' });
});

test('test_putSongRating_asVisitor_returns401', async () => {
  const rate = jest.fn().mockRejectedValue(new UnauthorizedError('Inicia sesión'));
  const response = await request(appWith({ rate })).put('/songs/2/rating').send({ rating: 4 });
  expect(response.status).toBe(401);
  expect(rate).toHaveBeenCalledWith('song', '2', null, { rating: 4 });
});

test('test_putRating_invalid_returns400', async () => {
  const rate = jest.fn().mockRejectedValue(new ValidationError({ rating: 'Mal' }));
  const response = await request(appWith({ rate })).put('/songs/2/rating').send({ rating: 9 });
  expect(response.status).toBe(400);
  expect(response.body.errors).toEqual({ rating: 'Mal' });
});
