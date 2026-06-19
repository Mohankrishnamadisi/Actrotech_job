import React from 'react';
import { Box, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { WorkOutline as WorkIcon } from '@mui/icons-material';
import { ROUTES } from '@constants/index';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'medium', showText = true }) => {
  const sizes = {
    small: { icon: 28, font: '1.1rem' },
    medium: { icon: 36, font: '1.5rem' },
    large: { icon: 48, font: '2rem' },
  };

  const { icon, font } = sizes[size];

  return (
    <Box
      component={RouterLink}
      to={ROUTES.HOME}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        textDecoration: 'none',
        transition: 'transform 0.3s ease',
        '&:hover': { transform: 'scale(1.02)' },
      }}
    >
      <Box
        sx={{
          width: icon,
          height: icon,
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 15px rgba(124, 58, 237, 0.4)',
        }}
      >
        <WorkIcon sx={{ color: '#fff', fontSize: icon * 0.55 }} />
      </Box>
      {showText && (
        <Typography
          sx={{
            fontWeight: 800,
            fontSize: font,
            background: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: -0.5,
          }}
        >
          Actotech Jobs
        </Typography>
      )}
    </Box>
  );
};
