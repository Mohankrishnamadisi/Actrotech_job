import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  LinearProgress,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Work as WorkIcon,
  Bookmark as BookmarkIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { Layout } from '@components/layout/Layout';
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

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { subscription } = useSubscription(user?.id || null);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [notificationsCount, setNotificationsCount] = useState(0);

  useEffect(() => {
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

  useEffect(() => {
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
    <Layout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
            Welcome, {user?.name}!
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Here's your job search dashboard
          </Typography>
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={4} key={stat.label}>
              <MotionCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                      {stat.label}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {stat.value}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      background: `${stat.color}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <stat.icon sx={{ color: stat.color, fontSize: 28 }} />
                  </Box>
                </CardContent>
              </MotionCard>
            </Grid>
          ))}
        </Grid>

        {profileCompletion < 80 && (
          <Card sx={{ mb: 4, background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Complete Your Profile
                </Typography>
                <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 700 }}>
                  {profileCompletion}%
                </Typography>
              </Box>
              <LinearProgress variant="determinate" value={profileCompletion} sx={{ mb: 2, height: 6, borderRadius: 3 }} />
              <Button component={RouterLink} to={ROUTES.DASHBOARD_PROFILE} variant="contained" startIcon={<PersonIcon />}>
                Update Profile
              </Button>
            </CardContent>
          </Card>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Quick Actions
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button
                    component={RouterLink}
                    to={ROUTES.JOBS}
                    variant="contained"
                    fullWidth
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    Browse Jobs
                  </Button>
                  <Button
                    component={RouterLink}
                    to={ROUTES.DASHBOARD_SAVED_JOBS}
                    variant="outlined"
                    fullWidth
                    startIcon={<BookmarkIcon />}
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    Saved Jobs
                  </Button>
                  <Button
                    component={RouterLink}
                    to={ROUTES.DASHBOARD_APPLICATIONS}
                    variant="outlined"
                    fullWidth
                    startIcon={<WorkIcon />}
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    My Applications
                  </Button>
                  <Button
                    component={RouterLink}
                    to={ROUTES.DASHBOARD_NOTIFICATIONS}
                    variant="outlined"
                    fullWidth
                    startIcon={<NotificationsIcon />}
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    Notifications
                  </Button>
                  <Button
                    component={RouterLink}
                    to={ROUTES.DASHBOARD_PROFILE}
                    variant="outlined"
                    fullWidth
                    startIcon={<PersonIcon />}
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    View Profile
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ background: subscription ? '#ECFDF5' : '#EFF6FF' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Subscription Status
                </Typography>

                {subscription ? (
                  <>
                    <Box sx={{ mb: 2 }}>
                      <Chip
                        label={`${subscription.plan?.toUpperCase()} PLAN`}
                        color="success"
                        sx={{ mb: 2 }}
                      />
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                        Valid until: {subscription.end_date}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        You have access to all premium features
                      </Typography>
                    </Box>
                    <Button variant="outlined" fullWidth>
                      Upgrade Plan
                    </Button>
                  </>
                ) : (
                  <>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                      Unlock premium features and access exclusive job listings
                    </Typography>
                    <Button
                      component={RouterLink}
                      to={ROUTES.PRICING}
                      variant="contained"
                      fullWidth
                    >
                      View Pricing Plans
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Recent Applications
              </Typography>
              <Button component={RouterLink} to={ROUTES.DASHBOARD_APPLICATIONS} variant="text" size="small">
                View All ({recentApplications.length})
              </Button>
            </Box>

            <List>
              {recentApplications.length === 0 ? (
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary="No applications yet"
                    secondary="Apply to jobs to see your recent application activity here."
                  />
                </ListItem>
              ) : (
                recentApplications.slice(0, 3).map((application, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemText
                      primary={application.jobs?.title || 'Unknown role'}
                      secondary={application.jobs?.company_name || 'Unknown company'}
                    />
                    <Box sx={{ textAlign: 'right' }}>
                      <Chip
                        label={(application.status || 'applied').replace('_', ' ').toUpperCase()}
                        size="small"
                        color={
                          application.status === 'shortlisted'
                            ? 'success'
                            : application.status === 'under_review'
                            ? 'warning'
                            : application.status === 'rejected'
                            ? 'error'
                            : application.status === 'accepted'
                            ? 'primary'
                            : 'default'
                        }
                      />
                      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.5 }}>
                        {application.applied_at ? formatDate(application.applied_at) : 'Date unavailable'}
                      </Typography>
                    </Box>
                  </ListItem>
                ))
              )}
            </List>
          </CardContent>
        </Card>
      </Container>
    </Layout>
  );
};
