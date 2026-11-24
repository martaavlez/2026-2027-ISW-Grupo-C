const { createApp } = require('./app');
const config = require('./config');
const db = require('./db');

const app = createApp({ db });

app.listen(config.port, () => {
  console.log(`API escuchando en http://localhost:${config.port}`);
});
