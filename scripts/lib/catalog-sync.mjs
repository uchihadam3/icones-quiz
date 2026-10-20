// Lógica pura do sync do manifesto (testada em src/data/catalog-sync.test.ts).
import { readdirSync, readFileSync } from 'node:fs';

/** Lê ids e níveis das linhas compactas de src/data/catalog/<categoria>.ts, na ordem dos arquivos. */
export function readCatalogRows(catalogDir) {
  const rows = [];
  for (const file of readdirSync(catalogDir).filter((f) => f.endsWith('.ts') && !['define.ts', 'index.ts'].includes(f)).sort()) {
    const category = file.replace(/\.ts$/, '');
    const src = readFileSync(new URL(file, catalogDir), 'utf8');
    for (const m of src.matchAll(/^\s*\[\s*'([a-z0-9-]+)',\s*([123]),/gm)) rows.push({ id: m[1], level: Number(m[2]), category });
  }
  return rows;
}

/**
 * Manifesto sincronizado com o catálogo:
 * - toda entrada existente é mantida intacta e NA MESMA ORDEM (diffs mínimos, merge seguro com
 *   commits de imagem feitos em paralelo);
 * - ids novos entram no fim como `missing`;
 * - órfãos (no manifesto, fora do catálogo) são apenas reportados — nada é apagado.
 */
export function syncEntries(existing, ids) {
  const wanted = new Set(ids);
  const entries = {};
  for (const [id, entry] of Object.entries(existing)) if (wanted.has(id)) entries[id] = entry;
  const added = [];
  for (const id of ids) {
    if (entries[id]) continue;
    entries[id] = { status: 'missing', file: `characters/${id}.webp` };
    added.push(id);
  }
  const orphans = Object.keys(existing).filter((id) => !wanted.has(id));
  return { entries, added, orphans };
}

export function duplicates(ids) {
  return [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
}

export function summaryOf(rows, entries) {
  const ready = rows.filter((r) => entries[r.id]?.status === 'ready');
  return { total: rows.length, ready: ready.length, readyLevel1: ready.filter((r) => r.level === 1).length };
}
