import React from 'react';
import { Box, Container, Card, CardContent, Typography, Button, Grid } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Work as WorkIcon,
  Bookmark as BookmarkIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { MobileLayout } from '@components/layout/MobileLayout';
import { useAuthStore } from '@store/index';
import { useSubscription } from '@hooks/index';
import { ROUTES } from '@constants/index';
import { calculateProfileCompletion, formatDate } from '@utils/index';
import { applicationService, savedService, notificationService, userService } from '@services/api';

type RecentApplication = {
  id: string;
  status: string;
  applied_at?: string;
  jobs?: {
    title?: string;
    company_name?: string;
  };
};

const MotionCard = motion(Card);

export const MobileDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { subscription } = useSubscription(user?.id || null);
  const [profileCompletion, setProfileCompletion] = React.useState(0);
  const [recentApplications, setRecentApplications] = React.useState<RecentApplication[]>([]);
  const [savedCount, setSavedCount] = React.useState(0);
  const [notificationsCount, setNotificationsCount] = React.useState(0);

  React.useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;
      try {
        const profile = await userService.getProfile(user.id);
        setProfileCompletion(
          calculateProfileCompletion({
            fullName: profile?.name || user.name,
            email: profile?.email || user.email,
            phone: profile?.phone,
            gender: profile?.gender,
            dateOfBirth: profile?.date_of_birth || profile?.dateOfBirth,
            address: profile?.address,
            city: profile?.city,
            state: profile?.state,
            country: profile?.country,
            bio: profile?.bio,
            experience: profile?.experience,
            skills: profile?.skills || [],
            education: profile?.education_details || profile?.education || [],
            workExperience: profile?.work_experience || profile?.workExperience || [],
            resumeUrl: profile?.resume_url || profile?.resumeUrl,
            socialLinks: profile?.linkedin_url || profile?.portfolio_url || profile?.github_url,
          })
        );
      } catch (err) {
        console.error('Failed to load profile for dashboard completion:', err);
      }
    };

    loadProfile();
  }, [user?.id, user?.name, user?.email]);

  React.useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.id) return;
      try {
        const [applications, savedJobs, notifications] = await Promise.all([
          applicationService.getUserApplications(user.id),
          savedService.getUserSavedJobs(user.id),
          notificationService.getUserNotifications(user.id, 50),
        ]);

        setRecentApplications(applications || []);
        setSavedCount((savedJobs || []).length);
        setNotificationsCount((notifications || []).length);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      }
    };

    loadDashboardData();
  }, [user?.id]);

  const stats = [
    { label: 'Applications', value: recentApplications.length, icon: WorkIcon, color: '#1D4ED8' },
    { label: 'Saved Jobs', value: savedCount, icon: BookmarkIcon, color: '#10B981' },
    { label: 'Notifications', value: notificationsCount, icon: NotificationsIcon, color: '#F59E0B' },
  ];

  return (
    <MobileLayout>
      <Container maxWidth="sm" sx={{ py: 2 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            Welcome!
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {user?.name}
          </Typography>
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {stats.map((stat, index) => (
            <Grid item xs={12} key={stat.label}>
              <MotionCard
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                sx={{
                  '&:hover': {
                    boxShadow: 2,
                  },
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, display: 'block' }}>
                        {stat.label}
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {stat.value}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 1.5,
                        background: `${stat.color}20`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <stat.icon sx={{ color: stat.color, fontSize: 24 }} />
                    </Box>
                  </Box>
                </CardContent>
              </MotionCard>
            </Grid>
          ))}
        </Grid>

        {profileCompletion < 80 && (
          <Card sx={{ mb: 3, background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Complete Your Profile
                </Typography>
                <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700 }}>
                  {profileCompletion}%
                </Typography>
              </Box>
              <Box
                sx={{
                  width: '100%',
                  height: 6,
                  borderRadius: 3,
                  bgcolor: '#D1E7FF',
                  overflow: 'hidden',
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    height: '100%',
                    width: `${profileCompletion}%`,
                    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                    transition: 'width 0.3s ease',
                  }}
                />
              </Box>
              <Button
                component={RouterLink}
                to={ROUTES.DASHBOARD_PROFILE}
                variant="contained"
                fullWidth
                size="small"
                sx={{ py: 1 }}
              >
                Update Profile
              </Button>
            </CardContent>
          </Card>
        )}

        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 2 }}>
              Quick Actions
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                component={RouterLink}
                to={ROUTES.JOBS}
                variant="contained"
                fullWidth
                size="small"
                sx={{ py: 1, textTransform: 'none' }}
              >
                Browse Jobs
              </Button>
              <Button
                component={RouterLink}
                to={ROUTES.DASHBOARD_SAVED_JOBS}
                variant="outlined"
                fullWidth
                size="small"
                sx={{ py: 1, textTransform: 'none' }}
              >
                View Saved Jobs
              </Button>
              <Button
                component={RouterLink}
                to={ROUTES.DASHBOARD_APPLICATIONS}
                variant="outlined"
                fullWidth
                size="small"
                sx={{ py: 1, textTransform: 'none' }}
              >
                My Applications
              </Button>
              <Button
                component={RouterLink}
                to={ROUTES.DASHBOARD_PROFILE}
                variant="outlined"
                fullWidth
                size="small"
                sx={{ py: 1, textTransform: 'none' }}
              >
                Edit Profile
              </Button>
            </Box>
          </CardContent>
        </Card>

        {recentApplications.length > 0 && (
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 2 }}>
                Recent Applications
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {recentApplications.slice(0, 3).map((app) => (
                  <Box
                    key={app.id}
                    sx={{
                      p: 1.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1.5,
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                      {app.jobs?.title || 'Job Position'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                      {app.jobs?.company_name}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box
                        sx={{
                          px: 1,
                          py: 0.25,
                          borderRadius: 1,
                          bgcolor:
                            app.status === 'accepted'
                              ? '#DCFCE7'
                              : app.status === 'rejected'
                                ? '#FEE2E2'
                                : '#FEF3C7',
                          display: 'inline-block',
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 600,
                            color:
                              app.status === 'accepted'
                                ? '#166534'
                                : app.status === 'rejected'
                                  ? '#991B1B'
                                  : '#B45309',
                            textTransform: 'capitalize',
                          }}
                        >
                          {app.status}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {app.applied_at ? formatDate(app.applied_at) : 'Recently'}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        )}
      </Container>
    </MobileLayout>
  );
};
