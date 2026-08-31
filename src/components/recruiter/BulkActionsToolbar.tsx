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
        border: '1px solid rgba(96, 165, 250, 0.26)',
        borderRadius: 2.5,
        overflow: 'visible',
        boxShadow: '0 16px 38px rgba(15, 45, 85, 0.1)',
        background: 'linear-gradient(145deg, #ffffff 0%, #F4F8FF 100%)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, px: { xs: 1.25, md: 1.5 }, py: 1, borderBottom: '1px solid #E4ECF6', background: 'linear-gradient(90deg, rgba(220,235,255,0.62), rgba(255,255,255,0.5))', borderRadius: '10px 10px 0 0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
          <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: selectedCount > 0 ? '#0E9F8E' : '#94A3B8', boxShadow: selectedCount > 0 ? '0 0 0 4px rgba(14,159,142,0.12)' : 'none' }} />
          <Typography sx={{ color: '#16325C', fontSize: '0.72rem', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Candidate actions</Typography>
        </Box>
        <Typography sx={{ color: '#71839B', fontSize: '0.68rem' }}>{selectedCount > 0 ? 'Choose an action for selected candidates' : 'Select candidates to enable actions'}</Typography>
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'minmax(0, 1fr)',
            sm: 'repeat(2, minmax(0, 1fr))',
            md: 'repeat(4, minmax(120px, 1fr))',
            lg: 'repeat(6, minmax(120px, 1fr))',
          },
          alignItems: 'center',
          gap: 0.75,
          p: { xs: 1, md: 1 },
          minWidth: 0,
          '& .MuiButton-root': {
            minHeight: 36,
            py: 0.55,
            px: 1,
            fontSize: 11,
            lineHeight: 1.15,
            whiteSpace: 'nowrap',
            borderRadius: 1.5,
            borderColor: '#C9D8EA',
          },
          '& .MuiButton-startIcon': {
            mr: 0.5,
            '& svg': { fontSize: 16 },
          },
          '& .MuiInputBase-root': {
            minHeight: 36,
            fontSize: 11,
            borderRadius: 1.5,
          },
          '& .MuiInputBase-input': {
            py: 0.6,
          },
          '& .MuiInputLabel-root': {
            fontSize: 12,
          },
          '& .MuiButton-outlined': {
            color: '#28508A',
            backgroundColor: '#FFFFFF',
            '&:hover': { backgroundColor: '#EAF3FF', borderColor: '#5B8CFF' },
          },
          '& .MuiButton-text': {
            color: '#54708F',
            '&:hover': { backgroundColor: '#EAF3FF', color: '#28508A' },
          },
          '& .MuiButton-root.Mui-disabled': {
            color: '#9AA8B8',
            borderColor: '#D9E2EC',
            backgroundColor: '#F8FAFC',
            opacity: 1,
          },
          '& .MuiInputBase-root.Mui-disabled': {
            color: '#8A99AA',
            backgroundColor: '#F8FAFC',
          },
        }}
      >
        <Chip
          color="primary"
          label={`${selectedCount} ${selectedCount === 1 ? 'Candidate' : 'Candidates'} Selected`}
          sx={{ fontWeight: 900, borderRadius: 1.5, height: 36, width: '100%', '& .MuiChip-label': { px: 1, fontSize: 11 } }}
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
