// Cliente de Wikidata y Wikimedia Commons para las fotos de los artistas.
// Se identifica con el User-Agent de la aplicación y hace como mucho una petición por segundo.
// Si algo falla devuelve null: la foto es opcional y nunca para la importación.

const ONE_REQUEST_PER_SECOND_MS = 1000;
const WIKIDATA_ENTITY_URL = 'https://www.wikidata.org/wiki/Special:EntityData';
const COMMONS_API_URL = 'https://commons.wikimedia.org/w/api.php';
const THUMBNAIL_WIDTH = 500;

class WikimediaUnavailableError extends Error {
  constructor(message) {
    super(message);
    this.name = 'WikimediaUnavailableError';
  }
}

function defaultSleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function chooseFetch(fetchFn) {
  if (fetchFn) return fetchFn;
  // Igual que con MusicBrainz (RNF-10): en las pruebas nunca se llama a la web real.
  if (process.env.NODE_ENV === 'test') {
    throw new Error('En las pruebas hay que usar la versión simulada de Wikimedia');
  }
  return fetch;
}

function createWikimediaClient({
  userAgent,
  fetchFn,
  minIntervalMs = ONE_REQUEST_PER_SECOND_MS,
  sleep = defaultSleep,
  now = Date.now,
}) {
  const doFetch = chooseFetch(fetchFn);
  let lastRequestAt = -Infinity;

  /** JSON de la URL, null si no existe; WikimediaUnavailableError si el servicio falla. */
  async function getJson(url) {
    const waitMs = lastRequestAt + minIntervalMs - now();
    if (waitMs > 0) await sleep(waitMs);
    lastRequestAt = now();
    let response;
    try {
      response = await doFetch(url, {
        headers: { 'User-Agent': userAgent, Accept: 'application/json' },
      });
    } catch (error) {
      throw new WikimediaUnavailableError(`Wikimedia no responde (${error.message})`);
    }
    if (response.status === 404) return null;
    if (!response.ok) throw new WikimediaUnavailableError(`Wikimedia respondió ${response.status}`);
    return response.json();
  }

  /** Nombre del archivo de la foto principal (propiedad P18 de Wikidata), o null. */
  async function getImageFileName(wikidataId) {
    const body = await getJson(`${WIKIDATA_ENTITY_URL}/${wikidataId}.json`);
    const value = body?.entities?.[wikidataId]?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
    return typeof value === 'string' ? value : null;
  }

  /** Miniatura, autor y licencia de un archivo de Commons, o null. */
  async function getImageInfo(fileName) {
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      prop: 'imageinfo',
      iiprop: 'url|extmetadata',
      iiurlwidth: String(THUMBNAIL_WIDTH),
      titles: `File:${fileName}`,
    });
    const body = await getJson(`${COMMONS_API_URL}?${params}`);
    const page = Object.values(body?.query?.pages ?? {})[0];
    const info = page?.imageinfo?.[0];
    if (!info) return null;
    return {
      url: info.thumburl ?? info.url ?? null,
      author: info.extmetadata?.Artist?.value ?? null,
      license: info.extmetadata?.LicenseShortName?.value ?? null,
    };
  }

  return { getImageFileName, getImageInfo };
}

module.exports = { createWikimediaClient, WikimediaUnavailableError, THUMBNAIL_WIDTH };
