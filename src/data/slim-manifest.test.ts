/** O manifesto enxuto do build mantém tudo o que a partida e os créditos exibem. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { RUNTIME_FIELDS, slimManifestJson } from '../../vite/slimManifest';
import { isImageReady, type AssetManifest } from './assets';

const raw = readFileSync(resolve(process.cwd(), 'src/data/assets-manifest.json'), 'utf8');
const full = JSON.parse(raw) as AssetManifest;
const slim = JSON.parse(slimManifestJson(raw)) as AssetManifest;

describe('manifesto enxuto do build', () => {
  it('cada imagem pronta continua pronta, e nenhuma faltante vira pronta', () => {
    for (const id of Object.keys(full.entries)) expect(isImageReady(id, slim), id).toBe(isImageReady(id, full));
  });

  it('créditos idênticos: atribuição, fonte e licença de cada imagem pronta', () => {
    for (const [id, entry] of Object.entries(full.entries)) {
      if (entry.status !== 'ready') continue;
      for (const f of RUNTIME_FIELDS) expect(slim.entries[id]?.[f], `${id}.${f}`).toEqual(entry[f]);
    }
  });

  it('não embute prompts de geração nem notas internas no JavaScript', () => {
    const text = slimManifestJson(raw);
    expect(text).not.toContain('generationPrompt');
    expect(text).not.toContain('rightsNote');
    expect(text.length).toBeLessThan(raw.length / 2);
  });
});
