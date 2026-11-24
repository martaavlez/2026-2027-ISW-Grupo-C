// RNF-03: las contraseñas se guardan con bcrypt (resumen con sal), nunca en claro.
const bcrypt = require('bcryptjs');

// Coste 12: cada comprobación tarda una fracción de segundo, lo que hace muy lento
// probar contraseñas a ciegas si alguien consiguiera los resúmenes.
const SALT_ROUNDS = 12;

function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

module.exports = { hashPassword, verifyPassword };
