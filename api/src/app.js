const cors = require('cors');
const express = require('express');

const config = require('./config');
const { createHealthRouter } = require('./routes/health');

function createApp({ db }) {
  const app = express();

  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());

  app.use('/health', createHealthRouter(db));

  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  return app;
}

module.exports = { createApp };
