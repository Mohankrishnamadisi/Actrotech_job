import React from 'react';
import { Box } from '@mui/material';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  footer?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, footer = true }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: 'linear-gradient(180deg, rgba(248,250,252,1) 0%, rgba(241,245,249,0.85) 40%, rgba(255,255,255,0.95) 100%)',
        overflowX: 'hidden',
      }}
    >
      <Navbar />
      <Box component="main" sx={{ flex: 1, py: { xs: 2, md: 4 }, position: 'relative', zIndex: 1 }}>
        {children}
      </Box>
      {footer && <Footer />}
    </Box>
  );
};
