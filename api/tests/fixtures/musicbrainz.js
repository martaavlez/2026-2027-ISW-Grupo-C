// Versión simulada de MusicBrainz para las pruebas (PA-20-04 · RNF-10).
// Mismo formato que la API real, con artistas, álbumes y canciones inventados.

const ARTIST_A = { id: 'test-mb-artist-a', name: 'Los Faroles' };
const ARTIST_B = { id: 'test-mb-artist-b', name: 'Nube Roja' };

function credit(...artists) {
  return artists.map((artist, index) => ({
    name: artist.name,
    joinphrase: index < artists.length - 1 ? ' & ' : '',
    artist,
  }));
}

function releaseGroup(overrides = {}) {
  return {
    id: 'test-mb-rg-1',
    title: 'Mareas',
    'primary-type': 'Album',
    'secondary-types': [],
    'first-release-date': '2026-11-20',
    'artist-credit': credit(ARTIST_A),
    releases: [
      { id: 'test-mb-release-1-promo', status: 'Promotion' },
      { id: 'test-mb-release-1', status: 'Official' },
    ],
    ...overrides,
  };
}

function track(id, title, lengthMs, artists = [ARTIST_A]) {
  return {
    id: `${id}-track`,
    title,
    length: lengthMs,
    'artist-credit': credit(...artists),
    recording: { id, title, length: lengthMs },
  };
}

function release(overrides = {}) {
  return {
    id: 'test-mb-release-1',
    title: 'Mareas',
    media: [
      {
        position: 1,
        tracks: [
          track('test-mb-rec-1', 'Primera ola', 201000),
          track('test-mb-rec-2', 'Corriente', 185400, [ARTIST_A, ARTIST_B]),
          track('test-mb-rec-3', 'Sin duración', null),
        ],
      },
      { position: 2, tracks: [track('test-mb-rec-4', 'Resaca', 240000)] },
    ],
    ...overrides,
  };
}

/** Cliente simulado con la misma forma que createMusicBrainzClient. */
function fakeMusicBrainz({ releaseGroups = [releaseGroup()], releases = {}, failWith } = {}) {
  const releasesById = { 'test-mb-release-1': release(), ...releases };
  return {
    searchReleaseGroups: jest.fn(async ({ limit, offset = 0 }) => {
      if (failWith) throw failWith;
      return {
        total: releaseGroups.length,
        releaseGroups: releaseGroups.slice(offset, offset + limit),
      };
    }),
    searchReleaseGroupsByArtist: jest.fn(async ({ limit, offset = 0 }) => {
      if (failWith) throw failWith;
      return {
        total: releaseGroups.length,
        releaseGroups: releaseGroups.slice(offset, offset + limit),
      };
    }),
    searchArtists: jest.fn(async () => []),
    getRelease: jest.fn(async (id) => {
      if (failWith) throw failWith;
      return releasesById[id] ?? null;
    }),
  };
}

module.exports = { ARTIST_A, ARTIST_B, credit, releaseGroup, release, track, fakeMusicBrainz };
