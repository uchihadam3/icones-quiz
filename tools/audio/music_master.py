"""
Masterização da trilha dinâmica de ÍCONES — Maratona.

Entrada: variações do tema (mesmo trecho de 32 compassos + 1 de sobra, geradas com ACE-Step 1.5 a partir
do mesmo áudio-fonte, então compartilham tempo e tonalidade).
Saída (tools/audio/.cache/music-wav): um WAV por camada no formato [cauda 2 s][loop 64 s][cabeça 2 s],
duas vinhetas derivadas do tema e music.json com tempo/tonalidade/pontos de loop.

Etapas por camada:
 1. Alinhamento: correlação do envelope de ataques com a fonte; corrige deslocamentos até ±120 ms.
 2. Loop: os últimos 2 s (que continuam a música) entram em crossfade equal-power sobre os 2 primeiros,
    então o fim emenda no começo sem corte.
 3. Loudness: todas as camadas no MESMO volume integrado (-18 LUFS) e true-peak ≤ -1,5 dBTP —
    a progressão musical vem do arranjo, nunca de ficar mais alto.

Uso: python tools/audio/music_master.py <dir_variacoes>
  (espera menu.wav, groove.wav, build.wav, hype.wav, epic.wav, todos com 66 s)
"""
import json, os, subprocess, sys, wave
import numpy as np
from scipy import signal

SR = 48000
BPM = 120.0
BAR = 4 * 60 / BPM
LOOP_BARS = 32
LENGTH = LOOP_BARS * BAR  # 64 s
X = BAR  # sobreposição para fechar o loop
LEAD = 2.0  # cauda/cabeça de segurança (absorve atraso de decodificador, ver engine.ts)
TARGET_LUFS = -18.0
TRUE_PEAK = -1.5

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'tools/audio/.cache/music-wav')
SFX = os.path.join(ROOT, 'tools/audio/.cache/sfx-wav')
LAYERS = ['menu', 'groove', 'build', 'hype', 'epic']


def read(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)


def write(path, x):
    pcm = (np.clip(x, -1, 1) * 32767).astype('<i2')
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def onset_env(x, hop=480):
    mono = x.mean(axis=1)
    f, t, Z = signal.stft(mono, SR, nperseg=2048, noverlap=2048 - hop)
    mag = np.log1p(np.abs(Z) * 100)
    flux = np.maximum(0, np.diff(mag, axis=1)).sum(axis=0)
    return (flux - flux.mean()) / (flux.std() + 1e-9), SR / hop


def align(ref, x, max_ms=120):
    a, fps = onset_env(ref)
    b, _ = onset_env(x)
    n = min(len(a), len(b))
    lags = range(-int(max_ms / 1000 * fps), int(max_ms / 1000 * fps) + 1)
    scores = [np.dot(a[max(0, -l):n - max(0, l)], b[max(0, l):n - max(0, -l)]) for l in lags]
    best = list(lags)[int(np.argmax(scores))]
    shift = int(round(best / fps * SR))
    corr = float(np.max(scores) / (np.sqrt(np.dot(a[:n], a[:n]) * np.dot(b[:n], b[:n])) + 1e-9))
    if shift > 0:
        x = x[shift:]
    elif shift < 0:
        x = np.vstack([np.zeros((-shift, 2)), x])
    return x, shift / SR * 1000, corr


def loopify(x):
    L, n = int(LENGTH * SR), int(X * SR)
    if len(x) < L + n:
        x = np.vstack([x, np.zeros((L + n - len(x), 2))])
    out = x[:L].copy()
    t = np.linspace(0, np.pi / 2, n)[:, None]
    out[:n] = x[L:L + n] * np.cos(t) + x[:n] * np.sin(t)
    return out


