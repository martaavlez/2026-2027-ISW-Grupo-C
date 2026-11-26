-- Portada de los tableros: la carátula de uno de sus elementos (perfil · HU-06; se elige al editar el tablero).
-- Para una base de datos que ya existe; las nuevas ya lo traen en schema.sql.
--   psql -U postgres -d repeat -f db/migrations/002-portada-tableros.sql
ALTER TABLE boards ADD COLUMN IF NOT EXISTS cover_item_id BIGINT REFERENCES board_items(id) ON DELETE SET NULL;
