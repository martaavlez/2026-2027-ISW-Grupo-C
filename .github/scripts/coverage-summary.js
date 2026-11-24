// Escribe en el resumen de GitHub Actions una tabla con la cobertura de los tests.
// Uso: node coverage-summary.js <nombre> <ruta a coverage-summary.json>
const fs = require('fs');

const [name, file] = process.argv.slice(2);

if (!fs.existsSync(file)) {
  console.log(`### Cobertura · ${name}\n\nNo se ha generado el informe de cobertura.`);
  process.exit(0);
}

const { total } = JSON.parse(fs.readFileSync(file, 'utf8'));
const rows = [
  ['Líneas', total.lines],
  ['Sentencias', total.statements],
  ['Funciones', total.functions],
  ['Ramas', total.branches],
].map(([label, metric]) => `| ${label} | ${metric.pct} % | ${metric.covered} / ${metric.total} |`);

console.log(
  [`### Cobertura · ${name}`, '', '| Métrica | Cobertura | Cubierto |', '| --- | --- | --- |', ...rows, ''].join('\n'),
);
