"""
Design dos efeitos sonoros de ÍCONES — Maratona.

Cada efeito é montado em camadas: transiente gravado (Kenney, CC0) + corpo tonal afinado na tonalidade
da trilha (Lá menor) + brilho/cauda (reverb por convolução). Saída: WAV 48 kHz estéreo, -1 dBFS de pico.
Uso: python design.py <dir_saida>
"""
import os, subprocess, sys, json
import numpy as np
from scipy import signal

SR = 48000
SRC = os.environ.get('KENNEY_DIR', 'tools/audio/.cache/kenney')
OUT = sys.argv[1] if len(sys.argv) > 1 else 'tools/audio/.cache/sfx-wav'
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(20261019)

# ── utilidades ────────────────────────────────────────────────────────────

def load(rel, gain_db=0.0, semitones=0.0):
    path = os.path.join(SRC, rel)
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)
    if semitones:
        ratio = 2 ** (semitones / 12)
        n = int(len(x) / ratio)
        x = signal.resample(x, n, axis=0)
    peak = np.max(np.abs(x)) or 1
    return x / peak * 10 ** (gain_db / 20)

def silence(sec):
    return np.zeros((int(sec * SR), 2))

def edge_fade(x, fade_in=0.002, fade_out=0.025):
    """Micro-fades em toda camada: nenhuma borda abrupta (fonte de cliques)."""
    x = np.array(x, dtype=np.float64, copy=True)
    ni, no = min(len(x), int(fade_in * SR)), min(len(x), int(fade_out * SR))
    if ni:
        x[:ni] *= np.linspace(0, 1, ni)[:, None]
    if no:
        x[-no:] *= (np.cos(np.linspace(0, np.pi / 2, no)) ** 2)[:, None]
    return x

def place(dst, src, at_sec):
    src = edge_fade(src)
    i = int(at_sec * SR)
    end = i + len(src)
    if end > len(dst):
        dst = np.vstack([dst, np.zeros((end - len(dst), 2))])
    dst[i:end] += src
    return dst

def mix(parts, length=None):
    """parts: lista de (array, at_sec)."""
    out = silence(length or 0.01)
    for arr, at in parts:
        out = place(out, arr, at)
    return out

def env_adsr(n, a=0.005, d=0.1, s=0.6, r=0.3, total=None):
    total = total or n / SR
    t = np.arange(n) / SR
    e = np.ones(n)
    e = np.where(t < a, t / max(a, 1e-6), e)
    dmask = (t >= a) & (t < a + d)
    e[dmask] = 1 - (1 - s) * (t[dmask] - a) / d
    smask = (t >= a + d) & (t < total - r)
    e[smask] = s
    rmask = t >= total - r
    e[rmask] = s * np.clip((total - t[rmask]) / r, 0, 1)
    return e

def note_hz(name):
    names = {'C': -9, 'C#': -8, 'D': -7, 'D#': -6, 'E': -5, 'F': -4, 'F#': -3, 'G': -2, 'G#': -1, 'A': 0, 'A#': 1, 'B': 2}
    pitch, octave = name[:-1], int(name[-1])
    return 440 * 2 ** ((names[pitch] + (octave - 4) * 12) / 12)

