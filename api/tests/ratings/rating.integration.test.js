// Pruebas de aceptación de la HU-05 contra una base de datos PostgreSQL real.
const request = require('supertest');

const config = require('../../src/config');
const { createSessionToken } = require('../../src/auth/token');

const describeIfDatabase = process.env.DATABASE_URL ? describe : describe.skip;

describeIfDatabase('HU-05 · Valorar una canción o un álbum (integración)', () => {
  let db;
  let app;
  const ids = {};

  const tokenFor = (userId) =>
    `Bearer ${createSessionToken({ id: userId, username: 'x', role: 'user' }, { secret: config.jwtSecret, expiresIn: '1h' })}`;

  async function cleanUp() {
    await db.pool.query("DELETE FROM albums WHERE external_id LIKE 'test-hu05-%'");
    await db.pool.query("DELETE FROM users WHERE email LIKE '%@hu05.test'");
  }

  async function insertUser(username, defaultPrivacy) {
    const { rows } = await db.pool.query(
      `INSERT INTO users (name, username, email, password_hash, privacy_accepted_at)
       VALUES ($1, $1, $2, 'x', now()) RETURNING id::text AS id`,
      [username, `${username}@hu05.test`],
    );
    if (defaultPrivacy) {
      await db.pool.query(
        'INSERT INTO privacy_settings (user_id, default_content_privacy) VALUES ($1, $2)',
        [rows[0].id, defaultPrivacy],
      );
    }
    return rows[0].id;
  }

  const rate = (kind, id, rating, userId) => {
    const call = request(app).put(`/${kind}/${id}/rating`).send({ rating });
    return userId ? call.set('Authorization', tokenFor(userId)) : call;
  };

  const reviewOf = async (userId, column, id) =>
    (
      await db.pool.query(
        `SELECT rating, privacy, body FROM reviews WHERE author_id = $1 AND ${column} = $2`,
        [userId, id],
      )
    ).rows;

  beforeAll(async () => {
    db = require('../../src/db');
    const { createApp } = require('../../src/app');
    app = createApp({ db, readRateLimit: { windowMs: 60_000, limit: 10_000 } });
    await cleanUp();
    ids.ana = await insertUser('hu05_ana', 'friends');
    ids.bea = await insertUser('hu05_bea');
    const album = await db.pool.query(
      `INSERT INTO albums (title, type, external_id) VALUES ('Disco HU05', 'album', 'test-hu05-album')
       RETURNING id::text AS id`,
    );
    ids.album = album.rows[0].id;
    const song = await db.pool.query(
      `INSERT INTO songs (title, album_id, duration_seconds, external_id)
       VALUES ('Canción HU05', $1, 200, 'test-hu05-song') RETURNING id::text AS id`,
      [ids.album],
    );
    ids.song = song.rows[0].id;
  });

  afterAll(async () => {
    await cleanUp();
    await db.pool.end();
  });

  test('test_PA_05_01_rateSong_savesWithDefaultPrivacyAndRecalculatesAverage', async () => {
    const response = await rate('songs', ids.song, 4, ids.ana);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      myRating: 4,
      averageRating: 4,
      ratingsCount: 1,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 0 },
    });
    expect(await reviewOf(ids.ana, 'song_id', ids.song)).toEqual([
      { rating: 4, privacy: 'friends', body: null },
    ]);

    const second = await rate('songs', ids.song, 5, ids.bea);
    expect(second.body).toMatchObject({ averageRating: 4.5, ratingsCount: 2 });
    expect((await reviewOf(ids.bea, 'song_id', ids.song))[0].privacy).toBe('public');
  });

  test('test_PA_05_02_rateAgain_replacesPreviousRatingAndKeepsText', async () => {
    await rate('albums', ids.album, 2, ids.ana);
    await db.pool.query(
      "UPDATE reviews SET body = 'Mi reseña', privacy = 'private' WHERE author_id = $1 AND album_id = $2",
      [ids.ana, ids.album],
    );

    const response = await rate('albums', ids.album, 5, ids.ana);

    expect(response.body).toMatchObject({ myRating: 5, averageRating: 5, ratingsCount: 1 });
    expect(await reviewOf(ids.ana, 'album_id', ids.album)).toEqual([
      { rating: 5, privacy: 'private', body: 'Mi reseña' },
    ]);
  });

  test('test_PA_05_03_outOfRange_isRejectedWithMessage', async () => {
    for (const rating of [0, 6, 2.5, '3']) {
      const response = await rate('albums', ids.album, rating, ids.bea);
      expect(response.status).toBe(400);
      expect(response.body.errors.rating).toBe(
        'La valoración debe ser un número entero del 1 al 5.',
      );
    }
    expect(await reviewOf(ids.bea, 'album_id', ids.album)).toEqual([]);
  });

  test('test_PA_05_04_visitor_isAskedToLogIn', async () => {
    const response = await rate('songs', ids.song, 3);

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Para valorar, inicia sesión o crea una cuenta.');
  });

  test('test_ficha_showsMyRatingOnlyToMe', async () => {
    const mine = await request(app)
      .get(`/songs/${ids.song}`)
      .set('Authorization', tokenFor(ids.ana));
    const visitor = await request(app).get(`/songs/${ids.song}`);

    expect(mine.body.myRating).toBe(4);
    expect(visitor.body.myRating).toBeNull();
  });

  test('test_unknownItem_returns404AndCreatesNothing', async () => {
    const response = await rate('songs', '999999999', 3, ids.ana);
    expect(response.status).toBe(404);
  });

  test('test_security_cannotRateAsSomeoneElse', async () => {
    await request(app)
      .put(`/albums/${ids.album}/rating`)
      .set('Authorization', tokenFor(ids.bea))
      .send({ rating: 1, userId: ids.ana, author_id: ids.ana });

    expect((await reviewOf(ids.ana, 'album_id', ids.album))[0].rating).toBe(5);
    expect((await reviewOf(ids.bea, 'album_id', ids.album))[0].rating).toBe(1);
  });

  test('test_concurrentRatings_keepTheAverageConsistent', async () => {
    const users = await Promise.all([1, 2, 3, 4, 5].map((n) => insertUser(`hu05_conc_${n}`)));
    await Promise.all(users.map((userId, index) => rate('songs', ids.song, index + 1, userId)));

    const { rows } = await db.pool.query(
      `SELECT s.average_rating::float AS stored,
              (SELECT round(avg(rating), 1)::float FROM reviews WHERE song_id = s.id) AS real
         FROM songs s WHERE s.id = $1`,
      [ids.song],
    );
    expect(rows[0].stored).toBe(rows[0].real);
  });
});
