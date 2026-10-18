import { useEffect, useState } from 'react';
import { imageUrlFor, isImageReady, preloadImage } from '../../data/assets';
import { CATEGORY_LABELS } from '../../data/characters';
import type { Identity } from '../../domain/types';
import { ImageSlotIcon } from './Icons';

/**
 * Imagem do desafio: sempre INTEIRA e nítida (nunca borrada ou revelada aos poucos).
 * - Partida real: só recebe identidades com imagem pronta; falha de carregamento → onFailed (sem custo).
 * - Preview: identidades sem imagem mostram um espaço neutro "Imagem a adicionar" (nunca um desenho imitando o personagem).
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

  if (!ready || (preview && status === 'failed')) {
    return (
      <div className="image-slot" data-testid="image-placeholder">
        <ImageSlotIcon className="image-slot-icon" />
        <strong>Imagem a adicionar</strong>
        {/* Só tipo e categoria: a origem (ex.: "Shrek", "Chaves") muitas vezes É a resposta. */}
        <span className="image-slot-meta">
          {identity.kind === 'person' ? 'Pessoa' : 'Personagem'} · {CATEGORY_LABELS[identity.category]}
        </span>
        <span className="image-slot-note">Somente no preview de desenvolvimento</span>
      </div>
    );
  }

  return (
    <div className={`image-frame is-${status}`}>
      {status !== 'loaded' && <div className="image-skeleton" aria-hidden="true" />}
      {status === 'loaded' && <img src={url} alt="Imagem do desafio" decoding="async" draggable={false} />}
      {status === 'failed' && <p className="image-error">Não foi possível carregar a imagem. Trocando…</p>}
    </div>
  );
}
