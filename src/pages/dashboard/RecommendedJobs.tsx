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
  CircularProgress,
  Paper,
  Divider,
  Alert,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout } from '@components/layout/Layout';
import { useAuthStore } from '@store/index';
import { userService, jobService } from '@services/api';
import { ROUTES } from '@constants/index';

export const RecommendedJobs: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSkills, setUserSkills] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const profile = await userService.getProfile(user.id);
        const skills = profile?.skills || [];
        setUserSkills(skills);

        if (skills.length > 0) {
          const recommendedJobs = await jobService.getJobsBySkills(skills, 1, 50);
          setJobs(recommendedJobs || []);
        }
      } catch (error) {
        console.error('Error fetching recommended jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  // optional minMatch query param to filter results (50-100 by default if provided)
  const location = useLocation();
  const search = new URLSearchParams(location.search);
  const minMatch = Math.max(0, parseInt(search.get('minMatch') || '0', 10) || 0);

  const calculateMatchPercentage = (jobSkills: string[]) => {
    if (!jobSkills || jobSkills.length === 0) return 0;
    const matches = jobSkills.filter((skill) =>
      userSkills.some((userSkill) =>
        String(userSkill).toLowerCase() === String(skill).toLowerCase()
      )
    ).length;
    return Math.round((matches / jobSkills.length) * 100);
  };

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
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            Recommended Jobs for You
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            {jobs.length} jobs match your skills
          </Typography>
        </Box>

        {jobs.length === 0 ? (
          <Alert severity="info">
            No recommended jobs found. Try adding more skills to your profile.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {jobs
              .map((job) => ({ job, matchPercentage: calculateMatchPercentage(job.skills || []) }))
              .filter(({ matchPercentage }) => matchPercentage >= minMatch && matchPercentage <= 100)
              .map(({ job, matchPercentage }) => (
                <Grid item xs={12} md={6} key={job.id}>
                  <Paper
                    sx={{
                      p: 3,
                      background: 'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(220,184,105,0.1) 100%)',
                      border: '1px solid rgba(255,215,0,0.3)',
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 8px 24px rgba(255,215,0,0.15)',
                        transform: 'translateY(-4px)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {job.title}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {job.company_name}
                        </Typography>
                      </Box>
                      <Chip
                        label={`${matchPercentage}% Match`}
                        color={matchPercentage >= 70 ? 'success' : matchPercentage >= 50 ? 'warning' : 'default'}
                        sx={{ fontWeight: 700 }}
                      />
                    </Box>

                    <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                      {job.location} • {job.work_mode || job.workMode}
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                        Required Skills:
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {(job.skills || []).map((skill: string) => (
                          <Chip
                            key={skill}
                            label={skill}
                            size="small"
                            variant={
                              userSkills.some((s) => String(s).toLowerCase() === String(skill).toLowerCase())
                                ? 'filled'
                                : 'outlined'
                            }
                            color={
                              userSkills.some((s) => String(s).toLowerCase() === String(skill).toLowerCase())
                                ? 'success'
                                : 'default'
                            }
                          />
                        ))}
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => navigate(`${ROUTES.JOB_DETAILS}/${job.id}`)}
                      sx={{
                        background: 'linear-gradient(135deg, #FFD700 0%, #DAA520 100%)',
                        color: '#000',
                        fontWeight: 700,
                      }}
                    >
                      View Job Details
                    </Button>
                  </Paper>
                </Grid>
              ))}
          </Grid>
        )}
      </Container>
    </Layout>
  );
};

export default RecommendedJobs;
