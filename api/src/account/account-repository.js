// HU-45 · Editar mi perfil: nombre, biografía y foto del usuario (RI-01).
// Consultas fijas con parámetros; $1 es siempre el usuario del token.

const UPDATE_PROFILE = `
  UPDATE users SET name = $2, bio = $3
   WHERE id = $1 AND status = 'active'
  RETURNING name, bio`;

// La foto se guarda en la base de datos y se sirve desde la API; photo_url apunta a ella, con
// la hora del cambio para que el navegador no muestre la anterior.
const SAVE_PHOTO = `
  UPDATE users
     SET photo_data = $2, photo_type = $3,
         photo_url = '/users/' || username || '/photo?v=' || floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint
   WHERE id = $1 AND status = 'active'
  RETURNING photo_url AS "photoUrl"`;

const REMOVE_PHOTO = `
  UPDATE users SET photo_data = NULL, photo_type = NULL, photo_url = NULL
   WHERE id = $1 AND status = 'active'
  RETURNING id`;

const PHOTO = `
  SELECT photo_data AS data, photo_type AS type
    FROM users
   WHERE lower(username) = lower($1) AND status = 'active' AND photo_data IS NOT NULL`;

function createAccountRepository(pool) {
  /** Cambia el nombre y la biografía. null si la cuenta ya no está activa. */
  async function updateProfile(userId, { name, bio }) {
    return (await pool.query(UPDATE_PROFILE, [userId, name, bio])).rows[0] ?? null;
  }

  /** Guarda la foto y devuelve su dirección. null si la cuenta ya no está activa. */
  async function savePhoto(userId, { data, type }) {
    return (await pool.query(SAVE_PHOTO, [userId, data, type])).rows[0]?.photoUrl ?? null;
  }

  async function removePhoto(userId) {
    return (await pool.query(REMOVE_PHOTO, [userId])).rowCount > 0;
  }

  /** La foto subida de un usuario activo, o null. */
  async function findPhoto(username) {
    return (await pool.query(PHOTO, [username])).rows[0] ?? null;
  }

  return { updateProfile, savePhoto, removePhoto, findPhoto };
}

module.exports = { createAccountRepository };
