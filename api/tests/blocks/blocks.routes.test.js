const request = require('supertest');

const { createApp } = require('../../src/app');

function appWith(blockService, limit = 100) {
  return createApp({
    db: { pool: {} },
    services: { blockService, resolveViewer: jest.fn().mockResolvedValue('7') },
    readRateLimit: { windowMs: 60_000, limit: 100 },
    blockChangesLimit: { windowMs: 60_000, limit },
  });
}

const service = () => ({
  block: jest.fn().mockResolvedValue({ blocked: true }),
  unblock: jest.fn().mockResolvedValue({ blocked: false }),
  listBlocked: jest.fn().mockResolvedValue({ total: 0, items: [] }),
});

test('test_routes_passViewerFromToken', async () => {
  const blocks = service();
  const app = appWith(blocks);
  const auth = (call) => call.set('Authorization', 'Bearer t');
  expect((await auth(request(app).put('/users/bea/block'))).body).toEqual({ blocked: true });
  await auth(request(app).delete('/users/bea/block'));
  await auth(request(app).get('/me/blocks?offset=24'));
  expect(blocks.block).toHaveBeenCalledWith('7', 'bea');
  expect(blocks.unblock).toHaveBeenCalledWith('7', 'bea');
  expect(blocks.listBlocked).toHaveBeenCalledWith('7', '24');
});

test('test_RNF_12_tooManyChanges_areLimited', async () => {
  const app = appWith(service(), 1);
  await request(app).put('/users/bea/block');
  expect((await request(app).delete('/users/bea/block')).status).toBe(429);
  expect((await request(app).get('/me/blocks')).status).toBe(200);
});
