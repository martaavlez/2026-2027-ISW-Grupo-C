const request = require('supertest');

const { createApp } = require('../../src/app');
const { UnauthorizedError } = require('../../src/auth/auth-errors');

function appWith(reviewService, { resolveViewer, reviewPublishLimit } = {}) {
  return createApp({
    db: { checkConnection: jest.fn() },
    services: { authService: {}, catalogService: {}, reviewService, resolveViewer },
    readRateLimit: { windowMs: 60_000, limit: 100 },
    reviewPublishLimit: reviewPublishLimit ?? { windowMs: 60_000, limit: 100 },
  });
}

test('test_putAlbumReview_returns201WithViewerFromToken', async () => {
  const publish = jest.fn().mockResolvedValue({ myRating: 4 });
  const resolveViewer = jest.fn().mockResolvedValue('7');

  const response = await request(appWith({ publish }, { resolveViewer }))
    .put('/albums/1/review')
    .set('Authorization', 'Bearer t')
    .send({ rating: 4, body: 'Bien' });

  expect(response.status).toBe(201);
  expect(publish).toHaveBeenCalledWith('album', '1', '7', { rating: 4, body: 'Bien' });
});

test('test_putSongReview_asVisitor_returns401', async () => {
  const publish = jest.fn().mockRejectedValue(new UnauthorizedError('Inicia sesión'));
  const response = await request(appWith({ publish })).put('/songs/2/review').send({});
  expect(response.status).toBe(401);
});

test('test_putReview_spam_isLimited', async () => {
  const publish = jest.fn().mockResolvedValue({});
  const app = appWith({ publish }, { reviewPublishLimit: { windowMs: 60_000, limit: 2 } });

  await request(app).put('/songs/2/review').send({});
  await request(app).put('/albums/3/review').send({});
  const response = await request(app).put('/songs/4/review').send({});

  expect(response.status).toBe(429);
  expect(publish).toHaveBeenCalledTimes(2);
});

test('test_patchReview_editsWithViewerFromToken', async () => {
  const edit = jest.fn().mockResolvedValue({ myRating: 3 });
  const resolveViewer = jest.fn().mockResolvedValue('7');

  const response = await request(appWith({ edit }, { resolveViewer }))
    .patch('/songs/2/review')
    .set('Authorization', 'Bearer t')
    .send({ rating: 3, body: 'Mejor', authorId: '1' });

  expect(response.status).toBe(200);
  expect(edit).toHaveBeenCalledWith('song', '2', '7', {
    rating: 3,
    body: 'Mejor',
    authorId: '1',
  });
});

test('test_deleteReview_removesWithViewerFromToken', async () => {
  const remove = jest.fn().mockResolvedValue({ myReview: null });
  const resolveViewer = jest.fn().mockResolvedValue('7');

  const response = await request(appWith({ remove }, { resolveViewer }))
    .delete('/albums/5/review')
    .set('Authorization', 'Bearer t');

  expect(response.status).toBe(200);
  expect(remove).toHaveBeenCalledWith('album', '5', '7');
});

test('test_editAndDelete_shareTheSpamLimit', async () => {
  const service = {
    edit: jest.fn().mockResolvedValue({}),
    remove: jest.fn().mockResolvedValue({}),
  };
  const app = appWith(service, { reviewPublishLimit: { windowMs: 60_000, limit: 2 } });

  await request(app).patch('/songs/2/review').send({});
  await request(app).delete('/songs/2/review');
  const response = await request(app).patch('/songs/2/review').send({});

  expect(response.status).toBe(429);
});