def bell(freq, dur=1.2, bright=1.0, detune=3.0, gain_db=-6):
    """Sino/celesta por FM (carrier:mod = 1:3.5) com decaimento exponencial e leve estéreo."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    chans = []
    for side in (-1, 1):
        f = freq * 2 ** (side * detune / 1200)
        idx = bright * 2.2 * np.exp(-t * 6)
        mod = np.sin(2 * np.pi * f * 3.5 * t) * idx
        body = np.sin(2 * np.pi * f * t + mod) * np.exp(-t * (2.2 + freq / 900))
        partial = 0.25 * np.sin(2 * np.pi * f * 2.01 * t) * np.exp(-t * 6)
        click = 0.15 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 60)
        attack = np.clip(t / 0.002, 0, 1)
        chans.append((body + partial + click) * attack)
    x = np.stack(chans, axis=1)
    return x / np.max(np.abs(x)) * 10 ** (gain_db / 20)

def pad_chord(freqs, dur=1.5, gain_db=-12, attack=0.25, cutoff=2400):
    """Acorde de "pad" (serrote filtrado, detune em uníssono) para camadas de tensão/resolução."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.zeros((n, 2))
    for f in freqs:
        for k, det in enumerate((-7, 0, 7)):
            ff = f * 2 ** (det / 1200)
            saw = signal.sawtooth(2 * np.pi * ff * t + rng.uniform(0, 6.28))
            pan = (k - 1) * 0.6
            x[:, 0] += saw * (1 - pan) / 2
            x[:, 1] += saw * (1 + pan) / 2
    b, a = signal.butter(2, cutoff / (SR / 2), 'low')
    x = signal.lfilter(b, a, x, axis=0)
    e = env_adsr(n, a=attack, d=0.2, s=0.8, r=min(0.6, dur / 2))
    x *= e[:, None]
    return x / np.max(np.abs(x)) * 10 ** (gain_db / 20)

def sub_drop(f0=80, f1=40, dur=0.6, gain_db=-8):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = f0 * (f1 / f0) ** (t / dur)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.exp(-t * 5) * np.clip(t / 0.004, 0, 1)
    return np.stack([x, x], axis=1) * 10 ** (gain_db / 20)

def noise_sweep(dur=0.8, up=True, gain_db=-14):
    """Riser/whoosh: ruído filtrado com corte em varredura."""
    n = int(dur * SR)
    noise = rng.standard_normal((n, 2))
    out = np.zeros_like(noise)
    block = 512
    for i in range(0, n, block):
        frac = i / n
        fc = (300 + 9000 * frac ** 2) if up else (9000 - 8700 * frac ** 0.5)
        b, a = signal.butter(2, [max(80, fc * 0.6) / (SR / 2), min(0.99, fc * 1.4 / (SR / 2))], 'band')
        out[i:i + block] = signal.lfilter(b, a, noise[i:i + block], axis=0)
    e = np.sin(np.linspace(0, np.pi, n)) ** (1.5 if up else 0.8)
    if up:
        e = np.linspace(0, 1, n) ** 2
    out *= e[:, None]
    return out / np.max(np.abs(out)) * 10 ** (gain_db / 20)

def reverb(x, seconds=1.2, wet=0.25, predelay=0.012, bright=0.6):
    """Convolução com resposta impulsiva sintética (ruído com decaimento, estéreo descorrelacionado)."""
    n = int(seconds * SR)
    t = np.arange(n) / SR
    ir = rng.standard_normal((n, 2)) * np.exp(-t * (6.9 / seconds))[:, None]
    b, a = signal.butter(1, (2000 + 8000 * bright) / (SR / 2), 'low')
    ir = signal.lfilter(b, a, ir, axis=0)
    ir = np.vstack([np.zeros((int(predelay * SR), 2)), ir])
    ir /= np.sqrt((ir ** 2).sum(axis=0))
    tail = np.stack([signal.fftconvolve(x[:, c], ir[:, c]) for c in range(2)], axis=1)
    dry = np.vstack([x, np.zeros((len(tail) - len(x), 2))])
    return dry * (1 - wet * 0.5) + tail * wet

def highpass(x, hz):
    b, a = signal.butter(2, hz / (SR / 2), 'high')
    return signal.lfilter(b, a, x, axis=0)

def lowpass(x, hz):
    b, a = signal.butter(2, hz / (SR / 2), 'low')
    return signal.lfilter(b, a, x, axis=0)

