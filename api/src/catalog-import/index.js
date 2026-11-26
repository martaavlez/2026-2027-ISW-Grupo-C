const { createArtistImageFinder } = require('./artist-images');
const { createCatalogImporter } = require('./catalog-importer');
const { createCatalogRepository } = require('./catalog-repository');
const { createImportScheduler } = require('./import-scheduler');
const { createMusicBrainzClient } = require('./musicbrainz-client');
const { createWikimediaClient } = require('./wikimedia-client');

/** El cliente de Wikimedia se crea la primera vez que hace falta (no en cada arranque). */
function lazyWikimediaClient(config) {
  let client = null;
  const get = () => {
    client ??= createWikimediaClient({ userAgent: config.musicBrainz.userAgent });
    return client;
  };
  return {
    getImageFileName: (wikidataId) => get().getImageFileName(wikidataId),
    getImageInfo: (fileName) => get().getImageInfo(fileName),
  };
}

/** Importación diaria y, si sale bien, las fotos de los artistas que aún no la tienen. */
async function runDailyImport(importer) {
  const result = await importer.importNewReleases();
  if (result.status === 'success') await importer.importArtistImages();
  return result;
}

/** Une las piezas de la importación con la configuración de la API. */
function createCatalogImport({ pool, config, musicBrainz, wikimedia, logger = console }) {
  const repository = createCatalogRepository(pool);
  const musicBrainzClient = musicBrainz ?? createMusicBrainzClient(config.musicBrainz);
  const importer = createCatalogImporter({
    musicBrainz: musicBrainzClient,
    imageFinder: createArtistImageFinder({
      musicBrainz: musicBrainzClient,
      wikimedia: wikimedia ?? lazyWikimediaClient(config),
    }),
    artistImagesPerRun: config.catalogImport.artistImagesPerRun,
    repository,
    genres: config.catalogImport.genres,
    initialLimitPerGenre: config.catalogImport.initialLimitPerGenre,
    dailyLimitPerGenre: config.catalogImport.dailyLimitPerGenre,
    logger,
  });
  const scheduler = createImportScheduler({
    runImport: () => runDailyImport(importer),
    dailyHour: config.catalogImport.dailyHour,
    logger,
  });
  return { repository, importer, scheduler };
}

module.exports = { createCatalogImport, runDailyImport };
