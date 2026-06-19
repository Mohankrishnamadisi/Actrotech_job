import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Work as WorkIcon,
  People as PeopleIcon,
  Add as AddIcon,
  Business as BusinessIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { Layout } from '@components/layout/Layout';
import { useAuthStore } from '@store/index';
import { jobService } from '@services/api';
import { ROUTES } from '@constants/index';

const MotionCard = motion(Card);

export const RecruiterDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [jobCount, setJobCount] = useState(0);

  useEffect(() => {
    if (user?.id) {
      jobService.getRecruiterJobs(user.id).then((jobs) => setJobCount(jobs?.length || 0)).catch(() => {});
    }
  }, [user?.id]);

  const stats = [
    { label: 'Active Jobs', value: jobCount, icon: WorkIcon, color: '#1D4ED8' },
    { label: 'Total Applicants', value: 0, icon: PeopleIcon, color: '#10B981' },
    { label: 'Profile Views', value: 0, icon: TrendingUpIcon, color: '#F59E0B' },
  ];

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
            Recruiter Dashboard
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Welcome back, {user?.name}! Manage your job postings and applicants.
          </Typography>
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={4} key={stat.label}>
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

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Quick Actions
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Button
                    component={RouterLink}
                    to={ROUTES.RECRUITER_POST_JOB}
                    variant="contained"
                    fullWidth
                    startIcon={<AddIcon />}
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    Post a New Job
                  </Button>
                  <Button
                    component={RouterLink}
                    to={ROUTES.RECRUITER_JOBS}
                    variant="outlined"
                    fullWidth
                    startIcon={<WorkIcon />}
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    Manage Posted Jobs
                  </Button>
                  <Button
                    component={RouterLink}
                    to={ROUTES.RECRUITER_APPLICANTS}
                    variant="outlined"
                    fullWidth
                    startIcon={<PeopleIcon />}
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    View Applicants
                  </Button>
                  <Button
                    component={RouterLink}
                    to={ROUTES.RECRUITER_PROFILE}
                    variant="outlined"
                    fullWidth
                    startIcon={<BusinessIcon />}
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    Company Profile
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Subscription Status
                </Typography>
                <Chip label="FREE PLAN" color="primary" sx={{ mb: 2 }} />
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                  Upgrade to post unlimited jobs and access premium candidate search features.
                </Typography>
                <Button component={RouterLink} to={ROUTES.PRICING} variant="contained" fullWidth>
                  View Pricing Plans
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Recent Applicants
            </Typography>
            <List>
              <ListItem sx={{ px: 0 }}>
                <ListItemText
                  primary="No applicants yet"
                  secondary="Post a job to start receiving applications"
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Container>
    </Layout>
  );
};
