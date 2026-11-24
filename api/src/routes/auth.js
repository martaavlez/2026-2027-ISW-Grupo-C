const { Router } = require('express');

/** Rutas de autenticación. Solo traducen HTTP ↔ servicio; las reglas están en auth-service. */
function createAuthRouter(authService) {
  const router = Router();

  // HU-01 · Registrarse
  router.post('/register', async (req, res) => {
    const session = await authService.register(req.body);
    res.status(201).json(session);
  });

  return router;
}

module.exports = { createAuthRouter };
