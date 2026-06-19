import React from 'react';
import { Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { ROUTES } from '@constants/index';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'medium', showText = true }) => {
  const sizes = {
    small: { width: 132, height: 40 },
    medium: { width: 168, height: 50 },
    large: { width: 220, height: 66 },
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
      }}
    >
      {showText && (
        <Box
          component="img"
          src="/job_logo.png"
          alt="Actotech Jobs"
          sx={{
            width: { xs: Math.min(width, 142), sm: width },
            height,
            display: 'block',
            objectFit: 'contain',
          }}
        />
      )}
    </Box>
  );
};
