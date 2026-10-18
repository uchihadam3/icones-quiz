import { useEffect, useState } from 'react';

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
    setDeferred(null);
    try {
      await event.prompt();
      await event.userChoice;
    } catch {
      // Se o navegador recusar, o menu normal continua disponível.
    }
  };

  if (installed) return null;
  return (
    <div className="panel install-panel" data-testid="install-app">
      <h2>Instalar no celular</h2>
      <p>Adicione ÍCONES à tela inicial e abra como aplicativo, sem precisar de APK.</p>
      {deferred ? (
        <button type="button" className="btn btn-secondary" onClick={() => void install()}>
          Instalar aplicativo
        </button>
      ) : (
        <p className="fine-print">
          Android (Chrome): menu ⋮ → Instalar app / Adicionar à tela inicial.
          iPhone (Safari): Compartilhar → Adicionar à Tela de Início.
        </p>
      )}
    </div>
  );
}
