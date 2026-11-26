// HU-23 · Reglas de una reseña. Se comprueban en la API aunque la pantalla también avise.
const { ValidationError } = require('../errors');

const MAX_BODY_LENGTH = 2000;
const PRIVACY_LEVELS = ['public', 'friends', 'private'];
// Se permiten saltos de línea y tabuladores; el resto de caracteres de control, no.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

const MESSAGES = {
  ratingMissing: 'Selecciona una puntuación del 1 al 5 para publicar la reseña.',
  ratingInvalid: 'La valoración debe ser un número entero del 1 al 5.',
  bodyMissing: 'Escribe tu reseña antes de publicarla.',
  bodyTooLong: `La reseña no puede tener más de ${MAX_BODY_LENGTH} caracteres.`,
  bodyInvalid: 'La reseña tiene caracteres no válidos.',
  privacyInvalid: 'Elige quién puede ver la reseña: público, solo amigos o privado.',
};

function ratingError(rating) {
  // PA-23-04 · RN-06: sin valoración no se publica.
  if (rating === undefined || rating === null) return MESSAGES.ratingMissing;
  const valid =
    typeof rating === 'number' && Number.isInteger(rating) && rating >= 1 && rating <= 5;
  return valid ? null : MESSAGES.ratingInvalid;
}

function bodyError(body) {
  if (typeof body !== 'string' || body.trim() === '') return MESSAGES.bodyMissing;
  if (body.trim().length > MAX_BODY_LENGTH) return MESSAGES.bodyTooLong;
  return CONTROL_CHARACTERS.test(body) ? MESSAGES.bodyInvalid : null;
}

/** Valida y limpia la reseña. La privacidad es opcional: si no viene, se usa la de por defecto. */
function parseReview(input) {
  const errors = {};
  const rating = ratingError(input?.rating);
  const body = bodyError(input?.body);
  const privacy = input?.privacy;
  if (rating) errors.rating = rating;
  if (body) errors.body = body;
  if (privacy !== undefined && !PRIVACY_LEVELS.includes(privacy)) {
    errors.privacy = MESSAGES.privacyInvalid;
  }
  if (Object.keys(errors).length > 0) throw new ValidationError(errors);
  return {
    rating: input.rating,
    body: input.body.trim().replace(/\r\n?/g, '\n'),
    privacy: privacy ?? null,
  };
}

module.exports = { parseReview, MESSAGES, MAX_BODY_LENGTH, PRIVACY_LEVELS };
