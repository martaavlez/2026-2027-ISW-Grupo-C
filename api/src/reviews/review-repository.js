// Reseñas (RI-10) que puede ver quien mira la ficha (RN-08) y publicación de reseñas (HU-23).
const { DEFAULT_PRIVACY, recalculateAverage } = require('../ratings/rating-repository');

// RN-08: públicas para todos; "solo amigos" para el autor y sus amigos; privadas solo para el autor.
// RN-12: si uno de los dos ha bloqueado al otro, no se ven sus reseñas.
// $2 es el usuario que mira, o NULL si es un visitante (entonces solo pasan las públicas).
const VISIBLE_TO_VIEWER = `
  r.status = 'visible'
  AND (
    r.privacy = 'public'
    OR r.author_id = $2
    OR (r.privacy = 'friends' AND EXISTS (
          SELECT 1 FROM friendships f
           WHERE f.status = 'accepted'
             AND ((f.requester_id = $2 AND f.recipient_id = r.author_id)
               OR (f.recipient_id = $2 AND f.requester_id = r.author_id))))
  )
  AND NOT EXISTS (
    SELECT 1 FROM blocks b
     WHERE (b.blocker_id = r.author_id AND b.blocked_id = $2)
        OR (b.blocker_id = $2 AND b.blocked_id = r.author_id))`;

const SELECT_REVIEWS = `
  SELECT r.id::text AS id, r.rating, r.body, r.created_at AS "createdAt",
         r.updated_at AS "updatedAt", u.username, u.name, u.photo_url AS "photoUrl",
         count(*) OVER ()::int AS total
    FROM reviews r JOIN users u ON u.id = r.author_id`;

const QUERIES = {
  album: `${SELECT_REVIEWS} WHERE r.album_id = $1 AND ${VISIBLE_TO_VIEWER}
          ORDER BY r.created_at DESC, r.id DESC LIMIT $3 OFFSET $4`,
  song: `${SELECT_REVIEWS} WHERE r.song_id = $1 AND ${VISIBLE_TO_VIEWER}
         ORDER BY r.created_at DESC, r.id DESC LIMIT $3 OFFSET $4`,
};

const COUNT_QUERIES = {
  album: `SELECT count(*)::int AS total FROM reviews r WHERE r.album_id = $1 AND ${VISIBLE_TO_VIEWER}`,
  song: `SELECT count(*)::int AS total FROM reviews r WHERE r.song_id = $1 AND ${VISIBLE_TO_VIEWER}`,
};

const LOCK_ITEM = {
  album: 'SELECT id FROM albums WHERE id = $1 FOR UPDATE',
  song: 'SELECT id FROM songs WHERE id = $1 FOR UPDATE',
};

// RN-05: una reseña por persona y elemento. Si ya había valorado sin texto, se completa esa
// misma fila (y su fecha pasa a ser la de publicación). Si ya tenía texto, no se toca: eso es editar.
// RN-09: sin privacidad elegida ($5 NULL), la de por defecto del usuario.
const PUBLISH = {
  album: `INSERT INTO reviews (author_id, album_id, rating, body, privacy)
          VALUES ($1, $2, $3, $4, COALESCE($5::privacy_level, ${DEFAULT_PRIVACY}))
          ON CONFLICT (author_id, album_id) WHERE album_id IS NOT NULL
          DO UPDATE SET rating = EXCLUDED.rating, body = EXCLUDED.body,
                        privacy = EXCLUDED.privacy, created_at = now(), updated_at = NULL
          WHERE reviews.body IS NULL
          RETURNING id::text AS id, privacy`,
  song: `INSERT INTO reviews (author_id, song_id, rating, body, privacy)
         VALUES ($1, $2, $3, $4, COALESCE($5::privacy_level, ${DEFAULT_PRIVACY}))
         ON CONFLICT (author_id, song_id) WHERE song_id IS NOT NULL
         DO UPDATE SET rating = EXCLUDED.rating, body = EXCLUDED.body,
                       privacy = EXCLUDED.privacy, created_at = now(), updated_at = NULL
         WHERE reviews.body IS NULL
         RETURNING id::text AS id, privacy`,
};

// La actividad hereda la privacidad de la reseña (RN-08), para el inicio de quien la pueda ver.
const ADD_ACTIVITY = {
  album: `INSERT INTO activities (user_id, type, album_id, privacy) VALUES ($1, 'review', $2, $3)`,
  song: `INSERT INTO activities (user_id, type, song_id, privacy) VALUES ($1, 'review', $2, $3)`,
};

// HU-08 · Solo la reseña con texto de quien edita (RN-13: el autor sale del token). Si no elige
// otra privacidad ($5 NULL), se queda la que tenía.
const EDIT = {
  album: `UPDATE reviews SET rating = $3, body = $4, privacy = COALESCE($5::privacy_level, privacy),
                 updated_at = now()
           WHERE author_id = $1 AND album_id = $2 AND body IS NOT NULL
          RETURNING id::text AS id, privacy`,
  song: `UPDATE reviews SET rating = $3, body = $4, privacy = COALESCE($5::privacy_level, privacy),
                updated_at = now()
          WHERE author_id = $1 AND song_id = $2 AND body IS NOT NULL
         RETURNING id::text AS id, privacy`,
};

