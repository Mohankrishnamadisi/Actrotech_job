import React, { useState } from 'react';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';

interface BulkMessageDialogProps {
  open: boolean;
  selectedCount: number;
  loading?: boolean;
  onClose: () => void;
  onSend: (message: string) => void;
}

export const BulkMessageDialog: React.FC<BulkMessageDialogProps> = ({
  open,
  selectedCount,
  loading = false,
  onClose,
  onSend,
}) => {
  const [message, setMessage] = useState('Your profile has been shortlisted.');
  const trimmedMessage = message.trim();

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>Send Bulk Message</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Send the same message to {selectedCount} selected {selectedCount === 1 ? 'candidate' : 'candidates'}.
        </Typography>
        <TextField
          autoFocus
          label="Message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          fullWidth
          multiline
          minRows={5}
          disabled={loading}
        />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          variant="contained"
          onClick={() => onSend(trimmedMessage)}
          disabled={loading || !trimmedMessage}
          endIcon={loading ? <CircularProgress color="inherit" size={16} /> : undefined}
        >
          Send Message
        </Button>
      </DialogActions>
    </Dialog>
  );
};
