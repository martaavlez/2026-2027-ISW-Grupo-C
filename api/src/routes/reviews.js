const { Router } = require('express');
const { rateLimit } = require('express-rate-limit');

// Contra el spam: como mucho 30 reseñas publicadas por IP cada 15 minutos.
const PUBLISH_LIMIT = { windowMs: 15 * 60 * 1000, limit: 30 };

/** HU-23 · PUT /albums/:id/review y PUT /songs/:id/review. El autor sale siempre del token. */
function createReviewRouter(reviewService, publishLimit = PUBLISH_LIMIT) {
  const router = Router();
  const limiter = rateLimit({
    ...publishLimit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Has publicado muchas reseñas seguidas. Espera unos minutos.' },
  });

  router.put('/albums/:id/review', limiter, async (req, res) => {
    res
      .status(201)
      .json(await reviewService.publish('album', req.params.id, req.viewerId, req.body));
  });

  router.put('/songs/:id/review', limiter, async (req, res) => {
    res
      .status(201)
      .json(await reviewService.publish('song', req.params.id, req.viewerId, req.body));
  });

  return router;
}

module.exports = { createReviewRouter };
