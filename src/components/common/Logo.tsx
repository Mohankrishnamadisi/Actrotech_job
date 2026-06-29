import React from 'react';
import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router-dom';
import { ROUTES } from '@constants/index';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'medium', showText = true }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const sizes = {
    small: { width: 120, height: 36 },
    medium: { width: 150, height: 46 },
    large: { width: 210, height: 60 },
  };

  const { width, height } = sizes[size];

  return (
    <Box
      component={RouterLink}
      to={ROUTES.HOME}
      sx={{
        display: 'flex',
        alignItems: 'center',
        textDecoration: 'none',
        transition: 'transform 0.2s ease',
        '&:hover': { transform: 'scale(1.02)' },
        width: { xs: '100%', sm: 'auto' },
        justifyContent: { xs: 'center', sm: 'flex-start' },
        borderRadius: 2,
        px: isDarkMode ? 1 : 0,
        py: isDarkMode ? 0.35 : 0,
        background: isDarkMode ? 'rgba(248, 250, 252, 0.92)' : 'transparent',
      }}
    >
      {showText && (
        <Box
          component="img"
          src="/job_logo.png"
          alt="Actro Jobs"
          sx={{
            width: { xs: Math.min(width, 140), sm: width },
            height,
            display: 'block',
            objectFit: 'contain',
            filter: isDarkMode ? 'drop-shadow(0 1px 2px rgba(2, 6, 23, 0.28))' : 'none',
          }}
        />
      )}
    </Box>
  );
};
