// Reglas del formulario de registro (RI-01, RNF-03, RNF-04).

// bcrypt solo tiene en cuenta los primeros 72 bytes: una contraseña más larga se rechaza
// en lugar de recortarla sin avisar.
const PASSWORD_MAX_BYTES = 72;
// Caracteres de control (como el nulo \0): no tienen sentido en un nombre y PostgreSQL los rechaza.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/;
const USERNAME_PATTERN = /^[A-Za-z0-9._]{3,30}$/;
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** RNF-03: requisitos mínimos de la contraseña, uno a uno, para decir cuáles faltan. */
function checkPasswordRequirements(password = '') {
  return {
    minLength: password.length >= 8,
    letter: /\p{L}/u.test(password),
    number: /\d/.test(password),
  };
}

function isSecurePassword(password) {
  return Object.values(checkPasswordRequirements(password)).every(Boolean);
}

function normalizeRegistration(body = {}) {
  return {
    name: String(body.name ?? '').trim(),
    username: String(body.username ?? '').trim(),
    email: String(body.email ?? '')
      .trim()
      .toLowerCase(),
    password: String(body.password ?? ''),
    acceptedTerms: body.acceptedTerms === true,
  };
}

/** Devuelve un objeto con un mensaje por cada campo incorrecto (vacío si todo está bien). */
function validateRegistration(data) {
  const errors = {};
  if (!data.name) errors.name = 'Escribe tu nombre.';
  else if (data.name.length > 50) errors.name = 'El nombre puede tener como máximo 50 caracteres.';
  else if (CONTROL_CHARACTERS.test(data.name))
    errors.name = 'El nombre tiene caracteres no válidos.';

  if (!USERNAME_PATTERN.test(data.username)) {
    errors.username =
      'El nombre de usuario debe tener entre 3 y 30 caracteres: letras, números, puntos o guiones bajos.';
  }

  if (!EMAIL_PATTERN.test(data.email) || data.email.length > 100) {
    errors.email = 'Escribe un correo electrónico válido.';
  }

  if (!isSecurePassword(data.password)) {
    errors.password = 'La contraseña debe tener al menos 8 caracteres, una letra y un número.';
  } else if (Buffer.byteLength(data.password, 'utf8') > PASSWORD_MAX_BYTES) {
    errors.password = 'La contraseña puede tener como máximo 72 caracteres.';
  }

  if (!data.acceptedTerms) {
    errors.acceptedTerms = 'Tienes que aceptar las condiciones de uso y la política de privacidad.';
  }
  return errors;
}

module.exports = {
  PASSWORD_MAX_BYTES,
  checkPasswordRequirements,
  isSecurePassword,
  normalizeRegistration,
  validateRegistration,
};
