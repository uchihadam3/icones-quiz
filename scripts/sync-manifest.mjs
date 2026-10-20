// Garante que src/data/assets-manifest.json tenha exatamente uma entrada por id do catálogo.
// - Adiciona ids novos com status "missing" no FIM do manifesto (nunca altera nem reordena entradas existentes).
// - Órfãos (id removido do catálogo) fazem o script falhar, para revisão manual, sem apagar nada.
// Uso: npm run assets:sync
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { duplicates, readCatalogRows, summaryOf, syncEntries } from './lib/catalog-sync.mjs';

const root = new URL('..', import.meta.url);
const rows = readCatalogRows(new URL('src/data/catalog/', root));
const ids = rows.map((r) => r.id);
const dupes = duplicates(ids);
if (dupes.length) {
  console.error(`ids duplicados no catálogo: ${dupes.join(', ')}`);
  process.exit(1);
}

const manifestPath = fileURLToPath(new URL('src/data/assets-manifest.json', root));
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const { entries, added, orphans } = syncEntries(manifest.entries, ids);
if (orphans.length) {
  console.error(`Há entradas órfãs: ${orphans.join(', ')}. Ids não podem sumir do catálogo (use active: false). Nada foi gravado.`);
  process.exit(1);
}
writeFileSync(manifestPath, JSON.stringify({ ...manifest, entries }, null, 2) + '\n');

// Resumo minúsculo para a tela inicial (evita carregar o catálogo inteiro só para mostrar contagens).
const summary = summaryOf(rows, entries);
writeFileSync(fileURLToPath(new URL('src/data/catalog-summary.json', root)), JSON.stringify(summary, null, 2) + '\n');
console.log(`catálogo: ${ids.length} ids · adicionados: ${added.length} · ready: ${summary.ready} · órfãos: nenhum`);
