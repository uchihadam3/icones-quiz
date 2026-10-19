// Relatório do catálogo e das imagens: total, missing/ready/rejected, por categoria e por nível de fama.
// Uso: npm run assets:report   (adicione --json para saída em JSON)
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('..', import.meta.url);
const catalogDir = new URL('src/data/catalog/', root);
const manifest = JSON.parse(readFileSync(new URL('src/data/assets-manifest.json', root), 'utf8'));
const unlock = JSON.parse(readFileSync(new URL('src/data/unlock.json', root), 'utf8'));

const rows = [];
for (const file of readdirSync(catalogDir).filter((f) => f.endsWith('.ts') && !['define.ts', 'index.ts'].includes(f)).sort()) {
  const category = file.replace(/\.ts$/, '');
  const src = readFileSync(new URL(file, catalogDir), 'utf8');
  for (const m of src.matchAll(/^\s*\[\s*'([a-z0-9-]+)',\s*([123]),/gm)) rows.push({ id: m[1], level: Number(m[2]), category });
}

const status = (id) => manifest.entries[id]?.status ?? 'sem-entrada';
const tally = (list) => list.reduce((acc, r) => ({ ...acc, [status(r.id)]: (acc[status(r.id)] ?? 0) + 1 }), {});
const byCategory = {};
for (const r of rows) {
  byCategory[r.category] ??= { total: 0, n1: 0, n2: 0, n3: 0, ready: 0 };
  const c = byCategory[r.category];
  c.total++;
  c[`n${r.level}`]++;
  if (status(r.id) === 'ready') c.ready++;
}
const levels = [1, 2, 3].map((l) => rows.filter((r) => r.level === l).length);

// Arquivos quebrados: ready sem arquivo, ou arquivo presente sem entrada ready.
const publicDir = fileURLToPath(new URL('public/', root));
const broken = [];
for (const [id, e] of Object.entries(manifest.entries)) {
  if (e.status === 'ready' && !existsSync(publicDir + e.file)) broken.push(`${id}: ready mas falta public/${e.file}`);
  if (e.status === 'ready' && existsSync(publicDir + e.file) && statSync(publicDir + e.file).size === 0) broken.push(`${id}: arquivo vazio`);
}
const ready = rows.filter((r) => status(r.id) === 'ready');
const readyL1 = ready.filter((r) => r.level === 1).length;
const unlocked = ready.length >= unlock.minReady && readyL1 >= unlock.minReadyLevel1;

const report = {
  total: rows.length,
  status: tally(rows),
  niveis: { 1: levels[0], 2: levels[1], 3: levels[2], pctNivel3: +((levels[2] / rows.length) * 100).toFixed(1) },
  porCategoria: byCategory,
  competitivo: { liberado: unlocked, ready: ready.length, readyNivel1: readyL1, exige: unlock },
  quebrados: broken,
};

if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2));
else {
  console.log(`Identidades: ${report.total}  |  status: ${JSON.stringify(report.status)}`);
  console.log(`Níveis: 1=${levels[0]}  2=${levels[1]}  3=${levels[2]}  (${report.niveis.pctNivel3}% nível 3)`);
  console.log('Categoria        total  n1  n2  n3  ready');
  for (const [cat, c] of Object.entries(byCategory)) {
    console.log(`${cat.padEnd(15)} ${String(c.total).padStart(6)} ${String(c.n1).padStart(3)} ${String(c.n2).padStart(3)} ${String(c.n3).padStart(3)} ${String(c.ready).padStart(6)}`);
  }
  console.log(`Modo competitivo: ${unlocked ? 'LIBERADO' : 'bloqueado'} (ready ${ready.length}/${unlock.minReady}, nível 1 ready ${readyL1}/${unlock.minReadyLevel1})`);
  console.log(broken.length ? `Assets quebrados:\n- ${broken.join('\n- ')}` : 'Assets quebrados: nenhum');
}
if (broken.length) process.exitCode = 1;
