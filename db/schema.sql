-- =====================================================================
-- Repeat · Esquema de la base de datos (PostgreSQL 16)
-- Tarea 5 del Sprint 2. Se obtiene de los requisitos de información
-- RI-01 a RI-21 y aplica las restricciones de los RI y de las reglas de
-- negocio que se pueden comprobar en la propia base de datos.
-- Los nombres van en inglés (Clean Code); los comentarios, en español.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS citext;

-- ---------------------------------------------------------------------
-- Tipos enumerados
-- ---------------------------------------------------------------------
CREATE TYPE platform_role      AS ENUM ('user', 'admin');
CREATE TYPE account_status     AS ENUM ('active', 'suspended');
CREATE TYPE privacy_level      AS ENUM ('public', 'friends', 'private');
CREATE TYPE friendship_status  AS ENUM ('pending', 'accepted', 'rejected', 'cancelled');
CREATE TYPE album_type         AS ENUM ('album', 'ep', 'single');
CREATE TYPE catalog_kind       AS ENUM ('artist', 'album', 'song');
CREATE TYPE issue_type         AS ENUM ('duplicate', 'incomplete', 'inconsistent', 'inappropriate');
CREATE TYPE issue_status       AS ENUM ('pending', 'resolved', 'dismissed');
CREATE TYPE review_status      AS ENUM ('visible', 'withdrawn');
CREATE TYPE community_access   AS ENUM ('public', 'private');
CREATE TYPE community_role     AS ENUM ('member', 'admin', 'main_admin');
CREATE TYPE request_kind       AS ENUM ('invitation', 'request');
CREATE TYPE request_status     AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE report_reason      AS ENUM ('offensive', 'spam', 'inappropriate', 'other');
CREATE TYPE report_status      AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE activity_type      AS ENUM ('review', 'favorite', 'board_created', 'board_item_added', 'personal_ranking');
CREATE TYPE notification_type  AS ENUM ('new_follower', 'friend_request', 'friend_accepted', 'community_invitation',
                                        'access_request', 'access_response', 'community_deleted', 'community_expulsion',
                                        'board_updated', 'community_report', 'report_resolved');
CREATE TYPE ranking_kind       AS ENUM ('songs', 'albums');
CREATE TYPE import_status      AS ENUM ('running', 'success', 'failed');

