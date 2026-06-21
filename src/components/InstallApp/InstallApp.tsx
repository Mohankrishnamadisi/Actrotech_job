import React, { useEffect, useState } from 'react';
import usePWA from '../../hooks/usePWA';
import { useLocation } from 'react-router-dom';
import InstallPromptDialog from './InstallPromptDialog';

const VISIT_KEY = 'actro_page_visits';
const DISMISS_KEY = 'actro_install_dismissed';

export const InstallApp: React.FC = () => {
  const { deferredPrompt, isInstalled, promptInstall } = usePWA();
  const location = useLocation();
  const [openDialog, setOpenDialog] = useState(false);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [dismissed, setDismissed] = useState(() => !!localStorage.getItem(DISMISS_KEY));

  useEffect(() => {
    if (dismissed) return;
    const prev = Number(localStorage.getItem(VISIT_KEY) || '0');
    const next = prev + 1;
    localStorage.setItem(VISIT_KEY, String(next));
    if (next >= 3) setShowSuggestion(true);
  }, [location.pathname, dismissed]);

  useEffect(() => {
    if (isInstalled) {
      setShowSuggestion(false);
    }
  }, [isInstalled]);

  const handleOpen = () => {
    setOpenDialog(true);
  };

  const handleInstall = async () => {
    setOpenDialog(false);
    if (deferredPrompt) {
      await promptInstall();
    }
  };

  const handleDismissSuggestion = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
    setShowSuggestion(false);
  };

  if (isInstalled) return null;

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        style={{
          border: '1px solid #1976d2',
          background: '#ffffff',
          color: '#1976d2',
          borderRadius: 12,
          padding: '9px 16px',
          cursor: 'pointer',
          fontWeight: 700,
          minWidth: 130,
          boxShadow: '0 12px 24px rgba(25, 118, 210, 0.12)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
        onMouseEnter={(event) => { event.currentTarget.style.transform = 'translateY(-1px)'; }}
        onMouseLeave={(event) => { event.currentTarget.style.transform = 'translateY(0)'; }}
      >
        Install App
      </button>
      <InstallPromptDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onInstall={handleInstall}
      />
    </>
  );
};

export default InstallApp;
