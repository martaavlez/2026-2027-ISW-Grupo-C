// HU-09, HU-25, HU-49, HU-26, HU-50 y HU-34 · Tableros (RI-12). Consultas fijas con parámetros.
const { DEFAULT_PRIVACY } = require('../ratings/rating-repository');

// Portada del tablero: la del elemento elegido o, si no hay, la del primero que se añadió.
// La carátula de una canción es la de su álbum.
const ITEM_COVER = (condition) => `
  (SELECT COALESCE(al.cover_url, sal.cover_url)
     FROM board_items i
     LEFT JOIN albums al ON al.id = i.album_id
     LEFT JOIN songs s ON s.id = i.song_id
     LEFT JOIN albums sal ON sal.id = s.album_id
    WHERE i.board_id = b.id AND ${condition}
    ORDER BY i.added_at, i.id LIMIT 1)`;

const BOARD = `
  SELECT b.id::text AS id, b.name, b.description, b.privacy, b.owner_id::text AS "ownerId",
         b.cover_item_id::text AS "coverItemId", b.created_at AS "createdAt",
         u.username, u.name AS "ownerName", u.photo_url AS "ownerPhotoUrl",
         (SELECT count(*)::int FROM board_items i WHERE i.board_id = b.id) AS "itemsCount",
         (SELECT count(*)::int FROM board_followers f WHERE f.board_id = b.id) AS "followersCount",
         COALESCE(${ITEM_COVER('i.id = b.cover_item_id')}, ${ITEM_COVER('TRUE')}) AS "coverUrl"
    FROM boards b JOIN users u ON u.id = b.owner_id
   WHERE b.id = $1 AND u.status = 'active'`;

const ARTIST_NAMES = (table, key, id) => `
  (SELECT coalesce(json_agg(json_build_object('id', a.id::text, 'name', a.name)
                            ORDER BY x.position, a.name), '[]'::json)
     FROM ${table} x JOIN artists a ON a.id = x.artist_id WHERE x.${key} = ${id})`;

// Contenido del tablero, del primero al último que se añadió, con la nota de quien mira ($2).
const ITEMS = `
  SELECT i.id::text AS id, i.added_at AS "addedAt",
         CASE WHEN i.song_id IS NOT NULL THEN 'song' ELSE 'album' END AS kind,
         COALESCE(s.id, al.id)::text AS "catalogId",
         COALESCE(s.title, al.title) AS title,
         COALESCE(sal.cover_url, al.cover_url) AS "coverUrl",
         COALESCE(sal.type, al.type) AS "albumType",
         CASE WHEN i.song_id IS NOT NULL THEN ${ARTIST_NAMES('song_artists', 'song_id', 's.id')}
              ELSE ${ARTIST_NAMES('album_artists', 'album_id', 'al.id')} END AS artists,
         (SELECT r.rating FROM reviews r
           WHERE r.author_id = $2
             AND ((i.song_id IS NOT NULL AND r.song_id = i.song_id)
               OR (i.album_id IS NOT NULL AND r.album_id = i.album_id))) AS "myRating"
    FROM board_items i
    LEFT JOIN songs s ON s.id = i.song_id
    LEFT JOIN albums sal ON sal.id = s.album_id
    LEFT JOIN albums al ON al.id = i.album_id
   WHERE i.board_id = $1
   ORDER BY i.added_at, i.id
   LIMIT 500`;

// RN-09: sin privacidad elegida, la de su configuración. La actividad hereda la del tablero (RN-08).
const CREATE = `
  WITH board AS (
    INSERT INTO boards (owner_id, name, description, privacy)
    VALUES ($1, $2, $3, COALESCE($4::privacy_level, ${DEFAULT_PRIVACY}))
    RETURNING id, privacy
  ), activity AS (
    INSERT INTO activities (user_id, type, board_id, privacy)
    SELECT $1, 'board_created', id, privacy FROM board
  )
  SELECT id::text AS id FROM board`;

// RN-13: solo su propietario. Bloquea el tablero mientras se cambia.
const LOCK_OWN = 'SELECT privacy FROM boards WHERE id = $1 AND owner_id = $2 FOR UPDATE';

const ITEM_IN_BOARD = 'SELECT 1 FROM board_items WHERE id = $2 AND board_id = $1';

const ITEM_EXISTS = {
  song: 'SELECT 1 FROM songs WHERE id = $1',
  album: 'SELECT 1 FROM albums WHERE id = $1',
};

// RN-14: el índice único impide repetir un elemento, aunque lleguen dos peticiones a la vez.
const ADD_ITEM = {
  song: `INSERT INTO board_items (board_id, song_id) VALUES ($1, $2)
         ON CONFLICT (board_id, song_id) WHERE song_id IS NOT NULL DO NOTHING RETURNING id::text AS id`,
  album: `INSERT INTO board_items (board_id, album_id) VALUES ($1, $2)
          ON CONFLICT (board_id, album_id) WHERE album_id IS NOT NULL DO NOTHING RETURNING id::text AS id`,
};

const ADD_ITEM_ACTIVITY = {
  song: `INSERT INTO activities (user_id, type, board_id, song_id, privacy)
         VALUES ($1, 'board_item_added', $2, $3, $4)`,
  album: `INSERT INTO activities (user_id, type, board_id, album_id, privacy)
          VALUES ($1, 'board_item_added', $2, $3, $4)`,
};

const REMOVE_ITEM =
  'DELETE FROM board_items WHERE id = $2 AND board_id = $1 RETURNING song_id, album_id';

const REMOVE_ITEM_ACTIVITY = `
  DELETE FROM activities
   WHERE board_id = $1 AND type = 'board_item_added'
     AND song_id IS NOT DISTINCT FROM $2 AND album_id IS NOT DISTINCT FROM $3`;

