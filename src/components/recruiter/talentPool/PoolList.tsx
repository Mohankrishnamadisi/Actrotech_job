import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  IconButton,
  Tooltip,
  CircularProgress,
  Button,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FolderSpecial as PoolIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import type { TalentPool } from '@types';

interface PoolListProps {
  pools: TalentPool[];
  selectedPoolId: string | null;
  onSelectPool: (poolId: string) => void;
  onCreatePool: () => void;
  onEditPool: (pool: TalentPool) => void;
  onDeletePool: (pool: TalentPool) => void;
  loading?: boolean;
}

export const PoolList: React.FC<PoolListProps> = ({
  pools,
  selectedPoolId,
  onSelectPool,
  onCreatePool,
  onEditPool,
  onDeletePool,
  loading = false,
}) => {
  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        border: '1px solid rgba(148, 163, 184, 0.22)',
        background: 'linear-gradient(160deg, rgba(255,255,255,0.9), rgba(241,245,249,0.85))',
        backdropFilter: 'blur(14px)',
        boxShadow: '0 16px 40px rgba(15, 23, 42, 0.06)',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid rgba(148, 163, 184, 0.16)',
          background: 'linear-gradient(90deg, rgba(10,102,194,0.08), rgba(10,102,194,0.02))',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <PoolIcon sx={{ color: '#0A66C2' }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 800, flex: 1 }}>
            Talent Pools
          </Typography>
        </Box>
        <Button
          fullWidth
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onCreatePool}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            bgcolor: '#0A66C2',
            '&:hover': { bgcolor: '#004182' },
          }}
        >
          New Pool
        </Button>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', p: 1 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : pools.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
            <PoolIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No pools yet. Create your first folder to organize candidates.
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {pools.map((pool, index) => {
              const selected = pool.id === selectedPoolId;
              return (
                <motion.div
                  key={pool.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <ListItemButton
                    selected={selected}
                    onClick={() => onSelectPool(pool.id)}
                    sx={{
                      borderRadius: 2,
                      mb: 0.5,
                      border: selected ? '1px solid rgba(10,102,194,0.35)' : '1px solid transparent',
                      bgcolor: selected ? 'rgba(10,102,194,0.1)' : 'transparent',
                      '&.Mui-selected': {
                        bgcolor: 'rgba(10,102,194,0.1)',
                        '&:hover': { bgcolor: 'rgba(10,102,194,0.14)' },
                      },
                    }}
                    secondaryAction={
                      <Box sx={{ display: 'flex' }}>
                        <Tooltip title="Edit pool">
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditPool(pool);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete pool">
                          <IconButton
                            edge="end"
                            size="small"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeletePool(pool);
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    }
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 6 }}>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: selected ? 700 : 600, flex: 1 }}
                            noWrap
                          >
                            {pool.name}
                          </Typography>
                          <Chip
                            label={pool.candidate_count ?? 0}
                            size="small"
                            sx={{
                              height: 22,
                              minWidth: 28,
                              fontWeight: 700,
                              bgcolor: selected ? '#0A66C2' : 'rgba(148,163,184,0.2)',
                              color: selected ? '#fff' : 'text.secondary',
                            }}
                          />
                        </Box>
                      }
                      secondary={
                        pool.description ? (
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {pool.description}
                          </Typography>
                        ) : null
                      }
                    />
                  </ListItemButton>
                </motion.div>
              );
            })}
          </List>
        )}
      </Box>
    </Box>
  );
};
