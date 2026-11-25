const DEFAULT_GENRES =
  'pop=Pop,rock=Rock,indie=Indie,electronic=Electrónica,hip hop=Hip hop,' +
  'jazz=Jazz,classical=Clásica,reggaeton=Reguetón,metal=Metal,soul=Soul';

/**
 * Convierte la lista de géneros de la configuración en objetos.
 * Formato: "etiqueta de MusicBrainz=Nombre que se guarda", separados por comas.
 * Si falta el nombre, se usa la etiqueta.
 */
function parseGenres(text = DEFAULT_GENRES) {
  return text
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [tag, name] = entry.split('=').map((part) => part.trim());
      return { tag: tag.toLowerCase(), name: (name || tag).slice(0, 50) };
    });
}

module.exports = { DEFAULT_GENRES, parseGenres };
