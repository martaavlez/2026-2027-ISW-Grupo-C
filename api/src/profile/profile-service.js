// HU-06 · Consultar mi perfil (PA-06-01) y HU-24 · Consultar el perfil de otro usuario
// (PA-24-01 a 03).
const { UnauthorizedError } = require('../auth/auth-errors');
const { safeImageUrl } = require('../catalog/catalog-service');
const { NotFoundError } = require('../errors');
const { favoritesPage, parseOffset, previewFavorites } = require('../favorites/favorite-service');
const { ALL_LEVELS } = require('./profile-repository');

const REVIEWS_PAGE_SIZE = 10;
const USERNAME_PATTERN = /^[A-Za-z0-9._]{3,30}$/;
const withCover = (item) => ({ ...item, coverUrl: safeImageUrl(item.coverUrl) });

const LOGIN_REQUIRED = 'Inicia sesión para ver tu perfil.';
// El mismo mensaje si no existe, está suspendido o hay un bloqueo: no se dice cuál de ellos es.
const PROFILE_UNAVAILABLE = 'Este perfil no está disponible.';
const FAVORITES_HIDDEN = 'Sus favoritos no son visibles para ti.';

// RN-08: un amigo ve lo público y lo de solo amigos; el resto, solo lo público.
const LEVELS_FOR_FRIEND = ['public', 'friends'];
const LEVELS_FOR_OTHERS = ['public'];

// Sin repositorio de amistades (en algunos tests) no hay solicitudes de por medio.
const NO_FRIENDS = { findState: async () => ({ friendship: 'none', requestId: null }) };

function createProfileService({ profiles, favorites, friends = NO_FRIENDS }) {
  /** Perfil con la primera página de reseñas y de favoritos (null si no se pueden ver). */
  async function buildProfile(content, favoritesVisible) {
    return {
      user: { ...content.user, photoUrl: safeImageUrl(content.user.photoUrl) },
      counts: { ...content.counts, favorites: favoritesVisible ? content.counts.favorites : null },
      // Las reseñas y los favoritos van por páginas: con 200 no se cargan todos de golpe.
      reviews: {
        total: content.counts.reviews,
        pageSize: REVIEWS_PAGE_SIZE,
        items: content.reviews.map(withCover),
      },
      favorites: favoritesVisible ? await previewFavorites(favorites, content.user.id) : null,
      boards: content.boards.map(withCover),
    };
  }

  async function getOwnProfile(viewerId) {
    if (!viewerId) throw new UnauthorizedError(LOGIN_REQUIRED);
    const content = await profiles.findOwnProfile(viewerId, { reviewsLimit: REVIEWS_PAGE_SIZE });
    // Una sesión de una cuenta que ya no existe se trata como sin sesión.
    if (!content) throw new UnauthorizedError(LOGIN_REQUIRED);
    return buildProfile(content, true);
  }

  /** «Ver más reseñas» en la carpeta Reseñas. */
  async function getOwnReviews(viewerId, rawOffset = '0') {
    if (!viewerId) throw new UnauthorizedError(LOGIN_REQUIRED);
    const offset = parseOffset(rawOffset);
    const items = await profiles.findReviews(viewerId, { limit: REVIEWS_PAGE_SIZE, offset });
    return { offset, pageSize: REVIEWS_PAGE_SIZE, items: items.map(withCover) };
  }

  /**
   * Quién es el otro usuario y qué puede ver quien mira. Si no existe, está suspendido o hay
   * un bloqueo entre los dos (PA-24-03, RN-12), no se muestra.
   */
  async function access(viewerId, rawUsername) {
    if (typeof rawUsername !== 'string' || !USERNAME_PATTERN.test(rawUsername)) {
      throw new NotFoundError(PROFILE_UNAVAILABLE);
    }
    const user = await profiles.findByUsername(rawUsername);
    if (!user) throw new NotFoundError(PROFILE_UNAVAILABLE);
    const isMe = viewerId === user.id;
    const relation = isMe
      ? { friends: false, following: false, blocked: false }
      : await profiles.findRelationship(viewerId, user.id);
    if (relation.blocked) throw new NotFoundError(PROFILE_UNAVAILABLE);

    let levels = LEVELS_FOR_OTHERS;
    if (isMe) levels = ALL_LEVELS;
    else if (relation.friends) levels = LEVELS_FOR_FRIEND;
    // RN-10: seguir no da acceso a más contenido que el público (PA-10-02).
    return {
      user,
      levels,
      isMe,
      isFriend: relation.friends,
      isFollowing: Boolean(relation.following),
    };
  }

  async function canSeeFavorites({ user, levels }) {
    return levels.includes(await profiles.findFavoritesVisibility(user.id));
  }

  /** HU-24 · El perfil de otro usuario con lo que quien mira puede ver (PA-24-01 y 02). */
  async function getUserProfile(viewerId, rawUsername) {
    const seen = await access(viewerId, rawUsername);
    const [content, favoritesVisible, friendship] = await Promise.all([
      profiles.findContent(seen.user, { reviewsLimit: REVIEWS_PAGE_SIZE, levels: seen.levels }),
      canSeeFavorites(seen),
      // HU-41 · Para el botón de amistad: amigos, solicitud enviada, recibida o nada.
      viewerId && !seen.isMe
        ? friends.findState(viewerId, seen.user.id)
        : { friendship: 'none', requestId: null },
    ]);
    return {
      ...(await buildProfile(content, favoritesVisible)),
      relationship: {
        isMe: seen.isMe,
        isFriend: seen.isFriend,
        isFollowing: seen.isFollowing,
        ...friendship,
      },
    };
  }

  /** «Ver más reseñas» en el perfil de otro usuario. */
  async function getUserReviews(viewerId, rawUsername, rawOffset) {
    const seen = await access(viewerId, rawUsername);
    const offset = parseOffset(rawOffset);
    const items = await profiles.findReviews(seen.user.id, {
      limit: REVIEWS_PAGE_SIZE,
      offset,
      levels: seen.levels,
    });
    return { offset, pageSize: REVIEWS_PAGE_SIZE, items: items.map(withCover) };
  }

  /** «Ver más» de sus favoritos, solo si puede verlos. */
  async function getUserFavorites(viewerId, rawUsername, rawType, rawOffset) {
    const seen = await access(viewerId, rawUsername);
    if (!(await canSeeFavorites(seen))) throw new NotFoundError(FAVORITES_HIDDEN);
    return favoritesPage(favorites, seen.user.id, rawType, rawOffset);
  }

  return { getOwnProfile, getOwnReviews, getUserProfile, getUserReviews, getUserFavorites };
}

module.exports = {
  createProfileService,
  LOGIN_REQUIRED,
  REVIEWS_PAGE_SIZE,
  PROFILE_UNAVAILABLE,
  FAVORITES_HIDDEN,
};
