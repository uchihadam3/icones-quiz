import manifestJson from './assets-manifest.json';

/**
 * Manifesto de imagens. Cada identidade ativa tem uma entrada.
 * - missing: ainda não há arquivo licenciado (nunca entra em partida real)
 * - ready: arquivo presente, validado, com licença/atribuição
 * - rejected: arquivo recusado na curadoria (qualidade/licença); tratado como missing
 */
export type AssetStatus = 'missing' | 'ready' | 'rejected';

export interface AssetEntry {
  status: AssetStatus;
  /** Caminho relativo a public/, ex.: characters/goku.webp */
  file: string;
  width?: number;
  height?: number;
  /** Onde a imagem foi obtida (página, não hotlink). */
  sourceUrl?: string;
  author?: string;
  /** Identificador SPDX ou nome da licença, ex.: CC-BY-SA-4.0, "Licença comercial — contrato X". */
  license?: string;
  licenseUrl?: string;
  /** Texto de atribuição exibido nos créditos. */
  attribution?: string;
}

export interface AssetManifest {
  version: number;
  entries: Record<string, AssetEntry>;
}

export const ASSET_MANIFEST = manifestJson as AssetManifest;

/** Proporção canônica do cartão de imagem (largura / altura). */
export const IMAGE_ASPECT = { width: 4, height: 5 } as const;
export const IMAGE_MIN_SIZE = { width: 640, height: 800 } as const;

export function isImageReady(id: string, manifest: AssetManifest = ASSET_MANIFEST): boolean {
  return manifest.entries[id]?.status === 'ready';
}

export function imageUrlFor(id: string, manifest: AssetManifest = ASSET_MANIFEST, base = import.meta.env.BASE_URL): string {
  const file = manifest.entries[id]?.file ?? `characters/${id}.webp`;
  return `${base.replace(/\/?$/, '/')}${file}`;
}

export function readyCount(ids: readonly string[], manifest: AssetManifest = ASSET_MANIFEST): number {
  return ids.filter((id) => isImageReady(id, manifest)).length;
}

const preloadCache = new Map<string, Promise<boolean>>();

/** Pré-carrega uma imagem. Resolve true/false (nunca rejeita) para o jogo decidir o fallback. */
export function preloadImage(url: string): Promise<boolean> {
  const cached = preloadCache.get(url);
  if (cached) return cached;
  const promise = new Promise<boolean>((resolve) => {
    if (typeof Image === 'undefined') return resolve(false);
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      if (typeof img.decode === 'function') img.decode().then(() => resolve(true), () => resolve(true));
      else resolve(true);
    };
    img.onerror = () => {
      preloadCache.delete(url);
      resolve(false);
    };
    img.src = url;
  });
  preloadCache.set(url, promise);
  return promise;
}
