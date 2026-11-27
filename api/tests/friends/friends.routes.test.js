const request = require('supertest');

const { createApp } = require('../../src/app');

function appWith(friendService, { limit = 100 } = {}) {
  return createApp({
    db: { pool: {} },
    services: { friendService, resolveViewer: jest.fn().mockResolvedValue('7') },
    readRateLimit: { windowMs: 60_000, limit: 100 },
    friendChangesLimit: { windowMs: 60_000, limit },
  });
}

test('test_routes_passViewerFromToken_andParams', async () => {
  const service = {
    sendRequest: jest.fn().mockResolvedValue({ friendship: 'sent' }),
    cancelRequest: jest.fn().mockResolvedValue({ friendship: 'none' }),
    removeFriend: jest.fn().mockResolvedValue({ friendship: 'none' }),
    respond: jest.fn().mockResolvedValue({ friendship: 'friends' }),
    listReceived: jest.fn().mockResolvedValue({ items: [] }),
    listFriends: jest.fn().mockResolvedValue({ items: [] }),
  };
  const app = appWith(service);
  const auth = (call) => call.set('Authorization', 'Bearer t');

  await auth(request(app).put('/users/nora.eco/friend-request').send({ requesterId: '1' }));
  await auth(request(app).delete('/users/nora.eco/friend-request'));
  await auth(request(app).delete('/users/nora.eco/friendship'));
  await auth(request(app).post('/me/friend-requests/3/accept'));
  await auth(request(app).post('/me/friend-requests/4/reject'));
  await auth(request(app).get('/me/friend-requests'));
  await auth(request(app).get('/me/friends?offset=24'));

  expect(service.sendRequest).toHaveBeenCalledWith('7', 'nora.eco');
  expect(service.cancelRequest).toHaveBeenCalledWith('7', 'nora.eco');
  expect(service.removeFriend).toHaveBeenCalledWith('7', 'nora.eco');
  expect(service.respond.mock.calls).toEqual([
    ['7', '3', true],
    ['7', '4', false],
  ]);
  expect(service.listReceived).toHaveBeenCalledWith('7');
  expect(service.listFriends).toHaveBeenCalledWith('7', '24');
});

test('test_friendChanges_haveASpamLimit', async () => {
  const service = { sendRequest: jest.fn().mockResolvedValue({}) };
  const app = appWith(service, { limit: 2 });

  await request(app).put('/users/a.b.c/friend-request');
  await request(app).put('/users/a.b.c/friend-request');
  const response = await request(app).put('/users/a.b.c/friend-request');

  expect(response.status).toBe(429);
});
