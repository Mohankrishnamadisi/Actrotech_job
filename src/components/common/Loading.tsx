import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingProps {
  message?: string;
  fullHeight?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({ message = 'Loading...', fullHeight = false }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 2,
        ...(fullHeight && { height: '100vh' }),
        p: 3,
      }}
    >
      <CircularProgress sx={{ color: 'primary.main' }} />
      <Typography variant="body1" sx={{ color: 'text.secondary' }}>
        {message}
      </Typography>
    </Box>
  );
};
