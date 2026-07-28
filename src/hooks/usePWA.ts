import { usePWAInstall } from './usePWAInstall';

export const usePWA = () => {
  const pwa = usePWAInstall();

  return {
    deferredPrompt: pwa.deferredPrompt,
    isInstalled: pwa.isInstalled,
    promptInstall: pwa.promptInstall,
    // Extended metadata for enhanced install UX consumers.
    platform: pwa.platform,
    browser: pwa.browser,
    availability: pwa.availability,
    isStandalone: pwa.isStandalone,
    isInstallAvailable: pwa.isInstallAvailable,
  };
};

export { usePWAInstall } from './usePWAInstall';
export default usePWA;
