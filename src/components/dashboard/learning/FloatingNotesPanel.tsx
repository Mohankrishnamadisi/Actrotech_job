import React, { useCallback, useRef, useState } from 'react';
import { Box, IconButton, Stack, Tooltip, Typography, useMediaQuery, useTheme } from '@mui/material';
import { motion, useDragControls } from 'framer-motion';
import { CloseRounded, DragIndicatorRounded, MinimizeRounded } from '@mui/icons-material';
import { NotebookPen } from 'lucide-react';

interface FloatingNotesPanelProps {
  /** Element the panel may be dragged inside of. */
  boundsRef: React.RefObject<HTMLElement>;
  title?: string;
  hidden: boolean;
  onMinimize: () => void;
  onClose: () => void;
  children: React.ReactNode;
}

const MIN_WIDTH = 340;
const MIN_HEIGHT = 380;

/** Draggable, resizable glass panel that hosts the real Learning Notes editor. */
export const FloatingNotesPanel: React.FC<FloatingNotesPanelProps> = ({
  boundsRef,
  title,
  hidden,
  onMinimize,
  onClose,
  children,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const [size, setSize] = useState({ width: 420, height: Math.round(window.innerHeight * 0.76) });
  const resizeStart = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const dragControls = useDragControls();

  const handleResizePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.stopPropagation();
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      resizeStart.current = { x: event.clientX, y: event.clientY, width: size.width, height: size.height };
    },
    [size.width, size.height]
  );

  const handleResizePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const start = resizeStart.current;
    if (!start) return;
    // Panel grows to the left, so a leftward drag increases the width.
    const nextWidth = Math.min(760, Math.max(MIN_WIDTH, start.width - (event.clientX - start.x)));
    const nextHeight = Math.min(
      window.innerHeight - 40,
      Math.max(MIN_HEIGHT, start.height + (event.clientY - start.y))
    );
    setSize({ width: nextWidth, height: nextHeight });
  }, []);

  const handleResizePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    resizeStart.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }, []);

  const mobileSheet = isMobile;

  return (
    <Box
      component={motion.div}
      role="dialog"
      aria-label="Learning Notes"
      aria-hidden={hidden}
      drag={!mobileSheet}
      dragListener={false}
      dragControls={dragControls}
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={boundsRef}
      initial={{ opacity: 0, scale: 0.94, y: 14 }}
      animate={{ opacity: hidden ? 0 : 1, scale: hidden ? 0.94 : 1, y: hidden ? 14 : 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      sx={{
        position: 'absolute',
        zIndex: 40,
        display: hidden ? 'none' : 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: mobileSheet ? '20px 20px 0 0' : '18px',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.86)' : 'rgba(255, 255, 255, 0.9)'),
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        boxShadow: '0 24px 60px rgba(2, 6, 23, 0.5)',
        ...(mobileSheet
          ? { left: 0, right: 0, bottom: 0, height: '78vh' }
          : {
              top: '50%',
              right: 20,
              marginTop: `-${Math.round(size.height / 2)}px`,
              width: isTablet ? '45vw' : size.width,
              height: size.height,
              maxHeight: 'calc(100% - 32px)',
            }),
      }}
    >
      {/* Header doubles as the drag handle */}
      <Box
        onPointerDown={(event: React.PointerEvent) => {
          if (mobileSheet) return;
          dragControls.start(event);
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.4,
          py: 1,
          flexShrink: 0,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(15, 23, 42, 0.04)'),
          cursor: mobileSheet ? 'default' : 'grab',
          '&:active': { cursor: mobileSheet ? 'default' : 'grabbing' },
        }}
        data-drag-handle
      >
        {!mobileSheet && <DragIndicatorRounded sx={{ fontSize: 18, color: 'text.disabled' }} />}
        <Box
          sx={{
            width: 26,
            height: 26,
            borderRadius: 1.4,
            display: 'grid',
            placeItems: 'center',
            color: '#fff',
            background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)',
            flexShrink: 0,
          }}
        >
          <NotebookPen size={15} />
        </Box>

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, lineHeight: 1.2 }}>Learning Notes</Typography>
          {title && (
            <Typography noWrap sx={{ fontSize: '0.7rem', color: 'text.secondary', lineHeight: 1.3 }}>
              {title}
            </Typography>
          )}
        </Box>

        <Stack direction="row" spacing={0.2} sx={{ flexShrink: 0 }}>
          <Tooltip title="Minimize">
            <IconButton size="small" aria-label="Minimize notes" onClick={onMinimize}>
              <MinimizeRounded sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Close">
            <IconButton size="small" aria-label="Close notes" onClick={onClose}>
              <CloseRounded sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', p: 1, overflow: 'hidden' }}>{children}</Box>

      {!mobileSheet && (
        <Box
          role="separator"
          aria-label="Resize notes panel"
          onPointerDown={handleResizePointerDown}
          onPointerMove={handleResizePointerMove}
          onPointerUp={handleResizePointerUp}
          sx={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            width: 18,
            height: 18,
            cursor: 'nesw-resize',
            '&::before': {
              content: '""',
              position: 'absolute',
              left: 4,
              bottom: 4,
              width: 9,
              height: 9,
              borderLeft: '2px solid',
              borderBottom: '2px solid',
              borderColor: 'text.disabled',
              borderBottomLeftRadius: 3,
            },
          }}
        />
      )}
    </Box>
  );
};
