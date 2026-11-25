// Pruebas de aceptación de la HU-01 contra una base de datos PostgreSQL real.
const request = require('supertest');

require('../../src/config');

const hasDatabase = Boolean(process.env.DATABASE_URL);
const describeIfDatabase = hasDatabase ? describe : describe.skip;

describeIfDatabase('HU-01 · Registrarse (integración)', () => {
  let db;
  let app;

  const form = (overrides = {}) => ({
    name: 'Prueba Registro',
    username: 'test_hu01_lucia',
    email: 'lucia@hu01.test',
    password: 'secreta123',
    acceptedTerms: true,
    ...overrides,
  });

  async function cleanUp() {
    await db.pool.query("DELETE FROM users WHERE email LIKE '%@hu01.test'");
  }

  beforeAll(() => {
    db = require('../../src/db');
    const { createApp } = require('../../src/app');
    app = createApp({ db, authRateLimit: { windowMs: 60_000, limit: 1000 } });
  });

  beforeEach(cleanUp);

  afterAll(async () => {
    await cleanUp();
    await db.pool.end();
  });

  test('test_PA_01_01_register_withValidData_createsAccountWithDefaultPrivacyAndSession', async () => {
    const response = await request(app).post('/auth/register').send(form());

    expect(response.status).toBe(201);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user).toMatchObject({
      username: 'test_hu01_lucia',
      email: 'lucia@hu01.test',
      role: 'user',
    });
    expect(response.body.user.password_hash).toBeUndefined();

    const { rows } = await db.pool.query(
      `SELECT u.password_hash, u.status, u.privacy_accepted_at, p.default_content_privacy,
              p.favorites_visibility
         FROM users u JOIN privacy_settings p ON p.user_id = u.id
        WHERE u.username = 'test_hu01_lucia'`,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      status: 'active',
      default_content_privacy: 'public',
      favorites_visibility: 'public',
    });
    expect(rows[0].password_hash).not.toContain('secreta123');
    expect(rows[0].privacy_accepted_at).toBeInstanceOf(Date);
  });

  test('test_PA_01_02_register_withTakenUsernameOrEmail_warnsAndDoesNotCreateAccount', async () => {
    await request(app).post('/auth/register').send(form());

    const response = await request(app)
      .post('/auth/register')
      .send(form({ username: 'TEST_HU01_LUCIA', email: 'LUCIA@hu01.test' }));

    expect(response.status).toBe(409);
    expect(Object.keys(response.body.errors).sort()).toEqual(['email', 'username']);
    const { rows } = await db.pool.query(
      "SELECT count(*)::int AS total FROM users WHERE email LIKE '%@hu01.test'",
    );
    expect(rows[0].total).toBe(1);
  });

  test('test_PA_01_03_register_withInsecurePassword_saysWhichRequirementsAreMissing', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send(form({ password: 'solotexto' }));

    expect(response.status).toBe(400);
    expect(response.body.passwordRequirements).toEqual({
      minLength: true,
      letter: true,
      number: false,
    });
    const { rows } = await db.pool.query(
      "SELECT count(*)::int AS total FROM users WHERE email LIKE '%@hu01.test'",
    );
    expect(rows[0].total).toBe(0);
  });

  // Seguridad: la API rechaza por sí misma lo que la interfaz no deja enviar.
  test.each([
    ['7 caracteres', 'abc1234'],
    ['sin números', 'contraseñasegura'],
    ['sin letras', '1234567890'],
    ['más de 72 caracteres', `a1${'x'.repeat(71)}`],
  ])('test_register_directlyAgainstApi_withPassword_%s_isRejected', async (_case, password) => {
    const response = await request(app).post('/auth/register').send(form({ password }));

    expect(response.status).toBe(400);
    expect(response.body.errors.password).toBeDefined();
  });

  test('test_register_directlyAgainstApi_withoutAcceptingTerms_isRejected', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send(form({ acceptedTerms: 'true' }));

    expect(response.status).toBe(400);
    expect(response.body.errors.acceptedTerms).toBeDefined();
  });

  test('test_register_withSqlInjectionInUsername_isRejectedAndTableIsIntact', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send(form({ username: "x'; DROP TABLE users; --" }));

    expect(response.status).toBe(400);
    const { rows } = await db.pool.query('SELECT count(*)::int AS total FROM users');
    expect(rows[0].total).toBeGreaterThan(0);
  });

  test('test_database_withSameUsernameInOtherCase_refusesTheSecondUser', async () => {
    await request(app).post('/auth/register').send(form());

    await expect(
      db.pool.query(
        `INSERT INTO users (name, username, email, password_hash, privacy_accepted_at)
         VALUES ('Otra', 'TEST_HU01_LUCIA', 'otra@hu01.test', 'x', now())`,
      ),
    ).rejects.toThrow(/users_username_lower_key/);
  });

  test('test_register_withSqlInjectionInName_storesItAsPlainTextWithoutRunningIt', async () => {
    const payload = "'||(SELECT pg_sleep(3))||'";
    const started = Date.now();

    const response = await request(app)
      .post('/auth/register')
      .send(form({ name: payload }));

    // Si se ejecutara, pg_sleep(3) haría que la petición tardara al menos 3 segundos.
    expect(Date.now() - started).toBeLessThan(2500);
    expect(response.status).toBe(201);
    const { rows } = await db.pool.query(
      "SELECT name FROM users WHERE username = 'test_hu01_lucia'",
    );
    expect(rows[0].name).toBe(payload);
  });

  test('test_register_tryingToReadTheAdminHash_neverReturnsIt', async () => {
    const payload = "'||(SELECT password_hash FROM users WHERE role='admin')||'";

    const response = await request(app)
      .post('/auth/register')
      .send(form({ password: `${payload}a1` }));

    expect(response.status).toBe(201);
    expect(JSON.stringify(response.body)).not.toMatch(/\$2[aby]\$/);
    expect(response.body.user.password_hash).toBeUndefined();
  });

  test('test_register_withNullCharacterInName_returns400InsteadOfCrashing', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send(form({ name: 'admin\u0000' }));

    expect(response.status).toBe(400);
    expect(response.body.errors.name).toBeDefined();
  });
});
