// Pruebas de aceptación de la HU-20 contra una base de datos PostgreSQL real,
// con la versión simulada de MusicBrainz (PA-20-04).
const { Pool } = require('pg');

// Carga el .env (DATABASE_URL) igual que la API, para que en local también se ejecuten.
require('../../src/config');

const { createCatalogImport } = require('../../src/catalog-import');
const { MusicBrainzUnavailableError } = require('../../src/catalog-import/musicbrainz-client');
const { fakeMusicBrainz, releaseGroup, release, track } = require('../fixtures/musicbrainz');

const hasDatabase = Boolean(process.env.DATABASE_URL);
const describeIfDatabase = hasDatabase ? describe : describe.skip;

const config = {
  catalogImport: {
    genres: [{ tag: 'rock', name: 'Rock' }],
    initialLimitPerGenre: 10,
    dailyLimitPerGenre: 10,
    dailyHour: 3,
  },
};
const silentLogger = { error: jest.fn(), warn: jest.fn(), info: jest.fn() };

describeIfDatabase('HU-20 · Importar el catálogo (integración)', () => {
  let pool;
  let lastRunIdBeforeTests;

  function importWith(musicBrainz) {
    return createCatalogImport({ pool, config, musicBrainz, logger: silentLogger });
  }

  async function cleanUp() {
    await pool.query("DELETE FROM albums WHERE external_id LIKE 'test-mb-%'");
    await pool.query("DELETE FROM artists WHERE external_id LIKE 'test-mb-%'");
    await pool.query("DELETE FROM import_exclusions WHERE external_id LIKE 'test-mb-%'");
    // Solo se borran las importaciones de estas pruebas, no las de la base de datos de desarrollo.
    await pool.query('DELETE FROM import_runs WHERE id > $1', [lastRunIdBeforeTests]);
  }

  async function catalogSnapshot() {
    const { rows } = await pool.query(
      `SELECT a.title AS album, a.genre, a.type, a.release_year,
              (SELECT count(*)::int FROM songs s WHERE s.album_id = a.id) AS songs,
              (SELECT string_agg(ar.name, ', ' ORDER BY aa.position)
                 FROM album_artists aa JOIN artists ar ON ar.id = aa.artist_id
                WHERE aa.album_id = a.id) AS artists
         FROM albums a WHERE a.external_id LIKE 'test-mb-%' ORDER BY a.external_id`,
    );
    return rows;
  }

  beforeAll(async () => {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const { rows } = await pool.query('SELECT COALESCE(max(id), 0) AS id FROM import_runs');
    lastRunIdBeforeTests = rows[0].id;
  });

  beforeEach(cleanUp);

  afterAll(async () => {
    await cleanUp();
    await pool.end();
  });

  test('test_PA_20_01_importInitial_withNewContent_addsItToTheCatalog', async () => {
    const { importer } = importWith(fakeMusicBrainz());

    const result = await importer.importInitial();

    expect(result).toEqual({ status: 'success', added: 6, updated: 0, skipped: 0 });
    expect(await catalogSnapshot()).toEqual([
      {
        album: 'Mareas',
        genre: 'Rock',
        type: 'album',
        release_year: 2026,
        songs: 3,
        artists: 'Los Faroles',
      },
    ]);
    const { rows } = await pool.query(
      `SELECT ar.name FROM songs s
         JOIN song_artists sa ON sa.song_id = s.id JOIN artists ar ON ar.id = sa.artist_id
        WHERE s.external_id = 'test-mb-rec-2' ORDER BY sa.position`,
    );
    expect(rows.map((row) => row.name)).toEqual(['Los Faroles', 'Nube Roja']);
  });

  test('test_PA_20_02_importAgain_withSameAlbum_updatesWithoutDuplicates', async () => {
    await importWith(fakeMusicBrainz()).importer.importInitial();
    const renamed = fakeMusicBrainz({
      releaseGroups: [releaseGroup({ title: 'Mareas (Remasterizado)' })],
    });

    const result = await importWith(renamed).importer.importInitial();

    expect(result).toEqual({ status: 'success', added: 0, updated: 6, skipped: 0 });
    const snapshot = await catalogSnapshot();
    expect(snapshot).toHaveLength(1);
    expect(snapshot[0]).toMatchObject({ album: 'Mareas (Remasterizado)', songs: 3 });
  });

  test('test_RN_21_importAgain_withAlbumRemovedByAdmin_doesNotBringItBack', async () => {
    await pool.query(
      "INSERT INTO import_exclusions (kind, external_id) VALUES ('album', 'test-mb-rg-1'), ('song', 'test-mb-rec-4')",
    );
    const second = releaseGroup({
      id: 'test-mb-rg-2',
      title: 'Brújula',
      releases: [{ id: 'test-mb-release-2', status: 'Official' }],
    });
    const musicBrainz = fakeMusicBrainz({
      releaseGroups: [releaseGroup(), second],
      releases: {
        'test-mb-release-2': release({
          media: [
            {
              tracks: [
                track('test-mb-rec-4', 'Resaca', 240000),
                track('test-mb-rec-5', 'Norte', 200000),
              ],
            },
          ],
        }),
      },
    });

    const result = await importWith(musicBrainz).importer.importInitial();

    expect(result.skipped).toBe(2);
    expect((await catalogSnapshot()).map((row) => row.album)).toEqual(['Brújula']);
    const { rows } = await pool.query(
      "SELECT title FROM songs WHERE external_id LIKE 'test-mb-%' ORDER BY title",
    );
    expect(rows.map((row) => row.title)).toEqual(['Norte']);
  });

  test('test_PA_20_03_importNewReleases_whenMusicBrainzIsDown_keepsCatalogAndLastSuccessDate', async () => {
    const { importer, repository } = importWith(fakeMusicBrainz());
    await importer.importInitial();
    const before = await repository.getImportStatus();
    const down = fakeMusicBrainz({
      failWith: new MusicBrainzUnavailableError('MusicBrainz no está disponible (ECONNREFUSED)'),
    });

    const result = await importWith(down).importer.importNewReleases();

    expect(result.status).toBe('failed');
    expect(await catalogSnapshot()).toHaveLength(1);
    const status = await repository.getImportStatus();
    expect(status.lastSuccessfulImportAt).toEqual(before.lastSuccessfulImportAt);
    expect(status.lastAttempt).toMatchObject({
      status: 'failed',
      errorMessage: 'MusicBrainz no está disponible (ECONNREFUSED)',
    });
  });

  test('test_artistImages_pendingSaveAndNeverOverwrite', async () => {
    const { importer, repository } = importWith(fakeMusicBrainz());
    await importer.importInitial();
    const { rows } = await pool.query(
      "SELECT id::text AS id FROM artists WHERE external_id LIKE 'test-mb-%' ORDER BY id",
    );
    const [first] = rows;

    const pendingBefore = (await repository.findArtistsPendingImage(1_000_000)).map((a) =>
      String(a.id),
    );
    expect(pendingBefore).toEqual(expect.arrayContaining(rows.map((row) => row.id)));

    const image = { imageUrl: 'https://upload.wikimedia.org/a.jpg', credit: 'Ana · CC BY' };
    await repository.saveArtistImage(first.id, image);
    await repository.saveArtistImage(first.id, {
      imageUrl: 'https://upload.wikimedia.org/otra.jpg',
      credit: 'Otra',
    });

    const saved = await pool.query(
      'SELECT image_url, image_credit, image_checked_at FROM artists WHERE id = $1',
      [first.id],
    );
    expect(saved.rows[0]).toMatchObject({
      image_url: 'https://upload.wikimedia.org/a.jpg',
      image_credit: 'Ana · CC BY',
      image_checked_at: expect.any(Date),
    });
    const pendingAfter = (await repository.findArtistsPendingImage(1_000_000)).map((a) =>
      String(a.id),
    );
    expect(pendingAfter).not.toContain(first.id);
  });

  test('test_artistImages_withoutPhoto_isMarkedAsChecked', async () => {
    const { importer, repository } = importWith(fakeMusicBrainz());
    await importer.importInitial();
    const { rows } = await pool.query(
      "SELECT id::text AS id FROM artists WHERE external_id LIKE 'test-mb-%' ORDER BY id LIMIT 1",
    );

    await repository.saveArtistImage(rows[0].id, null);

    const saved = await pool.query(
      'SELECT image_url, image_checked_at FROM artists WHERE id = $1',
      [rows[0].id],
    );
    expect(saved.rows[0].image_url).toBeNull();
    expect(saved.rows[0].image_checked_at).toEqual(expect.any(Date));
  });
});
