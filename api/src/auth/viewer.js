// Quién está mirando una página pública: un usuario con sesión o un visitante.
const { verifySessionToken } = require('./token');

const BEARER = /^Bearer ([A-Za-z0-9._-]{1,2048})$/;

/**
 * Lee la cabecera Authorization y devuelve el id del usuario que mira, o null si es un visitante.
 * Un token caducado, mal firmado o de un usuario suspendido o borrado cuenta como visitante:
 * las páginas públicas se siguen viendo, pero solo con lo que ve cualquiera.
 */
function createViewerResolver({ users, secret }) {
  return async function resolveViewer(authorization) {
    const match = BEARER.exec(authorization ?? '');
    if (!match) return null;
    const userId = verifySessionToken(match[1], { secret });
    if (!userId) return null;
    return users.findActiveId(userId);
  };
}

/** Middleware que deja en req.viewerId el usuario que mira (o null). */
function optionalViewer(resolveViewer) {
  return async (req, res, next) => {
    req.viewerId = await resolveViewer(req.get('authorization'));
    next();
  };
}

module.exports = { createViewerResolver, optionalViewer };
