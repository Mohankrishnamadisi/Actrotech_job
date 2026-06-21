import React from 'react';
import { Box, Typography } from '@mui/material';

export const InstallTooltip: React.FC = () => {
  return (
    <Box sx={{ p: 1, maxWidth: 260 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Install Actro Jobs App</Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        Install this app on your mobile for faster access, job alerts, and an app-like experience.
      </Typography>
      <Box sx={{ mt: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 700 }}>Android:</Typography>
        <Typography variant="caption" sx={{ ml: 1 }}>Open menu → Tap "Install App"</Typography>
      </Box>
      <Box>
        <Typography variant="caption" sx={{ fontWeight: 700 }}>iPhone:</Typography>
        <Typography variant="caption" sx={{ ml: 1 }}>Open Share Menu → Tap "Add to Home Screen"</Typography>
      </Box>
    </Box>
  );
};

export default InstallTooltip;
