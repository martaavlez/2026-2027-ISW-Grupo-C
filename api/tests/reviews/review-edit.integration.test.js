// Pruebas de aceptación de la HU-08 (editar una reseña) y la HU-47 (eliminarla)
// contra una base de datos PostgreSQL real.
const request = require('supertest');

const config = require('../../src/config');
const { createSessionToken } = require('../../src/auth/token');

const describeIfDatabase = process.env.DATABASE_URL ? describe : describe.skip;

describeIfDatabase('HU-08 y HU-47 · Editar y eliminar una reseña (integración)', () => {
  let db;
  let app;
  const ids = {};

  const tokenFor = (userId) =>
    `Bearer ${createSessionToken({ id: userId, username: 'x', role: 'user' }, { secret: config.jwtSecret, expiresIn: '1h' })}`;

  async function cleanUp() {
    await db.pool.query("DELETE FROM albums WHERE external_id LIKE 'test-hu08-%'");
    await db.pool.query("DELETE FROM users WHERE email LIKE '%@hu08.test'");
  }

  async function insertUser(username) {
    const { rows } = await db.pool.query(
      `INSERT INTO users (name, username, email, password_hash, privacy_accepted_at)
       VALUES ($1, $1, $2, 'x', now()) RETURNING id::text AS id`,
      [username, `${username}@hu08.test`],
    );
    return rows[0].id;
  }

  async function insertAlbum(suffix) {
    const { rows } = await db.pool.query(
      `INSERT INTO albums (title, type, external_id) VALUES ($1, 'album', $2) RETURNING id::text AS id`,
      [`Disco ${suffix}`, `test-hu08-${suffix}`],
    );
    return rows[0].id;
  }

  const as = (call, userId) => (userId ? call.set('Authorization', tokenFor(userId)) : call);
  const publish = (album, body, userId) =>
    as(request(app).put(`/albums/${album}/review`).send(body), userId);
  const edit = (album, body, userId) =>
    as(request(app).patch(`/albums/${album}/review`).send(body), userId);
  const remove = (album, userId) => as(request(app).delete(`/albums/${album}/review`), userId);
  const rate = (album, rating, userId) =>
    as(request(app).put(`/albums/${album}/rating`).send({ rating }), userId);

  // Solo las reseñas con texto: las valoraciones rápidas también salen en la lista.
  const bodies = (response) =>
    response.body.reviews.items.map((review) => review.body).filter((body) => body !== null);
  const reviewRows = async (album) =>
    (
      await db.pool.query(
        `SELECT author_id::text AS author, rating, body, privacy, updated_at IS NOT NULL AS edited
           FROM reviews WHERE album_id = $1 ORDER BY id`,
        [album],
      )
    ).rows;

  beforeAll(async () => {
    db = require('../../src/db');
    const { createApp } = require('../../src/app');
    app = createApp({
      db,
      readRateLimit: { windowMs: 60_000, limit: 10_000 },
      reviewPublishLimit: { windowMs: 60_000, limit: 10_000 },
    });
    await cleanUp();
    ids.author = await insertUser('hu08_autora');
    ids.other = await insertUser('hu08_otra');
  });

  afterAll(async () => {
    await cleanUp();
    await db.pool.end();
  });

  test('test_PA_08_01_edit_showsTheNewVersionAndRecalculatesAverage', async () => {
    const album = await insertAlbum('e1');
    await rate(album, 2, ids.other);
    await publish(album, { rating: 2, body: 'Flojo', privacy: 'public' }, ids.author);

    const response = await edit(
      album,
      { rating: 5, body: 'Lo he escuchado más y es un discazo', privacy: 'friends' },
      ids.author,
    );

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      myRating: 5,
      myReview: { body: 'Lo he escuchado más y es un discazo', privacy: 'friends' },
      averageRating: 3.5,
      ratingsCount: 2,
      review: { body: 'Lo he escuchado más y es un discazo', updatedAt: expect.any(String) },
    });
    expect(await reviewRows(album)).toContainEqual({
      author: ids.author,
      rating: 5,
      body: 'Lo he escuchado más y es un discazo',
      privacy: 'friends',
      edited: true,
    });
    // RN-08: la actividad pasa a tener la privacidad nueva.
    const activity = await db.pool.query(
      "SELECT privacy FROM activities WHERE user_id = $1 AND album_id = $2 AND type = 'review'",
      [ids.author, album],
    );
    expect(activity.rows).toEqual([{ privacy: 'friends' }]);
    // Ya solo la ven sus amigos: un visitante no.
    expect(bodies(await request(app).get(`/albums/${album}`))).toEqual([]);
  });

  test('test_edit_withoutPrivacy_keepsTheOneItHad', async () => {
    const album = await insertAlbum('e2');
    await publish(album, { rating: 3, body: 'Bien', privacy: 'private' }, ids.author);

    const response = await edit(album, { rating: 4, body: 'Muy bien' }, ids.author);

    expect(response.body.myReview).toEqual({ body: 'Muy bien', privacy: 'private' });
  });

  test('test_PA_08_02_cannotEditOrDeleteSomeoneElsesReview', async () => {
    const album = await insertAlbum('e3');
    await publish(album, { rating: 4, body: 'La mía', privacy: 'public' }, ids.author);

    const edited = await edit(album, { rating: 1, body: 'Cambiada' }, ids.other);
    const removed = await remove(album, ids.other);
    // Aunque intente decir de quién es la reseña, el autor sale del token.
    const disguised = await edit(album, { rating: 1, body: 'x', authorId: ids.author }, ids.other);

    expect([edited.status, removed.status, disguised.status]).toEqual([404, 404, 404]);
    expect(await reviewRows(album)).toEqual([
      { author: ids.author, rating: 4, body: 'La mía', privacy: 'public', edited: false },
    ]);
  });

  test('test_PA_47_01_remove_disappearsFromFichaAndProfile_andRecalculatesAverage', async () => {
    const album = await insertAlbum('d1');
    await rate(album, 2, ids.other);
    await publish(album, { rating: 5, body: 'Ya no lo pienso', privacy: 'public' }, ids.author);

    const response = await remove(album, ids.author);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      myRating: null,
      myReview: null,
      averageRating: 2,
      ratingsCount: 1,
      removedReviewId: expect.any(String),
    });
    expect(bodies(await request(app).get(`/albums/${album}`))).toEqual([]);
    const profile = await as(request(app).get('/me/profile'), ids.author);
    expect(profile.body.reviews.items.map((review) => review.body)).not.toContain(
      'Ya no lo pienso',
    );
    const activity = await db.pool.query(
      "SELECT 1 FROM activities WHERE user_id = $1 AND album_id = $2 AND type = 'review'",
      [ids.author, album],
    );
    expect(activity.rowCount).toBe(0);
  });

  test('test_remove_lastReview_leavesNoAverage', async () => {
    const album = await insertAlbum('d2');
    await publish(album, { rating: 4, body: 'Única', privacy: 'public' }, ids.author);

    const response = await remove(album, ids.author);

    expect(response.body).toMatchObject({ averageRating: null, ratingsCount: 0 });
  });

  test('test_onlyAQuickRating_isNotAReviewToEditOrDelete', async () => {
    const album = await insertAlbum('d3');
    await rate(album, 3, ids.author);

    expect((await edit(album, { rating: 4, body: 'x' }, ids.author)).status).toBe(404);
    expect((await remove(album, ids.author)).status).toBe(404);
    expect(await reviewRows(album)).toEqual([
      { author: ids.author, rating: 3, body: null, privacy: 'public', edited: false },
    ]);
  });

  test('test_visitorBadIdOrUnknownItem', async () => {
    const album = await insertAlbum('d4');
    expect((await edit(album, { rating: 4, body: 'x' })).status).toBe(401);
    expect((await remove(album)).status).toBe(401);
    expect((await remove('abc', ids.author)).status).toBe(400);
    expect((await remove('999999999', ids.author)).status).toBe(404);
  });

  test('test_security_editedTextIsStoredAsPlainText', async () => {
    const album = await insertAlbum('s1');
    await publish(album, { rating: 4, body: 'Antes', privacy: 'public' }, ids.author);
    const text = `<img src=x onerror=alert(1)>'); DELETE FROM reviews; --`;

    await edit(album, { rating: 4, body: text }, ids.author);

    expect(bodies(await request(app).get(`/albums/${album}`))).toEqual([text]);
  });
});
