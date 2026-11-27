// Pruebas de aceptación de la HU-41 (enviar una solicitud de amistad), la HU-58 (responderla)
// y la HU-42 (eliminar una amistad) contra una base de datos PostgreSQL real.
const request = require('supertest');

const config = require('../../src/config');
const { createSessionToken } = require('../../src/auth/token');

const describeIfDatabase = process.env.DATABASE_URL ? describe : describe.skip;

describeIfDatabase('HU-41, HU-58 y HU-42 · Amistades (integración)', () => {
  let db;
  let app;
  const ids = {};

  const tokenFor = (userId) =>
    `Bearer ${createSessionToken({ id: userId, username: 'x', role: 'user' }, { secret: config.jwtSecret, expiresIn: '1h' })}`;
  const as = (call, userId) => (userId ? call.set('Authorization', tokenFor(userId)) : call);
  const send = (to, from) => as(request(app).put(`/users/${to}/friend-request`), from);
  const cancel = (to, from) => as(request(app).delete(`/users/${to}/friend-request`), from);
  const unfriend = (to, from) => as(request(app).delete(`/users/${to}/friendship`), from);
  const received = (userId) => as(request(app).get('/me/friend-requests'), userId);
  const answer = (requestId, action, userId) =>
    as(request(app).post(`/me/friend-requests/${requestId}/${action}`), userId);
  const profileOf = (username, viewer) =>
    as(request(app).get(`/users/${username}/profile`), viewer);

  const requestNotifications = async (recipient, sender) =>
    (
      await db.pool.query(
        `SELECT type FROM notifications
          WHERE recipient_id = $1 AND related_kind = 'user' AND related_id = $2 ORDER BY id`,
        [recipient, sender],
      )
    ).rows.map((row) => row.type);

  async function cleanUp() {
    await db.pool.query("DELETE FROM albums WHERE external_id LIKE 'test-hu41-%'");
    await db.pool.query("DELETE FROM users WHERE email LIKE '%@hu41.test'");
  }

  async function insertUser(username) {
    const { rows } = await db.pool.query(
      `INSERT INTO users (name, username, email, password_hash, privacy_accepted_at)
       VALUES ($1, $1, $2, 'x', now()) RETURNING id::text AS id`,
      [username, `${username}@hu41.test`],
    );
    return rows[0].id;
  }

  beforeAll(async () => {
    db = require('../../src/db');
    const { createApp } = require('../../src/app');
    app = createApp({
      db,
      readRateLimit: { windowMs: 60_000, limit: 10_000 },
      friendChangesLimit: { windowMs: 60_000, limit: 10_000 },
    });
    await cleanUp();
    for (const name of ['ana', 'bea', 'carla', 'dani', 'eva', 'fran', 'gala']) {
      ids[name] = await insertUser(`hu41_${name}`);
    }
    // Dani ha bloqueado a Ana (RN-12).
    await db.pool.query('INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1, $2)', [
      ids.dani,
      ids.ana,
    ]);
  });

  afterAll(async () => {
    await cleanUp();
    await db.pool.end();
  });

  test('test_PA_41_01_send_leavesItPending_andNotifiesTheRecipient', async () => {
    const response = await send('hu41_bea', ids.ana);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ friendship: 'sent', requestId: expect.any(String) });
    expect(await requestNotifications(ids.bea, ids.ana)).toEqual(['friend_request']);
    const list = await received(ids.bea);
    expect(list.body.items).toEqual([
      expect.objectContaining({ username: 'hu41_ana', id: response.body.requestId }),
    ]);
    // RN-11: pulsar «enviar» otra vez no crea otra solicitud.
    await send('hu41_bea', ids.ana);
    const { rows } = await db.pool.query(
      "SELECT count(*)::int AS n FROM friendships WHERE requester_id = $1 AND status = 'pending'",
      [ids.ana],
    );
    expect(rows[0].n).toBe(1);
    // Los dos perfiles lo cuentan desde su lado.
    expect((await profileOf('hu41_bea', ids.ana)).body.relationship.friendship).toBe('sent');
    expect((await profileOf('hu41_ana', ids.bea)).body.relationship).toMatchObject({
      friendship: 'received',
      requestId: response.body.requestId,
    });
  });

  test('test_PA_41_02_cancel_removesTheNotification_andCanBeSentAgain', async () => {
    await send('hu41_carla', ids.ana);

    const response = await cancel('hu41_carla', ids.ana);

    expect(response.body).toEqual({ friendship: 'none', requestId: null });
    expect(await requestNotifications(ids.carla, ids.ana)).toEqual([]);
    expect((await received(ids.carla)).body.items).toEqual([]);
    expect((await send('hu41_carla', ids.ana)).body.friendship).toBe('sent');
    expect((await cancel('hu41_carla', ids.ana)).status).toBe(200);
    expect((await cancel('hu41_carla', ids.ana)).status).toBe(404);
  });

  test('test_PA_58_01_accept_makesThemFriends_andTheyCanSeeFriendsOnlyContent', async () => {
    const album = await db.pool.query(
      "INSERT INTO albums (title, type, external_id) VALUES ('X', 'album', 'test-hu41-a') RETURNING id",
    );
    await db.pool.query(
      `INSERT INTO reviews (author_id, album_id, rating, body, privacy)
       VALUES ($1, $2, 5, 'Solo para amigos', 'friends')`,
      [ids.eva, album.rows[0].id],
    );
    const sent = await send('hu41_eva', ids.fran);
    expect((await profileOf('hu41_eva', ids.fran)).body.reviews.items).toEqual([]);

    const response = await answer(sent.body.requestId, 'accept', ids.eva);

    expect(response.body.friendship).toBe('friends');
    expect((await profileOf('hu41_eva', ids.fran)).body.relationship).toMatchObject({
      isFriend: true,
      friendship: 'friends',
    });
    expect(
      (await profileOf('hu41_eva', ids.fran)).body.reviews.items.map((review) => review.body),
    ).toEqual(['Solo para amigos']);
    // La solicitud ya no está pendiente y Fran recibe el aviso de que se aceptó.
    expect(await requestNotifications(ids.eva, ids.fran)).toEqual([]);
    expect(await requestNotifications(ids.fran, ids.eva)).toEqual(['friend_accepted']);
    const friends = await as(request(app).get('/me/friends'), ids.fran);
    expect(friends.body).toMatchObject({ total: 1, items: [{ username: 'hu41_eva' }] });
    // Ya son amigos: no se puede volver a enviar.
    expect((await send('hu41_eva', ids.fran)).status).toBe(409);
  });

  test('test_PA_58_02_reject_doesNotCreateTheFriendship', async () => {
    const sent = await send('hu41_gala', ids.carla);

    const response = await answer(sent.body.requestId, 'reject', ids.gala);

    expect(response.body.friendship).toBe('none');
    expect((await profileOf('hu41_gala', ids.carla)).body.relationship.isFriend).toBe(false);
    expect(await requestNotifications(ids.carla, ids.gala)).toEqual([]);
    // Ya respondida: no se puede responder otra vez.
    expect((await answer(sent.body.requestId, 'accept', ids.gala)).status).toBe(404);
  });

  test('test_onlyTheRecipient_canAnswer', async () => {
    const sent = await send('hu41_fran', ids.gala);

    expect((await answer(sent.body.requestId, 'accept', ids.gala)).status).toBe(404);
    expect((await answer(sent.body.requestId, 'accept', ids.ana)).status).toBe(404);
    expect((await answer('abc', 'accept', ids.fran)).status).toBe(400);
    expect((await profileOf('hu41_gala', ids.fran)).body.relationship.friendship).toBe('received');
  });

  test('test_requestFromThem_mustBeAnswered_notSentBack', async () => {
    await send('hu41_carla', ids.bea);

    const response = await send('hu41_bea', ids.carla);

    expect(response.status).toBe(409);
    expect(response.body.errors.friendship).toBe(
      'Ya te ha enviado una solicitud: acéptala o recházala.',
    );
  });

  test('test_PA_42_01_and_02_unfriend_hidesFriendsOnly_butKeepsFollowing', async () => {
    const sent = await send('hu41_bea', ids.eva);
    await answer(sent.body.requestId, 'accept', ids.bea);
    await db.pool.query('INSERT INTO follows (follower_id, followed_id) VALUES ($1, $2)', [
      ids.eva,
      ids.bea,
    ]);

    const response = await unfriend('hu41_bea', ids.eva);

    expect(response.body).toEqual({ friendship: 'none', requestId: null });
    expect((await profileOf('hu41_eva', ids.bea)).body.relationship.isFriend).toBe(false);
    expect((await profileOf('hu41_bea', ids.eva)).body.relationship.isFriend).toBe(false);
    const follows = await db.pool.query(
      'SELECT 1 FROM follows WHERE follower_id = $1 AND followed_id = $2',
      [ids.eva, ids.bea],
    );
    expect(follows.rowCount).toBe(1);
    expect((await unfriend('hu41_bea', ids.eva)).status).toBe(404);
  });

  test('test_RN_12_blocked_cannotSendRequests', async () => {
    const response = await send('hu41_dani', ids.ana);
    const reverse = await send('hu41_ana', ids.dani);

    expect([response.status, reverse.status]).toEqual([404, 404]);
    expect(await requestNotifications(ids.dani, ids.ana)).toEqual([]);
  });

  test('test_security_visitorSelfOrStrangeUsernames', async () => {
    expect((await send('hu41_bea')).status).toBe(401);
    expect((await received()).status).toBe(401);
    expect((await send('hu41_ana', ids.ana)).status).toBe(404);
    expect((await send("x' OR '1'='1", ids.ana)).status).toBe(404);
    expect((await send('nadie_se_llama_asi', ids.ana)).status).toBe(404);
  });
});
