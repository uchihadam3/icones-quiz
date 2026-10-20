import { equalPowerCurves, GAME_LAYERS, nextGridTime, type MusicLayer, type MusicTarget } from './director';
import type { AudioManifest, AudioSettings, SfxEvent } from './types';

/**
 * Motor de áudio central (uma instância por app).
 *
 * Grafo: [camadas de música] → musicDuck → musicFilter → musicVol ┐
 *        [efeitos]           → sfxVol ─────────────────────────────┼→ master → limitador → saída
 *
 * - Só cria/retoma o AudioContext após gesto do usuário (política de autoplay).
 * - Música: variações do mesmo tema, alinhadas no tempo, em loop; troca com crossfade equal-power
 *   quantizado ao próximo compasso, preservando a posição na música (nunca reinicia a cada rodada).
 * - Tensão: ticks agendados nas batidas do relógio musical + batimento a cada compasso.
 * - Efeitos: variantes sem repetição imediata, leve variação de afinação, ducking da música.
 * - Deduplicação: o mesmo evento com a mesma chave toca uma vez (StrictMode, duplo clique, callbacks repetidos).
 * - Qualquer falha (sem Web Audio, decodificação, rede) deixa o jogo mudo, nunca quebrado.
 */

export interface AudioDeps {
  manifest: AudioManifest;
  baseUrl: string;
  createContext?: () => AudioContext;
  fetchArrayBuffer?: (url: string) => Promise<ArrayBuffer>;
  canPlayOpus?: () => boolean;
  storage?: Pick<Storage, 'getItem' | 'setItem'> | null;
  /** Registro de eventos para testes/E2E (opcional). */
  onLog?: (entry: string) => void;
}

const SETTINGS_KEY = 'icones-quiz:v1:audio';
const DEFAULT_SETTINGS: AudioSettings = { music: 0.7, sfx: 0.85, muted: false };
const MAX_DECODED_LAYERS = 3;

interface PlayingLayer {
  layer: MusicLayer;
  source: AudioBufferSourceNode;
  gain: GainNode;
}

export class AudioEngine {
  readonly manifest: AudioManifest;
  private deps: AudioDeps;
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private musicVol!: GainNode;
  private musicDuck!: GainNode;
  private musicFilter!: BiquadFilterNode;
  private sfxVol!: GainNode;
  private settings: AudioSettings;
  private format: 'opus' | 'mp3' = 'opus';
  private failed = false;

  private buffers = new Map<string, Promise<AudioBuffer | null>>();
  private decodedLayers: MusicLayer[] = [];
  private current: PlayingLayer | null = null;
  private wantedLayer: MusicLayer | null = null;
  private target: MusicTarget | null = null;
  private songStart = 0;
  private switching: Promise<void> = Promise.resolve();

  private lastKey = new Map<SfxEvent, string>();
  private lastAt = new Map<SfxEvent, number>();
  private lastVariant = new Map<SfxEvent, number>();
  private dangerTimer: ReturnType<typeof setInterval> | null = null;
  private nextTickAt = 0;
  private listeners = new Set<() => void>();

  constructor(deps: AudioDeps) {
    this.deps = deps;
    this.manifest = deps.manifest;
    this.settings = this.loadSettings();
  }

  // ── Estado público ──────────────────────────────────────────────────────

  get unlocked(): boolean {
    return this.ctx !== null && this.ctx.state === 'running';
  }

