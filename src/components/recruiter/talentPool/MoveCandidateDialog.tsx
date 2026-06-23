import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Typography,
} from '@mui/material';
import type { TalentPool } from '@types';

interface MoveCandidateDialogProps {
  open: boolean;
  onClose: () => void;
  pools: TalentPool[];
  currentPoolId: string;
  candidateName?: string;
  onMove: (targetPoolId: string) => Promise<void>;
  loading?: boolean;
}

export const MoveCandidateDialog: React.FC<MoveCandidateDialogProps> = ({
  open,
  onClose,
  pools,
  currentPoolId,
  candidateName,
  onMove,
  loading = false,
}) => {
  const [targetPoolId, setTargetPoolId] = useState('');

  const availablePools = pools.filter((p) => p.id !== currentPoolId);

  const handleMove = async () => {
    if (!targetPoolId) return;
    await onMove(targetPoolId);
    setTargetPoolId('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Move to Another Pool</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Move {candidateName || 'this candidate'} to a different talent pool.
        </Typography>
        {availablePools.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Create another pool first to move candidates between folders.
          </Typography>
        ) : (
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Target Pool</InputLabel>
            <Select
              value={targetPoolId}
              label="Target Pool"
              onChange={(e) => setTargetPoolId(e.target.value)}
              disabled={loading}
            >
              {availablePools.map((pool) => (
                <MenuItem key={pool.id} value={pool.id}>
                  {pool.name} ({pool.candidate_count ?? 0})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleMove}
          disabled={loading || !targetPoolId || availablePools.length === 0}
          endIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          Move
        </Button>
      </DialogActions>
    </Dialog>
  );
};
