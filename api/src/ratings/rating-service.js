// HU-05 · Valorar una canción o un álbum (PA-05-01 a 04).
const { UnauthorizedError } = require('../auth/auth-errors');
const { parseId } = require('../catalog/catalog-service');
const { NotFoundError, ValidationError } = require('../errors');

const RATING_ERROR = 'La valoración debe ser un número entero del 1 al 5.';
const LOGIN_REQUIRED = 'Para valorar, inicia sesión o crea una cuenta.';
const NOT_FOUND = { album: 'El álbum no existe', song: 'La canción no existe' };

/** RN-06: entero del 1 al 5. Se comprueba aquí aunque la pantalla solo ofrezca 5 estrellas. */
function parseRating(value) {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 5) {
    throw new ValidationError({ rating: RATING_ERROR });
  }
  return value;
}

function createRatingService({ ratings, catalog }) {
  async function rate(kind, rawId, viewerId, body) {
    // PA-05-04: un visitante no puede valorar.
    if (!viewerId) throw new UnauthorizedError(LOGIN_REQUIRED);
    const itemId = parseId(rawId);
    const rating = parseRating(body?.rating);

    const averageRating = await ratings.saveRating({ kind, itemId, userId: viewerId, rating });
    if (averageRating === undefined) throw new NotFoundError(NOT_FOUND[kind]);

    const distribution = await catalog.findRatingDistribution(kind, itemId);
    const ratingsCount = Object.values(distribution).reduce((sum, value) => sum + value, 0);
    return { myRating: rating, averageRating, ratingsCount, distribution };
  }

  return { rate };
}

module.exports = { createRatingService, RATING_ERROR, LOGIN_REQUIRED };
