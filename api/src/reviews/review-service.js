// HU-23 · Escribir una reseña (PA-23-01 a 04).
const { UnauthorizedError } = require('../auth/auth-errors');
const { parseId, safeImageUrl } = require('../catalog/catalog-service');
const { ConflictError, NotFoundError } = require('../errors');
const { parseReview } = require('./review-rules');

const LOGIN_REQUIRED = 'Para escribir una reseña, inicia sesión o crea una cuenta.';
const NOT_FOUND = { album: 'El álbum no existe', song: 'La canción no existe' };
const ALREADY_PUBLISHED = 'Ya has publicado una reseña de este elemento.';

function createReviewService({ reviews, catalog }) {
  async function publish(kind, rawId, viewerId, input) {
    if (!viewerId) throw new UnauthorizedError(LOGIN_REQUIRED);
    const itemId = parseId(rawId);
    const { rating, body, privacy } = parseReview(input);

    const result = await reviews.publish({ kind, itemId, userId: viewerId, rating, body, privacy });
    if (!result) throw new NotFoundError(NOT_FOUND[kind]);
    if (result.alreadyPublished) throw new ConflictError({ body: ALREADY_PUBLISHED });

    const distribution = await catalog.findRatingDistribution(kind, itemId);
    const ratingsCount = Object.values(distribution).reduce((sum, value) => sum + value, 0);
    const { privacy: savedPrivacy, ...review } = result.review;
    return {
      myRating: rating,
      myReview: { body: review.body, privacy: savedPrivacy },
      averageRating: result.averageRating,
      ratingsCount,
      distribution,
      // Para añadirla arriba de la lista sin recargar la ficha.
      review: { ...review, photoUrl: safeImageUrl(review.photoUrl) },
    };
  }

  return { publish };
}

module.exports = { createReviewService, LOGIN_REQUIRED, ALREADY_PUBLISHED };
