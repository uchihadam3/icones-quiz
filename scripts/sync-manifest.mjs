// Garante que src/data/assets-manifest.json tenha uma entrada para cada id do catálogo.
// Nunca altera entradas existentes; apenas adiciona as que faltam com status "missing".
// Uso: node scripts/sync-manifest.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('..', import.meta.url);
const catalogSrc = readFileSync(new URL('src/data/characters.ts', root), 'utf8');
const ids = [...catalogSrc.matchAll(/\{ id: '([a-z0-9-]+)'/g)].map((m) => m[1]);
const manifestPath = fileURLToPath(new URL('src/data/assets-manifest.json', root));

let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
} catch {
  manifest = { version: 1, entries: {} };
}

let added = 0;
for (const id of ids) {
  if (!manifest.entries[id]) {
    manifest.entries[id] = { status: 'missing', file: `characters/${id}.webp` };
    added++;
  }
}
const orphans = Object.keys(manifest.entries).filter((id) => !ids.includes(id));
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`catálogo: ${ids.length} ids · adicionados: ${added} · órfãos no manifesto: ${orphans.length ? orphans.join(', ') : 'nenhum'}`);
