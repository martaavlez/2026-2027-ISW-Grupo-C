require('dotenv').config({ quiet: true });

const { DEFAULT_GENRES, parseGenres } = require('./catalog-import/genres');

function toInteger(value, fallback) {
  const number = Number.parseInt(value, 10);
  return Number.isNaN(number) ? fallback : number;
}

const config = {
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL,
  corsOrigin: process.env.CORS_ORIGIN || '*',
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
