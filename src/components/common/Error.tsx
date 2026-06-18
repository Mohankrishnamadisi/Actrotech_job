import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { ErrorOutline as ErrorOutlineIcon } from '@mui/icons-material';

interface ErrorProps {
  message: string;
  onRetry?: () => void;
}

export const Error: React.FC<ErrorProps> = ({ message, onRetry }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 2,
        p: 3,
        textAlign: 'center',
      }}
    >
      <ErrorOutlineIcon sx={{ fontSize: 48, color: 'error.main' }} />
      <Typography variant="h6" sx={{ color: 'text.primary' }}>
        Something went wrong
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 400 }}>
        {message}
      </Typography>
      {onRetry && (
        <Button variant="contained" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </Box>
  );
};
