// HU-35 · Bloquear a un usuario (PA-35-01 y 02) y HU-56 · Desbloquearlo (PA-56-01).
// Quien actúa sale siempre del token.
const { UnauthorizedError } = require('../auth/auth-errors');
const { safeImageUrl } = require('../catalog/catalog-service');
const { NotFoundError } = require('../errors');
const { parseOffset } = require('../favorites/favorite-service');
const { PROFILE_UNAVAILABLE } = require('../profile/profile-service');

const USERNAME_PATTERN = /^[A-Za-z0-9._]{3,30}$/;
const BLOCKED_PAGE_SIZE = 24;
const LOGIN_REQUIRED = 'Inicia sesión para bloquear o desbloquear usuarios.';
const NOT_BLOCKED = 'No tienes bloqueado a este usuario.';

const withPhoto = (person) => ({ ...person, photoUrl: safeImageUrl(person.photoUrl) });

function createBlockService({ blocks, profiles }) {
  function requireViewer(viewerId) {
    if (!viewerId) throw new UnauthorizedError(LOGIN_REQUIRED);
  }

  /** El otro usuario: existe, está activo y no es uno mismo. Si no, el 404 de su perfil. */
  async function other(viewerId, rawUsername) {
    requireViewer(viewerId);
    if (typeof rawUsername !== 'string' || !USERNAME_PATTERN.test(rawUsername)) {
      throw new NotFoundError(PROFILE_UNAVAILABLE);
    }
    const user = await profiles.findByUsername(rawUsername);
    if (!user || user.id === viewerId) throw new NotFoundError(PROFILE_UNAVAILABLE);
    return user;
  }

  /**
   * PA-35-01: bloquear dos veces no cambia nada. Se puede bloquear a quien ya te ha bloqueado:
   * la respuesta es la misma, así que no revela si él te había bloqueado antes.
   */
  async function block(viewerId, rawUsername) {
    const user = await other(viewerId, rawUsername);
    await blocks.block(viewerId, user.id);
    return { blocked: true };
  }

  async function unblock(viewerId, rawUsername) {
    const user = await other(viewerId, rawUsername);
    if (!(await blocks.unblock(viewerId, user.id))) throw new NotFoundError(NOT_BLOCKED);
    return { blocked: false };
  }

  /** Tu lista de bloqueados, por partes (PA-56-01). */
  async function listBlocked(viewerId, rawOffset) {
    requireViewer(viewerId);
    const offset = parseOffset(rawOffset);
    const page = await blocks.findBlocked(viewerId, { limit: BLOCKED_PAGE_SIZE, offset });
    return { ...page, offset, pageSize: BLOCKED_PAGE_SIZE, items: page.items.map(withPhoto) };
  }

  return { block, unblock, listBlocked };
}

module.exports = { createBlockService, LOGIN_REQUIRED, NOT_BLOCKED };
