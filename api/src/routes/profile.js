const { Router } = require('express');

/**
 * HU-06 · GET /me/profile: el perfil de quien tiene la sesión (sale siempre del token).
 * HU-24 · GET /users/:username/profile: el de otro usuario, con lo que quien mira puede ver.
 */
function createProfileRouter(profileService) {
  const router = Router();
  router.get('/me/profile', async (req, res) => {
    res.json(await profileService.getOwnProfile(req.viewerId));
  });
  router.get('/me/reviews', async (req, res) => {
    res.json(await profileService.getOwnReviews(req.viewerId, req.query.offset));
  });
  router.get('/users/:username/profile', async (req, res) => {
    res.json(await profileService.getUserProfile(req.viewerId, req.params.username));
  });
  router.get('/users/:username/reviews', async (req, res) => {
    res.json(
      await profileService.getUserReviews(req.viewerId, req.params.username, req.query.offset),
    );
  });
  router.get('/users/:username/favorites', async (req, res) => {
    res.json(
      await profileService.getUserFavorites(
        req.viewerId,
        req.params.username,
        req.query.type,
        req.query.offset,
      ),
    );
  });
  return router;
}

module.exports = { createProfileRouter };
