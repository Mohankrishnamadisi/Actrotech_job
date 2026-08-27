import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  Chip,
  Collapse,
  Stack,
  Typography,
} from '@mui/material';
import {
  EqualizerRounded,
  ExpandLessRounded,
  ExpandMoreRounded,
  PlayArrowRounded,
  PlaylistPlayRounded,
} from '@mui/icons-material';
import { LearningVideo } from '@services/learningVideos';

interface RelatedVideosListProps {
  videos: LearningVideo[];
  selectedVideoId?: string;
  onVideoSelect: (video: LearningVideo) => void;
  isLoading?: boolean;
}

const PREVIEW_COUNT = 6;

const formatPublished = (value?: string | null) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return '';
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

interface RelatedVideoCardProps {
  video: LearningVideo;
  index: number;
  isSelected: boolean;
  isLoading: boolean;
  onSelect: (video: LearningVideo) => void;
}

const RelatedVideoCard: React.FC<RelatedVideoCardProps> = ({
  video,
  index,
  isSelected,
  isLoading,
  onSelect,
}) => {
  const published = formatPublished(video.published_at);

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 2.5,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: isSelected ? 'primary.main' : 'divider',
        bgcolor: isSelected
          ? (theme) => (theme.palette.mode === 'dark' ? 'rgba(37, 99, 235, 0.12)' : 'rgba(37, 99, 235, 0.05)')
          : 'background.paper',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
        '&:hover': {
          borderColor: 'primary.main',
          transform: 'translateY(-2px)',
          boxShadow: (theme) => `0 10px 22px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.45)' : 'rgba(15, 23, 42, 0.1)'}`,
        },
        '&:hover .related-thumb-overlay': { opacity: 1 },
      }}
    >
      <CardActionArea
        onClick={() => onSelect(video)}
        disabled={isLoading}
        sx={{ p: 1.1, display: 'flex', gap: 1.4, alignItems: 'stretch', justifyContent: 'flex-start' }}
      >
        {/* Thumbnail */}
        <Box
          sx={{
            position: 'relative',
            width: { xs: 116, sm: 140 },
            minWidth: { xs: 116, sm: 140 },
            aspectRatio: '16 / 9',
            borderRadius: 2,
            overflow: 'hidden',
            bgcolor: '#0f172a',
            flexShrink: 0,
          }}
        >
          {video.thumbnail_url && (
            <Box
              component="img"
              src={video.thumbnail_url}
              alt={video.title}
              loading="lazy"
              sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          )}

          <Box
            className="related-thumb-overlay"
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              bgcolor: 'rgba(15, 23, 42, 0.45)',
              opacity: isSelected ? 1 : 0,
              transition: 'opacity 0.2s ease',
            }}
          >
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                bgcolor: 'rgba(255,255,255,0.92)',
                color: 'primary.main',
              }}
            >
              {isSelected ? <EqualizerRounded sx={{ fontSize: 17 }} /> : <PlayArrowRounded sx={{ fontSize: 20 }} />}
            </Box>
          </Box>

          <Box
            sx={{
              position: 'absolute',
              top: 5,
              left: 5,
              px: 0.7,
              py: 0.1,
              borderRadius: 1,
              fontSize: '0.65rem',
              fontWeight: 800,
              color: '#fff',
              bgcolor: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(2px)',
            }}
          >
            {String(index + 1).padStart(2, '0')}
          </Box>
        </Box>

        {/* Info */}
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            py: 0.3,
          }}
        >
          <Typography
            sx={{
              fontSize: '0.86rem',
              fontWeight: 700,
              lineHeight: 1.35,
              color: isSelected ? 'primary.main' : 'text.primary',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {video.title}
          </Typography>

          <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mt: 0.6, flexWrap: 'wrap', rowGap: 0.4 }}>
            <Typography variant="caption" noWrap sx={{ fontSize: '0.74rem', color: 'text.secondary', maxWidth: 180 }}>
              {video.channel_name || video.source_platform}
            </Typography>
            {published && (
              <Typography variant="caption" sx={{ fontSize: '0.72rem', color: 'text.disabled' }}>
                · {published}
              </Typography>
            )}
            {isSelected && (
              <Chip
                size="small"
                label="Now playing"
                color="primary"
                sx={{ height: 19, fontSize: '0.65rem', fontWeight: 800 }}
              />
            )}
          </Stack>
        </Box>
      </CardActionArea>
    </Card>
  );
};

export const RelatedVideosList: React.FC<RelatedVideosListProps> = React.memo(({
  videos,
  selectedVideoId,
  onVideoSelect,
  isLoading = false,
}) => {
  const [expanded, setExpanded] = useState(false);

  const previewVideos = useMemo(() => videos.slice(0, PREVIEW_COUNT), [videos]);
  const extraVideos = useMemo(() => videos.slice(PREVIEW_COUNT), [videos]);

  if (videos.length === 0) return null;

  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
        sx={{ mb: 1.5 }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: 1.5,
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
              background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)',
            }}
          >
            <PlaylistPlayRounded sx={{ fontSize: 18 }} />
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: '0.95rem' }}>Related videos</Typography>
          <Chip
            size="small"
            label={videos.length}
            sx={{ height: 20, fontWeight: 800, fontSize: '0.7rem' }}
          />
        </Stack>

        {extraVideos.length > 0 && (
          <Button
            size="small"
            onClick={() => setExpanded((open) => !open)}
            endIcon={expanded ? <ExpandLessRounded /> : <ExpandMoreRounded />}
            sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.78rem' }}
          >
            {expanded ? 'Show less' : `Show all ${videos.length}`}
          </Button>
        )}
      </Stack>

      <Stack spacing={1.2}>
        {previewVideos.map((video, index) => (
          <RelatedVideoCard
            key={`${video.search_key}-${video.video_id}`}
            video={video}
            index={index}
            isSelected={selectedVideoId === video.video_id}
            isLoading={isLoading}
            onSelect={onVideoSelect}
          />
        ))}
      </Stack>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Stack spacing={1.2} sx={{ mt: 1.2 }}>
          {extraVideos.map((video, index) => (
            <RelatedVideoCard
              key={`${video.search_key}-${video.video_id}`}
              video={video}
              index={PREVIEW_COUNT + index}
              isSelected={selectedVideoId === video.video_id}
              isLoading={isLoading}
              onSelect={onVideoSelect}
            />
          ))}
        </Stack>
      </Collapse>

      {extraVideos.length > 0 && (
        <Button
          fullWidth
          variant="outlined"
          onClick={() => setExpanded((open) => !open)}
          endIcon={expanded ? <ExpandLessRounded /> : <ExpandMoreRounded />}
          sx={{
            mt: 1.4,
            textTransform: 'none',
            fontWeight: 700,
            fontSize: '0.82rem',
            borderRadius: 2,
            borderStyle: 'dashed',
            py: 0.7,
          }}
        >
          {expanded ? 'Show less' : `+${extraVideos.length} more videos`}
        </Button>
      )}
    </Box>
  );
});

RelatedVideosList.displayName = 'RelatedVideosList';