def finish(name, x, peak_db=-1.0, fade_out=0.03, lufs_target=None):
    # Corta silêncio final, fade curto (sem clique), normaliza pico.
    mag = np.max(np.abs(x), axis=1)
    idx = np.where(mag > 10 ** (-70 / 20))[0]
    if len(idx):
        x = x[: idx[-1] + 1]
    nf = min(len(x), int(fade_out * SR))
    x[-nf:] *= np.linspace(1, 0, nf)[:, None]
    ni = min(len(x), int(0.0015 * SR))
    x[:ni] *= np.linspace(0, 1, ni)[:, None]
    x = x / (np.max(np.abs(x)) or 1) * 10 ** (peak_db / 20)
    pcm = (np.clip(x, -1, 1) * 32767).astype('<i2')
    path = os.path.join(OUT, name + '.wav')
    import wave
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    return path, len(x) / SR

IF = 'interface-sounds/Audio/'
DG = 'digital-audio/Audio/'
IM = 'impact-sounds/Audio/'
CA = 'casino-audio/Audio/'
SF = 'sci-fi-sounds/Audio/'
JG = 'music-jingles/Audio/Hit jingles/'

N = note_hz
sheet = {}

def make(name, x, **kw):
    path, dur = finish(name, x, **kw)
    sheet[name] = round(dur, 3)

# ── Interface ─────────────────────────────────────────────────────────────
make('ui-tap-1', mix([(load(IF + 'click_005.ogg', -3), 0), (lowpass(load(IF + 'click_002.ogg', -10), 3000), 0.002)]), peak_db=-6)
make('ui-tap-2', mix([(load(IF + 'click_003.ogg', -3), 0), (lowpass(load(IF + 'click_002.ogg', -12), 3000), 0.002)]), peak_db=-6)
make('ui-confirm', reverb(mix([(load(IF + 'confirmation_004.ogg', -4), 0), (bell(N('C6'), 0.6, 0.7, gain_db=-12), 0.0), (bell(N('E6'), 0.6, 0.7, gain_db=-14), 0.06)]), 0.8, 0.2), peak_db=-3)
make('pause', reverb(mix([(load(IF + 'switch_002.ogg', -6), 0), (bell(N('E5'), 0.5, 0.4, gain_db=-14), 0), (bell(N('A4'), 0.6, 0.4, gain_db=-14), 0.08)]), 0.9, 0.2), peak_db=-5)
make('resume', reverb(mix([(load(IF + 'switch_003.ogg', -6), 0), (bell(N('A4'), 0.5, 0.4, gain_db=-14), 0), (bell(N('E5'), 0.6, 0.5, gain_db=-13), 0.08)]), 0.9, 0.2), peak_db=-5)
make('install', reverb(mix([(load(IF + 'confirmation_002.ogg', -4), 0), (bell(N('A5'), 0.8, gain_db=-10), 0), (bell(N('C6'), 0.8, gain_db=-12), 0.07), (bell(N('E6'), 1.0, gain_db=-12), 0.14)]), 1.2, 0.25), peak_db=-3)

# ── Rodada ────────────────────────────────────────────────────────────────
make('round-start', mix([(highpass(noise_sweep(0.35, True, -20), 400), 0), (load(IF + 'maximize_002.ogg', -14), 0.12)]), peak_db=-10)
make('game-start', reverb(mix([
    (noise_sweep(0.9, True, -12), 0),
    (load(IM + 'impactPunch_heavy_002.ogg', -6), 0.85),
    (sub_drop(70, 38, 0.7, -6), 0.85),
    (bell(N('A4'), 1.4, gain_db=-10), 0.85), (bell(N('C5'), 1.4, gain_db=-11), 0.85), (bell(N('E5'), 1.4, gain_db=-11), 0.85),
    (bell(N('A5'), 1.4, gain_db=-13), 0.92),
    (load(IF + 'glass_004.ogg', -14), 0.9),
]), 1.6, 0.28), peak_db=-1.5)

# Acerto: 3 variantes de arpejo ascendente (nunca a mesma nota de chegada duas vezes seguidas no jogo).
correct_shapes = [('E5', 'A5'), ('C5', 'E5', 'A5'), ('A5', 'C6')]
for i, shape in enumerate(correct_shapes, 1):
    parts = [(load(IF + 'confirmation_002.ogg', -12), 0), (load(IF + 'glass_003.ogg', -10), 0)]
    for k, nn in enumerate(shape):
        parts.append((bell(N(nn), 0.9, 1.0, gain_db=-8 - k * 0.5), k * 0.055))
    make(f'correct-{i}', reverb(mix(parts), 1.0, 0.22, bright=0.8), peak_db=-3)

