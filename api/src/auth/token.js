// RNF-11: token JWT firmado que identifica la sesión durante 24 horas.
const jwt = require('jsonwebtoken');

function createSessionToken(user, { secret, expiresIn }) {
  return jwt.sign({ sub: String(user.id), username: user.username, role: user.role }, secret, {
    algorithm: 'HS256',
    expiresIn,
  });
}

/**
 * Comprueba la firma y la caducidad del token. Devuelve el id del usuario o null si el token
 * no es válido. Solo se acepta HS256 para que nadie pueda colar un token sin firmar ("alg: none").
 */
function verifySessionToken(token, { secret }) {
  try {
    const payload = jwt.verify(token, secret, { algorithms: ['HS256'] });
    return /^[1-9][0-9]{0,17}$/.test(payload.sub) ? payload.sub : null;
  } catch {
    return null;
  }
}

module.exports = { createSessionToken, verifySessionToken };
