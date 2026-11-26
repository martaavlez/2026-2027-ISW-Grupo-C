// Pruebas de aceptación de la HU-02 contra una base de datos PostgreSQL real.
const jwt = require('jsonwebtoken');
const request = require('supertest');

const config = require('../../src/config');
const { hashPassword } = require('../../src/auth/password');

const describeIfDatabase = process.env.DATABASE_URL ? describe : describe.skip;

describeIfDatabase('HU-02 · Iniciar sesión (integración)', () => {
  let db;
  let app;

  async function cleanUp() {
    await db.pool.query("DELETE FROM users WHERE email LIKE '%@hu02.test'");
  }

  beforeAll(async () => {
    db = require('../../src/db');
    const { createApp } = require('../../src/app');
    app = createApp({ db, authRateLimit: { windowMs: 60_000, limit: 10_000 } });
    await cleanUp();
    const hash = await hashPassword('secreta123');
    await db.pool.query(
      `INSERT INTO users (name, username, email, password_hash, status, suspension_reason, privacy_accepted_at)
       VALUES ('Lucía', 'Lucia.HU02', 'lucia@hu02.test', $1, 'active', NULL, now()),
              ('Sus', 'sus_hu02', 'sus@hu02.test', $1, 'suspended', 'Publicar spam', now())`,
      [hash],
    );
  });

  afterAll(async () => {
    await cleanUp();
    await db.pool.end();
  });

  const login = (body) => request(app).post('/auth/login').send(body);

  test.each(['Lucia.HU02', 'lucia.hu02', 'lucia@hu02.test', 'LUCIA@HU02.TEST'])(
    'test_PA_02_01_login_with_%p_returnsWorkingSession',
    async (loginName) => {
      const response = await login({ login: loginName, password: 'secreta123' });

      expect(response.status).toBe(200);
      expect(response.body.user).toMatchObject({
        username: 'Lucia.HU02',
        email: 'lucia@hu02.test',
      });
      expect(JSON.stringify(response.body)).not.toMatch(/password|\$2[aby]\$/);

      const me = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${response.body.token}`);
      expect(me.status).toBe(200);
      expect(me.body.user.username).toBe('Lucia.HU02');
    },
  );

  test('test_PA_02_02_wrongPasswordAndUnknownUser_getTheSameAnswer', async () => {
    const wrongPassword = await login({ login: 'lucia.hu02', password: 'otra12345' });
    const unknownUser = await login({ login: 'nadie_hu02', password: 'otra12345' });

    expect(wrongPassword.status).toBe(401);
    expect(unknownUser.status).toBe(401);
    expect(wrongPassword.body).toEqual(unknownUser.body);
  });

  test('test_PA_02_03_suspendedAccount_isInformedAndGetsNoToken', async () => {
    const response = await login({ login: 'sus_hu02', password: 'secreta123' });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Tu cuenta está suspendida. Motivo: Publicar spam');
    expect(response.body.token).toBeUndefined();
  });

  test('test_PA_02_04_expiredOrTamperedToken_isRejected', async () => {
    const { body } = await login({ login: 'lucia.hu02', password: 'secreta123' });
    const [header, payload] = body.token.split('.');
    const tampered = `${header}.${Buffer.from(JSON.stringify({ sub: '1', role: 'admin' })).toString('base64url')}.${body.token.split('.')[2]}`;
    const expired = jwt.sign({ sub: body.user.id }, config.jwtSecret, { expiresIn: -10 });
    const unsigned = `${header}.${payload}.`;

    for (const token of [tampered, expired, unsigned]) {
      const response = await request(app).get('/auth/me').set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(401);
      expect(response.body.error).toBe(
        'Tu sesión ha caducado o no es válida. Inicia sesión de nuevo.',
      );
    }
  });

  test.each([
    { login: "' OR '1'='1", password: "' OR '1'='1" },
    { login: "admin'--", password: 'x' },
    { login: 'lucia.hu02', password: { $ne: null } },
    { login: { $gt: '' }, password: 'secreta123' },
  ])('test_security_login_injection_%p_neverLogsIn', async (body) => {
    const response = await login(body);
    expect([400, 401]).toContain(response.status);
    expect(response.body.token).toBeUndefined();
  });
});
