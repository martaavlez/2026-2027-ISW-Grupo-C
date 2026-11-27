const { Router } = require('express');

const { rateLimit } = require('express-rate-limit');

// Contra el spam de solicitudes: como mucho 60 cambios de amistad por IP cada 15 minutos.
const FRIEND_CHANGES_LIMIT = { windowMs: 15 * 60 * 1000, limit: 60 };

/**
 * Amistades. Quien actúa sale siempre del token.
 * HU-41 · PUT y DELETE /users/:username/friend-request (enviar y cancelar)
 * HU-58 · POST /me/friend-requests/:id/accept y /reject
 * HU-42 · DELETE /users/:username/friendship
 */
function createFriendRouter(friendService, limit = FRIEND_CHANGES_LIMIT) {
  const router = Router();
  const limiter = rateLimit({
    ...limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Has hecho muchos cambios seguidos. Espera unos minutos.' },
  });

  router.put('/users/:username/friend-request', limiter, async (req, res) => {
    res.json(await friendService.sendRequest(req.viewerId, req.params.username));
  });
  router.delete('/users/:username/friend-request', limiter, async (req, res) => {
    res.json(await friendService.cancelRequest(req.viewerId, req.params.username));
  });
  router.delete('/users/:username/friendship', limiter, async (req, res) => {
    res.json(await friendService.removeFriend(req.viewerId, req.params.username));
  });
  router.post('/me/friend-requests/:id/accept', limiter, async (req, res) => {
    res.json(await friendService.respond(req.viewerId, req.params.id, true));
  });
  router.post('/me/friend-requests/:id/reject', limiter, async (req, res) => {
    res.json(await friendService.respond(req.viewerId, req.params.id, false));
  });
  router.get('/me/friend-requests', async (req, res) => {
    res.json(await friendService.listReceived(req.viewerId));
  });
  router.get('/me/friends', async (req, res) => {
    res.json(await friendService.listFriends(req.viewerId, req.query.offset));
  });
  return router;
}

module.exports = { createFriendRouter, FRIEND_CHANGES_LIMIT };
