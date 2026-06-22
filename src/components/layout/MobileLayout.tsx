import React from 'react';
import { Box } from '@mui/material';
import { MobileNavbar } from './MobileNavbar';
import { MobileFooter } from './MobileFooter';

interface MobileLayoutProps {
  children: React.ReactNode;
  footer?: boolean;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({ children, footer = true }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: '#f6f8fb',
      }}
    >
      <MobileNavbar />
      <Box
        component="main"
        sx={{
          flex: 1,
          width: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </Box>
      {footer && <MobileFooter />}
    </Box>
  );
};
