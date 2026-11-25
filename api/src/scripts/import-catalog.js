// Lanza la importación del catálogo a mano.
//   npm run import:initial                            primera importación
//   npm run import:initial -- --limit 500 --offset 500 continúa con los 500 siguientes de cada género
//   npm run import:daily                              novedades desde la última importación correcta

const config = require('../config');
const db = require('../db');
const { createCatalogImport } = require('../catalog-import');

function readOption(args, name, fallback) {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? fallback : Number.parseInt(args[index + 1], 10);
}

async function main() {
  const args = process.argv.slice(2);
  const { importer } = createCatalogImport({ pool: db.pool, config });

  const result = args.includes('--daily')
    ? await importer.importNewReleases()
    : await importer.importInitial({
        limitPerGenre: readOption(args, 'limit', config.catalogImport.initialLimitPerGenre),
        offset: readOption(args, 'offset', 0),
      });

  console.log(result);
  process.exitCode = result.status === 'success' ? 0 : 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.pool.end());
