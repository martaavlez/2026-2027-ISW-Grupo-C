// Acceso a la base de datos para la importación del catálogo (HU-20).

const emptyCounts = () => ({ added: 0, updated: 0, skipped: 0 });

function countUpsert(counts, row) {
  if (row.inserted) counts.added += 1;
  else counts.updated += 1;
}

async function findExclusions(client, { artistIds, albumId, songIds }) {
  const { rows } = await client.query(
    `SELECT kind, external_id FROM import_exclusions
      WHERE (kind = 'artist' AND external_id = ANY($1))
         OR (kind = 'album'  AND external_id = $2)
         OR (kind = 'song'   AND external_id = ANY($3))`,
    [artistIds, albumId, songIds],
  );
  return new Set(rows.map((row) => `${row.kind}:${row.external_id}`));
}

// RN-21: si ya existe se actualiza; el género solo se rellena si estaba vacío.
async function upsertArtist(client, artist) {
  const { rows } = await client.query(
    `INSERT INTO artists (name, genre, external_id) VALUES ($1, $2, $3)
     ON CONFLICT (external_id) DO UPDATE
        SET name = EXCLUDED.name, genre = COALESCE(artists.genre, EXCLUDED.genre), updated_at = now()
     RETURNING id, (xmax = 0) AS inserted`,
    [artist.name, artist.genre, artist.externalId],
  );
  return rows[0];
}

async function upsertAlbum(client, album) {
  const { rows } = await client.query(
    `INSERT INTO albums (title, cover_url, genre, type, release_year, external_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (external_id) DO UPDATE
        SET title = EXCLUDED.title, cover_url = EXCLUDED.cover_url,
            genre = COALESCE(albums.genre, EXCLUDED.genre), type = EXCLUDED.type,
            release_year = EXCLUDED.release_year, updated_at = now()
     RETURNING id, (xmax = 0) AS inserted`,
    [album.title, album.coverUrl, album.genre, album.type, album.releaseYear, album.externalId],
  );
  return rows[0];
}

// Si la canción ya estaba en otro álbum (por ejemplo, un single), se queda en ese álbum.
async function upsertSong(client, albumId, song) {
  const { rows } = await client.query(
    `INSERT INTO songs (title, album_id, track_number, duration_seconds, genre, external_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (external_id) DO UPDATE
        SET title = EXCLUDED.title, duration_seconds = EXCLUDED.duration_seconds,
            track_number = CASE WHEN songs.album_id = EXCLUDED.album_id
                                THEN EXCLUDED.track_number ELSE songs.track_number END,
            genre = COALESCE(songs.genre, EXCLUDED.genre), updated_at = now()
     RETURNING id, (xmax = 0) AS inserted`,
    [song.title, albumId, song.trackNumber, song.durationSeconds, song.genre, song.externalId],
  );
  return rows[0];
}

// Consultas fijas para enlazar artistas: ningún nombre de tabla se construye con datos externos.
const LINK_ARTIST_QUERIES = {
  album: `INSERT INTO album_artists (album_id, artist_id, position) VALUES ($1, $2, $3)
          ON CONFLICT (album_id, artist_id) DO UPDATE SET position = EXCLUDED.position`,
  song: `INSERT INTO song_artists (song_id, artist_id, position) VALUES ($1, $2, $3)
         ON CONFLICT (song_id, artist_id) DO UPDATE SET position = EXCLUDED.position`,
};

async function linkArtists(client, kind, ownerId, artistIds) {
  for (const [index, artistId] of artistIds.entries()) {
    await client.query(LINK_ARTIST_QUERIES[kind], [ownerId, artistId, index + 1]);
  }
}

function createCatalogRepository(pool) {
  async function saveArtists(client, artists, excluded, artistIdsByExternalId, counts) {
    const ids = [];
    for (const artist of artists) {
      if (excluded.has(`artist:${artist.externalId}`)) {
        counts.skipped += 1;
        continue;
      }
      if (!artistIdsByExternalId.has(artist.externalId)) {
        const row = await upsertArtist(client, artist);
        countUpsert(counts, row);
        artistIdsByExternalId.set(artist.externalId, row.id);
      }
      ids.push(artistIdsByExternalId.get(artist.externalId));
    }
    return ids;
  }

  /**
   * Guarda un álbum con sus artistas y canciones en una sola transacción:
   * o se guarda entero o no se guarda nada.
   */
  async function saveAlbum({ album, artists, songs }) {
    const counts = emptyCounts();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const excluded = await findExclusions(client, {
        artistIds: [...artists, ...songs.flatMap((song) => song.artists)].map((a) => a.externalId),
        albumId: album.externalId,
        songIds: songs.map((song) => song.externalId),
      });

      // RN-21: lo que el administrador eliminó no se vuelve a importar.
      if (excluded.has(`album:${album.externalId}`)) {
        await client.query('ROLLBACK');
        return { ...counts, skipped: 1 };
      }

      const artistIdsByExternalId = new Map();
      const albumArtistIds = await saveArtists(
        client,
        artists,
        excluded,
        artistIdsByExternalId,
        counts,
      );
      const albumRow = await upsertAlbum(client, album);
      countUpsert(counts, albumRow);
      await linkArtists(client, 'album', albumRow.id, albumArtistIds);

      for (const song of songs) {
        if (excluded.has(`song:${song.externalId}`)) {
          counts.skipped += 1;
          continue;
        }
        const songArtists = song.artists.length > 0 ? song.artists : artists;
        const songArtistIds = await saveArtists(
          client,
          songArtists,
          excluded,
          artistIdsByExternalId,
          counts,
        );
        const songRow = await upsertSong(client, albumRow.id, song);
        countUpsert(counts, songRow);
        await linkArtists(client, 'song', songRow.id, songArtistIds);
      }

      await client.query('COMMIT');
      return counts;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async function startRun(kind) {
    const { rows } = await pool.query('INSERT INTO import_runs (kind) VALUES ($1) RETURNING id', [
      kind,
    ]);
    return rows[0].id;
  }

  async function finishRun(runId, { status, added, updated, skipped, errorMessage = null }) {
    await pool.query(
      `UPDATE import_runs
          SET status = $2, finished_at = now(), added_count = $3, updated_count = $4,
              skipped_count = $5, error_message = $6
        WHERE id = $1`,
      [runId, status, added, updated, skipped, errorMessage],
    );
  }

  async function getLastSuccessfulRun() {
    const { rows } = await pool.query(
      `SELECT id, kind, started_at AS "startedAt", finished_at AS "finishedAt"
         FROM import_runs WHERE status = 'success'
        ORDER BY started_at DESC LIMIT 1`,
    );
    return rows[0] ?? null;
  }

  /** PA-20-03: lo que verá el administrador en su panel. */
  async function getImportStatus() {
    const lastSuccess = await getLastSuccessfulRun();
    const { rows } = await pool.query(
      `SELECT status, started_at AS "startedAt", finished_at AS "finishedAt",
              error_message AS "errorMessage"
         FROM import_runs ORDER BY started_at DESC LIMIT 1`,
    );
    return {
      lastSuccessfulImportAt: lastSuccess?.finishedAt ?? null,
      lastAttempt: rows[0] ?? null,
    };
  }

  return { saveAlbum, startRun, finishRun, getLastSuccessfulRun, getImportStatus };
}

module.exports = { createCatalogRepository };
