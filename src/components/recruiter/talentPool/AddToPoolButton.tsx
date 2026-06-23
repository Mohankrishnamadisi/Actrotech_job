import React, { useEffect, useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Tooltip,
  Divider,
} from '@mui/material';
import { FolderSpecial as PoolIcon, Check as CheckIcon } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { talentPoolService } from '@services/talentPool';
import type { TalentPool } from '@types';

interface AddToPoolButtonProps {
  recruiterId: string;
  candidateId: string;
  size?: 'small' | 'medium';
}

export const AddToPoolButton: React.FC<AddToPoolButtonProps> = ({
  recruiterId,
  candidateId,
  size = 'small',
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [pools, setPools] = useState<TalentPool[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [memberPoolIds, setMemberPoolIds] = useState<Set<string>>(new Set());

  const open = Boolean(anchorEl);

  useEffect(() => {
    if (!open) return;
    loadPools();
  }, [open, recruiterId]);

  const loadPools = async () => {
    setLoading(true);
    try {
      const data = await talentPoolService.getPools(recruiterId);
      setPools(data);

      const checks = await Promise.all(
        data.map(async (pool) => {
          const isMember = await talentPoolService.isCandidateInPool(pool.id, candidateId);
          return isMember ? pool.id : null;
        })
      );
      setMemberPoolIds(new Set(checks.filter(Boolean) as string[]));
    } catch (err) {
      console.error('Error loading pools:', err);
      toast.error('Failed to load talent pools');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (poolId: string) => {
    if (memberPoolIds.has(poolId)) return;
    setAdding(true);
    try {
      await talentPoolService.addCandidateToPool(poolId, candidateId);
      setMemberPoolIds((prev) => new Set([...prev, poolId]));
      toast.success('Added to talent pool');
    } catch (err) {
      console.error('Error adding to pool:', err);
      toast.error('Failed to add to pool');
    } finally {
      setAdding(false);
    }
  };

  return (
    <>
      <Tooltip title="Add to Talent Pool">
        <IconButton size={size} onClick={(e) => setAnchorEl(e.currentTarget)}>
          <PoolIcon fontSize="small" sx={{ color: '#0A66C2' }} />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}>
        {loading ? (
          <MenuItem disabled>
            <CircularProgress size={20} sx={{ mx: 'auto' }} />
          </MenuItem>
        ) : pools.length === 0 ? (
          <MenuItem disabled>
            <ListItemText primary="No pools yet — create one in Talent Pool tab" />
          </MenuItem>
        ) : (
          pools.map((pool) => {
            const isMember = memberPoolIds.has(pool.id);
            return (
              <MenuItem
                key={pool.id}
                onClick={() => handleAdd(pool.id)}
                disabled={adding || isMember}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  {isMember ? <CheckIcon fontSize="small" color="success" /> : <PoolIcon fontSize="small" />}
                </ListItemIcon>
                <ListItemText
                  primary={pool.name}
                  secondary={`${pool.candidate_count ?? 0} candidates`}
                />
              </MenuItem>
            );
          })
        )}
        <Divider />
        <MenuItem disabled sx={{ opacity: 0.7 }}>
          <ListItemText primary="Manage pools in Talent Pool tab" secondary="" />
        </MenuItem>
      </Menu>
    </>
  );
};
