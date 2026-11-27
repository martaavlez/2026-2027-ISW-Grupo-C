// Pruebas de aceptación de la HU-24 (consultar el perfil de otro usuario)
// contra una base de datos PostgreSQL real.
const request = require('supertest');

const config = require('../../src/config');
const { createSessionToken } = require('../../src/auth/token');

const describeIfDatabase = process.env.DATABASE_URL ? describe : describe.skip;

describeIfDatabase('HU-24 · Consultar el perfil de otro usuario (integración)', () => {
  let db;
  let app;
  const ids = {};

  const tokenFor = (userId) =>
    `Bearer ${createSessionToken({ id: userId, username: 'x', role: 'user' }, { secret: config.jwtSecret, expiresIn: '1h' })}`;
  const as = (call, userId) => (userId ? call.set('Authorization', tokenFor(userId)) : call);
  const profileOf = (username, viewer) =>
    as(request(app).get(`/users/${encodeURIComponent(username)}/profile`), viewer);

  async function cleanUp() {
    await db.pool.query("DELETE FROM albums WHERE external_id LIKE 'test-hu24-%'");
    await db.pool.query("DELETE FROM users WHERE email LIKE '%@hu24.test'");
  }

  async function insertUser(username, extra = '') {
    const { rows } = await db.pool.query(
      `INSERT INTO users (name, username, email, password_hash, privacy_accepted_at ${extra ? ', status, suspension_reason' : ''})
       VALUES ($1, $1, $2, 'x', now() ${extra}) RETURNING id::text AS id`,
      [username, `${username}@hu24.test`],
    );
    return rows[0].id;
  }

  beforeAll(async () => {
    db = require('../../src/db');
    const { createApp } = require('../../src/app');
    app = createApp({ db, readRateLimit: { windowMs: 60_000, limit: 10_000 } });
    await cleanUp();
    ids.ana = await insertUser('hu24_ana');
    ids.bea = await insertUser('hu24_bea');
    ids.carla = await insertUser('hu24_carla');
    ids.dani = await insertUser('hu24_dani');
    ids.susi = await insertUser('hu24_susi', ", 'suspended', 'Pruebas'");
    await db.pool.query(
      `INSERT INTO friendships (requester_id, recipient_id, status, responded_at)
       VALUES ($1, $2, 'accepted', now())`,
      [ids.ana, ids.bea],
    );
    await db.pool.query('INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1, $2)', [
      ids.ana,
      ids.dani,
    ]);
    await db.pool.query(
      "INSERT INTO privacy_settings (user_id, favorites_visibility) VALUES ($1, 'friends')",
      [ids.ana],
    );
    const albums = [];
    for (const privacy of ['public', 'friends', 'private']) {
      const { rows } = await db.pool.query(
        `INSERT INTO albums (title, type, external_id) VALUES ($1, 'album', $2) RETURNING id`,
        [`Disco ${privacy}`, `test-hu24-${privacy}`],
      );
      albums.push(rows[0].id);
      await db.pool.query(
        `INSERT INTO reviews (author_id, album_id, rating, body, privacy)
         VALUES ($1, $2, 4, $3, $4)`,
        [ids.ana, rows[0].id, `Reseña ${privacy}`, privacy],
      );
      await db.pool.query('INSERT INTO boards (owner_id, name, privacy) VALUES ($1, $2, $3)', [
        ids.ana,
        `Tablero ${privacy}`,
        privacy,
      ]);
    }
    await db.pool.query('INSERT INTO favorites (user_id, album_id) VALUES ($1, $2)', [
      ids.ana,
      albums[0],
    ]);
  });

  afterAll(async () => {
    await cleanUp();
    await db.pool.end();
  });

  const reviewBodies = (response) => response.body.reviews.items.map((review) => review.body);
  const boardNames = (response) => response.body.boards.map((board) => board.name);

  test('test_PA_24_01_notAFriend_seesInfoAndOnlyPublicContent', async () => {
    const response = await profileOf('hu24_ana', ids.carla);

    expect(response.status).toBe(200);
    expect(response.body.user).toEqual({
      id: ids.ana,
      name: 'hu24_ana',
      username: 'hu24_ana',
      bio: null,
      photoUrl: null,
    });
    expect(response.body.user.email).toBeUndefined();
    expect(reviewBodies(response)).toEqual(['Reseña public']);
    expect(boardNames(response)).toEqual(['Tablero public']);
    // Sus favoritos son solo para amigos.
    expect(response.body.favorites).toBeNull();
    expect(response.body.counts).toMatchObject({ reviews: 1, boards: 1, favorites: null });
    expect(response.body.relationship).toEqual({
      isMe: false,
      isFriend: false,
      isFollowing: false,
      friendship: 'none',
      requestId: null,
    });
  });

  test('test_PA_24_01_visitor_seesOnlyPublicContent', async () => {
    const response = await profileOf('hu24_ana');

    expect(reviewBodies(response)).toEqual(['Reseña public']);
    expect(response.body.favorites).toBeNull();
  });

  test('test_PA_24_02_friend_alsoSeesFriendsOnlyContent_butNeverPrivate', async () => {
    const response = await profileOf('hu24_ana', ids.bea);

    expect(reviewBodies(response).sort()).toEqual(['Reseña friends', 'Reseña public']);
    expect(boardNames(response).sort()).toEqual(['Tablero friends', 'Tablero public']);
    expect(response.body.favorites.albums).toMatchObject({ total: 1 });
    expect(response.body.counts).toMatchObject({ reviews: 2, boards: 2, favorites: 1 });
    expect(response.body.relationship.isFriend).toBe(true);
  });

  test('test_PA_24_03_blockedUser_cannotSeeTheProfile', async () => {
    const blocked = await profileOf('hu24_ana', ids.dani);
    // Tampoco al revés: quien bloquea deja de ver al bloqueado.
    const blocker = await profileOf('hu24_dani', ids.ana);

    expect([blocked.status, blocker.status]).toEqual([404, 404]);
    expect(blocked.body).toEqual({ error: 'Este perfil no está disponible.' });
    expect((await as(request(app).get('/users/hu24_ana/reviews'), ids.dani)).status).toBe(404);
  });

  test('test_ownProfileByUsername_isMe_withEverything', async () => {
    const response = await profileOf('HU24_ANA', ids.ana);

    expect(response.body.relationship.isMe).toBe(true);
    expect(reviewBodies(response)).toHaveLength(3);
  });

  test('test_suspendedAdminOrUnknown_areNotShown', async () => {
    const admin = (await db.pool.query("SELECT username FROM users WHERE role = 'admin' LIMIT 1"))
      .rows[0];
    expect((await profileOf('hu24_susi', ids.carla)).status).toBe(404);
    expect((await profileOf('nadie_se_llama_asi', ids.carla)).status).toBe(404);
    if (admin) expect((await profileOf(admin.username, ids.carla)).status).toBe(404);
  });

  test('test_moreReviewsAndFavorites_followTheSameRules', async () => {
    const asFriend = await as(request(app).get('/users/hu24_ana/reviews?offset=1'), ids.bea);
    const favoritesFriend = await as(
      request(app).get('/users/hu24_ana/favorites?type=albums'),
      ids.bea,
    );
    const favoritesOther = await as(
      request(app).get('/users/hu24_ana/favorites?type=albums'),
      ids.carla,
    );

    expect(asFriend.body.items).toHaveLength(1);
    expect(favoritesFriend.body).toMatchObject({ total: 1, offset: 0 });
    expect(favoritesOther.status).toBe(404);
  });

  test('test_security_strangeUsernamesOrOffsets_areRejected', async () => {
    expect((await profileOf("hu24_ana' OR '1'='1", ids.carla)).status).toBe(404);
    expect((await profileOf('../me', ids.carla)).status).toBe(404);
    expect(
      (await as(request(app).get('/users/hu24_ana/reviews?offset=-1'), ids.carla)).status,
    ).toBe(400);
  });
});
