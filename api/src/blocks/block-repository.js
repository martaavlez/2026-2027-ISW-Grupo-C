// HU-35 · Bloquear a un usuario y HU-56 · Desbloquearlo (RI-05, RN-12). Consultas fijas con
// parámetros; $1 es siempre quien tiene la sesión y $2 el otro usuario.

const BLOCK = `
  INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1, $2)
  ON CONFLICT DO NOTHING`;

// PA-35-01: se eliminan el seguimiento y la amistad entre ambos, en los dos sentidos. Las
// solicitudes pendientes también, para que no quede ninguna por responder.
const DROP_FOLLOWS = `
  DELETE FROM follows
   WHERE (follower_id = $1 AND followed_id = $2) OR (follower_id = $2 AND followed_id = $1)`;

const DROP_FRIENDSHIPS = `
  DELETE FROM friendships
   WHERE status IN ('pending', 'accepted')
     AND ((requester_id = $1 AND recipient_id = $2) OR (requester_id = $2 AND recipient_id = $1))`;

// Tampoco sigue los tableros del otro: ya no puede verlos.
const DROP_BOARD_FOLLOWS = `
  DELETE FROM board_followers bf
   USING boards b
   WHERE b.id = bf.board_id
     AND ((b.owner_id = $1 AND bf.user_id = $2) OR (b.owner_id = $2 AND bf.user_id = $1))`;

// Y desaparecen los avisos que uno tenía del otro (te sigue, solicitud, amistad aceptada).
const DROP_NOTIFICATIONS = `
  DELETE FROM notifications
   WHERE related_kind = 'user'
     AND type IN ('new_follower', 'friend_request', 'friend_accepted')
     AND ((recipient_id = $1 AND related_id = $2) OR (recipient_id = $2 AND related_id = $1))`;

// PA-56-01: solo deshace el bloqueo que hizo quien tiene la sesión.
const UNBLOCK = 'DELETE FROM blocks WHERE blocker_id = $1 AND blocked_id = $2';

const BLOCKED = `
  SELECT u.username, u.name, u.photo_url AS "photoUrl", b.created_at AS since,
         count(*) OVER ()::int AS total
    FROM blocks b JOIN users u ON u.id = b.blocked_id
   WHERE b.blocker_id = $1
   ORDER BY b.created_at DESC, u.id DESC
   LIMIT $2 OFFSET $3`;

function createBlockRepository(pool) {
  /** PA-35-01: bloquea y corta todo lo que había entre los dos, de una vez. */
  async function block(userId, otherId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(BLOCK, [userId, otherId]);
      for (const sql of [DROP_FOLLOWS, DROP_FRIENDSHIPS, DROP_BOARD_FOLLOWS, DROP_NOTIFICATIONS]) {
        await client.query(sql, [userId, otherId]);
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /** PA-56-01: false si no lo tenía bloqueado. */
  async function unblock(userId, otherId) {
    return (await pool.query(UNBLOCK, [userId, otherId])).rowCount > 0;
  }

  async function findBlocked(userId, { limit, offset }) {
    const rows = (await pool.query(BLOCKED, [userId, limit, offset])).rows;
    const items = rows.map(({ username, name, photoUrl, since }) => ({
      username,
      name,
      photoUrl,
      since,
    }));
    return { total: rows[0]?.total ?? 0, items };
  }

  return { block, unblock, findBlocked };
}

module.exports = { createBlockRepository };
