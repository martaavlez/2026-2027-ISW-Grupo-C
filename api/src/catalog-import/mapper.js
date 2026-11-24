// Convierte las respuestas de MusicBrainz en los datos que guarda Repeat (RI-06, RI-07, RI-08).

const ALBUM_TYPES = { album: 'album', ep: 'ep', single: 'single' };
const COVER_ART_URL = 'https://coverartarchive.org/release-group';

function truncate(text, maxLength) {
  return (text ?? '').trim().slice(0, maxLength);
}

function toReleaseYear(date, currentYear) {
  const year = Number.parseInt((date ?? '').slice(0, 4), 10);
  if (Number.isNaN(year) || year < 1800 || year > currentYear) return null;
  return year;
}

/** Artistas de un "artist-credit", sin repetir y en el orden en que aparecen. */
function toArtists(artistCredit = [], genre) {
  const seen = new Set();
  return artistCredit
    .map((credit) => credit.artist)
    .filter((artist) => artist?.id && !seen.has(artist.id) && seen.add(artist.id))
    .map((artist) => ({ externalId: artist.id, name: truncate(artist.name, 150), genre }));
}

/**
 * Álbum a partir de un "release-group". Devuelve null si no es un álbum, EP o single
 * de estudio (se descartan recopilatorios, directos, remezclas…).
 */
function toAlbum(releaseGroup, genre, currentYear = new Date().getFullYear()) {
  const type = ALBUM_TYPES[(releaseGroup['primary-type'] ?? '').toLowerCase()];
  const hasSecondaryTypes = (releaseGroup['secondary-types'] ?? []).length > 0;
  if (!type || hasSecondaryTypes || !releaseGroup.title) return null;

  return {
    externalId: releaseGroup.id,
    title: truncate(releaseGroup.title, 200),
    type,
    releaseYear: toReleaseYear(releaseGroup['first-release-date'], currentYear),
    genre,
    coverUrl: `${COVER_ART_URL}/${releaseGroup.id}/front-250`,
  };
}

/** Edición del álbum de la que se sacan las canciones: la primera oficial, o la primera. */
function pickReleaseId(releaseGroup) {
  const releases = releaseGroup.releases ?? [];
  const official = releases.find((release) => release.status === 'Official');
  return (official ?? releases[0])?.id ?? null;
}

/** Canciones de una edición. Se descartan las que no tienen duración (RI-08 la exige). */
function toSongs(release, genre) {
  const tracks = (release.media ?? []).flatMap((medium) => medium.tracks ?? []);
  const seen = new Set();
  const songs = [];

  tracks.forEach((track) => {
    const recording = track.recording ?? {};
    const durationSeconds = Math.round((track.length ?? recording.length ?? 0) / 1000);
    if (!recording.id || seen.has(recording.id) || durationSeconds <= 0) return;
    seen.add(recording.id);
    songs.push({
      externalId: recording.id,
      title: truncate(track.title ?? recording.title, 200),
      trackNumber: songs.length + 1,
      durationSeconds,
      genre,
      artists: toArtists(track['artist-credit'] ?? recording['artist-credit'], genre),
    });
  });

  return songs;
}

module.exports = { toAlbum, toArtists, toSongs, pickReleaseId, toReleaseYear, truncate };
