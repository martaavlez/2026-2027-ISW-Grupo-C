// HU-41 · Enviar una solicitud de amistad, HU-58 · Responderla y HU-42 · Eliminar una amistad
// (RI-04, RN-11). Consultas fijas con parámetros; $1 es siempre quien tiene la sesión.

// Estado entre dos personas, visto por $1: amigos, solicitud enviada, recibida o nada.
const STATE = `
  SELECT id::text AS id, status,
         CASE WHEN requester_id = $1 THEN 'sent' ELSE 'received' END AS direction
    FROM friendships
   WHERE status IN ('pending', 'accepted')
     AND ((requester_id = $1 AND recipient_id = $2) OR (requester_id = $2 AND recipient_id = $1))`;

const BLOCKED = `
  SELECT 1 FROM blocks
   WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)`;

// RN-11: el índice friendships_one_open_pair impide dos solicitudes abiertas entre las mismas
// personas, aunque lleguen a la vez.
const SEND = `
  INSERT INTO friendships (requester_id, recipient_id) VALUES ($1, $2)
  ON CONFLICT DO NOTHING RETURNING id`;

const NOTIFY = `
  INSERT INTO notifications (recipient_id, type, related_kind, related_id)
  VALUES ($1, $2, 'user', $3)`;

// PA-41-02: la notificación de una solicitud que ya no está pendiente desaparece.
const UNNOTIFY_REQUEST = `
  DELETE FROM notifications
   WHERE recipient_id = $1 AND type = 'friend_request' AND related_kind = 'user' AND related_id = $2`;

const CANCEL = `
  UPDATE friendships SET status = 'cancelled', responded_at = now()
   WHERE requester_id = $1 AND recipient_id = $2 AND status = 'pending'
  RETURNING id`;

const RESPOND = `
  UPDATE friendships SET status = $3, responded_at = now()
   WHERE id = $2 AND recipient_id = $1 AND status = 'pending'
  RETURNING requester_id::text AS "requesterId"`;

// PA-42-02: solo se borra la amistad; los seguimientos (follows) no se tocan.
const REMOVE = `
  DELETE FROM friendships
   WHERE status = 'accepted'
     AND ((requester_id = $1 AND recipient_id = $2) OR (requester_id = $2 AND recipient_id = $1))
  RETURNING id`;

const PERSON = `u.username, u.name, u.photo_url AS "photoUrl"`;

// Solo de cuentas activas y sin bloqueos de por medio.
const VISIBLE_PERSON = `
  u.status = 'active'
  AND NOT EXISTS (SELECT 1 FROM blocks b
                   WHERE (b.blocker_id = $1 AND b.blocked_id = u.id)
                      OR (b.blocker_id = u.id AND b.blocked_id = $1))`;

const RECEIVED = `
  SELECT f.id::text AS id, f.requested_at AS "requestedAt", ${PERSON}
    FROM friendships f JOIN users u ON u.id = f.requester_id
   WHERE f.recipient_id = $1 AND f.status = 'pending' AND ${VISIBLE_PERSON}
   ORDER BY f.requested_at DESC, f.id DESC
   LIMIT $2`;

const FRIENDS = `
  SELECT ${PERSON}, f.responded_at AS since, count(*) OVER ()::int AS total
    FROM friendships f
    JOIN users u ON u.id = CASE WHEN f.requester_id = $1 THEN f.recipient_id ELSE f.requester_id END
   WHERE f.status = 'accepted' AND (f.requester_id = $1 OR f.recipient_id = $1) AND ${VISIBLE_PERSON}
   ORDER BY f.responded_at DESC, f.id DESC
   LIMIT $2 OFFSET $3`;

function createFriendRepository(pool) {
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

  /** 'friends', 'sent' (con su id), 'received' (con su id) o 'none'. */
  async function findState(userId, otherId) {
    const row = (await pool.query(STATE, [userId, otherId])).rows[0];
    if (!row) return { friendship: 'none', requestId: null };
    if (row.status === 'accepted') return { friendship: 'friends', requestId: null };
    return { friendship: row.direction, requestId: row.id };
  }

  async function isBlocked(userId, otherId) {
    return (await pool.query(BLOCKED, [userId, otherId])).rowCount > 0;
  }

  /** PA-41-01: crea la solicitud y avisa al destinatario. false si ya había una abierta. */
  async function send(userId, otherId) {
    return inTransaction(async (client) => {
      if ((await client.query(SEND, [userId, otherId])).rowCount === 0) return false;
      await client.query(NOTIFY, [otherId, 'friend_request', userId]);
      return true;
    });
  }

  /** PA-41-02: cancela su solicitud pendiente y quita la notificación. */
  async function cancel(userId, otherId) {
    return inTransaction(async (client) => {
      if ((await client.query(CANCEL, [userId, otherId])).rowCount === 0) return false;
      await client.query(UNNOTIFY_REQUEST, [otherId, userId]);
      return true;
    });
  }

  /**
   * HU-58 · Acepta (PA-58-01) o rechaza (PA-58-02) una solicitud recibida. Al aceptarla se
   * avisa a quien la envió. false si no existe, no es suya o ya no está pendiente.
   */
  async function respond(userId, requestId, accept) {
    return inTransaction(async (client) => {
      const status = accept ? 'accepted' : 'rejected';
      const updated = await client.query(RESPOND, [userId, requestId, status]);
      if (updated.rowCount === 0) return false;
      const { requesterId } = updated.rows[0];
      await client.query(UNNOTIFY_REQUEST, [userId, requesterId]);
      if (accept) await client.query(NOTIFY, [requesterId, 'friend_accepted', userId]);
      return true;
    });
  }

  /** HU-42 · Borra la amistad (PA-42-01). false si no eran amigos. */
  async function remove(userId, otherId) {
    return (await pool.query(REMOVE, [userId, otherId])).rowCount > 0;
  }

  async function findReceived(userId, { limit }) {
    return (await pool.query(RECEIVED, [userId, limit])).rows;
  }

  async function findFriends(userId, { limit, offset }) {
    const rows = (await pool.query(FRIENDS, [userId, limit, offset])).rows;
    const items = rows.map((row) => ({
      username: row.username,
      name: row.name,
      photoUrl: row.photoUrl,
      since: row.since,
    }));
    return { total: rows[0]?.total ?? 0, items };
  }

  return { findState, isBlocked, send, cancel, respond, remove, findReceived, findFriends };
}

module.exports = { createFriendRepository };
