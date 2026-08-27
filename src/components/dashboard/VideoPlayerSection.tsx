import React from 'react';
import { Box, Paper, Stack, Typography, IconButton, Tooltip, Chip } from '@mui/material';
import { Bookmark, BookmarkBorder, Share2 } from '@mui/icons-material';
import { Heart } from 'lucide-react';
import { LearningVideo } from '@services/learningVideos';

interface VideoPlayerSectionProps {
  video: LearningVideo | null;
  isLoading?: boolean;
  isSaved?: boolean;
  onSave?: () => void;
}

const formatDate = (date?: string | null) => {
  if (!date) return '';
  const parsed = new Date(date);
  return Number.isNaN(parsed.valueOf())
    ? ''
    : parsed.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
};

export const VideoPlayerSection: React.FC<VideoPlayerSectionProps> = ({
  video,
  isLoading = false,
  isSaved = false,
  onSave,
}) => {
  if (!video && !isLoading) {
    return (
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          p: 4,
          textAlign: 'center',
          minHeight: 400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.paper',
        }}
      >
        <Stack spacing={2} alignItems="center">
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="h6" sx={{ fontSize: '2.5rem' }}>
              ▶
            </Typography>
          </Box>
          <Typography variant="h6" fontWeight={700}>
            No video selected
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Search for a video or select one from the related list to begin learning
          </Typography>
        </Stack>
      </Paper>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Video Player */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          border: (theme) => `1px solid ${theme.palette.divider}`,
          bgcolor: '#0f172a',
          boxShadow: (theme) =>
            theme.palette.mode === 'dark'
              ? '0 8px 24px rgba(0, 0, 0, 0.4)'
              : '0 8px 24px rgba(15, 23, 42, 0.12)',
        }}
      >
        <Box sx={{ position: 'relative', aspectRatio: '16 / 9', bgcolor: '#0f172a' }}>
          {isLoading ? (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#0f172a',
              }}
            >
              <Box
                sx={{
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.5 },
                  },
                }}
              />
            </Box>
          ) : (
            video && (
              <Box
                component="iframe"
                src={video.embed_url}
                title={video.title}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                sx={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  border: 0,
                }}
              />
            )
          )}
        </Box>
      </Paper>

      {/* Video Metadata */}
      {video && (
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2} sx={{ mb: 2 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  lineHeight: 1.35,
                  mb: 1,
                }}
              >
                {video.title}
              </Typography>

              {/* Metadata Row */}
              <Stack direction="row" spacing={2} sx={{ mb: 1.5, flexWrap: 'wrap' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem' }}>
                  {video.channel_name || video.source_platform}
                </Typography>
                {formatDate(video.published_at) && (
                  <>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem' }}>
                      •
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem' }}>
                      {formatDate(video.published_at)}
                    </Typography>
                  </>
                )}
              </Stack>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {video.description}
              </Typography>
            </Box>

            {/* Action Buttons */}
            <Stack direction="row" spacing={0.5}>
              <Tooltip title={isSaved ? 'Remove from saved' : 'Save video'}>
                <IconButton
                  onClick={onSave}
                  color={isSaved ? 'primary' : 'default'}
                  sx={{
                    bgcolor: isSaved
                      ? (theme) => theme.palette.mode === 'dark'
                        ? 'rgba(25, 103, 210, 0.1)'
                        : 'rgba(25, 103, 210, 0.05)'
                      : 'transparent',
                  }}
                >
                  {isSaved ? <Bookmark /> : <BookmarkBorder />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Like">
                <IconButton>
                  <Heart size={20} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Share">
                <IconButton>
                  <Share2 />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>

          {/* Topic Badge */}
          <Box>
            <Chip
              label="Featured Learning"
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};
