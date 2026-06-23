import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  LocalOffer as TagIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { CANDIDATE_TAG_COLORS } from '@constants/index';
import type { CandidateTag } from '@types';
import { candidateTagService } from '@services/candidateTags';
import { CandidateTagChip } from './CandidateTagChips';

interface TagManagerProps {
  recruiterId: string;
  /** When true, renders inline card instead of dialog trigger */
  inline?: boolean;
  onTagsChange?: () => void;
}

interface TagFormState {
  name: string;
  color: string;
}

const emptyForm = (): TagFormState => ({
  name: '',
  color: CANDIDATE_TAG_COLORS[0],
});

export const TagManager: React.FC<TagManagerProps> = ({ recruiterId, inline = false, onTagsChange }) => {
  const [open, setOpen] = useState(inline);
  const [tags, setTags] = useState<CandidateTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<TagFormState>(emptyForm());
  const [editingTag, setEditingTag] = useState<CandidateTag | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<CandidateTag | null>(null);

  useEffect(() => {
    if (open || inline) {
      fetchTags();
    }
  }, [open, inline, recruiterId]);

  const fetchTags = async () => {
    setLoading(true);
    try {
      const data = await candidateTagService.getRecruiterTags(recruiterId);
      setTags(data);
    } catch (err) {
      console.error('Error fetching tags:', err);
      toast.error('Failed to load tags');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(emptyForm());
    setEditingTag(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setOpen(true);
  };

  const handleEdit = (tag: CandidateTag) => {
    setEditingTag(tag);
    setForm({ name: tag.name, color: tag.color });
    setOpen(true);
  };

  const handleSave = async () => {
    const trimmed = form.name.trim();
    if (!trimmed) {
      toast.error('Tag name is required');
      return;
    }

    setSaving(true);
    try {
      if (editingTag) {
        await candidateTagService.updateTag(editingTag.id, { name: trimmed, color: form.color });
        toast.success('Tag updated');
      } else {
        await candidateTagService.createTag(recruiterId, { name: trimmed, color: form.color });
        toast.success('Tag created');
      }
      resetForm();
      await fetchTags();
      onTagsChange?.();
    } catch (err: unknown) {
      console.error('Error saving tag:', err);
      const message =
        err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === '23505'
          ? 'A tag with this name already exists'
          : 'Failed to save tag';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tag: CandidateTag) => {
    setSaving(true);
    try {
      await candidateTagService.deleteTag(tag.id);
      toast.success('Tag deleted');
      setDeleteConfirm(null);
      await fetchTags();
      onTagsChange?.();
    } catch (err) {
      console.error('Error deleting tag:', err);
      toast.error('Failed to delete tag');
    } finally {
      setSaving(false);
    }
  };

  const content = (
    <>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Create color-coded tags to organize and filter applicants. Tags are private to your account.
      </Typography>

      {/* Create / Edit form */}
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 2,
          border: '1px solid rgba(148, 163, 184, 0.24)',
          bgcolor: 'rgba(99, 102, 241, 0.04)',
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
          {editingTag ? 'Edit Tag' : 'Create New Tag'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <TextField
            label="Tag name"
            size="small"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            sx={{ flex: '1 1 200px', minWidth: 180 }}
            inputProps={{ maxLength: 50 }}
          />
          <Box sx={{ flex: '1 1 240px' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, display: 'block' }}>
              Color
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {CANDIDATE_TAG_COLORS.map((color) => (
                <Box
                  key={color}
                  onClick={() => setForm((f) => ({ ...f, color }))}
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    bgcolor: color,
                    cursor: 'pointer',
                    border: form.color === color ? '3px solid #1e293b' : '2px solid transparent',
                    boxShadow: form.color === color ? `0 0 0 2px ${color}55` : 'none',
                    transition: 'transform 0.15s',
                    '&:hover': { transform: 'scale(1.1)' },
                  }}
                />
              ))}
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, mt: 2, alignItems: 'center' }}>
          {form.name.trim() && <CandidateTagChip tag={{ name: form.name.trim(), color: form.color }} />}
          <Box sx={{ flex: 1 }} />
          {editingTag && (
            <Button size="small" onClick={resetForm} sx={{ textTransform: 'none' }}>
              Cancel edit
            </Button>
          )}
          <Button
            variant="contained"
            size="small"
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {editingTag ? 'Update Tag' : 'Create Tag'}
          </Button>
        </Box>
      </Box>

      {/* Tag list */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : tags.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
          No tags yet. Create your first tag above.
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {tags.map((tag) => (
            <Box
              key={tag.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1.5,
                borderRadius: 2,
                border: '1px solid rgba(148, 163, 184, 0.2)',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
              }}
            >
              <CandidateTagChip tag={tag} />
              <Box>
                <Tooltip title="Edit">
                  <IconButton size="small" onClick={() => handleEdit(tag)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton size="small" color="error" onClick={() => setDeleteConfirm(tag)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Delete confirmation */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Tag</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Delete &quot;{deleteConfirm?.name}&quot;? This removes it from all assigned candidates.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)} disabled={saving}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            disabled={saving}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );

  if (inline) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <TagIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Manage Candidate Tags
            </Typography>
          </Box>
          {content}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<TagIcon />}
        onClick={handleOpenCreate}
        sx={{ textTransform: 'none', fontWeight: 600 }}
      >
        Manage Tags
      </Button>

      <Dialog open={open} onClose={() => { setOpen(false); resetForm(); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TagIcon color="primary" />
            Manage Candidate Tags
          </Box>
          <IconButton onClick={() => { setOpen(false); resetForm(); }} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>{content}</DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpen(false); resetForm(); }}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
