// HU-03 · Buscar contenido. Consultas fijas con parámetros: el término nunca va dentro del SQL.
//   $1 = término exacto (minúsculas, sin tildes)  $2 = «empieza por»  $3 = «contiene»  $4 = límite
// Primero las coincidencias exactas, luego las que empiezan por el término y después el resto.

// Quita tildes y pasa a minúsculas sin depender de extensiones de PostgreSQL.
const fold = (column) =>
  `translate(lower(${column}), 'áàäâãéèëêíìïîóòöôõúùüûñç', 'aaaaaeeeeiiiiooooouuuunc')`;

const rank = (column) => `
  CASE WHEN ${fold(column)} = $1 THEN 0 WHEN ${fold(column)} LIKE $2 ESCAPE '\\' THEN 1 ELSE 2 END,
  length(${column}), ${column}`;

const matches = (column) => `${fold(column)} LIKE $3 ESCAPE '\\'`;

const ARTIST_NAMES = (table, key, id) => `
  (SELECT coalesce(json_agg(json_build_object('id', a.id::text, 'name', a.name)
                            ORDER BY x.position, a.name), '[]'::json)
     FROM ${table} x JOIN artists a ON a.id = x.artist_id WHERE x.${key} = ${id})`;

const SONGS_QUERY = `
  SELECT s.id::text AS id, s.title, al.id::text AS "albumId", al.title AS "albumTitle",
         al.cover_url AS "coverUrl", ${ARTIST_NAMES('song_artists', 'song_id', 's.id')} AS artists
    FROM songs s JOIN albums al ON al.id = s.album_id
   WHERE ${matches('s.title')}
   ORDER BY ${rank('s.title')} LIMIT $4`;

const ALBUMS_QUERY = `
  SELECT al.id::text AS id, al.title, al.type, al.release_year AS "releaseYear",
         al.cover_url AS "coverUrl", ${ARTIST_NAMES('album_artists', 'album_id', 'al.id')} AS artists
    FROM albums al
   WHERE ${matches('al.title')}
   ORDER BY ${rank('al.title')} LIMIT $4`;

const ARTISTS_QUERY = `
  SELECT id::text AS id, name, genre, image_url AS "imageUrl"
    FROM artists
   WHERE ${matches('name')}
   ORDER BY ${rank('name')} LIMIT $4`;

// RN-12: no aparecen los usuarios que me han bloqueado (ni los que he bloqueado yo).
// Los suspendidos tampoco salen, ni las cuentas de administración (no se exponen como objetivo).
// Se busca por nombre y por nombre de usuario, nunca por correo.
// $5 = usuario que busca, o NULL si es un visitante.
const USERS_QUERY = `
  SELECT u.username, u.name, u.photo_url AS "photoUrl"
    FROM users u
   WHERE u.status = 'active'
     AND u.role = 'user'
     AND (${matches('u.username')} OR ${matches('u.name')})
     AND NOT EXISTS (
       SELECT 1 FROM blocks b
        WHERE (b.blocker_id = u.id AND b.blocked_id = $5)
           OR (b.blocker_id = $5 AND b.blocked_id = u.id))
   ORDER BY ${rank('u.username')} LIMIT $4`;

const COMMUNITIES_QUERY = `
  SELECT c.id::text AS id, c.name::text AS name, c.access,
         (SELECT count(*)::int FROM community_memberships m WHERE m.community_id = c.id)
           AS "membersCount"
    FROM communities c
   WHERE ${matches('c.name::text')}
   ORDER BY ${rank('c.name::text')} LIMIT $4`;

function createSearchRepository(pool) {
  async function rows(query, params) {
    return (await pool.query(query, params)).rows;
  }

  /** Busca en las cinco categorías a la vez. */
  async function search({ exact, prefix, contains }, { limit, viewerId }) {
    const params = [exact, prefix, contains, limit];
    const [songs, albums, artists, users, communities] = await Promise.all([
      rows(SONGS_QUERY, params),
      rows(ALBUMS_QUERY, params),
      rows(ARTISTS_QUERY, params),
      rows(USERS_QUERY, [...params, viewerId]),
      rows(COMMUNITIES_QUERY, params),
    ]);
    return { songs, albums, artists, users, communities };
  }

  return { search };
}

module.exports = { createSearchRepository };
