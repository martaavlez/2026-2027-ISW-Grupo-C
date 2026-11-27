// HU-10 · Seguir a un usuario y HU-48 · Dejar de seguirlo (RI-03, RN-10). Consultas fijas con
// parámetros; $1 es siempre quien tiene la sesión.

// RN-10: sin aprobación. La clave primaria impide seguir dos veces, aunque lleguen dos peticiones.
const FOLLOW = `
  INSERT INTO follows (follower_id, followed_id) VALUES ($1, $2)
  ON CONFLICT DO NOTHING RETURNING followed_id`;

const NOTIFY = `
  INSERT INTO notifications (recipient_id, type, related_kind, related_id)
  VALUES ($2, 'new_follower', 'user', $1)`;

const UNFOLLOW =
  'DELETE FROM follows WHERE follower_id = $1 AND followed_id = $2 RETURNING followed_id';

// Si deja de seguirle, el aviso de «te sigue» ya no tiene sentido.
const UNNOTIFY = `
  DELETE FROM notifications
   WHERE recipient_id = $2 AND type = 'new_follower' AND related_kind = 'user' AND related_id = $1`;

const FOLLOWERS = 'SELECT count(*)::int AS n FROM follows WHERE followed_id = $1';

// A quién sigue, del último al primero. Solo cuentas activas y sin bloqueos de por medio.
const FOLLOWING = `
  SELECT u.username, u.name, u.photo_url AS "photoUrl", f.created_at AS since,
         count(*) OVER ()::int AS total
    FROM follows f JOIN users u ON u.id = f.followed_id
   WHERE f.follower_id = $1 AND u.status = 'active'
     AND NOT EXISTS (SELECT 1 FROM blocks b
                      WHERE (b.blocker_id = $1 AND b.blocked_id = u.id)
                         OR (b.blocker_id = u.id AND b.blocked_id = $1))
   ORDER BY f.created_at DESC, u.id DESC
   LIMIT $2 OFFSET $3`;

function createFollowRepository(pool) {
  async function inTransaction(work) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await work(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /** PA-10-01: le sigue y le avisa. Si ya le seguía, no cambia nada. */
  async function follow(userId, otherId) {
    return inTransaction(async (client) => {
      if ((await client.query(FOLLOW, [userId, otherId])).rowCount > 0) {
        await client.query(NOTIFY, [userId, otherId]);
      }
    });
  }

  /** PA-48-01: deja de seguirle. Si no le seguía, no cambia nada. */
  async function unfollow(userId, otherId) {
    return inTransaction(async (client) => {
      if ((await client.query(UNFOLLOW, [userId, otherId])).rowCount > 0) {
        await client.query(UNNOTIFY, [userId, otherId]);
      }
    });
  }

  async function countFollowers(userId) {
    return (await pool.query(FOLLOWERS, [userId])).rows[0].n;
  }

  async function findFollowing(userId, { limit, offset }) {
    const rows = (await pool.query(FOLLOWING, [userId, limit, offset])).rows;
    const items = rows.map(({ username, name, photoUrl, since }) => ({
      username,
      name,
      photoUrl,
      since,
    }));
    return { total: rows[0]?.total ?? 0, items };
  }

  return { follow, unfollow, countFollowers, findFollowing };
}

module.exports = { createFollowRepository };
