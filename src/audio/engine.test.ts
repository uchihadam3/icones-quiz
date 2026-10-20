import { describe, expect, it, vi } from 'vitest';
import { AudioEngine } from './engine';
import type { AudioManifest, SfxEvent } from './types';
import { musicTarget } from './director';

/** AudioContext falso: registra fontes iniciadas e curvas de ganho, sem som real. */
class FakeParam {
  value = 1;
  events: string[] = [];
  setValueAtTime(v: number, t: number) {
    this.value = v;
    this.events.push(`set:${v}@${t.toFixed(2)}`);
  }
  setTargetAtTime(v: number, t: number) {
    this.value = v;
    this.events.push(`target:${v}@${t.toFixed(2)}`);
  }
  setValueCurveAtTime(c: Float32Array, t: number, d: number) {
    this.value = c[c.length - 1] ?? 0;
    this.events.push(`curve:${c[0]?.toFixed(2)}->${c[c.length - 1]?.toFixed(2)}@${t.toFixed(2)}+${d}`);
  }
  cancelScheduledValues() {}
}
class FakeNode {
  gain = new FakeParam();
  frequency = new FakeParam();
  Q = new FakeParam();
  threshold = new FakeParam();
  knee = new FakeParam();
  ratio = new FakeParam();
  attack = new FakeParam();
  release = new FakeParam();
  detune = new FakeParam();
  type = '';
  connect<T>(n: T) {
    return n;
  }
  disconnect() {}
}
class FakeSource extends FakeNode {
  buffer: { name: string } | null = null;
  loop = false;
  loopStart = 0;
  loopEnd = 0;
  onended: (() => void) | null = null;
  started: { when: number; offset?: number } | null = null;
  stoppedAt: number | null = null;
  constructor(private ctx: FakeContext) {
    super();
  }
  start(when: number, offset?: number) {
    this.started = { when, offset };
    this.ctx.started.push(this);
  }
  stop(when: number) {
    this.stoppedAt = when;
  }
}
class FakeContext {
  currentTime = 10;
  state: 'suspended' | 'running' = 'suspended';
  destination = new FakeNode();
  started: FakeSource[] = [];
  createGain = () => new FakeNode();
  createBiquadFilter = () => new FakeNode();
  createDynamicsCompressor = () => new FakeNode();
  createBufferSource = () => new FakeSource(this);
  decodeAudioData = async (data: ArrayBuffer) => ({ name: new TextDecoder().decode(data) });
  resume = async () => {
    this.state = 'running';
  };
  suspend = async () => {
    this.state = 'suspended';
  };
}

const sfx = (files: string[]) => ({ files, gain: 1, duration: 0.3 });
const manifest: AudioManifest = {
  version: 1,
  formats: { primary: 'opus', fallback: 'mp3' },
  music: {
    bpm: 120,
    beatsPerBar: 4,
    keyscale: 'A minor',
    loop: { lead: 2, length: 64 },
    layers: {
      menu: { file: 'music/menu', duration: 68 },
      groove: { file: 'music/groove', duration: 68 },
      build: { file: 'music/build', duration: 68 },
      hype: { file: 'music/hype', duration: 68 },
      epic: { file: 'music/epic', duration: 68 },
    },
  },
  sfx: Object.fromEntries(
    (
      ['ui-tap', 'ui-confirm', 'round-start', 'correct', 'correct-fast', 'correct-hint', 'wrong', 'timeout', 'tick', 'tick-final', 'heartbeat', 'life-lost', 'last-life', 'life-recovered', 'tier-up-2', 'tier-up-3', 'tier-up-4', 'tier-up-5', 'combo-break', 'skip', 'hint', 'pause', 'resume', 'game-start', 'game-over', 'new-record', 'record-beaten', 'install', 'recovery-step', 'recovery-break', 'hint-recharge'] as SfxEvent[]
    ).map((e) => [e, sfx(e === 'correct' ? ['sfx/correct-1', 'sfx/correct-2', 'sfx/correct-3'] : [`sfx/${e}`])]),
  ) as AudioManifest['sfx'],
  credits: [],
};

