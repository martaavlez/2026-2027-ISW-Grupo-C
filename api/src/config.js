require('dotenv').config({ quiet: true });

const { DEFAULT_GENRES, parseGenres } = require('./catalog-import/genres');

const isProduction = process.env.NODE_ENV === 'production';

function toInteger(value, fallback) {
  const number = Number.parseInt(value, 10);
  return Number.isNaN(number) ? fallback : number;
}

// RNF-11: la clave que firma los tokens. En producción es obligatoria y larga,
// porque con ella cualquiera podría fabricar un token válido.
function readJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (isProduction && (!secret || secret.length < 32)) {
    throw new Error('JWT_SECRET es obligatoria en producción y debe tener al menos 32 caracteres');
  }
  return secret || 'solo-para-desarrollo-no-usar-en-produccion';
}

const config = {
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL,
  corsOrigin: process.env.CORS_ORIGIN || '*',
  jwtSecret: readJwtSecret(),
  jwtExpiresIn: '24h',
  // Intentos permitidos por IP en las rutas de autenticación (frena ataques de fuerza bruta).
  authRateLimit: {
    windowMs: 15 * 60 * 1000,
    limit: toInteger(process.env.AUTH_RATE_LIMIT, 20),
  },
  musicBrainz: {
    baseUrl: process.env.MUSICBRAINZ_BASE_URL || 'https://musicbrainz.org/ws/2',
    // RNF-10: MusicBrainz exige que cada aplicación se identifique con su User-Agent.
    userAgent:
      process.env.MUSICBRAINZ_USER_AGENT ||
      'Repeat/1.0.0 ( https://github.com/martaavlez/2026-2027-ISW-Grupo-C )',
  },
  catalogImport: {
    enabled: process.env.IMPORT_ENABLED === 'true',
    genres: parseGenres(process.env.IMPORT_GENRES || DEFAULT_GENRES),
    initialLimitPerGenre: toInteger(process.env.IMPORT_INITIAL_LIMIT_PER_GENRE, 500),
    dailyLimitPerGenre: toInteger(process.env.IMPORT_DAILY_LIMIT_PER_GENRE, 1000),
    dailyHour: toInteger(process.env.IMPORT_DAILY_HOUR, 3),
  },
};

module.exports = config;
