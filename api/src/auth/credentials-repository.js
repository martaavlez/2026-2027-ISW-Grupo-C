// Consultas del inicio de sesión (HU-02). Siempre con parámetros.

const USER_FIELDS = `id, name, username, email::text AS email, role, status,
                     suspension_reason AS "suspensionReason"`;

// Se puede entrar con el correo o con el nombre de usuario, sin distinguir mayúsculas (RN-01).
const BY_EMAIL = `SELECT ${USER_FIELDS}, password_hash AS "passwordHash" FROM users WHERE email = $1`;
const BY_USERNAME = `SELECT ${USER_FIELDS}, password_hash AS "passwordHash"
                       FROM users WHERE lower(username) = lower($1)`;
const BY_ID = `SELECT ${USER_FIELDS} FROM users WHERE id = $1`;

function createCredentialsRepository(pool) {
  /** Usuario con su resumen de contraseña, buscado por correo o nombre de usuario. */
  async function findForLogin(login) {
    const query = login.includes('@') ? BY_EMAIL : BY_USERNAME;
    const { rows } = await pool.query(query, [login]);
    return rows[0] ?? null;
  }

  /** Usuario sin la contraseña, para comprobar una sesión. */
  async function findById(id) {
    const { rows } = await pool.query(BY_ID, [id]);
    return rows[0] ?? null;
  }

  return { findForLogin, findById };
}

module.exports = { createCredentialsRepository };
