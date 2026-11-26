// Reseñas (RI-10) que puede ver quien mira la ficha (RN-08).

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

  return { findVisible };
}

module.exports = { createReviewRepository };
