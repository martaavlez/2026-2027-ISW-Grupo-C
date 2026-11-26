# Base de datos de Repeat

Esquema relacional en PostgreSQL 16 que implementa los requisitos de información (RI) y las reglas de negocio (RN) que pueden comprobarse en la propia base de datos.

## Archivos

| Archivo | Contenido |
|---|---|
| `schema.sql` | Tipos enumerados, 30 tablas, claves, restricciones e índices |
| `seed.sql` | Datos de prueba ficticios |
| `migrations/` | Cambios del esquema para bases de datos que ya existen |
| `modelo-conceptual/` | Modelo conceptual (diagramas de clases, imágenes y archivo editable de draw.io) |

## Cómo se ejecuta

```bash
createdb repeat
psql -d repeat -f schema.sql
psql -d repeat -f seed.sql
```

`schema.sql` se ejecuta sobre una base de datos vacía. Para empezar de cero, borra la base de datos (`dropdb repeat`) y vuelve a crearla.

Cuando se añade algo al esquema, en `migrations/` hay un archivo para aplicarlo a una base de datos que ya existe, sin borrarla:

```bash
psql -d repeat -f migrations/001-fotos-artistas.sql
```

## Datos de prueba

Todos los usuarios y el catálogo son inventados. La contraseña de todos los usuarios es `Repeat2026` (guardada cifrada con bcrypt).

| Usuario | Rol | Notas |
|---|---|---|
| admin | Administrador de la plataforma | Resuelve la denuncia y la incidencia de ejemplo |
| lucia.vinilo | Usuario | Crea la comunidad de ejemplo |
| marco_casete | Usuario | |
| nora.eco | Usuario | |
| teo.bucle | Usuario | Cuenta suspendida |

El catálogo de prueba tiene 3 artistas, 4 álbumes y 10 canciones. Un álbum y una canción tienen dos artistas (RI-07, RI-08). El catálogo real se importa desde MusicBrainz (HU-20): una primera importación por géneros y después las novedades de cada día (ver la sección «Importación del catálogo» del README principal). En las pruebas se usa un mock (RNF-10).

## Reglas comprobadas en la base de datos

| Regla | Cómo se aplica |
|---|---|
| RN-01 · usuario y correo únicos | `UNIQUE` sobre `CITEXT` en el correo e índice único sobre `lower(username)` (no distinguen mayúsculas) |
| RN-05 · una reseña por usuario y elemento | Índices únicos parciales en `reviews` |
| RN-06 · puntuación de 1 a 5 | `CHECK` |
| RN-11 · una sola solicitud de amistad abierta por pareja | Índice único sobre la pareja ordenada |
| RN-14 · un elemento no se repite en un tablero | `UNIQUE` en `board_items` |
| Un único administrador principal por comunidad | Índice único parcial en `community_memberships` |
| RN-23 · borrado completo de la cuenta | `ON DELETE CASCADE` |
| RN-23 · borrar un álbum borra sus canciones y lo que depende de él | `ON DELETE CASCADE` |
| RN-21 · lo eliminado no se vuelve a importar | Tabla `import_exclusions` |
| PA-20-03 · fecha de la última importación correcta | Tabla `import_runs` |
| RI-09, RI-15 · quién resuelve | Columna `resolved_by` en incidencias y denuncias |

El resto de reglas (permisos, privacidad, plazos) se comprueban en la API.
