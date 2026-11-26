// HU-07 · Marcar un favorito y HU-46 · Quitar un favorito.
const { UnauthorizedError } = require('../auth/auth-errors');
const { parseId, safeImageUrl } = require('../catalog/catalog-service');
const { NotFoundError } = require('../errors');

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

  async function listMine(viewerId) {
    requireViewer(viewerId);
    const found = await favorites.findByUser(viewerId);
    const withCover = (item) => ({ ...item, coverUrl: safeImageUrl(item.coverUrl) });
    return {
      songs: found.songs.map(withCover),
      albums: found.albums.map(withCover),
      artists: found.artists.map((artist) => ({
        ...artist,
        imageUrl: safeImageUrl(artist.imageUrl),
      })),
    };
  }

  return { setFavorite, listMine };
}

module.exports = { createFavoriteService, LOGIN_REQUIRED };
