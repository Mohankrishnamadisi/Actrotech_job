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
        mb: 2,
        border: '1px solid rgba(14, 116, 144, 0.16)',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', p: 1.5, bgcolor: '#fff' }}>
        <Chip
          color="primary"
          label={`${selectedCount} ${selectedCount === 1 ? 'Candidate' : 'Candidates'} Selected`}
          sx={{ fontWeight: 800, borderRadius: 1 }}
        />
        <Tooltip title="Shortlist selected candidates">
          <span>
            <Button disabled={disabled} startIcon={<ShortlistIcon />} variant="contained" onClick={() => onAction({ type: 'shortlist' })}>
              Shortlist
            </Button>
          </span>
        </Tooltip>
        <Tooltip title="Reject selected candidates">
          <span>
            <Button disabled={disabled} color="error" startIcon={<RejectIcon />} variant="outlined" onClick={() => onAction({ type: 'reject' })}>
              Reject
            </Button>
          </span>
        </Tooltip>
        <FormControl size="small" sx={{ minWidth: 190 }} disabled={disabled}>
          <InputLabel>ATS Stage</InputLabel>
          <Select value={stage} label="ATS Stage" onChange={(event) => setStage(event.target.value as AtsStage)}>
            {ATS_STAGES.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
          </Select>
        </FormControl>
        <Button disabled={disabled} startIcon={<StageIcon />} variant="outlined" onClick={() => onAction({ type: 'move_stage', stage })}>
          Move
        </Button>
        <FormControl size="small" sx={{ minWidth: 210 }} disabled={disabled}>
          <InputLabel>Tags</InputLabel>
          <Select
            multiple
            value={selectedTags}
            input={<OutlinedInput label="Tags" />}
            renderValue={(selected) => selected.join(', ')}
            onChange={(event) => setSelectedTags(typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value)}
          >
            {tagOptions.map((tag) => <MenuItem key={tag} value={tag}>{tag}</MenuItem>)}
          </Select>
        </FormControl>
        <Button disabled={disabled || selectedTags.length === 0} startIcon={<TagIcon />} variant="outlined" onClick={() => onAction({ type: 'add_tags', values: selectedTags })}>
          Add Tags
        </Button>
        <Button disabled={disabled || selectedTags.length === 0} startIcon={<RemoveIcon />} variant="text" onClick={() => onAction({ type: 'remove_tags', values: selectedTags })}>
          Remove Tags
        </Button>
        <FormControl size="small" sx={{ minWidth: 230 }} disabled={disabled}>
          <InputLabel>Talent Pool</InputLabel>
          <Select
            multiple
            value={selectedPools}
            input={<OutlinedInput label="Talent Pool" />}
            renderValue={(selected) => selected.join(', ')}
            onChange={(event) => setSelectedPools(typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value)}
          >
            {poolOptions.map((pool) => <MenuItem key={pool} value={pool}>{pool}</MenuItem>)}
          </Select>
        </FormControl>
        <Button disabled={disabled || selectedPools.length === 0} startIcon={<PoolIcon />} variant="outlined" onClick={() => onAction({ type: 'add_pool', values: selectedPools })}>
          Add Pool
        </Button>
        <Button disabled={disabled || selectedPools.length === 0} startIcon={<RemoveIcon />} variant="text" onClick={() => onAction({ type: 'remove_pool', values: selectedPools })}>
          Remove Pool
        </Button>
        <Button disabled={disabled} startIcon={<MessageIcon />} variant="outlined" onClick={() => onAction({ type: 'message' })}>
          Message
        </Button>
        <Button disabled={disabled} startIcon={<ExportIcon />} variant="outlined" onClick={() => onAction({ type: 'export_csv' })}>
          CSV
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button disabled={processing || selectedCount === 0} onClick={onClear}>Deselect All</Button>
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
