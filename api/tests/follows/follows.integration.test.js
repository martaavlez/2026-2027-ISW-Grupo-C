// Pruebas de aceptación de HU-10 · Seguir a un usuario y HU-48 · Dejar de seguirlo contra una
// base de datos PostgreSQL real.
const request = require('supertest');

const config = require('../../src/config');
const { createSessionToken } = require('../../src/auth/token');

const describeIfDatabase = process.env.DATABASE_URL ? describe : describe.skip;

describeIfDatabase('Seguir (integración)', () => {
  let db;
  let app;
  const ids = {};

  const tokenFor = (userId) =>
    `Bearer ${createSessionToken({ id: userId, username: 'x', role: 'user' }, { secret: config.jwtSecret, expiresIn: '1h' })}`;
  const as = (call, userId) => (userId ? call.set('Authorization', tokenFor(userId)) : call);
  const follow = (username, userId) => as(request(app).put(`/users/${username}/follow`), userId);
  const unfollow = (username, userId) =>
    as(request(app).delete(`/users/${username}/follow`), userId);
  const profile = (username, userId) => as(request(app).get(`/users/${username}/profile`), userId);
  const following = (userId) => as(request(app).get('/me/following'), userId);
  const notifications = async (userId) =>
    (
      await db.pool.query(
        "SELECT related_id::text AS id FROM notifications WHERE recipient_id = $1 AND type = 'new_follower'",
        [userId],
      )
    ).rows.map((row) => row.id);

  async function cleanUp() {
    await db.pool.query("DELETE FROM users WHERE email LIKE '%@hu10.test'");
  }

  async function insertUser(username) {
    const { rows } = await db.pool.query(
      `INSERT INTO users (name, username, email, password_hash, privacy_accepted_at)
       VALUES ($1, $1, $2, 'x', now()) RETURNING id::text AS id`,
      [username, `${username}@hu10.test`],
    );
    return rows[0].id;
  }

  beforeAll(async () => {
    db = require('../../src/db');
    const { createApp } = require('../../src/app');
    app = createApp({
      db,
      readRateLimit: { windowMs: 60_000, limit: 10_000 },
      followChangesLimit: { windowMs: 60_000, limit: 10_000 },
    });
    await cleanUp();
    for (const name of ['ana', 'bea', 'dani']) ids[name] = await insertUser(`hu10_${name}`);
    await db.pool.query('INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1, $2)', [
      ids.dani,
      ids.ana,
    ]);
    // Bea tiene un tablero público y otro solo para amigos.
    await db.pool.query(
      "INSERT INTO boards (owner_id, name, privacy) VALUES ($1, 'Público', 'public'), ($1, 'Amigos', 'friends')",
      [ids.bea],
    );
  });

  afterAll(async () => {
    await cleanUp();
    await db.pool.end();
  });

  test('test_PA_10_01_follow_withoutApproval_countsAndNotifies', async () => {
    const before = (await profile('hu10_bea', ids.ana)).body;
    expect(before.relationship.isFollowing).toBe(false);

    const response = await follow('hu10_bea', ids.ana);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ following: true, followers: 1 });
    const after = (await profile('hu10_bea', ids.ana)).body;
    expect(after.relationship.isFollowing).toBe(true);
    expect(after.counts.followers).toBe(before.counts.followers + 1);
    expect((await following(ids.ana)).body.items).toEqual([
      expect.objectContaining({ username: 'hu10_bea', name: 'hu10_bea' }),
    ]);
    expect(await notifications(ids.bea)).toEqual([ids.ana]);
  });

  test('test_follow_twice_orAtTheSameTime_isNotDuplicated', async () => {
    const both = await Promise.all([follow('hu10_bea', ids.ana), follow('HU10_BEA', ids.ana)]);
    expect(both.map((r) => r.body)).toEqual([
      { following: true, followers: 1 },
      { following: true, followers: 1 },
    ]);
    expect(await notifications(ids.bea)).toHaveLength(1);
  });

  test('test_PA_10_02_followerWhoIsNotAFriend_onlySeesPublicContent', async () => {
    const seen = (await profile('hu10_bea', ids.ana)).body;
    expect(seen.boards.map((b) => b.name)).toEqual(['Público']);
  });

  test('test_PA_48_01_unfollow_disappearsFromMyList_andNotificationGoes', async () => {
    const response = await unfollow('hu10_bea', ids.ana);
    expect(response.body).toEqual({ following: false, followers: 0 });
    expect((await following(ids.ana)).body).toMatchObject({ total: 0, items: [] });
    expect(await notifications(ids.bea)).toEqual([]);
    expect((await unfollow('hu10_bea', ids.ana)).status).toBe(200);
  });

  test('test_RN_12_PA_35_02_blocked_cannotFollow', async () => {
    const response = await follow('hu10_dani', ids.ana);
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Este perfil no está disponible.');
    expect((await follow('hu10_ana', ids.dani)).status).toBe(404);
  });

  test('test_security_needsLogin_andCannotFollowYourself', async () => {
    expect((await follow('hu10_bea')).status).toBe(401);
    expect((await following()).status).toBe(401);
    expect((await follow('hu10_ana', ids.ana)).status).toBe(404);
    const { rows } = await db.pool.query(
      'SELECT count(*)::int AS n FROM follows WHERE follower_id = $1',
      [ids.ana],
    );
    expect(rows[0].n).toBe(0);
  });
});
