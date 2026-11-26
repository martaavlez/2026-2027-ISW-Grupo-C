-- Fotos de artistas desde Wikimedia Commons (importación del catálogo · HU-20).
-- Para una base de datos que ya existe; las nuevas ya lo traen en schema.sql.
--   psql -U postgres -d repeat -f db/migrations/001-fotos-artistas.sql
ALTER TABLE artists ADD COLUMN IF NOT EXISTS image_credit VARCHAR(300);
ALTER TABLE artists ADD COLUMN IF NOT EXISTS image_checked_at TIMESTAMPTZ;
