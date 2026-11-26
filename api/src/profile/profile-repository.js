// HU-06 · Consultar mi perfil: información, contadores, reseñas y tableros del usuario.
// Consultas fijas con parámetros ($1 = usuario del token).

const USER = `
  SELECT id::text AS id, name, username, bio, photo_url AS "photoUrl"
    FROM users WHERE id = $1 AND status = 'active'`;

const COUNTS = `
  SELECT
    (SELECT count(*)::int FROM reviews WHERE author_id = $1 AND status = 'visible') AS reviews,
    (SELECT count(*)::int FROM follows WHERE followed_id = $1) AS followers,
    (SELECT count(*)::int FROM follows WHERE follower_id = $1) AS following,
    (SELECT count(*)::int FROM friendships
      WHERE status = 'accepted' AND (requester_id = $1 OR recipient_id = $1)) AS friends,
    (SELECT count(*)::int FROM favorites WHERE user_id = $1) AS favorites,
    (SELECT count(*)::int FROM boards WHERE owner_id = $1) AS boards`;

// Sus reseñas y valoraciones, de la más reciente a la más antigua, con el elemento al que se refieren.
const MY_REVIEWS = `
  SELECT r.id::text AS id, r.rating, r.body, r.privacy, r.created_at AS "createdAt",
         CASE WHEN r.song_id IS NOT NULL THEN 'song' ELSE 'album' END AS kind,
         COALESCE(s.id, al.id)::text AS "itemId",
         COALESCE(s.title, al.title) AS "itemTitle",
         COALESCE(sal.cover_url, al.cover_url) AS "coverUrl",
         al.type AS "albumType"
    FROM reviews r
    LEFT JOIN songs s ON s.id = r.song_id
    LEFT JOIN albums sal ON sal.id = s.album_id
    LEFT JOIN albums al ON al.id = r.album_id
   WHERE r.author_id = $1 AND r.status = 'visible'
   ORDER BY r.created_at DESC, r.id DESC
   LIMIT $2 OFFSET $3`;

// Carátula de un elemento del tablero: la del álbum, o la del álbum de la canción.
const ITEM_COVER = `
  (SELECT COALESCE(al.cover_url, sal.cover_url)
     FROM board_items i
     LEFT JOIN albums al ON al.id = i.album_id
     LEFT JOIN songs s ON s.id = i.song_id
     LEFT JOIN albums sal ON sal.id = s.album_id
    WHERE i.board_id = b.id AND %CONDITION%
    ORDER BY i.added_at, i.id LIMIT 1)`;

// Portada: la del elemento que eligió el dueño; si no eligió ninguno, la del primero que añadió.
const MY_BOARDS = `
  SELECT b.id::text AS id, b.name, b.privacy,
         (SELECT count(*)::int FROM board_items i WHERE i.board_id = b.id) AS "itemsCount",
         COALESCE(${ITEM_COVER.replace('%CONDITION%', 'i.id = b.cover_item_id')},
                  ${ITEM_COVER.replace('%CONDITION%', 'TRUE')}) AS "coverUrl"
    FROM boards b WHERE b.owner_id = $1
   ORDER BY b.created_at DESC, b.id DESC`;

function createProfileRepository(pool) {
  /** Una página de sus reseñas y valoraciones, de la más reciente a la más antigua. */
  async function findReviews(userId, { limit, offset }) {
    return (await pool.query(MY_REVIEWS, [userId, limit, offset])).rows;
  }

  /** Su perfil con la primera página de reseñas, o null si la cuenta ya no existe o está suspendida. */
  async function findOwnProfile(userId, { reviewsLimit }) {
    const user = (await pool.query(USER, [userId])).rows[0];
    if (!user) return null;
    const [counts, reviews, boards] = await Promise.all([
      pool.query(COUNTS, [userId]),
      findReviews(userId, { limit: reviewsLimit, offset: 0 }),
      pool.query(MY_BOARDS, [userId]),
    ]);
    return { user, counts: counts.rows[0], reviews, boards: boards.rows };
  }

  return { findOwnProfile, findReviews };
}

module.exports = { createProfileRepository };
