// Pruebas de aceptación de la HU-23 contra una base de datos PostgreSQL real.
const request = require('supertest');

const config = require('../../src/config');
const { createSessionToken } = require('../../src/auth/token');

const describeIfDatabase = process.env.DATABASE_URL ? describe : describe.skip;

describeIfDatabase('HU-23 · Escribir una reseña (integración)', () => {
  let db;
  let app;
  const ids = {};

  const tokenFor = (userId) =>
    `Bearer ${createSessionToken({ id: userId, username: 'x', role: 'user' }, { secret: config.jwtSecret, expiresIn: '1h' })}`;

  async function cleanUp() {
    await db.pool.query("DELETE FROM albums WHERE external_id LIKE 'test-hu23-%'");
    await db.pool.query("DELETE FROM users WHERE email LIKE '%@hu23.test'");
  }

  async function insertUser(username, defaultPrivacy) {
    const { rows } = await db.pool.query(
      `INSERT INTO users (name, username, email, password_hash, privacy_accepted_at)
       VALUES ($1, $1, $2, 'x', now()) RETURNING id::text AS id`,
      [username, `${username}@hu23.test`],
    );
    if (defaultPrivacy) {
      await db.pool.query(
        'INSERT INTO privacy_settings (user_id, default_content_privacy) VALUES ($1, $2)',
        [rows[0].id, defaultPrivacy],
      );
    }
    return rows[0].id;
  }

  async function insertAlbum(suffix) {
    const { rows } = await db.pool.query(
      `INSERT INTO albums (title, type, external_id) VALUES ($1, 'album', $2) RETURNING id::text AS id`,
      [`Disco ${suffix}`, `test-hu23-${suffix}`],
    );
    return rows[0].id;
  }

  const publish = (kind, id, body, userId) => {
    const call = request(app).put(`/${kind}/${id}/review`).send(body);
    return userId ? call.set('Authorization', tokenFor(userId)) : call;
  };

  const bodies = (response) => response.body.reviews.items.map((review) => review.body);

  beforeAll(async () => {
    db = require('../../src/db');
    const { createApp } = require('../../src/app');
    app = createApp({
      db,
      readRateLimit: { windowMs: 60_000, limit: 10_000 },
      reviewPublishLimit: { windowMs: 60_000, limit: 10_000 },
    });
    await cleanUp();
    ids.author = await insertUser('hu23_autora', 'friends');
    ids.friend = await insertUser('hu23_amiga');
    ids.follower = await insertUser('hu23_seguidora');
    await db.pool.query(
      `INSERT INTO friendships (requester_id, recipient_id, status, responded_at)
       VALUES ($1, $2, 'accepted', now())`,
      [ids.friend, ids.author],
    );
    await db.pool.query('INSERT INTO follows (follower_id, followed_id) VALUES ($1, $2)', [
      ids.follower,
      ids.author,
    ]);
    const song = await db.pool.query(
      `INSERT INTO songs (title, album_id, duration_seconds, external_id)
       VALUES ('Canción HU23', $1, 200, 'test-hu23-song') RETURNING id::text AS id`,
      [await insertAlbum('base')],
    );
    ids.song = song.rows[0].id;
  });

  afterAll(async () => {
    await cleanUp();
    await db.pool.end();
  });

  test('test_PA_23_01_publish_appearsInFichaWithChosenPrivacyAndRecalculatesAverage', async () => {
    const album = await insertAlbum('p1');
    await request(app)
      .put(`/albums/${album}/rating`)
      .set('Authorization', tokenFor(ids.friend))
      .send({ rating: 2 });

    const response = await publish(
      'albums',
      album,
      { rating: 5, body: 'Un discazo', privacy: 'public' },
      ids.author,
    );

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      myRating: 5,
      myReview: { body: 'Un discazo', privacy: 'public' },
      averageRating: 3.5,
      ratingsCount: 2,
      review: { body: 'Un discazo', username: 'hu23_autora' },
    });
    const visitor = await request(app).get(`/albums/${album}`);
    expect(bodies(visitor)).toContain('Un discazo');
    const activity = await db.pool.query(
      "SELECT privacy FROM activities WHERE user_id = $1 AND album_id = $2 AND type = 'review'",
      [ids.author, album],
    );
    expect(activity.rows).toEqual([{ privacy: 'public' }]);
  });

  test('test_PA_23_02_withoutPrivacy_usesDefault', async () => {
    const album = await insertAlbum('p2');

    const response = await publish('albums', album, { rating: 4, body: 'Me gusta' }, ids.author);

    expect(response.body.myReview.privacy).toBe('friends');
  });

  test('test_PA_23_03_friendsOnly_isNotVisibleToFollowerButToFriend', async () => {
    const album = await insertAlbum('p3');
    await publish(
      'albums',
      album,
      { rating: 3, body: 'Solo para amigos', privacy: 'friends' },
      ids.author,
    );

    const follower = await request(app)
      .get(`/albums/${album}`)
      .set('Authorization', tokenFor(ids.follower));
    const friend = await request(app)
      .get(`/albums/${album}`)
      .set('Authorization', tokenFor(ids.friend));

    expect(bodies(follower)).not.toContain('Solo para amigos');
    expect(bodies(friend)).toContain('Solo para amigos');
  });

  test('test_PA_23_04_withoutRating_isRejectedAndNothingIsSaved', async () => {
    const album = await insertAlbum('p4');

    const response = await publish('albums', album, { body: 'Sin nota' }, ids.author);

    expect(response.status).toBe(400);
    expect(response.body.errors.rating).toBe(
      'Selecciona una puntuación del 1 al 5 para publicar la reseña.',
    );
    const saved = await db.pool.query('SELECT 1 FROM reviews WHERE album_id = $1', [album]);
    expect(saved.rowCount).toBe(0);
  });

  test('test_RN_05_afterQuickRating_completesTheSameReview', async () => {
    await request(app)
      .put(`/songs/${ids.song}/rating`)
      .set('Authorization', tokenFor(ids.author))
      .send({ rating: 2 });

    const response = await publish(
      'songs',
      ids.song,
      { rating: 4, body: 'Ahora con texto', privacy: 'private' },
      ids.author,
    );

    expect(response.status).toBe(201);
    const rows = await db.pool.query(
      'SELECT rating, body, privacy FROM reviews WHERE song_id = $1 AND author_id = $2',
      [ids.song, ids.author],
    );
    expect(rows.rows).toEqual([{ rating: 4, body: 'Ahora con texto', privacy: 'private' }]);
  });

  test('test_publishTwice_returns409AndKeepsTheFirst', async () => {
    const album = await insertAlbum('p6');
    await publish('albums', album, { rating: 4, body: 'Primera' }, ids.author);

    const second = await publish('albums', album, { rating: 1, body: 'Segunda' }, ids.author);

    expect(second.status).toBe(409);
    const rows = await db.pool.query('SELECT body, rating FROM reviews WHERE album_id = $1', [
      album,
    ]);
    expect(rows.rows).toEqual([{ body: 'Primera', rating: 4 }]);
  });

  test('test_visitor_cannotPublish', async () => {
    const response = await publish('songs', ids.song, { rating: 4, body: 'x' });
    expect(response.status).toBe(401);
  });

  test('test_security_htmlAndSqlAreStoredAsPlainText', async () => {
    const album = await insertAlbum('p8');
    const text = `<script>alert(1)</script>'); DELETE FROM reviews; --`;

    await publish('albums', album, { rating: 4, body: text, privacy: 'public' }, ids.author);

    const visitor = await request(app).get(`/albums/${album}`);
    expect(bodies(visitor)).toEqual([text]);
  });

  test('test_security_cannotPublishAsSomeoneElse', async () => {
    const album = await insertAlbum('p9');

    await publish('albums', album, { rating: 4, body: 'Mía', author_id: ids.friend }, ids.follower);

    const rows = await db.pool.query(
      'SELECT author_id::text AS author FROM reviews WHERE album_id = $1',
      [album],
    );
    expect(rows.rows).toEqual([{ author: ids.follower }]);
  });
});