  get available(): boolean {
    return !this.failed;
  }

  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    for (const fn of this.listeners) fn();
  }

  private log(entry: string) {
    this.deps.onLog?.(entry);
  }

  // ── Preferências ────────────────────────────────────────────────────────

  private loadSettings(): AudioSettings {
    try {
      const raw = this.deps.storage?.getItem(SETTINGS_KEY);
      if (!raw) return { ...DEFAULT_SETTINGS };
      const parsed = JSON.parse(raw) as Partial<AudioSettings>;
      const clamp = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : d);
      return { music: clamp(parsed.music, DEFAULT_SETTINGS.music), sfx: clamp(parsed.sfx, DEFAULT_SETTINGS.sfx), muted: parsed.muted === true };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  setSettings(patch: Partial<AudioSettings>): void {
    this.settings = { ...this.settings, ...patch };
    try {
      this.deps.storage?.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch {
      // sem persistência
    }
    this.applyVolumes(0.15);
    this.emit();
  }

  private applyVolumes(ramp = 0.05) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const m = this.settings.muted ? 0 : 1;
    // Curva perceptual simples (x²): o meio do controle soa como "metade".
    this.master.gain.setTargetAtTime(m, t, ramp);
    this.musicVol.gain.setTargetAtTime(this.settings.music ** 2, t, ramp);
    this.sfxVol.gain.setTargetAtTime(this.settings.sfx ** 2, t, ramp);
  }

  // ── Desbloqueio ─────────────────────────────────────────────────────────

  /** Chamar dentro de um gesto do usuário (clique/tecla). Idempotente. */
  async unlock(): Promise<boolean> {
    if (this.failed) return false;
    try {
      if (!this.ctx) this.buildGraph();
      if (this.ctx && this.ctx.state !== 'running') await this.ctx.resume();
      this.emit();
      // Efeitos são pequenos: carregam todos após o desbloqueio.
      void this.preloadSfx();
      if (this.target) void this.applyTarget(this.target);
      return this.unlocked;
    } catch {
      this.fail();
      return false;
    }
  }

  /** Depois de uma falha, tenta recriar o áudio do zero (botão "Tentar de novo"). */
  async retry(): Promise<boolean> {
    this.failed = false;
    this.ctx = null;
    this.current = null;
    this.buffers.clear();
    this.decodedLayers = [];
    return this.unlock();
  }

  private buildGraph() {
    const create = this.deps.createContext ?? (() => new AudioContext({ latencyHint: 'interactive' }));
    const ctx = create();
    this.ctx = ctx;
    this.format = (this.deps.canPlayOpus ?? defaultCanPlayOpus)() ? 'opus' : 'mp3';

    this.master = ctx.createGain();
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -3;
    limiter.knee.value = 4;
    limiter.ratio.value = 12;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.15;
    this.master.connect(limiter).connect(ctx.destination);

    this.musicVol = ctx.createGain();
    this.musicFilter = ctx.createBiquadFilter();
    this.musicFilter.type = 'lowpass';
    this.musicFilter.frequency.value = 20000;
    this.musicFilter.Q.value = 0.5;
    this.musicDuck = ctx.createGain();
    this.musicDuck.connect(this.musicFilter).connect(this.musicVol).connect(this.master);

    this.sfxVol = ctx.createGain();
    this.sfxVol.connect(this.master);
    this.applyVolumes(0.01);
    this.log(`unlock:${this.format}`);
  }

  private fail() {
    this.failed = true;
    this.stopDanger();
    this.log('fail');
    this.emit();
  }

  /** Aba escondida: suspende tudo; ao voltar, retoma com fade. */
  async setHidden(hidden: boolean): Promise<void> {
    if (!this.ctx) return;
    try {
      if (hidden) {
        this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
        await this.ctx.suspend();
      } else {
        await this.ctx.resume();
        this.master.gain.setValueAtTime(0, this.ctx.currentTime);
        this.applyVolumes(0.25);
      }
    } catch {
      // ignorar
    }
  }

  // ── Carregamento ────────────────────────────────────────────────────────

  private url(path: string): string {
    return `${this.deps.baseUrl.replace(/\/?$/, '/')}audio/${path}.${this.format}`;
  }

  private load(path: string): Promise<AudioBuffer | null> {
    const cached = this.buffers.get(path);
    if (cached) return cached;
    const fetcher = this.deps.fetchArrayBuffer ?? defaultFetch;
    const promise = fetcher(this.url(path))
      .then((data) => (this.ctx ? this.ctx.decodeAudioData(data) : null))
      .catch(() => {
        this.buffers.delete(path);
        this.log(`load-fail:${path}`);
        return null;
      });
    this.buffers.set(path, promise);
    return promise;
  }

  private async preloadSfx() {
    const files = new Set(Object.values(this.manifest.sfx).flatMap((d) => d.files));
    await Promise.all([...files].map((f) => this.load(f)));
  }

  // ── Efeitos ─────────────────────────────────────────────────────────────

  /**
   * Toca um efeito. `key` identifica a ocorrência (ex.: id da rodada): repetir a mesma chave não toca de novo.
   * Sem chave, o mesmo evento é ignorado se repetido em < 60 ms.
   */
  play(event: SfxEvent, opts: { key?: string | number; delay?: number; gain?: number; /** Transposição exata (ex.: passo da sequência). */ cents?: number } = {}): void {
    const def = this.manifest.sfx[event];
    if (!def) return;
    const key = opts.key === undefined ? undefined : String(opts.key);
    if (key !== undefined) {
      if (this.lastKey.get(event) === key) return;
      this.lastKey.set(event, key);
    }
    const nowMs = Date.now();
    if (key === undefined && nowMs - (this.lastAt.get(event) ?? 0) < 60) return;
    this.lastAt.set(event, nowMs);
    this.log(`sfx:${event}`);
    if (!this.ctx || !this.unlocked || this.failed) return;

    const variant = this.pickVariant(event, def.files.length);
    const file = def.files[variant];
    if (!file) return;
    const ctx = this.ctx;
    void this.load(file).then((buffer) => {
      if (!buffer || !this.ctx) return;
      const when = ctx.currentTime + Math.max(0, opts.delay ?? 0);
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      if (opts.cents !== undefined) src.detune.value = opts.cents;
      else if (def.detuneCents) src.detune.value = (Math.random() * 2 - 1) * def.detuneCents;
      const g = ctx.createGain();
      g.gain.value = def.gain * (opts.gain ?? 1);
      src.connect(g).connect(this.sfxVol);
      src.start(when);
      src.onended = () => {
        src.disconnect();
        g.disconnect();
      };
      if (def.duck) this.duck(def.duck, when, def.duration);
    });
  }

  private pickVariant(event: SfxEvent, count: number): number {
    if (count <= 1) return 0;
    const last = this.lastVariant.get(event) ?? -1;
    let v = Math.floor(Math.random() * count);
    if (v === last) v = (v + 1) % count; // nunca a mesma variante duas vezes seguidas
    this.lastVariant.set(event, v);
    return v;
  }

  private duck(amount: number, when: number, duration: number) {
    const g = this.musicDuck.gain;
    const floor = Math.max(0.2, 1 - amount);
    g.cancelScheduledValues(when);
    g.setTargetAtTime(floor, when, 0.03);
    g.setTargetAtTime(1, when + Math.min(duration, 1.2), 0.35);
  }

  // ── Música ──────────────────────────────────────────────────────────────

  private get barSeconds(): number {
    const { bpm, beatsPerBar } = this.manifest.music;
    return (60 / bpm) * beatsPerBar;
  }

  private get beatSeconds(): number {
    return 60 / this.manifest.music.bpm;
  }

  /** Define o alvo musical (vindo do diretor). Chamadas repetidas com o mesmo alvo não fazem nada. */
  setTarget(target: MusicTarget): void {
    const prev = this.target;
    this.target = target;
    if (prev && prev.layer === target.layer && prev.danger === target.danger && prev.muffled === target.muffled) return;
    this.log(`music:${target.layer}:${target.danger}:${target.muffled ? 'm' : '-'}`);
    if (this.unlocked) void this.applyTarget(target);
  }

  private async applyTarget(target: MusicTarget) {
    if (!this.ctx || this.failed) return;
    const t = this.ctx.currentTime;
    // Abafar (pausa/fim): filtro passa-baixa e volume menor, sem parar o relógio musical.
    this.musicFilter.frequency.setTargetAtTime(target.muffled ? 700 : 20000, t, target.muffled ? 0.12 : 0.25);
    this.musicDuck.gain.setTargetAtTime(target.muffled ? 0.55 : 1, t, 0.2);
    if (target.danger !== 0 && !target.muffled) this.startDanger(target.danger);
    else this.stopDanger();
    this.wantedLayer = target.layer;
    // Encadeia trocas para nunca haver duas camadas entrando ao mesmo tempo.
    this.switching = this.switching.then(() => this.switchLayer(target.layer));
    // Pré-carrega o próximo degrau provável, para a subida soar no compasso certo.
    const i = GAME_LAYERS.indexOf(target.layer);
    const next = GAME_LAYERS[i + 1];
    if (next) void this.layerBuffer(next);
  }

  private layerBuffer(layer: MusicLayer): Promise<AudioBuffer | null> {
    const def = this.manifest.music.layers[layer];
    if (!def) return Promise.resolve(null); // camada não publicada: segue sem música
    this.decodedLayers = [...this.decodedLayers.filter((l) => l !== layer), layer];
    // Mantém no máximo N camadas decodificadas (memória do celular); descarta a menos recente que não está tocando.
    while (this.decodedLayers.length > MAX_DECODED_LAYERS) {
      const drop = this.decodedLayers.find((l) => l !== this.current?.layer && l !== layer);
      if (!drop) break;
      this.decodedLayers = this.decodedLayers.filter((l) => l !== drop);
      const dropDef = this.manifest.music.layers[drop];
      if (dropDef) this.buffers.delete(dropDef.file);
    }
    return this.load(def.file);
  }

  private async switchLayer(layer: MusicLayer) {
    if (!this.ctx || this.wantedLayer !== layer) return;
    if (this.current?.layer === layer) return;
    const buffer = await this.layerBuffer(layer);
    if (!buffer || !this.ctx || this.wantedLayer !== layer) return;
    const ctx = this.ctx;
    const { lead, length } = this.manifest.music.loop;
    const bar = this.barSeconds;

    let startAt: number;
    if (!this.current) {
      // Primeira camada: o relógio musical começa agora (alinhado à grade daqui em diante).
      startAt = ctx.currentTime + 0.06;
      this.songStart = startAt;
    } else {
      startAt = nextGridTime(ctx.currentTime, this.songStart, bar, 0.08);
    }
    const position = (((startAt - this.songStart) % length) + length) % length;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.loopStart = lead;
    source.loopEnd = lead + length;
    const gain = ctx.createGain();
    source.connect(gain).connect(this.musicDuck);
    source.start(startAt, lead + position);

    const fade = this.current ? bar : 1.2;
    const { fadeIn, fadeOut } = equalPowerCurves(48);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.setValueCurveAtTime(fadeIn, startAt, fade);
    const old = this.current;
    if (old) {
      old.gain.gain.cancelScheduledValues(ctx.currentTime);
      old.gain.gain.setValueAtTime(old.gain.gain.value, ctx.currentTime);
      old.gain.gain.setValueCurveAtTime(fadeOut, startAt, fade);
      old.source.stop(startAt + fade + 0.05);
      old.source.onended = () => {
        old.source.disconnect();
        old.gain.disconnect();
      };
    }
    this.current = { layer, source, gain };
    this.log(`layer:${layer}`);
  }

  /** Para a música com fade (ex.: sair do jogo sem áudio). */
  stopMusic(fade = 0.6): void {
    if (!this.ctx || !this.current) return;
    const { source, gain } = this.current;
    gain.gain.setTargetAtTime(0, this.ctx.currentTime, fade / 3);
    source.stop(this.ctx.currentTime + fade + 0.1);
    this.current = null;
  }

  // ── Tensão no tempo da música ───────────────────────────────────────────

  private dangerLevel: 0 | 1 | 2 = 0;

  private startDanger(level: 1 | 2) {
    this.dangerLevel = level;
    if (this.dangerTimer || !this.ctx) return;
    this.nextTickAt = nextGridTime(this.ctx.currentTime, this.songStart, this.beatSeconds, 0.05);
    // Agendador com antecedência (padrão "two clocks"): precisão de áudio, não de setInterval.
    this.dangerTimer = setInterval(() => this.scheduleDanger(), 50);
  }

  private stopDanger() {
    this.dangerLevel = 0;
    if (this.dangerTimer) clearInterval(this.dangerTimer);
    this.dangerTimer = null;
  }

  private scheduleDanger() {
    if (!this.ctx || this.dangerLevel === 0) return;
    const horizon = this.ctx.currentTime + 0.2;
    while (this.nextTickAt < horizon) {
      const beatIndex = Math.round((this.nextTickAt - this.songStart) / this.beatSeconds);
      const downbeat = beatIndex % this.manifest.music.beatsPerBar === 0;
      if (this.dangerLevel === 2) this.playScheduled(downbeat ? 'tick-final' : 'tick', this.nextTickAt);
      else if (downbeat) this.playScheduled('heartbeat', this.nextTickAt);
      this.nextTickAt += this.beatSeconds;
    }
  }

  private playScheduled(event: SfxEvent, when: number) {
    const def = this.manifest.sfx[event];
    const file = def?.files[0];
    if (!def || !file || !this.ctx) return;
    const ctx = this.ctx;
    void this.load(file).then((buffer) => {
      if (!buffer || when < ctx.currentTime) return;
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const g = ctx.createGain();
      g.gain.value = def.gain;
      src.connect(g).connect(this.sfxVol);
      src.start(when);
    });
  }
}

function defaultCanPlayOpus(): boolean {
  try {
    return typeof Audio !== 'undefined' && new Audio().canPlayType('audio/ogg; codecs=opus') !== '';
  } catch {
    return false;
  }
}

async function defaultFetch(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.arrayBuffer();
}
