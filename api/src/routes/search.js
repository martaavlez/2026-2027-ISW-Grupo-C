const { Router } = require('express');

/** HU-03 · GET /search?q=texto. Pública; con sesión se aplican los bloqueos (RN-12). */
function createSearchRouter(searchService) {
  const router = Router();

  router.get('/', async (req, res) => {
    res.json(await searchService.search(req.query.q, req.viewerId));
  });

  return router;
}

module.exports = { createSearchRouter };
