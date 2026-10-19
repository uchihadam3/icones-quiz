import { describe, expect, it } from 'vitest';
import { GAME_CONFIG } from '../config/gameConfig';
import { CHARACTERS } from '../data/characters';
import { createEngine, currentMultiplier, recoveryView, roundRemainingMs, type GameState } from './engine';

const engine = createEngine({ catalog: CHARACTERS, isImageReady: () => true, config: GAME_CONFIG });

const answerFor = (s: GameState) => engine.identity(s.round!.identityId)!.names[0]!;
const rid = (s: GameState) => s.round!.id;

/** Responde certo e avança para a próxima rodada. */
function correct(s: GameState, now = 1000): GameState {
  const r = engine.reduce(s, { type: 'submit', roundId: rid(s), guess: answerFor(s), now });
  expect(r.lastResolution?.outcome).toBe('correct');
  return engine.reduce(r, { type: 'next', roundId: rid(r), now: now + 1 });
}
function wrong(s: GameState, now = 1000): GameState {
  const r = engine.reduce(s, { type: 'submit', roundId: rid(s), guess: 'zzzz resposta errada', now });
  return r.phase === 'gameover' ? r : engine.reduce(r, { type: 'next', roundId: rid(r), now: now + 1 });
}
function skip(s: GameState, now = 1000): GameState {
  const r = engine.reduce(s, { type: 'skip', roundId: rid(s), now });
  return engine.reduce(r, { type: 'next', roundId: rid(r), now: now + 1 });
}

/** Cada rodada recomeça o timer em `now`; usamos sempre now pequeno para não estourar o tempo. */
const start = (seed = 1) => engine.start('competitive', seed, 0);

describe('A) combo e pontos no fluxo real', () => {
  it('acertos seguidos aumentam combo e multiplicador; erro zera combo e não dá pontos', () => {
    let s = start();
    for (let i = 0; i < 3; i++) s = correct(s, 0);
    expect(s.combo).toBe(3);
    expect(currentMultiplier(s, GAME_CONFIG)).toBe(2);
    const before = s.score;
    s = wrong(s, 0);
    expect(s.combo).toBe(0);
    expect(s.score).toBe(before);
    expect(s.lastResolution?.score.total).toBe(0);
  });

  it('recuperar vida preserva o combo de pontuação (só zera o contador de recuperação)', () => {
    let s = start();
    s = wrong(s, 0); // 2 vidas
    s = correct(s, 0);
    s = correct(s, 0);
    const r = engine.reduce(s, { type: 'submit', roundId: rid(s), guess: answerFor(s), now: 0 });
    expect(r.lastResolution?.lifeGained).toBe(true);
    expect(r.lives.lives).toBe(3);
    expect(r.lives.streak).toBe(0);
    expect(r.combo).toBe(3);
  });
});

describe('sequência relâmpago (alimenta a música)', () => {
  it('conta acertos relâmpago seguidos e zera em resposta lenta, erro ou ajuda', () => {
    let s = start();
    s = correct(s, 0); // resposta instantânea = relâmpago
    s = correct(s, 0);
    expect(s.fastStreak).toBe(2);
    const slow = engine.reduce(s, { type: 'submit', roundId: rid(s), guess: answerFor(s), now: 25_000 });
    expect(slow.lastResolution?.outcome).toBe('correct');
    expect(slow.fastStreak).toBe(0);
    let t = engine.reduce(slow, { type: 'next', roundId: rid(slow), now: 25_001 });
    t = engine.reduce(t, { type: 'submit', roundId: rid(t), guess: answerFor(t), now: 25_001 });
    expect(t.fastStreak).toBe(1);
    const w = wrong(engine.reduce(t, { type: 'next', roundId: rid(t), now: 25_002 }), 25_002);
    expect(w.fastStreak).toBe(0);
  });
});

describe('B) vidas no fluxo real', () => {
  it('3 erros encerram a run; ações depois do fim são ignoradas', () => {
    let s = start();
    s = wrong(s);
    s = wrong(s);
    expect(s.lives.lives).toBe(1);
    expect(s.phase).toBe('playing');
    s = wrong(s);
    expect(s.phase).toBe('gameover');
    expect(s.lives.lives).toBe(0);
    const after = engine.reduce(s, { type: 'submit', roundId: rid(s), guess: answerFor(s), now: 1 });
    expect(after).toBe(s);
    expect(engine.reduce(s, { type: 'next', roundId: rid(s), now: 1 })).toBe(s);
  });

  it('o contador de recuperação é visível e pausado com vidas cheias', () => {
    let s = start();
    expect(recoveryView(s, GAME_CONFIG)).toEqual({ required: 3, progress: 0, paused: true });
    s = wrong(s, 0);
    s = correct(s, 0);
    expect(recoveryView(s, GAME_CONFIG)).toEqual({ required: 3, progress: 1, paused: false });
  });

  it('após recuperar a 1ª vida, a próxima exige 5', () => {
    let s = start();
    s = wrong(s, 0);
    for (let i = 0; i < 3; i++) s = correct(s, 0);
    s = wrong(s, 0);
    expect(recoveryView(s, GAME_CONFIG)).toEqual({ required: 5, progress: 0, paused: false });
  });
});

