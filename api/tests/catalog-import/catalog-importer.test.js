const { createCatalogImporter } = require('../../src/catalog-import/catalog-importer');
const { MusicBrainzUnavailableError } = require('../../src/catalog-import/musicbrainz-client');
const { fakeMusicBrainz, releaseGroup } = require('../fixtures/musicbrainz');

const ROCK = { tag: 'rock', name: 'Rock' };
const silentLogger = { error: jest.fn(), warn: jest.fn(), info: jest.fn() };

function fakeRepository({ lastSuccess = null, saveAlbum } = {}) {
  return {
    saved: [],
    runs: [],
    startRun: jest.fn(async function (kind) {
      this.runs.push({ kind });
      return this.runs.length;
    }),
    finishRun: jest.fn(async function (id, result) {
      Object.assign(this.runs[id - 1], result);
    }),
    getLastSuccessfulRun: jest.fn(async () => lastSuccess),
    saveAlbum: jest.fn(
      saveAlbum ??
        async function (data) {
          this.saved.push(data);
          return { added: 1 + data.artists.length + data.songs.length, updated: 0, skipped: 0 };
        },
    ),
  };
}

function importerWith({ musicBrainz = fakeMusicBrainz(), repository = fakeRepository(), ...rest }) {
  const importer = createCatalogImporter({
    musicBrainz,
    repository,
    genres: [ROCK],
    initialLimitPerGenre: 500,
    dailyLimitPerGenre: 1000,
    logger: silentLogger,
    now: () => new Date('2026-11-24T10:00:00Z'),
    ...rest,
  });
  return { importer, musicBrainz, repository };
}

test('test_importInitial_withNewAlbum_savesAlbumArtistsAndSongs', async () => {
  const { importer, repository } = importerWith({});

  const result = await importer.importInitial();

  expect(result).toEqual({ status: 'success', added: 5, updated: 0, skipped: 0 });
  const [saved] = repository.saved;
  expect(saved.album).toMatchObject({ externalId: 'test-mb-rg-1', genre: 'Rock' });
  expect(saved.artists.map((artist) => artist.name)).toEqual(['Los Faroles']);
  expect(saved.songs.map((song) => song.title)).toEqual(['Primera ola', 'Corriente', 'Resaca']);
  expect(repository.runs[0]).toMatchObject({ kind: 'initial', status: 'success', added: 5 });
});

test('test_importInitial_withMoreResultsThanAPage_readsPagesUpToTheLimit', async () => {
  const groups = Array.from({ length: 150 }, (_, i) =>
    releaseGroup({ id: `rg-${i}`, releases: [{ id: 'test-mb-release-1', status: 'Official' }] }),
  );
  const { importer, musicBrainz, repository } = importerWith({
    musicBrainz: fakeMusicBrainz({ releaseGroups: groups }),
  });

  await importer.importInitial({ limitPerGenre: 120, offset: 10 });

  const offsets = musicBrainz.searchReleaseGroups.mock.calls.map(([args]) => args.offset);
  expect(offsets).toEqual([10, 110]);
  expect(repository.saved).toHaveLength(120);
});

test('test_importInitial_withCompilationOrMissingRelease_skipsIt', async () => {
  const musicBrainz = fakeMusicBrainz({
    releaseGroups: [
      releaseGroup({ id: 'compilation', 'secondary-types': ['Compilation'] }),
      releaseGroup({ id: 'no-releases', releases: [] }),
      releaseGroup({ id: 'gone', releases: [{ id: 'deleted-release', status: 'Official' }] }),
    ],
  });
  const { importer, repository } = importerWith({ musicBrainz });

  const result = await importer.importInitial();

  expect(result.skipped).toBe(3);
  expect(repository.saveAlbum).not.toHaveBeenCalled();
});

test('test_importInitial_whenAnAlbumCannotBeSaved_continuesWithTheRest', async () => {
  const musicBrainz = fakeMusicBrainz({
    releaseGroups: [releaseGroup({ id: 'bad' }), releaseGroup({ id: 'good' })],
  });
  const saveAlbum = jest
    .fn()
    .mockRejectedValueOnce(new Error('value too long'))
    .mockResolvedValueOnce({ added: 5, updated: 0, skipped: 0 });
  const { importer } = importerWith({ musicBrainz, repository: fakeRepository({ saveAlbum }) });

  const result = await importer.importInitial();

  expect(result).toEqual({ status: 'success', added: 5, updated: 0, skipped: 1 });
});

