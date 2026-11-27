const request = require('supertest');

const { createApp } = require('../../src/app');

function appWith(followService, limit = 100) {
  return createApp({
    db: { pool: {} },
    services: { followService, resolveViewer: jest.fn().mockResolvedValue('7') },
    readRateLimit: { windowMs: 60_000, limit: 100 },
    followChangesLimit: { windowMs: 60_000, limit },
  });
}

const service = () => ({
  follow: jest.fn().mockResolvedValue({ following: true, followers: 1 }),
  unfollow: jest.fn().mockResolvedValue({ following: false, followers: 0 }),
  listFollowing: jest.fn().mockResolvedValue({ total: 0, items: [] }),
});

test('test_routes_passViewerFromToken', async () => {
  const follows = service();
  const app = appWith(follows);
  const auth = (call) => call.set('Authorization', 'Bearer t');
  expect((await auth(request(app).put('/users/bea/follow'))).body).toEqual({
    following: true,
    followers: 1,
  });
  await auth(request(app).delete('/users/bea/follow'));
  await auth(request(app).get('/me/following?offset=24'));
  expect(follows.follow).toHaveBeenCalledWith('7', 'bea');
  expect(follows.unfollow).toHaveBeenCalledWith('7', 'bea');
  expect(follows.listFollowing).toHaveBeenCalledWith('7', '24');
});

test('test_RNF_12_tooManyChanges_areLimited', async () => {
  const app = appWith(service(), 2);
  await request(app).put('/users/bea/follow');
  await request(app).delete('/users/bea/follow');
  const blocked = await request(app).put('/users/bea/follow');
  expect(blocked.status).toBe(429);
  expect((await request(app).get('/me/following')).status).toBe(200);
});
