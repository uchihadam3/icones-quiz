// Garante que src/data/assets-manifest.json tenha exatamente uma entrada por id do catálogo.
// - Adiciona ids novos com status "missing" (nunca altera entradas existentes).
// - Órfãos (id removido do catálogo) fazem o script falhar, para revisão manual.
// Uso: npm run assets:sync
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('..', import.meta.url);
const catalogDir = new URL('src/data/catalog/', root);
const ids = [];
const levels = {};
for (const file of readdirSync(catalogDir).filter((f) => f.endsWith('.ts') && !['define.ts', 'index.ts'].includes(f)).sort()) {
  const src = readFileSync(new URL(file, catalogDir), 'utf8');
  for (const m of src.matchAll(/^\s*\[\s*'([a-z0-9-]+)',\s*([123]),/gm)) {
    ids.push(m[1]);
    levels[m[1]] = Number(m[2]);
  }
}
const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
if (dupes.length) {
  console.error(`ids duplicados no catálogo: ${dupes.join(', ')}`);
  process.exit(1);
}

const manifestPath = fileURLToPath(new URL('src/data/assets-manifest.json', root));
let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
} catch {
  manifest = { version: 1, entries: {} };
}

let added = 0;
const entries = {};
for (const id of ids) {
  if (manifest.entries[id]) entries[id] = manifest.entries[id];
  else {
    entries[id] = { status: 'missing', file: `characters/${id}.webp` };
    added++;
  }
}
const orphans = Object.keys(manifest.entries).filter((id) => !ids.includes(id));
writeFileSync(manifestPath, JSON.stringify({ ...manifest, entries }, null, 2) + '\n');

// Resumo minúsculo para a tela inicial (evita carregar o catálogo inteiro só para mostrar contagens).
const ready = ids.filter((id) => entries[id].status === 'ready');
const summary = { total: ids.length, ready: ready.length, readyLevel1: ready.filter((id) => levels[id] === 1).length };
writeFileSync(fileURLToPath(new URL('src/data/catalog-summary.json', root)), JSON.stringify(summary, null, 2) + '\n');
console.log(`catálogo: ${ids.length} ids · adicionados: ${added} · órfãos: ${orphans.length ? orphans.join(', ') : 'nenhum'}`);
if (orphans.length) {
  console.error('Há entradas órfãs: ids não podem sumir do catálogo (use active: false). Revise antes de seguir.');
  process.exit(1);
}
