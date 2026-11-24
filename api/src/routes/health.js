const express = require('express');

function createHealthRouter({ checkConnection }) {
  const router = express.Router();

  router.get('/', (req, res) => {
    res.json({ status: 'ok' });
  });

  router.get('/db', async (req, res) => {
    try {
      await checkConnection();
      res.json({ database: 'ok' });
    } catch {
      res.status(503).json({ database: 'unavailable' });
    }
  });

  return router;
}

module.exports = { createHealthRouter };
