// HU-10 · Seguir a un usuario (PA-10-01 y 02) y HU-48 · Dejar de seguirlo (PA-48-01).
// Quien actúa sale siempre del token.
const { UnauthorizedError } = require('../auth/auth-errors');
const { safeImageUrl } = require('../catalog/catalog-service');
const { NotFoundError } = require('../errors');
const { parseOffset } = require('../favorites/favorite-service');
const { PROFILE_UNAVAILABLE } = require('../profile/profile-service');

const USERNAME_PATTERN = /^[A-Za-z0-9._]{3,30}$/;
const FOLLOWING_PAGE_SIZE = 24;
const LOGIN_REQUIRED = 'Inicia sesión para seguir a otros usuarios.';

const withPhoto = (person) => ({ ...person, photoUrl: safeImageUrl(person.photoUrl) });

function createFollowService({ follows, profiles }) {
  function requireViewer(viewerId) {
    if (!viewerId) throw new UnauthorizedError(LOGIN_REQUIRED);
  }

  /**
   * El otro usuario: existe, está activo, no es uno mismo y no hay un bloqueo entre los dos
   * (RN-12, PA-35-02). Si no, el mismo 404 que su perfil, sin decir por qué.
   */
  async function other(viewerId, rawUsername) {
    requireViewer(viewerId);
    if (typeof rawUsername !== 'string' || !USERNAME_PATTERN.test(rawUsername)) {
      throw new NotFoundError(PROFILE_UNAVAILABLE);
    }
    const user = await profiles.findByUsername(rawUsername);
    if (!user || user.id === viewerId) throw new NotFoundError(PROFILE_UNAVAILABLE);
    if ((await profiles.findRelationship(viewerId, user.id)).blocked) {
      throw new NotFoundError(PROFILE_UNAVAILABLE);
    }
    return user;
  }

  async function state(user, following) {
    return { following, followers: await follows.countFollowers(user.id) };
  }

  /** PA-10-01: sin aprobación; seguir dos veces no lo duplica. */
  async function follow(viewerId, rawUsername) {
    const user = await other(viewerId, rawUsername);
    await follows.follow(viewerId, user.id);
    return state(user, true);
  }

  /** PA-48-01: deja de seguirle; si no le seguía, tampoco pasa nada. */
  async function unfollow(viewerId, rawUsername) {
    const user = await other(viewerId, rawUsername);
    await follows.unfollow(viewerId, user.id);
    return state(user, false);
  }

  /** A quién sigues, por partes («Siguiendo» en tu carpeta Amigos). */
  async function listFollowing(viewerId, rawOffset) {
    requireViewer(viewerId);
    const offset = parseOffset(rawOffset);
    const page = await follows.findFollowing(viewerId, { limit: FOLLOWING_PAGE_SIZE, offset });
    return { ...page, offset, pageSize: FOLLOWING_PAGE_SIZE, items: page.items.map(withPhoto) };
  }

  return { follow, unfollow, listFollowing };
}

module.exports = { createFollowService, LOGIN_REQUIRED, FOLLOWING_PAGE_SIZE };