function setup(opts: { fetchFails?: boolean; ctxThrows?: boolean } = {}) {
  const ctx = new FakeContext();
  const store = new Map<string, string>();
  const log: string[] = [];
  const fetched: string[] = [];
  const engine = new AudioEngine({
    manifest,
    baseUrl: '/icones-quiz/',
    createContext: () => {
      if (opts.ctxThrows) throw new Error('sem Web Audio');
      return ctx as unknown as AudioContext;
    },
    fetchArrayBuffer: async (url) => {
      fetched.push(url);
      if (opts.fetchFails) throw new Error('offline');
      return new TextEncoder().encode(url).buffer as ArrayBuffer;
    },
    canPlayOpus: () => true,
    storage: { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => void store.set(k, v) },
    onLog: (e) => log.push(e),
  });
  return { engine, ctx, store, log, fetched };
}

const flush = () => new Promise((r) => setTimeout(r, 0));
const game = (multiplier: number, extra: Partial<Parameters<typeof musicTarget>[0]> = {}) =>
  musicTarget({ scene: 'game', multiplier, lives: 3, timeWarning: false, fastStreak: 0, ...extra });

describe('motor de áudio', () => {
  it('nada toca antes do gesto do usuário; depois do unlock, toca', async () => {
    const { engine, ctx } = setup();
    engine.play('ui-tap');
    await flush();
    expect(ctx.started).toHaveLength(0);
    expect(await engine.unlock()).toBe(true);
    engine.play('correct', { key: 1 });
    await flush();
    await flush();
    expect(ctx.started.some((s) => s.buffer?.name.includes('/audio/sfx/correct-'))).toBe(true);
  });

  it('URLs no base path do Pages e no formato escolhido', async () => {
    const { engine, fetched } = setup();
    await engine.unlock();
    await flush();
    expect(fetched.every((u) => u.startsWith('/icones-quiz/audio/') && u.endsWith('.opus'))).toBe(true);
  });

  it('o mesmo evento com a mesma chave toca uma vez (StrictMode / duplo evento)', async () => {
    const { engine, ctx, log } = setup();
    await engine.unlock();
    await flush();
    const before = ctx.started.length;
    engine.play('wrong', { key: 'round-7' });
    engine.play('wrong', { key: 'round-7' });
    engine.play('wrong', { key: 'round-7' });
    await flush();
    await flush();
    expect(ctx.started.length - before).toBe(1);
    expect(log.filter((l) => l === 'sfx:wrong')).toHaveLength(1);
    engine.play('wrong', { key: 'round-8' });
    await flush();
    await flush();
    expect(ctx.started.length - before).toBe(2);
  });

  it('variantes de acerto não repetem a mesma duas vezes seguidas', async () => {
    const { engine, ctx } = setup();
    await engine.unlock();
    await flush();
    for (let i = 0; i < 30; i++) engine.play('correct', { key: i });
    await flush();
    await flush();
    const names = ctx.started.map((s) => s.buffer?.name ?? '').filter((n) => n.includes('correct-'));
    expect(names.length).toBe(30);
    for (let i = 1; i < names.length; i++) expect(names[i]).not.toBe(names[i - 1]);
  });

  it('volume e mudo persistem entre sessões', () => {
    const { engine, store } = setup();
    engine.setSettings({ music: 0.3, muted: true });
    const again = new AudioEngine({ manifest, baseUrl: '/', storage: { getItem: (k) => store.get(k) ?? null, setItem: () => {} } });
    expect(again.getSettings()).toEqual({ music: 0.3, sfx: 0.85, muted: true });
  });

  it('música começa na primeira camada e troca no compasso seguinte com crossfade, mantendo a posição', async () => {
    const { engine, ctx } = setup();
    await engine.unlock();
    engine.setTarget(game(1));
    await vi.waitFor(() => expect(ctx.started.some((s) => s.loop)).toBe(true));
    const first = ctx.started.find((s) => s.loop)!;
    expect(first.buffer?.name).toContain('music/groove');
    expect(first.loopStart).toBe(2);
    expect(first.loopEnd).toBe(66);
    const songStart = first.started!.when;

    ctx.currentTime = songStart + 5.3; // meio do 3º compasso (compasso = 2 s)
    engine.setTarget(game(2));
    await vi.waitFor(() => expect(ctx.started.filter((s) => s.loop)).toHaveLength(2));
    const second = ctx.started.filter((s) => s.loop)[1]!;
    expect(second.buffer?.name).toContain('music/build');
    expect(second.started!.when).toBeCloseTo(songStart + 6, 5); // próximo compasso
    expect(second.started!.offset).toBeCloseTo(2 + 6, 5); // lead + posição na música
    expect(first.stoppedAt).toBeGreaterThan(second.started!.when); // sai depois do crossfade
  });

  it('alvo repetido não reinicia nem troca a música', async () => {
    const { engine, ctx } = setup();
    await engine.unlock();
    engine.setTarget(game(1));
    await vi.waitFor(() => expect(ctx.started.some((s) => s.loop)).toBe(true));
    engine.setTarget(game(1));
    engine.setTarget(game(1));
    await flush();
    await flush();
    expect(ctx.started.filter((s) => s.loop)).toHaveLength(1);
  });

  it('tensão agenda ticks nas batidas do relógio musical', async () => {
    vi.useFakeTimers();
    try {
      const { engine, ctx } = setup();
      await engine.unlock();
      engine.setTarget(game(1));
      await vi.waitFor(() => expect(ctx.started.some((s) => s.loop)).toBe(true));
      const songStart = ctx.started.find((s) => s.loop)!.started!.when;
      ctx.currentTime = songStart + 3.1;
      engine.setTarget(game(1, { timeWarning: true }));
      for (let i = 0; i < 12; i++) {
        ctx.currentTime += 0.05;
        vi.advanceTimersByTime(50);
        await Promise.resolve();
      }
      await vi.runOnlyPendingTimersAsync();
      const ticks = ctx.started.filter((s) => /sfx\/tick/.test(s.buffer?.name ?? ''));
      expect(ticks.length).toBeGreaterThan(0);
      for (const t of ticks) {
        const beats = (t.started!.when - songStart) / 0.5;
        expect(Math.abs(beats - Math.round(beats))).toBeLessThan(1e-6);
      }
    } finally {
      vi.useRealTimers();
    }
  });

  it('pausa abafa a música (filtro + volume) sem parar o relógio', async () => {
    const { engine, ctx, log } = setup();
    await engine.unlock();
    engine.setTarget(game(3));
    await vi.waitFor(() => expect(ctx.started.some((s) => s.loop)).toBe(true));
    engine.setTarget(musicTarget({ scene: 'paused', multiplier: 3, lives: 3, timeWarning: false, fastStreak: 0 }));
    expect(log).toContain('music:hype:0:m');
    expect(ctx.started.filter((s) => s.loop)).toHaveLength(1);
  });

  it('sem Web Audio ou sem rede: falha silenciosa, nada quebra', async () => {
    const broken = setup({ ctxThrows: true });
    expect(await broken.engine.unlock()).toBe(false);
    expect(broken.engine.available).toBe(false);
    expect(() => broken.engine.play('correct', { key: 1 })).not.toThrow();
    expect(() => broken.engine.setTarget(game(2))).not.toThrow();

    const offline = setup({ fetchFails: true });
    expect(await offline.engine.unlock()).toBe(true);
    offline.engine.setTarget(game(1));
    offline.engine.play('correct', { key: 1 });
    await flush();
    await flush();
    expect(offline.ctx.started).toHaveLength(0);
    expect(offline.log.some((l) => l.startsWith('load-fail:'))).toBe(true);
  });
});
