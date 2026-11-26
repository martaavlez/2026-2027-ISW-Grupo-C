const cors = require('cors');
const express = require('express');
const { rateLimit } = require('express-rate-limit');
const helmet = require('helmet');

const { createAuthService } = require('./auth/auth-service');
const { createViewerResolver, optionalViewer } = require('./auth/viewer');
const { createCatalogRepository } = require('./catalog/catalog-repository');
const { createCatalogService } = require('./catalog/catalog-service');
const config = require('./config');
const { ApiError } = require('./errors');
const { createAuthRouter } = require('./routes/auth');
const { createCatalogRouter } = require('./routes/catalog');
const { createHealthRouter } = require('./routes/health');
const { createReviewRepository } = require('./reviews/review-repository');
const { createUserRepository } = require('./users/user-repository');

function createDefaultServices(db) {
  const users = createUserRepository(db.pool);
  return {
    authService: createAuthService({
      users,
      tokenOptions: { secret: config.jwtSecret, expiresIn: config.jwtExpiresIn },
    }),
    resolveViewer: createViewerResolver({ users, secret: config.jwtSecret }),
    catalogService: createCatalogService({
      catalog: createCatalogRepository(db.pool),
      reviews: createReviewRepository(db.pool),
    }),
  };
}

function createLimiter({ windowMs, limit }, message) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: message },
  });
}

const visitorOnly = async () => null;

// Solo los errores propios enseñan su mensaje; el resto es un 500 sin detalles internos.
// eslint-disable-next-line no-unused-vars
function handleError(error, req, res, next) {
  if (error instanceof ApiError) {
    const { errors, passwordRequirements } = error;
    return res.status(error.status).json({ error: error.message, errors, passwordRequirements });
  }
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición no es JSON válido' });
  }
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'La petición es demasiado grande' });
  }
  console.error(error);
  return res.status(500).json({ error: 'Error interno del servidor' });
}

/**
 * Crea la aplicación Express. Los servicios y el límite de intentos se pueden
 * sustituir en los tests; si no se pasan, se usan los reales.
 */
function createApp({
  db,
  services = createDefaultServices(db),
  authRateLimit = config.authRateLimit,
  readRateLimit = config.readRateLimit,
}) {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '10kb' }));

  app.use('/health', createHealthRouter(db));
  app.use(
    '/auth',
    createLimiter(authRateLimit, 'Demasiados intentos. Espera unos minutos y vuelve a probar.'),
    createAuthRouter(services.authService),
  );
  app.use(
    ['/albums', '/songs', '/artists'],
    createLimiter(readRateLimit, 'Demasiadas peticiones. Espera un momento y vuelve a probar.'),
    optionalViewer(services.resolveViewer ?? visitorOnly),
  );
  app.use(createCatalogRouter(services.catalogService));

  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });
  app.use(handleError);

  return app;
}

module.exports = { createApp };
