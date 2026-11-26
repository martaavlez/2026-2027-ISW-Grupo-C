// HU-07 y HU-46 · Favoritos (RI-11). Consultas fijas con parámetros, una por tipo de elemento.

const ITEM_EXISTS = {
  song: 'SELECT 1 FROM songs WHERE id = $1',
  album: 'SELECT 1 FROM albums WHERE id = $1',
  artist: 'SELECT 1 FROM artists WHERE id = $1',
};

// Marcar dos veces no duplica nada (un favorito por persona y elemento).
const ADD = {
  song: `INSERT INTO favorites (user_id, song_id) VALUES ($1, $2)
         ON CONFLICT (user_id, song_id) WHERE song_id IS NOT NULL DO NOTHING`,
  album: `INSERT INTO favorites (user_id, album_id) VALUES ($1, $2)
          ON CONFLICT (user_id, album_id) WHERE album_id IS NOT NULL DO NOTHING`,
  artist: `INSERT INTO favorites (user_id, artist_id) VALUES ($1, $2)
           ON CONFLICT (user_id, artist_id) WHERE artist_id IS NOT NULL DO NOTHING`,
};

const REMOVE = {
  song: 'DELETE FROM favorites WHERE user_id = $1 AND song_id = $2',
  album: 'DELETE FROM favorites WHERE user_id = $1 AND album_id = $2',
  artist: 'DELETE FROM favorites WHERE user_id = $1 AND artist_id = $2',
};

// La actividad del favorito hereda la visibilidad de los favoritos del usuario (RN-08).
const FAVORITES_VISIBILITY = `COALESCE(
  (SELECT favorites_visibility FROM privacy_settings WHERE user_id = $1), 'public')`;

const ADD_ACTIVITY = {
  song: `INSERT INTO activities (user_id, type, song_id, privacy)
         VALUES ($1, 'favorite', $2, ${FAVORITES_VISIBILITY})`,
  album: `INSERT INTO activities (user_id, type, album_id, privacy)
          VALUES ($1, 'favorite', $2, ${FAVORITES_VISIBILITY})`,
  artist: `INSERT INTO activities (user_id, type, artist_id, privacy)
           VALUES ($1, 'favorite', $2, ${FAVORITES_VISIBILITY})`,
};

const REMOVE_ACTIVITY = {
  song: "DELETE FROM activities WHERE user_id = $1 AND type = 'favorite' AND song_id = $2",
  album: "DELETE FROM activities WHERE user_id = $1 AND type = 'favorite' AND album_id = $2",
  artist: "DELETE FROM activities WHERE user_id = $1 AND type = 'favorite' AND artist_id = $2",
};

const IS_FAVORITE = {
  song: 'SELECT 1 FROM favorites WHERE user_id = $1 AND song_id = $2',
  album: 'SELECT 1 FROM favorites WHERE user_id = $1 AND album_id = $2',
  artist: 'SELECT 1 FROM favorites WHERE user_id = $1 AND artist_id = $2',
};

const ARTIST_NAMES = (table, key, id) => `
  (SELECT coalesce(json_agg(json_build_object('id', a.id::text, 'name', a.name)
                            ORDER BY x.position, a.name), '[]'::json)
     FROM ${table} x JOIN artists a ON a.id = x.artist_id WHERE x.${key} = ${id})`;

const MY_SONGS = `
  SELECT s.id::text AS id, s.title, al.id::text AS "albumId", al.title AS "albumTitle",
         al.cover_url AS "coverUrl", ${ARTIST_NAMES('song_artists', 'song_id', 's.id')} AS artists
    FROM favorites f JOIN songs s ON s.id = f.song_id JOIN albums al ON al.id = s.album_id
   WHERE f.user_id = $1 ORDER BY f.created_at DESC, f.id DESC
   LIMIT $2 OFFSET $3`;

const MY_ALBUMS = `
  SELECT al.id::text AS id, al.title, al.type, al.release_year AS "releaseYear",
         al.cover_url AS "coverUrl", ${ARTIST_NAMES('album_artists', 'album_id', 'al.id')} AS artists
    FROM favorites f JOIN albums al ON al.id = f.album_id
   WHERE f.user_id = $1 ORDER BY f.created_at DESC, f.id DESC
   LIMIT $2 OFFSET $3`;

const MY_ARTISTS = `
  SELECT ar.id::text AS id, ar.name, ar.genre, ar.image_url AS "imageUrl"
    FROM favorites f JOIN artists ar ON ar.id = f.artist_id
   WHERE f.user_id = $1 ORDER BY f.created_at DESC, f.id DESC
   LIMIT $2 OFFSET $3`;

const MY_LISTS = { song: MY_SONGS, album: MY_ALBUMS, artist: MY_ARTISTS };

const COUNT = {
  song: 'SELECT count(*)::int AS total FROM favorites WHERE user_id = $1 AND song_id IS NOT NULL',
  album: 'SELECT count(*)::int AS total FROM favorites WHERE user_id = $1 AND album_id IS NOT NULL',
  artist:
    'SELECT count(*)::int AS total FROM favorites WHERE user_id = $1 AND artist_id IS NOT NULL',
};

function createFavoriteRepository(pool) {
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

  /** Marca el favorito. Devuelve false si el elemento no existe. */
  async function add(kind, itemId, userId) {
    return inTransaction(async (client) => {
      if ((await client.query(ITEM_EXISTS[kind], [itemId])).rowCount === 0) return false;
      const inserted = await client.query(ADD[kind], [userId, itemId]);
      if (inserted.rowCount > 0) await client.query(ADD_ACTIVITY[kind], [userId, itemId]);
      return true;
    });
  }

  /** Lo quita (si no era favorito, no pasa nada). Devuelve false si el elemento no existe. */
  async function remove(kind, itemId, userId) {
    return inTransaction(async (client) => {
      if ((await client.query(ITEM_EXISTS[kind], [itemId])).rowCount === 0) return false;
      await client.query(REMOVE[kind], [userId, itemId]);
      await client.query(REMOVE_ACTIVITY[kind], [userId, itemId]);
      return true;
    });
  }

  async function isFavorite(kind, itemId, userId) {
    if (!userId) return false;
    return (await pool.query(IS_FAVORITE[kind], [userId, itemId])).rowCount > 0;
  }

  /** Una página de una subcategoría de sus favoritos, del más reciente, con el total. */
  async function findPage(userId, kind, { limit, offset }) {
    const [items, total] = await Promise.all([
      pool.query(MY_LISTS[kind], [userId, limit, offset]),
      pool.query(COUNT[kind], [userId]),
    ]);
    return { total: total.rows[0].total, items: items.rows };
  }

  /** La primera página de cada subcategoría (pestaña Favoritos del perfil). */
  async function findByUser(userId, { limit, offset = 0 }) {
    const [songs, albums, artists] = await Promise.all(
      ['song', 'album', 'artist'].map((kind) => findPage(userId, kind, { limit, offset })),
    );
    return { songs, albums, artists };
  }

  return { add, remove, isFavorite, findByUser, findPage };
}

module.exports = { createFavoriteRepository };
