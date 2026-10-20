/**
 * O sync do manifesto nunca pode estragar o trabalho de imagens feito em paralelo:
 * entradas existentes (ready, créditos, prompts, dimensões) ficam idênticas e na mesma ordem.
 */
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readCatalogRows, summaryOf, syncEntries, type ManifestEntry } from '../../scripts/lib/catalog-sync.mjs';
import { CHARACTERS } from './characters';
import summary from './catalog-summary.json';

const manifest = JSON.parse(readFileSync(resolve(process.cwd(), 'src/data/assets-manifest.json'), 'utf8')) as {
  entries: Record<string, ManifestEntry>;
};
const catalogDir = pathToFileURL(resolve(process.cwd(), 'src/data/catalog') + '/');

describe('sync do manifesto', () => {
  it('o leitor do script enxerga exatamente o catálogo do jogo', () => {
    const rows = readCatalogRows(catalogDir);
    expect(rows.map((r) => r.id).sort()).toEqual(CHARACTERS.map((c) => c.id).sort());
    const byId = new Map(CHARACTERS.map((c) => [c.id, c]));
    for (const r of rows) {
      expect(r.level, r.id).toBe(byId.get(r.id)!.level);
      expect(r.category, r.id).toBe(byId.get(r.id)!.category);
    }
  });

  it('preserva cada entrada existente (inclusive ready com créditos) e a ordem; novos vão para o fim', () => {
    const existing = manifest.entries;
    const ids = [...Object.keys(existing).reverse(), 'novo-id-a', 'novo-id-b'];
    const { entries, added, orphans } = syncEntries(existing, ids);
    expect(orphans).toEqual([]);
    expect(added).toEqual(['novo-id-a', 'novo-id-b']);
    expect(Object.keys(entries)).toEqual([...Object.keys(existing), 'novo-id-a', 'novo-id-b']);
    for (const [id, entry] of Object.entries(existing)) expect(entries[id]).toBe(entry);
    expect(entries['novo-id-a']).toEqual({ status: 'missing', file: 'characters/novo-id-a.webp' });
  });

  it('é idempotente sobre o manifesto real e nunca reduz os ready', () => {
    const ids = CHARACTERS.map((c) => c.id);
    const { entries, added, orphans } = syncEntries(manifest.entries, ids);
    expect(added).toEqual([]);
    expect(orphans).toEqual([]);
    expect(JSON.stringify(entries)).toBe(JSON.stringify(manifest.entries));
    const ready = (e: Record<string, ManifestEntry>) => Object.values(e).filter((x) => x.status === 'ready').length;
    expect(ready(entries)).toBe(ready(manifest.entries));
  });

  it('órfãos são reportados, não apagados silenciosamente', () => {
    const { orphans } = syncEntries({ antigo: { status: 'ready', file: 'characters/antigo.webp' } }, []);
    expect(orphans).toEqual(['antigo']);
  });

  it('resumo da home bate com o manifesto', () => {
    expect(summaryOf(readCatalogRows(catalogDir), manifest.entries)).toEqual(summary);
  });
});
