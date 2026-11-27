const { Router } = require('express');

const { rateLimit } = require('express-rate-limit');

// Contra el abuso: como mucho 60 cambios en tableros por IP cada 15 minutos.
const BOARD_CHANGES_LIMIT = { windowMs: 15 * 60 * 1000, limit: 60 };

/**
 * Tableros. Quien actúa sale siempre del token; solo el dueño cambia su tablero (RN-13).
 * HU-09 · POST /boards                     HU-26 y HU-34 · PATCH /boards/:id
 * HU-50 · DELETE /boards/:id               HU-25 · POST /boards/:id/items
 * HU-49 · DELETE /boards/:id/items/:itemId GET /boards/:id y GET /me/boards?kind=&id=
 */
function createBoardRouter(boardService, limit = BOARD_CHANGES_LIMIT) {
  const router = Router();
  const limiter = rateLimit({
    ...limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Has hecho muchos cambios seguidos. Espera unos minutos.' },
  });

  router.post('/boards', limiter, async (req, res) => {
    res.status(201).json(await boardService.create(req.viewerId, req.body));
  });
  router.get('/boards/:id', async (req, res) => {
    res.json(await boardService.get(req.viewerId, req.params.id));
  });
  router.patch('/boards/:id', limiter, async (req, res) => {
    res.json(await boardService.update(req.viewerId, req.params.id, req.body));
  });
  router.delete('/boards/:id', limiter, async (req, res) => {
    res.json(await boardService.remove(req.viewerId, req.params.id));
  });
  router.post('/boards/:id/items', limiter, async (req, res) => {
    res.status(201).json(await boardService.addItem(req.viewerId, req.params.id, req.body));
  });
  router.delete('/boards/:id/items/:itemId', limiter, async (req, res) => {
    res.json(await boardService.removeItem(req.viewerId, req.params.id, req.params.itemId));
  });
  router.get('/me/boards', async (req, res) => {
    res.json(await boardService.listMineFor(req.viewerId, req.query));
  });
  return router;
}

module.exports = { createBoardRouter, BOARD_CHANGES_LIMIT };
