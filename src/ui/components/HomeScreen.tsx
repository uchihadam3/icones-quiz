import { useLayoutEffect, useRef } from 'react';
import { GAME_CONFIG } from '../../config/gameConfig';
import { catalogSummary } from '../../game';
import { fx } from '../../lib/motion';
import type { MotionPreference, Records } from '../../lib/storage';
import { HeartIcon, OptionsIcon, SkipIcon, SparkIcon } from './Icons';

const cfg = GAME_CONFIG;

export function HomeScreen({
  records,
  motion,
  onMotionChange,
  onPlay,
  onPreview,
}: {
  records: Records;
  motion: MotionPreference;
  onMotionChange: (m: MotionPreference) => void;
  onPlay: () => void;
  onPreview: () => void;
}) {
  const heroRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => fx.cardIn(heroRef.current), []);
  const imagesReady = catalogSummary.ready > 0;

  return (
    <section className="screen home-screen" data-testid="home-screen">
      <div className="hero" ref={heroRef}>
        <p className="eyebrow">
          <SparkIcon /> Maratona
        </p>
        <h1 className="logo">ÍCONES</h1>
        <p className="tagline">Veja a imagem. Diga quem é. Quanto tempo você aguenta?</p>
      </div>

      {imagesReady ? (
        <button className="btn btn-primary btn-xl" onClick={onPlay} data-testid="play">
          Jogar
        </button>
      ) : (
        <div className="panel status-panel" role="status" data-testid="images-pending">
          <h2>Banco de imagens em preparação</h2>
          <p>
            O catálogo tem <b>{catalogSummary.total} ícones curados</b>, mas ainda <b>nenhuma imagem licenciada</b> foi adicionada. A partida
            valendo recorde abre quando as imagens chegarem.
          </p>
          <button className="btn btn-primary btn-xl" disabled aria-disabled="true">
            Jogar (em breve)
          </button>
        </div>
      )}

      <button className="btn btn-secondary" onClick={onPreview} data-testid="preview">
        Testar mecânicas (preview)
      </button>

      <ul className="rules" aria-label="Como funciona">
        <li>
          <HeartIcon filled className="rule-icon heart-color" />
          <span>
            <b>{cfg.lives.initial} vidas.</b> Erro ou tempo esgotado custa 1.
          </span>
        </li>
        <li>
          <SparkIcon className="rule-icon gold" />
          <span>
            <b>Acertos seguidos</b> recuperam vida e sobem o combo até x{cfg.scoring.maxMultiplier}.
          </span>
        </li>
        <li>
          <SkipIcon className="rule-icon cyan" />
          <span>
            <b>{cfg.aids.skips} pulos</b> por partida: não custam vida, não dão pontos.
          </span>
        </li>
        <li>
          <OptionsIcon className="rule-icon cyan" />
          <span>
            <b>{cfg.aids.optionHints} ajudas</b> de 3 alternativas: valem menos pontos.
          </span>
        </li>
      </ul>

      <div className="home-footer">
        <div className="records" data-testid="records">
          <span className="hud-label">Seu recorde (neste aparelho)</span>
          <strong>{records.best.toLocaleString('pt-BR')}</strong>
          {records.history.length > 0 && (
            <span className="records-last">
              Últimas: {records.history.slice(0, 3).map((r) => r.score.toLocaleString('pt-BR')).join(' · ')}
            </span>
          )}
        </div>

        <fieldset className="segmented" aria-label="Animações">
          <legend className="hud-label">Animações</legend>
          {(
            [
              ['system', 'Sistema'],
              ['reduced', 'Reduzidas'],
              ['full', 'Completas'],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className={motion === value ? 'is-on' : ''}>
              <input type="radio" name="motion" value={value} checked={motion === value} onChange={() => onMotionChange(value)} />
              {label}
            </label>
          ))}
        </fieldset>
        <p className="fine-print">Sem ranking online por enquanto: recordes ficam só neste navegador.</p>
      </div>
    </section>
  );
}
