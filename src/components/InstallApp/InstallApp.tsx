import React, { useState } from 'react';
import { Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import usePWA from '../../hooks/usePWA';
import InstallPromptDialog from './InstallPromptDialog';

export const InstallApp: React.FC = () => {
  const { deferredPrompt, isInstalled, promptInstall } = usePWA();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
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
        size="small"
        sx={{
          borderRadius: 2,
          px: { xs: 2, sm: 1.75 },
          py: 0.75,
          minWidth: 120,
          textTransform: 'none',
          borderColor: isDarkMode ? 'rgba(96, 165, 250, 0.66)' : '#1D4ED8',
          color: isDarkMode ? '#BFDBFE' : '#1D4ED8',
          bgcolor: isDarkMode ? 'rgba(15, 23, 42, 0.72)' : '#ffffff',
          boxShadow: isDarkMode ? '0 6px 14px rgba(2, 6, 23, 0.28)' : '0 6px 14px rgba(25, 118, 210, 0.08)',
          width: { xs: '100%', sm: 'auto' },
          fontSize: '0.9rem',
          '&:hover': {
            bgcolor: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : '#eff6ff',
            borderColor: isDarkMode ? '#93C5FD' : '#1D4ED8',
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
