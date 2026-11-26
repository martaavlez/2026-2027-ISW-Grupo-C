const { Router } = require('express');

/** HU-04 y HU-59 · Fichas de álbum, canción y artista. Son públicas: con sesión se ven además las reseñas permitidas. */
function createCatalogRouter(catalogService) {
  const router = Router();

  router.get('/albums/:id', async (req, res) => {
    res.json(await catalogService.getAlbum(req.params.id, req.viewerId));
  });

  router.get('/albums/:id/reviews', async (req, res) => {
    res.json(
      await catalogService.getReviews('album', req.params.id, req.viewerId, req.query.offset),
    );
  });

  router.get('/songs/:id', async (req, res) => {
    res.json(await catalogService.getSong(req.params.id, req.viewerId));
  });

  router.get('/songs/:id/reviews', async (req, res) => {
    res.json(
      await catalogService.getReviews('song', req.params.id, req.viewerId, req.query.offset),
    );
  });

  router.get('/artists/:id', async (req, res) => {
    res.json(await catalogService.getArtist(req.params.id));
  });

  return router;
}

module.exports = { createCatalogRouter };
