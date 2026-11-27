const express = require('express');
const { rateLimit } = require('express-rate-limit');

const { ValidationError } = require('../errors');
const { MESSAGES } = require('../account/account-service');

// Contra el abuso: como mucho 30 cambios del perfil por IP cada 15 minutos (RNF-12).
const PROFILE_CHANGES_LIMIT = { windowMs: 15 * 60 * 1000, limit: 30 };
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * HU-45 · Editar mi perfil. Quien edita sale siempre del token.
 * PATCH /me/profile (nombre y biografía) · PUT y DELETE /me/photo (la foto, como imagen tal cual)
 * GET /users/:username/photo sirve la foto para mostrarla.
 */
function createAccountRouter(accountService, limit = PROFILE_CHANGES_LIMIT) {
  const router = express.Router();
  const limiter = rateLimit({
    ...limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Has hecho muchos cambios seguidos. Espera unos minutos.' },
  });
  // La foto llega como imagen, no como JSON; si pasa de 1 MB se corta antes de leerla entera.
  const photoBody = express.raw({ type: PHOTO_TYPES, limit: '1mb' });

  router.patch('/me/profile', limiter, async (req, res) => {
    res.json(await accountService.updateProfile(req.viewerId, req.body));
  });
  router.put('/me/photo', limiter, (req, res, next) => {
    photoBody(req, res, (error) => {
      if (error?.type === 'entity.too.large') {
        return next(new ValidationError({ photo: MESSAGES.photoTooBig }));
      }
      return next(error);
    });
  });
  router.put('/me/photo', async (req, res) => {
    res.json(await accountService.updatePhoto(req.viewerId, req.body));
  });
  router.delete('/me/photo', limiter, async (req, res) => {
    res.json(await accountService.removePhoto(req.viewerId));
  });
  router.get('/users/:username/photo', async (req, res) => {
    const photo = await accountService.getPhoto(req.params.username);
    res.set({
      'Content-Type': photo.type,
      // Se muestra desde la web (otro origen) como imagen y nunca se interpreta como otra cosa.
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'",
      // La dirección cambia con cada foto nueva (?v=), así que se puede guardar en caché.
      'Cache-Control': 'public, max-age=86400',
    });
    res.send(photo.data);
  });
  return router;
}

module.exports = { createAccountRouter, PROFILE_CHANGES_LIMIT };
