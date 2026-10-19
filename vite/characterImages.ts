import { createHash } from 'node:crypto';
import { createReadStream, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';

const VIRTUAL = 'virtual:character-images';
const RESOLVED = '\0' + VIRTUAL;

/**
 * Publica as imagens dos ícones SEM o id na URL.
 * - Fonte: art/characters/<id>.webp (fora de public/, para o Vite não copiar com o nome original).
 * - Build: cada imagem com status "ready" vira dist/img/<sha256-16>.webp (nome = hash do conteúdo).
 * - Dev/testes: servida em <base>__characters/<id>.webp.
 * O módulo virtual exporta o mapa id → URL. Isso tira o nome da aba de rede, mas NÃO é anti-fraude:
 * o mapa está no JavaScript do cliente. Ranking online exigirá servir imagens pelo servidor.
 */
export function characterImages(options: { manifestPath: string; sourceDir: string }): Plugin {
  let isBuild = false;
  let base = '/';
  return {
    name: 'icones-character-images',
    configResolved(config) {
      isBuild = config.command === 'build';
      base = config.base;
    },
    resolveId(id) {
      return id === VIRTUAL ? RESOLVED : undefined;
    },
    load(id) {
      if (id !== RESOLVED) return undefined;
      this.addWatchFile(options.manifestPath);
      const manifest = JSON.parse(readFileSync(options.manifestPath, 'utf8')) as { entries: Record<string, { status: string }> };
      const urls: Record<string, string> = {};
      for (const [characterId, entry] of Object.entries(manifest.entries)) {
        if (entry.status !== 'ready') continue;
        const file = join(options.sourceDir, `${characterId}.webp`);
        if (!existsSync(file)) continue; // a validação de assets (npm test) acusa o arquivo faltante
        if (isBuild) {
          const source = readFileSync(file);
          const hash = createHash('sha256').update(source).digest('hex').slice(0, 16);
          this.emitFile({ type: 'asset', fileName: `img/${hash}.webp`, source });
          urls[characterId] = `${base}img/${hash}.webp`;
        } else {
          urls[characterId] = `${base}__characters/${characterId}.webp`;
        }
      }
      return `export default ${JSON.stringify(urls)};`;
    },
    configureServer(server) {
      server.middlewares.use(`${base}__characters/`, (req, res, next) => {
        const name = (req.url ?? '').split('?')[0]?.replace(/^\//, '') ?? '';
        const file = join(options.sourceDir, name);
        if (!/^[a-z0-9-]+\.webp$/.test(name) || !existsSync(file)) return next();
        res.setHeader('Content-Type', 'image/webp');
        createReadStream(file).pipe(res);
      });
    },
  };
}
