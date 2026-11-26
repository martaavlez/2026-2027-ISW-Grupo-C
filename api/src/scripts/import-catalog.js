// Lanza la importación del catálogo a mano.
//   npm run import:initial                            primera importación
//   npm run import:initial -- --limit 500 --offset 500 continúa con los 500 siguientes de cada género
//   npm run import:daily                              novedades desde la última importación correcta
//   npm run import:artist-images -- --limit 100       fotos de los artistas que aún no la tienen
//   npm run import:artist -- --name "Robe"            busca el artista y enseña sus identificadores
//   npm run import:artist -- --id <MBID>              importa toda la discografía de ese artista

const config = require('../config');
const db = require('../db');
const { createCatalogImport } = require('../catalog-import');

function readText(args, name) {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? null : (args[index + 1] ?? null);
}

function printArtists(artists) {
  if (artists.length === 0) {
    console.log('No se ha encontrado ningún artista con ese nombre.');
    return;
  }
  console.log('Elige el bueno y lánzalo con: npm run import:artist -- --id <MBID>\n');
  for (const artist of artists) {
    const details = [artist.disambiguation, artist.country].filter(Boolean).join(' · ');
    console.log(`${artist.id}  ${artist.name}${details ? `  (${details})` : ''}`);
  }
}

function readOption(args, name, fallback) {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? fallback : Number.parseInt(args[index + 1], 10);
}

async function main() {
  const args = process.argv.slice(2);
  const { importer } = createCatalogImport({ pool: db.pool, config });

  let result;
  if (args.includes('--artist')) {
    const name = readText(args, 'name');
    if (name) {
      printArtists(await importer.findArtists(name));
      return;
    }
    result = await importer.importArtist(readText(args, 'id'));
  } else if (args.includes('--artist-images')) {
    result = await importer.importArtistImages({
      limit: readOption(args, 'limit', config.catalogImport.artistImagesPerRun),
    });
  } else if (args.includes('--daily')) {
    result = await importer.importNewReleases();
  } else {
    result = await importer.importInitial({
      limitPerGenre: readOption(args, 'limit', config.catalogImport.initialLimitPerGenre),
      offset: readOption(args, 'offset', 0),
    });
  }

  console.log(result);
  process.exitCode = result.status === 'success' ? 0 : 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.pool.end());
