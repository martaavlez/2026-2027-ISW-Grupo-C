const { Router } = require('express');

/** HU-05 · PUT /albums/:id/rating y PUT /songs/:id/rating. El usuario sale siempre del token. */
function createRatingRouter(ratingService) {
  const router = Router();

  router.put('/albums/:id/rating', async (req, res) => {
    res.json(await ratingService.rate('album', req.params.id, req.viewerId, req.body));
  });

  router.put('/songs/:id/rating', async (req, res) => {
    res.json(await ratingService.rate('song', req.params.id, req.viewerId, req.body));
  });

  return router;
}

module.exports = { createRatingRouter };
