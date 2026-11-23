-- =====================================================================
-- Repeat · Datos de prueba para desarrollo y tests (Tarea 5)
-- Usuarios ficticios (nunca nombres reales del equipo) y un catálogo
-- inventado. El catálogo real llega con la importación de MusicBrainz (HU-20).
-- Todas las cuentas tienen la contraseña de prueba: Repeat2026
-- =====================================================================
BEGIN;

-- Usuarios (RI-01) y su configuración de privacidad (RI-02)
INSERT INTO users (id, name, username, email, password_hash, bio, role, status, suspension_reason, privacy_accepted_at) VALUES
 (1, 'Admin Repeat',  'admin',        'admin@repeat.test',  '$2b$10$YpxrEeD3x0FsQFY37WnYIuKXAHDfHdGI.gvCNjgN7S1h01DyiJfum', 'Cuenta de administración de pruebas.', 'admin', 'active', NULL, now()),
 (2, 'Lucía Vinilo',  'lucia.vinilo', 'lucia@repeat.test',  '$2b$10$YpxrEeD3x0FsQFY37WnYIuKXAHDfHdGI.gvCNjgN7S1h01DyiJfum', 'Indie y pop de los 2000.',            'user',  'active', NULL, now()),
 (3, 'Marco Casete',  'marco_casete', 'marco@repeat.test',  '$2b$10$YpxrEeD3x0FsQFY37WnYIuKXAHDfHdGI.gvCNjgN7S1h01DyiJfum', 'Rock y lo que suene en la radio.',     'user',  'active', NULL, now()),
 (4, 'Nora Eco',      'nora.eco',     'nora@repeat.test',   '$2b$10$YpxrEeD3x0FsQFY37WnYIuKXAHDfHdGI.gvCNjgN7S1h01DyiJfum', NULL,                                   'user',  'active', NULL, now()),
 (5, 'Teo Bucle',     'teo.bucle',    'teo@repeat.test',    '$2b$10$YpxrEeD3x0FsQFY37WnYIuKXAHDfHdGI.gvCNjgN7S1h01DyiJfum', NULL,                                   'user',  'suspended', 'Spam repetido en reseñas.', now());

INSERT INTO privacy_settings (user_id, default_content_privacy, favorites_visibility) VALUES
 (1, 'public', 'public'), (2, 'public', 'public'), (3, 'friends', 'friends'), (4, 'private', 'public'), (5, 'public', 'public');

-- Relaciones entre usuarios (RI-03, RI-04, RI-05)
INSERT INTO follows (follower_id, followed_id) VALUES (2, 3), (3, 2), (4, 2), (2, 4);
INSERT INTO friendships (requester_id, recipient_id, status, responded_at) VALUES
 (2, 3, 'accepted', now()),
 (4, 2, 'pending',  NULL);
INSERT INTO blocks (blocker_id, blocked_id) VALUES (4, 5);

-- Catálogo inventado (RI-06, RI-07, RI-08); el álbum 4 y la canción 10 tienen dos artistas
INSERT INTO artists (id, name, genre, description, external_id) VALUES
 (1, 'Las Polillas',       'Indie pop', 'Grupo inventado para las pruebas.', 'seed-artist-001'),
 (2, 'Marea Baja',         'Rock',      'Grupo inventado para las pruebas.', 'seed-artist-002'),
 (3, 'Dúo Medianoche',     'Electrónica', 'Dúo inventado para las pruebas.', 'seed-artist-003');

INSERT INTO albums (id, title, genre, type, release_year, external_id) VALUES
 (1, 'Luz de Neón',        'Indie pop',   'album',  2025, 'seed-album-001'),
 (2, 'Cinta Rebobinada',   'Indie pop',   'ep',     2023, 'seed-album-002'),
 (3, 'Faro Apagado',       'Rock',        'album',  2021, 'seed-album-003'),
 (4, 'Encuentros',         'Electrónica', 'single', 2024, 'seed-album-004');

INSERT INTO album_artists (album_id, artist_id, position) VALUES
 (1, 1, 1), (2, 1, 1), (3, 2, 1), (4, 3, 1), (4, 1, 2);

INSERT INTO songs (id, title, album_id, track_number, duration_seconds, genre, external_id) VALUES
 (1,  'Luz de neón',       1, 1, 221, 'Indie pop',   'seed-song-001'),
 (2,  'Cinta rebobinada',  1, 2, 242, 'Indie pop',   'seed-song-002'),
 (3,  'Ventanilla',        1, 3, 178, 'Indie pop',   'seed-song-003'),
 (4,  'Último autobús',    1, 4, 207, 'Indie pop',   'seed-song-004'),
 (5,  'Lado B',            2, 1, 195, 'Indie pop',   'seed-song-005'),
 (6,  'Rebobinar',         2, 2, 210, 'Indie pop',   'seed-song-006'),
 (7,  'Faro apagado',      3, 1, 264, 'Rock',        'seed-song-007'),
 (8,  'Mar de fondo',      3, 2, 231, 'Rock',        'seed-song-008'),
 (9,  'Bajamar',           3, 3, 199, 'Rock',        'seed-song-009'),
 (10, 'Encuentros',        4, 1, 233, 'Electrónica', 'seed-song-010');

