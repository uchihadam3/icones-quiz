import { useEffect, useState } from 'react';
import { BrandStar, DownloadIcon } from './Icons';

type InstallChoice = { outcome: 'accepted' | 'dismissed' };
interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<InstallChoice>;
}

function isStandalone(): boolean {
  const ios = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || ios.standalone === true;
}

/** A instalação é oferecida pelo navegador; não baixa um APK de fonte desconhecida. */
export function InstallApp() {
  const [deferred, setDeferred] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalone);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    const event = deferred;
    if (!event) return;
    setBusy(true);
    try {
      await event.prompt();
      await event.userChoice;
    } catch {
      // Se o navegador recusar, o menu normal continua disponível.
    } finally {
      setBusy(false);
      setDeferred(null);
    }
  };

  if (installed) return null;
  return (
    <div className="install-card" data-testid="install-app">
      <div className="install-icon" aria-hidden="true">
        <BrandStar />
      </div>
      <div className="install-body">
        <h2>Instalar no celular</h2>
        <p>Abra ÍCONES direto da tela inicial, em tela cheia — sem APK.</p>
        {deferred || busy ? (
          <button type="button" className={`btn btn--secondary btn--sm${busy ? ' is-loading' : ''}`} onClick={() => void install()} disabled={busy} aria-busy={busy}>
            <DownloadIcon /> Instalar aplicativo
          </button>
        ) : (
          <p className="install-steps">
            <span>
              <b>Android (Chrome):</b> menu ⋮ → Instalar app
            </span>
            <span>
              <b>iPhone (Safari):</b> Compartilhar → Adicionar à Tela de Início
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
