/**
 * "Oráculo" SÓ DE TESTE: descobre qual identidade está na tela a partir do hash do arquivo de imagem
 * (o mesmo cálculo do plugin vite/characterImages.ts). O jogo não expõe a resposta em produção;
 * quem sabe a resposta aqui é o teste, lendo os arquivos do repositório.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CHARACTERS } from '../src/data/characters';
import type { Identity } from '../src/domain/types';

const root = process.cwd();
const manifest = JSON.parse(readFileSync(resolve(root, 'src/data/assets-manifest.json'), 'utf8')) as {
  entries: Record<string, { status: string }>;
};

const byHash = new Map<string, Identity>();
const byId = new Map(CHARACTERS.map((c) => [c.id, c]));
for (const [id, entry] of Object.entries(manifest.entries)) {
  const file = resolve(root, 'art/characters', `${id}.webp`);
  const identity = byId.get(id);
  if (entry.status !== 'ready' || !identity || !existsSync(file)) continue;
  byHash.set(createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 16), identity);
}

/** Identidade cuja imagem publicada é `src` (…/img/<hash>.webp). */
export function identityForImage(src: string): Identity | undefined {
  const hash = /img\/([0-9a-f]{16})\.webp/.exec(src)?.[1];
  return hash ? byHash.get(hash) : undefined;
}
