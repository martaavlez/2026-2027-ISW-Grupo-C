// HU-04 · Consultar una canción o un álbum: arma la ficha que ve cada persona.
const { NotFoundError, ValidationError } = require('../errors');

const REVIEWS_PAGE_SIZE = 10;
const MAX_OFFSET = 10_000;
const ID_PATTERN = /^[1-9][0-9]{0,17}$/;
const OFFSET_PATTERN = /^[0-9]{1,5}$/;

function parseId(value) {
  if (!ID_PATTERN.test(value ?? ''))
    throw new ValidationError({ id: 'El identificador no es válido.' });
  return value;
}

function parseOffset(value) {
  if (value === undefined) return 0;
  if (!OFFSET_PATTERN.test(value) || Number(value) > MAX_OFFSET) {
    throw new ValidationError({ offset: 'La posición no es válida.' });
  }
  return Number(value);
}

/** Solo se devuelven imágenes https: así nadie puede colar un enlace javascript: o data:. */
function safeImageUrl(url) {
  try {
    return url && new URL(url).protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

function sumValues(distribution) {
  return Object.values(distribution).reduce((sum, value) => sum + value, 0);
}

function toPublicReview(review) {
  return { ...review, photoUrl: safeImageUrl(review.photoUrl) };
}

const NO_RATINGS = { findMine: async () => null, findDefaultPrivacy: async () => null };

/** Lo que el usuario que mira ya tiene en ese elemento: su nota, su reseña y su privacidad por defecto. */
function viewerPart(mine, defaultPrivacy) {
  return {
    myRating: mine?.rating ?? null,
    myReview: mine?.body ? { body: mine.body, privacy: mine.privacy } : null,
    defaultPrivacy,
  };
}

function createCatalogService({ catalog, reviews, ratings = NO_RATINGS }) {
  async function findReviewsPage(kind, itemId, viewerId, offset) {
    const page = await reviews.findVisible({
      kind,
      itemId,
      viewerId,
      limit: REVIEWS_PAGE_SIZE,
      offset,
    });
    return {
      total: page.total,
      pageSize: REVIEWS_PAGE_SIZE,
      offset,
      items: page.items.map(toPublicReview),
    };
  }

  async function ratingSummary(kind, id, averageRating) {
    const distribution = await catalog.findRatingDistribution(kind, id);
    const ratingsCount = sumValues(distribution);
    return { averageRating: ratingsCount ? averageRating : null, ratingsCount, distribution };
  }

  async function getAlbum(rawId, viewerId) {
    const id = parseId(rawId);
    const album = await catalog.findAlbum(id);
    if (!album) throw new NotFoundError('El álbum no existe');
    const [artists, songs, rating, reviewsPage, mine, defaultPrivacy] = await Promise.all([
      catalog.findAlbumArtists(id),
      catalog.findAlbumSongs(id),
      ratingSummary('album', id, album.averageRating),
      findReviewsPage('album', id, viewerId, 0),
      ratings.findMine('album', id, viewerId),
      ratings.findDefaultPrivacy(viewerId),
    ]);
    return {
      ...album,
      ...viewerPart(mine, defaultPrivacy),
      coverUrl: safeImageUrl(album.coverUrl),
      ...rating,
      artists,
      songs,
      totalDurationSeconds: songs.reduce((sum, song) => sum + song.durationSeconds, 0),
      reviews: reviewsPage,
    };
  }

  async function getSong(rawId, viewerId) {
    const id = parseId(rawId);
    const song = await catalog.findSong(id);
    if (!song) throw new NotFoundError('La canción no existe');
    const [artists, rating, reviewsPage, mine, defaultPrivacy] = await Promise.all([
      catalog.findSongArtists(id),
      ratingSummary('song', id, song.averageRating),
      findReviewsPage('song', id, viewerId, 0),
      ratings.findMine('song', id, viewerId),
      ratings.findDefaultPrivacy(viewerId),
    ]);
    return {
      id: song.id,
      ...viewerPart(mine, defaultPrivacy),
      title: song.title,
      trackNumber: song.trackNumber,
      durationSeconds: song.durationSeconds,
      genre: song.genre,
      ...rating,
      album: {
        id: song.albumId,
        title: song.albumTitle,
        coverUrl: safeImageUrl(song.albumCoverUrl),
        type: song.albumType,
        releaseYear: song.albumReleaseYear,
      },
      artists,
      reviews: reviewsPage,
    };
  }

  /** HU-59 · Ficha de un artista: su información y sus álbumes (PA-59-01). */
  async function getArtist(rawId) {
    const id = parseId(rawId);
    const artist = await catalog.findArtist(id);
    if (!artist) throw new NotFoundError('El artista no existe');
    const [albums, songsCount] = await Promise.all([
      catalog.findArtistAlbums(id),
      catalog.countArtistSongs(id),
    ]);
    const imageUrl = safeImageUrl(artist.imageUrl);
    return {
      ...artist,
      imageUrl,
      // El crédito (autor y licencia) solo tiene sentido si se muestra la foto.
      imageCredit: imageUrl ? (artist.imageCredit ?? null) : null,
      songsCount,
      albums: albums.map((album) => ({ ...album, coverUrl: safeImageUrl(album.coverUrl) })),
    };
  }

  /** Siguiente página de reseñas ("Ver más reseñas"). */
  async function getReviews(kind, rawId, viewerId, rawOffset) {
    const id = parseId(rawId);
    const offset = parseOffset(rawOffset);
    const exists = kind === 'album' ? await catalog.findAlbum(id) : await catalog.findSong(id);
    if (!exists)
      throw new NotFoundError(kind === 'album' ? 'El álbum no existe' : 'La canción no existe');
    return findReviewsPage(kind, id, viewerId, offset);
  }

  return { getAlbum, getSong, getArtist, getReviews };
}

module.exports = { createCatalogService, safeImageUrl, parseId, REVIEWS_PAGE_SIZE };
