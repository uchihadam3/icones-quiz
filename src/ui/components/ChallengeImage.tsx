import { useEffect, useState } from 'react';
import { imageUrlFor, isImageReady, preloadImage } from '../../data/assets';
import { CATEGORY_LABELS } from '../../data/characters';
import type { Identity } from '../../domain/types';
import { BrandStar, CameraIcon, MaskIcon } from './Icons';

/**
 * Imagem do desafio: sempre INTEIRA e nítida (nunca borrada ou revelada aos poucos).
 * - Partida real: só recebe identidades com imagem pronta; falha de carregamento → onFailed (sem custo).
 * - Preview: identidades sem imagem mostram um pôster neutro "Imagem a adicionar" — arte abstrata da marca,
 *   nunca um desenho imitando o personagem/pessoa.
 * - O texto alternativo e o placeholder nunca contêm o nome nem a origem (seriam a resposta).
 */
export function ChallengeImage({
  identity,
  preview,
  onFailed,
  onShown,
}: {
  identity: Identity;
  preview: boolean;
  onFailed: () => void;
  onShown: () => void;
}) {
  const ready = isImageReady(identity.id);
  const url = imageUrlFor(identity.id);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'failed'>('loading');

  useEffect(() => {
    if (!ready) return;
    let alive = true;
    // O componente é remontado a cada rodada (key = roundId), então começa sempre em 'loading'.
    preloadImage(url).then((ok) => {
      if (!alive) return;
      setStatus(ok ? 'loaded' : 'failed');
      if (ok) onShown();
      else if (!preview) onFailed();
    });
    return () => {
      alive = false;
    };
  }, [ready, url, preview, onFailed, onShown]);

  if (!ready || (preview && status === 'failed')) return <PlaceholderPoster identity={identity} />;

  return (
    <div className={`image-frame is-${status}`}>
      {status !== 'loaded' && (
        <div className="image-skeleton" aria-hidden="true">
          <BrandStar className="skeleton-star" />
        </div>
      )}
      {status === 'loaded' && <img src={url} alt="Imagem do desafio" decoding="async" draggable={false} />}
      {status === 'failed' && <p className="image-error">Não foi possível carregar a imagem. Trocando…</p>}
    </div>
  );
}

function PlaceholderPoster({ identity }: { identity: Identity }) {
  const person = identity.kind === 'person';
  return (
    <div className={`poster is-${identity.kind}`} data-testid="image-placeholder">
      <div className="poster-rays" aria-hidden="true" />
      <div className="poster-dots" aria-hidden="true" />
      <div className="poster-foil" aria-hidden="true" />
      <div className="poster-emblem" aria-hidden="true">
        <span className="poster-ring" />
        <span className="poster-q">?</span>
      </div>
      <div className="poster-info">
        <strong className="poster-title">Imagem a adicionar</strong>
        {/* Só tipo e categoria: a origem (ex.: "Shrek", "Chaves") muitas vezes É a resposta. */}
        <div className="poster-chips">
          <span className="chip">
            {person ? <CameraIcon /> : <MaskIcon />}
            {person ? 'Pessoa' : 'Personagem'}
          </span>
          <span className="chip">{CATEGORY_LABELS[identity.category]}</span>
        </div>
        <span className="poster-note">Preview de desenvolvimento</span>
      </div>
    </div>
  );
}
