const {
  toAlbum,
  toArtists,
  toSongs,
  pickReleaseId,
  toReleaseYear,
} = require('../../src/catalog-import/mapper');
const { ARTIST_A, ARTIST_B, credit, releaseGroup, release } = require('../fixtures/musicbrainz');

describe('toAlbum', () => {
  test('test_toAlbum_withStudioAlbum_returnsAlbumData', () => {
    expect(toAlbum(releaseGroup(), 'Rock', 2026)).toEqual({
      externalId: 'test-mb-rg-1',
      title: 'Mareas',
      type: 'album',
      releaseYear: 2026,
      genre: 'Rock',
      coverUrl: 'https://coverartarchive.org/release-group/test-mb-rg-1/front-250',
    });
  });

  test('test_toAlbum_withEpAndSingle_mapsType', () => {
    expect(toAlbum(releaseGroup({ 'primary-type': 'EP' }), 'Rock').type).toBe('ep');
    expect(toAlbum(releaseGroup({ 'primary-type': 'Single' }), 'Rock').type).toBe('single');
  });

  test('test_toAlbum_withCompilationOrOtherType_returnsNull', () => {
    expect(toAlbum(releaseGroup({ 'secondary-types': ['Compilation'] }), 'Rock')).toBeNull();
    expect(toAlbum(releaseGroup({ 'primary-type': 'Broadcast' }), 'Rock')).toBeNull();
    expect(toAlbum(releaseGroup({ 'primary-type': undefined }), 'Rock')).toBeNull();
  });

  test('test_toAlbum_withLongTitle_truncatesTo200Characters', () => {
    expect(toAlbum(releaseGroup({ title: 'a'.repeat(250) }), 'Rock').title).toHaveLength(200);
  });
});

test('test_toReleaseYear_withImpossibleOrMissingDate_returnsNull', () => {
  expect(toReleaseYear('2031-01-01', 2026)).toBeNull();
  expect(toReleaseYear('1700', 2026)).toBeNull();
  expect(toReleaseYear(undefined, 2026)).toBeNull();
  expect(toReleaseYear('1999-05', 2026)).toBe(1999);
});

test('test_toArtists_withRepeatedArtist_returnsEachOnceInOrder', () => {
  expect(toArtists(credit(ARTIST_B, ARTIST_A, ARTIST_B), 'Pop')).toEqual([
    { externalId: 'test-mb-artist-b', name: 'Nube Roja', genre: 'Pop' },
    { externalId: 'test-mb-artist-a', name: 'Los Faroles', genre: 'Pop' },
  ]);
  expect(toArtists(undefined, 'Pop')).toEqual([]);
});

test('test_pickReleaseId_withOfficialRelease_prefersOfficial', () => {
  expect(pickReleaseId(releaseGroup())).toBe('test-mb-release-1');
  expect(pickReleaseId(releaseGroup({ releases: [{ id: 'x', status: 'Bootleg' }] }))).toBe('x');
  expect(pickReleaseId(releaseGroup({ releases: [] }))).toBeNull();
});

describe('toSongs', () => {
  test('test_toSongs_withSeveralDiscs_numbersTracksInOrder', () => {
    const songs = toSongs(release(), 'Rock');

    expect(songs.map((song) => song.title)).toEqual(['Primera ola', 'Corriente', 'Resaca']);
    expect(songs.map((song) => song.trackNumber)).toEqual([1, 2, 3]);
    expect(songs[0].durationSeconds).toBe(201);
  });

  test('test_toSongs_withTrackWithoutDuration_skipsIt', () => {
    const titles = toSongs(release(), 'Rock').map((song) => song.title);

    expect(titles).not.toContain('Sin duración');
  });

  test('test_toSongs_withFeaturedArtist_keepsBothArtists', () => {
    const corriente = toSongs(release(), 'Rock')[1];

    expect(corriente.artists.map((artist) => artist.externalId)).toEqual([
      'test-mb-artist-a',
      'test-mb-artist-b',
    ]);
  });

  test('test_toSongs_withRepeatedRecordingOrNoMedia_returnsEachOnce', () => {
    const twice = release({ media: [...release().media, release().media[1]] });

    expect(toSongs(twice, 'Rock')).toHaveLength(3);
    expect(toSongs({}, 'Rock')).toEqual([]);
  });
});