// PA-34-03 y RN-15: al dejar de ser público, dejan de seguirlo quienes ya no pueden verlo
// (con «solo amigos» se quedan sus amigos; con «privado», nadie).
const DROP_FOLLOWERS_WITHOUT_ACCESS = `
  DELETE FROM board_followers bf
   WHERE bf.board_id = $1
     AND ($3 = 'private' OR NOT EXISTS (
           SELECT 1 FROM friendships f
            WHERE f.status = 'accepted'
              AND ((f.requester_id = $2 AND f.recipient_id = bf.user_id)
                OR (f.recipient_id = $2 AND f.requester_id = bf.user_id))))`;

const MY_BOARDS_FOR_ITEM = {
  song: `SELECT b.id::text AS id, b.name, b.privacy,
                EXISTS (SELECT 1 FROM board_items i WHERE i.board_id = b.id AND i.song_id = $2) AS contains
           FROM boards b WHERE b.owner_id = $1 ORDER BY b.created_at DESC, b.id DESC LIMIT 200`,
  album: `SELECT b.id::text AS id, b.name, b.privacy,
                 EXISTS (SELECT 1 FROM board_items i WHERE i.board_id = b.id AND i.album_id = $2) AS contains
            FROM boards b WHERE b.owner_id = $1 ORDER BY b.created_at DESC, b.id DESC LIMIT 200`,
};

function createBoardRepository(pool) {
  async function inTransaction(work) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await work(client);
      await client.query(result === null ? 'ROLLBACK' : 'COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async function create(userId, { name, description, privacy }) {
    return (await pool.query(CREATE, [userId, name, description, privacy])).rows[0].id;
  }

  /** El tablero de un usuario activo, sin su contenido, o null. */
  async function findBoard(boardId) {
    return (await pool.query(BOARD, [boardId])).rows[0] ?? null;
  }

  async function findItems(boardId, viewerId) {
    return (await pool.query(ITEMS, [boardId, viewerId ?? null])).rows;
  }

  /** Cambia lo indicado. null si el tablero no existe o no es suyo; 'badCover' si la portada no es de él. */
  async function update(boardId, userId, changes) {
    return inTransaction(async (client) => {
      const own = (await client.query(LOCK_OWN, [boardId, userId])).rows[0];
      if (!own) return null;
      if (
        changes.coverItemId &&
        (await client.query(ITEM_IN_BOARD, [boardId, changes.coverItemId])).rowCount === 0
      ) {
        return 'badCover';
      }
      const sets = [];
      const values = [boardId];
      const columns = {
        name: 'name',
        description: 'description',
        privacy: 'privacy',
        coverItemId: 'cover_item_id',
      };
      for (const [key, column] of Object.entries(columns)) {
        if (key in changes) {
          values.push(changes[key]);
          sets.push(`${column} = $${values.length}${key === 'privacy' ? '::privacy_level' : ''}`);
        }
      }
      // Las columnas salen de la lista fija de arriba; los valores van siempre como parámetros.
      await client.query(
        `UPDATE boards SET ${sets.join(', ')}, updated_at = now() WHERE id = $1`,
        values,
      );
      if (changes.privacy && changes.privacy !== own.privacy) {
        await client.query('UPDATE activities SET privacy = $2 WHERE board_id = $1', [
          boardId,
          changes.privacy,
        ]);
        if (changes.privacy !== 'public') {
          await client.query(DROP_FOLLOWERS_WITHOUT_ACCESS, [boardId, userId, changes.privacy]);
        }
      }
      return 'updated';
    });
  }

  /** HU-50 · Borra el tablero con su contenido, sus seguidores y su actividad (en cascada). */
  async function remove(boardId, userId) {
    return (
      (await pool.query('DELETE FROM boards WHERE id = $1 AND owner_id = $2', [boardId, userId]))
        .rowCount > 0
    );
  }

  /**
   * HU-25 · Añade una canción o un álbum. null si el tablero no es suyo, 'missing' si el
   * elemento no existe y 'duplicate' si ya estaba (PA-25-02).
   */
  async function addItem(boardId, userId, { kind, itemId }) {
    return inTransaction(async (client) => {
      const own = (await client.query(LOCK_OWN, [boardId, userId])).rows[0];
      if (!own) return null;
      if ((await client.query(ITEM_EXISTS[kind], [itemId])).rowCount === 0) return 'missing';
      const added = await client.query(ADD_ITEM[kind], [boardId, itemId]);
      if (added.rowCount === 0) return 'duplicate';
      await client.query(ADD_ITEM_ACTIVITY[kind], [userId, boardId, itemId, own.privacy]);
      return { id: added.rows[0].id };
    });
  }

  /** HU-49 · Quita un elemento. null si el tablero no es suyo; false si el elemento no estaba. */
  async function removeItem(boardId, userId, boardItemId) {
    return inTransaction(async (client) => {
      if (!(await client.query(LOCK_OWN, [boardId, userId])).rows[0]) return null;
      const removed = (await client.query(REMOVE_ITEM, [boardId, boardItemId])).rows[0];
      if (!removed) return false;
      await client.query(REMOVE_ITEM_ACTIVITY, [boardId, removed.song_id, removed.album_id]);
      return true;
    });
  }

  /** Sus tableros, diciendo en cuáles está ya la canción o el álbum («+ A un tablero»). */
  async function findMineFor(userId, { kind, itemId }) {
    return (await pool.query(MY_BOARDS_FOR_ITEM[kind], [userId, itemId])).rows;
  }

  return { create, findBoard, findItems, update, remove, addItem, removeItem, findMineFor };
}

module.exports = { createBoardRepository };
