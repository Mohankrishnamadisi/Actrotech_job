import { useEffect, useState, useCallback } from 'react';

export const usePWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    const beforeInstallHandler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      window.dispatchEvent(new CustomEvent('pwa:beforeinstallprompt', { detail: e }));
    };

    const appInstalled = () => {
      setIsInstalled(true);
      window.dispatchEvent(new CustomEvent('pwa:installed'));
    };

    window.addEventListener('beforeinstallprompt', beforeInstallHandler as any);
    window.addEventListener('appinstalled', appInstalled as any);

    // Detect iOS standalone mode
    const isInStandaloneMode = () => (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (window.navigator as any).standalone === true;
    if (isInStandaloneMode()) setIsInstalled(true);

    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstallHandler as any);
      window.removeEventListener('appinstalled', appInstalled as any);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return { outcome: 'no-prompt' };
    try {
      const e = deferredPrompt;
      // According to spec, call prompt()
      await e.prompt();
      const choice = await e.userChoice;
      setDeferredPrompt(null);
      if (choice.outcome === 'accepted') setIsInstalled(true);
      return choice;
    } catch (err) {
      return { outcome: 'error', error: err };
    }
  }, [deferredPrompt]);

  return { deferredPrompt, isInstalled, promptInstall };
};

export default usePWA;
