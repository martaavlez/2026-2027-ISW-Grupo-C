// HU-02 · Iniciar sesión (PA-02-01 a 04).
const { ValidationError } = require('../errors');
const { SuspendedAccountError, UnauthorizedError } = require('./auth-errors');
const { verifyPassword } = require('./password');
const { PASSWORD_MAX_BYTES } = require('./registration-rules');
const { createSessionToken, verifySessionToken } = require('./token');

// Mismo mensaje tanto si el usuario no existe como si la contraseña está mal:
// así nadie puede averiguar qué cuentas existen probando nombres.
const WRONG_CREDENTIALS = 'El usuario o la contraseña no son correctos.';
const INVALID_SESSION = 'Tu sesión ha caducado o no es válida. Inicia sesión de nuevo.';
const MAX_LOGIN_LENGTH = 100;

// Resumen bcrypt de una contraseña al azar. Si el usuario no existe se compara igualmente
// contra él, para que la respuesta tarde lo mismo y el tiempo no delate qué cuentas existen.
const DUMMY_HASH = '$2b$12$JY/7.YF0GeYStG5vQz4xMe5qHdxBWRSIcmk5kyRdvuUOOH/WEtQwK';

function readCredentials(body) {
  const login = typeof body?.login === 'string' ? body.login.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  const errors = {};
  if (!login) errors.login = 'Escribe tu correo o tu nombre de usuario.';
  else if (login.length > MAX_LOGIN_LENGTH) errors.login = WRONG_CREDENTIALS;
  if (!password) errors.password = 'Escribe tu contraseña.';
  if (Object.keys(errors).length > 0) throw new ValidationError(errors);
  return { login, password };
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
  };
}

function createLoginService({ credentials, tokenOptions }) {
  async function login(body) {
    const { login: loginName, password } = readCredentials(body);
    const user = await credentials.findForLogin(loginName);
    // bcrypt solo mira los primeros 72 bytes: una contraseña más larga nunca puede ser válida.
    const tooLong = Buffer.byteLength(password, 'utf8') > PASSWORD_MAX_BYTES;
    const matches = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !matches || tooLong) throw new UnauthorizedError(WRONG_CREDENTIALS);

    // PA-02-03: solo se informa de la suspensión a quien ha demostrado ser el dueño.
    if (user.status === 'suspended') throw new SuspendedAccountError(user.suspensionReason);

    return { user: publicUser(user), token: createSessionToken(user, tokenOptions) };
  }

  /** PA-02-04: comprueba el token de la cabecera Authorization y devuelve el usuario. */
  async function currentUser(authorization) {
    const match = /^Bearer ([A-Za-z0-9._-]{1,2048})$/.exec(authorization ?? '');
    const userId = match ? verifySessionToken(match[1], tokenOptions) : null;
    const user = userId ? await credentials.findById(userId) : null;
    if (!user) throw new UnauthorizedError(INVALID_SESSION);
    if (user.status === 'suspended') throw new SuspendedAccountError(user.suspensionReason);
    return { user: publicUser(user) };
  }

  return { login, currentUser };
}

module.exports = { createLoginService, WRONG_CREDENTIALS, INVALID_SESSION, DUMMY_HASH };
