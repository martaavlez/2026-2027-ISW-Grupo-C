const request = require('supertest');

const { createApp } = require('../../src/app');
const { ValidationError } = require('../../src/errors');

function appWith(searchService, { resolveViewer, limit = 100 } = {}) {
  return createApp({
    db: { checkConnection: jest.fn() },
    services: { authService: {}, catalogService: {}, searchService, resolveViewer },
    readRateLimit: { windowMs: 60_000, limit },
  });
}

test('test_search_passesTermAndViewer', async () => {
  const search = jest.fn().mockResolvedValue({ query: 'luz' });
  const resolveViewer = jest.fn().mockResolvedValue('7');

  const response = await request(appWith({ search }, { resolveViewer }))
    .get('/search?q=luz')
    .set('Authorization', 'Bearer t');

  expect(response.status).toBe(200);
  expect(search).toHaveBeenCalledWith('luz', '7');
});

test('test_search_withInvalidTerm_returns400', async () => {
  const search = jest.fn().mockRejectedValue(new ValidationError({ q: 'Muy corto' }));
  const response = await request(appWith({ search })).get('/search?q=a');
  expect(response.status).toBe(400);
  expect(response.body.errors).toEqual({ q: 'Muy corto' });
});

test('test_search_overReadRateLimit_returns429', async () => {
  const search = jest.fn().mockResolvedValue({});
  const app = appWith({ search }, { limit: 1 });

  await request(app).get('/search?q=luz');
  const response = await request(app).get('/search?q=luz');

  expect(response.status).toBe(429);
});
