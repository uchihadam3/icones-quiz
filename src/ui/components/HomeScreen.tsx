import { useLayoutEffect, useRef } from 'react';
import { GAME_CONFIG } from '../../config/gameConfig';
import { catalogSummary } from '../../game';
import { fx } from '../../lib/motion';
import { bestComboEver, type MotionPreference, type Records } from '../../lib/storage';
import {
  BrandStar,
  ClockIcon,
  EyeIcon,
  FlameIcon,
  HeartIcon,
  KeyboardIcon,
  LockIcon,
  OptionsIcon,
  PlayIcon,
  ShieldHeart,
  SkipIcon,
  TrophyIcon,
} from './Icons';
import { InstallApp } from './InstallApp';
import { ImageCredits } from './ImageCredits';
import { APP_VERSION } from '../../lib/appUpdate';
import { SoundControls } from './SoundControls';

const cfg = GAME_CONFIG;

export function HomeScreen({
  records,
  motion,
  onMotionChange,
  starting = false,
  onPlay,
  onPreview,
}: {
  records: Records;
  motion: MotionPreference;
  onMotionChange: (m: MotionPreference) => void;
  /** Catálogo ainda carregando após o clique (raro: normalmente já foi pré-carregado). */
  starting?: boolean;
  onPlay: () => void;
  onPreview: () => void;
}) {
  const rootRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => fx.screenIn(rootRef.current), []);
  const imagesReady = catalogSummary.competitiveUnlocked;
  const readyPct = Math.min(100, Math.round((catalogSummary.ready / catalogSummary.unlock.minReady) * 100));
  const bestCombo = bestComboEver(records);

  return (
    <section className="screen home-screen" ref={rootRef} data-testid="home-screen">
      <div className="hero" data-enter>
        <div className="emblem" aria-hidden="true">
          <span className="emblem-rays" />
          <span className="emblem-halo" />
          <BrandStar className="emblem-star" />
        </div>
        <p className="eyebrow">Maratona de cultura pop</p>
        <h1 className="logo" data-text="ÍCONES">
          ÍCONES
        </h1>
        <p className="tagline">
          Veja a imagem. <b>Diga quem é.</b> Não erre a sequência.
        </p>
      </div>

      <div className="cta-block" data-enter>
        {imagesReady ? (
          <>
            <button className={`btn btn--primary btn--xl btn--shine${starting ? ' is-loading' : ''}`} onClick={onPlay} aria-busy={starting} data-testid="play">
              <PlayIcon /> Jogar
            </button>
            <button className="btn btn--secondary" onClick={onPreview} data-testid="preview">
              Treinar (preview)
            </button>
          </>
        ) : (
          <>
            <button
              className={`btn btn--primary btn--xl btn--shine btn--stack${starting ? ' is-loading' : ''}`}
              onClick={onPreview}
              aria-busy={starting}
              data-testid="preview"
            >
              <PlayIcon />
              <span className="btn-stack">
                <span>Jogar treino</span>
                <small>Testar mecânicas (preview)</small>
              </span>
            </button>
            <div className="locked-card" role="status" data-testid="images-pending">
              <div className="locked-head">
                <span className="locked-icon">
                  <LockIcon />
                </span>
                <div>
                  <h2>Banco de imagens em preparação</h2>
                  <p>
                    {catalogSummary.total} ícones curados aguardando imagens licenciadas. A Maratona valendo recorde abre sozinha com{' '}
                    {catalogSummary.unlock.minReady} imagens prontas.
                  </p>
                </div>
              </div>
              <div className="locked-progress" aria-label={`${catalogSummary.ready} de ${catalogSummary.unlock.minReady} imagens necessárias`}>
                <span style={{ width: `${Math.max(readyPct, 2)}%` }} />
              </div>
              <div className="locked-foot">
                <span>
                  {catalogSummary.ready}/{catalogSummary.unlock.minReady} imagens
                </span>
                <button className="btn btn--locked btn--sm" disabled aria-disabled="true">
                  <LockIcon /> Jogar (em breve)
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="record-card" data-enter data-testid="records">
        <TrophyIcon className="record-trophy" />
        <div className="record-main">
          <span className="hud-label">Seu recorde</span>
          <strong className="record-value">{records.best.toLocaleString('pt-BR')}</strong>
          <span className="record-sub">{records.best > 0 ? 'Neste aparelho. Bata essa marca!' : 'Ainda sem recorde — o primeiro é seu.'}</span>
        </div>
        <dl className="record-side">
          <div>
            <dt>Melhor combo</dt>
            <dd>{bestCombo}</dd>
          </div>
          <div>
            <dt>Treino</dt>
            <dd>{records.practiceBest.toLocaleString('pt-BR')}</dd>
          </div>
        </dl>
      </div>

      <section className="how" aria-labelledby="how-title" data-enter>
        <h2 id="how-title" className="section-title">
          Como funciona
        </h2>
        <ol className="loop">
          <li>
            <EyeIcon />
            <b>Veja</b>
            <span>a imagem inteira</span>
          </li>
          <li>
            <KeyboardIcon />
            <b>Digite</b>
            <span>quem é, rápido</span>
          </li>
          <li>
            <FlameIcon />
            <b>Encadeie</b>
            <span>combos até x{cfg.scoring.maxMultiplier}</span>
          </li>
        </ol>
        <ul className="rules" aria-label="Regras rápidas">
          <li className="rule rule--life">
            <HeartIcon filled />
            <b>{cfg.lives.initial} vidas</b>
            <span>erro ou tempo esgotado custa 1</span>
          </li>
          <li className="rule rule--time">
            <ClockIcon />
            <b>
              {cfg.timer.earlySeconds}s → {cfg.timer.normalSeconds}s
            </b>
            <span>
              {cfg.timer.earlySeconds}s nas {cfg.timer.earlyRounds} primeiras, depois {cfg.timer.normalSeconds}s fixos
            </span>
          </li>
          <li className="rule rule--combo">
            <FlameIcon />
            <b>Combo x{cfg.scoring.maxMultiplier}</b>
            <span>acertos seguidos multiplicam</span>
          </li>
          <li className="rule rule--recover">
            <ShieldHeart />
            <b>Vida de volta</b>
            <span>{cfg.recovery.thresholds.slice(0, 3).join(', ')}… acertos seguidos</span>
          </li>
          <li className="rule rule--skip">
            <SkipIcon />
            <b>{cfg.aids.skips} pulos</b>
            <span>sem perder vida, sem pontos</span>
          </li>
          <li className="rule rule--hint">
            <OptionsIcon />
            <b>{cfg.aids.optionHints} alternativas</b>
            <span>valem metade · +1 a cada {cfg.aids.optionHintRechargeEvery} acertos</span>
          </li>
        </ul>
      </section>

      <div data-enter>
        <InstallApp />
      </div>

      <footer className="home-footer" data-enter>
        <SoundControls />
        <fieldset className="segmented">
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
        <p className="fine-print app-version" data-testid="app-version">versão {APP_VERSION}</p>
        <ImageCredits />
      </footer>
    </section>
  );
}
