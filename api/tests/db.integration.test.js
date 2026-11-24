const request = require('supertest');

const { createApp } = require('../src/app');

const hasDatabase = Boolean(process.env.DATABASE_URL);
const describeIfDatabase = hasDatabase ? describe : describe.skip;

describeIfDatabase('integración con PostgreSQL', () => {
  let db;

  beforeAll(() => {
    db = require('../src/db');
  });

  afterAll(async () => {
    await db.pool.end();
  });

  test('test_getHealthDb_withRealDatabase_returnsOk', async () => {
    const response = await request(createApp({ db })).get('/health/db');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ database: 'ok' });
  });
});
