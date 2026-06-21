import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, Card, CardContent, List, ListItem, ListItemText, Chip, Button, Divider } from '@mui/material';
import { Layout } from '@components/layout/Layout';
import { useAuthStore } from '@store/index';
import { savedService } from '@services/api';
import { ROUTES } from '@constants/index';
import { Link as RouterLink } from 'react-router-dom';

type SavedJobItem = {
  id: string;
  created_at?: string;
  jobs?: {
    id?: string;
    title?: string;
    company_name?: string;
    location?: string;
  };
};

export const SavedJobsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [savedJobs, setSavedJobs] = useState<SavedJobItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSavedJobs = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const data = await savedService.getUserSavedJobs(user.id);
        setSavedJobs(data || []);
      } catch (err) {
        console.error('Failed to load saved jobs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSavedJobs();
  }, [user?.id]);

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              Saved Jobs
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Your bookmarked roles are saved here so you can apply later.
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
                  <ListItemText primary="Loading saved jobs..." />
                </ListItem>
              ) : savedJobs.length === 0 ? (
                <ListItem>
                  <ListItemText
                    primary="No saved jobs yet"
                    secondary="Mark a job as saved to keep it handy for later."
                  />
                </ListItem>
              ) : (
                savedJobs.map((item) => (
                  <React.Fragment key={item.id}>
                    <ListItem alignItems="flex-start" sx={{ py: 2 }}>
                      <ListItemText
                        primary={item.jobs?.title || 'Role unavailable'}
                        secondary={
                          <>
                            <Typography component="span" variant="body2" sx={{ color: 'text.secondary' }}>
                              {item.jobs?.company_name || 'Company unavailable'}
                            </Typography>
                            {item.jobs?.location ? ` • ${item.jobs.location}` : ''}
                          </>
                        }
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexDirection: 'column' }}>
                        <Chip label="Saved" size="small" color="primary" />
                        {item.jobs?.id ? (
                          <Button component={RouterLink} to={ROUTES.JOB_DETAILS.replace(':id', item.jobs.id)} size="small">
                            View Job
                          </Button>
                        ) : null}
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
