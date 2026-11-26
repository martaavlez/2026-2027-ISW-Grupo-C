const ONE_REQUEST_PER_SECOND_MS = 1100;
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);
const PAGE_SIZE_LIMIT = 100;

class MusicBrainzUnavailableError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = 'MusicBrainzUnavailableError';
  }
}

function defaultSleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function chooseFetch(fetchFn) {
  if (fetchFn) return fetchFn;
  // PA-20-04 · RNF-10: en las pruebas automáticas nunca se llama a la MusicBrainz real.
  if (process.env.NODE_ENV === 'test') {
    throw new Error('En las pruebas hay que usar la versión simulada de MusicBrainz (RNF-10)');
  }
  return fetch;
}

function buildReleaseGroupQuery(tag, releasedSince) {
  const cleanTag = tag.replaceAll('"', '');
  const parts = [`tag:"${cleanTag}"`, 'primarytype:(album OR ep OR single)'];
  if (releasedSince) parts.push(`firstreleasedate:[${releasedSince} TO *]`);
  return parts.join(' AND ');
}

/**
 * Cliente de la API pública de MusicBrainz (RNF-10):
 * una petición por segundo como máximo, identificándose con el User-Agent de Repeat.
 */
function createMusicBrainzClient({
  baseUrl,
  userAgent,
  fetchFn,
  minIntervalMs = ONE_REQUEST_PER_SECOND_MS,
  maxAttempts = 3,
  sleep = defaultSleep,
  now = Date.now,
}) {
  const doFetch = chooseFetch(fetchFn);
  let lastRequestAt = -Infinity;

  async function waitForRateLimit() {
    const waitMs = lastRequestAt + minIntervalMs - now();
    if (waitMs > 0) await sleep(waitMs);
    lastRequestAt = now();
  }

  async function fetchOnce(url) {
    await waitForRateLimit();
    return doFetch(url, { headers: { 'User-Agent': userAgent, Accept: 'application/json' } });
  }

  async function get(path, params, { allowNotFound = false } = {}) {
    const url = new URL(`${baseUrl}${path}`);
    Object.entries({ ...params, fmt: 'json' }).forEach(([key, value]) =>
      url.searchParams.set(key, String(value)),
    );

    let lastProblem = 'sin respuesta';
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const response = await fetchOnce(url);
        if (response.ok) return response.json();
        if (allowNotFound && response.status === 404) return null;
        lastProblem = `respondió ${response.status}`;
        if (!RETRYABLE_STATUSES.has(response.status)) break;
      } catch (error) {
        lastProblem = error.message;
      }
      if (attempt < maxAttempts) await sleep(minIntervalMs * attempt);
    }
    throw new MusicBrainzUnavailableError(`MusicBrainz no está disponible (${lastProblem})`);
  }

  async function searchReleaseGroups({ tag, releasedSince = null, limit, offset = 0 }) {
    const body = await get('/release-group', {
      query: buildReleaseGroupQuery(tag, releasedSince),
      limit: Math.min(limit, PAGE_SIZE_LIMIT),
      offset,
    });
    return { total: body.count ?? 0, releaseGroups: body['release-groups'] ?? [] };
  }

  function getRelease(releaseId) {
    return get(
      `/release/${releaseId}`,
      { inc: 'recordings+artist-credits' },
      { allowNotFound: true },
    );
  }

  /** Artistas cuyo nombre se parece al buscado (para elegir el bueno antes de importar). */
  async function searchArtists(name, limit = 10) {
    const cleanName = name.replaceAll('"', '').replaceAll('\\', '');
    const body = await get('/artist', { query: `artist:"${cleanName}"`, limit });
    return (body.artists ?? []).map((artist) => ({
      id: artist.id,
      name: artist.name,
      disambiguation: artist.disambiguation ?? '',
      country: artist.country ?? '',
      score: artist.score ?? 0,
    }));
  }

  /** Álbumes, EP y singles de un artista concreto (por su MBID). */
  async function searchReleaseGroupsByArtist({ artistId, limit, offset = 0 }) {
    const body = await get('/release-group', {
      query: `arid:${artistId} AND primarytype:(album OR ep OR single)`,
      limit: Math.min(limit, PAGE_SIZE_LIMIT),
      offset,
    });
    return { total: body.count ?? 0, releaseGroups: body['release-groups'] ?? [] };
  }

  /** Enlaces del artista a otras webs (entre ellos, Wikidata, de donde sale su foto). */
  async function getArtistUrlRelations(artistId) {
    const body = await get(`/artist/${artistId}`, { inc: 'url-rels' }, { allowNotFound: true });
    return body?.relations ?? [];
  }

  return {
    searchReleaseGroups,
    getRelease,
    getArtistUrlRelations,
    searchArtists,
    searchReleaseGroupsByArtist,
  };
}

module.exports = {
  createMusicBrainzClient,
  buildReleaseGroupQuery,
  MusicBrainzUnavailableError,
  PAGE_SIZE_LIMIT,
};
