// Pruebas de aceptación de la HU-06 contra una base de datos PostgreSQL real.
const request = require('supertest');

const config = require('../../src/config');
const { createSessionToken } = require('../../src/auth/token');

const describeIfDatabase = process.env.DATABASE_URL ? describe : describe.skip;

describeIfDatabase('HU-06 · Consultar mi perfil (integración)', () => {
  let db;
  let app;
  const ids = {};

  const tokenFor = (userId) =>
    `Bearer ${createSessionToken({ id: userId, username: 'x', role: 'user' }, { secret: config.jwtSecret, expiresIn: '1h' })}`;

  async function cleanUp() {
    await db.pool.query("DELETE FROM albums WHERE external_id LIKE 'test-hu06-%'");
    await db.pool.query("DELETE FROM users WHERE email LIKE '%@hu06.test'");
  }

  async function insertUser(username, bio = null) {
    const { rows } = await db.pool.query(
      `INSERT INTO users (name, username, email, password_hash, bio, privacy_accepted_at)
       VALUES ($1, $1, $2, 'x', $3, now()) RETURNING id::text AS id`,
      [username, `${username}@hu06.test`, bio],
    );
    return rows[0].id;
  }

  beforeAll(async () => {
    db = require('../../src/db');
    const { createApp } = require('../../src/app');
    app = createApp({ db, readRateLimit: { windowMs: 60_000, limit: 10_000 } });
    await cleanUp();
    ids.me = await insertUser('hu06_yo', 'Reseño discos enteros.');
    ids.other = await insertUser('hu06_otra');
    const album = await db.pool.query(
      `INSERT INTO albums (title, type, external_id) VALUES ('Disco HU06', 'ep', 'test-hu06-album')
       RETURNING id::text AS id`,
    );
    ids.album = album.rows[0].id;
    const song = await db.pool.query(
      `INSERT INTO songs (title, album_id, duration_seconds, external_id)
       VALUES ('Canción HU06', $1, 200, 'test-hu06-song') RETURNING id::text AS id`,
      [ids.album],
    );
    ids.song = song.rows[0].id;
    await db.pool.query(
      `INSERT INTO reviews (author_id, album_id, rating, body, privacy) VALUES
         ($1, $2, 5, 'Mi reseña privada', 'private')`,
      [ids.me, ids.album],
    );
    await db.pool.query(
      `INSERT INTO reviews (author_id, song_id, rating, privacy) VALUES ($1, $2, 3, 'public')`,
      [ids.me, ids.song],
    );
    await db.pool.query(
      `INSERT INTO reviews (author_id, album_id, rating, body, privacy) VALUES ($1, $2, 1, 'De otra', 'public')`,
      [ids.other, ids.album],
    );
    await db.pool.query('INSERT INTO favorites (user_id, song_id) VALUES ($1, $2)', [
      ids.me,
      ids.song,
    ]);
    const portada = await db.pool.query(
      `INSERT INTO albums (title, type, external_id, cover_url)
       VALUES ('Portada HU06', 'album', 'test-hu06-portada', 'https://coverartarchive.org/hu06-b')
       RETURNING id::text AS id`,
    );
    await db.pool.query(
      "UPDATE albums SET cover_url = 'https://coverartarchive.org/hu06-a' WHERE id = $1",
      [ids.album],
    );
    const board = await db.pool.query(
      `INSERT INTO boards (owner_id, name, privacy) VALUES ($1, 'Domingos lentos', 'friends')
       RETURNING id`,
      [ids.me],
    );
    ids.board = board.rows[0].id;
    await db.pool.query('INSERT INTO board_items (board_id, song_id) VALUES ($1, $2)', [
      ids.board,
      ids.song,
    ]);
    const second = await db.pool.query(
      'INSERT INTO board_items (board_id, album_id) VALUES ($1, $2) RETURNING id',
      [ids.board, portada.rows[0].id],
    );
    ids.secondItem = second.rows[0].id;
    await db.pool.query(
      "INSERT INTO boards (owner_id, name, privacy) VALUES ($1, 'Vacío', 'private')",
      [ids.me],
    );
    await db.pool.query('INSERT INTO follows (follower_id, followed_id) VALUES ($1, $2)', [
      ids.other,
      ids.me,
    ]);
    await db.pool.query(
      `INSERT INTO friendships (requester_id, recipient_id, status, responded_at)
       VALUES ($1, $2, 'accepted', now())`,
      [ids.me, ids.other],
    );
  });

  afterAll(async () => {
    await cleanUp();
    await db.pool.end();
  });

  test('test_PA_06_01_myProfile_showsInfoAndAllMyContent', async () => {
    const response = await request(app).get('/me/profile').set('Authorization', tokenFor(ids.me));

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({
      username: 'hu06_yo',
      bio: 'Reseño discos enteros.',
    });
    expect(response.body.counts).toEqual({
      reviews: 2,
      followers: 1,
      following: 0,
      friends: 1,
      favorites: 1,
      boards: 2,
    });
    expect(response.body.reviews.total).toBe(2);
    const reviews = response.body.reviews.items;
    expect(reviews.map((review) => review.body)).toEqual([null, 'Mi reseña privada']);
    expect(reviews[1]).toMatchObject({
      kind: 'album',
      itemId: ids.album,
      itemTitle: 'Disco HU06',
      albumType: 'ep',
      privacy: 'private',
    });
    expect(reviews[0]).toMatchObject({ kind: 'song', itemTitle: 'Canción HU06' });
    expect(response.body.favorites.songs).toMatchObject({ total: 1 });
    expect(response.body.favorites.songs.items.map((song) => song.title)).toEqual(['Canción HU06']);
    expect(response.body.boards).toEqual([
      { id: expect.any(String), name: 'Vacío', privacy: 'private', itemsCount: 0, coverUrl: null },
      {
        id: expect.any(String),
        name: 'Domingos lentos',
        privacy: 'friends',
        itemsCount: 2,
        // Sin portada elegida: la carátula del primer elemento (la canción, por su álbum).
        coverUrl: 'https://coverartarchive.org/hu06-a',
      },
    ]);
  });

  test('test_boardCover_isTheChosenItem', async () => {
    await db.pool.query('UPDATE boards SET cover_item_id = $2 WHERE id = $1', [
      ids.board,
      ids.secondItem,
    ]);

    const response = await request(app).get('/me/profile').set('Authorization', tokenFor(ids.me));

    const board = response.body.boards.find((item) => item.name === 'Domingos lentos');
    expect(board.coverUrl).toBe('https://coverartarchive.org/hu06-b');
  });

  test('test_myReviews_nextPage', async () => {
    const first = await request(app)
      .get('/me/reviews?offset=1')
      .set('Authorization', tokenFor(ids.me));
    const bad = await request(app)
      .get('/me/reviews?offset=-1')
      .set('Authorization', tokenFor(ids.me));

    expect(first.status).toBe(200);
    expect(first.body.items.map((review) => review.body)).toEqual(['Mi reseña privada']);
    expect(bad.status).toBe(400);
    expect((await request(app).get('/me/reviews')).status).toBe(401);
  });

  test('test_myProfile_neverShowsEmailOrOthersContent', async () => {
    const response = await request(app).get('/me/profile').set('Authorization', tokenFor(ids.me));

    const text = JSON.stringify(response.body);
    expect(text).not.toContain('@hu06.test');
    expect(text).not.toContain('De otra');
    expect(text).not.toContain('password');
  });

  test('test_myProfile_asVisitor_returns401', async () => {
    expect((await request(app).get('/me/profile')).status).toBe(401);
  });
});
