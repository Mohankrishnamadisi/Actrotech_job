import React, { useCallback, useEffect, useRef } from 'react';
import { useEditor, useEditorState, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import {
  Box,
  Button,
  FormControl,
  IconButton,
  Divider,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { KeyboardArrowDownRounded } from '@mui/icons-material';
import {
  Bold,
  Clock,
  Heading2,
  List,
  ListOrdered,
  Redo as RedoIcon,
  Type,
  Trash2,
  Undo as UndoIcon,
  Italic,
} from 'lucide-react';
import '@styles/tiptapEditor.css';

interface LearningEditorProps {
  content: string;
  onChange: (content: string) => void;
  onTimestamp: () => void;
  onClear: () => void;
  onSave: () => void;
  onNewChat: () => void;
  disabled?: boolean;
  isSaving?: boolean;
}

export const LearningEditor: React.FC<LearningEditorProps> = ({
  content,
  onChange,
  onTimestamp,
  onClear,
  onSave,
  onNewChat,
  disabled = false,
  isSaving = false,
}) => {
  const onChangeRef = useRef(onChange);
  const onSaveRef = useRef(onSave);
  const lastSyncedHtml = useRef(content);
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  onChangeRef.current = onChange;
  onSaveRef.current = onSave;

  /** Pushes editor HTML to the parent immediately. */
  const flush = useCallback((html: string) => {
    if (flushTimer.current) {
      clearTimeout(flushTimer.current);
      flushTimer.current = null;
    }
    lastSyncedHtml.current = html;
    onChangeRef.current(html);
  }, []);

  // Typing stays local and only reaches the page state after a pause, so the
  // heavy Learning page (player, lists) does not re-render on every keystroke.
  const scheduleFlush = useCallback((html: string) => {
    lastSyncedHtml.current = html;
    if (flushTimer.current) clearTimeout(flushTimer.current);
    flushTimer.current = setTimeout(() => {
      flushTimer.current = null;
      onChangeRef.current(html);
    }, 350);
  }, []);

  useEffect(
    () => () => {
      // Unmount can happen when the panel moves into the fullscreen overlay.
      if (flushTimer.current) {
        clearTimeout(flushTimer.current);
        flushTimer.current = null;
        onChangeRef.current(lastSyncedHtml.current);
      }
    },
    []
  );

  const editor = useEditor({
    extensions: [
      TextStyle,
      Color.configure({ types: ['textStyle'] }),
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
    ],
    content,
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    onUpdate: ({ editor }) => {
      scheduleFlush(editor.getHTML());
    },
    onBlur: ({ editor }) => {
      flush(editor.getHTML());
    },
    editable: !disabled,
  });

  useEffect(() => {
    if (!editor) return;
    if (content === lastSyncedHtml.current) return;
    lastSyncedHtml.current = content;
    editor.commands.setContent(content || '', { emitUpdate: false });
  }, [content, editor]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  const toolbarState = useEditorState({
    editor,
    selector: ({ editor: instance }) => {
      if (!instance) return null;
      return {
        bold: instance.isActive('bold'),
        italic: instance.isActive('italic'),
        h1: instance.isActive('heading', { level: 1 }),
        h2: instance.isActive('heading', { level: 2 }),
        h3: instance.isActive('heading', { level: 3 }),
        bulletList: instance.isActive('bulletList'),
        orderedList: instance.isActive('orderedList'),
        color: String(instance.getAttributes('textStyle')?.color || ''),
        canUndo: instance.can().undo(),
        canRedo: instance.can().redo(),
      };
    },
  });

  const handleSave = useCallback(() => {
    if (!editor) return;
    flush(editor.getHTML());
    // Let the flushed content land in page state before the save runs.
    setTimeout(() => onSaveRef.current(), 0);
  }, [editor, flush]);

  const applyHeading = (value: string) => {
    if (!editor) return;
    if (value === 'p') {
      editor.chain().focus().setParagraph().run();
      return;
    }
    const level = Number(value.replace('h', '')) as 1 | 2 | 3;
    editor.chain().focus().toggleHeading({ level }).run();
  };

  const isNoteEmpty = content.replace(/<[^>]+>/g, '').trim().length === 0;

  if (!editor || !toolbarState) {
    return null;
  }

  const isMarkActive = (mark: string): boolean => {
    if (mark === 'bold') return toolbarState.bold;
    if (mark === 'italic') return toolbarState.italic;
    return false;
  };

  const currentHeading = toolbarState.h1 ? 'h1' : toolbarState.h2 ? 'h2' : toolbarState.h3 ? 'h3' : 'p';

  const colorOptions = ['#0f172a', '#1d4ed8', '#065f46', '#b91c1c', '#7e22ce'];
  const currentColor = toolbarState.color;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRadius: 2,
        overflow: 'hidden',
        border: (theme) => `1px solid ${theme.palette.divider}`,
        bgcolor: 'background.paper',
      }}
    >
      {/* Toolbar */}
      <Paper
        elevation={0}
        sx={{
          px: 0.9,
          py: 0.6,
          borderRadius: 0,
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
          display: 'flex',
          gap: 0.15,
          rowGap: 0.4,
          flexWrap: 'wrap',
          alignItems: 'center',
          '& .MuiIconButton-root': { width: 28, height: 28, borderRadius: 1.2 },
        }}
      >
        <Tooltip title="Bold">
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={disabled}
            sx={{
              bgcolor: isMarkActive('bold') ? 'primary.main' : 'transparent',
              color: isMarkActive('bold') ? 'white' : 'inherit',
              '&:hover': {
                bgcolor: isMarkActive('bold') ? 'primary.dark' : 'action.hover',
              },
            }}
          >
            <Bold size={16} />
          </IconButton>
        </Tooltip>

        <Tooltip title="Italic">
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={disabled}
            sx={{
              bgcolor: isMarkActive('italic') ? 'primary.main' : 'transparent',
              color: isMarkActive('italic') ? 'white' : 'inherit',
              '&:hover': {
                bgcolor: isMarkActive('italic') ? 'primary.dark' : 'action.hover',
              },
            }}
          >
            <Italic size={16} />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.35, my: 0.4 }} />

        <FormControl size="small" sx={{ minWidth: 112 }}>
          <Select
            value={currentHeading}
            onChange={(e) => applyHeading(e.target.value)}
            disabled={disabled}
            IconComponent={KeyboardArrowDownRounded}
            sx={{
              height: 28,
              fontSize: '0.75rem',
              borderRadius: 1.2,
              '& .MuiSelect-select': { py: 0.4, pl: 1.1, pr: '26px !important' },
              '& .MuiSelect-icon': {
                fontSize: 18,
                right: 5,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'text.secondary',
                transition: 'transform 0.2s ease',
              },
              '& .MuiSelect-iconOpen': { transform: 'translateY(-50%) rotate(180deg)' },
            }}
          >
            <MenuItem value="p">Paragraph</MenuItem>
            <MenuItem value="h1">Header 1</MenuItem>
            <MenuItem value="h2">Header 2</MenuItem>
            <MenuItem value="h3">Header 3</MenuItem>
          </Select>
        </FormControl>

        <Tooltip title="Header Quick">
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            disabled={disabled}
            sx={{
              bgcolor: toolbarState.h2 ? 'primary.main' : 'transparent',
              color: toolbarState.h2 ? 'white' : 'inherit',
            }}
          >
            <Heading2 size={16} />
          </IconButton>
        </Tooltip>

        <Tooltip title="Bullet List">
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            disabled={disabled}
            sx={{
              bgcolor: toolbarState.bulletList ? 'primary.main' : 'transparent',
              color: toolbarState.bulletList ? 'white' : 'inherit',
              '&:hover': {
                bgcolor: toolbarState.bulletList ? 'primary.dark' : 'action.hover',
              },
            }}
          >
            <List size={16} />
          </IconButton>
        </Tooltip>

        <Tooltip title="Ordered List">
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            disabled={disabled}
            sx={{
              bgcolor: toolbarState.orderedList ? 'primary.main' : 'transparent',
              color: toolbarState.orderedList ? 'white' : 'inherit',
              '&:hover': {
                bgcolor: toolbarState.orderedList ? 'primary.dark' : 'action.hover',
              },
            }}
          >
            <ListOrdered size={16} />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.35, my: 0.4 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
          <Type size={14} color="#64748b" />
          {colorOptions.map((color) => (
            <Tooltip title={`Text color ${color}`} key={color}>
              <IconButton
                size="small"
                onClick={() => editor.chain().focus().setColor(color).run()}
                disabled={disabled}
                sx={{
                  width: '22px !important',
                  height: '22px !important',
                  p: 0,
                  border: `2px solid ${currentColor === color ? '#1d4ed8' : 'transparent'}`,
                }}
              >
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: color,
                    border: '1px solid rgba(148,163,184,0.4)',
                  }}
                />
              </IconButton>
            </Tooltip>
          ))}
          <Tooltip title="Reset color">
            <IconButton
              size="small"
              onClick={() => editor.chain().focus().unsetColor().run()}
              disabled={disabled}
            >
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: 'text.secondary' }}>Aa</Typography>
            </IconButton>
          </Tooltip>
        </Box>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.35, my: 0.4 }} />

        <Tooltip title="Undo">
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={disabled || !toolbarState.canUndo}
          >
            <UndoIcon size={16} />
          </IconButton>
        </Tooltip>

        <Tooltip title="Redo">
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={disabled || !toolbarState.canRedo}
          >
            <RedoIcon size={16} />
          </IconButton>
        </Tooltip>

        <Box sx={{ flex: 1 }} />

        <Tooltip title="Add Timestamp">
          <IconButton
            size="small"
            onClick={onTimestamp}
            disabled={disabled}
            sx={{ color: 'primary.main' }}
          >
            <Clock size={16} />
          </IconButton>
        </Tooltip>

        <Tooltip title="Clear Note">
          <IconButton
            size="small"
            onClick={onClear}
            disabled={disabled || !content}
            sx={{ color: 'error.main' }}
          >
            <Trash2 size={16} />
          </IconButton>
        </Tooltip>
      </Paper>

      {/* Editor Content */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 1.5,
          '& .ProseMirror': {
            outline: 'none',
            minHeight: 240,
            '& h2': {
              fontSize: '1.25rem',
              fontWeight: 700,
              margin: '0.5rem 0',
              lineHeight: 1.4,
            },
            '& h1': {
              fontSize: '1.5rem',
              fontWeight: 800,
              margin: '0.6rem 0',
              lineHeight: 1.3,
            },
            '& h3': {
              fontSize: '1.1rem',
              fontWeight: 700,
              margin: '0.45rem 0',
              lineHeight: 1.35,
            },
            '& p': {
              margin: '0.5rem 0',
              lineHeight: 1.6,
            },
            '& ul, & ol': {
              paddingLeft: '1.5rem',
              margin: '0.5rem 0',
            },
            '& li': {
              margin: '0.25rem 0',
              lineHeight: 1.6,
            },
          },
        }}
      >
        <EditorContent editor={editor} />
      </Box>

      {/* Save Status Footer */}
      {isSaving !== undefined && (
        <Box
          sx={{
            p: 1,
            fontSize: '0.75rem',
            color: 'text.secondary',
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
            borderTop: (theme) => `1px solid ${theme.palette.divider}`,
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
            <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
              {isSaving ? '⏳ Saving...' : '✓ Saved'}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="outlined"
                onClick={onNewChat}
                disabled={disabled || isSaving}
                sx={{ minWidth: 72, fontSize: '0.72rem', py: 0.2, px: 1.1 }}
              >
                New Chat
              </Button>
              <Button
                size="small"
                variant="contained"
                onClick={handleSave}
                disabled={disabled || isSaving || isNoteEmpty}
                sx={{ minWidth: 64, fontSize: '0.72rem', py: 0.2, px: 1.2 }}
              >
                Save
              </Button>
            </Stack>
          </Stack>
        </Box>
      )}
    </Box>
  );
};
