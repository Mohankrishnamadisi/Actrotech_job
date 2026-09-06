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
    medium: { width: 170, height: 56 },
    large: { width: 200, height: 60 },
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
        background: isDarkMode ? 'rgba(30, 41, 59, 0.92)' : 'transparent',
        border: isDarkMode ? '1px solid rgba(148, 163, 184, 0.36)' : 'none',
        boxShadow: isDarkMode ? '0 5px 16px rgba(0, 0, 0, 0.28)' : 'none',
      }}
    >
      {showText && (
        <Box
          component="img"
          src={isDarkMode ? '/white%20jobpoyt.png.png' : '/Jobpoyt.png'}
          alt="Jobpoyt"
          sx={{
            width: { xs: Math.min(width, 140), sm: width },
            height,
            display: 'block',
            objectFit: 'contain',
            filter: isDarkMode
              ? 'brightness(0.86) saturate(1.12) drop-shadow(0 1px 2px rgba(2, 6, 23, 0.45))'
              : 'none',
          }}
        />
      )}
    </Box>
  );
};
