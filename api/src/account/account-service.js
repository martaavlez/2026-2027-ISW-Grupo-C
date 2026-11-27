// HU-45 · Editar mi perfil (PA-45-01): foto, nombre y biografía. El usuario sale del token.
const { UnauthorizedError } = require('../auth/auth-errors');
const { NotFoundError, ValidationError } = require('../errors');

const LOGIN_REQUIRED = 'Inicia sesión para editar tu perfil.';
const NAME_MAX = 50;
const BIO_MAX = 300;
const PHOTO_MAX_BYTES = 1024 * 1024;
const USERNAME_PATTERN = /^[A-Za-z0-9._]{3,30}$/;
// Caracteres de control: en el nombre ninguno; en la biografía se permiten los saltos de línea.
// eslint-disable-next-line no-control-regex
const NAME_CONTROL = /[\u0000-\u001F\u007F]/;
// eslint-disable-next-line no-control-regex
const BIO_CONTROL = /[\u0000-\u0009\u000B-\u001F\u007F]/;

const MESSAGES = {
  nameRequired: 'Escribe tu nombre.',
  nameTooLong: `El nombre puede tener como máximo ${NAME_MAX} caracteres.`,
  nameInvalid: 'El nombre tiene caracteres no válidos.',
  bioTooLong: `La biografía puede tener como máximo ${BIO_MAX} caracteres.`,
  bioInvalid: 'La biografía tiene caracteres no válidos.',
  photoInvalid: 'La foto tiene que ser una imagen JPEG, PNG o WebP.',
  photoTooBig: 'La foto puede ocupar como máximo 1 MB.',
};

/** Valida el nombre y la biografía; la biografía vacía se guarda como sin biografía. */
function parseProfile(body = {}) {
  const errors = {};
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const bio = typeof body.bio === 'string' ? body.bio.trim() : '';
  if (!name) errors.name = MESSAGES.nameRequired;
  else if ([...name].length > NAME_MAX) errors.name = MESSAGES.nameTooLong;
  else if (NAME_CONTROL.test(name)) errors.name = MESSAGES.nameInvalid;
  if ([...bio].length > BIO_MAX) errors.bio = MESSAGES.bioTooLong;
  else if (BIO_CONTROL.test(bio)) errors.bio = MESSAGES.bioInvalid;
  if (body.bio !== undefined && body.bio !== null && typeof body.bio !== 'string') {
    errors.bio = MESSAGES.bioInvalid;
  }
  if (Object.keys(errors).length > 0) throw new ValidationError(errors);
  return { name, bio: bio || null };
}

/**
 * El tipo de imagen por sus primeros bytes, no por lo que diga el navegador: así no se puede
 * colar otro tipo de archivo con una cabecera falsa. null si no es JPEG, PNG ni WebP.
 */
function detectImageType(data) {
  if (!Buffer.isBuffer(data) || data.length < 12) return null;
  if (data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return 'image/jpeg';
  if (data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'image/png';
  }
  if (data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP') {
    return 'image/webp';
  }
  return null;
}

function createAccountService({ accounts }) {
  function requireViewer(viewerId) {
    if (!viewerId) throw new UnauthorizedError(LOGIN_REQUIRED);
  }

  /** PA-45-01: guarda el nombre y la biografía. */
  async function updateProfile(viewerId, body) {
    requireViewer(viewerId);
    const profile = parseProfile(body);
    const saved = await accounts.updateProfile(viewerId, profile);
    if (!saved) throw new UnauthorizedError(LOGIN_REQUIRED);
    return saved;
  }

  /** PA-45-01: guarda la foto, si es una imagen válida de 1 MB como máximo. */
  async function updatePhoto(viewerId, data) {
    requireViewer(viewerId);
    if (Buffer.isBuffer(data) && data.length > PHOTO_MAX_BYTES) {
      throw new ValidationError({ photo: MESSAGES.photoTooBig });
    }
    const type = detectImageType(data);
    if (!type) throw new ValidationError({ photo: MESSAGES.photoInvalid });
    const photoUrl = await accounts.savePhoto(viewerId, { data, type });
    if (!photoUrl) throw new UnauthorizedError(LOGIN_REQUIRED);
    return { photoUrl };
  }

  async function removePhoto(viewerId) {
    requireViewer(viewerId);
    if (!(await accounts.removePhoto(viewerId))) throw new UnauthorizedError(LOGIN_REQUIRED);
    return { photoUrl: null };
  }

  /** La foto de un usuario, para mostrarla en su perfil, sus reseñas o el buscador. */
  async function getPhoto(rawUsername) {
    if (typeof rawUsername !== 'string' || !USERNAME_PATTERN.test(rawUsername)) {
      throw new NotFoundError('No hay foto.');
    }
    const photo = await accounts.findPhoto(rawUsername);
    if (!photo) throw new NotFoundError('No hay foto.');
    return photo;
  }

  return { updateProfile, updatePhoto, removePhoto, getPhoto };
}

module.exports = {
  createAccountService,
  parseProfile,
  detectImageType,
  MESSAGES,
  LOGIN_REQUIRED,
  PHOTO_MAX_BYTES,
};
