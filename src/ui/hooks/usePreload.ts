import { useEffect } from 'react';
import { imageUrlFor, isImageReady, preloadImage } from '../../data/assets';

/** Pré-carrega a imagem da próxima rodada enquanto a atual é jogada. */
export function usePreload(identityId: string | undefined) {
  useEffect(() => {
    if (identityId && isImageReady(identityId)) void preloadImage(imageUrlFor(identityId));
  }, [identityId]);
}
