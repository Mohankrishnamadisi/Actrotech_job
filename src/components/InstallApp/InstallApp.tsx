import React, { useState } from 'react';
import usePWA from '../../hooks/usePWA';
import InstallPromptDialog from './InstallPromptDialog';
import '../../styles/installAppButton.css';

export const InstallApp: React.FC = () => {
  const { deferredPrompt, isInstalled, promptInstall } = usePWA();
  const [openDialog, setOpenDialog] = useState(false);

  const handleOpen = () => {
    setOpenDialog(true);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) {
      setOpenDialog(true);
      return;
    }

    setOpenDialog(false);
    await promptInstall();
  };

  if (isInstalled) return null;

  return (
    <>
      <button
        onClick={handleOpen}
        type="button"
        className="install-app-button install-app-type1"
        aria-label="Install App"
      >
      </button>
      <InstallPromptDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onInstall={handleInstall}
        fallbackMessage={!deferredPrompt ? 'If installation does not appear, use Chrome menu → Add to Home screen.' : undefined}
      />
    </>
  );
};

export default InstallApp;