-- ---------------------------------------------------------------------
-- RI-01 · Usuario  y  RI-02 · Configuración de privacidad
-- ---------------------------------------------------------------------
CREATE TABLE users (
    id                 BIGSERIAL PRIMARY KEY,
    name               VARCHAR(50)  NOT NULL,
    username           VARCHAR(30)  NOT NULL UNIQUE
                       CHECK (username ~ '^[A-Za-z0-9._]{3,30}$'),
    email              CITEXT       NOT NULL UNIQUE                      -- RN-01: único sin distinguir mayúsculas
                       CHECK (length(email) <= 100 AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
    password_hash      TEXT         NOT NULL,                            -- RNF-03: nunca la contraseña en claro
    photo_url          TEXT,
    bio                VARCHAR(300),
    role               platform_role  NOT NULL DEFAULT 'user',
    status             account_status NOT NULL DEFAULT 'active',
    suspension_reason  VARCHAR(300),
    privacy_accepted_at TIMESTAMPTZ  NOT NULL,                           -- RNF-04: aceptación de la política
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CHECK (status <> 'suspended' OR suspension_reason IS NOT NULL)
);

CREATE TABLE privacy_settings (
    user_id                 BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    default_content_privacy privacy_level NOT NULL DEFAULT 'public',     -- RN-09
    favorites_visibility    privacy_level NOT NULL DEFAULT 'public'
);

-- ---------------------------------------------------------------------
-- RI-03 · Seguimiento, RI-04 · Amistad, RI-05 · Bloqueo
-- ---------------------------------------------------------------------
CREATE TABLE follows (
    follower_id  BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    followed_id  BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (follower_id, followed_id),
    CHECK (follower_id <> followed_id)
);

CREATE TABLE friendships (
    id            BIGSERIAL PRIMARY KEY,
    requester_id  BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id  BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status        friendship_status NOT NULL DEFAULT 'pending',
    requested_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    responded_at  TIMESTAMPTZ,
    CHECK (requester_id <> recipient_id),
    CHECK (status = 'pending' OR responded_at IS NOT NULL)
);
-- RN-11: como mucho una solicitud pendiente o una amistad aceptada entre dos personas, en cualquier sentido
CREATE UNIQUE INDEX friendships_one_open_pair
    ON friendships (LEAST(requester_id, recipient_id), GREATEST(requester_id, recipient_id))
    WHERE status IN ('pending', 'accepted');

CREATE TABLE blocks (
    blocker_id  BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id  BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (blocker_id, blocked_id),
    CHECK (blocker_id <> blocked_id)
);

-- ---------------------------------------------------------------------
-- RI-06 · Artista, RI-07 · Álbum, RI-08 · Canción (catálogo de MusicBrainz)
-- Álbumes y canciones pueden tener varios artistas (tablas intermedias).
-- ---------------------------------------------------------------------
CREATE TABLE artists (
    id           BIGSERIAL PRIMARY KEY,
    name         VARCHAR(150) NOT NULL,
    image_url    TEXT,
    genre        VARCHAR(50),
    description  VARCHAR(1000),
    external_id  TEXT NOT NULL UNIQUE,                                   -- identificador de MusicBrainz (RN-21)
    imported_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE albums (
    id              BIGSERIAL PRIMARY KEY,
    title           VARCHAR(200) NOT NULL,
    cover_url       TEXT,
    genre           VARCHAR(50),
    type            album_type NOT NULL,
    release_year    SMALLINT CHECK (release_year BETWEEN 1800 AND 2100), -- además, no posterior al año actual (lo comprueba la API)
    average_rating  NUMERIC(2,1) CHECK (average_rating BETWEEN 1.0 AND 5.0), -- RN-07: la recalcula el sistema
    external_id     TEXT NOT NULL UNIQUE,
    imported_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE album_artists (
    album_id   BIGINT NOT NULL REFERENCES albums(id)  ON DELETE CASCADE,
    artist_id  BIGINT NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    position   SMALLINT NOT NULL DEFAULT 1,                              -- orden en que aparecen los artistas
    PRIMARY KEY (album_id, artist_id)
);

CREATE TABLE songs (
    id                BIGSERIAL PRIMARY KEY,
    title             VARCHAR(200) NOT NULL,
    album_id          BIGINT NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
    track_number      SMALLINT CHECK (track_number > 0),
    duration_seconds  INTEGER NOT NULL CHECK (duration_seconds > 0),
    genre             VARCHAR(50),
    average_rating    NUMERIC(2,1) CHECK (average_rating BETWEEN 1.0 AND 5.0),
    external_id       TEXT NOT NULL UNIQUE,
    imported_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE song_artists (
    song_id    BIGINT NOT NULL REFERENCES songs(id)   ON DELETE CASCADE,
    artist_id  BIGINT NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    position   SMALLINT NOT NULL DEFAULT 1,
    PRIMARY KEY (song_id, artist_id)
);

-- RN-21: lo que el administrador elimina no vuelve en la siguiente importación.
-- Al borrar el elemento se pierde su fila, así que su identificador externo se guarda aquí.
CREATE TABLE import_exclusions (
    kind         catalog_kind NOT NULL,
    external_id  TEXT NOT NULL,
    excluded_by  BIGINT REFERENCES users(id) ON DELETE SET NULL,
    excluded_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (kind, external_id)
);

-- HU-20 · Registro de cada importación desde MusicBrainz.
-- PA-20-03: el administrador ve la fecha de la última importación correcta,
-- y la importación diaria trae las novedades publicadas desde esa fecha.
CREATE TABLE import_runs (
    id             BIGSERIAL PRIMARY KEY,
    kind           VARCHAR(10) NOT NULL CHECK (kind IN ('initial', 'daily')),
    started_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at    TIMESTAMPTZ,
    status         import_status NOT NULL DEFAULT 'running',
    added_count    INTEGER NOT NULL DEFAULT 0 CHECK (added_count >= 0),
    updated_count  INTEGER NOT NULL DEFAULT 0 CHECK (updated_count >= 0),
    skipped_count  INTEGER NOT NULL DEFAULT 0 CHECK (skipped_count >= 0),
    error_message  VARCHAR(500),
    CHECK (status = 'running' OR finished_at IS NOT NULL),
    CHECK (status <> 'failed' OR error_message IS NOT NULL)
);
CREATE INDEX import_runs_status_started_idx ON import_runs (status, started_at DESC);

-- ---------------------------------------------------------------------
-- RI-09 · Incidencia del catálogo  y  registro de acciones del agente (RNF-07)
-- Un elemento del catálogo se referencia con tres columnas opcionales y
-- una restricción que obliga a rellenar exactamente una (así hay claves foráneas reales).
-- ---------------------------------------------------------------------
CREATE TABLE catalog_issues (
    id            BIGSERIAL PRIMARY KEY,
    artist_id     BIGINT REFERENCES artists(id) ON DELETE CASCADE,
    album_id      BIGINT REFERENCES albums(id)  ON DELETE CASCADE,
    song_id       BIGINT REFERENCES songs(id)   ON DELETE CASCADE,
    type          issue_type NOT NULL,
    description   VARCHAR(500) NOT NULL,
    status        issue_status NOT NULL DEFAULT 'pending',
    detected_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at   TIMESTAMPTZ,
    resolved_by   BIGINT REFERENCES users(id) ON DELETE SET NULL,      -- administrador que la resuelve
    CHECK (num_nonnulls(artist_id, album_id, song_id) = 1),
    CHECK (status = 'pending' OR (resolved_at IS NOT NULL AND resolved_by IS NOT NULL))
);

CREATE TABLE agent_actions (
    id           BIGSERIAL PRIMARY KEY,
    kind         catalog_kind NOT NULL,
    element_id   BIGINT NOT NULL,                                        -- se conserva aunque el elemento se elimine
    field        VARCHAR(50) NOT NULL,
    old_value    TEXT,
    new_value    TEXT,
    reason       VARCHAR(300) NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- RI-10 · Reseña  y  RI-11 · Favorito
-- ---------------------------------------------------------------------
CREATE TABLE reviews (
    id          BIGSERIAL PRIMARY KEY,
    author_id   BIGINT NOT NULL REFERENCES users(id)  ON DELETE CASCADE,  -- RN-23
    song_id     BIGINT REFERENCES songs(id)  ON DELETE CASCADE,            -- RN-23
    album_id    BIGINT REFERENCES albums(id) ON DELETE CASCADE,
    rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),          -- RN-06
    body        VARCHAR(2000),
    privacy     privacy_level NOT NULL,                                    -- RN-09: la API pone el nivel por defecto
    status      review_status NOT NULL DEFAULT 'visible',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ,
    CHECK (num_nonnulls(song_id, album_id) = 1)
);
-- RN-05: una reseña por usuario y elemento
CREATE UNIQUE INDEX reviews_one_per_song  ON reviews (author_id, song_id)  WHERE song_id  IS NOT NULL;
CREATE UNIQUE INDEX reviews_one_per_album ON reviews (author_id, album_id) WHERE album_id IS NOT NULL;

CREATE TABLE favorites (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    song_id     BIGINT REFERENCES songs(id)   ON DELETE CASCADE,
    album_id    BIGINT REFERENCES albums(id)  ON DELETE CASCADE,
    artist_id   BIGINT REFERENCES artists(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (num_nonnulls(song_id, album_id, artist_id) = 1)
);
CREATE UNIQUE INDEX favorites_song   ON favorites (user_id, song_id)   WHERE song_id   IS NOT NULL;
CREATE UNIQUE INDEX favorites_album  ON favorites (user_id, album_id)  WHERE album_id  IS NOT NULL;
CREATE UNIQUE INDEX favorites_artist ON favorites (user_id, artist_id) WHERE artist_id IS NOT NULL;

-- ---------------------------------------------------------------------
-- RI-12 · Tablero
-- ---------------------------------------------------------------------
CREATE TABLE boards (
    id           BIGSERIAL PRIMARY KEY,
    owner_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name         VARCHAR(80) NOT NULL CHECK (btrim(name) <> ''),          -- RN-14: siempre con nombre
    description  VARCHAR(500),
    privacy      privacy_level NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ
);

CREATE TABLE board_items (
    id         BIGSERIAL PRIMARY KEY,
    board_id   BIGINT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    song_id    BIGINT REFERENCES songs(id)  ON DELETE CASCADE,
    album_id   BIGINT REFERENCES albums(id) ON DELETE CASCADE,
    added_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (num_nonnulls(song_id, album_id) = 1)
);
-- RN-14: sin elementos repetidos
CREATE UNIQUE INDEX board_items_song  ON board_items (board_id, song_id)  WHERE song_id  IS NOT NULL;
CREATE UNIQUE INDEX board_items_album ON board_items (board_id, album_id) WHERE album_id IS NOT NULL;

CREATE TABLE board_followers (
    board_id    BIGINT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    user_id     BIGINT NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (board_id, user_id)
    -- RN-15 (solo tableros públicos) lo comprueba la API al seguir y al cambiar la privacidad
);

-- ---------------------------------------------------------------------
-- RI-13 · Comunidad, RI-21 · Membresía, solicitudes, expulsiones
-- ---------------------------------------------------------------------
CREATE TABLE communities (
    id           BIGSERIAL PRIMARY KEY,
    name         CITEXT NOT NULL UNIQUE CHECK (length(name) <= 80),     -- RN-16
    description  VARCHAR(500) NOT NULL,
    image_url    TEXT,
    rules        VARCHAR(2000),
    access       community_access NOT NULL,
    creator_id   BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RI-21: relación usuario–comunidad con su rol y la fecha de entrada
CREATE TABLE community_memberships (
    community_id  BIGINT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    user_id       BIGINT NOT NULL REFERENCES users(id)       ON DELETE CASCADE,
    role          community_role NOT NULL DEFAULT 'member',
    joined_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (community_id, user_id)
);
-- Exactamente un administrador principal por comunidad (RN-24)
CREATE UNIQUE INDEX one_main_admin_per_community
    ON community_memberships (community_id) WHERE role = 'main_admin';

CREATE TABLE community_requests (
    id            BIGSERIAL PRIMARY KEY,
    community_id  BIGINT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    user_id       BIGINT NOT NULL REFERENCES users(id)       ON DELETE CASCADE,
    kind          request_kind NOT NULL,
    status        request_status NOT NULL DEFAULT 'pending',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    answered_at   TIMESTAMPTZ
);
CREATE UNIQUE INDEX community_requests_one_pending
    ON community_requests (community_id, user_id) WHERE status = 'pending';

CREATE TABLE community_expulsions (
    id            BIGSERIAL PRIMARY KEY,
    community_id  BIGINT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    user_id       BIGINT NOT NULL REFERENCES users(id)       ON DELETE CASCADE,
    expelled_by   BIGINT REFERENCES users(id) ON DELETE SET NULL,
    reason        VARCHAR(300),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    -- RN-17: con dos expulsiones ya no puede solicitar el acceso (se cuenta en la API)
);

-- ---------------------------------------------------------------------
-- RI-14 · Publicación en comunidad  y  RI-15 · Denuncia
-- ---------------------------------------------------------------------
CREATE TABLE community_posts (
    id            BIGSERIAL PRIMARY KEY,
    community_id  BIGINT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,  -- RN-23
    author_id     BIGINT NOT NULL REFERENCES users(id)       ON DELETE CASCADE,
    body          VARCHAR(1000),
    song_id       BIGINT REFERENCES songs(id)  ON DELETE SET NULL,
    album_id      BIGINT REFERENCES albums(id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (num_nonnulls(song_id, album_id) <= 1),
    CHECK (body IS NOT NULL OR song_id IS NOT NULL OR album_id IS NOT NULL)
);

CREATE TABLE reports (
    id           BIGSERIAL PRIMARY KEY,
    reporter_id  BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    review_id    BIGINT REFERENCES reviews(id)         ON DELETE CASCADE,
    post_id      BIGINT REFERENCES community_posts(id) ON DELETE CASCADE,
    reason       report_reason NOT NULL,
    comment      VARCHAR(300),
    status       report_status NOT NULL DEFAULT 'pending',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at  TIMESTAMPTZ,
    resolved_by  BIGINT REFERENCES users(id) ON DELETE SET NULL,       -- quién la resolvió (RN-18)
    CHECK (num_nonnulls(review_id, post_id) = 1),
    CHECK (reason <> 'other' OR comment IS NOT NULL),
    CHECK (status = 'pending' OR (resolved_at IS NOT NULL AND resolved_by IS NOT NULL))
);
-- RN-18: un usuario no denuncia dos veces el mismo contenido
CREATE UNIQUE INDEX reports_once_per_review ON reports (reporter_id, review_id) WHERE review_id IS NOT NULL;
CREATE UNIQUE INDEX reports_once_per_post   ON reports (reporter_id, post_id)   WHERE post_id   IS NOT NULL;

-- ---------------------------------------------------------------------
-- RI-16 · Actividad  y  RI-17 · Notificación (por correo)
-- ---------------------------------------------------------------------
CREATE TABLE activities (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        activity_type NOT NULL,
    song_id     BIGINT REFERENCES songs(id)   ON DELETE CASCADE,
    album_id    BIGINT REFERENCES albums(id)  ON DELETE CASCADE,
    artist_id   BIGINT REFERENCES artists(id) ON DELETE CASCADE,
    board_id    BIGINT REFERENCES boards(id)  ON DELETE CASCADE,
    privacy     privacy_level NOT NULL,                                  -- RN-08: hereda la del contenido
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notifications (
    id            BIGSERIAL PRIMARY KEY,
    recipient_id  BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type          notification_type NOT NULL,
    related_kind  VARCHAR(30) NOT NULL,                                  -- user, community, board, report...
    related_id    BIGINT NOT NULL,
    email_sent_at TIMESTAMPTZ,                                           -- se envía al correo de registro (HU-11)
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- RI-19 · Ranking semanal  y  RI-20 · Ranking personal de un álbum
-- (RI-18 · Recomendación no se guarda: se calcula en cada consulta)
-- ---------------------------------------------------------------------
CREATE TABLE weekly_rankings (
    calculated_at  TIMESTAMPTZ NOT NULL,
    kind           ranking_kind NOT NULL,
    position       SMALLINT NOT NULL CHECK (position BETWEEN 1 AND 10),
    song_id        BIGINT REFERENCES songs(id)  ON DELETE CASCADE,
    album_id       BIGINT REFERENCES albums(id) ON DELETE CASCADE,
    average_rating NUMERIC(2,1) NOT NULL CHECK (average_rating BETWEEN 1.0 AND 5.0),
    rating_count   INTEGER NOT NULL CHECK (rating_count >= 3),            -- RN-19
    PRIMARY KEY (calculated_at, kind, position),
    CHECK ((kind = 'songs'  AND song_id  IS NOT NULL AND album_id IS NULL) OR
           (kind = 'albums' AND album_id IS NOT NULL AND song_id  IS NULL))
);

CREATE TABLE personal_rankings (
    id          BIGSERIAL PRIMARY KEY,
    author_id   BIGINT NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    album_id    BIGINT NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
    privacy     privacy_level NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ,
    UNIQUE (author_id, album_id)                                         -- RN-25
);

CREATE TABLE personal_ranking_songs (
    ranking_id  BIGINT NOT NULL REFERENCES personal_rankings(id) ON DELETE CASCADE,
    song_id     BIGINT NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    position    SMALLINT NOT NULL CHECK (position > 0),
    PRIMARY KEY (ranking_id, song_id),                                   -- RN-25: sin repetir canciones
    UNIQUE (ranking_id, position)
    -- RN-25: mínimo 3 canciones y todas del mismo álbum (lo comprueba la API al guardar)
);

-- ---------------------------------------------------------------------
-- Índices para las consultas más frecuentes (RNF-09)
-- ---------------------------------------------------------------------
CREATE INDEX songs_title_idx    ON songs   (lower(title));
CREATE INDEX albums_title_idx   ON albums  (lower(title));
CREATE INDEX artists_name_idx   ON artists (lower(name));
CREATE INDEX reviews_song_idx   ON reviews (song_id)  WHERE song_id  IS NOT NULL;
CREATE INDEX reviews_album_idx  ON reviews (album_id) WHERE album_id IS NOT NULL;
CREATE INDEX reviews_created_idx ON reviews (created_at);
CREATE INDEX activities_user_idx ON activities (user_id, created_at DESC);
CREATE INDEX follows_followed_idx ON follows (followed_id);
