import React from 'react';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';

interface BulkConfirmationDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmColor?: 'primary' | 'error' | 'warning' | 'success';
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const BulkConfirmationDialog: React.FC<BulkConfirmationDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  confirmColor = 'primary',
  loading = false,
  onCancel,
  onConfirm,
}) => (
  <Dialog open={open} onClose={loading ? undefined : onCancel} maxWidth="xs" fullWidth>
    <DialogTitle sx={{ fontWeight: 800 }}>{title}</DialogTitle>
    <DialogContent>
      <Typography variant="body1">{message}</Typography>
    </DialogContent>
    <DialogActions sx={{ p: 2 }}>
      <Button onClick={onCancel} disabled={loading}>Cancel</Button>
      <Button
        variant="contained"
        color={confirmColor}
        onClick={onConfirm}
        disabled={loading}
        endIcon={loading ? <CircularProgress color="inherit" size={16} /> : undefined}
      >
        {confirmLabel}
      </Button>
    </DialogActions>
  </Dialog>
);
