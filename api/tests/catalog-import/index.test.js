const { createCatalogImport, runDailyImport } = require('../../src/catalog-import');

test('test_runDailyImport_afterSuccess_looksForArtistImages', async () => {
  const importer = {
    importNewReleases: jest.fn().mockResolvedValue({ status: 'success' }),
    importArtistImages: jest.fn().mockResolvedValue({ status: 'success' }),
  };

  await expect(runDailyImport(importer)).resolves.toEqual({ status: 'success' });
  expect(importer.importArtistImages).toHaveBeenCalled();
});

test('test_runDailyImport_afterFailure_skipsArtistImages', async () => {
  const importer = {
    importNewReleases: jest.fn().mockResolvedValue({ status: 'failed' }),
    importArtistImages: jest.fn(),
  };

  await expect(runDailyImport(importer)).resolves.toEqual({ status: 'failed' });
  expect(importer.importArtistImages).not.toHaveBeenCalled();
});

test('test_createCatalogImport_createsWikimediaOnlyWhenNeeded', async () => {
  const config = {
    musicBrainz: { userAgent: 'Hertz/test' },
    catalogImport: { genres: [], initialLimitPerGenre: 1, dailyLimitPerGenre: 1, dailyHour: 3 },
  };
  const musicBrainz = {
    getArtistUrlRelations: jest
      .fn()
      .mockResolvedValue([
        { type: 'wikidata', url: { resource: 'https://www.wikidata.org/wiki/Q1' } },
      ]),
  };
  const pool = {
    query: jest
      .fn()
      .mockResolvedValueOnce({ rows: [{ id: '1', externalId: 'mb-1' }] })
      .mockResolvedValue({ rows: [] }),
  };

  // Crearlo no llama a Wikimedia; usarlo en pruebas sin versión simulada sí avisa (y se interrumpe).
  const { importer } = createCatalogImport({
    pool,
    config,
    musicBrainz,
    logger: { warn: jest.fn(), info: jest.fn() },
  });
  const result = await importer.importArtistImages({ limit: 1 });

  expect(result).toMatchObject({ status: 'interrupted', found: 0 });
});
