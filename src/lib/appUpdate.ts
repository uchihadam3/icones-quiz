/**
 * Atualização do app instalado (PWA): quando um build novo assume, recarrega assim que o jogador
 * estiver fora de uma partida. Nunca recarrega no meio de uma rodada.
 */
let inGame = false;
let pending = false;

function reload() {
  pending = false;
  window.location.reload();
}

export function requestReloadWhenIdle(): void {
  if (inGame) pending = true;
  else reload();
}

/** A tela de jogo informa quando começa/termina uma partida. */
export function setInGame(value: boolean): void {
  inGame = value;
  if (!value && pending) reload();
}

/** Versão do build (commit), exibida no rodapé para diagnóstico. */
export const APP_VERSION: string = import.meta.env.VITE_APP_VERSION ?? 'dev';
