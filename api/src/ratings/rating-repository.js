// HU-05 · Valorar una canción o un álbum. Consultas fijas con parámetros, una por tipo.

// Se bloquea la fila del elemento durante la transacción: si dos personas valoran a la vez,
// la segunda espera y recalcula la media con la valoración de la primera ya guardada.
const LOCK_ITEM = {
  album: 'SELECT id FROM albums WHERE id = $1 FOR UPDATE',
  song: 'SELECT id FROM songs WHERE id = $1 FOR UPDATE',
};

// RN-05: una valoración por persona y elemento; si ya existe, se sustituye la nota.
// RN-09: si es nueva, se guarda con el nivel de privacidad por defecto del usuario.
// Si ya tenía reseña con texto, el texto y su privacidad se mantienen.
const DEFAULT_PRIVACY = `COALESCE(
  (SELECT default_content_privacy FROM privacy_settings WHERE user_id = $1), 'public')`;

const UPSERT_RATING = {
  album: `INSERT INTO reviews (author_id, album_id, rating, privacy)
          VALUES ($1, $2, $3, ${DEFAULT_PRIVACY})
          ON CONFLICT (author_id, album_id) WHERE album_id IS NOT NULL
          DO UPDATE SET rating = EXCLUDED.rating, updated_at = now()`,
  song: `INSERT INTO reviews (author_id, song_id, rating, privacy)
         VALUES ($1, $2, $3, ${DEFAULT_PRIVACY})
         ON CONFLICT (author_id, song_id) WHERE song_id IS NOT NULL
         DO UPDATE SET rating = EXCLUDED.rating, updated_at = now()`,
};

// RN-07: la media cuenta todas las valoraciones vigentes, sea cual sea su privacidad.
const RECALCULATE_AVERAGE = {
  album: `UPDATE albums SET average_rating = (
            SELECT round(avg(rating), 1) FROM reviews WHERE album_id = $1 AND status = 'visible')
          WHERE id = $1 RETURNING average_rating::float AS "averageRating"`,
  song: `UPDATE songs SET average_rating = (
           SELECT round(avg(rating), 1) FROM reviews WHERE song_id = $1 AND status = 'visible')
         WHERE id = $1 RETURNING average_rating::float AS "averageRating"`,
};

const MY_RATING = {
  album: 'SELECT rating FROM reviews WHERE album_id = $1 AND author_id = $2',
  song: 'SELECT rating FROM reviews WHERE song_id = $1 AND author_id = $2',
};

/** Recalcula la nota media (RN-07). La usarán también reseñar, editar y eliminar. */
async function recalculateAverage(client, kind, itemId) {
  const { rows } = await client.query(RECALCULATE_AVERAGE[kind], [itemId]);
  return rows[0]?.averageRating ?? null;
}

function createRatingRepository(pool) {
  /**
   * Guarda la valoración y recalcula la media en una sola transacción.
   * Devuelve la nueva media, o undefined si el elemento no existe.
   */
  async function saveRating({ kind, itemId, userId, rating }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const item = await client.query(LOCK_ITEM[kind], [itemId]);
      if (item.rowCount === 0) {
        await client.query('ROLLBACK');
        return undefined;
      }
      await client.query(UPSERT_RATING[kind], [userId, itemId, rating]);
      const averageRating = await recalculateAverage(client, kind, itemId);
      await client.query('COMMIT');
      return averageRating;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /** La nota que el usuario ha dado a ese elemento, o null. */
  async function findMyRating(kind, itemId, userId) {
    if (!userId) return null;
    const { rows } = await pool.query(MY_RATING[kind], [itemId, userId]);
    return rows[0]?.rating ?? null;
  }

  return { saveRating, findMyRating };
}

module.exports = { createRatingRepository, recalculateAverage };
