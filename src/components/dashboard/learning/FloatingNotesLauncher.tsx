import React from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { NotebookPen } from 'lucide-react';

interface FloatingNotesLauncherProps {
  onOpen: () => void;
  hasContent?: boolean;
}

/** Small glass pill anchored to the right edge of the fullscreen player. */
export const FloatingNotesLauncher: React.FC<FloatingNotesLauncherProps> = ({ onOpen, hasContent = false }) => (
  <Tooltip title="Open Notes" placement="left" arrow>
    <Box
      component={motion.button}
      type="button"
      aria-label="Open Learning Notes"
      onClick={onOpen}
      initial={{ opacity: 0, x: 26 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 26 }}
      whileHover={{ scale: 1.04, x: -2 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      sx={{
        position: 'absolute',
        top: '50%',
        right: { xs: 10, md: 16 },
        transform: 'translateY(-50%)',
        zIndex: 30,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0.6,
        px: { xs: 1, md: 1.2 },
        py: { xs: 1.2, md: 1.6 },
        cursor: 'pointer',
        borderRadius: 999,
        border: '1px solid rgba(255, 255, 255, 0.22)',
        color: '#fff',
        bgcolor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        boxShadow: '0 12px 30px rgba(2, 6, 23, 0.45)',
        '&:hover': { bgcolor: 'rgba(37, 99, 235, 0.72)', borderColor: 'rgba(255,255,255,0.4)' },
        '&:focus-visible': { outline: '2px solid #93c5fd', outlineOffset: 2 },
      }}
    >
      <Box sx={{ position: 'relative', display: 'flex' }}>
        <NotebookPen size={20} />
        {hasContent && (
          <Box
            sx={{
              position: 'absolute',
              top: -3,
              right: -4,
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: '#34D399',
              boxShadow: '0 0 0 2px rgba(15,23,42,0.6)',
            }}
          />
        )}
      </Box>
      <Typography
        component="span"
        sx={{
          fontSize: '0.6rem',
          fontWeight: 800,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          writingMode: 'vertical-rl',
          display: { xs: 'none', md: 'block' },
        }}
      >
        Notes
      </Typography>
    </Box>
  </Tooltip>
);
