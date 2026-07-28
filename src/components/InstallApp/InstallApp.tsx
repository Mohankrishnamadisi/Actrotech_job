import React, { Suspense } from 'react';
import usePWAInstall from '@hooks/usePWAInstall';
import '../../styles/installAppButton.css';

const PWAInstallModal = React.lazy(() => import('./PWAInstallModal'));

export const InstallApp: React.FC = () => {
  const {
    isInstalled,
    promptInstall,
    availability,
    platform,
    iosModalOpen,
    closeIosInstructions,
  } = usePWAInstall();

  const handleInstall = async () => {
    await promptInstall();
  };

  if (isInstalled || availability === 'already_installed' || availability === 'unsupported') return null;

  return (
    <>
      <button
        onClick={handleInstall}
        type="button"
        className="install-app-button install-app-type1"
        aria-label="Install app"
        title="Install app"
      >
      </button>
      <Suspense fallback={null}>
        <PWAInstallModal
          open={iosModalOpen}
          platform={platform}
          onClose={closeIosInstructions}
        />
      </Suspense>
    </>
  );
};

export default InstallApp;
