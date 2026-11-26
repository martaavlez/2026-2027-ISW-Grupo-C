const { Router } = require('express');

/** HU-06 · GET /me/profile: el perfil de quien tiene la sesión (sale siempre del token). */
function createProfileRouter(profileService) {
  const router = Router();
  router.get('/me/profile', async (req, res) => {
    res.json(await profileService.getOwnProfile(req.viewerId));
  });
  router.get('/me/reviews', async (req, res) => {
    res.json(await profileService.getOwnReviews(req.viewerId, req.query.offset));
  });
  return router;
}

module.exports = { createProfileRouter };