describe('C) timer, race conditions e duplo clique', () => {
  it('primeiras 5 rodadas têm 40 s; a partir da 6ª, 30 s', () => {
    let s = start();
    const durations: number[] = [];
    for (let i = 0; i < 7; i++) {
      durations.push(s.round!.timer.durationMs);
      s = correct(s, 0);
    }
    expect(durations).toEqual([40_000, 40_000, 40_000, 40_000, 40_000, 30_000, 30_000]);
  });

  it('duplo submit da mesma rodada conta uma vez só', () => {
    const s = start();
    const once = engine.reduce(s, { type: 'submit', roundId: rid(s), guess: answerFor(s), now: 100 });
    const twice = engine.reduce(once, { type: 'submit', roundId: rid(s), guess: answerFor(s), now: 101 });
    expect(twice).toBe(once);
    expect(once.stats.correct).toBe(1);
  });

  it('erro + timeout da mesma rodada custam 1 vida, nunca 2', () => {
    const s = start();
    const w = engine.reduce(s, { type: 'submit', roundId: rid(s), guess: 'errado demais', now: 39_999 });
    const t = engine.reduce(w, { type: 'timeout', roundId: rid(s), now: 40_000 });
    expect(t).toBe(w);
    expect(t.lives.lives).toBe(2);
  });

  it('timeout duplicado custa 1 vida', () => {
    const s = start();
    const t1 = engine.reduce(s, { type: 'timeout', roundId: rid(s), now: 40_000 });
    const t2 = engine.reduce(t1, { type: 'timeout', roundId: rid(s), now: 40_050 });
    expect(t2).toBe(t1);
    expect(t1.lives.lives).toBe(2);
    expect(t1.lastResolution?.outcome).toBe('timeout');
  });

  it('timeout prematuro (antes do prazo) é ignorado', () => {
    const s = start();
    expect(engine.reduce(s, { type: 'timeout', roundId: rid(s), now: 39_000 })).toBe(s);
  });

  it('resposta certa depois do prazo vira timeout (não é aceita)', () => {
    const s = start();
    const r = engine.reduce(s, { type: 'submit', roundId: rid(s), guess: answerFor(s), now: 40_001 });
    expect(r.lastResolution?.outcome).toBe('timeout');
    expect(r.lives.lives).toBe(2);
  });

  it('timeout de uma rodada antiga não afeta a rodada atual', () => {
    const s0 = start();
    const s1 = correct(s0, 100);
    expect(engine.reduce(s1, { type: 'timeout', roundId: rid(s0), now: 999_999 })).toBe(s1);
  });

  it('duplo clique em "próximo" avança só uma rodada', () => {
    const s = start();
    const resolved = engine.reduce(s, { type: 'submit', roundId: rid(s), guess: answerFor(s), now: 10 });
    const n1 = engine.reduce(resolved, { type: 'next', roundId: rid(resolved), now: 11 });
    const n2 = engine.reduce(n1, { type: 'next', roundId: rid(resolved), now: 12 });
    expect(n2).toBe(n1);
    expect(n1.round!.number).toBe(2);
  });

  it('sair da aba pausa o tempo: nenhum timeout acontece enquanto escondido', () => {
    const s = start();
    const hidden = engine.reduce(s, { type: 'hide', now: 5_000 });
    expect(hidden.phase).toBe('paused');
    expect(roundRemainingMs(hidden, 900_000)).toBe(35_000);
    expect(engine.reduce(hidden, { type: 'timeout', roundId: rid(s), now: 900_000 })).toBe(hidden);
    expect(engine.reduce(hidden, { type: 'submit', roundId: rid(s), guess: answerFor(s), now: 900_000 })).toBe(hidden);
  });

  it('ao voltar, a rodada é anulada: novo ícone, tempo cheio, sem perder vida; combo e recuperação zeram', () => {
    let s = start();
    s = wrong(s, 0);
    s = correct(s, 0);
    s = correct(s, 0);
    expect(s.combo).toBe(2);
    expect(s.lives.streak).toBe(2);
    const shownId = s.round!.identityId;
    const number = s.round!.number;
    const hidden = engine.reduce(s, { type: 'hide', now: 1_000 });
    const back = engine.reduce(hidden, { type: 'resume', now: 600_000 });
    expect(back.phase).toBe('playing');
    expect(back.round!.identityId).not.toBe(shownId);
    expect(back.round!.number).toBe(number);
    expect(roundRemainingMs(back, 600_000)).toBe(back.round!.timer.durationMs);
    expect(back.lives.lives).toBe(2);
    expect(back.combo).toBe(0);
    expect(back.lives.streak).toBe(0);
    expect(back.stats.annulled).toBe(1);
  });

  it('esconder durante o feedback não pausa nem anula nada', () => {
    const s = start();
    const r = engine.reduce(s, { type: 'submit', roundId: rid(s), guess: answerFor(s), now: 10 });
    expect(engine.reduce(r, { type: 'hide', now: 11 })).toBe(r);
    expect(engine.reduce(r, { type: 'resume', now: 12 })).toBe(r);
  });

  it('falha de imagem troca o ícone sem custo e não o reutiliza na run', () => {
    const s = start();
    const failedId = s.round!.identityId;
    const r = engine.reduce(s, { type: 'imageFailed', roundId: rid(s), now: 50 });
    expect(r.round!.identityId).not.toBe(failedId);
    expect(r.lives).toEqual(s.lives);
    expect(r.combo).toBe(s.combo);
    expect(r.failed).toContain(failedId);
    expect(r.round!.number).toBe(1);
  });

  it('a identidade pré-selecionada (pré-carregada) é a da próxima rodada', () => {
    let s = start();
    for (let i = 0; i < 10; i++) {
      const upcoming = s.upcoming!.id;
      expect(upcoming).not.toBe(s.round!.identityId);
      s = correct(s, 0);
      expect(s.round!.identityId).toBe(upcoming);
    }
  });

  it('com timerStartsOnImage, o tempo só corre depois que a imagem aparece', () => {
    const gated = createEngine({ catalog: CHARACTERS, isImageReady: () => true, config: GAME_CONFIG, timerStartsOnImage: true });
    const s = gated.start('competitive', 3, 0);
    expect(roundRemainingMs(s, 60_000)).toBe(40_000); // imagem ainda carregando: nada de timeout
    expect(gated.reduce(s, { type: 'timeout', roundId: s.round!.id, now: 60_000 })).toBe(s);
    const shown = gated.reduce(s, { type: 'imageShown', roundId: s.round!.id, now: 60_000 });
    expect(roundRemainingMs(shown, 70_000)).toBe(30_000);
    expect(gated.reduce(shown, { type: 'imageShown', roundId: s.round!.id, now: 75_000 })).toBe(shown); // idempotente
  });

  it('sem imagem (preview), o tempo começa na hora mesmo com timerStartsOnImage', () => {
    const gated = createEngine({ catalog: CHARACTERS, isImageReady: () => false, config: GAME_CONFIG, timerStartsOnImage: true });
    const s = gated.start('preview', 3, 0);
    expect(roundRemainingMs(s, 10_000)).toBe(30_000);
  });

  it('palpite vazio não consome a rodada', () => {
    const s = start();
    expect(engine.reduce(s, { type: 'submit', roundId: rid(s), guess: '   ', now: 1 })).toBe(s);
  });
});

