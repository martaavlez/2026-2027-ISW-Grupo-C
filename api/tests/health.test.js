const request = require('supertest');

const { createApp } = require('../src/app');

function appWithDatabase(checkConnection) {
  return createApp({ db: { checkConnection } });
}

test('test_getHealth_whenApiIsRunning_returnsOk', async () => {
  const response = await request(appWithDatabase(jest.fn())).get('/health');

  expect(response.status).toBe(200);
  expect(response.body).toEqual({ status: 'ok' });
});

test('test_getHealthDb_whenDatabaseResponds_returnsOk', async () => {
  const response = await request(appWithDatabase(jest.fn().mockResolvedValue())).get('/health/db');

  expect(response.status).toBe(200);
  expect(response.body).toEqual({ database: 'ok' });
});

test('test_getHealthDb_whenDatabaseFails_returns503', async () => {
  const failingCheck = jest.fn().mockRejectedValue(new Error('connection refused'));
  const response = await request(appWithDatabase(failingCheck)).get('/health/db');

  expect(response.status).toBe(503);
  expect(response.body).toEqual({ database: 'unavailable' });
});

test('test_unknownRoute_whenRequested_returns404', async () => {
  const response = await request(appWithDatabase(jest.fn())).get('/does-not-exist');

  expect(response.status).toBe(404);
});
