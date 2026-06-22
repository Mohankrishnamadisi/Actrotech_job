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
} from '@mui/material';
import {
  Work as WorkIcon,
  Favorite as FavoriteIcon,
  TrendingUp as TrendingUpIcon,
  Star as StarIcon,
  Videocam as VideocamIcon,
  Description as DescriptionIcon,
  Rocket as RocketIcon,
  Chat as ChatIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@components/layout/Layout';
import { useThemeMode } from '@hooks/index';
import { useAuthStore } from '@store/index';
import { userService, applicationService, savedService, notificationService } from '@services/api';
import { messagingService } from '@services/messaging';
import { ROUTES } from '@constants/index';

export const PremiumDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { themeMode, setThemeMode } = useThemeMode();
  const navigate = useNavigate();
  const [applicationCount, setApplicationCount] = useState(0);
  const [savedJobsCount, setSavedJobsCount] = useState(0);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [profileStrength, setProfileStrength] = useState(0);
  const [userSkills, setUserSkills] = useState<string[]>([]);

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
        <Box sx={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.15) 0%, rgba(220,184,105,0.15) 100%)', border: '2px solid rgba(255,215,0,0.3)', borderRadius: 3, p: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                Premium Hub ✨
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                Welcome back, <span style={{ fontWeight: 700, color: '#B45309' }}>{user?.name}</span>
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Chip icon={<StarIcon />} label="Premium Member" sx={{ fontWeight: 700, background: 'linear-gradient(135deg, #FFD700 0%, #DAA520 100%)', color: '#000' }} />
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <IconButton
                onClick={() => navigate(ROUTES.MESSAGING)}
                sx={{ background: 'rgba(79,70,229,0.08)' }}
              >
                <Badge badgeContent={unreadMessagesCount} color="primary">
                  <ChatIcon />
                </Badge>
              </IconButton>
              <IconButton
                onClick={() => navigate(ROUTES.DASHBOARD_NOTIFICATIONS)}
                sx={{ background: 'rgba(245,158,11,0.08)' }}
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

        {/* Stats Dashboard */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3} onClick={() => navigate(ROUTES.DASHBOARD_APPLICATIONS)}>
            <Card sx={{ cursor: 'pointer', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 12px 32px rgba(0,0,0,0.1)' } }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <WorkIcon sx={{ fontSize: 36, mb: 1, color: '#2563EB' }} />
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>{applicationCount}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>Applications</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3} onClick={() => navigate(ROUTES.DASHBOARD_SAVED_JOBS)}>
            <Card sx={{ cursor: 'pointer', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 12px 32px rgba(0,0,0,0.1)' } }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <FavoriteIcon sx={{ fontSize: 36, mb: 1, color: '#E91E63' }} />
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>{savedJobsCount}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>Saved Jobs</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, rgba(76,175,80,0.1) 0%, rgba(139,195,74,0.1) 100%)', border: '2px solid rgba(76,175,80,0.3)' }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <TrendingUpIcon sx={{ fontSize: 36, mb: 1, color: '#4CAF50' }} />
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>{profileStrength}%</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>Profile Strength</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, rgba(156,39,176,0.1) 0%, rgba(123,31,162,0.1) 100%)', border: '2px solid rgba(156,39,176,0.3)' }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <VideocamIcon sx={{ fontSize: 36, mb: 1, color: '#9C27B0' }} />
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>{userSkills.length}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>Skills</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>Quick Actions</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button variant="contained" fullWidth onClick={() => navigate(ROUTES.JOBS)} sx={{ p: 2, background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', fontWeight: 700 }}>
                Browse Jobs
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button variant="contained" fullWidth onClick={() => navigate('/dashboard/remote-jobs')} sx={{ p: 2, background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', fontWeight: 700 }}>
                Remote Jobs
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button variant="contained" fullWidth onClick={() => navigate(ROUTES.DASHBOARD_PROFILE)} sx={{ p: 2, background: 'linear-gradient(135deg, #FF6B6B 0%, #E63946 100%)', fontWeight: 700 }}>
                Complete Profile
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button variant="contained" fullWidth onClick={() => navigate('/dashboard/recommended-jobs')} sx={{ p: 2, background: 'linear-gradient(135deg, #FFD700 0%, #DAA520 100%)', color: '#000', fontWeight: 700 }}>
                Recommended
              </Button>
            </Grid>
          </Grid>
        </Box>

        {/* Exclusive Tools */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>🎯 Exclusive Premium Tools</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ background: 'linear-gradient(135deg, rgba(156,39,176,0.1) 0%, rgba(123,31,162,0.1) 100%)', border: '2px solid rgba(156,39,176,0.3)', borderRadius: 3 }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <VideocamIcon sx={{ fontSize: 48, mb: 2, color: '#9C27B0' }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Mock Interviews</Typography>
                  <Button variant="contained" fullWidth onClick={() => navigate('/dashboard/mock-interviews')} sx={{ background: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)', fontWeight: 700 }}>
                    Start Practice
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ background: 'linear-gradient(135deg, rgba(63,81,181,0.1) 0%, rgba(51,103,214,0.1) 100%)', border: '2px solid rgba(63,81,181,0.3)', borderRadius: 3 }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <DescriptionIcon sx={{ fontSize: 48, mb: 2, color: '#3F51B5' }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Resume Review</Typography>
                  <Button variant="contained" fullWidth onClick={() => navigate('/dashboard/resume-review')} sx={{ background: 'linear-gradient(135deg, #3F51B5 0%, #3367D6 100%)', fontWeight: 700 }}>
                    Get Review
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ background: 'linear-gradient(135deg, rgba(244,67,54,0.1) 0%, rgba(255,87,87,0.1) 100%)', border: '2px solid rgba(244,67,54,0.3)', borderRadius: 3 }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <RocketIcon sx={{ fontSize: 48, mb: 2, color: '#F44336' }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Priority Apply</Typography>
                  <Button variant="contained" fullWidth onClick={() => navigate('/dashboard/priority-apply')} sx={{ background: 'linear-gradient(135deg, #F44336 0%, #E53935 100%)', fontWeight: 700 }}>
                    Apply Now
                  </Button>
                </CardContent>
              </Card>
            </Grid>
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
                <Button variant="contained" fullWidth onClick={() => navigate('/dashboard/recommended-jobs')} sx={{ background: 'linear-gradient(135deg, #FFD700 0%, #DAA520 100%)', color: '#000', fontWeight: 700 }}>
                  View All
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Priority Matches (Remote)</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>Remote jobs matching your skills with high relevance.</Typography>
                <Button variant="contained" fullWidth onClick={() => navigate('/dashboard/remote-jobs')} sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', fontWeight: 700 }}>
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
