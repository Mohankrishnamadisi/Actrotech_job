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
  Badge,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Work as WorkIcon,
  Bookmark as BookmarkIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { Layout } from '@components/layout/Layout';
import { useAuthStore } from '@store/index';
import { useSubscription } from '@hooks/index';
import { ROUTES } from '@constants/index';
import { calculateProfileCompletion, formatDate } from '@utils/index';
import { applicationService, savedService, notificationService, userService, jobService } from '@services/api';
import { messagingService } from '@services/messaging';
import { INTERVIEW_ROLES } from '@constants/index';

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
  const [profile, setProfile] = useState<any | null>(null);
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [skills, setSkills] = useState<string[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<any[]>([]);
  const [recommendedLoading, setRecommendedLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;
      try {
        const profile = await userService.getProfile(user.id);
        setProfile(profile || null);
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
        // extract skills for personalized content
        const userSkills = profile?.skills || profile?.skills || [];
        setSkills(Array.isArray(userSkills) ? userSkills : String(userSkills || '').split(',').map((s: string) => s.trim()).filter(Boolean));
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
        const [applications, savedJobs, notifications, conversations] = await Promise.all([
          applicationService.getUserApplications(user.id),
          savedService.getUserSavedJobs(user.id),
          notificationService.getUnreadNotifications(user.id),
          messagingService.getConversations(user.id),
        ]);

        setRecentApplications(applications || []);
        setSavedCount((savedJobs || []).length);
        setNotificationsCount((notifications || []).length);
        setUnreadMessagesCount(
          (((conversations as any[]) || [])
            .reduce((count, conv) => count + (conv.unreadCount || 0), 0))
        );

        // load recommended jobs based on skills
        try {
          const skillList = (profile?.skills && Array.isArray(profile.skills) && profile.skills.length) ? profile.skills : (skills || []);
          if (skillList && skillList.length > 0) {
            setRecommendedLoading(true);
            const res = await jobService.getJobsBySkills(skillList, 1, 6);
            setRecommendedJobs(res.data || []);
          }
        } catch (err) {
          console.error('Failed to load recommended jobs by skills:', err);
        } finally {
          setRecommendedLoading(false);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      }
    };

    loadDashboardData();
  }, [user?.id, profile?.skills, skills]);

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
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
            Here's your job search dashboard
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              onClick={() => navigate(ROUTES.MESSAGING)}
              startIcon={
                <Badge badgeContent={unreadMessagesCount} color="primary">
                  💬
                </Badge>
              }
            >
              Inbox
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate(ROUTES.DASHBOARD_NOTIFICATIONS)}
              startIcon={
                <Badge badgeContent={notificationsCount} color="error">
                  🔔
                </Badge>
              }
            >
              Notifications
            </Button>
          </Box>
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
        {/* Personalized sections: Skills, Recommended Jobs, Interview Prep */}
        <Grid container spacing={3} sx={{ mt: 4 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 3, p: 2, height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Your Skills
                </Typography>
                {skills && skills.length ? (
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    {skills.map((s) => (
                      <Chip key={s} label={s} color="primary" variant="outlined" />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                    Add skills in your profile to get personalized recommendations.
                  </Typography>
                )}
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Button component={RouterLink} to={ROUTES.DASHBOARD_PROFILE} variant="contained" sx={{ textTransform: 'none' }}>
                    Edit Profile
                  </Button>
                  <Button variant="outlined" component={RouterLink} to={ROUTES.JOBS} sx={{ textTransform: 'none' }}>
                    Browse Jobs
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={5}>
            <Card sx={{ borderRadius: 3, p: 2, height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Recommended Jobs For You
                </Typography>
                {recommendedLoading ? (
                  <LinearProgress />
                ) : recommendedJobs && recommendedJobs.length ? (
                  <List>
                    {recommendedJobs.map((job: any) => (
                      <ListItem key={job.id} button component={RouterLink} to={`/jobs/${job.id}`} sx={{ px: 0 }}>
                        <ListItemText
                          primary={job.title}
                          secondary={`${job.company_name} • ${job.location || 'Location'}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    No recommendations yet. Improve your profile skills to receive tailored job suggestions.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card sx={{ borderRadius: 3, p: 2, height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Interview Prep
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                  Role-specific interview questions from AmbitionBox matched to your skills.
                </Typography>
                <List>
                  {INTERVIEW_ROLES.filter((r) => skills.some((sk) => r.title.toLowerCase().includes(sk.toLowerCase()) || sk.toLowerCase().includes(r.title.toLowerCase().split(' ')[0]))).slice(0, 6).map((role) => (
                    <ListItem key={role.title} button onClick={() => window.open(role.url, '_blank')} sx={{ px: 0 }}>
                      <ListItemText primary={role.title} secondary={role.count} />
                    </ListItem>
                  ))}
                </List>
                <Button variant="text" component={RouterLink} to={ROUTES.JOBS} sx={{ mt: 1 }}>
                  Explore more interview roles
                </Button>
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
