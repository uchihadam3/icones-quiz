import type { MusicLayer } from './director';

/** Eventos sonoros semânticos do jogo. Cada um tem asset(s) no manifesto de áudio. */
export type SfxEvent =
  | 'ui-tap'
  | 'ui-confirm'
  | 'round-start'
  | 'correct'
  | 'correct-fast'
  | 'correct-hint'
  | 'wrong'
  | 'timeout'
  | 'tick'
  | 'tick-final'
  | 'heartbeat'
  | 'life-lost'
  | 'last-life'
  | 'life-recovered'
  | 'tier-up-2'
  | 'tier-up-3'
  | 'tier-up-4'
  | 'tier-up-5'
  | 'combo-break'
  | 'skip'
  | 'hint'
  | 'pause'
  | 'resume'
  | 'game-start'
  | 'game-over'
  | 'new-record'
  | 'record-beaten'
  | 'install'
  | 'recovery-step'
  | 'recovery-break'
  | 'hint-recharge';

export interface SfxDef {
  /** Caminhos relativos a public/audio, sem extensão (o motor escolhe opus/mp3). */
  files: string[];
  /** Ganho linear do evento (já masterizado; ajuste fino de mix). */
  gain: number;
  /** Quanto abaixar a música enquanto toca (0 = nada, 0.5 = metade). */
  duck?: number;
  /** Variação aleatória de afinação em centésimos (0 = nenhuma; eventos musicais não variam). */
  detuneCents?: number;
  /** Duração aproximada em segundos (para o ducking e para a auditoria). */
  duration: number;
}

export interface MusicLayerDef {
  file: string;
  /** Duração total do arquivo (s). */
  duration: number;
}

export interface AudioManifest {
  version: number;
  formats: { primary: 'opus'; fallback: 'mp3' };
  music: {
    bpm: number;
    beatsPerBar: number;
    keyscale: string;
    /** Arquivos de loop: [cauda][loop L][cabeça]. O loop toca entre lead e lead+length. */
    loop: { lead: number; length: number };
    layers: Record<MusicLayer, MusicLayerDef>;
  };
  sfx: Record<SfxEvent, SfxDef>;
  credits: { what: string; source: string; license: string; url?: string }[];
}

export interface AudioSettings {
  music: number;
  sfx: number;
  muted: boolean;
}
