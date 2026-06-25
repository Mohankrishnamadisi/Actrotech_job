import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  Star as StarIcon,
  AccessTime as AccessTimeIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@components/layout/Layout';
import { useAuthStore } from '@store/index';
import { userService, jobService } from '@services/api';
import { calculateMatchScore } from '@utils/matchScore';
import { ROUTES } from '@constants/index';

const getJobList = (response: any): any[] => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

export const PriorityApply: React.FC = () => {
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
          // Priority apply focuses on high-match jobs with urgent hiring
          const priorityJobs = getJobList(recommendedJobs)
            .map((job: any) => ({
              ...job,
              matchScore: calculateMatchScore(
                { ...job, skills: job.skills || [], min_experience_months: job.min_experience_months ?? job.min_experience_months },
                { skills, total_experience_months: profile?.total_experience_months, preferred_job_titles: profile?.preferred_job_titles }
              ).score,
            }))
            .filter((job: any) => job.matchScore >= 80)
            .sort((a: any, b: any) => b.matchScore - a.matchScore)
            .slice(0, 20);

          setJobs(priorityJobs);
        }
      } catch (error) {
        console.error('Error fetching priority jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <StarIcon sx={{ fontSize: 32, color: '#FFD700' }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                Priority Apply
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                Apply to the best-matched jobs with priority processing
              </Typography>
            </Box>
          </Box>

          {jobs.length === 0 && (
            <Alert severity="info">
              No high-match jobs found. Build your skills profile to unlock priority opportunities.
            </Alert>
          )}
        </Box>

        {jobs.length > 0 && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Found {jobs.length} priority opportunities matching your profile. Applying through this feature gets you
            featured to recruiters!
          </Alert>
        )}

        <Grid container spacing={3}>
          {jobs.map((job, index) => (
            <Grid item xs={12} key={job.id}>
              <Paper
                sx={{
                  p: 3,
                  background: 'linear-gradient(135deg, rgba(255,215,0,0.08) 0%, rgba(220,184,105,0.08) 100%)',
                  border: '2px solid rgba(255,215,0,0.4)',
                  borderRadius: 3,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 12px 32px rgba(255,215,0,0.2)',
                    transform: 'translateY(-4px)',
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: 4,
                    height: '100%',
                    background: 'linear-gradient(180deg, #FFD700 0%, #DAA520 100%)',
                  },
                }}
              >
                {/* Priority Badge */}
                <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                  <Chip
                    icon={<TrendingUpIcon />}
                    label={`#${index + 1} Priority`}
                    color="warning"
                    sx={{ fontWeight: 700 }}
                  />
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <Box sx={{ pl: 2 }}>
                      <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                        {job.title}
                      </Typography>
                      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
                        {job.company_name}
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <AccessTimeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                          <Typography variant="body2">{job.location}</Typography>
                        </Box>
                        <Chip label={job.work_mode || job.workMode} size="small" variant="outlined" />
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                          Matching Skills:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {(job.skills || []).slice(0, 6).map((skill: string) => (
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
                          {(job.skills || []).length > 6 && (
                            <Chip label={`+${(job.skills || []).length - 6} more`} size="small" variant="outlined" />
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            Skill Match
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: 'success.main' }}>
                            {job.matchScore}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={job.matchScore}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: 'rgba(76,175,80,0.2)',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                              background: 'linear-gradient(90deg, #4CAF50 0%, #45a049 100%)',
                            },
                          }}
                        />
                      </Box>

                      <Divider />

                      <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                        <Button
                          variant="outlined"
                          size="small"
                          fullWidth
                          onClick={() => navigate(`${ROUTES.JOB_DETAILS}/${job.id}`)}
                        >
                          View Details
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          fullWidth
                          sx={{
                            background: 'linear-gradient(135deg, #FFD700 0%, #DAA520 100%)',
                            color: '#000',
                            fontWeight: 700,
                          }}
                          onClick={() => navigate(`${ROUTES.JOB_DETAILS}/${job.id}`)}
                        >
                          Apply Now
                        </Button>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {jobs.length > 0 && (
          <Alert severity="info" sx={{ mt: 4 }}>
            💡 Tip: Applications through Priority Apply are fast-tracked to recruiters. Increase your chances by
            completing your profile!
          </Alert>
        )}
      </Container>
    </Layout>
  );
};

export default PriorityApply;
