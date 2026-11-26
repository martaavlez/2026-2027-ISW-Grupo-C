// Pruebas de aceptación de la HU-04 contra una base de datos PostgreSQL real.
const request = require('supertest');

const config = require('../../src/config');
const { createSessionToken } = require('../../src/auth/token');

const hasDatabase = Boolean(process.env.DATABASE_URL);
const describeIfDatabase = hasDatabase ? describe : describe.skip;

describeIfDatabase('HU-04 · Consultar una canción o un álbum (integración)', () => {
  let db;
  let app;
  const ids = {};

  const tokenFor = (userId) =>
    `Bearer ${createSessionToken({ id: userId, username: 'x', role: 'user' }, { secret: config.jwtSecret, expiresIn: '1h' })}`;

  async function cleanUp() {
    await db.pool.query("DELETE FROM albums WHERE external_id LIKE 'test-hu04-%'");
    await db.pool.query("DELETE FROM artists WHERE external_id LIKE 'test-hu04-%'");
    await db.pool.query("DELETE FROM users WHERE email LIKE '%@hu04.test'");
  }

  async function insertUser(username, status = 'active') {
    const { rows } = await db.pool.query(
      `INSERT INTO users (name, username, email, password_hash, status, suspension_reason, privacy_accepted_at)
       VALUES ($1, $1, $2, 'x', $3, $4, now()) RETURNING id::text AS id`,
      [username, `${username}@hu04.test`, status, status === 'suspended' ? 'Pruebas' : null],
    );
    return rows[0].id;
  }

  async function insertReview(
    authorId,
    rating,
    privacy,
    { body = null, status = 'visible', song = false } = {},
  ) {
    await db.pool.query(
      `INSERT INTO reviews (author_id, album_id, song_id, rating, body, privacy, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [authorId, song ? null : ids.album, song ? ids.song : null, rating, body, privacy, status],
    );
  }

  beforeAll(async () => {
    db = require('../../src/db');
    const { createApp } = require('../../src/app');
    app = createApp({ db, readRateLimit: { windowMs: 60_000, limit: 10_000 } });
    await cleanUp();

    ids.author = await insertUser('hu04_autora');
    ids.friend = await insertUser('hu04_amiga');
    ids.stranger = await insertUser('hu04_desconocida');
    ids.blocked = await insertUser('hu04_bloqueada');
    ids.suspended = await insertUser('hu04_suspendida', 'suspended');

    await db.pool.query(
      `INSERT INTO friendships (requester_id, recipient_id, status, responded_at)
       VALUES ($1, $2, 'accepted', now())`,
      [ids.friend, ids.author],
    );
    await db.pool.query('INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1, $2)', [
      ids.author,
      ids.blocked,
    ]);

    const artist = await db.pool.query(
      `INSERT INTO artists (name, genre, description, image_url, external_id)
       VALUES ('Artista HU04', 'Pop', 'Grupo de pruebas', 'javascript:alert(1)', 'test-hu04-artist')
       RETURNING id`,
    );
    ids.artist = String(artist.rows[0].id);
    const album = await db.pool.query(
      `INSERT INTO albums (title, genre, type, release_year, average_rating, cover_url, external_id)
       VALUES ('Disco HU04', 'Pop', 'album', 2024, 3.8, 'https://coverartarchive.org/x/front-250', 'test-hu04-album')
       RETURNING id::text AS id`,
    );
    ids.album = album.rows[0].id;
    await db.pool.query('INSERT INTO album_artists (album_id, artist_id) VALUES ($1, $2)', [
      ids.album,
      artist.rows[0].id,
    ]);
    const song = await db.pool.query(
      `INSERT INTO songs (title, album_id, track_number, duration_seconds, external_id) VALUES
         ('Segunda', $1, 2, 100, 'test-hu04-song-2'), ('Primera', $1, 1, 200, 'test-hu04-song-1')
       RETURNING id::text AS id, track_number`,
      [ids.album],
    );
    ids.song = song.rows.find((row) => row.track_number === 1).id;
    await db.pool.query(
      `INSERT INTO song_artists (song_id, artist_id) SELECT id, $1 FROM songs WHERE album_id = $2`,
      [ids.artist, ids.album],
    );
    const older = await db.pool.query(
      `INSERT INTO albums (title, type, release_year, external_id)
       VALUES ('EP antiguo HU04', 'ep', 2019, 'test-hu04-album-old') RETURNING id`,
    );
    await db.pool.query('INSERT INTO album_artists (album_id, artist_id) VALUES ($1, $2)', [
      older.rows[0].id,
      ids.artist,
    ]);

    await insertReview(ids.author, 5, 'public', { body: 'Pública de la autora' });
    await insertReview(ids.friend, 4, 'friends', { body: 'Solo amigos de la amiga' });
    await insertReview(ids.stranger, 2, 'private');
    await insertReview(ids.blocked, 3, 'public', { body: 'De la bloqueada' });
    await insertReview(ids.suspended, 4, 'public', { status: 'withdrawn', body: 'Retirada' });
    await insertReview(ids.author, 3, 'friends', { body: 'Canción solo amigos', song: true });
  });

  afterAll(async () => {
    await cleanUp();
    await db.pool.end();
  });

  const reviewBodies = (response) => response.body.reviews.items.map((review) => review.body);

  test('test_PA_04_01_getAlbum_asVisitor_showsInfoAverageAndOnlyPublicReviews', async () => {
    const response = await request(app).get(`/albums/${ids.album}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      title: 'Disco HU04',
      type: 'album',
      releaseYear: 2024,
      averageRating: 3.8,
      coverUrl: 'https://coverartarchive.org/x/front-250',
      artists: [{ name: 'Artista HU04' }],
      totalDurationSeconds: 300,
    });
    expect(response.body.songs.map((s) => s.title)).toEqual(['Primera', 'Segunda']);
    expect(reviewBodies(response).sort()).toEqual(['De la bloqueada', 'Pública de la autora']);
    expect(response.body.reviews.total).toBe(2);
  });

  test('test_RN_07_ratingDistribution_countsAllPrivaciesButNotWithdrawn', async () => {
    const response = await request(app).get(`/albums/${ids.album}`);

    expect(response.body.ratingsCount).toBe(4);
    expect(response.body.distribution).toEqual({ 1: 0, 2: 1, 3: 1, 4: 1, 5: 1 });
  });

  test('test_RN_08_getAlbum_asFriend_alsoSeesFriendsOnlyReviews', async () => {
    const response = await request(app)
      .get(`/albums/${ids.album}`)
      .set('Authorization', tokenFor(ids.author));

    expect(reviewBodies(response)).toContain('Solo amigos de la amiga');
    expect(reviewBodies(response)).not.toContain('Retirada');
  });

  test('test_RN_08_getAlbum_asAuthor_seesOwnPrivateReview', async () => {
    const response = await request(app)
      .get(`/albums/${ids.album}`)
      .set('Authorization', tokenFor(ids.stranger));

    expect(response.body.reviews.items.some((r) => r.username === 'hu04_desconocida')).toBe(true);
    expect(reviewBodies(response)).not.toContain('Solo amigos de la amiga');
  });

  test('test_RN_12_getAlbum_blockedUser_doesNotSeeBlockerReviewsAndViceVersa', async () => {
    const asBlocked = await request(app)
      .get(`/albums/${ids.album}`)
      .set('Authorization', tokenFor(ids.blocked));
    const asBlocker = await request(app)
      .get(`/albums/${ids.album}`)
      .set('Authorization', tokenFor(ids.author));

    expect(reviewBodies(asBlocked)).not.toContain('Pública de la autora');
    expect(reviewBodies(asBlocker)).not.toContain('De la bloqueada');
  });

  test('test_getAlbum_withSuspendedUserToken_isTreatedAsVisitor', async () => {
    const response = await request(app)
      .get(`/albums/${ids.album}`)
      .set('Authorization', tokenFor(ids.suspended));

    expect(response.status).toBe(200);
    expect(response.body.reviews.total).toBe(2);
  });

  test('test_getAlbum_withForgedToken_isTreatedAsVisitor', async () => {
    const jwt = require('jsonwebtoken');
    const forged = jwt.sign({ sub: ids.friend }, 'otra-clave-que-no-es-la-del-servidor-123');

    const response = await request(app)
      .get(`/albums/${ids.album}`)
      .set('Authorization', `Bearer ${forged}`);

    expect(reviewBodies(response)).not.toContain('Solo amigos de la amiga');
  });

  test('test_PA_04_01_getSong_showsAlbumArtistsAndVisibleReviews', async () => {
    const visitor = await request(app).get(`/songs/${ids.song}`);
    const friend = await request(app)
      .get(`/songs/${ids.song}`)
      .set('Authorization', tokenFor(ids.friend));

    expect(visitor.status).toBe(200);
    expect(visitor.body).toMatchObject({
      title: 'Primera',
      durationSeconds: 200,
      album: { id: ids.album, title: 'Disco HU04' },
      ratingsCount: 1,
    });
    expect(visitor.body.reviews.total).toBe(0);
    expect(reviewBodies(friend)).toEqual(['Canción solo amigos']);
  });

  test('test_getReviews_withOffset_returnsNextPage', async () => {
    const response = await request(app).get(`/albums/${ids.album}/reviews?offset=1`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ total: 2, offset: 1 });
    expect(response.body.items).toHaveLength(1);
  });

  test('test_getAlbum_unknownId_returns404', async () => {
    const response = await request(app).get('/albums/999999999');
    expect(response.status).toBe(404);
  });

  test.each([
    "1' OR '1'='1",
    '1 OR 1=1',
    '1;DELETE FROM reviews',
    '1 UNION SELECT password_hash FROM users',
    "1' AND pg_sleep(3)--",
  ])('test_security_getAlbum_withSqlInjection_%p_returns400AndChangesNothing', async (payload) => {
    const before = await db.pool.query('SELECT count(*)::int AS total FROM reviews');
    const started = Date.now();

    const response = await request(app).get(`/albums/${encodeURIComponent(payload)}`);

    expect(response.status).toBe(400);
    expect(Date.now() - started).toBeLessThan(2000);
    expect(JSON.stringify(response.body)).not.toMatch(/password|hash|SELECT/i);
    const after = await db.pool.query('SELECT count(*)::int AS total FROM reviews');
    expect(after.rows[0].total).toBe(before.rows[0].total);
  });

  test('test_PA_59_01_getArtist_showsInfoAndAlbumsNewestFirst', async () => {
    const response = await request(app).get(`/artists/${ids.artist}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      name: 'Artista HU04',
      genre: 'Pop',
      description: 'Grupo de pruebas',
      imageUrl: null,
      imageCredit: null,
      songsCount: 2,
    });
    expect(response.body.albums.map((album) => album.title)).toEqual([
      'Disco HU04',
      'EP antiguo HU04',
    ]);
  });

  test('test_getArtist_withCommonsPhoto_returnsItWithCredit', async () => {
    await db.pool.query(
      `UPDATE artists SET image_url = 'https://upload.wikimedia.org/foto.jpg',
                          image_credit = 'Ana · CC BY 4.0 · Wikimedia Commons'
        WHERE id = $1`,
      [ids.artist],
    );

    const response = await request(app).get(`/artists/${ids.artist}`);

    expect(response.body).toMatchObject({
      imageUrl: 'https://upload.wikimedia.org/foto.jpg',
      imageCredit: 'Ana · CC BY 4.0 · Wikimedia Commons',
    });
    await db.pool.query(
      "UPDATE artists SET image_url = 'javascript:alert(1)', image_credit = 'x' WHERE id = $1",
      [ids.artist],
    );
  });

  test('test_getArtist_unknownOrInvalid_returns404Or400', async () => {
    expect((await request(app).get('/artists/999999999')).status).toBe(404);
    expect((await request(app).get(`/artists/${encodeURIComponent("1' OR '1'='1")}`)).status).toBe(
      400,
    );
  });

  test('test_security_reviews_neverExposeEmailOrPasswordHash', async () => {
    const response = await request(app)
      .get(`/albums/${ids.album}`)
      .set('Authorization', tokenFor(ids.author));

    const text = JSON.stringify(response.body);
    expect(text).not.toContain('@hu04.test');
    expect(text).not.toContain('password');
  });
});
