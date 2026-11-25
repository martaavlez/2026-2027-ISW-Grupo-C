# Repeat

[![CI](https://github.com/martaavlez/2026-2027-ISW-Grupo-C/actions/workflows/ci.yml/badge.svg?branch=develop)](https://github.com/martaavlez/2026-2027-ISW-Grupo-C/actions/workflows/ci.yml)

Aplicación social para valorar, reseñar, organizar y compartir música. Proyecto de Ingeniería del Software · Grupo C · curso 2026-2027.

## Estructura del repositorio

| Carpeta | Contenido |
| --- | --- |
| `api/` | API REST: Node.js + Express + PostgreSQL |
| `app/` | Aplicación web adaptable al móvil: Expo + Expo Router (React Native for Web) |
| `db/` | Esquema de la base de datos (`schema.sql`) y datos de prueba (`seed.sql`) |
| `docs/` | Documentación: requisitos, arquitectura, ADR, modelo conceptual, diseño y estrategia de ramas |
| `.github/` | Plantilla de pull request y pipeline de CI (`workflows/ci.yml`) |

## Requisitos

- [Node.js](https://nodejs.org) 20 o superior (versión LTS) y Git.
- [PostgreSQL](https://www.postgresql.org/download/) 16.
- Opcional, para probar en el móvil: la app **Expo Go** (Google Play o App Store).

## Puesta en marcha en local

### 1. Base de datos

Crea la base de datos y carga el esquema y los datos de prueba (te pedirá la contraseña de tu usuario de PostgreSQL):

```bash
createdb -U postgres repeat
psql -U postgres -d repeat -f db/schema.sql
psql -U postgres -d repeat -f db/seed.sql
```

En Windows, si `createdb` o `psql` no se reconocen, añade `C:\Program Files\PostgreSQL\16\bin` al PATH o usa la terminal *SQL Shell (psql)* que instala PostgreSQL.

### 2. API

```bash
cd api
npm install
cp .env.example .env     # y edita .env con tu usuario y contraseña de PostgreSQL
npm run dev
```

La API queda en http://localhost:3000. Para comprobarla:

- http://localhost:3000/health → `{"status":"ok"}`
- http://localhost:3000/health/db → `{"database":"ok"}` si la conexión con PostgreSQL funciona

### 3. Aplicación

En otra terminal:

```bash
cd app
npm install
cp .env.example .env
npx expo start
```

- **Web:** pulsa `w` en la terminal. Se abre en http://localhost:8081. La pantalla de inicio muestra «API conectada» si la API está arrancada.
- **Móvil (Expo Go):** escanea el código QR. El móvil y el ordenador tienen que estar en la misma wifi y, en `app/.env`, `EXPO_PUBLIC_API_URL` tiene que llevar la IP del ordenador en lugar de `localhost`. Si la red no lo permite (por ejemplo, la wifi de la universidad), usa un túnel:
  ```bash
  npx expo login            # una sola vez, con vuestra cuenta de Expo
  npx expo start --tunnel
  ```

## Comandos

Se ejecutan dentro de `api/` o de `app/`.

| Comando | Qué hace |
| --- | --- |
| `npm test` | Ejecuta los tests |
| `npm run test:coverage` | Ejecuta los tests con informe de cobertura (carpeta `coverage/`) |
| `npm run lint` | Revisa el código con ESLint |
| `npm run format` | Formatea el código con Prettier |
| `npm run dev` | (`api/`) Arranca la API y la reinicia al guardar |
| `npm run build:web` | (`app/`) Genera la versión web para producción en `dist/` |
| `npm run typecheck` | (`app/`) Comprueba los tipos de TypeScript |
| `npm run import:initial` | (`api/`) Primera importación del catálogo desde MusicBrainz |
| `npm run import:daily` | (`api/`) Importa las novedades desde la última importación correcta |

## Integración continua

El pipeline [`.github/workflows/ci.yml`](.github/workflows/ci.yml) se ejecuta en GitHub Actions en cada push a `develop` y en cada pull request hacia `develop` o `main`. Tiene dos trabajos, uno para `api/` y otro para `app/`, y cada uno hace:

1. Checkout del código.
2. Instalación de dependencias (`npm ci`).
3. Build: lint, formato y, en la app, comprobación de tipos y generación de la web.
4. Tests con cobertura. La API se prueba contra un PostgreSQL real con el esquema de `db/`. Si la cobertura de líneas baja del 60 %, el pipeline falla.
5. Informe de cobertura: resumen en la página de la ejecución y carpeta `coverage/` descargable como artefacto.
6. Resultado: verde si todo pasa, rojo si algo falla. Se ve en la pestaña **Actions** y en cada pull request.

## Importación del catálogo (HU-20)

El catálogo se importa desde la API pública de [MusicBrainz](https://musicbrainz.org), respetando su límite de una petición por segundo e identificándose con el `MUSICBRAINZ_USER_AGENT` (RNF-10).

- **Primera importación:** trae hasta `IMPORT_INITIAL_LIMIT_PER_GENRE` álbumes, EP y singles de cada género de `IMPORT_GENRES`, con sus canciones y artistas. Con los valores por defecto (10 géneros y 500 por género) tarda alrededor de hora y media.
  ```bash
  cd api
  npm run import:initial
  ```
  Para ampliar el catálogo más adelante, se continúa por donde se quedó. Lo que ya existe se actualiza y no se duplica (RN-21):
  ```bash
  npm run import:initial -- --limit 500 --offset 500
  ```
- **Importación diaria:** trae lo publicado desde el día anterior a la última importación correcta. Con `IMPORT_ENABLED=true`, la API la lanza sola cada día a la hora `IMPORT_DAILY_HOUR`. Si al arrancar no ha habido ninguna importación correcta, hace primero la inicial. A mano: `npm run import:daily`.
- **Si MusicBrainz no responde (PA-20-03):** el catálogo que ya hay no se toca, la importación queda registrada como fallida en la tabla `import_runs` y se reintenta cada hora. La fecha de la última importación correcta se guarda en esa misma tabla para el panel del administrador.
- **Lo eliminado por el administrador no vuelve (RN-21):** se guarda en `import_exclusions` y la importación lo salta.
- **En las pruebas (PA-20-04):** se usa una versión simulada de MusicBrainz (`api/tests/fixtures/musicbrainz.js`). Los tests no pueden llamar a la API real.

## Variables de entorno

Cada carpeta tiene un `.env.example` con las variables necesarias. Copia el archivo como `.env` y rellénalo. Los `.env` no se suben al repositorio.

| Variable | Dónde | Para qué |
| --- | --- | --- |
| `PORT` | `api/` | Puerto de la API (por defecto 3000) |
| `DATABASE_URL` | `api/` | Conexión con PostgreSQL |
| `CORS_ORIGIN` | `api/` | Dirección de la web que puede llamar a la API |
| `IMPORT_ENABLED` | `api/` | `true` para que la API importe sola las novedades cada día |
| `IMPORT_GENRES` | `api/` | Géneros que se importan (`etiqueta=Nombre`, separados por comas) |
| `IMPORT_INITIAL_LIMIT_PER_GENRE` | `api/` | Álbumes por género en la primera importación (por defecto 500) |
| `IMPORT_DAILY_LIMIT_PER_GENRE` | `api/` | Tope diario de novedades por género (por defecto 1000) |
| `IMPORT_DAILY_HOUR` | `api/` | Hora de la importación diaria, de 0 a 23 (por defecto 3) |
| `MUSICBRAINZ_USER_AGENT` | `api/` | Nombre y contacto con los que Repeat se identifica ante MusicBrainz |
| `EXPO_PUBLIC_API_URL` | `app/` | Dirección de la API que usa la aplicación |

## Forma de trabajo

- Ramas, pull requests y mensajes de commit: [docs/git/estrategia-de-ramas.md](docs/git/estrategia-de-ramas.md).
- Requisitos y pruebas de aceptación: [docs/requisitos](docs/requisitos).
- Arquitectura: [docs/arquitectura](docs/arquitectura) y [docs/adr](docs/adr).
