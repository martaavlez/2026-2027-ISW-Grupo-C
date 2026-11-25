const { createCatalogImporter } = require('./catalog-importer');
const { createCatalogRepository } = require('./catalog-repository');
const { createImportScheduler } = require('./import-scheduler');
const { createMusicBrainzClient } = require('./musicbrainz-client');

/** Une las piezas de la importación con la configuración de la API. */
function createCatalogImport({ pool, config, musicBrainz, logger = console }) {
  const repository = createCatalogRepository(pool);
  const importer = createCatalogImporter({
    musicBrainz: musicBrainz ?? createMusicBrainzClient(config.musicBrainz),
    repository,
    genres: config.catalogImport.genres,
    initialLimitPerGenre: config.catalogImport.initialLimitPerGenre,
    dailyLimitPerGenre: config.catalogImport.dailyLimitPerGenre,
    logger,
  });
  const scheduler = createImportScheduler({
    runImport: () => importer.importNewReleases(),
    dailyHour: config.catalogImport.dailyHour,
    logger,
  });
  return { repository, importer, scheduler };
}

module.exports = { createCatalogImport };
