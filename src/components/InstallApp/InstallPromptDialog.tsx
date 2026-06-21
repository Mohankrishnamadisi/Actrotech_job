import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material';

interface Props {
  open: boolean;
  onClose: () => void;
  onInstall: () => void;
}

export const InstallPromptDialog: React.FC<Props> = ({ open, onClose, onInstall }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Install Actotech Jobs App</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Box component="img" src="/job_logo.png" alt="logo" sx={{ width: 64, height: 64, borderRadius: 2 }} />
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 700 }}>Install Actotech Jobs App</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Install this app on your mobile for faster access, job alerts, and an app-like experience.
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onInstall}>Install</Button>
      </DialogActions>
    </Dialog>
  );
};

export default InstallPromptDialog;
