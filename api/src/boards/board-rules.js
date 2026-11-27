// Reglas de los datos de un tablero (RI-12, RN-14): nombre obligatorio, descripción opcional
// y nivel de privacidad válido.
const { ValidationError } = require('../errors');

const NAME_MAX = 80;
const DESCRIPTION_MAX = 500;
const PRIVACY_LEVELS = ['public', 'friends', 'private'];
// eslint-disable-next-line no-control-regex
const NAME_CONTROL = /[\u0000-\u001F\u007F]/;
// eslint-disable-next-line no-control-regex
const DESCRIPTION_CONTROL = /[\u0000-\u0009\u000B-\u001F\u007F]/;
const ID_PATTERN = /^[1-9][0-9]{0,17}$/;

const MESSAGES = {
  nameRequired: 'Ponle un nombre al tablero.',
  nameTooLong: `El nombre puede tener como máximo ${NAME_MAX} caracteres.`,
  nameInvalid: 'El nombre tiene caracteres no válidos.',
  descriptionTooLong: `La descripción puede tener como máximo ${DESCRIPTION_MAX} caracteres.`,
  descriptionInvalid: 'La descripción tiene caracteres no válidos.',
  privacyInvalid: 'Elige público, solo amigos o privado.',
  coverInvalid: 'Elige como portada uno de los elementos del tablero.',
  kindInvalid: 'Elige una canción o un álbum.',
  nothingToChange: 'No hay nada que cambiar.',
};

const length = (text) => [...text].length;

function checkName(value, errors) {
  const name = typeof value === 'string' ? value.trim() : '';
  if (!name) errors.name = MESSAGES.nameRequired;
  else if (length(name) > NAME_MAX) errors.name = MESSAGES.nameTooLong;
  else if (NAME_CONTROL.test(name)) errors.name = MESSAGES.nameInvalid;
  return name;
}

function checkDescription(value, errors) {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') {
    errors.description = MESSAGES.descriptionInvalid;
    return null;
  }
  const description = value.trim();
  if (length(description) > DESCRIPTION_MAX) errors.description = MESSAGES.descriptionTooLong;
  else if (DESCRIPTION_CONTROL.test(description)) errors.description = MESSAGES.descriptionInvalid;
  return description || null;
}

function checkPrivacy(value, errors) {
  if (PRIVACY_LEVELS.includes(value)) return value;
  errors.privacy = MESSAGES.privacyInvalid;
  return null;
}

/** HU-09 · Nombre obligatorio (PA-09-03); sin privacidad, la del usuario (null, PA-09-02). */
function parseNewBoard(body = {}) {
  const errors = {};
  const board = {
    name: checkName(body.name, errors),
    description: checkDescription(body.description, errors),
    privacy:
      body.privacy === undefined || body.privacy === null
        ? null
        : checkPrivacy(body.privacy, errors),
  };
  if (Object.keys(errors).length > 0) throw new ValidationError(errors);
  return board;
}

/**
 * HU-26 y HU-34 · Solo se cambia lo que se envía: nombre, descripción, portada (el id de un
 * elemento del tablero, o null para la automática) y privacidad.
 */
function parseBoardChanges(body = {}) {
  const errors = {};
  const changes = {};
  if (body.name !== undefined) changes.name = checkName(body.name, errors);
  if (body.description !== undefined)
    changes.description = checkDescription(body.description, errors);
  if (body.privacy !== undefined) changes.privacy = checkPrivacy(body.privacy, errors);
  if (body.coverItemId !== undefined) {
    if (body.coverItemId === null) changes.coverItemId = null;
    else if (typeof body.coverItemId === 'string' && ID_PATTERN.test(body.coverItemId)) {
      changes.coverItemId = body.coverItemId;
    } else errors.coverItemId = MESSAGES.coverInvalid;
  }
  if (Object.keys(errors).length > 0) throw new ValidationError(errors);
  if (Object.keys(changes).length === 0)
    throw new ValidationError({ form: MESSAGES.nothingToChange });
  return changes;
}

/** HU-25 · Qué se añade: una canción o un álbum, por su id. */
function parseNewItem(body = {}) {
  if (body.kind !== 'song' && body.kind !== 'album') {
    throw new ValidationError({ kind: MESSAGES.kindInvalid });
  }
  if (typeof body.id !== 'string' || !ID_PATTERN.test(body.id)) {
    throw new ValidationError({ id: MESSAGES.kindInvalid });
  }
  return { kind: body.kind, itemId: body.id };
}

module.exports = { parseNewBoard, parseBoardChanges, parseNewItem, MESSAGES, PRIVACY_LEVELS };
