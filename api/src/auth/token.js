// RNF-11: token JWT firmado que identifica la sesión durante 24 horas.
const jwt = require('jsonwebtoken');

function createSessionToken(user, { secret, expiresIn }) {
  return jwt.sign({ sub: String(user.id), username: user.username, role: user.role }, secret, {
    algorithm: 'HS256',
    expiresIn,
  });
}

module.exports = { createSessionToken };
