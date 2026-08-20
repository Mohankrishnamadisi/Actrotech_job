import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { Bookmark, BookmarkBorder, OpenInNew, PlayCircleOutline, StickyNote2 } from '@mui/icons-material';
import { Layout } from '@components/layout/Layout';
import { useAuthStore } from '@store/index';
import { learningVideosService, LearningVideosError, type LearningProfile, type LearningVideo } from '@services/learningVideos';
import { ROUTES } from '@constants/index';

const BOOKMARKS_KEY = 'actro_learning_video_bookmarks';

const unique = (items: string[]) => Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));

const buildTopics = (profile: LearningProfile) => {
  const skills = unique([...profile.skills, ...profile.technologies]).slice(0, 6);
  const topics = skills.flatMap((skill) => [`${skill} tutorial`, `${skill} interview questions`]);
  if (profile.role) topics.push(`${profile.role} career skills`);
  if (profile.experience) topics.push(`${profile.experience} interview preparation`);
  return unique(topics).slice(0, 10);
};

const buildSearchKey = (profile: LearningProfile) => {
  const skills = unique([...profile.technologies, ...profile.skills]).slice(0, 6);
  const profileTerms = unique([...skills, profile.role, profile.experience]);
  return profileTerms.length ? `${profileTerms.join(' ')} tutorial` : '';
};

const formatDate = (date?: string | null) => {
  if (!date) return '';
  const parsed = new Date(date);
  return Number.isNaN(parsed.valueOf()) ? '' : parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export const LearningPage: React.FC = () => {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<LearningProfile | null>(null);
  const [videos, setVideos] = useState<LearningVideo[]>([]);
  const [activeTopic, setActiveTopic] = useState('');
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]') as string[]; } catch { return []; }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const topics = useMemo(() => (profile ? buildTopics(profile) : []), [profile]);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    learningVideosService.getProfile(user.id)
      .then((nextProfile) => {
        if (!active) return;
        setProfile(nextProfile);
        setActiveTopic(buildSearchKey(nextProfile));
      })
      .catch(() => { if (active) setError('We could not read your profile yet. Please try again.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user?.id]);

  useEffect(() => {
    if (!activeTopic) return;
    let active = true;
    setVideos([]);
    setLoading(true);
    setError('');
    learningVideosService.getVideos(activeTopic)
      .then((nextVideos) => { if (active) setVideos(nextVideos); })
      .catch((requestError) => {
        if (!active) return;
        if (requestError instanceof LearningVideosError) {
          if (requestError.kind === 'auth' || requestError.kind === 'session') {
            setError('Your session has expired. Please sign in again.');
          } else if (requestError.kind === 'invalid-response') {
            setError('Learning videos returned an unexpected response. Please try again.');
          } else {
            setError(requestError.status ? `Learning videos request failed (${requestError.status}): ${requestError.message}` : requestError.message);
          }
        } else {
          setError(requestError instanceof Error ? requestError.message : 'Learning videos are unavailable right now. Please try again.');
        }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [activeTopic]);

  const toggleBookmark = (videoId: string) => {
    const next = bookmarks.includes(videoId) ? bookmarks.filter((id) => id !== videoId) : [...bookmarks, videoId];
    setBookmarks(next);
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next));
  };

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: 1.5 }}>Learning Studio</Typography>
          <Typography variant="h3" sx={{ mt: 0.5, fontWeight: 800, letterSpacing: '-0.03em', fontSize: { xs: '2rem', md: '3rem' } }}>
            {profile?.name && profile.name !== 'there' ? `Continue learning, ${profile.name.split(' ')[0]}` : 'Learn based on your skills'}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 680 }}>
            A focused video feed shaped by the skills and career direction in your profile.
          </Typography>
        </Box>

        {!user && (
          <Paper variant="outlined" sx={{ p: { xs: 3, md: 5 }, textAlign: 'center', borderRadius: 3, maxWidth: 720, mx: 'auto' }}>
            <PlayCircleOutline color="primary" sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h6" fontWeight={700}>Sign in to personalize your learning feed</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.75 }}>
              Your skills and designation will be used to find relevant learning videos.
            </Typography>
            <Button component="a" href={`#${ROUTES.LOGIN}`} variant="contained" sx={{ mt: 2 }}>Sign in</Button>
          </Paper>
        )}

        {user && topics.length > 0 && (
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 3 }}>
            {topics.map((topic) => (
              <Chip key={topic} label={topic} clickable onClick={() => setActiveTopic(topic)} color={topic === activeTopic ? 'primary' : 'default'} variant={topic === activeTopic ? 'filled' : 'outlined'} />
            ))}
          </Stack>
        )}

        {user && error && <Alert severity="error" sx={{ mb: 3 }} action={<Button color="inherit" size="small" onClick={() => setActiveTopic((topic) => `${topic} `)}>Retry</Button>}>{error}</Alert>}
        {user && loading && <Box sx={{ minHeight: 280, display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>}
        {user && !loading && !error && videos.length === 0 && (
          <Paper variant="outlined" sx={{ p: { xs: 3, md: 6 }, textAlign: 'center', borderRadius: 3 }}>
            <PlayCircleOutline color="primary" sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h6" fontWeight={700}>No videos found for this topic</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>Update your skills or choose another learning category to discover more.</Typography>
          </Paper>
        )}

        {user && <Box sx={{ display: 'grid', gap: 3, maxWidth: 820, mx: 'auto' }}>
          {videos.map((video) => {
            const saved = bookmarks.includes(video.video_id);
            return (
              <Paper key={`${video.search_key}-${video.video_id}`} variant="outlined" sx={{ overflow: 'hidden', borderRadius: 3, bgcolor: 'background.paper' }}>
                <Box sx={{ position: 'relative', aspectRatio: { xs: '16 / 10', sm: '16 / 9' }, bgcolor: '#0f172a' }}>
                  <Box component="iframe" src={video.embed_url} title={video.title} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} />
                </Box>
                <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                    <Box>
                      <Typography variant="h6" fontWeight={750} sx={{ lineHeight: 1.25 }}>{video.title}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>{video.channel_name || video.source_platform}{formatDate(video.published_at) ? ` · ${formatDate(video.published_at)}` : ''}</Typography>
                    </Box>
                    <IconButton aria-label={saved ? 'Remove bookmark' : 'Save video'} onClick={() => toggleBookmark(video.video_id)} color={saved ? 'primary' : 'default'}>{saved ? <Bookmark /> : <BookmarkBorder />}</IconButton>
                  </Stack>
                  <Stack direction="row" spacing={0.75} sx={{ mt: 1.5 }}><Chip size="small" label={activeTopic} color="primary" variant="outlined" /></Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{video.description}</Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    <Button size="small" startIcon={<OpenInNew />} href={video.video_url} target="_blank" rel="noreferrer">Watch on {video.source_platform}</Button>
                    <Button size="small" color="inherit" startIcon={<StickyNote2 />} disabled>Notes</Button>
                  </Stack>
                </Box>
              </Paper>
            );
          })}
        </Box>}
      </Container>
    </Layout>
  );
};

export default LearningPage;
