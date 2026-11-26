// HU-07 · Marcar un favorito y HU-46 · Quitar un favorito.
const { UnauthorizedError } = require('../auth/auth-errors');
const { parseId, safeImageUrl } = require('../catalog/catalog-service');
const { NotFoundError, ValidationError } = require('../errors');

const PAGE_SIZE = 24;
const PREVIEW_SIZE = 6;
const TYPES = new Map([
  ['songs', 'song'],
  ['albums', 'album'],
  ['artists', 'artist'],
]);
const OFFSET_PATTERN = /^[0-9]{1,5}$/;

const withCover = (item) => ({ ...item, coverUrl: safeImageUrl(item.coverUrl) });
const withImage = (artist) => ({ ...artist, imageUrl: safeImageUrl(artist.imageUrl) });
const SAFE = { song: withCover, album: withCover, artist: withImage };

function parseOffset(value) {
  if (value === undefined) return 0;
  if (typeof value !== 'string' || !OFFSET_PATTERN.test(value))
    throw new ValidationError({ offset: 'La posición no es válida.' });
  return Number(value);
}

/** Primera página de cada subcategoría, con imágenes seguras (la usa el perfil). */
async function previewFavorites(favorites, userId) {
  const found = await favorites.findByUser(userId, { limit: PREVIEW_SIZE });
  const section = (kind, page) => ({ ...page, items: page.items.map(SAFE[kind]) });
  return {
    songs: section('song', found.songs),
    albums: section('album', found.albums),
    artists: section('artist', found.artists),
  };
}

const LOGIN_REQUIRED = 'Para guardar favoritos, inicia sesión o crea una cuenta.';
const NOT_FOUND = {
  song: 'La canción no existe',
  album: 'El álbum no existe',
  artist: 'El artista no existe',
};

function requireViewer(viewerId) {
  if (!viewerId) throw new UnauthorizedError(LOGIN_REQUIRED);
}

function createFavoriteService({ favorites }) {
  async function setFavorite(kind, rawId, viewerId, favorite) {
    requireViewer(viewerId);
    const itemId = parseId(rawId);
    const exists = favorite
      ? await favorites.add(kind, itemId, viewerId)
      : await favorites.remove(kind, itemId, viewerId);
    if (!exists) throw new NotFoundError(NOT_FOUND[kind]);
    return { favorite };
  }

  /**
   * Una página de una subcategoría de sus favoritos («Ver más» en la carpeta Favoritos).
   * `type` es songs, albums o artists; `offset`, desde dónde seguir.
   */
  async function listMine(viewerId, rawType, rawOffset) {
    requireViewer(viewerId);
    const kind = typeof rawType === 'string' ? TYPES.get(rawType) : undefined;
    if (!kind) throw new ValidationError({ type: 'Elige canciones, álbumes o artistas.' });
    const offset = parseOffset(rawOffset);
    const page = await favorites.findPage(viewerId, kind, { limit: PAGE_SIZE, offset });
    return { ...page, offset, pageSize: PAGE_SIZE, items: page.items.map(SAFE[kind]) };
  }

  return { setFavorite, listMine };
}

module.exports = {
  createFavoriteService,
  previewFavorites,
  LOGIN_REQUIRED,
  PAGE_SIZE,
  PREVIEW_SIZE,
};
