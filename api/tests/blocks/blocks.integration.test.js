// Pruebas de aceptación de HU-35 · Bloquear a un usuario y HU-56 · Desbloquearlo contra una
// base de datos PostgreSQL real.
const request = require('supertest');

const config = require('../../src/config');
const { createSessionToken } = require('../../src/auth/token');

const describeIfDatabase = process.env.DATABASE_URL ? describe : describe.skip;

describeIfDatabase('Bloquear (integración)', () => {
  let db;
  let app;
  const ids = {};

  const tokenFor = (userId) =>
    `Bearer ${createSessionToken({ id: userId, username: 'x', role: 'user' }, { secret: config.jwtSecret, expiresIn: '1h' })}`;
  const as = (call, userId) => (userId ? call.set('Authorization', tokenFor(userId)) : call);
  const block = (username, userId) => as(request(app).put(`/users/${username}/block`), userId);
  const unblock = (username, userId) => as(request(app).delete(`/users/${username}/block`), userId);
  const profile = (username, userId) => as(request(app).get(`/users/${username}/profile`), userId);
  const count = async (sql, params) => (await db.pool.query(sql, params)).rows[0].n;

  async function cleanUp() {
    await db.pool.query("DELETE FROM users WHERE email LIKE '%@hu35.test'");
  }

  async function insertUser(username) {
    const { rows } = await db.pool.query(
      `INSERT INTO users (name, username, email, password_hash, privacy_accepted_at)
       VALUES ($1, $1, $2, 'x', now()) RETURNING id::text AS id`,
      [username, `${username}@hu35.test`],
    );
    return rows[0].id;
  }

  beforeAll(async () => {
    db = require('../../src/db');
    const { createApp } = require('../../src/app');
    app = createApp({
      db,
      readRateLimit: { windowMs: 60_000, limit: 10_000 },
      blockChangesLimit: { windowMs: 60_000, limit: 10_000 },
      followChangesLimit: { windowMs: 60_000, limit: 10_000 },
      friendChangesLimit: { windowMs: 60_000, limit: 10_000 },
    });
    await cleanUp();
    for (const name of ['ana', 'bea', 'carla']) ids[name] = await insertUser(`hu35_${name}`);
    // Ana y Bea son amigas y se siguen; Bea sigue un tablero de Ana; Carla sigue a Ana.
    await db.pool.query(
      "INSERT INTO friendships (requester_id, recipient_id, status, responded_at) VALUES ($1, $2, 'accepted', now())",
      [ids.ana, ids.bea],
    );
    await db.pool.query(
      'INSERT INTO follows (follower_id, followed_id) VALUES ($1, $2), ($2, $1), ($3, $1)',
      [ids.ana, ids.bea, ids.carla],
    );
    const board = await db.pool.query(
      "INSERT INTO boards (owner_id, name, privacy) VALUES ($1, 'De Ana', 'public') RETURNING id",
      [ids.ana],
    );
    ids.board = board.rows[0].id;
    await db.pool.query(
      'INSERT INTO board_followers (board_id, user_id) VALUES ($1, $2), ($1, $3)',
      [ids.board, ids.bea, ids.carla],
    );
    await db.pool.query(
      "INSERT INTO notifications (recipient_id, type, related_kind, related_id) VALUES ($1, 'new_follower', 'user', $2)",
      [ids.ana, ids.bea],
    );
  });

  afterAll(async () => {
    await cleanUp();
    await db.pool.end();
  });

  test('test_PA_35_01_block_dropsFollowsAndFriendship_andHidesMyProfile', async () => {
    expect((await profile('hu35_ana', ids.bea)).status).toBe(200);

    const response = await block('hu35_bea', ids.ana);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ blocked: true });
    const pair = [ids.ana, ids.bea];
    expect(
      await count(
        'SELECT count(*)::int AS n FROM follows WHERE (follower_id = $1 AND followed_id = $2) OR (follower_id = $2 AND followed_id = $1)',
        pair,
      ),
    ).toBe(0);
    expect(
      await count(
        'SELECT count(*)::int AS n FROM friendships WHERE (requester_id = $1 AND recipient_id = $2) OR (requester_id = $2 AND recipient_id = $1)',
        pair,
      ),
    ).toBe(0);
    expect(
      await count('SELECT count(*)::int AS n FROM board_followers WHERE user_id = $1', [ids.bea]),
    ).toBe(0);
    expect(
      await count(
        'SELECT count(*)::int AS n FROM notifications WHERE recipient_id = $1 AND related_id = $2',
        pair,
      ),
    ).toBe(0);
    // Lo de Carla no se toca.
    expect(
      await count('SELECT count(*)::int AS n FROM follows WHERE follower_id = $1', [ids.carla]),
    ).toBe(1);
    expect(
      await count('SELECT count(*)::int AS n FROM board_followers WHERE user_id = $1', [ids.carla]),
    ).toBe(1);

    expect((await profile('hu35_ana', ids.bea)).status).toBe(404);
    expect((await as(request(app).get(`/boards/${ids.board}`), ids.bea)).status).toBe(404);
    const search = await as(request(app).get('/search?q=hu35_ana'), ids.bea);
    expect(search.body.users).toEqual([]);
    // Carla, sin bloqueo, sí la encuentra.
    const other = await as(request(app).get('/search?q=hu35_ana'), ids.carla);
    expect(other.body.users.map((u) => u.username)).toContain('hu35_ana');
    expect((await as(request(app).get('/me/blocks'), ids.ana)).body.items).toEqual([
      expect.objectContaining({ username: 'hu35_bea' }),
    ]);
  });

  test('test_PA_35_02_blocked_cannotFollowOrSendARequest', async () => {
    const follow = await as(request(app).put('/users/hu35_ana/follow'), ids.bea);
    const friend = await as(request(app).put('/users/hu35_ana/friend-request'), ids.bea);
    expect([follow.status, friend.status]).toEqual([404, 404]);
    expect(follow.body.error).toBe('Este perfil no está disponible.');
  });

  test('test_block_twice_isTheSame_andTheBlockedCannotUnblock', async () => {
    expect((await block('hu35_bea', ids.ana)).status).toBe(200);
    expect(
      await count('SELECT count(*)::int AS n FROM blocks WHERE blocker_id = $1', [ids.ana]),
    ).toBe(1);
    const response = await unblock('hu35_ana', ids.bea);
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('No tienes bloqueado a este usuario.');
  });

  test('test_PA_56_01_unblock_canSeeMyPublicContentAgain_butNothingComesBack', async () => {
    const response = await unblock('hu35_bea', ids.ana);
    expect(response.body).toEqual({ blocked: false });
    const seen = await profile('hu35_ana', ids.bea);
    expect(seen.status).toBe(200);
    expect(seen.body.relationship).toMatchObject({
      isFriend: false,
      isFollowing: false,
      friendship: 'none',
    });
    expect((await as(request(app).get('/me/blocks'), ids.ana)).body).toMatchObject({ total: 0 });
  });

  test('test_security_needsLogin_notYourself', async () => {
    expect((await block('hu35_bea')).status).toBe(401);
    expect((await request(app).get('/me/blocks')).status).toBe(401);
    expect((await block('hu35_ana', ids.ana)).status).toBe(404);
  });
});
