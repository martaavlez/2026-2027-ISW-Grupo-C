// HU-06 · Consultar mi perfil y HU-24 · Consultar el perfil de otro usuario: información,
// contadores, reseñas y tableros. Consultas fijas con parámetros.
// `levels` son los niveles de privacidad que puede ver quien mira (RN-08): todos en el perfil
// propio, público y solo amigos si es amigo, y solo lo público si no lo es.

const ALL_LEVELS = ['public', 'friends', 'private'];

const USER = `
  SELECT id::text AS id, name, username, bio, photo_url AS "photoUrl"
    FROM users WHERE id = $1 AND status = 'active'`;

// HU-24 · Solo cuentas activas de usuarios: las de administración no se muestran (como en la búsqueda).
const BY_USERNAME = `
  SELECT id::text AS id, name, username, bio, photo_url AS "photoUrl"
    FROM users WHERE lower(username) = lower($1) AND status = 'active' AND role = 'user'`;

// Si son amigos, si quien mira ($1) le sigue (HU-10) y si alguno de los dos ha bloqueado al
// otro (RN-12).
const RELATIONSHIP = `
  SELECT
    EXISTS (SELECT 1 FROM follows WHERE follower_id = $1 AND followed_id = $2) AS following,
    EXISTS (SELECT 1 FROM friendships
             WHERE status = 'accepted'
               AND ((requester_id = $1 AND recipient_id = $2)
                 OR (requester_id = $2 AND recipient_id = $1))) AS friends,
    EXISTS (SELECT 1 FROM blocks
             WHERE (blocker_id = $1 AND blocked_id = $2)
                OR (blocker_id = $2 AND blocked_id = $1)) AS blocked`;

const FAVORITES_VISIBILITY = `
  SELECT COALESCE((SELECT favorites_visibility FROM privacy_settings WHERE user_id = $1), 'public')
    AS visibility`;

const COUNTS = `
  SELECT
    (SELECT count(*)::int FROM reviews
      WHERE author_id = $1 AND status = 'visible' AND privacy = ANY($2::privacy_level[])) AS reviews,
    (SELECT count(*)::int FROM follows WHERE followed_id = $1) AS followers,
    (SELECT count(*)::int FROM follows WHERE follower_id = $1) AS following,
    (SELECT count(*)::int FROM friendships
      WHERE status = 'accepted' AND (requester_id = $1 OR recipient_id = $1)) AS friends,
    (SELECT count(*)::int FROM favorites WHERE user_id = $1) AS favorites,
    (SELECT count(*)::int FROM boards
      WHERE owner_id = $1 AND privacy = ANY($2::privacy_level[])) AS boards`;

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
   WHERE r.author_id = $1 AND r.status = 'visible' AND r.privacy = ANY($4::privacy_level[])
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
    FROM boards b WHERE b.owner_id = $1 AND b.privacy = ANY($2::privacy_level[])
   ORDER BY b.created_at DESC, b.id DESC`;

function createProfileRepository(pool) {
  /** Una página de sus reseñas y valoraciones que se pueden ver, de la más reciente a la más antigua. */
  async function findReviews(userId, { limit, offset, levels = ALL_LEVELS }) {
    return (await pool.query(MY_REVIEWS, [userId, limit, offset, levels])).rows;
  }

  /** Contadores, primera página de reseñas y tableros de un usuario, filtrados por `levels`. */
  async function findContent(user, { reviewsLimit, levels }) {
    const [counts, reviews, boards] = await Promise.all([
      pool.query(COUNTS, [user.id, levels]),
      findReviews(user.id, { limit: reviewsLimit, offset: 0, levels }),
      pool.query(MY_BOARDS, [user.id, levels]),
    ]);
    return { user, counts: counts.rows[0], reviews, boards: boards.rows };
  }

  /** Su perfil con la primera página de reseñas, o null si la cuenta ya no existe o está suspendida. */
  async function findOwnProfile(userId, { reviewsLimit }) {
    const user = (await pool.query(USER, [userId])).rows[0];
    if (!user) return null;
    return findContent(user, { reviewsLimit, levels: ALL_LEVELS });
  }

  /** HU-24 · Usuario activo por su nombre de usuario (sin distinguir mayúsculas), o null. */
  async function findByUsername(username) {
    return (await pool.query(BY_USERNAME, [username])).rows[0] ?? null;
  }

  /** Si son amigos, si le sigue y si hay un bloqueo entre ellos. Un visitante no es nada. */
  async function findRelationship(viewerId, userId) {
    if (!viewerId) return { friends: false, following: false, blocked: false };
    return (await pool.query(RELATIONSHIP, [viewerId, userId])).rows[0];
  }

  /** Quién puede ver sus favoritos: public, friends o private. */
  async function findFavoritesVisibility(userId) {
    return (await pool.query(FAVORITES_VISIBILITY, [userId])).rows[0].visibility;
  }

  return {
    findOwnProfile,
    findReviews,
    findContent,
    findByUsername,
    findRelationship,
    findFavoritesVisibility,
  };
}

module.exports = { createProfileRepository, ALL_LEVELS };
