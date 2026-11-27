// HU-23 · Escribir una reseña (PA-23-01 a 04), HU-08 · Editarla (PA-08-01 y 02)
// y HU-47 · Eliminarla (PA-47-01).
const { UnauthorizedError } = require('../auth/auth-errors');
const { parseId, safeImageUrl } = require('../catalog/catalog-service');
const { ConflictError, NotFoundError } = require('../errors');
const { parseReview } = require('./review-rules');

const LOGIN_REQUIRED = 'Para escribir una reseña, inicia sesión o crea una cuenta.';
const NOT_FOUND = { album: 'El álbum no existe', song: 'La canción no existe' };
const ALREADY_PUBLISHED = 'Ya has publicado una reseña de este elemento.';
const LOGIN_TO_CHANGE = 'Para cambiar tu reseña, inicia sesión.';
// RN-13: también si la reseña es de otra persona; solo se ven las propias.
const NO_REVIEW = 'No tienes una reseña publicada de este elemento.';

function createReviewService({ reviews, catalog }) {
  /** Nota media, número de valoraciones y reparto tras el cambio, para la ficha. */
  async function summary(kind, itemId, averageRating) {
    const distribution = await catalog.findRatingDistribution(kind, itemId);
    const ratingsCount = Object.values(distribution).reduce((sum, value) => sum + value, 0);
    return { averageRating, ratingsCount, distribution };
  }

  /** Lo que devuelven publicar y editar: el resumen y la reseña para la lista. */
  async function withReview(kind, itemId, rating, result) {
    const { privacy, ...review } = result.review;
    return {
      myRating: rating,
      myReview: { body: review.body, privacy },
      ...(await summary(kind, itemId, result.averageRating)),
      // Para ponerla en la lista sin recargar la ficha.
      review: { ...review, photoUrl: safeImageUrl(review.photoUrl) },
    };
  }

  async function publish(kind, rawId, viewerId, input) {
    if (!viewerId) throw new UnauthorizedError(LOGIN_REQUIRED);
    const itemId = parseId(rawId);
    const { rating, body, privacy } = parseReview(input);

    const result = await reviews.publish({ kind, itemId, userId: viewerId, rating, body, privacy });
    if (!result) throw new NotFoundError(NOT_FOUND[kind]);
    if (result.refused) throw new ConflictError({ body: ALREADY_PUBLISHED });
    return withReview(kind, itemId, rating, result);
  }

  /** PA-08-01: nuevo texto, valoración o privacidad; la media se recalcula. */
  async function edit(kind, rawId, viewerId, input) {
    if (!viewerId) throw new UnauthorizedError(LOGIN_TO_CHANGE);
    const itemId = parseId(rawId);
    const { rating, body, privacy } = parseReview(input);

    const result = await reviews.edit({ kind, itemId, userId: viewerId, rating, body, privacy });
    if (!result) throw new NotFoundError(NOT_FOUND[kind]);
    if (result.refused) throw new NotFoundError(NO_REVIEW);
    return withReview(kind, itemId, rating, result);
  }

  /** PA-47-01: deja de verse en la ficha y en el perfil, y la media se recalcula. */
  async function remove(kind, rawId, viewerId) {
    if (!viewerId) throw new UnauthorizedError(LOGIN_TO_CHANGE);
    const itemId = parseId(rawId);

    const result = await reviews.remove({ kind, itemId, userId: viewerId });
    if (!result) throw new NotFoundError(NOT_FOUND[kind]);
    if (result.refused) throw new NotFoundError(NO_REVIEW);
    return {
      myRating: null,
      myReview: null,
      ...(await summary(kind, itemId, result.averageRating)),
      removedReviewId: result.removedId,
    };
  }

  return { publish, edit, remove };
}

module.exports = {
  createReviewService,
  LOGIN_REQUIRED,
  ALREADY_PUBLISHED,
  LOGIN_TO_CHANGE,
  NO_REVIEW,
};
