import React from 'react';
import { Box } from '@mui/material';
import { MobileBottomNavigation } from './MobileBottomNavigation';
import { MobileTopHeader } from './MobileTopHeader';

interface MobileAppShellProps {
  children: React.ReactNode;
}

export const MobileAppShell: React.FC<MobileAppShellProps> = ({ children }) => (
  <Box
    sx={{
      minHeight: '100vh',
      bgcolor: 'background.default',
      color: 'text.primary',
      position: 'relative',
      pb: 'calc(76px + env(safe-area-inset-bottom, 0px))',
    }}
  >
    <MobileTopHeader />

    <Box
      component="main"
      sx={{
        width: '100%',
        minHeight: 'calc(100vh - 124px)',
      }}
    >
      {children}
    </Box>

    <MobileBottomNavigation />
  </Box>
);
