import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Chip,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { DeleteOutline, DragIndicator, StickyNote2 } from '@mui/icons-material';
import { LearningEditor } from './LearningEditor';
import { LearningVideo } from '@services/learningVideos';
import { type LearningNote } from '@services/learningNotes';

interface EnhancedLearningNotesPanelProps {
  selectedVideo?: LearningVideo | null;
  noteTitle: string;
  noteContent: string;
  onNoteTitleChange: (title: string) => void;
  onNoteChange: (content: string) => void;
  onAddTimestamp: () => void;
  onClearNote: () => void;
  isSavingNote?: boolean;
  lastSavedAt?: number | null;
  notesHistory: LearningNote[];
  activeNoteId: string | null;
  onOpenHistoryNote: (noteId: string) => void;
  onReorderHistory: (orderedNoteIds: string[]) => void;
  userId: string;
  onCreateNewNote: () => void;
  onSaveNote: () => void;
  onDeleteHistoryNote: (noteId: string) => void;
}

const toPlainText = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const formatSavedAt = (timestamp: number) => {
  const diff = Date.now() - timestamp;
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export const EnhancedLearningNotesPanel: React.FC<EnhancedLearningNotesPanelProps> = ({
  selectedVideo,
  noteTitle,
  noteContent,
  onNoteTitleChange,
  onNoteChange,
  onAddTimestamp,
  onClearNote,
  isSavingNote = false,
  lastSavedAt,
  notesHistory,
  activeNoteId,
  onOpenHistoryNote,
  onReorderHistory,
  userId,
  onCreateNewNote,
  onSaveNote,
  onDeleteHistoryNote,
}) => {
  const orderStorageKey = `actro_learning_notes_order:${userId}`;
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [orderedIds, setOrderedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!userId) {
      setOrderedIds([]);
      return;
    }
    try {
      const raw = localStorage.getItem(orderStorageKey);
      const parsed = raw ? (JSON.parse(raw) as string[]) : [];
      setOrderedIds(Array.isArray(parsed) ? parsed : []);
    } catch {
      setOrderedIds([]);
    }
  }, [orderStorageKey, userId]);

  const orderedHistory = useMemo(() => {
    if (!notesHistory.length) return [];
    const rank = new Map(orderedIds.map((id, index) => [id, index]));
    const rows = [...notesHistory];
    rows.sort((a, b) => {
      const aRank = rank.has(a.id) ? (rank.get(a.id) as number) : Number.MAX_SAFE_INTEGER;
      const bRank = rank.has(b.id) ? (rank.get(b.id) as number) : Number.MAX_SAFE_INTEGER;
      if (aRank !== bRank) return aRank - bRank;
      return b.updatedAt - a.updatedAt;
    });
    return rows;
  }, [notesHistory, orderedIds]);

  const persistOrder = (ids: string[]) => {
    setOrderedIds(ids);
    try {
      localStorage.setItem(orderStorageKey, JSON.stringify(ids));
    } catch {
      // Ignore storage failure and continue with in-memory order.
    }
  };

  const handleDragStart = (noteId: string) => {
    setDraggedId(noteId);
  };

  const handleDrop = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    const currentIds = orderedHistory.map((item) => item.id);
    const fromIndex = currentIds.indexOf(draggedId);
    const toIndex = currentIds.indexOf(targetId);
    if (fromIndex < 0 || toIndex < 0) return;
    const next = [...currentIds];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    persistOrder(next);
    onReorderHistory(next);
    setDraggedId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        minHeight: 0,
        borderRadius: 3,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        overflow: 'hidden',
        bgcolor: 'background.paper',
        boxShadow: (theme) =>
          theme.palette.mode === 'dark'
            ? '0 4px 16px rgba(0, 0, 0, 0.3)'
            : '0 4px 16px rgba(15, 23, 42, 0.08)',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 1.5,
          py: 1.2,
          flexShrink: 0,
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <StickyNote2 sx={{ fontSize: 19, color: 'primary.main' }} />
          <Typography fontWeight={800} sx={{ fontSize: '0.9rem' }}>
            Learning Notes
          </Typography>
          <Box sx={{ flex: 1 }} />
          {isSavingNote && (
            <Typography variant="caption" sx={{ fontSize: '0.68rem', color: 'primary.main', fontWeight: 700 }}>
              Saving…
            </Typography>
          )}
          {!isSavingNote && lastSavedAt && (
            <Typography variant="caption" sx={{ fontSize: '0.68rem', color: 'success.main', fontWeight: 700 }}>
              ✓ Saved
            </Typography>
          )}
        </Stack>

        <TextField
          size="small"
          fullWidth
          value={noteTitle}
          onChange={(event) => onNoteTitleChange(event.target.value)}
          placeholder="Note title — e.g. React hooks class 2"
          disabled={!selectedVideo}
          sx={{
            '& .MuiInputBase-root': {
              bgcolor: 'background.paper',
              borderRadius: 1.5,
              fontSize: '0.85rem',
            },
            '& .MuiInputBase-input': { py: 0.85 },
          }}
        />
      </Box>

      {/* Editor */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
        <LearningEditor
          content={noteContent}
          onChange={onNoteChange}
          onTimestamp={onAddTimestamp}
          onClear={onClearNote}
          onSave={onSaveNote}
          onNewChat={onCreateNewNote}
          disabled={!selectedVideo}
          isSaving={isSavingNote}
        />
      </Box>

      <Box
        sx={{
          p: 1.1,
          flexShrink: 0,
          borderTop: (theme) => `1px solid ${theme.palette.divider}`,
          bgcolor: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(15, 23, 42, 0.02)',
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.7 }}>
          <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Saved Records
          </Typography>
          <Chip size="small" label={orderedHistory.length} sx={{ height: 20, fontWeight: 700, fontSize: '0.7rem' }} />
        </Stack>

        <Box
          sx={{
            maxHeight: 156,
            overflowY: 'auto',
            mx: -0.4,
            px: 0.4,
          }}
        >
          {orderedHistory.length === 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', py: 0.5 }}>
              No saved records yet.
            </Typography>
          )}

          <List disablePadding dense sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {orderedHistory.map((note) => {
              const isActive = activeNoteId === note.id;
              const preview = toPlainText(note.content || '');
              return (
                <ListItemButton
                  key={note.id}
                  draggable
                  disableRipple
                  selected={isActive}
                  onDragStart={() => handleDragStart(note.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => handleDrop(note.id)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onOpenHistoryNote(note.id)}
                  sx={{
                    py: 0.6,
                    pl: 0.6,
                    pr: 0.6,
                    gap: 0.6,
                    borderRadius: 1.5,
                    alignItems: 'center',
                    border: (theme) =>
                      `1px solid ${isActive ? theme.palette.primary.main : theme.palette.divider}`,
                    opacity: draggedId === note.id ? 0.5 : 1,
                    transition: 'border-color 0.18s ease, background-color 0.18s ease',
                    '&.Mui-selected': {
                      bgcolor: (theme) =>
                        theme.palette.mode === 'dark' ? 'rgba(25, 103, 210, 0.14)' : 'rgba(25, 103, 210, 0.07)',
                    },
                    '&:hover': { borderColor: 'primary.main' },
                    '&:hover .note-drag, &:hover .note-delete': { opacity: 1 },
                  }}
                >
                  <DragIndicator
                    className="note-drag"
                    sx={{
                      fontSize: 16,
                      color: 'text.disabled',
                      cursor: 'grab',
                      opacity: { xs: 1, md: 0.25 },
                      transition: 'opacity 0.18s ease',
                    }}
                  />

                  <ListItemText
                    sx={{ my: 0, minWidth: 0 }}
                    primary={
                      <Stack direction="row" alignItems="center" spacing={0.7} sx={{ minWidth: 0 }}>
                        <Typography
                          noWrap
                          sx={{
                            fontSize: '0.79rem',
                            fontWeight: 700,
                            lineHeight: 1.35,
                            color: isActive ? 'primary.main' : 'text.primary',
                          }}
                        >
                          {note.title || 'Learning Note'}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ fontSize: '0.66rem', color: 'text.secondary', flexShrink: 0, whiteSpace: 'nowrap' }}
                        >
                          {formatSavedAt(note.updatedAt)}
                        </Typography>
                      </Stack>
                    }
                    secondary={
                      <Typography
                        noWrap
                        variant="caption"
                        sx={{ display: 'block', fontSize: '0.7rem', color: 'text.secondary', lineHeight: 1.35 }}
                      >
                        {preview || 'No note content'}
                      </Typography>
                    }
                  />

                  <Tooltip title="Delete note">
                    <IconButton
                      className="note-delete"
                      size="small"
                      aria-label="Delete note"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeleteHistoryNote(note.id);
                      }}
                      sx={{
                        flexShrink: 0,
                        width: 26,
                        height: 26,
                        color: 'text.secondary',
                        opacity: { xs: 1, md: 0.35 },
                        transition: 'opacity 0.18s ease, color 0.18s ease',
                        '&:hover': { color: 'error.main', bgcolor: 'error.light' },
                      }}
                    >
                      <DeleteOutline sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </ListItemButton>
              );
            })}
          </List>
        </Box>
      </Box>
    </Paper>
  );
};
