// Auditoria do catálogo: totais, novos desde a linha de base, distribuição por categoria/nível,
// ready/missing, ids novos, nomes potencialmente ambíguos, franquias mais frequentes e a fila
// priorizada de imagens a criar.
// Uso: npm run catalog:report            (resumo no terminal)
//      npm run catalog:report -- --write (grava reports/catalog-report.json e .md)
// Os relatórios ficam fora do bundle do jogo (respostas nunca vão para a tela).
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { rows as defineRows } from '../src/data/catalog/define.ts';
import { answerKey, identityKeys, singleEdit } from '../src/domain/answers.ts';

const root = new URL('..', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const manifest = JSON.parse(read('src/data/assets-manifest.json'));
const baseline = JSON.parse(read('reports/catalog-baseline.json'));
const LABELS = {
  anime: 'Anime', cartoon: 'Desenhos', animation: 'Filmes de animação', game: 'Videogames', 'film-tv': 'Filmes e séries',
  comics: 'Quadrinhos', music: 'Música', sport: 'Esporte', celebrity: 'Celebridades',
};

/** Avalia as linhas compactas de cada arquivo de categoria com o mesmo `rows()` do jogo. */
function loadCatalog() {
  const dir = new URL('src/data/catalog/', root);
  const all = [];
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.ts') && !['define.ts', 'index.ts'].includes(f)).sort()) {
    const src = readFileSync(new URL(file, dir), 'utf8');
    const m = src.match(/rows\(\s*'([a-z-]+)'\s*,\s*\[([\s\S]*)\]\s*\)\s*;?\s*$/);
    if (!m) throw new Error(`formato inesperado em ${file}`);
    const list = new Function(`return [${m[2]}];`)();
    all.push(...defineRows(m[1], list));
  }
  return all;
}

const catalog = loadCatalog();
const status = (id) => manifest.entries[id]?.status ?? 'sem-entrada';
const baseIds = new Set(baseline.ids);
const added = catalog.filter((c) => !baseIds.has(c.id));
const pct = (n, d) => (d ? Math.round((n / d) * 1000) / 10 : 0);

const byCategory = {};
for (const c of catalog) {
  const b = (byCategory[c.category] ??= { total: 0, novos: 0, n1: 0, n2: 0, n3: 0, ready: 0, missing: 0, rejected: 0 });
  b.total++;
  b[`n${c.level}`]++;
  if (!baseIds.has(c.id)) b.novos++;
  const s = status(c.id);
  if (s in b) b[s]++;
}
const statuses = catalog.reduce((acc, c) => ({ ...acc, [status(c.id)]: (acc[status(c.id)] ?? 0) + 1 }), {});
const levels = [1, 2, 3].map((l) => catalog.filter((c) => c.level === l).length);

// Franquias (campo origem dos personagens) por categoria: detecta concentração exagerada.
const franchises = {};
for (const c of catalog) {
  if (c.kind !== 'character') continue;
  const key = `${c.category}|${c.origin}`;
  franchises[key] = (franchises[key] ?? 0) + 1;
}
const topFranchises = Object.entries(franchises)
  .map(([k, n]) => {
    const [category, origin] = k.split('|');
    const total = byCategory[category].total;
    return { category, origin, count: n, shareOfCategory: pct(n, total) };
  })
  .sort((a, b) => b.count - a.count)
  .slice(0, 25);

// Nomes para revisão humana: chaves curtas e pares de identidades a 1 edição (o jogo recusa o
// erro de digitação nesses casos, mas a proximidade merece um olhar).
const keyed = catalog.flatMap((c) => identityKeys(c).map((key) => ({ id: c.id, key })));
const byLen = new Map();
for (const e of keyed) {
  if (!byLen.has(e.key.length)) byLen.set(e.key.length, []);
  byLen.get(e.key.length).push(e);
}
const nearPairs = [];
const seenPair = new Set();
for (const e of keyed) {
  if (e.key.length < 4) continue;
  for (const len of [e.key.length, e.key.length + 1]) {
    for (const o of byLen.get(len) ?? []) {
      if (o.id === e.id || o.key === e.key) continue;
      if (singleEdit(e.key, o.key) === null) continue;
      const pair = [e.id, o.id].sort().join(' ~ ');
      if (seenPair.has(pair)) continue;
      seenPair.add(pair);
      nearPairs.push({ a: e.id, keyA: e.key, b: o.id, keyB: o.key });
    }
  }
}
const shortKeys = keyed.filter((e) => e.key.length <= 3).map((e) => `${e.id}: ${e.key}`);

// Fila de imagens: missing, nível 1 → 2 → 3, alternando categorias (diversidade desde o início).
const queue = [];
for (const level of [1, 2, 3]) {
  const buckets = Object.keys(LABELS).map((cat) =>
    catalog.filter((c) => c.category === cat && c.level === level && status(c.id) === 'missing'),
  );
  for (let i = 0; buckets.some((b) => i < b.length); i++) {
    for (const b of buckets) if (b[i]) queue.push({ id: b[i].id, level, category: b[i].category, displayName: b[i].displayName });
  }
}

