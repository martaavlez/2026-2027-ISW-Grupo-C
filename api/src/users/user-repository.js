// Acceso a la tabla de usuarios (RI-01) y a su configuración de privacidad (RI-02).

const PUBLIC_COLUMNS = 'id, name, username, email, role, created_at AS "createdAt"';

function createUserRepository(pool) {
  /** RN-01: busca si el nombre de usuario o el correo ya están registrados (sin distinguir mayúsculas). */
  async function findTakenFields({ username, email }) {
    const { rows } = await pool.query(
      `SELECT lower(username) = lower($1) AS "usernameTaken", email = $2 AS "emailTaken"
         FROM users WHERE lower(username) = lower($1) OR email = $2`,
      [username, email],
    );
    return {
      username: rows.some((row) => row.usernameTaken),
      email: rows.some((row) => row.emailTaken),
    };
  }

  /** Crea el usuario y su configuración de privacidad por defecto en una sola transacción. */
  async function createWithDefaultPrivacy({ name, username, email, passwordHash }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO users (name, username, email, password_hash, privacy_accepted_at)
         VALUES ($1, $2, $3, $4, now())
         RETURNING ${PUBLIC_COLUMNS}`,
        [name, username, email, passwordHash],
      );
      // RI-02: público por defecto para reseñas, tableros y favoritos.
      await client.query('INSERT INTO privacy_settings (user_id) VALUES ($1)', [rows[0].id]);
      await client.query('COMMIT');
      return rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /** Devuelve el id del usuario si existe y no está suspendido; si no, null. */
  async function findActiveId(id) {
    const { rows } = await pool.query(
      "SELECT id::text AS id FROM users WHERE id = $1 AND status = 'active'",
      [id],
    );
    return rows[0]?.id ?? null;
  }

  return { findTakenFields, createWithDefaultPrivacy, findActiveId };
}

module.exports = { createUserRepository };
