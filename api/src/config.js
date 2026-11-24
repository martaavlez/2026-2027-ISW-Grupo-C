require('dotenv').config({ quiet: true });

const config = {
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL,
  corsOrigin: process.env.CORS_ORIGIN || '*',
};

module.exports = config;
