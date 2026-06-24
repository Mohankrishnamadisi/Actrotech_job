import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Archive as PoolIcon,
  Cancel as RejectIcon,
  Download as ExportIcon,
  Label as TagIcon,
  Mail as MessageIcon,
  PersonAdd as ShortlistIcon,
  PlaylistAddCheck as StageIcon,
  RemoveCircleOutline as RemoveIcon,
} from '@mui/icons-material';
import {
  ATS_STAGES,
  RECRUITER_TAG_PRESETS,
  TALENT_POOL_PRESETS,
  type AtsStage,
} from './bulkActionsApi';

export type BulkToolbarAction =
  | { type: 'shortlist' }
  | { type: 'reject' }
  | { type: 'move_stage'; stage: AtsStage }
  | { type: 'add_tags'; values: string[] }
  | { type: 'remove_tags'; values: string[] }
  | { type: 'add_pool'; values: string[] }
  | { type: 'remove_pool'; values: string[] }
  | { type: 'message' }
  | { type: 'export_csv' };

interface BulkActionsToolbarProps {
  selectedCount: number;
  availableTags: string[];
  availablePools: string[];
  processing: boolean;
  onAction: (action: BulkToolbarAction) => void;
  onClear: () => void;
}

const uniqueOptions = (values: string[], presets: readonly string[]) =>
  Array.from(new Set([...presets, ...values].map((value) => value.trim()).filter(Boolean)));

export const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
  selectedCount,
  availableTags,
  availablePools,
  processing,
  onAction,
  onClear,
}) => {
  const [stage, setStage] = useState<AtsStage>('Screening');
  const [selectedTags, setSelectedTags] = useState<string[]>(['React Expert']);
  const [selectedPools, setSelectedPools] = useState<string[]>(['Frontend Developers']);

  const tagOptions = useMemo(() => uniqueOptions(availableTags, RECRUITER_TAG_PRESETS), [availableTags]);
  const poolOptions = useMemo(() => uniqueOptions(availablePools, TALENT_POOL_PRESETS), [availablePools]);
  const disabled = selectedCount === 0 || processing;

  return (
    <Paper
      elevation={6}
      sx={{
        position: 'sticky',
        top: 12,
        zIndex: 10,
        mb: 1.25,
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        border: '1px solid rgba(14, 116, 144, 0.14)',
        borderRadius: 2,
        overflow: 'visible',
        boxShadow: '0 14px 38px rgba(15, 23, 42, 0.09)',
        background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'minmax(0, 1fr)',
            sm: 'repeat(2, minmax(0, 1fr))',
            md: 'repeat(6, minmax(72px, 1fr))',
            lg: 'repeat(8, minmax(68px, 1fr))',
            xl: 'repeat(10, minmax(68px, 1fr))',
          },
          alignItems: 'center',
          gap: 0.75,
          p: { xs: 1, md: 1 },
          minWidth: 0,
          '& .MuiButton-root': {
            minHeight: 32,
            py: 0.4,
            px: 0.8,
            fontSize: 12,
            lineHeight: 1.15,
            whiteSpace: 'nowrap',
          },
          '& .MuiButton-startIcon': {
            mr: 0.5,
            '& svg': { fontSize: 16 },
          },
          '& .MuiInputBase-root': {
            minHeight: 32,
            fontSize: 12,
          },
          '& .MuiInputBase-input': {
            py: 0.6,
          },
          '& .MuiInputLabel-root': {
            fontSize: 12,
          },
        }}
      >
        <Chip
          color="primary"
          label={`${selectedCount} ${selectedCount === 1 ? 'Candidate' : 'Candidates'} Selected`}
          sx={{ fontWeight: 900, borderRadius: 1, height: 32, width: '100%', '& .MuiChip-label': { px: 1, fontSize: 12 } }}
        />
        <Tooltip title="Shortlist selected candidates">
          <span>
            <Button fullWidth disabled={disabled} startIcon={<ShortlistIcon />} variant="contained" onClick={() => onAction({ type: 'shortlist' })}>
              Shortlist
            </Button>
          </span>
        </Tooltip>
        <Tooltip title="Reject selected candidates">
          <span>
            <Button fullWidth disabled={disabled} color="error" startIcon={<RejectIcon />} variant="outlined" onClick={() => onAction({ type: 'reject' })}>
              Reject
            </Button>
          </span>
        </Tooltip>
        <FormControl fullWidth size="small" disabled={disabled}>
          <InputLabel>ATS Stage</InputLabel>
          <Select value={stage} label="ATS Stage" onChange={(event) => setStage(event.target.value as AtsStage)}>
            {ATS_STAGES.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
          </Select>
        </FormControl>
        <Button fullWidth disabled={disabled} startIcon={<StageIcon />} variant="outlined" onClick={() => onAction({ type: 'move_stage', stage })}>
          Move
        </Button>
        <FormControl fullWidth size="small" disabled={disabled}>
          <InputLabel>Tags</InputLabel>
          <Select
            multiple
            value={selectedTags}
            input={<OutlinedInput label="Tags" />}
            renderValue={(selected) => selected.join(', ')}
            onChange={(event) => setSelectedTags(typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value)}
            sx={{ minWidth: 0 }}
          >
            {tagOptions.map((tag) => <MenuItem key={tag} value={tag}>{tag}</MenuItem>)}
          </Select>
        </FormControl>
        <Button fullWidth disabled={disabled || selectedTags.length === 0} startIcon={<TagIcon />} variant="outlined" onClick={() => onAction({ type: 'add_tags', values: selectedTags })}>
          Add Tags
        </Button>
        <Button fullWidth disabled={disabled || selectedTags.length === 0} startIcon={<RemoveIcon />} variant="text" onClick={() => onAction({ type: 'remove_tags', values: selectedTags })}>
          Remove Tags
        </Button>
        <FormControl fullWidth size="small" disabled={disabled}>
          <InputLabel>Talent Pool</InputLabel>
          <Select
            multiple
            value={selectedPools}
            input={<OutlinedInput label="Talent Pool" />}
            renderValue={(selected) => selected.join(', ')}
            onChange={(event) => setSelectedPools(typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value)}
            sx={{ minWidth: 0 }}
          >
            {poolOptions.map((pool) => <MenuItem key={pool} value={pool}>{pool}</MenuItem>)}
          </Select>
        </FormControl>
        <Button fullWidth disabled={disabled || selectedPools.length === 0} startIcon={<PoolIcon />} variant="outlined" onClick={() => onAction({ type: 'add_pool', values: selectedPools })}>
          Add Pool
        </Button>
        <Button fullWidth disabled={disabled || selectedPools.length === 0} startIcon={<RemoveIcon />} variant="text" onClick={() => onAction({ type: 'remove_pool', values: selectedPools })}>
          Remove Pool
        </Button>
        <Button fullWidth disabled={disabled} startIcon={<MessageIcon />} variant="outlined" onClick={() => onAction({ type: 'message' })}>
          Message
        </Button>
        <Button fullWidth disabled={disabled} startIcon={<ExportIcon />} variant="outlined" onClick={() => onAction({ type: 'export_csv' })}>
          CSV
        </Button>
        <Box sx={{ display: 'none' }} />
        <Button fullWidth disabled={processing || selectedCount === 0} onClick={onClear}>Deselect All</Button>
        {processing && (
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={18} />
            <Typography variant="caption" color="text.secondary">Working</Typography>
          </Stack>
        )}
      </Box>
    </Paper>
  );
};