def loudnorm(src, dst):
    """Two-pass EBU R128 (ffmpeg loudnorm) em modo linear: mesmo volume integrado em todas as camadas."""
    first = subprocess.run(['ffmpeg', '-hide_banner', '-i', src, '-af', f'loudnorm=I={TARGET_LUFS}:TP={TRUE_PEAK}:LRA=11:print_format=json', '-f', 'null', '-'],
                           capture_output=True, text=True).stderr
    m = json.loads(first[first.rindex('{'):first.rindex('}') + 1])
    af = (f"loudnorm=I={TARGET_LUFS}:TP={TRUE_PEAK}:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
          f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-af', af, '-ar', str(SR), '-c:a', 'pcm_s16le', dst], check=True)
    return float(m['input_i'])


def measure(path):
    out = subprocess.run(['ffmpeg', '-hide_banner', '-i', path, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    tail = out[out.rindex('Summary'):]
    lufs = float(tail.split('I:')[1].split('LUFS')[0])
    peak = float(tail.split('Peak:')[1].split('dBFS')[0])
    return lufs, peak


def best_window(x, bars=2):
    """Janela de `bars` compassos (começando em tempo forte) com mais energia."""
    w, step = int(bars * BAR * SR), int(BAR * SR)
    starts = range(0, len(x) - w, step)
    energy = [float(np.mean(x[s:s + w] ** 2)) for s in starts]
    s = list(starts)[int(np.argmax(energy))]
    return s


def fade(x, fin=0.004, fout=0.6):
    x = x.copy()
    ni, no = int(fin * SR), int(fout * SR)
    x[:ni] *= np.linspace(0, 1, ni)[:, None]
    x[-no:] *= (np.cos(np.linspace(0, np.pi / 2, no)) ** 2)[:, None]
    return x


def tape_stop(x, start_sec):
    """Desaceleração tipo "fita parando" a partir de start_sec (velocidade cai de 1 a 0,25)."""
    s = int(start_sec * SR)
    head, tail = x[:s], x[s:]
    n_out = len(tail) * 2
    speed = np.linspace(1.0, 0.25, n_out)
    pos = np.cumsum(speed)
    pos = pos[pos < len(tail) - 1]
    i = pos.astype(int)
    frac = (pos - i)[:, None]
    slowed = tail[i] * (1 - frac) + tail[i + 1] * frac
    return np.vstack([head, slowed])


def reverb_tail(x, seconds=1.8, wet=0.3):
    rng = np.random.default_rng(7)
    n = int(seconds * SR)
    ir = rng.standard_normal((n, 2)) * np.exp(-np.arange(n) / SR * (6.9 / seconds))[:, None]
    b, a = signal.butter(1, 6000 / (SR / 2), 'low')
    ir = signal.lfilter(b, a, ir, axis=0)
    ir /= np.sqrt((ir ** 2).sum(axis=0))
    wetsig = np.stack([signal.fftconvolve(x[:, c], ir[:, c]) for c in range(2)], axis=1)
    dry = np.vstack([x, np.zeros((len(wetsig) - len(x), 2))])
    return dry * (1 - wet * 0.4) + wetsig * wet


def main():
    src_dir = sys.argv[1]
    os.makedirs(OUT, exist_ok=True)
    ref = read(os.path.join(src_dir, 'hype.wav'))
    report = {}
    looped = {}
    for layer in LAYERS:
        x = read(os.path.join(src_dir, f'{layer}.wav'))
        shift_ms, corr = 0.0, 1.0
        if layer != 'hype':
            x, shift_ms, corr = align(ref, x)
        lp = loopify(x)
        looped[layer] = lp
        padded = np.vstack([lp[-int(LEAD * SR):], lp, lp[:int(LEAD * SR)]])
        raw_path = os.path.join(OUT, f'{layer}.raw.wav')
        write(raw_path, padded / max(1.0, np.max(np.abs(padded))))
        before = loudnorm(raw_path, os.path.join(OUT, f'{layer}.wav'))
        os.remove(raw_path)
        lufs, peak = measure(os.path.join(OUT, f'{layer}.wav'))
        report[layer] = {'alinhamento_ms': round(shift_ms, 1), 'correlacao_ataques': round(corr, 3), 'lufs_antes': before,
                         'lufs': lufs, 'pico_dbfs': peak, 'duracao': round(len(padded) / SR, 3)}
        print(layer, report[layer])

    # Continuidade do loop: diferença amostra-a-amostra no ponto de emenda vs. típica.
    for layer, lp in looped.items():
        seam = np.abs(lp[0] - lp[-1]).max()
        typical = np.percentile(np.abs(np.diff(lp, axis=0)).max(axis=1), 99.9)
        report[layer]['emenda'] = {'salto': round(float(seam), 4), 'p99.9_vizinhos': round(float(typical), 4)}

    # Vinhetas derivadas do tema (mesma tonalidade/timbre).
    epic = looped['epic']
    s = best_window(epic, 2)
    rec = epic[s:s + int(2.5 * BAR * SR)]
    rec = reverb_tail(fade(rec, fout=1.2), 2.2, 0.32)
    if os.path.exists(os.path.join(SFX, 'record-sparkle.wav')):
        sp = read(os.path.join(SFX, 'record-sparkle.wav')) * 0.5
        rec[:len(sp)] += sp
    write(os.path.join(OUT, 'stinger-record.raw.wav'), rec / np.max(np.abs(rec)) * 0.89)
    loudnorm(os.path.join(OUT, 'stinger-record.raw.wav'), os.path.join(OUT, 'stinger-record.wav'))

    menu = looped['menu']
    s = best_window(menu, 2)
    go = tape_stop(menu[s:s + int(2 * BAR * SR)], BAR)
    go = signal.lfilter(*signal.butter(2, 3500 / (SR / 2), 'low'), go, axis=0)
    go = reverb_tail(fade(go, fout=0.8), 1.8, 0.25)
    if os.path.exists(os.path.join(SFX, 'game-over-sfx.wav')):
        bells = read(os.path.join(SFX, 'game-over-sfx.wav')) * 0.45
        start = int(BAR * SR)
        end = min(len(go), start + len(bells))
        go[start:end] += bells[: end - start]
    write(os.path.join(OUT, 'stinger-game-over.raw.wav'), go / np.max(np.abs(go)) * 0.89)
    loudnorm(os.path.join(OUT, 'stinger-game-over.raw.wav'), os.path.join(OUT, 'stinger-game-over.wav'))
    for f in ('stinger-record.raw.wav', 'stinger-game-over.raw.wav'):
        os.remove(os.path.join(OUT, f))

    meta = {
        'bpm': BPM,
        'keyscale': 'A minor',
        'loop': {'lead': LEAD, 'length': LENGTH},
        'layers': {layer: {'wav': f'{layer}.wav', 'duration': report[layer]['duracao']} for layer in LAYERS},
        'stingers': ['stinger-record', 'stinger-game-over'],
        'auditoria': report,
    }
    json.dump(meta, open(os.path.join(OUT, 'music.json'), 'w'), indent=2, ensure_ascii=False)
    print(json.dumps({k: v.get('emenda') for k, v in report.items()}, indent=1))


if __name__ == '__main__':
    main()