describe('E) pulos e ajudas sem exploits', () => {
  it('pular: mantém vidas, 0 pontos, combo congelado, recuperação zerada', () => {
    let s = start();
    s = wrong(s, 0);
    s = correct(s, 0);
    s = correct(s, 0);
    const before = s;
    const r = engine.reduce(s, { type: 'skip', roundId: rid(s), now: 10 });
    expect(r.lastResolution?.outcome).toBe('skipped');
    expect(r.lastResolution?.score.total).toBe(0);
    expect(r.score).toBe(before.score);
    expect(r.lives.lives).toBe(before.lives.lives);
    expect(r.combo).toBe(before.combo);
    expect(r.lives.streak).toBe(0);
    expect(r.skipsLeft).toBe(GAME_CONFIG.aids.skips - 1);
  });

  it('pulos acabam: com 0 restantes, pular é ignorado', () => {
    let s = start();
    for (let i = 0; i < GAME_CONFIG.aids.skips; i++) s = skip(s, 0);
    expect(s.skipsLeft).toBe(0);
    expect(engine.reduce(s, { type: 'skip', roundId: rid(s), now: 1 })).toBe(s);
  });

  it('intercalar pulos não deixa recuperar vida (sequência precisa ser consecutiva sem ajuda)', () => {
    let s = start();
    s = wrong(s, 0);
    s = correct(s, 0);
    s = correct(s, 0);
    s = skip(s, 0);
    s = correct(s, 0);
    expect(s.lives.lives).toBe(2);
    expect(s.lives.streak).toBe(1);
  });

  it('ajuda: mostra 3 alternativas únicas do mesmo tipo, incluindo a correta', () => {
    const s = start();
    const r = engine.reduce(s, { type: 'useHint', roundId: rid(s), now: 10 });
    const opts = r.round!.options!;
    expect(opts).toHaveLength(3);
    expect(new Set(opts).size).toBe(3);
    expect(opts).toContain(s.round!.identityId);
    const kind = engine.identity(s.round!.identityId)!.kind;
    for (const id of opts) expect(engine.identity(id)!.kind).toBe(kind);
    expect(r.hintsLeft).toBe(GAME_CONFIG.aids.optionHints - 1);
  });

  it('ajuda zera a recuperação na hora; acerto pela ajuda dá poucos pontos e não sobe combo', () => {
    let s = start();
    s = wrong(s, 0);
    s = correct(s, 0);
    s = correct(s, 0);
    const comboBefore = s.combo;
    const h = engine.reduce(s, { type: 'useHint', roundId: rid(s), now: 10 });
    expect(h.lives.streak).toBe(0);
    const r = engine.reduce(h, { type: 'pickOption', roundId: rid(h), optionId: h.round!.identityId, now: 20 });
    expect(r.lastResolution?.outcome).toBe('correct-hint');
    expect(r.lastResolution?.score.total).toBe(GAME_CONFIG.scoring.optionHintPoints);
    expect(r.combo).toBe(comboBefore);
    expect(r.lives.lives).toBe(2);
  });

  it('alternativa errada custa 1 vida e zera o combo', () => {
    let s = start();
    s = correct(s, 0);
    const h = engine.reduce(s, { type: 'useHint', roundId: rid(s), now: 10 });
    const wrongId = h.round!.options!.find((id) => id !== h.round!.identityId)!;
    const r = engine.reduce(h, { type: 'pickOption', roundId: rid(h), optionId: wrongId, now: 20 });
    expect(r.lastResolution?.outcome).toBe('wrong');
    expect(r.lives.lives).toBe(2);
    expect(r.combo).toBe(0);
  });

  it('com alternativas abertas, digitar não responde; segunda ajuda na mesma rodada é ignorada', () => {
    const s = start();
    const h = engine.reduce(s, { type: 'useHint', roundId: rid(s), now: 10 });
    expect(engine.reduce(h, { type: 'submit', roundId: rid(h), guess: answerFor(h), now: 11 })).toBe(h);
    expect(engine.reduce(h, { type: 'useHint', roundId: rid(h), now: 12 })).toBe(h);
    expect(engine.reduce(h, { type: 'pickOption', roundId: rid(h), optionId: 'id-que-nao-esta-nas-opcoes', now: 13 })).toBe(h);
  });

  it('o timer NÃO pausa durante a ajuda; estourar o prazo com alternativas abertas custa 1 vida', () => {
    const s = start();
    const h = engine.reduce(s, { type: 'useHint', roundId: rid(s), now: 10_000 });
    expect(roundRemainingMs(h, 30_000)).toBe(10_000);
    const late = engine.reduce(h, { type: 'pickOption', roundId: rid(h), optionId: h.round!.identityId, now: 40_000 });
    expect(late.lastResolution?.outcome).toBe('timeout');
    expect(late.lives.lives).toBe(2);
  });

  it('ajudas não recuperam vidas, mesmo usadas em sequência', () => {
    let s = start();
    s = wrong(s, 0);
    for (let i = 0; i < GAME_CONFIG.aids.optionHints; i++) {
      const h = engine.reduce(s, { type: 'useHint', roundId: rid(s), now: 0 });
      const r = engine.reduce(h, { type: 'pickOption', roundId: rid(h), optionId: h.round!.identityId, now: 0 });
      s = engine.reduce(r, { type: 'next', roundId: rid(r), now: 0 });
    }
    expect(s.lives.lives).toBe(2);
    expect(s.lives.streak).toBe(0);
    expect(s.hintsLeft).toBe(0);
  });

  it('a posição da alternativa correta varia (não revela a resposta pela ordem)', () => {
    const positions = new Set<number>();
    for (let seed = 1; seed <= 40; seed++) {
      const s = engine.start('competitive', seed, 0);
      const h = engine.reduce(s, { type: 'useHint', roundId: rid(s), now: 0 });
      positions.add(h.round!.options!.indexOf(h.round!.identityId));
    }
    expect(positions).toEqual(new Set([0, 1, 2]));
  });

  it('nada da resposta é resolvido antes do fim da rodada', () => {
    const s = start();
    expect(s.lastResolution).toBeNull();
    const h = engine.reduce(s, { type: 'useHint', roundId: rid(s), now: 0 });
    expect(h.lastResolution).toBeNull();
  });
});
