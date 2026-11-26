// HU-03 · Buscar contenido: resultados separados por categorías (PA-03-01).
const { safeImageUrl } = require('../catalog/catalog-service');
const { parseSearchTerm } = require('./search-term');

const RESULTS_PER_CATEGORY = 10;

function createSearchService({ searchRepository }) {
  async function search(rawTerm, viewerId) {
    const term = parseSearchTerm(rawTerm);
    const found = await searchRepository.search(term, {
      limit: RESULTS_PER_CATEGORY,
      viewerId,
    });
    const withCover = (item) => ({ ...item, coverUrl: safeImageUrl(item.coverUrl) });
    return {
      query: term.term,
      songs: found.songs.map(withCover),
      albums: found.albums.map(withCover),
      artists: found.artists.map((artist) => ({
        ...artist,
        imageUrl: safeImageUrl(artist.imageUrl),
      })),
      users: found.users.map((user) => ({ ...user, photoUrl: safeImageUrl(user.photoUrl) })),
      communities: found.communities,
    };
  }

  return { search };
}

module.exports = { createSearchService, RESULTS_PER_CATEGORY };
