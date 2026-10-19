import { audio } from '../../audio';
import { useAudioSettings } from '../../audio/useAudio';
import { NoteIcon, SpeakerIcon } from './Icons';

/** Botão de mudo compacto (HUD). */
export function MuteButton() {
  const { settings } = useAudioSettings();
  return (
    <button
      type="button"
      className="icon-btn"
      onClick={() => audio.setSettings({ muted: !settings.muted })}
      aria-pressed={settings.muted}
      aria-label={settings.muted ? 'Ativar som' : 'Silenciar'}
      data-testid="mute"
    >
      <SpeakerIcon muted={settings.muted} />
    </button>
  );
}

/** Controles completos: mudo + volumes separados de Música e Efeitos (persistem neste aparelho). */
export function SoundControls({ compact = false }: { compact?: boolean }) {
  const { settings, available, unlocked } = useAudioSettings();
  return (
    <fieldset className={`sound${compact ? ' is-compact' : ''}`} data-testid="sound-controls">
      <legend className="hud-label">Som</legend>
      <button
        type="button"
        className={`sound-mute${settings.muted ? ' is-muted' : ''}`}
        onClick={() => audio.setSettings({ muted: !settings.muted })}
        aria-pressed={settings.muted}
      >
        <SpeakerIcon muted={settings.muted} /> {settings.muted ? 'Sem som' : 'Som ligado'}
      </button>
      <label className="sound-row">
        <NoteIcon className="sound-icon" />
        <span>Música</span>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={Math.round(settings.music * 100)}
          onChange={(e) => audio.setSettings({ music: Number(e.target.value) / 100 })}
          aria-label="Volume da música"
        />
      </label>
      <label className="sound-row">
        <SpeakerIcon className="sound-icon" />
        <span>Efeitos</span>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={Math.round(settings.sfx * 100)}
          onChange={(e) => {
            audio.setSettings({ sfx: Number(e.target.value) / 100 });
            audio.play('ui-tap');
          }}
          aria-label="Volume dos efeitos"
        />
      </label>
      {!available && (
        <p className="sound-note" role="status">
          Som indisponível neste navegador. O jogo funciona normalmente em silêncio.{' '}
          <button type="button" className="link-btn" onClick={() => void audio.retry()}>
            Tentar de novo
          </button>
        </p>
      )}
      {/* Linha sempre presente (só o texto muda): sumir no 1º toque faria a página pular sob o dedo. */}
      {available && !compact && (
        <p className="sound-note" aria-live="polite">
          {unlocked ? 'Som ativo. Música reage ao seu combo.' : 'O som começa no seu primeiro toque.'}
        </p>
      )}
    </fieldset>
  );
}