test('test_importNewReleases_withPreviousImport_asksForReleasesSinceTheDayBefore', async () => {
  const repository = fakeRepository({ lastSuccess: { startedAt: '2026-11-23T03:00:00Z' } });
  const { importer, musicBrainz } = importerWith({ repository });

  await importer.importNewReleases();

  expect(musicBrainz.searchReleaseGroups).toHaveBeenCalledWith({
    tag: 'rock',
    releasedSince: '2026-11-22',
    limit: 100,
    offset: 0,
  });
  expect(repository.runs[0].kind).toBe('daily');
});

test('test_importNewReleases_withoutPreviousImport_runsTheInitialImport', async () => {
  const { importer, repository, musicBrainz } = importerWith({});

  await importer.importNewReleases();

  expect(repository.runs[0].kind).toBe('initial');
  expect(musicBrainz.searchReleaseGroups.mock.calls[0][0].releasedSince).toBeNull();
});

test('test_importNewReleases_whenMusicBrainzIsDown_recordsFailedRun', async () => {
  const musicBrainz = fakeMusicBrainz({
    failWith: new MusicBrainzUnavailableError('MusicBrainz no está disponible (ECONNREFUSED)'),
  });
  const repository = fakeRepository({ lastSuccess: { startedAt: '2026-11-23T03:00:00Z' } });
  const { importer } = importerWith({ musicBrainz, repository });

  const result = await importer.importNewReleases();

  expect(result.status).toBe('failed');
  expect(repository.runs[0]).toMatchObject({
    status: 'failed',
    errorMessage: 'MusicBrainz no está disponible (ECONNREFUSED)',
  });
  expect(repository.saveAlbum).not.toHaveBeenCalled();
});

test('test_importInitial_withUnexpectedError_recordsFailedRunAndRethrows', async () => {
  const musicBrainz = fakeMusicBrainz({ failWith: new TypeError('bug') });
  const { importer, repository } = importerWith({ musicBrainz });

  await expect(importer.importInitial()).rejects.toThrow('bug');
  expect(repository.runs[0].status).toBe('failed');
});

test('test_isDue_dependsOnLastSuccessfulImport', async () => {
  const never = importerWith({}).importer;
  const today = importerWith({
    repository: fakeRepository({ lastSuccess: { startedAt: '2026-11-24T03:00:00Z' } }),
  }).importer;
  const yesterday = importerWith({
    repository: fakeRepository({ lastSuccess: { startedAt: '2026-11-23T03:00:00Z' } }),
  }).importer;

  await expect(never.isDue()).resolves.toBe(true);
  await expect(today.isDue()).resolves.toBe(false);
  await expect(yesterday.isDue()).resolves.toBe(true);
});

describe('Fotos de artistas', () => {
  function imageRepository(pending) {
    return {
      ...fakeRepository(),
      findArtistsPendingImage: jest.fn().mockResolvedValue(pending),
      saveArtistImage: jest.fn().mockResolvedValue(),
    };
  }
  const image = { imageUrl: 'https://upload.wikimedia.org/a.jpg', credit: 'Ana · CC BY' };

  test('test_importArtistImages_savesFoundAndMissingPhotos', async () => {
    const repository = imageRepository([
      { id: '1', externalId: 'mb-1' },
      { id: '2', externalId: 'mb-2' },
    ]);
    const imageFinder = {
      findImage: jest.fn().mockResolvedValueOnce(image).mockResolvedValueOnce(null),
    };
    const { importer } = importerWith({ repository, imageFinder });

    const result = await importer.importArtistImages({ limit: 50 });

    expect(result).toEqual({ status: 'success', found: 1, withoutImage: 1 });
    expect(repository.findArtistsPendingImage).toHaveBeenCalledWith(50);
    expect(repository.saveArtistImage).toHaveBeenNthCalledWith(1, '1', image);
    expect(repository.saveArtistImage).toHaveBeenNthCalledWith(2, '2', null);
  });

  test('test_importArtistImages_whenServiceFails_stopsWithoutMarkingTheRest', async () => {
    const repository = imageRepository([
      { id: '1', externalId: 'mb-1' },
      { id: '2', externalId: 'mb-2' },
      { id: '3', externalId: 'mb-3' },
    ]);
    const imageFinder = {
      findImage: jest
        .fn()
        .mockResolvedValueOnce(image)
        .mockRejectedValueOnce(new MusicBrainzUnavailableError('503')),
    };
    const { importer } = importerWith({ repository, imageFinder });

    const result = await importer.importArtistImages();

    expect(result).toEqual({ status: 'interrupted', found: 1, withoutImage: 0, pending: 2 });
    expect(repository.saveArtistImage).toHaveBeenCalledTimes(1);
    expect(imageFinder.findImage).toHaveBeenCalledTimes(2);
  });

  test('test_importArtistImages_usesConfiguredLimitByDefault', async () => {
    const repository = imageRepository([]);
    const { importer } = importerWith({
      repository,
      imageFinder: { findImage: jest.fn() },
      artistImagesPerRun: 7,
    });

    await importer.importArtistImages();

    expect(repository.findArtistsPendingImage).toHaveBeenCalledWith(7);
  });
});

