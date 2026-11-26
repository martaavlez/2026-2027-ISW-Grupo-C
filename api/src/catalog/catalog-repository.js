// Lectura del catálogo para las fichas (RI-07 canción, RI-08 álbum, RI-06 artista).
// Todas las consultas son fijas y con parámetros: el id nunca se mete en el texto SQL.

const ALBUM_QUERY = `
  SELECT id::text AS id, title, cover_url AS "coverUrl", genre, type,
         release_year AS "releaseYear", average_rating::float AS "averageRating"
    FROM albums WHERE id = $1`;

const ALBUM_ARTISTS_QUERY = `
  SELECT a.id::text AS id, a.name
    FROM album_artists aa JOIN artists a ON a.id = aa.artist_id
   WHERE aa.album_id = $1 ORDER BY aa.position, a.name`;

const ALBUM_SONGS_QUERY = `
  SELECT id::text AS id, title, track_number AS "trackNumber",
         duration_seconds AS "durationSeconds", average_rating::float AS "averageRating"
    FROM songs WHERE album_id = $1 ORDER BY track_number NULLS LAST, title`;

const SONG_QUERY = `
  SELECT s.id::text AS id, s.title, s.track_number AS "trackNumber",
         s.duration_seconds AS "durationSeconds", s.genre,
         s.average_rating::float AS "averageRating",
         al.id::text AS "albumId", al.title AS "albumTitle", al.cover_url AS "albumCoverUrl",
         al.type AS "albumType", al.release_year AS "albumReleaseYear"
    FROM songs s JOIN albums al ON al.id = s.album_id
   WHERE s.id = $1`;

const SONG_ARTISTS_QUERY = `
  SELECT a.id::text AS id, a.name
    FROM song_artists sa JOIN artists a ON a.id = sa.artist_id
   WHERE sa.song_id = $1 ORDER BY sa.position, a.name`;

const ARTIST_QUERY = `
  SELECT id::text AS id, name, image_url AS "imageUrl", image_credit AS "imageCredit",
         genre, description
    FROM artists WHERE id = $1`;

// Álbumes donde aparece el artista, del más reciente al más antiguo (como mucho 200).
const ARTIST_ALBUMS_QUERY = `
  SELECT al.id::text AS id, al.title, al.cover_url AS "coverUrl", al.type,
         al.release_year AS "releaseYear", al.average_rating::float AS "averageRating"
    FROM album_artists aa JOIN albums al ON al.id = aa.album_id
   WHERE aa.artist_id = $1
   ORDER BY al.release_year DESC NULLS LAST, al.title
   LIMIT 200`;

const ARTIST_SONGS_COUNT_QUERY = `
  SELECT count(*)::int AS total FROM song_artists WHERE artist_id = $1`;

// RN-07: la distribución cuenta todas las valoraciones vigentes, sea cual sea su privacidad.
const DISTRIBUTION_QUERIES = {
  album: `SELECT rating, count(*)::int AS total FROM reviews
           WHERE album_id = $1 AND status = 'visible' GROUP BY rating`,
  song: `SELECT rating, count(*)::int AS total FROM reviews
          WHERE song_id = $1 AND status = 'visible' GROUP BY rating`,
};

function createCatalogRepository(pool) {
  async function findAlbum(id) {
    const { rows } = await pool.query(ALBUM_QUERY, [id]);
    return rows[0] ?? null;
  }

  async function findAlbumArtists(id) {
    return (await pool.query(ALBUM_ARTISTS_QUERY, [id])).rows;
  }

  async function findAlbumSongs(id) {
    return (await pool.query(ALBUM_SONGS_QUERY, [id])).rows;
  }

  async function findSong(id) {
    const { rows } = await pool.query(SONG_QUERY, [id]);
    return rows[0] ?? null;
  }

  async function findSongArtists(id) {
    return (await pool.query(SONG_ARTISTS_QUERY, [id])).rows;
  }

  async function findArtist(id) {
    const { rows } = await pool.query(ARTIST_QUERY, [id]);
    return rows[0] ?? null;
  }

  async function findArtistAlbums(id) {
    return (await pool.query(ARTIST_ALBUMS_QUERY, [id])).rows;
  }

  async function countArtistSongs(id) {
    return (await pool.query(ARTIST_SONGS_COUNT_QUERY, [id])).rows[0].total;
  }

  /** Devuelve cuántas valoraciones de 1, 2, 3, 4 y 5 estrellas tiene el elemento. */
  async function findRatingDistribution(kind, id) {
    const { rows } = await pool.query(DISTRIBUTION_QUERIES[kind], [id]);
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const row of rows) distribution[row.rating] = row.total;
    return distribution;
  }

  return {
    findAlbum,
    findAlbumArtists,
    findAlbumSongs,
    findSong,
    findSongArtists,
    findRatingDistribution,
    findArtist,
    findArtistAlbums,
    countArtistSongs,
  };
}

module.exports = { createCatalogRepository };
