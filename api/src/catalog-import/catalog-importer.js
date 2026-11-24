// HU-20 · Importar el catálogo desde MusicBrainz.

const { toAlbum, toArtists, toSongs, pickReleaseId, truncate } = require('./mapper');
const { MusicBrainzUnavailableError, PAGE_SIZE_LIMIT } = require('./musicbrainz-client');

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function createCatalogImporter({
  musicBrainz,
  repository,
  genres,
  initialLimitPerGenre,
  dailyLimitPerGenre,
  logger = console,
  now = () => new Date(),
}) {
  async function importReleaseGroup(releaseGroup, genre, totals) {
    const album = toAlbum(releaseGroup, genre.name, now().getFullYear());
    const releaseId = album && pickReleaseId(releaseGroup);
    const release = releaseId && (await musicBrainz.getRelease(releaseId));
    if (!release) {
      totals.skipped += 1;
      return;
    }

    try {
      const counts = await repository.saveAlbum({
        album,
        artists: toArtists(releaseGroup['artist-credit'], genre.name),
        songs: toSongs(release, genre.name),
      });
      totals.added += counts.added;
      totals.updated += counts.updated;
      totals.skipped += counts.skipped;
    } catch (error) {
      // Un álbum con datos que no se pueden guardar no para la importación del resto.
      totals.skipped += 1;
      logger.warn(`No se ha podido guardar el álbum ${album.externalId}: ${error.message}`);
    }
  }

  async function importGenre(genre, { releasedSince, limit, offset }, totals) {
    let fetched = 0;
    while (fetched < limit) {
      const pageSize = Math.min(PAGE_SIZE_LIMIT, limit - fetched);
      const page = await musicBrainz.searchReleaseGroups({
        tag: genre.tag,
        releasedSince,
        limit: pageSize,
        offset: offset + fetched,
      });
      for (const releaseGroup of page.releaseGroups) {
        await importReleaseGroup(releaseGroup, genre, totals);
      }
      fetched += page.releaseGroups.length;
      const noMoreResults = page.releaseGroups.length < pageSize || offset + fetched >= page.total;
      if (noMoreResults) break;
    }
  }

  async function run(kind, options) {
    const runId = await repository.startRun(kind);
    const totals = { added: 0, updated: 0, skipped: 0 };
    try {
      for (const genre of genres) {
        await importGenre(genre, options, totals);
      }
      await repository.finishRun(runId, { status: 'success', ...totals });
      logger.info(`Importación ${kind} correcta: ${JSON.stringify(totals)}`);
      return { status: 'success', ...totals };
    } catch (error) {
      // PA-20-03: el catálogo que ya hay no se toca; lo guardado hasta el fallo se queda.
      const errorMessage = truncate(error.message, 500);
      await repository.finishRun(runId, { status: 'failed', ...totals, errorMessage });
      logger.error(`Importación ${kind} fallida: ${errorMessage}`);
      if (!(error instanceof MusicBrainzUnavailableError)) throw error;
      return { status: 'failed', error: errorMessage, ...totals };
    }
  }

  /**
   * Primera importación: hasta `limitPerGenre` álbumes de cada género.
   * Con `offset` se continúa más adelante por donde se quedó (por ejemplo, offset 500).
   */
  function importInitial({ limitPerGenre = initialLimitPerGenre, offset = 0 } = {}) {
    return run('initial', { releasedSince: null, limit: limitPerGenre, offset });
  }

  /**
   * PA-20-01 · Importación diaria: álbumes publicados desde el día anterior a la última
   * importación correcta. El día de margen no duplica nada (RN-21).
   */
  async function importNewReleases() {
    const lastSuccess = await repository.getLastSuccessfulRun();
    if (!lastSuccess) return importInitial();
    const since = new Date(new Date(lastSuccess.startedAt).getTime() - ONE_DAY_MS);
    return run('daily', { releasedSince: toIsoDate(since), limit: dailyLimitPerGenre, offset: 0 });
  }

  /** Toca importar si nunca ha habido una importación correcta o la última tiene más de un día. */
  async function isDue() {
    const lastSuccess = await repository.getLastSuccessfulRun();
    if (!lastSuccess) return true;
    return now().getTime() - new Date(lastSuccess.startedAt).getTime() >= ONE_DAY_MS;
  }

  return { importInitial, importNewReleases, isDue };
}

module.exports = { createCatalogImporter };
