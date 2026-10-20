"""
Codifica os áudios masterizados (WAV) para a web e gera src/audio/audio-manifest.json.

- Opus em Ogg (.opus) como formato principal; MP3 como fallback (Safari antigo).
- Música: arquivos de loop com [cauda][loop][cabeça] (ver tools/audio/music_master.py).
- Fonte única do mapeamento evento → arquivos/ganho/ducking.

Uso: python tools/audio/build_audio.py
"""
import json, os, subprocess, wave

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CACHE = os.path.join(ROOT, 'tools/audio/.cache')
SFX_WAV = os.path.join(CACHE, 'sfx-wav')
MUSIC_WAV = os.path.join(CACHE, 'music-wav')
PUBLIC = os.path.join(ROOT, 'public/audio')
MANIFEST = os.path.join(ROOT, 'src/audio/audio-manifest.json')
MUSIC_META = os.path.join(MUSIC_WAV, 'music.json')

# evento: (arquivos, ganho, ducking, variação de afinação em cents)
EVENTS = {
    'ui-tap': (['ui-tap-1', 'ui-tap-2'], 0.45, 0, 60),
    'ui-confirm': (['ui-confirm'], 0.75, 0.15, 0),
    'round-start': (['round-start'], 0.45, 0, 0),
    'correct': (['correct-1', 'correct-2', 'correct-3'], 0.85, 0.25, 0),
    'correct-fast': (['correct-fast'], 0.9, 0.3, 0),
    'correct-hint': (['correct-hint'], 0.7, 0.15, 0),
    'wrong': (['wrong'], 0.85, 0.35, 0),
    'timeout': (['timeout'], 0.85, 0.4, 0),
    'tick': (['tick'], 0.55, 0, 0),
    'tick-final': (['tick-final'], 0.65, 0, 0),
    'heartbeat': (['heartbeat'], 0.75, 0, 0),
    'life-lost': (['life-lost'], 0.95, 0.5, 0),
    'last-life': (['last-life'], 0.85, 0.35, 0),
    'life-recovered': (['life-recovered'], 0.95, 0.5, 0),
    'tier-up-2': (['tier-up-2'], 0.8, 0.25, 0),
    'tier-up-3': (['tier-up-3'], 0.85, 0.3, 0),
    'tier-up-4': (['tier-up-4'], 0.9, 0.35, 0),
    'tier-up-5': (['tier-up-5'], 0.95, 0.45, 0),
    'combo-break': (['combo-break'], 0.65, 0.2, 0),
    'skip': (['skip'], 0.75, 0.1, 40),
    'hint': (['hint'], 0.8, 0.15, 0),
    'pause': (['pause'], 0.7, 0, 0),
    'resume': (['resume'], 0.7, 0, 0),
    'game-start': (['game-start'], 0.9, 0.3, 0),
    'game-over': (['stinger-game-over'], 0.95, 0.7, 0),
    'new-record': (['stinger-record'], 1.0, 0.8, 0),
    'record-beaten': (['record-sparkle'], 0.8, 0.2, 0),
    'install': (['install'], 0.8, 0.2, 0),
    'recovery-step': (['recovery-step'], 0.6, 0, 0),
    'recovery-break': (['recovery-break'], 0.7, 0.1, 0),
    'hint-recharge': (['hint-recharge'], 0.85, 0.25, 0),
}

CREDITS = [
    {
        'what': 'Matéria-prima dos efeitos (cliques, impactos, cartas, fichas, jingles curtos)',
        'source': 'Kenney — Interface Sounds, UI Audio, Impact Sounds, Digital Audio, Casino Audio, Sci-fi Sounds, Music Jingles',
        'license': 'CC0 1.0',
        'url': 'https://kenney.nl/assets',
    },
    {
        'what': 'Design em camadas dos efeitos (sinos FM, pads, sub, reverb) e masterização',
        'source': 'tools/audio/sfx_design.py (este repositório)',
        'license': 'MIT (código) — áudio resultante incluído no projeto',
    },
    {
        'what': 'Trilha original (tema e variações de intensidade)',
        'source': 'Gerada com ACE-Step 1.5 (modelo aberto, MIT) via acestep.cpp (MIT), rodando localmente; edição/master em tools/audio/music_master.py',
        'license': 'Modelo MIT; faixa original gerada para este projeto',
        'url': 'https://huggingface.co/ACE-Step/Ace-Step1.5',
    },
]


