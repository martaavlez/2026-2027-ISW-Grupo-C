-- Foto de perfil subida por el usuario (HU-45 · Editar mi perfil).
-- Para una base de datos que ya existe; las nuevas ya lo traen en schema.sql.
--   PGCLIENTENCODING=UTF8 psql -U postgres -d repeat -f db/migrations/003-fotos-usuarios.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_data BYTEA;
ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_type VARCHAR(10);
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_photo_check;
ALTER TABLE users ADD CONSTRAINT users_photo_check CHECK (
  (photo_data IS NULL AND photo_type IS NULL)
  OR (photo_type IN ('image/jpeg', 'image/png', 'image/webp') AND octet_length(photo_data) <= 1048576)
);
