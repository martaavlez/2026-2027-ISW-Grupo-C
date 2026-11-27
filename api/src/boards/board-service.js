// HU-09 · Crear un tablero, HU-25 · Añadir a un tablero, HU-49 · Quitar de un tablero,
// HU-26 · Editar un tablero, HU-50 · Eliminar un tablero y HU-34 · Privacidad de un tablero.
const { UnauthorizedError } = require('../auth/auth-errors');
const { parseId, safeImageUrl } = require('../catalog/catalog-service');
const { ConflictError, NotFoundError, ValidationError } = require('../errors');
const { MESSAGES, parseBoardChanges, parseNewBoard, parseNewItem } = require('./board-rules');

const LOGIN_TO_CREATE = 'Inicia sesión para crear tableros.';
const LOGIN_TO_CHANGE = 'Inicia sesión para cambiar tus tableros.';
// El mismo mensaje si no existe, es de otra persona sin permiso o hay un bloqueo (RN-12, RN-13).
const BOARD_UNAVAILABLE = 'Este tablero no está disponible.';
const ITEM_UNAVAILABLE = 'Esa canción o ese álbum no existe.';
const ALREADY_IN_BOARD = 'Ya está en este tablero.';
const NOT_IN_BOARD = 'Ese elemento ya no está en el tablero.';

// RN-08: el dueño lo ve todo; un amigo, lo público y lo de solo amigos; el resto, lo público.
function canSee(privacy, { isOwner, isFriend }) {
  if (isOwner || privacy === 'public') return true;
  return privacy === 'friends' && isFriend;
}

function boardId(raw) {
  try {
    return parseId(raw);
  } catch {
    throw new NotFoundError(BOARD_UNAVAILABLE);
  }
}

function createBoardService({ boards, profiles }) {
  function requireLogin(viewerId, message = LOGIN_TO_CHANGE) {
    if (!viewerId) throw new UnauthorizedError(message);
  }

  async function create(viewerId, body) {
    requireLogin(viewerId, LOGIN_TO_CREATE);
    const board = parseNewBoard(body);
    return { id: await boards.create(viewerId, board) };
  }

  /** El tablero con su contenido, si quien mira puede verlo (PA-34-02). */
  async function get(viewerId, rawId) {
    const id = boardId(rawId);
    const board = await boards.findBoard(id);
    if (!board) throw new NotFoundError(BOARD_UNAVAILABLE);
    const isOwner = viewerId === board.ownerId;
    const relation = isOwner
      ? { friends: false, blocked: false }
      : await profiles.findRelationship(viewerId, board.ownerId);
    if (relation.blocked || !canSee(board.privacy, { isOwner, isFriend: relation.friends })) {
      throw new NotFoundError(BOARD_UNAVAILABLE);
    }
    const items = await boards.findItems(id, viewerId);
    return {
      id: board.id,
      name: board.name,
      description: board.description,
      // Solo su dueño sabe qué nivel tiene y qué elemento eligió como portada.
      privacy: isOwner ? board.privacy : undefined,
      coverItemId: isOwner ? board.coverItemId : undefined,
      coverUrl: safeImageUrl(board.coverUrl),
      createdAt: board.createdAt,
      isOwner,
      owner: {
        username: board.username,
        name: board.ownerName,
        photoUrl: safeImageUrl(board.ownerPhotoUrl),
      },
      itemsCount: board.itemsCount,
      followersCount: board.followersCount,
      items: items.map((item) => ({ ...item, coverUrl: safeImageUrl(item.coverUrl) })),
    };
  }

  async function update(viewerId, rawId, body) {
    requireLogin(viewerId);
    const id = boardId(rawId);
    const changes = parseBoardChanges(body);
    const result = await boards.update(id, viewerId, changes);
    if (result === null) throw new NotFoundError(BOARD_UNAVAILABLE);
    if (result === 'badCover') throw new ValidationError({ coverItemId: MESSAGES.coverInvalid });
    return get(viewerId, id);
  }

  async function remove(viewerId, rawId) {
    requireLogin(viewerId);
    const id = boardId(rawId);
    if (!(await boards.remove(id, viewerId))) throw new NotFoundError(BOARD_UNAVAILABLE);
    return { deleted: true };
  }

  async function addItem(viewerId, rawId, body) {
    requireLogin(viewerId);
    const id = boardId(rawId);
    const item = parseNewItem(body);
    const result = await boards.addItem(id, viewerId, item);
    if (result === null) throw new NotFoundError(BOARD_UNAVAILABLE);
    if (result === 'missing') throw new NotFoundError(ITEM_UNAVAILABLE);
    if (result === 'duplicate') throw new ConflictError({ item: ALREADY_IN_BOARD });
    return { id: result.id };
  }

  async function removeItem(viewerId, rawId, rawItemId) {
    requireLogin(viewerId);
    const id = boardId(rawId);
    let itemId;
    try {
      itemId = parseId(rawItemId);
    } catch {
      throw new NotFoundError(NOT_IN_BOARD);
    }
    const result = await boards.removeItem(id, viewerId, itemId);
    if (result === null) throw new NotFoundError(BOARD_UNAVAILABLE);
    if (result === false) throw new NotFoundError(NOT_IN_BOARD);
    return { deleted: true };
  }

  /** Sus tableros para el botón «+ A un tablero», diciendo en cuáles ya está. */
  async function listMineFor(viewerId, query = {}) {
    requireLogin(viewerId);
    const item = parseNewItem({ kind: query.kind, id: query.id });
    return { items: await boards.findMineFor(viewerId, item) };
  }

  return { create, get, update, remove, addItem, removeItem, listMineFor };
}

module.exports = { createBoardService, BOARD_UNAVAILABLE, ALREADY_IN_BOARD };
