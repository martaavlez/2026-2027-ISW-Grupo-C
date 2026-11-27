// HU-41 · Enviar una solicitud de amistad (PA-41-01 y 02), HU-58 · Responderla (PA-58-01 y 02)
// y HU-42 · Eliminar una amistad (PA-42-01 y 02). Quien actúa sale siempre del token.
const { UnauthorizedError } = require('../auth/auth-errors');
const { parseId, safeImageUrl } = require('../catalog/catalog-service');
const { ConflictError, NotFoundError } = require('../errors');
const { parseOffset } = require('../favorites/favorite-service');
const { PROFILE_UNAVAILABLE } = require('../profile/profile-service');

const USERNAME_PATTERN = /^[A-Za-z0-9._]{3,30}$/;
const FRIENDS_PAGE_SIZE = 24;
const REQUESTS_LIMIT = 50;

const LOGIN_REQUIRED = 'Inicia sesión para gestionar tus amistades.';
const ALREADY_FRIENDS = 'Ya sois amigos.';
const PENDING_FROM_THEM = 'Ya te ha enviado una solicitud: acéptala o recházala.';
const NO_PENDING_REQUEST = 'No tienes una solicitud pendiente con este usuario.';
const REQUEST_NOT_FOUND = 'La solicitud ya no está pendiente.';
const NOT_FRIENDS = 'No sois amigos.';

const withPhoto = (person) => ({ ...person, photoUrl: safeImageUrl(person.photoUrl) });

function createFriendService({ friends, profiles }) {
  function requireViewer(viewerId) {
    if (!viewerId) throw new UnauthorizedError(LOGIN_REQUIRED);
  }

  /**
   * El otro usuario, si se le puede mandar algo: existe, está activo, no es uno mismo y no hay
   * un bloqueo entre los dos (RN-12). Si no, el mismo 404 que su perfil, sin decir por qué.
   */
  async function other(viewerId, rawUsername) {
    requireViewer(viewerId);
    if (typeof rawUsername !== 'string' || !USERNAME_PATTERN.test(rawUsername)) {
      throw new NotFoundError(PROFILE_UNAVAILABLE);
    }
    const user = await profiles.findByUsername(rawUsername);
    if (!user || user.id === viewerId || (await friends.isBlocked(viewerId, user.id))) {
      throw new NotFoundError(PROFILE_UNAVAILABLE);
    }
    return user;
  }

  /** PA-41-01: envía la solicitud. Si ya la había enviado, no se duplica (RN-11). */
  async function sendRequest(viewerId, rawUsername) {
    const user = await other(viewerId, rawUsername);
    if (!(await friends.send(viewerId, user.id))) {
      const { friendship } = await friends.findState(viewerId, user.id);
      if (friendship === 'friends') throw new ConflictError({ friendship: ALREADY_FRIENDS });
      if (friendship === 'received') throw new ConflictError({ friendship: PENDING_FROM_THEM });
    }
    return friends.findState(viewerId, user.id);
  }

  /** PA-41-02: volver a pulsar cancela la solicitud pendiente. */
  async function cancelRequest(viewerId, rawUsername) {
    const user = await other(viewerId, rawUsername);
    if (!(await friends.cancel(viewerId, user.id))) throw new NotFoundError(NO_PENDING_REQUEST);
    return friends.findState(viewerId, user.id);
  }

  /** HU-58 · Solo quien la recibe puede responderla, y solo mientras está pendiente. */
  async function respond(viewerId, rawRequestId, accept) {
    requireViewer(viewerId);
    const requestId = parseId(rawRequestId);
    if (!(await friends.respond(viewerId, requestId, accept))) {
      throw new NotFoundError(REQUEST_NOT_FOUND);
    }
    return { friendship: accept ? 'friends' : 'none', requestId: null };
  }

  /** HU-42 · Deja de ser amigos; el seguimiento, si lo había, se mantiene (PA-42-02). */
  async function removeFriend(viewerId, rawUsername) {
    const user = await other(viewerId, rawUsername);
    if (!(await friends.remove(viewerId, user.id))) throw new NotFoundError(NOT_FRIENDS);
    return { friendship: 'none', requestId: null };
  }

  /** Solicitudes recibidas pendientes, para la carpeta Amigos de tu perfil. */
  async function listReceived(viewerId) {
    requireViewer(viewerId);
    const items = await friends.findReceived(viewerId, { limit: REQUESTS_LIMIT });
    return { items: items.map(withPhoto) };
  }

  /** Tus amigos, por partes. */
  async function listFriends(viewerId, rawOffset) {
    requireViewer(viewerId);
    const offset = parseOffset(rawOffset);
    const page = await friends.findFriends(viewerId, { limit: FRIENDS_PAGE_SIZE, offset });
    return { ...page, offset, pageSize: FRIENDS_PAGE_SIZE, items: page.items.map(withPhoto) };
  }

  return {
    sendRequest,
    cancelRequest,
    respond,
    removeFriend,
    listReceived,
    listFriends,
  };
}

module.exports = {
  createFriendService,
  LOGIN_REQUIRED,
  ALREADY_FRIENDS,
  PENDING_FROM_THEM,
  NO_PENDING_REQUEST,
  REQUEST_NOT_FOUND,
  NOT_FRIENDS,
  FRIENDS_PAGE_SIZE,
};
