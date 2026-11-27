// Pruebas de aceptación de los tableros (HU-09, HU-25, HU-49, HU-26, HU-50 y HU-34) contra una
// base de datos PostgreSQL real.
const request = require('supertest');

const config = require('../../src/config');
const { createSessionToken } = require('../../src/auth/token');

const describeIfDatabase = process.env.DATABASE_URL ? describe : describe.skip;

describeIfDatabase('Tableros (integración)', () => {
  let db;
  let app;
  const ids = {};

  const tokenFor = (userId) =>
    `Bearer ${createSessionToken({ id: userId, username: 'x', role: 'user' }, { secret: config.jwtSecret, expiresIn: '1h' })}`;
  const as = (call, userId) => (userId ? call.set('Authorization', tokenFor(userId)) : call);
  const create = (body, userId) => as(request(app).post('/boards').send(body), userId);
  const view = (id, userId) => as(request(app).get(`/boards/${id}`), userId);
  const change = (id, body, userId) => as(request(app).patch(`/boards/${id}`).send(body), userId);
  const add = (id, body, userId) => as(request(app).post(`/boards/${id}/items`).send(body), userId);
  const profile = (userId) => as(request(app).get('/me/profile'), userId);

  async function cleanUp() {
    await db.pool.query("DELETE FROM albums WHERE external_id LIKE 'test-hu09-%'");
    await db.pool.query("DELETE FROM users WHERE email LIKE '%@hu09.test'");
  }

  async function insertUser(username) {
    const { rows } = await db.pool.query(
      `INSERT INTO users (name, username, email, password_hash, privacy_accepted_at)
       VALUES ($1, $1, $2, 'x', now()) RETURNING id::text AS id`,
      [username, `${username}@hu09.test`],
    );
    return rows[0].id;
  }

  const activities = async (boardId) =>
    (
      await db.pool.query('SELECT type, privacy FROM activities WHERE board_id = $1 ORDER BY id', [
        boardId,
      ])
    ).rows;
  const followers = async (boardId) =>
    (
      await db.pool.query(
        'SELECT user_id::text AS id FROM board_followers WHERE board_id = $1 ORDER BY user_id',
        [boardId],
      )
    ).rows.map((row) => row.id);

  beforeAll(async () => {
    db = require('../../src/db');
    const { createApp } = require('../../src/app');
    app = createApp({
      db,
      readRateLimit: { windowMs: 60_000, limit: 10_000 },
      boardChangesLimit: { windowMs: 60_000, limit: 10_000 },
    });
    await cleanUp();
    for (const name of ['ana', 'bea', 'carla', 'dani'])
      ids[name] = await insertUser(`hu09_${name}`);
    // Bea es amiga de Ana; Carla no; Dani ha bloqueado a Ana.
    await db.pool.query(
      "INSERT INTO friendships (requester_id, recipient_id, status, responded_at) VALUES ($1, $2, 'accepted', now())",
      [ids.ana, ids.bea],
    );
    await db.pool.query('INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1, $2)', [
      ids.dani,
      ids.ana,
    ]);
    // Ana guarda por defecto su contenido como «solo amigos» (RN-09).
    await db.pool.query(
      "INSERT INTO privacy_settings (user_id, default_content_privacy) VALUES ($1, 'friends')",
      [ids.ana],
    );
    const album = await db.pool.query(
      `INSERT INTO albums (title, type, cover_url, external_id)
       VALUES ('Disco HU09', 'album', 'https://coverartarchive.org/hu09/front-250', 'test-hu09-album'),
              ('Otro HU09', 'ep', 'https://coverartarchive.org/hu09b/front-250', 'test-hu09-album-2')
       RETURNING id::text AS id`,
    );
    [ids.album, ids.album2] = album.rows.map((row) => row.id);
    const song = await db.pool.query(
      `INSERT INTO songs (title, album_id, duration_seconds, external_id)
       VALUES ('Canción HU09', $1, 200, 'test-hu09-song') RETURNING id::text AS id`,
      [ids.album2],
    );
    ids.song = song.rows[0].id;
    await db.pool.query(
      "INSERT INTO reviews (author_id, song_id, rating, privacy) VALUES ($1, $2, 4, 'public')",
      [ids.ana, ids.song],
    );
  });

  afterAll(async () => {
    await cleanUp();
    await db.pool.end();
  });

  test('test_PA_09_01_02_create_appearsInMyProfile_withMyDefaultPrivacy', async () => {
    const created = await create(
      { name: '  Carretera de noche ', description: 'Para conducir' },
      ids.ana,
    );

    expect(created.status).toBe(201);
    ids.board = created.body.id;
    const board = await view(ids.board, ids.ana);
    expect(board.body).toMatchObject({
      name: 'Carretera de noche',
      description: 'Para conducir',
      privacy: 'friends',
      isOwner: true,
      itemsCount: 0,
      owner: { username: 'hu09_ana' },
    });
    expect((await profile(ids.ana)).body.boards).toEqual([
      expect.objectContaining({ id: ids.board, name: 'Carretera de noche', privacy: 'friends' }),
    ]);
    expect(await activities(ids.board)).toEqual([{ type: 'board_created', privacy: 'friends' }]);
  });

  test('test_PA_09_03_withoutName_isRejected_andNothingIsSaved', async () => {
    const response = await create({ name: '   ', privacy: 'public' }, ids.ana);
    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual({ name: 'Ponle un nombre al tablero.' });
    expect((await create({ name: 'Visitante' })).status).toBe(401);
    const { rows } = await db.pool.query(
      'SELECT count(*)::int AS n FROM boards WHERE owner_id = $1',
      [ids.ana],
    );
    expect(rows[0].n).toBe(1);
  });

  test('test_PA_25_01_02_addSongAndAlbum_duplicateWarns_andIsNotStored', async () => {
    const song = await add(ids.board, { kind: 'song', id: ids.song }, ids.ana);
    expect(song.status).toBe(201);
    ids.songItem = song.body.id;
    const album = await add(ids.board, { kind: 'album', id: ids.album }, ids.ana);
    ids.albumItem = album.body.id;

    const again = await add(ids.board, { kind: 'song', id: ids.song }, ids.ana);
    expect(again.status).toBe(409);
    expect(again.body.errors).toEqual({ item: 'Ya está en este tablero.' });
    // Dos peticiones a la vez tampoco lo repiten.
    const both = await Promise.all(
      [1, 2].map(() => add(ids.board, { kind: 'album', id: ids.album2 }, ids.ana)),
    );
    expect(both.map((r) => r.status).sort()).toEqual([201, 409]);

    const board = (await view(ids.board, ids.ana)).body;
    expect(board.itemsCount).toBe(3);
    expect(board.items[0]).toMatchObject({
      kind: 'song',
      catalogId: ids.song,
      title: 'Canción HU09',
      myRating: 4,
      coverUrl: 'https://coverartarchive.org/hu09b/front-250',
    });
    // Sin portada elegida, la del primero que se añadió.
    expect(board.coverUrl).toBe('https://coverartarchive.org/hu09b/front-250');
    expect((await add(ids.board, { kind: 'album', id: '999999999' }, ids.ana)).status).toBe(404);
  });

  test('test_PA_26_01_03_editNameDescriptionAndCover', async () => {
    const edited = await change(
      ids.board,
      { name: 'Noche', description: '', coverItemId: ids.albumItem },
      ids.ana,
    );
    expect(edited.status).toBe(200);
    expect(edited.body).toMatchObject({
      name: 'Noche',
      description: null,
      coverItemId: ids.albumItem,
      coverUrl: 'https://coverartarchive.org/hu09/front-250',
    });
    // La portada tiene que ser de este tablero.
    const other = (await create({ name: 'Otro' }, ids.bea)).body.id;
    const otherItem = (await add(other, { kind: 'album', id: ids.album }, ids.bea)).body.id;
    expect((await change(ids.board, { coverItemId: otherItem }, ids.ana)).status).toBe(400);
  });

  test('test_PA_26_02_RN_13_othersCannotEditOrDeleteOrAdd', async () => {
    await change(ids.board, { privacy: 'public' }, ids.ana);
    for (const call of [
      change(ids.board, { name: 'Mío' }, ids.carla),
      as(request(app).delete(`/boards/${ids.board}`), ids.carla),
      add(ids.board, { kind: 'album', id: ids.album2 }, ids.carla),
      as(request(app).delete(`/boards/${ids.board}/items/${ids.songItem}`), ids.carla),
    ]) {
      const response = await call;
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Este tablero no está disponible.');
    }
    const board = (await view(ids.board, ids.carla)).body;
    expect(board).toMatchObject({ name: 'Noche', isOwner: false, itemsCount: 3 });
    expect(board.privacy).toBeUndefined();
  });

  test('test_PA_34_01_02_03_privacyChange_appliesNow_andDropsFollowersWithoutAccess', async () => {
    await db.pool.query(
      'INSERT INTO board_followers (board_id, user_id) VALUES ($1, $2), ($1, $3)',
      [ids.board, ids.bea, ids.carla],
    );
    expect((await view(ids.board, ids.carla)).status).toBe(200);

    const friendsOnly = await change(ids.board, { privacy: 'friends' }, ids.ana);
    expect(friendsOnly.body.privacy).toBe('friends');
    expect((await view(ids.board, ids.carla)).status).toBe(404);
    expect((await view(ids.board)).status).toBe(404);
    expect((await view(ids.board, ids.bea)).status).toBe(200);
    // RN-15: deja de seguirlo quien ya no puede verlo; su amiga sigue.
    expect(await followers(ids.board)).toEqual([ids.bea]);
    expect((await activities(ids.board)).every((a) => a.privacy === 'friends')).toBe(true);

    await change(ids.board, { privacy: 'private' }, ids.ana);
    expect((await view(ids.board, ids.bea)).status).toBe(404);
    expect(await followers(ids.board)).toEqual([]);
  });

  test('test_RN_12_blocked_cannotSeeAPublicBoard', async () => {
    const board = (await create({ name: 'De Dani', privacy: 'public' }, ids.dani)).body.id;
    expect((await view(board, ids.carla)).status).toBe(200);
    expect((await view(board, ids.ana)).status).toBe(404);
  });

  test('test_PA_49_01_removeItem_andItsActivity', async () => {
    const removed = await as(
      request(app).delete(`/boards/${ids.board}/items/${ids.songItem}`),
      ids.ana,
    );
    expect(removed.status).toBe(200);
    const board = (await view(ids.board, ids.ana)).body;
    expect(board.items.map((i) => i.id)).not.toContain(ids.songItem);
    expect((await activities(ids.board)).filter((a) => a.type === 'board_item_added')).toHaveLength(
      2,
    );
    const again = await as(
      request(app).delete(`/boards/${ids.board}/items/${ids.songItem}`),
      ids.ana,
    );
    expect(again.status).toBe(404);
  });

  test('test_myBoards_sayWhereTheItemAlreadyIs', async () => {
    const response = await as(request(app).get(`/me/boards?kind=album&id=${ids.album}`), ids.ana);
    expect(response.body.items).toEqual([
      expect.objectContaining({ id: ids.board, name: 'Noche', contains: true }),
    ]);
    expect((await as(request(app).get('/me/boards?kind=user&id=1'), ids.ana)).status).toBe(400);
    expect((await request(app).get(`/me/boards?kind=album&id=${ids.album}`)).status).toBe(401);
  });

  test('test_PA_50_01_delete_disappearsFromProfileAndFollowers', async () => {
    await change(ids.board, { privacy: 'public' }, ids.ana);
    await db.pool.query('INSERT INTO board_followers (board_id, user_id) VALUES ($1, $2)', [
      ids.board,
      ids.carla,
    ]);
    const removed = await as(request(app).delete(`/boards/${ids.board}`), ids.ana);

    expect(removed.status).toBe(200);
    expect((await view(ids.board, ids.ana)).status).toBe(404);
    expect((await profile(ids.ana)).body.boards).toEqual([]);
    expect(await followers(ids.board)).toEqual([]);
    expect(await activities(ids.board)).toEqual([]);
  });

  test('test_security_userTextIsStoredAsIs_andSqlInjectionDoesNothing', async () => {
    const name = "<script>alert(1)</script>'; DROP TABLE boards; --";
    const created = await create({ name }, ids.carla);
    expect((await view(created.body.id, ids.carla)).body.name).toBe(name);
    expect((await view('1 OR 1=1', ids.carla)).status).toBe(404);
    const { rows } = await db.pool.query("SELECT to_regclass('boards') IS NOT NULL AS ok");
    expect(rows[0].ok).toBe(true);
  });
});
