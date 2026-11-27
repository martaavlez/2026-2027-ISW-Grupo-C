const request = require('supertest');

const { createApp } = require('../../src/app');

function appWith(boardService, { limit = 100 } = {}) {
  return createApp({
    db: { pool: {} },
    services: { boardService, resolveViewer: jest.fn().mockResolvedValue('7') },
    readRateLimit: { windowMs: 60_000, limit: 100 },
    boardChangesLimit: { windowMs: 60_000, limit },
  });
}

const fullService = () => ({
  create: jest.fn().mockResolvedValue({ id: '1' }),
  get: jest.fn().mockResolvedValue({ id: '1' }),
  update: jest.fn().mockResolvedValue({ id: '1' }),
  remove: jest.fn().mockResolvedValue({ deleted: true }),
  addItem: jest.fn().mockResolvedValue({ id: '2' }),
  removeItem: jest.fn().mockResolvedValue({ deleted: true }),
  listMineFor: jest.fn().mockResolvedValue({ items: [] }),
});

test('test_routes_passViewerFromToken_bodyAndParams', async () => {
  const service = fullService();
  const app = appWith(service);
  const auth = (call) => call.set('Authorization', 'Bearer t');

  expect(
    (await auth(request(app).post('/boards').send({ name: 'Noche', ownerId: '1' }))).status,
  ).toBe(201);
  await auth(request(app).get('/boards/4'));
  await auth(request(app).patch('/boards/4').send({ privacy: 'private' }));
  await auth(request(app).delete('/boards/4'));
  expect(
    (await auth(request(app).post('/boards/4/items').send({ kind: 'song', id: '3' }))).status,
  ).toBe(201);
  await auth(request(app).delete('/boards/4/items/8'));
  await auth(request(app).get('/me/boards?kind=album&id=3'));

  expect(service.create).toHaveBeenCalledWith('7', { name: 'Noche', ownerId: '1' });
  expect(service.get).toHaveBeenCalledWith('7', '4');
  expect(service.update).toHaveBeenCalledWith('7', '4', { privacy: 'private' });
  expect(service.remove).toHaveBeenCalledWith('7', '4');
  expect(service.addItem).toHaveBeenCalledWith('7', '4', { kind: 'song', id: '3' });
  expect(service.removeItem).toHaveBeenCalledWith('7', '4', '8');
  expect(service.listMineFor).toHaveBeenCalledWith('7', { kind: 'album', id: '3' });
});

test('test_RNF_12_tooManyChanges_areLimited_readsAreNot', async () => {
  const service = fullService();
  const app = appWith(service, { limit: 2 });
  for (let i = 0; i < 2; i += 1) await request(app).post('/boards').send({ name: 'x' });
  const blocked = await request(app).post('/boards').send({ name: 'x' });
  expect(blocked.status).toBe(429);
  expect(blocked.body).toEqual({
    error: 'Has hecho muchos cambios seguidos. Espera unos minutos.',
  });
  expect((await request(app).get('/boards/4')).status).toBe(200);
});

test('test_unexpectedError_doesNotLeakDetails', async () => {
  const service = {
    ...fullService(),
    get: jest.fn().mockRejectedValue(new Error('relation "boards" does not exist')),
  };
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
  const response = await request(appWith(service)).get('/boards/4');
  spy.mockRestore();
  expect(response.status).toBe(500);
  expect(JSON.stringify(response.body)).not.toContain('relation');
});
