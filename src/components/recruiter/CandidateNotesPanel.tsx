import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  IconButton,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Notes as NotesIcon,
  Save as SaveIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import type { CandidateNote } from '@types';
import { candidateNoteService } from '@services/candidateNotes';

interface CandidateNotesPanelProps {
  applicationId: string;
  candidateId: string;
  recruiterId: string;
}

const MotionBox = motion(Box);

export const CandidateNotesPanel: React.FC<CandidateNotesPanelProps> = ({
  applicationId,
  candidateId,
  recruiterId,
}) => {
  const [notes, setNotes] = useState<CandidateNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CandidateNote | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await candidateNoteService.getApplicationNotes(applicationId);
      setNotes(data);
    } catch (err) {
      console.error('Error loading notes:', err);
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    if (applicationId) {
      loadNotes();
    }
  }, [applicationId, loadNotes]);

  const handleAddNote = async () => {
    const trimmed = newNote.trim();
    if (!trimmed) {
      toast.error('Please enter a note');
      return;
    }

    setAdding(true);
    try {
      const created = await candidateNoteService.createNote({
        applicationId,
        candidateId,
        recruiterId,
        note: trimmed,
      });
      setNotes((prev) => [created, ...prev]);
      setNewNote('');
      toast.success('Note added');
    } catch (err) {
      console.error('Error adding note:', err);
      toast.error('Failed to add note');
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (note: CandidateNote) => {
    setEditingId(note.id);
    setEditText(note.note);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleSaveEdit = async (noteId: string) => {
    const trimmed = editText.trim();
    if (!trimmed) {
      toast.error('Note cannot be empty');
      return;
    }

    setSavingEdit(true);
    try {
      const updated = await candidateNoteService.updateNote(noteId, trimmed);
      setNotes((prev) => prev.map((n) => (n.id === noteId ? updated : n)));
      cancelEdit();
      toast.success('Note updated');
    } catch (err) {
      console.error('Error updating note:', err);
      toast.error('Failed to update note');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await candidateNoteService.deleteNote(deleteTarget.id);
      setNotes((prev) => prev.filter((n) => n.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success('Note deleted');
    } catch (err) {
      console.error('Error deleting note:', err);
      toast.error('Failed to delete note');
    } finally {
      setDeleting(false);
    }
  };

  const getAuthorName = (note: CandidateNote) =>
    note.recruiter?.hr_name || note.recruiter?.company_name || 'Recruiter';

  const formatNoteDate = (iso: string) => format(new Date(iso), 'dd MMM yyyy');
  const formatNoteTime = (iso: string) => format(new Date(iso), 'hh:mm a');

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <NotesIcon color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Recruiter Notes
        </Typography>
        {notes.length > 0 && (
          <Typography
            variant="caption"
            sx={{
              ml: 1,
              px: 1,
              py: 0.25,
              borderRadius: 1,
              bgcolor: 'rgba(99, 102, 241, 0.1)',
              color: '#6366f1',
              fontWeight: 600,
            }}
          >
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
          </Typography>
        )}
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Private notes visible only to you. Track impressions, salary expectations, and hiring decisions.
      </Typography>

      {/* Add note */}
      <Box
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 2,
          border: '1px solid rgba(148, 163, 184, 0.24)',
          bgcolor: 'rgba(99, 102, 241, 0.04)',
        }}
      >
        <TextField
          fullWidth
          multiline
          minRows={3}
          maxRows={8}
          placeholder="e.g. Strong React Developer, Good communication skills, Expected salary high…"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          disabled={adding}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': { bgcolor: 'background.paper' },
          }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={adding ? <CircularProgress size={18} color="inherit" /> : <AddIcon />}
            onClick={handleAddNote}
            disabled={adding || !newNote.trim()}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            {adding ? 'Adding…' : 'Add Note'}
          </Button>
        </Box>
      </Box>

      {/* Timeline */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      ) : notes.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 4,
            px: 2,
            borderRadius: 2,
            border: '1px dashed rgba(148, 163, 184, 0.4)',
            bgcolor: 'rgba(0,0,0,0.02)',
          }}
        >
          <NotesIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            No notes yet. Add your first observation above.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ position: 'relative', pl: { xs: 0, sm: 1 } }}>
          <Box
            sx={{
              position: 'absolute',
              left: { xs: 19, sm: 27 },
              top: 8,
              bottom: 8,
              width: 2,
              bgcolor: 'rgba(99, 102, 241, 0.2)',
              borderRadius: 1,
              display: { xs: 'none', sm: 'block' },
            }}
          />
          <AnimatePresence initial={false}>
            {notes.map((note, index) => {
              const isEditing = editingId === note.id;
              const authorName = getAuthorName(note);
              const wasEdited = note.updated_at !== note.created_at;

              return (
                <MotionBox
                  key={note.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, delay: index * 0.04 }}
                  sx={{
                    display: 'flex',
                    gap: 2,
                    mb: 2.5,
                    position: 'relative',
                  }}
                >
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      flexShrink: 0,
                      bgcolor: '#6366f1',
                      fontSize: 16,
                      fontWeight: 700,
                      display: { xs: 'none', sm: 'flex' },
                    }}
                  >
                    {authorName.charAt(0).toUpperCase()}
                  </Avatar>

                  <Box
                    sx={{
                      flex: 1,
                      p: 2,
                      borderRadius: 2,
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      bgcolor: 'background.paper',
                      boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)',
                      transition: 'box-shadow 0.2s',
                      '&:hover': {
                        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: 1,
                        mb: 1.5,
                        flexWrap: 'wrap',
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {authorName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatNoteDate(note.created_at)} · {formatNoteTime(note.created_at)}
                          {wasEdited && (
                            <Box component="span" sx={{ ml: 0.5, fontStyle: 'italic' }}>
                              (edited {formatNoteDate(note.updated_at)})
                            </Box>
                          )}
                        </Typography>
                      </Box>
                      {note.recruiter_id === recruiterId && !isEditing && (
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Edit note">
                            <IconButton size="small" onClick={() => startEdit(note)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete note">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteTarget(note)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                    </Box>

                    {isEditing ? (
                      <Box>
                        <TextField
                          fullWidth
                          multiline
                          minRows={2}
                          maxRows={6}
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          disabled={savingEdit}
                          sx={{ mb: 1.5 }}
                        />
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Button
                            size="small"
                            startIcon={<CloseIcon />}
                            onClick={cancelEdit}
                            disabled={savingEdit}
                            sx={{ textTransform: 'none' }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={
                              savingEdit ? (
                                <CircularProgress size={14} color="inherit" />
                              ) : (
                                <SaveIcon />
                              )
                            }
                            onClick={() => handleSaveEdit(note.id)}
                            disabled={savingEdit || !editText.trim()}
                            sx={{ textTransform: 'none', fontWeight: 600 }}
                          >
                            Save
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      <Typography
                        variant="body2"
                        sx={{
                          lineHeight: 1.7,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          color: 'text.primary',
                        }}
                      >
                        {note.note}
                      </Typography>
                    )}
                  </Box>
                </MotionBox>
              );
            })}
          </AnimatePresence>
        </Box>
      )}

      {/* Delete confirmation */}
      <Dialog
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Note</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            This note will be permanently removed. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
