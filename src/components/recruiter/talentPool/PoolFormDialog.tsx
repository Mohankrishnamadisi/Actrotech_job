import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
} from '@mui/material';
import type { TalentPool } from '@types';

interface PoolFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: { name: string; description?: string }) => Promise<void>;
  pool?: TalentPool | null;
  loading?: boolean;
}

export const PoolFormDialog: React.FC<PoolFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  pool,
  loading = false,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (open) {
      setName(pool?.name || '');
      setDescription(pool?.description || '');
    }
  }, [open, pool]);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    await onSubmit({ name: name.trim(), description: description.trim() || undefined });
    onClose();
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{pool ? 'Edit Pool' : 'Create Pool'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        <TextField
          autoFocus
          label="Pool Name"
          placeholder="e.g. Frontend Developers"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          fullWidth
        />
        <TextField
          label="Description (optional)"
          placeholder="Short note about this pool"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
          fullWidth
          multiline
          minRows={2}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !name.trim()}
          endIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {pool ? 'Save Changes' : 'Create Pool'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
