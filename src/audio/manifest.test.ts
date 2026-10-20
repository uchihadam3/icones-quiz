/**
 * O manifesto de áudio (gerado por tools/audio/build_audio.py) bate com os arquivos publicados:
 * todo evento tem som, todo arquivo existe nos dois formatos, é Ogg Opus / MP3 de verdade e a duração
 * real confere com a declarada (as camadas de música têm exatamente cauda + loop + cabeça).
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import manifestJson from './audio-manifest.json';
import { GAME_LAYERS, type MusicLayer } from './director';
import type { AudioManifest, SfxEvent } from './types';

const manifest = manifestJson as AudioManifest;
const audioDir = resolve(process.cwd(), 'public/audio') + '/';

// Record<SfxEvent, …> obriga a lista a acompanhar o tipo: evento novo sem som quebra o typecheck.
const EVENTS: Record<SfxEvent, true> = {
  'ui-tap': true, 'ui-confirm': true, 'round-start': true, correct: true, 'correct-fast': true, 'correct-hint': true,
  wrong: true, timeout: true, tick: true, 'tick-final': true, heartbeat: true, 'life-lost': true, 'last-life': true,
  'life-recovered': true, 'tier-up-2': true, 'tier-up-3': true, 'tier-up-4': true, 'tier-up-5': true,
  'combo-break': true, skip: true, hint: true, pause: true, resume: true, 'game-start': true, 'game-over': true,
  'new-record': true, 'record-beaten': true, install: true, 'recovery-step': true, 'recovery-break': true, 'hint-recharge': true,
};

/** Duração de um Ogg Opus: granule da última página − pre-skip, a 48 kHz. */
function opusDuration(buf: Buffer): number {
  expect(buf.toString('ascii', 0, 4)).toBe('OggS');
  const head = buf.indexOf('OpusHead');
  expect(head).toBeGreaterThan(0);
  const preSkip = buf.readUInt16LE(head + 10);
  const last = buf.lastIndexOf('OggS');
  return (Number(buf.readBigInt64LE(last + 6)) - preSkip) / 48000;
}

function isMp3(buf: Buffer): boolean {
  return buf.toString('ascii', 0, 3) === 'ID3' || (buf[0] === 0xff && (buf[1]! & 0xe0) === 0xe0);
}

describe('manifesto de áudio', () => {
  it('todo evento semântico tem som, e nada além deles', () => {
    expect(Object.keys(manifest.sfx).sort()).toEqual(Object.keys(EVENTS).sort());
    for (const [event, def] of Object.entries(manifest.sfx)) {
      expect(def.files.length, event).toBeGreaterThan(0);
      expect(def.gain, event).toBeGreaterThan(0);
      expect(def.gain, event).toBeLessThanOrEqual(1);
      expect(def.duck ?? 0, event).toBeLessThan(1);
    }
  });

  it('acerto tem variações; efeitos musicais não variam de afinação', () => {
    expect(manifest.sfx.correct.files.length).toBeGreaterThanOrEqual(3);
    for (const e of ['new-record', 'game-over', 'tier-up-5', 'life-recovered'] as const) expect(manifest.sfx[e].detuneCents ?? 0).toBe(0);
  });

  it('cada arquivo de efeito existe em Opus e MP3, com duração coerente', () => {
    for (const def of Object.values(manifest.sfx)) {
      for (const file of def.files) {
        const opus = readFileSync(`${audioDir}${file}.opus`);
        expect(isMp3(readFileSync(`${audioDir}${file}.mp3`)), file).toBe(true);
        const seconds = opusDuration(opus);
        expect(seconds, file).toBeGreaterThan(0.005);
        expect(seconds, file).toBeLessThan(8);
      }
    }
  });

  it('trilha: as 5 camadas existem, no mesmo andamento, com cauda + loop + cabeça exatos', () => {
    const { loop, layers, bpm, beatsPerBar } = manifest.music;
    const all: MusicLayer[] = ['menu', ...GAME_LAYERS];
    expect(Object.keys(layers).sort()).toEqual([...all].sort());
    const bar = (beatsPerBar * 60) / bpm;
    expect((loop.length / bar) % 1).toBe(0); // loop fecha em compasso inteiro
    for (const layer of all) {
      const def = layers[layer];
      expect(def.duration).toBeCloseTo(loop.lead * 2 + loop.length, 2);
      const seconds = opusDuration(readFileSync(`${audioDir}${def.file}.opus`));
      expect(seconds, layer).toBeCloseTo(def.duration, 1);
      expect(isMp3(readFileSync(`${audioDir}${def.file}.mp3`)), layer).toBe(true);
    }
  });

  it('nenhum arquivo publicado fica fora do manifesto, e o total cabe no orçamento', () => {
    const used = new Set<string>([
      ...Object.values(manifest.sfx).flatMap((d) => d.files),
      ...Object.values(manifest.music.layers).map((d) => d.file),
    ]);
    let bytes = 0;
    for (const sub of ['sfx', 'music']) {
      if (!existsSync(audioDir + sub)) continue;
      for (const name of readdirSync(audioDir + sub)) {
        expect(used.has(`${sub}/${name.replace(/\.(opus|mp3)$/, '')}`), `${sub}/${name} órfão`).toBe(true);
        if (name.endsWith('.opus')) bytes += statSync(`${audioDir}${sub}/${name}`).size;
      }
    }
    // Opus (o que Chrome/Android baixam): música + efeitos abaixo de 8 MB no total.
    expect(bytes).toBeLessThan(8 * 1024 * 1024);
  });

  it('créditos declaram origem e licença', () => {
    expect(manifest.credits.length).toBeGreaterThanOrEqual(2);
    for (const c of manifest.credits) {
      expect(c.source.length).toBeGreaterThan(3);
      expect(c.license.length).toBeGreaterThan(2);
    }
  });
});
