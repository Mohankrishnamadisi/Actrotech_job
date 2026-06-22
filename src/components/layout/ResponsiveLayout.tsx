import React from 'react';
import { useTheme, useMediaQuery } from '@mui/material';
import { Layout } from './Layout';
import { MobileLayout } from './MobileLayout';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  footer?: boolean;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ children, footer = true }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (isMobile) {
    return <MobileLayout footer={footer}>{children}</MobileLayout>;
  }

  return <Layout footer={footer}>{children}</Layout>;
};
