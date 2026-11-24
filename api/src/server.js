const { createApp } = require('./app');
const { createCatalogImport } = require('./catalog-import');
const config = require('./config');
const db = require('./db');

const app = createApp({ db });

app.listen(config.port, () => {
  console.log(`API escuchando en http://localhost:${config.port}`);
});

// HU-20: importación diaria del catálogo. Solo se activa con IMPORT_ENABLED=true.
if (config.catalogImport.enabled) {
  const { importer, scheduler } = createCatalogImport({ pool: db.pool, config });
  importer
    .isDue()
    .then((runNow) => scheduler.start({ runNow }))
    .catch((error) => console.error(`No se ha podido programar la importación: ${error.message}`));
}
