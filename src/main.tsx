import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { requestReloadWhenIdle } from './lib/appUpdate';
import '@fontsource/lilita-one/latin-400.css';
import '@fontsource-variable/nunito/wght.css';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// PWA: registra o service worker com escopo restrito ao caminho do GitHub Pages.
// Um app instalado pode ficar dias aberto em segundo plano: ao voltar para ele, procura versão nova;
// quando o novo worker assume, a página recarrega na tela inicial (nunca no meio de uma partida).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    const hadController = Boolean(navigator.serviceWorker.controller);
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
      .then((registration) => {
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') void registration.update().catch(() => undefined);
        });
      })
      .catch((error: unknown) => {
        console.warn('Modo offline indisponível', error);
      });
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hadController) requestReloadWhenIdle();
    });
  });
}
