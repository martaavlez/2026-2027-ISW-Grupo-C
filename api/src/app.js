const cors = require('cors');
const express = require('express');
const { rateLimit } = require('express-rate-limit');
const helmet = require('helmet');

const { createAuthService } = require('./auth/auth-service');
const { createCredentialsRepository } = require('./auth/credentials-repository');
const { createLoginService } = require('./auth/login-service');
const { createViewerResolver, optionalViewer } = require('./auth/viewer');
const { createCatalogRepository } = require('./catalog/catalog-repository');
const { createCatalogService } = require('./catalog/catalog-service');
const config = require('./config');
const { ApiError } = require('./errors');
const { createAuthRouter, createSessionRouter } = require('./routes/auth');
const { createCatalogRouter } = require('./routes/catalog');
const { createFavoriteRouter } = require('./routes/favorites');
const { createFriendRouter } = require('./routes/friends');
const { createProfileRouter } = require('./routes/profile');
const { createRatingRouter } = require('./routes/ratings');
const { createReviewRouter } = require('./routes/reviews');
const { createSearchRouter } = require('./routes/search');
const { createSearchRepository } = require('./search/search-repository');
const { createSearchService } = require('./search/search-service');
const { createHealthRouter } = require('./routes/health');
const { createFavoriteRepository } = require('./favorites/favorite-repository');
const { createFavoriteService } = require('./favorites/favorite-service');
const { createFriendRepository } = require('./friends/friend-repository');
const { createFriendService } = require('./friends/friend-service');
const { createProfileRepository } = require('./profile/profile-repository');
const { createProfileService } = require('./profile/profile-service');
const { createRatingRepository } = require('./ratings/rating-repository');
const { createRatingService } = require('./ratings/rating-service');
const { createReviewRepository } = require('./reviews/review-repository');
const { createReviewService } = require('./reviews/review-service');
const { createUserRepository } = require('./users/user-repository');

// Comprobaciones de sesión por IP y minuto (más generoso: se hace cada vez que se abre la web).
const SESSION_CHECK_RATE_LIMIT = { windowMs: 60 * 1000, limit: 120 };

const tokenOptions = { secret: config.jwtSecret, expiresIn: config.jwtExpiresIn };

function createDefaultServices(db) {
  const users = createUserRepository(db.pool);
  const catalog = createCatalogRepository(db.pool);
  const reviews = createReviewRepository(db.pool);
  const ratings = createRatingRepository(db.pool);
  const favorites = createFavoriteRepository(db.pool);
  const profiles = createProfileRepository(db.pool);
  const friends = createFriendRepository(db.pool);
  return {
    authService: createAuthService({ users, tokenOptions }),
    loginService: createLoginService({
      credentials: createCredentialsRepository(db.pool),
      tokenOptions,
    }),
    resolveViewer: createViewerResolver({ users, secret: config.jwtSecret }),
    catalogService: createCatalogService({ catalog, reviews, ratings, favorites }),
    favoriteService: createFavoriteService({ favorites }),
    profileService: createProfileService({ profiles, favorites, friends }),
    friendService: createFriendService({ friends, profiles }),
    ratingService: createRatingService({ ratings, catalog }),
    reviewService: createReviewService({ reviews, catalog }),
    searchService: createSearchService({ searchRepository: createSearchRepository(db.pool) }),
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
  reviewPublishLimit,
  friendChangesLimit,
}) {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '10kb' }));

  app.use('/health', createHealthRouter(db));
  // GET /auth/me se consulta al abrir la web: va antes del límite de intentos de /auth.
  app.use(
    '/auth/me',
    createLimiter(SESSION_CHECK_RATE_LIMIT, 'Demasiadas peticiones. Espera un momento.'),
    createSessionRouter(services.loginService),
  );
  app.use(
    '/auth',
    createLimiter(authRateLimit, 'Demasiados intentos. Espera unos minutos y vuelve a probar.'),
    createAuthRouter(services.authService, services.loginService),
  );
  app.use(
    ['/albums', '/songs', '/artists', '/search', '/me', '/users'],
    createLimiter(readRateLimit, 'Demasiadas peticiones. Espera un momento y vuelve a probar.'),
    optionalViewer(services.resolveViewer ?? visitorOnly),
  );
  app.use(createCatalogRouter(services.catalogService));
  app.use(createRatingRouter(services.ratingService));
  app.use(createFavoriteRouter(services.favoriteService));
  app.use(createProfileRouter(services.profileService));
  app.use(createReviewRouter(services.reviewService, reviewPublishLimit));
  app.use(createFriendRouter(services.friendService, friendChangesLimit));
  app.use('/search', createSearchRouter(services.searchService));

  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });
  app.use(handleError);

  return app;
}

module.exports = { createApp };
