import type { Plugin } from 'vite';

/**
 * Campos do manifesto de imagens usados em tempo de execução: status (partida) e os créditos exibidos
 * em ImageCredits (atribuição + links de fonte e licença). A URL da imagem vem de virtual:character-images.
 */
export const RUNTIME_FIELDS = ['status', 'attribution', 'sourceUrl', 'licenseUrl'] as const;

/**
 * No build, o manifesto de imagens embutido no JavaScript leva só as entradas `ready` e os campos de
 * runtime. Prompts de geração, dimensões, autoria e notas de direitos continuam no arquivo
 * (src/data/assets-manifest.json) para auditoria e testes, mas não pesam na tela inicial.
 * Entrada ausente = sem imagem, exatamente como `missing` para isImageReady().
 */
export function slimManifest(options: { manifestPath: string }): Plugin {
  return {
    name: 'icones-slim-asset-manifest',
    apply: 'build',
    transform(code, id) {
      if (id.split('?')[0] !== options.manifestPath) return undefined;
      return { code: slimManifestJson(code), map: null };
    },
  };
}

export function slimManifestJson(code: string): string {
  const manifest = JSON.parse(code) as { entries: Record<string, Record<string, unknown>> };
  const entries: Record<string, Record<string, unknown>> = {};
  for (const [key, entry] of Object.entries(manifest.entries)) {
    if (entry.status !== 'ready') continue;
    entries[key] = Object.fromEntries(RUNTIME_FIELDS.filter((f) => entry[f] !== undefined).map((f) => [f, entry[f]]));
  }
  return JSON.stringify({ ...manifest, entries });
}
