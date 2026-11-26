// Normaliza lo que escribe el usuario en el buscador (HU-03).
const { ValidationError } = require('../errors');

const MIN_LENGTH = 2;
const MAX_LENGTH = 100;
// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/;

/** Minúsculas y sin tildes, igual que hace la consulta SQL con cada nombre (FOLD en search-repository). */
function fold(text) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Los comodines de LIKE (% y _) se escapan: se busca el texto tal cual, no un patrón. */
function escapeLike(text) {
  return text.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/**
 * Devuelve el término listo para la consulta, o lanza ValidationError si no vale.
 * Las comprobaciones se hacen aquí, en la API, aunque la pantalla también las haga.
 */
function parseSearchTerm(raw) {
  if (typeof raw !== 'string') {
    throw new ValidationError({ q: 'Escribe qué quieres buscar.' });
  }
  const term = raw.trim().replace(/\s+/g, ' ');
  if (CONTROL_CHARACTERS.test(term)) {
    throw new ValidationError({ q: 'La búsqueda tiene caracteres no válidos.' });
  }
  if (term.length < MIN_LENGTH) {
    throw new ValidationError({ q: `Escribe al menos ${MIN_LENGTH} caracteres.` });
  }
  if (term.length > MAX_LENGTH) {
    throw new ValidationError({ q: `La búsqueda no puede tener más de ${MAX_LENGTH} caracteres.` });
  }
  const folded = fold(term);
  return {
    term,
    exact: folded,
    prefix: `${escapeLike(folded)}%`,
    contains: `%${escapeLike(folded)}%`,
  };
}

module.exports = { parseSearchTerm, fold, escapeLike, MIN_LENGTH, MAX_LENGTH };
