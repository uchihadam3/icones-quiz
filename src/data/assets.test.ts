/**
 * Validação automatizada de assets (também roda via `npm run validate:assets`).
 * - Toda identidade ativa precisa de entrada no manifesto; nenhuma entrada órfã.
 * - Entradas 'ready' precisam de arquivo WebP real, dimensões mínimas, proporção 4:5 e licença/atribuição.
 * - Um .webp presente em art/characters sem status 'ready' falha (evita imagem não revisada em produção).
 * - Nenhuma imagem de personagem pode ficar em public/ (seria publicada com o id no nome).
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ASSET_MANIFEST, IMAGE_ASPECT, IMAGE_MIN_SIZE, imageUrlFor, isImageReady } from './assets';
import summary from './catalog-summary.json';
import { activeCharacters, CHARACTERS } from './characters';

const artDir = resolve(process.cwd(), 'art') + '/';
const publicDir = resolve(process.cwd(), 'public') + '/';

/** Lê largura/altura de um WebP (VP8, VP8L, VP8X). */
function readWebpSize(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 30 || buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') return null;
  const chunk = buf.toString('ascii', 12, 16);
  if (chunk === 'VP8X') return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
  if (chunk === 'VP8L') {
    const b = buf.readUInt32LE(21);
    return { width: 1 + (b & 0x3fff), height: 1 + ((b >> 14) & 0x3fff) };
  }
  if (chunk === 'VP8 ') return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
  return null;
}

describe('manifesto de imagens', () => {
  const entries = ASSET_MANIFEST.entries;

  it('cobre todas as identidades ativas e não tem órfãos', () => {
    const ids = new Set(CHARACTERS.map((c) => c.id));
    for (const c of activeCharacters()) expect(entries[c.id], `sem entrada para ${c.id}`).toBeDefined();
    for (const id of Object.keys(entries)) expect(ids.has(id), `entrada órfã ${id}`).toBe(true);
  });

  it('status válido e caminho canônico characters/<id>.webp', () => {
    for (const [id, e] of Object.entries(entries)) {
      expect(['missing', 'ready', 'rejected'], id).toContain(e.status);
      expect(e.file, id).toBe(`characters/${id}.webp`);
    }
  });

  it('cada entrada ready tem arquivo WebP válido, tamanho mínimo, proporção 4:5 e licença', () => {
    for (const [id, e] of Object.entries(entries)) {
      if (e.status !== 'ready') continue;
      const path = artDir + e.file;
      expect(existsSync(path), `arquivo ausente: art/${e.file}`).toBe(true);
      const size = readWebpSize(readFileSync(path));
      expect(size, `${id} não é WebP válido`).not.toBeNull();
      if (!size) continue;
      expect(size.width, id).toBeGreaterThanOrEqual(IMAGE_MIN_SIZE.width);
      expect(size.height, id).toBeGreaterThanOrEqual(IMAGE_MIN_SIZE.height);
      const ratio = size.width / size.height;
      expect(Math.abs(ratio - IMAGE_ASPECT.width / IMAGE_ASPECT.height), `${id} fora de 4:5`).toBeLessThan(0.01);
      expect(e.license, `${id} sem licença`).toBeTruthy();
      expect(e.sourceUrl, `${id} sem fonte`).toMatch(/^https:\/\//);
      expect(e.attribution, `${id} sem atribuição`).toBeTruthy();
    }
  });

  it('nenhum .webp em art/characters sem revisão (status ready)', () => {
    const files = readdirSync(artDir + 'characters').filter((f) => f.endsWith('.webp'));
    for (const f of files) {
      const id = f.replace(/\.webp$/, '');
      expect(isImageReady(id), `art/characters/${f} existe mas o manifesto não marca ready`).toBe(true);
    }
  });

  it('nenhuma imagem de personagem em public/ (sairia com o id no nome)', () => {
    expect(existsSync(publicDir + 'characters')).toBe(false);
  });

  it('URL vem do mapa publicado; sem imagem pronta não há URL', () => {
    expect(imageUrlFor('goku', { goku: '/icones-quiz/img/abc123.webp' })).toBe('/icones-quiz/img/abc123.webp');
    expect(imageUrlFor('goku', {})).toBe('');
  });

  it('resumo da home está em dia com o manifesto (rode npm run assets:sync)', () => {
    const ready = Object.values(entries).filter((e) => e.status === 'ready').length;
    expect(summary.total).toBe(Object.keys(entries).length);
    expect(summary.ready).toBe(ready);
  });
});
