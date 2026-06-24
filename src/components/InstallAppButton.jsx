import { useEffect, useState } from 'react';

function isStandaloneMode() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function isMobileBrowser() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.matchMedia('(max-width: 820px)').matches;
}

export default function InstallAppButton() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [installed, setInstalled] = useState(() => isStandaloneMode());

  const isElectron = navigator.userAgent.includes('Electron');
  const shouldShow = !isElectron && isMobileBrowser() && !installed;

  useEffect(() => {
    const handleBeforeInstall = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };

    const handleInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
      setShowInstructions(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!installPrompt) {
      setShowInstructions(true);
      return;
    }

    installPrompt.prompt();
    const choice = await installPrompt.userChoice;

    if (choice.outcome === 'accepted') {
      setInstalled(true);
    }

    setInstallPrompt(null);
  };

  if (!shouldShow) return null;

  return (
    <>
      <button type="button" className="ghost-button install-app-button" onClick={installApp}>
        Instalar app
      </button>

      {showInstructions && (
        <div className="install-sheet-backdrop" role="presentation" onClick={() => setShowInstructions(false)}>
          <section
            className="install-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="install-sheet-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="install-sheet-close"
              aria-label="Fechar"
              onClick={() => setShowInstructions(false)}
            >
              ×
            </button>
            <span className="eyebrow">Aplicativo no celular</span>
            <h2 id="install-sheet-title">Adicionar à tela inicial</h2>
            <p>
              No iPhone, abra pelo Safari, toque em Compartilhar e escolha Adicionar à Tela de Início. No Android,
              abra o menu do navegador e toque em Instalar aplicativo.
            </p>
          </section>
        </div>
      )}
    </>
  );
}
