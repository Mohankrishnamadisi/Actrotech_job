import React from 'react';
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
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Work as WorkIcon, Bookmark as BookmarkIcon, Notifications as NotificationsIcon, Settings as SettingsIcon } from '@mui/icons-material';
import { Layout } from '@components/layout/Layout';
import { useAuthStore } from '@store/index';
import { useSubscription } from '@hooks/index';
import { ROUTES } from '@constants/index';

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { subscription } = useSubscription(user?.id || null);

  const stats = [
    { label: 'Applications', value: 12, icon: WorkIcon },
    { label: 'Saved Jobs', value: 24, icon: BookmarkIcon },
    { label: 'Notifications', value: 3, icon: NotificationsIcon },
  ];

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
            Welcome, {user?.name}!
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Here's your job search dashboard
          </Typography>
        </Box>

        {/* Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {stats.map((stat) => (
            <Grid item xs={12} sm={6} md={3} key={stat.label}>
              <Card>
                <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                      {stat.label}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {stat.value}
                    </Typography>
                  </Box>
                  <stat.icon sx={{ fontSize: 32, color: 'primary.main', opacity: 0.3 }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          {/* Quick Actions */}
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
                    variant="outlined"
                    fullWidth
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    Browse Jobs
                  </Button>
                  <Button
                    component={RouterLink}
                    to={ROUTES.DASHBOARD_PROFILE}
                    variant="outlined"
                    fullWidth
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    Update Profile
                  </Button>
                  <Button
                    component={RouterLink}
                    to={ROUTES.DASHBOARD_RESUME}
                    variant="outlined"
                    fullWidth
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    Upload Resume
                  </Button>
                  <Button
                    component={RouterLink}
                    to={ROUTES.DASHBOARD_SAVED_JOBS}
                    variant="outlined"
                    fullWidth
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    View Saved Jobs
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Subscription Status */}
          <Grid item xs={12} md={6}>
            <Card sx={{ background: subscription ? 'rgba(16, 185, 129, 0.1)' : 'rgba(124, 58, 237, 0.1)' }}>
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

        {/* Recent Applications */}
        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Recent Applications
              </Typography>
              <Button
                component={RouterLink}
                to={ROUTES.DASHBOARD_APPLICATIONS}
                variant="text"
                size="small"
              >
                View All
              </Button>
            </Box>

            <List>
              {[
                { job: 'React Developer', company: 'Tech Corp', status: 'shortlisted' },
                { job: 'Full Stack Developer', company: 'Startup Inc', status: 'under_review' },
                { job: 'Frontend Developer', company: 'Design Studio', status: 'applied' },
              ].map((app, index) => (
                <ListItem key={index} sx={{ px: 0 }}>
                  <ListItemText
                    primary={app.job}
                    secondary={app.company}
                  />
                  <Chip
                    label={app.status.replace('_', ' ').toUpperCase()}
                    size="small"
                    color={app.status === 'shortlisted' ? 'success' : app.status === 'under_review' ? 'warning' : 'default'}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Container>
    </Layout>
  );
};
