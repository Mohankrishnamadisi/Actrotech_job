import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Autocomplete,
  TextField,
  Button,
  CircularProgress,
} from '@mui/material';
import type { CandidateTag } from '@types';
import { candidateTagService } from '@services/candidateTags';
import { CandidateTagChip } from './CandidateTagChips';
import toast from 'react-hot-toast';

interface CandidateTagAssignerProps {
  candidateId: string;
  recruiterId: string;
  availableTags: CandidateTag[];
  onTagsChange?: () => void;
}

export const CandidateTagAssigner: React.FC<CandidateTagAssignerProps> = ({
  candidateId,
  recruiterId,
  availableTags,
  onTagsChange,
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assignedTagIds, setAssignedTagIds] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<CandidateTag[]>([]);

  useEffect(() => {
    if (candidateId) {
      loadAssignments();
    }
  }, [candidateId]);

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const assignments = await candidateTagService.getCandidateTagAssignments(candidateId);
      const tagIds = assignments.map((a) => a.tag_id);
      setAssignedTagIds(tagIds);
      setSelectedTags(
        availableTags.filter((tag) => tagIds.includes(tag.id))
      );
    } catch (err) {
      console.error('Error loading tag assignments:', err);
      toast.error('Failed to load candidate tags');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSelectedTags(availableTags.filter((tag) => assignedTagIds.includes(tag.id)));
  }, [availableTags, assignedTagIds]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const newTagIds = selectedTags.map((t) => t.id);
      await candidateTagService.setCandidateTags(candidateId, newTagIds, recruiterId);
      setAssignedTagIds(newTagIds);
      toast.success('Tags updated');
      onTagsChange?.();
    } catch (err) {
      console.error('Error saving tags:', err);
      toast.error('Failed to update tags');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges =
    selectedTags.length !== assignedTagIds.length ||
    selectedTags.some((t) => !assignedTagIds.includes(t.id));

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        Candidate Tags
      </Typography>
      <Autocomplete
        multiple
        options={availableTags}
        value={selectedTags}
        onChange={(_, value) => setSelectedTags(value)}
        getOptionLabel={(option) => option.name}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => {
            const { key, ...chipProps } = getTagProps({ index });
            return (
              <CandidateTagChip key={key} tag={option} onDelete={chipProps.onDelete as () => void} />
            );
          })
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label="Assign tags"
            placeholder={availableTags.length ? 'Select tags…' : 'Create tags first'}
            disabled={availableTags.length === 0}
          />
        )}
        sx={{ mb: 2 }}
      />
      {availableTags.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          No tags yet. Use &quot;Manage Tags&quot; to create color-coded labels for your candidates.
        </Typography>
      )}
      <Button
        variant="contained"
        onClick={handleSave}
        disabled={saving || !hasChanges || availableTags.length === 0}
        sx={{ textTransform: 'none', fontWeight: 600 }}
        endIcon={saving ? <CircularProgress size={18} color="inherit" /> : undefined}
      >
        {saving ? 'Saving…' : 'Save Tags'}
      </Button>
    </Box>
  );
};
