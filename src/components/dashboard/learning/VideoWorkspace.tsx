import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, IconButton, Paper, Tooltip } from '@mui/material';
import { FullscreenExitRounded, FullscreenRounded } from '@mui/icons-material';
import { AnimatePresence } from 'framer-motion';
import { LearningVideoPlayer } from '../LearningVideoPlayer';
import { FloatingNotesLauncher } from './FloatingNotesLauncher';
import { FloatingNotesPanel } from './FloatingNotesPanel';
import type { LearningVideo } from '@services/learningVideos';

interface VideoWorkspaceProps {
  video: LearningVideo;
  onPlayStart: (video: LearningVideo) => void;
  onMinuteWatched: (minutes: number) => void;
  /** The real Learning Notes editor, hosted in the overlay while fullscreen. */
  notes: React.ReactNode;
  onFullscreenChange: (isFullscreen: boolean) => void;
  hasNoteContent?: boolean;
}

/**
 * Wraps the player, fullscreen control and floating notes UI in a single
 * element so the notes overlay survives the browser Fullscreen API.
 */
export const VideoWorkspace: React.FC<VideoWorkspaceProps> = ({
  video,
  onPlayStart,
  onMinuteWatched,
  notes,
  onFullscreenChange,
  hasNoteContent = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [nativeFullscreen, setNativeFullscreen] = useState(false);
  const [fallbackFullscreen, setFallbackFullscreen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isNotesMinimized, setIsNotesMinimized] = useState(true);

  const isFullscreen = nativeFullscreen || fallbackFullscreen;

  useEffect(() => {
    const handleChange = () => setNativeFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  useEffect(() => {
    onFullscreenChange(isFullscreen);
    if (!isFullscreen) {
      setIsNotesOpen(false);
      setIsNotesMinimized(true);
    }
  }, [isFullscreen, onFullscreenChange]);

  const toggleFullscreen = useCallback(async () => {
    const element = containerRef.current;
    if (!element) return;

    if (isFullscreen) {
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => undefined);
      setFallbackFullscreen(false);
      return;
    }

    try {
      if (element.requestFullscreen) {
        await element.requestFullscreen();
        return;
      }
      throw new Error('Fullscreen API unavailable');
    } catch {
      // Browser refused native fullscreen; fall back to a viewport-filling layer.
      setFallbackFullscreen(true);
    }
  }, [isFullscreen]);

  const openNotes = useCallback(() => {
    setIsNotesOpen(true);
    setIsNotesMinimized(false);
  }, []);

  const minimizeNotes = useCallback(() => setIsNotesMinimized(true), []);

  const closeNotes = useCallback(() => {
    setIsNotesOpen(false);
    setIsNotesMinimized(true);
  }, []);

  useEffect(() => {
    if (!isFullscreen || !isNotesOpen || isNotesMinimized) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      setIsNotesMinimized(true);
    };
    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [isFullscreen, isNotesOpen, isNotesMinimized]);

  const showLauncher = isFullscreen && (!isNotesOpen || isNotesMinimized);

  return (
    <Paper
      ref={containerRef}
      elevation={0}
      sx={{
        position: fallbackFullscreen ? 'fixed' : 'relative',
        ...(fallbackFullscreen ? { inset: 0, zIndex: (theme) => theme.zIndex.modal + 5 } : {}),
        width: '100%',
        borderRadius: isFullscreen ? 0 : 3,
        overflow: 'hidden',
        border: (theme) => (isFullscreen ? 'none' : `1px solid ${theme.palette.divider}`),
        bgcolor: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: (theme) =>
          isFullscreen
            ? 'none'
            : theme.palette.mode === 'dark'
              ? '0 8px 24px rgba(0, 0, 0, 0.4)'
              : '0 8px 24px rgba(15, 23, 42, 0.12)',
        ...(isFullscreen ? { height: '100%', minHeight: '100vh' } : {}),
      }}
    >
      <Box
        sx={
          isFullscreen
            ? { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }
            : { width: '100%' }
        }
      >
        <LearningVideoPlayer
          video={video}
          onPlayStart={onPlayStart}
          onMinuteWatched={onMinuteWatched}
          fill={isFullscreen}
        />
      </Box>

      <Tooltip title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'} placement="left">
        <IconButton
          onClick={() => void toggleFullscreen()}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 25,
            color: '#fff',
            bgcolor: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.18)',
            '&:hover': { bgcolor: 'rgba(37, 99, 235, 0.75)' },
          }}
        >
          {isFullscreen ? <FullscreenExitRounded /> : <FullscreenRounded />}
        </IconButton>
      </Tooltip>

      <AnimatePresence>
        {showLauncher && <FloatingNotesLauncher key="notes-launcher" onOpen={openNotes} hasContent={hasNoteContent} />}
      </AnimatePresence>

      {isFullscreen && isNotesOpen && (
        <FloatingNotesPanel
          boundsRef={containerRef}
          title={video.title}
          hidden={isNotesMinimized}
          onMinimize={minimizeNotes}
          onClose={closeNotes}
        >
          {notes}
        </FloatingNotesPanel>
      )}
    </Paper>
  );
};
