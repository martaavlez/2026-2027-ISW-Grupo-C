const request = require('supertest');

const { createApp } = require('../../src/app');

function appWith(profileService) {
  return createApp({
    db: { checkConnection: jest.fn() },
    services: {
      authService: {},
      catalogService: {},
      profileService,
      resolveViewer: jest.fn().mockResolvedValue('7'),
    },
    readRateLimit: { windowMs: 60_000, limit: 100 },
  });
}

test('test_getMyProfile_usesViewerFromToken', async () => {
  const getOwnProfile = jest.fn().mockResolvedValue({ user: { id: '7' } });
  const app = appWith({ getOwnProfile });

  const response = await request(app).get('/me/profile').set('Authorization', 'Bearer t');

  expect(response.status).toBe(200);
  expect(getOwnProfile).toHaveBeenCalledWith('7');
});

test('test_getMyReviews_usesViewerAndOffset', async () => {
  const getOwnReviews = jest.fn().mockResolvedValue({ offset: 10, pageSize: 10, items: [] });

  const response = await request(appWith({ getOwnReviews }))
    .get('/me/reviews?offset=10&userId=1')
    .set('Authorization', 'Bearer t');

  expect(response.status).toBe(200);
  expect(getOwnReviews).toHaveBeenCalledWith('7', '10');
});