make('correct-fast', reverb(mix([
    (load(IF + 'glass_004.ogg', -6), 0.04),
    (load(DG + 'powerUp7.ogg', -14), 0),
    (bell(N('A5'), 1.0, 1.2, gain_db=-7), 0), (bell(N('C6'), 1.0, 1.2, gain_db=-8), 0.045), (bell(N('E6'), 1.1, 1.2, gain_db=-8), 0.09), (bell(N('A6'), 1.2, 1.3, gain_db=-10), 0.135),
    (load(CA + 'chips-collide-3.ogg', -16), 0.12),
]), 1.3, 0.25, bright=0.9), peak_db=-2)
make('correct-hint', reverb(mix([(load(IF + 'confirmation_001.ogg', -10), 0), (bell(N('E5'), 0.7, 0.6, gain_db=-12), 0.02)]), 0.8, 0.2), peak_db=-6)

make('wrong', reverb(mix([
    (load(IF + 'error_006.ogg', -4), 0),
    (lowpass(load(IM + 'impactSoft_heavy_001.ogg', -4), 500), 0),
    (pad_chord([N('A2'), N('A#2')], 0.55, -12, attack=0.01, cutoff=900), 0.0),
]), 0.6, 0.12), peak_db=-3)
make('timeout', reverb(mix([
    (load(IM + 'impactBell_heavy_001.ogg', -4), 0),
    (load(IF + 'error_005.ogg', -8), 0.02),
    (lowpass(load(IM + 'impactSoft_heavy_003.ogg', -6), 400), 0),
]), 1.4, 0.18), peak_db=-3)

# Tensão: ticks curtíssimos (agendados nas batidas) e batimento cardíaco "tum-tum".
make('tick', highpass(load(IF + 'tick_004.ogg', -6), 800), peak_db=-14)
make('tick-final', mix([(highpass(load(IF + 'tick_002.ogg', -4), 800), 0), (bell(N('A5'), 0.12, 0.3, gain_db=-22), 0)]), peak_db=-11)
hb = lowpass(load(IM + 'impactSoft_heavy_003.ogg', 0), 180)
make('heartbeat', mix([(hb, 0), (hb * 0.55, 0.19)]), peak_db=-9)

# ── Vidas ─────────────────────────────────────────────────────────────────
make('life-lost', reverb(mix([
    (load(IM + 'impactPunch_heavy_002.ogg', -3), 0),
    (load(IM + 'impactGlass_heavy_001.ogg', -6), 0.01),
    (lowpass(load(SF + 'lowFrequency_explosion_001.ogg', -6), 200)[: int(0.8 * SR)], 0),
    (pad_chord([N('A2'), N('E3'), N('C3')], 0.9, -14, attack=0.02, cutoff=1200), 0.05),
]), 1.1, 0.2), peak_db=-1.5)
make('last-life', reverb(mix([
    (hb, 0), (hb * 0.55, 0.19), (hb * 0.9, 0.8), (hb * 0.5, 0.99),
    (lowpass(load(SF + 'forceField_001.ogg', -8, semitones=-7), 900), 0),
    (pad_chord([N('A2'), N('C3'), N('E3')], 1.6, -12, attack=0.4, cutoff=1400), 0.1),
]), 1.4, 0.2), peak_db=-3)
arp = [('A4', 0), ('C5', 0.07), ('E5', 0.14), ('A5', 0.21), ('C6', 0.28), ('E6', 0.35)]
make('life-recovered', reverb(mix(
    [(load(DG + 'powerUp1.ogg', -12), 0), (noise_sweep(0.45, True, -18), 0)]
    + [(bell(N(nn), 1.2, 1.0, gain_db=-9), t) for nn, t in arp]
    + [(load(IF + 'glass_004.ogg', -8), 0.4), (load(IM + 'impactPunch_heavy_004.ogg', -14), 0.42),
       (pad_chord([N('A3'), N('C4'), N('E4'), N('A4')], 1.4, -16, attack=0.05, cutoff=3000), 0.4)]
), 1.6, 0.28, bright=0.9), peak_db=-1.5)

