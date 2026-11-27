const { Router } = require('express');
const { rateLimit } = require('express-rate-limit');

// Contra el spam: como mucho 30 cambios de reseñas (publicar, editar o borrar) por IP cada 15 minutos.
const PUBLISH_LIMIT = { windowMs: 15 * 60 * 1000, limit: 30 };

/**
 * Reseña de un álbum o una canción. El autor sale siempre del token (RN-13).
 * HU-23 · PUT publica · HU-08 · PATCH edita · HU-47 · DELETE elimina.
 */
function createReviewRouter(reviewService, publishLimit = PUBLISH_LIMIT) {
  const router = Router();
  const limiter = rateLimit({
    ...publishLimit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Has hecho muchos cambios en reseñas seguidos. Espera unos minutos.' },
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

  for (const [path, kind] of [
    ['/albums/:id/review', 'album'],
    ['/songs/:id/review', 'song'],
  ]) {
    router.patch(path, limiter, async (req, res) => {
      res.json(await reviewService.edit(kind, req.params.id, req.viewerId, req.body));
    });
    router.delete(path, limiter, async (req, res) => {
      res.json(await reviewService.remove(kind, req.params.id, req.viewerId));
    });
  }

  return router;
}

module.exports = { createReviewRouter };
