const { Router } = require('express');

const { rateLimit } = require('express-rate-limit');

// Contra el abuso: como mucho 30 bloqueos o desbloqueos por IP cada 15 minutos.
const BLOCK_CHANGES_LIMIT = { windowMs: 15 * 60 * 1000, limit: 30 };

/**
 * Bloquear. Quien actúa sale siempre del token.
 * HU-35 · PUT /users/:username/block    HU-56 · DELETE /users/:username/block
 * GET /me/blocks?offset=                (tu lista de bloqueados)
 */
function createBlockRouter(blockService, limit = BLOCK_CHANGES_LIMIT) {
  const router = Router();
  const limiter = rateLimit({
    ...limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Has hecho muchos cambios seguidos. Espera unos minutos.' },
  });

  router.put('/users/:username/block', limiter, async (req, res) => {
    res.json(await blockService.block(req.viewerId, req.params.username));
  });
  router.delete('/users/:username/block', limiter, async (req, res) => {
    res.json(await blockService.unblock(req.viewerId, req.params.username));
  });
  router.get('/me/blocks', async (req, res) => {
    res.json(await blockService.listBlocked(req.viewerId, req.query.offset));
  });
  return router;
}

module.exports = { createBlockRouter, BLOCK_CHANGES_LIMIT };