const report = {
  generatedFrom: 'src/data/catalog/*.ts + src/data/assets-manifest.json',
  baseline: { label: baseline.label, total: baseline.ids.length },
  total: catalog.length,
  added: added.length,
  levels: { n1: levels[0], n2: levels[1], n3: levels[2], n3Share: pct(levels[2], catalog.length) },
  statuses: Object.fromEntries(Object.entries(statuses).map(([k, v]) => [k, { count: v, percent: pct(v, catalog.length) }])),
  byCategory,
  topFranchises,
  review: { nearPairs, shortKeys },
  addedIds: added.map((c) => ({ id: c.id, category: c.category, level: c.level })),
  imageQueue: queue,
};

console.log(`Catálogo: ${report.total} (linha de base "${baseline.label}": ${baseline.ids.length}; novos: ${report.added})`);
console.log(`Níveis: 1=${levels[0]} 2=${levels[1]} 3=${levels[2]} (${report.levels.n3Share}% nível 3)`);
console.log(`Status: ${Object.entries(report.statuses).map(([k, v]) => `${k} ${v.count} (${v.percent}%)`).join(' · ')}`);
console.log('Categoria              total novos  n1  n2  n3 ready missing');
for (const [cat, b] of Object.entries(byCategory)) {
  console.log(`${(LABELS[cat] ?? cat).padEnd(22)}${String(b.total).padStart(5)}${String(b.novos).padStart(6)}${String(b.n1).padStart(4)}${String(b.n2).padStart(4)}${String(b.n3).padStart(4)}${String(b.ready).padStart(6)}${String(b.missing).padStart(8)}`);
}
console.log(`Franquia mais frequente: ${topFranchises.slice(0, 5).map((f) => `${f.origin} ${f.count} (${f.shareOfCategory}% de ${f.category})`).join(' · ')}`);
console.log(`Revisar: ${nearPairs.length} pares a 1 edição, ${shortKeys.length} chaves curtas · fila de imagens: ${queue.length}`);

if (process.argv.includes('--write')) {
  mkdirSync(new URL('reports/', root), { recursive: true });
  writeFileSync(fileURLToPath(new URL('reports/catalog-report.json', root)), JSON.stringify(report, null, 2) + '\n');
  const md = [
    '# Relatório do catálogo',
    '',
    `Gerado por \`npm run catalog:report -- --write\`. Linha de base: ${baseline.label} (${baseline.ids.length} ids).`,
    '',
    `- **Total:** ${report.total} · **novos desde a linha de base:** ${report.added}`,
    `- **Níveis:** 1 = ${levels[0]} · 2 = ${levels[1]} · 3 = ${levels[2]} (${report.levels.n3Share}%)`,
    `- **Status das imagens:** ${Object.entries(report.statuses).map(([k, v]) => `${k} ${v.count} (${v.percent}%)`).join(' · ')}`,
    '',
    '## Por categoria',
    '',
    '| Categoria | Total | Novos | N1 | N2 | N3 | Ready | Missing |',
    '|---|---:|---:|---:|---:|---:|---:|---:|',
    ...Object.entries(byCategory).map(([cat, b]) => `| ${LABELS[cat] ?? cat} | ${b.total} | ${b.novos} | ${b.n1} | ${b.n2} | ${b.n3} | ${b.ready} | ${b.missing} |`),
    '',
    '## Franquias mais frequentes (personagens)',
    '',
    '| Franquia | Categoria | Ícones | % da categoria |',
    '|---|---|---:|---:|',
    ...topFranchises.map((f) => `| ${f.origin} | ${LABELS[f.category]} | ${f.count} | ${f.shareOfCategory}% |`),
    '',
    '## Revisão de nomes',
    '',
    'Pares de identidades com respostas a 1 edição de distância (o jogo recusa o erro de digitação que',
    'cairia na outra identidade, mas vale conferir):',
    '',
    ...nearPairs.map((p) => `- \`${p.a}\` (${p.keyA}) ~ \`${p.b}\` (${p.keyB})`),
    '',
    `Chaves de até 3 letras: ${shortKeys.map((s) => `\`${s}\``).join(', ') || 'nenhuma'}`,
    '',
    '## Fila de imagens (missing, prioridade: nível 1 → 3, alternando categorias)',
    '',
    ...queue.map((q, i) => `${i + 1}. \`${q.id}\` — ${q.displayName} (${LABELS[q.category]}, nível ${q.level})`),
    '',
  ].join('\n');
  writeFileSync(fileURLToPath(new URL('reports/catalog-report.md', root)), md);
  console.log('Gravado: reports/catalog-report.json e reports/catalog-report.md');
}

// Garante que a chave usada aqui é a mesma do jogo (falha cedo se a assinatura mudar).
if (answerKey('Pé-de-Pano') !== 'pedepano') throw new Error('answerKey mudou: revise o relatório');
