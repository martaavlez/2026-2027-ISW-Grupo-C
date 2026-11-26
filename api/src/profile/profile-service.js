// HU-06 · Consultar mi perfil (PA-06-01).
const { UnauthorizedError } = require('../auth/auth-errors');
const { safeImageUrl } = require('../catalog/catalog-service');
const { ValidationError } = require('../errors');
const { previewFavorites } = require('../favorites/favorite-service');

const REVIEWS_PAGE_SIZE = 10;
const OFFSET_PATTERN = /^[0-9]{1,5}$/;
const withCover = (item) => ({ ...item, coverUrl: safeImageUrl(item.coverUrl) });

const LOGIN_REQUIRED = 'Inicia sesión para ver tu perfil.';

function createProfileService({ profiles, favorites }) {
  async function getOwnProfile(viewerId) {
    if (!viewerId) throw new UnauthorizedError(LOGIN_REQUIRED);
    const [profile, favoriteItems] = await Promise.all([
      profiles.findOwnProfile(viewerId, { reviewsLimit: REVIEWS_PAGE_SIZE }),
      previewFavorites(favorites, viewerId),
    ]);
    // Una sesión de una cuenta que ya no existe se trata como sin sesión.
    if (!profile) throw new UnauthorizedError(LOGIN_REQUIRED);

    return {
      user: { ...profile.user, photoUrl: safeImageUrl(profile.user.photoUrl) },
      counts: profile.counts,
      // Las reseñas y los favoritos van por páginas: con 200 no se cargan todos de golpe.
      reviews: {
        total: profile.counts.reviews,
        pageSize: REVIEWS_PAGE_SIZE,
        items: profile.reviews.map(withCover),
      },
      favorites: favoriteItems,
      boards: profile.boards.map(withCover),
    };
  }

  /** «Ver más reseñas» en la carpeta Reseñas. */
  async function getOwnReviews(viewerId, rawOffset = '0') {
    if (!viewerId) throw new UnauthorizedError(LOGIN_REQUIRED);
    if (typeof rawOffset !== 'string' || !OFFSET_PATTERN.test(rawOffset)) {
      throw new ValidationError({ offset: 'La posición no es válida.' });
    }
    const offset = Number(rawOffset);
    const items = await profiles.findReviews(viewerId, { limit: REVIEWS_PAGE_SIZE, offset });
    return { offset, pageSize: REVIEWS_PAGE_SIZE, items: items.map(withCover) };
  }

  return { getOwnProfile, getOwnReviews };
}

module.exports = { createProfileService, LOGIN_REQUIRED, REVIEWS_PAGE_SIZE };
