// Busca la foto de un artista: MusicBrainz → Wikidata → Wikimedia Commons.
// Se guarda la dirección de la miniatura y el crédito (autor y licencia), que la licencia exige.

const WIKIDATA_URL = /^https:\/\/www\.wikidata\.org\/wiki\/(Q[1-9][0-9]{0,11})$/;
const COMMONS_UPLOAD = 'https://upload.wikimedia.org/';
const MAX_CREDIT_LENGTH = 300;

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", apos: "'", nbsp: ' ' };

/** El autor viene en HTML desde Commons: se deja solo el texto. */
function htmlToText(html) {
  return String(html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(amp|lt|gt|quot|#39|apos|nbsp);/g, (_, entity) => ENTITIES[entity])
    .replace(/\s+/g, ' ')
    .trim();
}

function wikidataIdFrom(relations) {
  for (const relation of relations) {
    const match = relation?.type === 'wikidata' && WIKIDATA_URL.exec(relation.url?.resource ?? '');
    if (match) return match[1];
  }
  return null;
}

/** «Foto: autor · licencia · Wikimedia Commons», sin pasar de 300 caracteres. */
function toCredit(author, license) {
  const parts = [htmlToText(author), htmlToText(license), 'Wikimedia Commons'].filter(Boolean);
  const credit = parts.join(' · ');
  return credit.length > MAX_CREDIT_LENGTH ? `${credit.slice(0, MAX_CREDIT_LENGTH - 1)}…` : credit;
}

/** Solo se aceptan miniaturas https servidas por Wikimedia. */
function isCommonsUpload(url) {
  return typeof url === 'string' && url.startsWith(COMMONS_UPLOAD) && !/\s/.test(url);
}

function createArtistImageFinder({ musicBrainz, wikimedia }) {
  /** Devuelve { imageUrl, credit } o null si el artista no tiene foto libre. */
  async function findImage(artistExternalId) {
    const wikidataId = wikidataIdFrom(await musicBrainz.getArtistUrlRelations(artistExternalId));
    if (!wikidataId) return null;
    const fileName = await wikimedia.getImageFileName(wikidataId);
    if (!fileName) return null;
    const info = await wikimedia.getImageInfo(fileName);
    if (!info || !isCommonsUpload(info.url)) return null;
    return { imageUrl: info.url, credit: toCredit(info.author, info.license) };
  }

  return { findImage };
}

module.exports = { createArtistImageFinder, htmlToText, wikidataIdFrom, toCredit, isCommonsUpload };
