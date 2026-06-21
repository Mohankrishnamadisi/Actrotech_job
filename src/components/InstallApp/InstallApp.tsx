import React, { useEffect, useState } from 'react';
import usePWA from '../../hooks/usePWA';
import { useLocation } from 'react-router-dom';

const VISIT_KEY = 'actotech_page_visits';
const DISMISS_KEY = 'actotech_install_dismissed';

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
    <button
      type="button"
      onClick={handleOpen}
      style={{
        border: '1px solid #1976d2',
        background: '#ffffff',
        color: '#1976d2',
        borderRadius: 8,
        padding: '8px 12px',
        cursor: 'pointer',
      }}
    >
      Install App
    </button>
  );
};

export default InstallApp;
