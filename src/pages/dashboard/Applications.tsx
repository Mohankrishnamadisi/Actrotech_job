import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  Button,
} from '@mui/material';
import { Layout } from '@components/layout/Layout';
import { useAuthStore } from '@store/index';
import { applicationService } from '@services/api';
import { formatDate } from '@utils/index';
import { ROUTES } from '@constants/index';
import { Link as RouterLink } from 'react-router-dom';

type UserApplication = {
  id: string;
  status: string;
  applied_at?: string;
  jobs?: {
    title?: string;
    company_name?: string;
    location?: string;
  };
};

export const ApplicationsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [applications, setApplications] = useState<UserApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadApplications = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const data = await applicationService.getUserApplications(user.id);
        setApplications(data || []);
      } catch (err) {
        console.error('Failed to load user applications:', err);
      } finally {
        setLoading(false);
      }
    };
    loadApplications();
  }, [user?.id]);

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              My Applications
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Track the status of your most recent applications.
            </Typography>
          </Box>
          <Button component={RouterLink} to={ROUTES.JOBS} variant="outlined">
            Browse More Jobs
          </Button>
        </Box>

        <Card>
          <CardContent>
            <List>
              {loading ? (
                <ListItem>
                  <ListItemText primary="Loading applications..." />
                </ListItem>
              ) : applications.length === 0 ? (
                <ListItem>
                  <ListItemText
                    primary="No applications found"
                    secondary="Apply to a job to see your application history here."
                  />
                </ListItem>
              ) : (
                applications.map((application) => (
                  <React.Fragment key={application.id}>
                    <ListItem alignItems="flex-start">
                      <ListItemText
                        primary={application.jobs?.title || 'Job title unavailable'}
                        secondary={
                          <>
                            <Typography component="span" variant="body2" sx={{ color: 'text.secondary' }}>
                              {application.jobs?.company_name || 'Company unavailable'}
                            </Typography>
                            {application.jobs?.location ? ` • ${application.jobs.location}` : ''}
                          </>
                        }
                      />
                      <Box sx={{ textAlign: 'right' }}>
                        <Chip
                          label={(application.status || 'applied').replace('_', ' ').toUpperCase()}
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
                          size="small"
                          sx={{ mb: 1 }}
                        />
                        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                          {application.applied_at ? formatDate(application.applied_at) : 'Applied date unavailable'}
                        </Typography>
                      </Box>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))
              )}
            </List>
          </CardContent>
        </Card>
      </Container>
    </Layout>
  );
};
