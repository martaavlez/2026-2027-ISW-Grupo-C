const { Router } = require('express');

const KINDS = { songs: 'song', albums: 'album', artists: 'artist' };

/**
 * HU-07 y HU-46 · PUT y DELETE /{songs|albums|artists}/:id/favorite, y GET /me/favorites.
 * El usuario sale siempre del token.
 */
function createFavoriteRouter(favoriteService) {
  const router = Router();

  for (const [path, kind] of Object.entries(KINDS)) {
    router.put(`/${path}/:id/favorite`, async (req, res) => {
      res.json(await favoriteService.setFavorite(kind, req.params.id, req.viewerId, true));
    });
    router.delete(`/${path}/:id/favorite`, async (req, res) => {
      res.json(await favoriteService.setFavorite(kind, req.params.id, req.viewerId, false));
    });
  }

  router.get('/me/favorites', async (req, res) => {
    res.json(await favoriteService.listMine(req.viewerId));
  });

  return router;
}

module.exports = { createFavoriteRouter };
