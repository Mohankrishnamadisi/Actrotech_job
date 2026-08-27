import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { Play, BookMarked, Zap } from 'lucide-react';

interface LearningHeaderProps {
  userName?: string;
  videosWatched?: number;
  learningStreak?: number;
  notesCreated?: number;
}

export const LearningHeader: React.FC<LearningHeaderProps> = ({
  userName = 'there',
  videosWatched = 0,
  learningStreak = 0,
  notesCreated = 0,
}) => {
  const firstName = userName && userName !== 'there' ? userName.split(' ')[0] : 'there';

  return (
    <Box
      sx={{
        mb: 3,
        pb: 3,
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        gap={{ xs: 2, sm: 3 }}
      >
        {/* Left Side: Title */}
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="overline"
            sx={{
              color: 'primary.main',
              fontWeight: 800,
              letterSpacing: 1.5,
              display: 'block',
              mb: 0.5,
            }}
          >
            Learning Studio
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              letterSpacing: '-0.02em',
              fontSize: { xs: '1.5rem', sm: '1.875rem' },
              mb: 0.5,
            }}
          >
            Continue learning, {firstName}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: '0.9rem', maxWidth: 500 }}
          >
            Personalized videos shaped by your skills and career goals
          </Typography>
        </Box>

        {/* Right Side: Progress Cards */}
        <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
          {/* Videos Watched */}
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(25, 103, 210, 0.1)' : 'rgba(25, 103, 210, 0.05)',
              border: (theme) => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(25, 103, 210, 0.2)' : 'rgba(25, 103, 210, 0.1)'}`,
              minWidth: 120,
              textAlign: 'center',
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="center" gap={0.75} sx={{ mb: 0.5 }}>
              <Play size={16} style={{ color: 'var(--palette-primary-main)' }} />
              <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', color: 'primary.main' }}>
                Watched
              </Typography>
            </Stack>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.25rem' }}>
              {videosWatched}
            </Typography>
          </Box>

          {/* Learning Streak */}
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.05)',
              border: (theme) => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)'}`,
              minWidth: 120,
              textAlign: 'center',
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="center" gap={0.75} sx={{ mb: 0.5 }}>
              <Zap size={16} style={{ color: '#4caf50' }} />
              <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', color: 'success.main' }}>
                Streak
              </Typography>
            </Stack>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.25rem' }}>
              {learningStreak}
            </Typography>
          </Box>

          {/* Notes Created */}
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(156, 39, 176, 0.1)' : 'rgba(156, 39, 176, 0.05)',
              border: (theme) => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(156, 39, 176, 0.2)' : 'rgba(156, 39, 176, 0.1)'}`,
              minWidth: 120,
              textAlign: 'center',
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="center" gap={0.75} sx={{ mb: 0.5 }}>
              <BookMarked size={16} style={{ color: '#9c27b0' }} />
              <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', color: '#9c27b0' }}>
                Notes
              </Typography>
            </Stack>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.25rem' }}>
              {notesCreated}
            </Typography>
          </Box>
        </Stack>
      </Stack>
    </Box>
  );
};
