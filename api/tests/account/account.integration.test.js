// Pruebas de aceptación de la HU-45 (editar mi perfil) contra una base de datos PostgreSQL real.
const request = require('supertest');

const config = require('../../src/config');
const { createSessionToken } = require('../../src/auth/token');

const describeIfDatabase = process.env.DATABASE_URL ? describe : describe.skip;

// PNG de 1 × 1 píxeles.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGD4DwABBAEAwS2OUAAAAABJRU5ErkJggg==',
  'base64',
);

describeIfDatabase('HU-45 · Editar mi perfil (integración)', () => {
  let db;
  let app;
  const ids = {};

  const tokenFor = (userId) =>
    `Bearer ${createSessionToken({ id: userId, username: 'x', role: 'user' }, { secret: config.jwtSecret, expiresIn: '1h' })}`;
  const as = (call, userId) => (userId ? call.set('Authorization', tokenFor(userId)) : call);
  const uploadPhoto = (body, type, userId) =>
    as(request(app).put('/me/photo').set('Content-Type', type).send(body), userId);

  async function cleanUp() {
    await db.pool.query("DELETE FROM users WHERE email LIKE '%@hu45.test'");
  }

  beforeAll(async () => {
    db = require('../../src/db');
    const { createApp } = require('../../src/app');
    app = createApp({
      db,
      readRateLimit: { windowMs: 60_000, limit: 10_000 },
      profileChangesLimit: { windowMs: 60_000, limit: 10_000 },
    });
    await cleanUp();
    const { rows } = await db.pool.query(
      `INSERT INTO users (name, username, email, password_hash, privacy_accepted_at)
       VALUES ('Ana', 'hu45_ana', 'ana@hu45.test', 'x', now()) RETURNING id::text AS id`,
    );
    ids.ana = rows[0].id;
  });

  afterAll(async () => {
    await cleanUp();
    await db.pool.end();
  });

  test('test_PA_45_01_nameAndBio_updateTheProfile', async () => {
    const response = await as(
      request(app).patch('/me/profile').send({ name: ' Ana Eco ', bio: 'Vinilos y\ncasetes.' }),
      ids.ana,
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ name: 'Ana Eco', bio: 'Vinilos y\ncasetes.' });
    const profile = await as(request(app).get('/me/profile'), ids.ana);
    expect(profile.body.user).toMatchObject({ name: 'Ana Eco', bio: 'Vinilos y\ncasetes.' });

    await as(request(app).patch('/me/profile').send({ name: 'Ana Eco', bio: '' }), ids.ana);
    expect((await as(request(app).get('/me/profile'), ids.ana)).body.user.bio).toBeNull();
  });

  test('test_PA_45_01_photo_isSavedServedAndShownInTheProfile', async () => {
    const response = await uploadPhoto(PNG, 'image/png', ids.ana);

    expect(response.status).toBe(200);
    expect(response.body.photoUrl).toMatch(/^\/users\/hu45_ana\/photo\?v=\d+$/);
    const profile = await as(request(app).get('/users/hu45_ana/profile'), ids.ana);
    expect(profile.body.user.photoUrl).toBe(response.body.photoUrl);

    const photo = await request(app).get('/users/HU45_ANA/photo');
    expect(photo.status).toBe(200);
    expect(photo.headers['content-type']).toBe('image/png');
    expect(photo.headers['x-content-type-options']).toBe('nosniff');
    expect(photo.headers['cross-origin-resource-policy']).toBe('cross-origin');
    expect(Buffer.compare(photo.body, PNG)).toBe(0);
  });

  test('test_removePhoto_leavesNoPhoto', async () => {
    await uploadPhoto(PNG, 'image/png', ids.ana);

    const response = await as(request(app).delete('/me/photo'), ids.ana);

    expect(response.body).toEqual({ photoUrl: null });
    expect((await request(app).get('/users/hu45_ana/photo')).status).toBe(404);
    expect((await as(request(app).get('/me/profile'), ids.ana)).body.user.photoUrl).toBeNull();
  });

  test('test_security_photo_onlyRealImagesUpTo1MB', async () => {
    // Un archivo que dice ser PNG pero no lo es.
    const fake = await uploadPhoto(
      Buffer.from('<script>alert(1)</script>xx'),
      'image/png',
      ids.ana,
    );
    // Un tipo que no se acepta.
    const svg = await uploadPhoto('<svg onload="alert(1)"/>', 'image/svg+xml', ids.ana);
    const big = await uploadPhoto(
      Buffer.concat([PNG, Buffer.alloc(1024 * 1024 + 10)]),
      'image/png',
      ids.ana,
    );

    expect(fake.status).toBe(400);
    expect(svg.status).toBe(400);
    expect(big.status).toBe(400);
    expect(big.body.errors.photo).toBe('La foto puede ocupar como máximo 1 MB.');
  });

  test('test_security_visitorAndBadData', async () => {
    expect((await request(app).patch('/me/profile').send({ name: 'x' })).status).toBe(401);
    expect((await uploadPhoto(PNG, 'image/png')).status).toBe(401);
    const empty = await as(request(app).patch('/me/profile').send({ name: '  ' }), ids.ana);
    expect(empty.status).toBe(400);
    expect((await request(app).get('/users/..%2F..%2Fetc/photo')).status).toBe(404);
  });
});
