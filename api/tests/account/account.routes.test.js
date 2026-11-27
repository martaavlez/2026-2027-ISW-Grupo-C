const request = require('supertest');

const { createApp } = require('../../src/app');

function appWith(accountService, limit = 100) {
  return createApp({
    db: { pool: {} },
    services: { accountService, resolveViewer: jest.fn().mockResolvedValue('7') },
    readRateLimit: { windowMs: 60_000, limit: 100 },
    profileChangesLimit: { windowMs: 60_000, limit },
  });
}

test('test_patchProfile_usesViewerFromToken', async () => {
  const updateProfile = jest.fn().mockResolvedValue({ name: 'Lucía', bio: null });

  const response = await request(appWith({ updateProfile }))
    .patch('/me/profile')
    .set('Authorization', 'Bearer t')
    .send({ name: 'Lucía', userId: '1' });

  expect(response.status).toBe(200);
  expect(updateProfile).toHaveBeenCalledWith('7', { name: 'Lucía', userId: '1' });
});

test('test_putPhoto_passesTheRawImage', async () => {
  const updatePhoto = jest.fn().mockResolvedValue({ photoUrl: '/users/x/photo?v=1' });

  await request(appWith({ updatePhoto }))
    .put('/me/photo')
    .set('Authorization', 'Bearer t')
    .set('Content-Type', 'image/jpeg')
    .send(Buffer.from([0xff, 0xd8, 0xff, 1]));

  expect(updatePhoto).toHaveBeenCalledWith('7', Buffer.from([0xff, 0xd8, 0xff, 1]));
});

test('test_profileChanges_haveASpamLimit', async () => {
  const updateProfile = jest.fn().mockResolvedValue({});
  const app = appWith({ updateProfile }, 2);

  await request(app).patch('/me/profile').send({});
  await request(app).patch('/me/profile').send({});
  const response = await request(app).patch('/me/profile').send({});

  expect(response.status).toBe(429);
});
