const { Router } = require('express');

/** Rutas de autenticación. Solo traducen HTTP ↔ servicio; las reglas están en auth-service. */
function createAuthRouter(authService, loginService) {
  const router = Router();

  // HU-01 · Registrarse
  router.post('/register', async (req, res) => {
    const session = await authService.register(req.body);
    res.status(201).json(session);
  });

  // HU-02 · Iniciar sesión
  router.post('/login', async (req, res) => {
    res.json(await loginService.login(req.body));
  });

  return router;
}

/** HU-02 · PA-02-04: GET /auth/me devuelve el usuario del token, o 401 si no vale. */
function createSessionRouter(loginService) {
  const router = Router();
  router.get('/', async (req, res) => {
    res.json(await loginService.currentUser(req.get('authorization')));
  });
  return router;
}

module.exports = { createAuthRouter, createSessionRouter };