INSERT INTO song_artists (song_id, artist_id, position) VALUES
 (1,1,1),(2,1,1),(3,1,1),(4,1,1),(5,1,1),(6,1,1),(7,2,1),(8,2,1),(9,2,1),(10,3,1),(10,1,2);

-- Reseñas (RI-10) y medias recalculadas (RN-07)
INSERT INTO reviews (author_id, song_id, album_id, rating, body, privacy) VALUES
 (2, NULL, 1, 5, 'El mejor álbum del año, de principio a fin.', 'public'),
 (3, NULL, 1, 4, NULL, 'friends'),
 (4, NULL, 1, 4, 'Muy bueno, aunque se hace corto.', 'private'),
 (2, 2, NULL, 5, 'Suena a viaje nocturno.', 'public'),
 (3, 7, NULL, 3, 'Correcta, sin más.', 'friends');
UPDATE albums SET average_rating = 4.3 WHERE id = 1;
UPDATE songs  SET average_rating = 5.0 WHERE id = 2;
UPDATE songs  SET average_rating = 3.0 WHERE id = 7;

-- Favoritos (RI-11)
INSERT INTO favorites (user_id, song_id, album_id, artist_id) VALUES
 (2, 2, NULL, NULL), (2, NULL, 1, NULL), (2, NULL, NULL, 1), (3, NULL, 3, NULL);

-- Tableros (RI-12)
INSERT INTO boards (id, owner_id, name, description, privacy) VALUES
 (1, 2, 'Carretera de noche', 'Para conducir sin prisa.', 'public'),
 (2, 3, 'Solo para mí',       NULL,                       'private');
INSERT INTO board_items (board_id, song_id, album_id) VALUES (1, 2, NULL), (1, 4, NULL), (1, NULL, 3), (2, 8, NULL);
INSERT INTO board_followers (board_id, user_id) VALUES (1, 4);

-- Comunidad (RI-13), membresías (RI-21), publicación (RI-14) y denuncia (RI-15)
INSERT INTO communities (id, name, description, rules, access, creator_id) VALUES
 (1, 'Indie de madrugada', 'Para compartir indie que suene bien de noche.', 'Respeto ante todo. Nada de spam.', 'public', 2);
INSERT INTO community_memberships (community_id, user_id, role) VALUES (1, 2, 'main_admin'), (1, 3, 'admin'), (1, 4, 'member');
INSERT INTO community_posts (id, community_id, author_id, body, album_id) VALUES
 (1, 1, 4, '¿Alguien más ha escuchado esto?', 1);
INSERT INTO reports (reporter_id, review_id, reason, comment, status, resolved_at, resolved_by) VALUES
 (3, 1, 'other', 'Creo que es publicidad.', 'rejected', now(), 1);

-- Incidencia resuelta por el administrador (RI-09) y acción del agente (RNF-07)
INSERT INTO catalog_issues (album_id, type, description, status, resolved_at, resolved_by) VALUES
 (2, 'incomplete', 'Falta la portada del EP.', 'resolved', now(), 1);
INSERT INTO agent_actions (kind, element_id, field, old_value, new_value, reason) VALUES
 ('artist', 2, 'name', 'MAREA BAJA', 'Marea Baja', 'Formato del nombre en mayúsculas corregido.');

-- Actividad (RI-16), notificación (RI-17) y ranking personal (RI-20)
INSERT INTO activities (user_id, type, album_id, privacy) VALUES (2, 'review', 1, 'public');
INSERT INTO notifications (recipient_id, type, related_kind, related_id, email_sent_at) VALUES
 (2, 'friend_request', 'user', 4, now());
INSERT INTO personal_rankings (id, author_id, album_id, privacy) VALUES (1, 2, 1, 'public');
INSERT INTO personal_ranking_songs (ranking_id, song_id, position) VALUES (1, 2, 1), (1, 1, 2), (1, 4, 3);

-- Los identificadores se han puesto a mano: se ajustan las secuencias
SELECT setval('users_id_seq', 5), setval('artists_id_seq', 3), setval('albums_id_seq', 4),
       setval('songs_id_seq', 10), setval('boards_id_seq', 2), setval('communities_id_seq', 1),
       setval('community_posts_id_seq', 1), setval('personal_rankings_id_seq', 1);

COMMIT;
