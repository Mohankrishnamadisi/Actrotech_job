import React, { useState } from 'react';
import { Button } from '@mui/material';
import usePWA from '../../hooks/usePWA';
import InstallPromptDialog from './InstallPromptDialog';

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
      <Button
        onClick={handleOpen}
        variant="outlined"
        sx={{
          borderRadius: 2,
          px: { xs: 2.5, sm: 2 },
          py: 0.9,
          minWidth: 130,
          textTransform: 'none',
          borderColor: '#1976d2',
          color: '#1976d2',
          bgcolor: '#ffffff',
          boxShadow: '0 12px 24px rgba(25, 118, 210, 0.12)',
          width: { xs: '100%', sm: 'auto' },
          fontSize: { xs: '0.9rem', sm: '0.95rem' },
          '&:hover': {
            bgcolor: '#f3f7ff',
          },
        }}
      >
        Install App
      </Button>
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
