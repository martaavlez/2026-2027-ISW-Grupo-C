const { Router } = require('express');

const { rateLimit } = require('express-rate-limit');

// Contra el abuso: como mucho 60 cambios de seguimiento por IP cada 15 minutos.
const FOLLOW_CHANGES_LIMIT = { windowMs: 15 * 60 * 1000, limit: 60 };

/**
 * Seguir. Quien actúa sale siempre del token.
 * HU-10 · PUT /users/:username/follow    HU-48 · DELETE /users/:username/follow
 * GET /me/following?offset=              (a quién sigues)
 */
function createFollowRouter(followService, limit = FOLLOW_CHANGES_LIMIT) {
  const router = Router();
  const limiter = rateLimit({
    ...limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Has hecho muchos cambios seguidos. Espera unos minutos.' },
  });

  router.put('/users/:username/follow', limiter, async (req, res) => {
    res.json(await followService.follow(req.viewerId, req.params.username));
  });
  router.delete('/users/:username/follow', limiter, async (req, res) => {
    res.json(await followService.unfollow(req.viewerId, req.params.username));
  });
  router.get('/me/following', async (req, res) => {
    res.json(await followService.listFollowing(req.viewerId, req.query.offset));
  });
  return router;
}

module.exports = { createFollowRouter, FOLLOW_CHANGES_LIMIT };