def wav_duration(path):
    with wave.open(path) as w:
        return w.getnframes() / w.getframerate()


def encode(src, dst_noext, kind):
    os.makedirs(os.path.dirname(dst_noext), exist_ok=True)
    # Opus grava um número de série aleatório: recodificar um áudio igual mudaria o arquivo (e o cache
    # do PWA) sem mudar o som. Só codifica o que é novo ou cuja fonte mudou.
    outs = [dst_noext + '.opus', dst_noext + '.mp3']
    if all(os.path.exists(o) and os.path.getmtime(o) >= os.path.getmtime(src) for o in outs):
        return
    music = kind == 'music'
    opus = ['ffmpeg', '-v', 'error', '-y', '-i', src, '-c:a', 'libopus', '-b:a', '112k' if music else '80k', '-vbr', 'on',
            '-application', 'audio', '-map_metadata', '-1', '-metadata', 'comment=ICONES Maratona - ver CREDITOS no repositorio', dst_noext + '.opus']
    mp3 = ['ffmpeg', '-v', 'error', '-y', '-i', src, '-c:a', 'libmp3lame', '-q:a', '3' if music else '4', '-map_metadata', '-1', dst_noext + '.mp3']
    subprocess.run(opus, check=True)
    subprocess.run(mp3, check=True)


def main():
    # Só vai para o site o que algum evento ou camada usa (ingredientes como game-over-sfx entram nas
    # vinhetas, não são publicados sozinhos); arquivos que sobrarem em public/audio são apagados no fim.
    used = {f for files, *_ in EVENTS.values() for f in files}
    sources = {name[:-4]: os.path.join(SFX_WAV, name) for name in os.listdir(SFX_WAV) if name.endswith('.wav')}

    music_meta = json.load(open(MUSIC_META)) if os.path.exists(MUSIC_META) else None
    layers = {}
    if music_meta:
        for layer, info in music_meta['layers'].items():
            encode(os.path.join(MUSIC_WAV, info['wav']), os.path.join(PUBLIC, 'music', layer), 'music')
            layers[layer] = {'file': f'music/{layer}', 'duration': info['duration']}
        for stinger in music_meta.get('stingers', []):
            sources[stinger] = os.path.join(MUSIC_WAV, stinger + '.wav')

    durations = {}
    for base in sorted(used & sources.keys()):
        encode(sources[base], os.path.join(PUBLIC, 'sfx', base), 'sfx')
        durations[base] = round(wav_duration(sources[base]), 3)

    sfx = {}
    for event, (files, gain, duck, detune) in EVENTS.items():
        missing = [f for f in files if f not in durations]
        if missing:
            raise SystemExit(f'evento {event}: arquivos ausentes {missing}')
        entry = {'files': [f'sfx/{f}' for f in files], 'gain': gain, 'duration': max(durations[f] for f in files)}
        if duck:
            entry['duck'] = duck
        if detune:
            entry['detuneCents'] = detune
        sfx[event] = entry

    wanted = {os.path.join(PUBLIC, 'sfx', f'{b}.{ext}') for b in durations for ext in ('opus', 'mp3')}
    wanted |= {os.path.join(PUBLIC, 'music', f'{l}.{ext}') for l in layers for ext in ('opus', 'mp3')}
    for dp, _, fns in os.walk(PUBLIC):
        for fn in fns:
            if os.path.join(dp, fn) not in wanted:
                os.remove(os.path.join(dp, fn))

    manifest = {
        'version': 1,
        'formats': {'primary': 'opus', 'fallback': 'mp3'},
        'music': {
            'bpm': music_meta['bpm'] if music_meta else 120,
            'beatsPerBar': 4,
            'keyscale': music_meta['keyscale'] if music_meta else 'A minor',
            'loop': music_meta['loop'] if music_meta else {'lead': 2, 'length': 64},
            'layers': layers,
        },
        'sfx': sfx,
        'credits': CREDITS,
    }
    with open(MANIFEST, 'w') as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
        f.write('\n')
    total = sum(os.path.getsize(os.path.join(dp, fn)) for dp, _, fns in os.walk(PUBLIC) for fn in fns)
    print(f'manifesto: {len(sfx)} eventos, {len(layers)} camadas · public/audio = {total / 1024:.0f} KB')


if __name__ == '__main__':
    main()
