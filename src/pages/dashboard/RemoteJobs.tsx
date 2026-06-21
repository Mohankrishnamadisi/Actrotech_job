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
import { useNavigate } from 'react-router-dom';
import { Layout } from '@components/layout/Layout';
import { useAuthStore } from '@store/index';
import { userService, jobService } from '@services/api';
import { ROUTES } from '@constants/index';

export const RemoteJobs: React.FC = () => {
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

        // Get all remote jobs and filter by user skills
        const allJobs = await jobService.getJobs({ work_mode: 'Remote' }, 1, 50);
        const remoteJobsWithSkills = (allJobs || []).filter((job: any) =>
          (job.skills || []).some((jobSkill: string) =>
            skills.some((userSkill) =>
              String(userSkill).toLowerCase() === String(jobSkill).toLowerCase()
            )
          )
        );
        setJobs(remoteJobsWithSkills);
      } catch (error) {
        console.error('Error fetching remote jobs:', error);
        // Fallback: try getJobsBySkills
        if (userSkills.length > 0) {
          const recommendedJobs = await jobService.getJobsBySkills(userSkills, 1, 50);
          const remote = (recommendedJobs || []).filter(
            (job: any) => job.work_mode === 'Remote' || job.workMode === 'Remote'
          );
          setJobs(remote);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

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
            Remote Jobs Matching Your Skills
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            {jobs.length} remote jobs match your skills and preferences
          </Typography>
        </Box>

        {jobs.length === 0 ? (
          <Alert severity="info">
            No remote jobs found for your skills yet. Check back soon!
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {jobs.map((job) => {
              const matchPercentage = calculateMatchPercentage(job.skills || []);
              return (
                <Grid item xs={12} md={6} key={job.id}>
                  <Paper
                    sx={{
                      p: 3,
                      background: 'linear-gradient(135deg, rgba(76,175,80,0.1) 0%, rgba(139,195,74,0.1) 100%)',
                      border: '1px solid rgba(76,175,80,0.3)',
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 8px 24px rgba(76,175,80,0.15)',
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
                      <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column', alignItems: 'flex-end' }}>
                        <Chip
                          label="🌍 Remote"
                          sx={{ fontWeight: 700, background: 'rgba(76,175,80,0.2)' }}
                        />
                        <Chip
                          label={`${matchPercentage}% Match`}
                          color={matchPercentage >= 70 ? 'success' : matchPercentage >= 50 ? 'warning' : 'default'}
                          sx={{ fontWeight: 700 }}
                        />
                      </Box>
                    </Box>

                    <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                      {job.location}
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                        Required Skills:
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {(job.skills || []).slice(0, 5).map((skill: string) => (
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
                        {(job.skills || []).length > 5 && (
                          <Typography variant="caption" sx={{ alignSelf: 'center' }}>
                            +{(job.skills || []).length - 5} more
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => navigate(`${ROUTES.JOB_DETAILS}/${job.id}`)}
                      sx={{
                        background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                        fontWeight: 700,
                      }}
                    >
                      View Job Details
                    </Button>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Container>
    </Layout>
  );
};

export default RemoteJobs;
