// Pruebas de aceptación de la HU-03 contra una base de datos PostgreSQL real.
const request = require('supertest');

const config = require('../../src/config');
const { createSessionToken } = require('../../src/auth/token');

const describeIfDatabase = process.env.DATABASE_URL ? describe : describe.skip;

describeIfDatabase('HU-03 · Buscar contenido (integración)', () => {
  let db;
  let app;
  const ids = {};

  const tokenFor = (userId) =>
    `Bearer ${createSessionToken({ id: userId, username: 'x', role: 'user' }, { secret: config.jwtSecret, expiresIn: '1h' })}`;

  async function cleanUp() {
    await db.pool.query("DELETE FROM communities WHERE name LIKE 'Zq%'");
    await db.pool.query("DELETE FROM albums WHERE external_id LIKE 'test-hu03-%'");
    await db.pool.query("DELETE FROM artists WHERE external_id LIKE 'test-hu03-%'");
    await db.pool.query("DELETE FROM users WHERE email LIKE '%@hu03.test'");
  }

  async function insertUser(username, name, status = 'active') {
    const { rows } = await db.pool.query(
      `INSERT INTO users (name, username, email, password_hash, status, suspension_reason, privacy_accepted_at)
       VALUES ($1, $2, $3, 'x', $4, $5, now()) RETURNING id::text AS id`,
      [name, username, `${username}@hu03.test`, status, status === 'suspended' ? 'Pruebas' : null],
    );
    return rows[0].id;
  }

  beforeAll(async () => {
    db = require('../../src/db');
    const { createApp } = require('../../src/app');
    app = createApp({ db, readRateLimit: { windowMs: 60_000, limit: 10_000 } });
    await cleanUp();

    ids.me = await insertUser('zq_yo', 'Persona que busca');
    ids.blocker = await insertUser('zq_bloqueadora', 'Zqrata Bloqueadora');
    ids.visible = await insertUser('zq_visible', 'Zqrata Visible');
    ids.suspended = await insertUser('zq_suspendida', 'Zqrata Suspendida', 'suspended');
    await db.pool.query('INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1, $2)', [
      ids.blocker,
      ids.me,
    ]);

    const artist = await db.pool.query(
      `INSERT INTO artists (name, external_id) VALUES ('Zqrata Neón', 'test-hu03-artist') RETURNING id`,
    );
    const album = await db.pool.query(
      `INSERT INTO albums (title, type, release_year, external_id) VALUES
         ('Zqrata Luz de Neón', 'ep', 2024, 'test-hu03-album-1'),
         ('Zqrata', 'album', 2020, 'test-hu03-album-2')
       RETURNING id, title`,
    );
    for (const row of album.rows) {
      await db.pool.query('INSERT INTO album_artists (album_id, artist_id) VALUES ($1, $2)', [
        row.id,
        artist.rows[0].id,
      ]);
    }
    const song = await db.pool.query(
      `INSERT INTO songs (title, album_id, duration_seconds, external_id)
       VALUES ('Canción Zqrata 100% real', $1, 180, 'test-hu03-song') RETURNING id`,
      [album.rows[0].id],
    );
    await db.pool.query('INSERT INTO song_artists (song_id, artist_id) VALUES ($1, $2)', [
      song.rows[0].id,
      artist.rows[0].id,
    ]);
    await db.pool.query(
      `INSERT INTO communities (name, description, access) VALUES ('Zqrata Fans', 'Pruebas', 'public')`,
    );
  });

  afterAll(async () => {
    await cleanUp();
    await db.pool.end();
  });

  test('test_PA_03_01_search_returnsResultsSeparatedByCategory', async () => {
    const response = await request(app).get('/search?q=zqrata');

    expect(response.status).toBe(200);
    expect(response.body.songs.map((s) => s.title)).toEqual(['Canción Zqrata 100% real']);
    expect(response.body.songs[0].artists).toEqual([
      { id: expect.any(String), name: 'Zqrata Neón' },
    ]);
    expect(response.body.albums.map((a) => a.title)).toEqual(['Zqrata', 'Zqrata Luz de Neón']);
    expect(response.body.albums[1]).toMatchObject({ type: 'ep', releaseYear: 2024 });
    expect(response.body.artists.map((a) => a.name)).toEqual(['Zqrata Neón']);
    expect(response.body.communities).toEqual([
      { id: expect.any(String), name: 'Zqrata Fans', access: 'public', membersCount: 0 },
    ]);
  });

  test('test_search_ignoresAccentsAndCase', async () => {
    const response = await request(app).get(`/search?q=${encodeURIComponent('ZQRATA NEON')}`);

    expect(response.body.artists.map((a) => a.name)).toEqual(['Zqrata Neón']);
  });

  test('test_PA_03_02_search_withoutMatches_returnsEmptyCategories', async () => {
    const response = await request(app).get('/search?q=zzqqxxnoexiste');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      query: 'zzqqxxnoexiste',
      songs: [],
      albums: [],
      artists: [],
      users: [],
      communities: [],
    });
  });

  test('test_PA_03_03_search_userWhoBlockedMe_doesNotAppear', async () => {
    const asVisitor = await request(app).get('/search?q=zqrata');
    const asBlocked = await request(app)
      .get('/search?q=zqrata')
      .set('Authorization', tokenFor(ids.me));

    expect(asVisitor.body.users.map((u) => u.username).sort()).toEqual([
      'zq_bloqueadora',
      'zq_visible',
    ]);
    expect(asBlocked.body.users.map((u) => u.username)).toEqual(['zq_visible']);
  });

  test('test_search_neverShowsSuspendedUsersNorEmails', async () => {
    const response = await request(app).get('/search?q=zq_');

    const text = JSON.stringify(response.body);
    expect(text).not.toContain('zq_suspendida');
    expect(text).not.toContain('@hu03.test');
    expect(text).not.toContain('password');
  });

  test('test_search_adminAccounts_doNotAppear', async () => {
    const response = await request(app).get('/search?q=admin');
    expect(response.body.users).toEqual([]);
  });

  test('test_search_byEmail_findsNothing', async () => {
    const response = await request(app).get('/search?q=hu03.test');
    expect(response.body.users).toEqual([]);
  });

  test('test_search_wildcards_areSearchedLiterally', async () => {
    const percent = await request(app).get(`/search?q=${encodeURIComponent('100%')}`);
    const underscoreOnly = await request(app).get('/search?q=__');

    expect(percent.body.songs.map((s) => s.title)).toEqual(['Canción Zqrata 100% real']);
    expect(underscoreOnly.body.users).toEqual([]);
  });

  test.each([
    "zq' OR '1'='1",
    "'; DROP TABLE users; --",
    "zq' UNION SELECT email, password_hash, null FROM users --",
    "zq'||pg_sleep(3)||'",
  ])('test_security_search_withSqlInjection_%p_isTreatedAsText', async (payload) => {
    const before = await db.pool.query(
      "SELECT count(*)::int AS total FROM users WHERE email LIKE '%@hu03.test'",
    );
    const started = Date.now();

    const response = await request(app).get(`/search?q=${encodeURIComponent(payload)}`);

    expect(response.status).toBe(200);
    expect(Date.now() - started).toBeLessThan(2000);
    expect(response.body.users).toEqual([]);
    const results = { ...response.body, query: undefined };
    expect(JSON.stringify(results)).not.toMatch(/password|@hu03\.test/);
    const after = await db.pool.query(
      "SELECT count(*)::int AS total FROM users WHERE email LIKE '%@hu03.test'",
    );
    expect(after.rows[0].total).toBe(before.rows[0].total);
  });

  test('test_search_tooShort_returns400', async () => {
    const response = await request(app).get('/search?q=a');
    expect(response.status).toBe(400);
  });
});