describe('Importar un artista concreto', () => {
  const ROBE = '8e1c5e2b-3a4d-4f6a-9b7c-1d2e3f4a5b6c';

  function artistRepository() {
    return {
      ...fakeRepository(),
      findArtistIdByExternalId: jest.fn().mockResolvedValue('42'),
      saveArtistImage: jest.fn().mockResolvedValue(),
    };
  }

  test('test_importArtist_importsDiscographyWithGenreFromTagsAndFindsPhoto', async () => {
    const repository = artistRepository();
    const musicBrainz = fakeMusicBrainz({
      releaseGroups: [
        releaseGroup({ tags: [{ name: 'Spanish rock' }, { name: 'Rock' }] }),
        releaseGroup({
          id: 'test-mb-rg-2',
          releases: [{ id: 'test-mb-release-1', status: 'Official' }],
        }),
      ],
    });
    const image = { imageUrl: 'https://upload.wikimedia.org/robe.jpg', credit: 'Autor · CC BY' };
    const imageFinder = { findImage: jest.fn().mockResolvedValue(image) };
    const { importer } = importerWith({ musicBrainz, repository, imageFinder });

    const result = await importer.importArtist(ROBE);

    expect(result).toMatchObject({ status: 'success', image: 'encontrada' });
    expect(musicBrainz.searchReleaseGroupsByArtist).toHaveBeenCalledWith({
      artistId: ROBE,
      limit: 100,
      offset: 0,
    });
    expect(repository.saved.map((data) => data.album.genre)).toEqual(['Rock', null]);
    expect(repository.saveArtistImage).toHaveBeenCalledWith('42', image);
    expect(repository.startRun).not.toHaveBeenCalled();
  });

  test('test_importArtist_withInvalidId_throwsWithoutAskingMusicBrainz', async () => {
    const musicBrainz = fakeMusicBrainz();
    const { importer } = importerWith({ musicBrainz });

    await expect(importer.importArtist('Robe')).rejects.toThrow('MBID');
    expect(musicBrainz.searchReleaseGroupsByArtist).not.toHaveBeenCalled();
  });

  test('test_importArtist_whenMusicBrainzIsDown_returnsFailedKeepingWhatWasSaved', async () => {
    const musicBrainz = fakeMusicBrainz({ failWith: new MusicBrainzUnavailableError('503') });
    const { importer } = importerWith({ musicBrainz, repository: artistRepository() });

    await expect(importer.importArtist(ROBE)).resolves.toMatchObject({
      status: 'failed',
      error: '503',
    });
  });

  test('test_importArtist_photoServiceDown_stillSucceeds', async () => {
    const imageFinder = { findImage: jest.fn().mockRejectedValue(new Error('Wikimedia caído')) };
    const { importer } = importerWith({ repository: artistRepository(), imageFinder });

    await expect(importer.importArtist(ROBE)).resolves.toMatchObject({
      status: 'success',
      image: 'no se ha podido buscar',
    });
  });

  test('test_findArtists_returnsCandidates', async () => {
    const musicBrainz = fakeMusicBrainz();
    musicBrainz.searchArtists.mockResolvedValue([{ id: ROBE, name: 'Robe' }]);
    const { importer } = importerWith({ musicBrainz });

    await expect(importer.findArtists('Robe')).resolves.toEqual([{ id: ROBE, name: 'Robe' }]);
  });
});