// La actividad de la reseña sigue a su privacidad (RN-08).
const UPDATE_ACTIVITY = {
  album: `UPDATE activities SET privacy = $3 WHERE user_id = $1 AND type = 'review' AND album_id = $2`,
  song: `UPDATE activities SET privacy = $3 WHERE user_id = $1 AND type = 'review' AND song_id = $2`,
};

// HU-47 · Se borra la reseña entera, con su valoración, para que deje de contar en la media.
const REMOVE = {
  album: `DELETE FROM reviews WHERE author_id = $1 AND album_id = $2 AND body IS NOT NULL
          RETURNING id::text AS id`,
  song: `DELETE FROM reviews WHERE author_id = $1 AND song_id = $2 AND body IS NOT NULL
         RETURNING id::text AS id`,
};

const REMOVE_ACTIVITY = {
  album: `DELETE FROM activities WHERE user_id = $1 AND type = 'review' AND album_id = $2`,
  song: `DELETE FROM activities WHERE user_id = $1 AND type = 'review' AND song_id = $2`,
};

const PUBLISHED_REVIEW = `
  SELECT r.id::text AS id, r.rating, r.body, r.privacy, r.created_at AS "createdAt",
         r.updated_at AS "updatedAt", u.username, u.name, u.photo_url AS "photoUrl"
    FROM reviews r JOIN users u ON u.id = r.author_id WHERE r.id = $1`;

function withoutTotal(row) {
  const review = { ...row };
  delete review.total;
  return review;
}

function createReviewRepository(pool) {
  /** Reseñas visibles de una canción o un álbum, de la más reciente a la más antigua. */
  async function findVisible({ kind, itemId, viewerId, limit, offset }) {
    const { rows } = await pool.query(QUERIES[kind], [itemId, viewerId, limit, offset]);
    const total = rows.length
      ? rows[0].total
      : (await pool.query(COUNT_QUERIES[kind], [itemId, viewerId])).rows[0].total;
    return { total, items: rows.map(withoutTotal) };
  }

  /**
   * Publica la reseña, recalcula la media (RN-07) y apunta la actividad, todo en una transacción.
   * Devuelve { review, averageRating }, { alreadyPublished: true } o null si el elemento no existe.
   */
  /**
   * Abre una transacción con el elemento bloqueado y ejecuta `work`. Si el elemento no existe
   * devuelve null; si `work` no puede hacer el cambio (devuelve null), deshace lo hecho y
   * devuelve `{ refused: true }`.
   */
  async function inItemTransaction(kind, itemId, work) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      if ((await client.query(LOCK_ITEM[kind], [itemId])).rowCount === 0) {
        await client.query('ROLLBACK');
        return null;
      }
      const result = await work(client);
      await client.query(result ? 'COMMIT' : 'ROLLBACK');
      return result ?? { refused: true };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Publica la reseña, recalcula la media (RN-07) y apunta la actividad, todo en una transacción.
   * Devuelve { review, averageRating }, { refused: true } si ya la había publicado o null si el
   * elemento no existe.
   */
  async function publish({ kind, itemId, userId, rating, body, privacy }) {
    return inItemTransaction(kind, itemId, async (client) => {
      const saved = await client.query(PUBLISH[kind], [userId, itemId, rating, body, privacy]);
      if (saved.rowCount === 0) return null;
      const averageRating = await recalculateAverage(client, kind, itemId);
      await client.query(ADD_ACTIVITY[kind], [userId, itemId, saved.rows[0].privacy]);
      const review = (await client.query(PUBLISHED_REVIEW, [saved.rows[0].id])).rows[0];
      return { review, averageRating };
    });
  }

  /** HU-08 · Cambia su reseña y recalcula la media. { refused: true } si no tiene reseña ahí. */
  async function edit({ kind, itemId, userId, rating, body, privacy }) {
    return inItemTransaction(kind, itemId, async (client) => {
      const saved = await client.query(EDIT[kind], [userId, itemId, rating, body, privacy]);
      if (saved.rowCount === 0) return null;
      const averageRating = await recalculateAverage(client, kind, itemId);
      await client.query(UPDATE_ACTIVITY[kind], [userId, itemId, saved.rows[0].privacy]);
      const review = (await client.query(PUBLISHED_REVIEW, [saved.rows[0].id])).rows[0];
      return { review, averageRating };
    });
  }

  /** HU-47 · Borra su reseña y su actividad, y recalcula la media. */
  async function remove({ kind, itemId, userId }) {
    return inItemTransaction(kind, itemId, async (client) => {
      const removed = await client.query(REMOVE[kind], [userId, itemId]);
      if (removed.rowCount === 0) return null;
      await client.query(REMOVE_ACTIVITY[kind], [userId, itemId]);
      const averageRating = await recalculateAverage(client, kind, itemId);
      return { removedId: removed.rows[0].id, averageRating };
    });
  }

  return { findVisible, publish, edit, remove };
}

module.exports = { createReviewRepository };
