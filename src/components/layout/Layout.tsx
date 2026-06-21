import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { ArrowBackIosNew as ArrowBackIosNewIcon } from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  footer?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, footer = true }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const canGoBack = location.pathname !== '/' && window.history.length > 1;
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Box component="main" sx={{ flex: 1, py: 3 }}>
        {canGoBack && (
          <Box sx={{ px: { xs: 2, md: 3 }, mb: 2, display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Go Back">
              <IconButton
                onClick={() => navigate(-1)}
                size="small"
                sx={{ boxShadow: 1, backgroundColor: 'background.paper' }}
              >
                <ArrowBackIosNewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
        {children}
      </Box>
      {footer && <Footer />}
    </Box>
  );
};
