const { Pool } = require('pg');

const config = require('./config');

const pool = new Pool({ connectionString: config.databaseUrl });

async function checkConnection() {
  await pool.query('SELECT 1');
}

module.exports = { pool, checkConnection };
