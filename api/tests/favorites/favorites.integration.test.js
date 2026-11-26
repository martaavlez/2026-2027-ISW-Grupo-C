// Pruebas de aceptación de la HU-07 y la HU-46 contra una base de datos PostgreSQL real.
const request = require('supertest');

const config = require('../../src/config');
const { createSessionToken } = require('../../src/auth/token');

const describeIfDatabase = process.env.DATABASE_URL ? describe : describe.skip;

describeIfDatabase('HU-07 y HU-46 · Favoritos (integración)', () => {
  let db;
  let app;
  const ids = {};

  const tokenFor = (userId) =>
    `Bearer ${createSessionToken({ id: userId, username: 'x', role: 'user' }, { secret: config.jwtSecret, expiresIn: '1h' })}`;

  async function cleanUp() {
    await db.pool.query("DELETE FROM albums WHERE external_id LIKE 'test-hu07-%'");
    await db.pool.query("DELETE FROM artists WHERE external_id LIKE 'test-hu07-%'");
    await db.pool.query("DELETE FROM users WHERE email LIKE '%@hu07.test'");
  }

  async function insertUser(username) {
    const { rows } = await db.pool.query(
      `INSERT INTO users (name, username, email, password_hash, privacy_accepted_at)
       VALUES ($1, $1, $2, 'x', now()) RETURNING id::text AS id`,
      [username, `${username}@hu07.test`],
    );
    return rows[0].id;
  }

  const as = (call, userId) => (userId ? call.set('Authorization', tokenFor(userId)) : call);

  beforeAll(async () => {
    db = require('../../src/db');
    const { createApp } = require('../../src/app');
    app = createApp({ db, readRateLimit: { windowMs: 60_000, limit: 10_000 } });
    await cleanUp();
    ids.ana = await insertUser('hu07_ana');
    ids.bea = await insertUser('hu07_bea');
    await db.pool.query(
      "INSERT INTO privacy_settings (user_id, favorites_visibility) VALUES ($1, 'private')",
      [ids.ana],
    );
    const artist = await db.pool.query(
      `INSERT INTO artists (name, external_id) VALUES ('Grupo HU07', 'test-hu07-artist') RETURNING id::text AS id`,
    );
    ids.artist = artist.rows[0].id;
    const album = await db.pool.query(
      `INSERT INTO albums (title, type, external_id) VALUES ('Disco HU07', 'ep', 'test-hu07-album')
       RETURNING id::text AS id`,
    );
    ids.album = album.rows[0].id;
    await db.pool.query('INSERT INTO album_artists (album_id, artist_id) VALUES ($1, $2)', [
      ids.album,
      ids.artist,
    ]);
    const song = await db.pool.query(
      `INSERT INTO songs (title, album_id, duration_seconds, external_id)
       VALUES ('Canción HU07', $1, 200, 'test-hu07-song') RETURNING id::text AS id`,
      [ids.album],
    );
    ids.song = song.rows[0].id;
    await db.pool.query('INSERT INTO song_artists (song_id, artist_id) VALUES ($1, $2)', [
      ids.song,
      ids.artist,
    ]);
  });

  afterAll(async () => {
    await cleanUp();
    await db.pool.end();
  });

  test('test_PA_07_01_markSong_appearsInMyFavoriteSongs', async () => {
    const response = await as(request(app).put(`/songs/${ids.song}/favorite`), ids.ana);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ favorite: true });
    const mine = await as(request(app).get('/me/favorites?type=songs'), ids.ana);
    expect(mine.body.total).toBe(1);
    expect(mine.body.items).toEqual([
      expect.objectContaining({
        id: ids.song,
        title: 'Canción HU07',
        albumTitle: 'Disco HU07',
        artists: [{ id: ids.artist, name: 'Grupo HU07' }],
      }),
    ]);
    const ficha = await as(request(app).get(`/songs/${ids.song}`), ids.ana);
    expect(ficha.body.isFavorite).toBe(true);
  });

  test('test_markTwice_doesNotDuplicate_andActivityUsesFavoritesVisibility', async () => {
    await as(request(app).put(`/albums/${ids.album}/favorite`), ids.ana);
    await as(request(app).put(`/albums/${ids.album}/favorite`), ids.ana);

    const rows = await db.pool.query(
      'SELECT 1 FROM favorites WHERE user_id = $1 AND album_id = $2',
      [ids.ana, ids.album],
    );
    expect(rows.rowCount).toBe(1);
    const activity = await db.pool.query(
      "SELECT privacy FROM activities WHERE user_id = $1 AND album_id = $2 AND type = 'favorite'",
      [ids.ana, ids.album],
    );
    expect(activity.rows).toEqual([{ privacy: 'private' }]);
  });

  test('test_PA_46_01_unmarkAlbum_disappearsFromFavorites', async () => {
    await as(request(app).put(`/albums/${ids.album}/favorite`), ids.ana);

    const response = await as(request(app).delete(`/albums/${ids.album}/favorite`), ids.ana);

    expect(response.body).toEqual({ favorite: false });
    const mine = await as(request(app).get('/me/favorites?type=albums'), ids.ana);
    expect(mine.body).toMatchObject({ total: 0, items: [] });
    const activity = await db.pool.query(
      "SELECT 1 FROM activities WHERE user_id = $1 AND album_id = $2 AND type = 'favorite'",
      [ids.ana, ids.album],
    );
    expect(activity.rowCount).toBe(0);
  });

  test('test_artists_canBeFavorites', async () => {
    await as(request(app).put(`/artists/${ids.artist}/favorite`), ids.bea);

    const ficha = await as(request(app).get(`/artists/${ids.artist}`), ids.bea);
    const other = await as(request(app).get(`/artists/${ids.artist}`), ids.ana);

    expect(ficha.body.isFavorite).toBe(true);
    expect(other.body.isFavorite).toBe(false);
  });

  test('test_favorites_arePersonal', async () => {
    const mine = await as(request(app).get('/me/favorites?type=songs'), ids.bea);
    expect(mine.body).toMatchObject({ total: 0, items: [] });
  });

  test('test_visitor_cannotMarkOrList', async () => {
    expect((await request(app).put(`/songs/${ids.song}/favorite`)).status).toBe(401);
    expect((await request(app).get('/me/favorites?type=songs')).status).toBe(401);
    expect((await request(app).get(`/songs/${ids.song}`)).body.isFavorite).toBe(false);
  });

  test('test_unknownOrInvalidItem', async () => {
    expect((await as(request(app).put('/songs/999999999/favorite'), ids.ana)).status).toBe(404);
    expect(
      (await as(request(app).put(`/songs/${encodeURIComponent("1' OR '1'='1")}/favorite`), ids.ana))
        .status,
    ).toBe(400);
  });

  test('test_manyFavorites_comeInPages_newestFirst', async () => {
    const cleo = await insertUser('hu07_cleo');
    const { rows } = await db.pool.query(
      `INSERT INTO songs (title, album_id, duration_seconds, external_id)
       SELECT 'Pista ' || n, $1, 100, 'test-hu07-pista-' || n FROM generate_series(1, 30) AS n
       RETURNING id::text AS id`,
      [ids.album],
    );
    // Cada una un segundo más tarde que la anterior: la 30 es la más reciente.
    await db.pool.query(
      `INSERT INTO favorites (user_id, song_id, created_at)
       SELECT $1, s.id, now() - (31 - substring(s.title FROM 7)::int) * interval '1 second'
         FROM songs s WHERE s.id = ANY($2::bigint[])`,
      [cleo, rows.map((row) => row.id)],
    );

    const first = await as(request(app).get('/me/favorites?type=songs'), cleo);
    const second = await as(request(app).get('/me/favorites?type=songs&offset=24'), cleo);

    expect(first.body).toMatchObject({ total: 30, offset: 0, pageSize: 24 });
    expect(first.body.items).toHaveLength(24);
    expect(first.body.items[0].title).toBe('Pista 30');
    expect(second.body.items.map((song) => song.title)).toEqual([
      'Pista 6',
      'Pista 5',
      'Pista 4',
      'Pista 3',
      'Pista 2',
      'Pista 1',
    ]);
  });

  test('test_security_listMine_rejectsBadTypeOrOffset', async () => {
    expect((await as(request(app).get('/me/favorites'), ids.ana)).status).toBe(400);
    expect((await as(request(app).get('/me/favorites?type=users'), ids.ana)).status).toBe(400);
    const injected = await as(
      request(app).get(`/me/favorites?type=songs&offset=${encodeURIComponent('0; DROP TABLE x')}`),
      ids.ana,
    );
    expect(injected.status).toBe(400);
  });

  test('test_security_cannotMarkForSomeoneElse', async () => {
    await as(request(app).put(`/songs/${ids.song}/favorite`), ids.bea).send({ userId: ids.ana });

    const rows = await db.pool.query(
      'SELECT user_id::text AS user FROM favorites WHERE song_id = $1 ORDER BY user_id',
      [ids.song],
    );
    expect(rows.rows.map((row) => row.user).sort()).toEqual([ids.ana, ids.bea].sort());
  });
});