# ── Combo: x2…x5 em camadas crescentes, subindo de tom ────────────────────
tiers = {
    2: (['A4', 'C5', 'E5'], 0, False),
    3: (['C5', 'E5', 'A5'], 3, False),
    4: (['E5', 'A5', 'C6'], 7, True),
    5: (['A5', 'C6', 'E6', 'A6'], 12, True),
}
for tier, (notes, semis, big) in tiers.items():
    parts = [(load(DG + 'phaserUp3.ogg', -12, semitones=semis * 0.5), 0), (noise_sweep(0.25 + 0.05 * tier, True, -20), 0)]
    parts += [(bell(N(nn), 1.0 + 0.1 * tier, 1.0 + 0.1 * tier, gain_db=-8), 0.05 * k) for k, nn in enumerate(notes)]
    parts.append((pad_chord([N(n) / 2 for n in notes[:3]], 0.8 + 0.15 * tier, -14, attack=0.01, cutoff=2000 + 600 * tier), 0.02))
    if big:
        parts.append((load(IM + 'impactPunch_heavy_004.ogg', -10), 0))
        parts.append((sub_drop(90, 45, 0.5, -10), 0))
    if tier == 5:
        parts.append((load(JG + 'jingles_HIT10.ogg', -8), 0.08))
        parts.append((load(CA + 'chips-collide-1.ogg', -14), 0.2))
        parts.append((load(IF + 'glass_004.ogg', -8), 0.2))
    make(f'tier-up-{tier}', reverb(mix(parts), 1.2 + 0.1 * tier, 0.22 + 0.02 * tier, bright=0.85), peak_db=-2)

make('combo-break', mix([(load(IF + 'scratch_005.ogg', -4), 0), (load(IF + 'drop_004.ogg', -10), 0.05)]), peak_db=-6)

# ── Ajudas ────────────────────────────────────────────────────────────────
make('skip', mix([(load(CA + 'card-slide-2.ogg', -2), 0), (highpass(noise_sweep(0.3, False, -20), 600), 0)]), peak_db=-5)
make('hint', reverb(mix([(load(CA + 'card-fan-1.ogg', -2), 0), (bell(N('E5'), 0.4, 0.5, gain_db=-16), 0.05), (bell(N('A5'), 0.4, 0.5, gain_db=-16), 0.18), (bell(N('C6'), 0.4, 0.5, gain_db=-16), 0.31)]), 0.7, 0.15), peak_db=-5)

# ── Fim ───────────────────────────────────────────────────────────────────
make('game-over-sfx', reverb(mix([
    (load(IM + 'impactBell_heavy_000.ogg', -6), 0),
    (bell(N('E5'), 1.2, 0.6, gain_db=-10), 0.05), (bell(N('C5'), 1.2, 0.6, gain_db=-10), 0.3), (bell(N('A4'), 1.8, 0.6, gain_db=-9), 0.55),
    (pad_chord([N('A2'), N('E3'), N('A3')], 2.2, -14, attack=0.3, cutoff=1100), 0.5),
]), 2.0, 0.3), peak_db=-2)
make('record-sparkle', mix([(load(CA + 'chips-collide-1.ogg', -6), 0), (load(CA + 'chips-collide-3.ogg', -8), 0.12), (load(CA + 'chips-collide-2.ogg', -8), 0.26), (load(IF + 'glass_004.ogg', -10), 0.05)]), peak_db=-4)

json.dump(sheet, open(os.path.join(OUT, 'durations.json'), 'w'), indent=1)
print(json.dumps(sheet, indent=1))
