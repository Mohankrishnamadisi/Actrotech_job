import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  Work as WorkIcon,
  Favorite as FavoriteIcon,
  TrendingUp as TrendingUpIcon,
  Star as StarIcon,
  Videocam as VideocamIcon,
  Description as DescriptionIcon,
  Chat as ChatIcon,
  Notifications as NotificationsIcon,
  Public as PublicIcon,
  AccountCircle as AccountIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@components/layout/Layout';
import { useThemeMode } from '@hooks/index';
import { useAuthStore } from '@store/index';
import { userService, applicationService, savedService, notificationService, jobService } from '@services/api';
import { messagingService } from '@services/messaging';
import { ROUTES } from '@constants/index';
import { useTheme } from '@mui/material/styles';

const getJobList = (response: any): any[] => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

export const PremiumDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { themeMode, setThemeMode } = useThemeMode();
  const theme = useTheme();
  const navigate = useNavigate();
  const [applicationCount, setApplicationCount] = useState(0);
  const [savedJobsCount, setSavedJobsCount] = useState(0);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [profileStrength, setProfileStrength] = useState(0);
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<any[]>([]);
  const MotionCard = motion(Card);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const profile = await userService.getProfile(user.id);
        if (profile) {
          setUserSkills(profile.skills || []);
          const strength = Math.min(
            100,
            (
              (profile.skills?.length || 0) * 10 +
              (profile.resumeUrl ? 20 : 0) +
              (profile.experience ? 15 : 0) +
              (profile.phone ? 10 : 0) +
              (profile.bio ? 10 : 0) +
              (profile.workExperience?.length || 0) * 10 +
              (profile.education?.length || 0) * 10
            ) / 10
          );
          setProfileStrength(Math.round(strength));
        }

        const applications = await applicationService.getUserApplications(user.id);
        setApplicationCount(applications?.length || 0);

        const saved = await savedService.getUserSavedJobs(user.id);
        setSavedJobsCount(saved?.length || 0);

        const unreadNotifications = await notificationService.getUnreadNotifications(user.id);
        setNotificationsCount((unreadNotifications || []).length);

        const conversations = await messagingService.getConversations(user.id);
        setUnreadMessagesCount(
          (((conversations as any[]) || [])
            .reduce((count, conv) => count + (conv.unreadCount || 0), 0))
        );

          // load recommended jobs for premium users
          try {
            const skillList = (profile?.skills && Array.isArray(profile.skills) && profile.skills.length) ? profile.skills : (profile?.skills || []);
            if (skillList && skillList.length > 0) {
              const res = await jobService.getJobsBySkills(skillList, 1, 6);
              setRecommendedJobs(getJobList(res));
            }
          } catch (err) {
            console.error('Failed to load recommended jobs for premium dashboard:', err);
          }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user?.id]);

  if (loading) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ py: 8, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <CircularProgress />
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header Section */}
        <Box sx={{ background: theme.palette.mode === 'dark' ? 'rgba(56, 189, 248, 0.08)' : theme.palette.secondary.light, border: `2px solid ${theme.palette.mode === 'dark' ? 'rgba(58, 123, 213, 0.2)' : theme.palette.secondary.main}`, borderRadius: 3, p: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                Premium Hub ✨
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                Welcome back, <span style={{ fontWeight: 700, color: theme.palette.warning.main }}>{user?.name}</span>
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Chip icon={<StarIcon />} label="Premium Member" sx={{ fontWeight: 700, background: theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.2)' : theme.palette.warning.light, color: theme.palette.warning.contrastText }} />
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <IconButton
                onClick={() => navigate(ROUTES.MESSAGING)}
                sx={{ background: theme.palette.mode === 'dark' ? 'rgba(96, 165, 250, 0.16)' : 'rgba(79,70,229,0.08)' }}
              >
                <Badge badgeContent={unreadMessagesCount} color="primary">
                  <ChatIcon />
                </Badge>
              </IconButton>
              <IconButton
                onClick={() => navigate(ROUTES.DASHBOARD_NOTIFICATIONS)}
                sx={{ background: theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.16)' : 'rgba(245,158,11,0.08)' }}
              >
                <Badge badgeContent={notificationsCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Box>
            <FormControl size="small">
              <InputLabel>Theme</InputLabel>
              <Select value={themeMode} label="Theme" onChange={(e) => setThemeMode(e.target.value as any)} sx={{ minWidth: 140 }}>
                <MenuItem value="light">Light</MenuItem>
                <MenuItem value="dark">Dark</MenuItem>
                <MenuItem value="professional">Professional</MenuItem>
                <MenuItem value="modern">Modern</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
        </Box>

        {/* Stats Dashboard (dynamic) */}
        {/** use animated cards and a mapped stats array for maintainability **/}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {([
            { label: 'Applications', value: applicationCount, icon: WorkIcon, color: theme.palette.primary.main, to: ROUTES.DASHBOARD_APPLICATIONS },
            { label: 'Saved Jobs', value: savedJobsCount, icon: FavoriteIcon, color: theme.palette.error.main, to: ROUTES.DASHBOARD_SAVED_JOBS },
            { label: 'Profile Strength', value: `${profileStrength}%`, icon: TrendingUpIcon, color: theme.palette.success.main },
            { label: 'Skills', value: userSkills.length, icon: VideocamIcon, color: theme.palette.secondary.main },
          ] as const).map((stat, idx) => (
            <Grid item xs={12} sm={6} md={3} key={String(stat.label)} onClick={() => { if ((stat as any).to) navigate((stat as any).to); }}>
              <MotionCard sx={{ cursor: 'pointer', transition: 'all 0.32s', '&:hover': { transform: 'translateY(-8px)', boxShadow: theme.palette.mode === 'dark' ? '0 20px 36px rgba(0,0,0,0.35)' : '0 12px 32px rgba(0,0,0,0.08)' } }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <stat.icon sx={{ fontSize: 36, mb: 1, color: stat.color }} />
                  <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>{stat.value}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>{stat.label}</Typography>
                </CardContent>
              </MotionCard>
            </Grid>
          ))}
        </Grid>

        {/* Quick Actions (dynamic) */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>Quick Actions</Typography>
          <Grid container spacing={2}>
            {([
              { label: 'Browse Jobs', to: ROUTES.JOBS, color: 'primary', icon: WorkIcon },
              { label: 'Remote Jobs', to: `${ROUTES.DASHBOARD_APPLICATIONS}?filter=remote`, color: 'success', icon: PublicIcon },
              { label: 'Complete Profile', to: ROUTES.DASHBOARD_PROFILE, color: 'secondary', icon: AccountIcon },
              { label: 'Matched Jobs', to: '/dashboard/recommended-jobs?minMatch=50', color: 'warning', icon: TrendingUpIcon },
            ] as const).map((action, idx) => (
              <Grid item xs={6} sm={4} md={3} key={action.label}>
                <MotionCard
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  sx={{ cursor: 'pointer', borderRadius: 2, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => navigate(action.to)}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <action.icon sx={{ fontSize: 36, color: (theme.palette as any)[action.color]?.main || theme.palette.primary.main, mb: 1 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{action.label}</Typography>
                  </CardContent>
                </MotionCard>
              </Grid>
            ))}
          </Grid>
        </Box>


        {/* Exclusive Tools (config-driven) */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>🎯 Exclusive Premium Tools</Typography>
          <Grid container spacing={3}>
            {( [
                { key: 'mock_interviews', icon: VideocamIcon, title: 'Mock Interviews', to: '/dashboard/mock-interviews', color: 'primary' },
                { key: 'resume_review', icon: DescriptionIcon, title: 'Resume Review', to: '/dashboard/resume-review', color: 'secondary' },
                { key: 'interview_prep', icon: ChatIcon, title: 'Interview Preparation', to: 'https://www.ambitionbox.com/interviews?campaign=desktop_nav', external: true, color: 'primary' },
            ] as const ).map((tool, idx) => (
              <Grid item xs={12} sm={6} md={4} key={tool.key}>
                <MotionCard initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <tool.icon sx={{ fontSize: 48, mb: 2, color: (theme.palette as any)[tool.color]?.main || theme.palette.primary.main }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>{tool.title}</Typography>
                    <Button
                      variant="contained"
                      color={tool.color as any}
                      fullWidth
                      onClick={() => {
                        if ((tool as any).external || String(tool.to).startsWith('http')) {
                          window.open(String(tool.to), '_blank', 'noopener');
                        } else {
                          navigate(String(tool.to));
                        }
                      }}
                      sx={{ fontWeight: 700 }}
                    >
                      {tool.key === 'interview_prep' ? 'Open Interview Prep' : tool.title.includes('Mock') ? 'Start Practice' : 'Get Review'}
                    </Button>
                  </CardContent>
                </MotionCard>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Recommended & Remote Jobs */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Recommended Jobs for You</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                  {userSkills.length > 0 ? `Matched with ${userSkills.slice(0, 3).join(', ')}...` : 'Add skills to profile'}
                </Typography>
                <Box sx={{ display: 'grid', gap: 1 }}>
                  {recommendedJobs.length > 0 ? (
                    recommendedJobs.map((job) => (
                      <Button key={job.id} variant="outlined" fullWidth sx={{ justifyContent: 'flex-start' }} onClick={() => navigate(`/jobs/${job.id}`)}>
                        {job.title} • {job.company_name}
                      </Button>
                    ))
                  ) : (
                    <Button variant="contained" color="warning" fullWidth onClick={() => navigate('/dashboard/recommended-jobs')} sx={{ fontWeight: 700 }}>
                      View All
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Priority Matches (Remote)</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>Remote jobs matching your skills with high relevance.</Typography>
                <Button variant="contained" color="success" fullWidth onClick={() => navigate('/dashboard/remote-jobs')} sx={{ fontWeight: 700 }}>
                  Explore Remote
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Layout>
  );
};

export default PremiumDashboard;
